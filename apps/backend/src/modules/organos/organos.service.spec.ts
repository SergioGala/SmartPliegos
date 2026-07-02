import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

import { OrganosService } from './organos.service';
import { OrganoContratacion } from '../scraping/shared/entities/organo-contratacion.entity';

function makeQB(terminal: { getRawMany?: unknown[] } = {}) {
  const qb: Record<string, jest.Mock> = {};
  const chain = [
    'select', 'addSelect', 'from', 'where', 'andWhere',
    'orderBy', 'addOrderBy', 'groupBy', 'limit', 'setParameter',
  ];
  for (const m of chain) qb[m] = jest.fn().mockReturnValue(qb);
  qb.getRawMany = jest.fn().mockResolvedValue(terminal.getRawMany ?? []);
  return qb;
}

describe('OrganosService', () => {
  let service: OrganosService;

  const managerQB = jest.fn();
  const orgRepo = {
    createQueryBuilder: jest.fn(),
    findOne: jest.fn(),
    manager: { createQueryBuilder: managerQB },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        OrganosService,
        { provide: getRepositoryToken(OrganoContratacion), useValue: orgRepo },
      ],
    }).compile();
    service = moduleRef.get(OrganosService);
  });

  describe('search', () => {
    it('devuelve candidatos con su total de licitaciones', async () => {
      orgRepo.createQueryBuilder.mockReturnValue(
        makeQB({
          getRawMany: [
            { id: 'o1', nombre: 'Ayuntamiento X', tipo: 'Local', ccaa: 'Madrid', provincia: 'Madrid' },
            { id: 'o2', nombre: 'Ayuntamiento Y', tipo: 'Local', ccaa: 'Madrid', provincia: 'Madrid' },
          ],
        }),
      );
      managerQB.mockReturnValue(
        makeQB({ getRawMany: [{ organoId: 'o1', count: '5' }] }),
      );

      const result = await service.search({ q: 'ayunt', limit: 30 });

      expect(result[0].totalLicitaciones).toBe(5);
      expect(result[1].totalLicitaciones).toBe(0); // sin count -> 0
    });

    it('devuelve [] y no cuenta si no hay candidatos', async () => {
      orgRepo.createQueryBuilder.mockReturnValue(makeQB({ getRawMany: [] }));

      const result = await service.search({
          limit: 0
      });

      expect(result).toEqual([]);
      expect(managerQB).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('devuelve el órgano si existe', async () => {
      orgRepo.findOne.mockResolvedValue({ id: 'o1', nombre: 'X' });
      expect(await service.findById('o1')).toEqual({ id: 'o1', nombre: 'X' });
    });

    it('lanza NotFound si no existe', async () => {
      orgRepo.findOne.mockResolvedValue(null);
      await expect(service.findById('nope')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByIds', () => {
    it('devuelve [] con lista vacía sin tocar la BD', async () => {
      const result = await service.findByIds([]);
      expect(result).toEqual([]);
      expect(orgRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('mapea órganos con su total (0 si no hay count)', async () => {
      orgRepo.createQueryBuilder.mockReturnValue(
        makeQB({
          getRawMany: [
            { id: 'o1', nombre: 'X', tipo: null, ccaa: null, provincia: null },
          ],
        }),
      );
      managerQB.mockReturnValue(makeQB({ getRawMany: [] }));

      const result = await service.findByIds(['o1']);

      expect(result).toEqual([
        { id: 'o1', nombre: 'X', tipo: null, ccaa: null, provincia: null, totalLicitaciones: 0 },
      ]);
    });
  });
});