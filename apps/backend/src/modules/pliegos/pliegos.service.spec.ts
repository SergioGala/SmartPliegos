import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { PliegosService } from './pliegos.service';
import { PliegoDocument, PliegoStatus } from './entities/pliego-document.entity';
import { Licitacion } from '../scraping/shared/entities/licitacion.entity';
import { STORAGE_PROVIDER } from '../../infrastructure/storage';

jest.mock('pdf-parse', () =>
  jest.fn().mockResolvedValue({ text: 'solvencia técnica exigida apartado 7' }),
);

const PDF_BYTES = Buffer.concat([Buffer.from('%PDF-'), Buffer.alloc(100)]);

function mockFetchOk() {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    headers: new Map([['content-type', 'application/pdf']]),
    arrayBuffer: () =>
      Promise.resolve(PDF_BYTES.buffer.slice(0, PDF_BYTES.byteLength)),
  });
}

describe('PliegosService', () => {
  let service: PliegosService;

  const pliegosRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn((x) => Promise.resolve(x)),
    create: jest.fn((x: Partial<PliegoDocument>) => x),
    createQueryBuilder: jest.fn(),
  };
  const licitacionesRepo = { findOne: jest.fn() };
  const storage = { save: jest.fn(), getStream: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        PliegosService,
        { provide: getRepositoryToken(PliegoDocument), useValue: pliegosRepo },
        { provide: getRepositoryToken(Licitacion), useValue: licitacionesRepo },
        { provide: STORAGE_PROVIDER, useValue: storage },
      ],
    }).compile();
    service = moduleRef.get(PliegosService);
  });

  describe('sync', () => {
    it('lanza NotFound si la licitación no existe', async () => {
      licitacionesRepo.findOne.mockResolvedValue(null);
      await expect(service.sync('lic-x')).rejects.toThrow(NotFoundException);
    });

    it('devuelve 0 procesados si la licitación no tiene documentos', async () => {
      licitacionesRepo.findOne.mockResolvedValue({ id: 'lic-1', documentos: [] });
      const result = await service.sync('lic-1');
      expect(result.processed).toBe(0);
    });

    it('descarga, guarda y extrae texto de un documento nuevo', async () => {
      mockFetchOk();
      licitacionesRepo.findOne.mockResolvedValue({
        id: 'lic-1',
        documentos: [
          { tipo: 'PLIEGO_TECNICO', url: 'https://place.example/p.pdf' },
        ],
      });
      pliegosRepo.find
        .mockResolvedValueOnce([]) // existentes
        .mockResolvedValueOnce([]); // listado final
      storage.save.mockResolvedValue({ key: 'pliegos/lic-1/p.pdf', sizeBytes: 105 });

      const result = await service.sync('lic-1');

      expect(result.ready).toBe(1);
      expect(storage.save).toHaveBeenCalledWith(
        expect.objectContaining({
          scope: 'pliegos/lic-1',
          mimeType: 'application/pdf',
        }),
      );
      expect(pliegosRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: PliegoStatus.READY,
          extractedText: expect.stringContaining('solvencia') as string,
        }),
      );
    });

    it('no reprocesa documentos READY (idempotencia)', async () => {
      licitacionesRepo.findOne.mockResolvedValue({
        id: 'lic-1',
        documentos: [{ tipo: 'OTRO', url: 'https://place.example/p.pdf' }],
      });
      pliegosRepo.find
        .mockResolvedValueOnce([
          { sourceUrl: 'https://place.example/p.pdf', status: PliegoStatus.READY },
        ])
        .mockResolvedValueOnce([]);

      const result = await service.sync('lic-1');

      expect(result.processed).toBe(0);
      expect(storage.save).not.toHaveBeenCalled();
    });

    it('marca ERROR y continúa si la descarga falla', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValue({ ok: false, status: 404 });
      licitacionesRepo.findOne.mockResolvedValue({
        id: 'lic-1',
        documentos: [{ tipo: 'OTRO', url: 'https://place.example/roto.pdf' }],
      });
      pliegosRepo.find.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

      const result = await service.sync('lic-1');

      expect(result.errors).toBe(1);
      expect(pliegosRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: PliegoStatus.ERROR }),
      );
    });
  });

  describe('search', () => {
    function mockQB(doc: unknown) {
      return {
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(doc),
      };
    }

    it('lanza BadRequest si no hay texto extraído', async () => {
      pliegosRepo.createQueryBuilder.mockReturnValue(
        mockQB({ status: PliegoStatus.READY, extractedText: null }),
      );
      await expect(service.search('p-1', 'solvencia')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('lanza NotFound si el pliego no existe', async () => {
      pliegosRepo.createQueryBuilder.mockReturnValue(mockQB(null));
      await expect(service.search('p-1', 'solvencia')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('devuelve snippets con contexto y match exacto', async () => {
      pliegosRepo.createQueryBuilder.mockReturnValue(
        mockQB({
          status: PliegoStatus.READY,
          extractedText:
            'El criterio de Solvencia técnica se detalla en el apartado 7.',
        }),
      );

      const result = await service.search('p-1', 'solvencia');

      expect(result).toHaveLength(1);
      expect(result[0].match).toBe('Solvencia'); // conserva mayúsculas del original
      expect(result[0].after).toContain('técnica');
    });
  });

  describe('getFile', () => {
    it('lanza NotFound si el pliego no está READY', async () => {
      pliegosRepo.findOne.mockResolvedValue({
        status: PliegoStatus.PENDING,
        storageKey: null,
      });
      await expect(service.getFile('p-1')).rejects.toThrow(NotFoundException);
    });

    it('devuelve stream + metadatos si está READY', async () => {
      pliegosRepo.findOne.mockResolvedValue({
        status: PliegoStatus.READY,
        storageKey: 'pliegos/lic-1/p.pdf',
        mimeType: 'application/pdf',
        nombre: 'pliego.pdf',
      });
      storage.getStream.mockResolvedValue('STREAM');

      const result = await service.getFile('p-1');

      expect(result.stream).toBe('STREAM');
      expect(result.mimeType).toBe('application/pdf');
    });
  });
});
