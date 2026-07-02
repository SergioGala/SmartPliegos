import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';

import { LicitacionResumenService } from './licitacion-resumen.service';
import { Licitacion } from '../../scraping/shared/entities/licitacion.entity';
import { AiService } from '../../ai/ai.service';

describe('LicitacionResumenService', () => {
  let service: LicitacionResumenService;

  const licRepo = { findOne: jest.fn(), save: jest.fn((x) => Promise.resolve(x)) };
  const ai = { complete: jest.fn() };

  const baseLic = () => ({
    id: 'lic-1',
    title: 'Obras',
    description: null,
    organo: null,
    municipio: null,
    provincia: null,
    ccaa: null,
    tipoContrato: null,
    procedimiento: null,
    presupuestoBase: null,
    cpvCodes: null,
    fechaPresentacion: null,
    resumenIA: null as string | null,
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        LicitacionResumenService,
        { provide: getRepositoryToken(Licitacion), useValue: licRepo },
        { provide: AiService, useValue: ai },
      ],
    }).compile();
    service = moduleRef.get(LicitacionResumenService);
  });

  it('lanza NotFound si la licitación no existe', async () => {
    licRepo.findOne.mockResolvedValue(null);
    await expect(service.getOrCreate('nope')).rejects.toThrow(NotFoundException);
  });

  it('devuelve el resumen cacheado sin llamar al LLM', async () => {
    licRepo.findOne.mockResolvedValue({ ...baseLic(), resumenIA: 'ya existe' });

    const result = await service.getOrCreate('lic-1');

    expect(result).toEqual({ resumenIA: 'ya existe', cached: true });
    expect(ai.complete).not.toHaveBeenCalled();
  });

  it('genera, guarda y devuelve el resumen si no hay cache', async () => {
    licRepo.findOne.mockResolvedValue(baseLic());
    ai.complete.mockResolvedValue({ text: '  Resumen generado  ', outputTokens: 120, model: 'test' });

    const result = await service.getOrCreate('lic-1');

    expect(ai.complete).toHaveBeenCalled();
    expect(result).toEqual({ resumenIA: 'Resumen generado', cached: false }); // trim aplicado
    expect(licRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ resumenIA: 'Resumen generado', pliegosProcesados: true }),
    );
  });

  it('con force=true regenera aunque haya cache', async () => {
    licRepo.findOne.mockResolvedValue({ ...baseLic(), resumenIA: 'viejo' });
    ai.complete.mockResolvedValue({ text: 'nuevo', outputTokens: 10, model: 'test' });

    const result = await service.getOrCreate('lic-1', true);

    expect(ai.complete).toHaveBeenCalled();
    expect(result.cached).toBe(false);
    expect(result.resumenIA).toBe('nuevo');
  });

  it('lanza ServiceUnavailable si el LLM falla', async () => {
    licRepo.findOne.mockResolvedValue(baseLic());
    ai.complete.mockRejectedValue(new Error('LLM down'));

    await expect(service.getOrCreate('lic-1')).rejects.toThrow(ServiceUnavailableException);
    expect(licRepo.save).not.toHaveBeenCalled();
  });
});