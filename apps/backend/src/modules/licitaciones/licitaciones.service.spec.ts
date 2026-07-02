import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException } from '@nestjs/common';

import { LicitacionesService } from './licitaciones.service';
import { Licitacion } from '../scraping/shared/entities/licitacion.entity';
import { OrganoContratacion } from '../scraping/shared/entities/organo-contratacion.entity';
import { LicitacionFormatterService } from './services/licitacion-formatter.service';
import { SemanticSearchService } from '../semantic/semantic-search.service';

function makeQB(rows: unknown[], reject = false) {
  const qb: Record<string, jest.Mock> = {};
  const chain = [
    'select', 'addSelect', 'where', 'andWhere', 'leftJoin',
    'groupBy', 'addGroupBy', 'orderBy', 'addOrderBy', 'limit',
  ];
  for (const m of chain) qb[m] = jest.fn().mockReturnValue(qb);
  qb.getRawMany = reject
    ? jest.fn().mockRejectedValue(new Error('db down'))
    : jest.fn().mockResolvedValue(rows);
  return qb;
}

describe('LicitacionesService', () => {
  let service: LicitacionesService;

  const licRepo = { findOne: jest.fn(), createQueryBuilder: jest.fn() };
  const orgRepo = { createQueryBuilder: jest.fn() };
  const formatter = { formatDetail: jest.fn() };
  const semanticSearch = { search: jest.fn() };
  const cacheManager = {
    get: jest.fn(async () => null as unknown),
    set: jest.fn(async () => undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    cacheManager.get.mockImplementation(async () => null);
    cacheManager.set.mockImplementation(async () => undefined);

    const moduleRef = await Test.createTestingModule({
      providers: [
        LicitacionesService,
        { provide: getRepositoryToken(Licitacion), useValue: licRepo },
        { provide: getRepositoryToken(OrganoContratacion), useValue: orgRepo },
        { provide: LicitacionFormatterService, useValue: formatter },
        { provide: SemanticSearchService, useValue: semanticSearch },
        { provide: CACHE_MANAGER, useValue: cacheManager },
      ],
    }).compile();
    service = moduleRef.get(LicitacionesService);

    // El token CACHE_MANAGER no siempre inyecta el useValue (config global de
    // caché). Forzamos el campo en la instancia para tener control total.
    (service as unknown as { cacheManager: typeof cacheManager }).cacheManager =
      cacheManager;
  });

  // ── search ───────────────────────────────────────────────────────────
 describe('search', () => {
  const dto = { q: 'obras' } as never;

  it('delega en la búsqueda semántica y devuelve su resultado', async () => {
    const fresh = { items: [{ id: 'l1' }], total: 1 };
    semanticSearch.search.mockResolvedValue(fresh);

    const result = await service.search(dto);

    expect(semanticSearch.search).toHaveBeenCalledWith(dto);
    expect(result).toBe(fresh);
  });
});

  // ── findById ─────────────────────────────────────────────────────────
  describe('findById', () => {
    it('formatea el detalle si existe', async () => {
      const lic = { id: 'l1' };
      licRepo.findOne.mockResolvedValue(lic);
      formatter.formatDetail.mockReturnValue({ id: 'l1', formatted: true });

      const result = await service.findById('l1');

      expect(formatter.formatDetail).toHaveBeenCalledWith(lic);
      expect(result).toEqual({ id: 'l1', formatted: true });
    });

    it('lanza NotFound si no existe', async () => {
      licRepo.findOne.mockResolvedValue(null);
      await expect(service.findById('nope')).rejects.toThrow(NotFoundException);
    });
  });

  // ── getFilterOptions ─────────────────────────────────────────────────
  describe('getFilterOptions', () => {
    it('devuelve la estructura completa (todos vacíos si no hay datos)', async () => {
      licRepo.createQueryBuilder.mockReturnValue(makeQB([]));
      orgRepo.createQueryBuilder.mockReturnValue(makeQB([]));

      const result = await service.getFilterOptions();

      expect(Object.keys(result).sort()).toEqual(
        ['ccaas', 'estados', 'organos', 'procedimientos', 'provincias', 'tipos', 'tramitaciones'].sort(),
      );
      expect(result.estados).toEqual([]);
      expect(result.organos).toEqual([]);
    });

    it('filtra los valores fuera de la whitelist', async () => {
      licRepo.createQueryBuilder
        .mockReturnValueOnce(makeQB([{ value: 'INVALIDO_XYZ', count: '9' }]))
        .mockReturnValue(makeQB([]));
      orgRepo.createQueryBuilder.mockReturnValue(makeQB([]));

      const result = await service.getFilterOptions();

      expect(result.estados.some((e) => e.value === 'INVALIDO_XYZ')).toBe(false);
    });

    it('degrada a arrays vacíos si las queries de campo fallan', async () => {
      licRepo.createQueryBuilder.mockReturnValue(makeQB([], true));
      orgRepo.createQueryBuilder.mockReturnValue(makeQB([]));

      const result = await service.getFilterOptions();

      expect(result.estados).toEqual([]);
      expect(result.tipos).toEqual([]);
    });

    it('parsea el conteo de órganos a número', async () => {
      licRepo.createQueryBuilder.mockReturnValue(makeQB([]));
      orgRepo.createQueryBuilder.mockReturnValue(
        makeQB([
          { id: 'o1', nombre: 'Ayto', ccaa: 'Madrid', provincia: 'Madrid', totalLicitaciones: '7' },
        ]),
      );

      const result = await service.getFilterOptions();

      expect(result.organos[0]).toMatchObject({ id: 'o1', totalLicitaciones: 7 });
    });
  });
});