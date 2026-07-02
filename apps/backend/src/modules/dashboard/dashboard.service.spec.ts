import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { DashboardService } from './dashboard.service';
import { FavoritoEntity } from '../favoritos/entities';
import { AlertEntity } from '../alerts/entities';
import { Licitacion } from '../scraping/shared/entities/licitacion.entity';

/**
 * Helper reutilizable: un QueryBuilder encadenable cuyos métodos de
 * construcción devuelven `this` y cuyos terminales (getCount/getRawMany)
 * resuelven al valor que le pases. Sirve para cualquier servicio con QB.
 */
function makeQB(terminal: { getCount?: number; getRawMany?: unknown[] } = {}) {
  const qb: Record<string, jest.Mock> = {};
  const chain = [
    'innerJoin', 'leftJoin', 'where', 'andWhere', 'orderBy',
    'select', 'addSelect', 'groupBy', 'limit', 'setParameter',
  ];
  for (const m of chain) qb[m] = jest.fn().mockReturnValue(qb);
  qb.getCount = jest.fn().mockResolvedValue(terminal.getCount ?? 0);
  qb.getRawMany = jest.fn().mockResolvedValue(terminal.getRawMany ?? []);
  return qb;
}

describe('DashboardService', () => {
  let service: DashboardService;

  const favRepo = { count: jest.fn(), createQueryBuilder: jest.fn() };
  const licitacionRepo = { createQueryBuilder: jest.fn() };
  const alertRepo = { find: jest.fn() };

  const USER = 'user-1';

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: getRepositoryToken(FavoritoEntity), useValue: favRepo },
        { provide: getRepositoryToken(Licitacion), useValue: licitacionRepo },
        { provide: getRepositoryToken(AlertEntity), useValue: alertRepo },
      ],
    }).compile();
    service = moduleRef.get(DashboardService);
  });

  // ── summary ──────────────────────────────────────────────────────────
  describe('summary', () => {
    it('agrega favoritos, vencimientos a 7 días y nuevas de la semana', async () => {
      favRepo.count.mockResolvedValue(5);
      favRepo.createQueryBuilder.mockReturnValue(makeQB({ getCount: 2 }));
      licitacionRepo.createQueryBuilder.mockReturnValue(makeQB({ getCount: 10 }));

      const result = await service.summary(USER);

      expect(result).toEqual({
        favoritos: 5,
        venciendoEn7Dias: 2,
        recordatoriosPendientes: 0,
        nuevasEstaSemana: 10,
      });
    });
  });

  // ── vencimientos ─────────────────────────────────────────────────────
  describe('vencimientos', () => {
    it('mapea filas y normaliza organo/fecha/presupuesto/días', async () => {
      const rows = [
        {
          licitacionId: 'l1',
          title: 'T1',
          organo: 'Órgano A',
          fechaPresentacion: new Date('2026-07-10T00:00:00.000Z'),
          presupuestoBase: 1000,
          diasRestantes: '9',
        },
        {
          licitacionId: 'l2',
          title: 'T2',
          organo: null,
          fechaPresentacion: '2026-07-11T00:00:00.000Z',
          presupuestoBase: null,
          diasRestantes: 10,
        },
      ];
      favRepo.createQueryBuilder.mockReturnValue(makeQB({ getRawMany: rows }));

      const result = await service.vencimientos(USER, 30);

      expect(result[0]).toEqual({
        licitacionId: 'l1',
        title: 'T1',
        organo: 'Órgano A',
        fechaPresentacion: '2026-07-10T00:00:00.000Z',
        presupuestoBase: '1000', // se serializa a string
        diasRestantes: 9, // se castea a number
      });
      expect(result[1].organo).toBeNull();
      expect(result[1].presupuestoBase).toBeNull();
      expect(result[1].fechaPresentacion).toBe('2026-07-11T00:00:00.000Z');
      expect(result[1].diasRestantes).toBe(10);
    });

    it('devuelve array vacío si no hay vencimientos', async () => {
      favRepo.createQueryBuilder.mockReturnValue(makeQB({ getRawMany: [] }));
      expect(await service.vencimientos(USER, 30)).toEqual([]);
    });
  });

  // ── distribucion ─────────────────────────────────────────────────────
  describe('distribucion', () => {
    it('agrupa por tipo de contrato y por CCAA, con fallback de key', async () => {
      favRepo.createQueryBuilder
        .mockReturnValueOnce(
          makeQB({ getRawMany: [
            { key: 'Obras', count: '3' },
            { key: null, count: 2 }, // key null -> 'Sin dato'
          ] }),
        )
        .mockReturnValueOnce(
          makeQB({ getRawMany: [{ key: 'Madrid', count: '5' }] }),
        );

      const result = await service.distribucion(USER);

      expect(result.porTipoContrato).toEqual([
        { key: 'Obras', count: 3 },
        { key: 'Sin dato', count: 2 },
      ]);
      expect(result.porCcaa).toEqual([{ key: 'Madrid', count: 5 }]);
    });
  });

  // ── series ───────────────────────────────────────────────────────────
  describe('series', () => {
    it('cuenta por semana filtrando por mis CCAA cuando hay alertas', async () => {
      alertRepo.find.mockResolvedValue([
        { ccaas: ['Madrid', 'Galicia'] },
        { ccaas: ['Madrid'] },
        { ccaas: null }, // se ignora
      ]);
      const qb = makeQB({
        getRawMany: [{ semana: '2026-06-01', total: '10', enMisCcaa: '4' }],
      });
      licitacionRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.series(USER);

      // rama con CCAA: setea el parámetro con las CCAA únicas
      expect(qb.setParameter).toHaveBeenCalledWith('misCcaa', ['Madrid', 'Galicia']);
      expect(result).toEqual([{ semana: '2026-06-01', total: 10, enMisCcaa: 4 }]);
    });

    it('usa 0 en enMisCcaa cuando el usuario no tiene CCAA en alertas', async () => {
      alertRepo.find.mockResolvedValue([]); // sin alertas -> misCcaa vacío
      const qb = makeQB({
        getRawMany: [{ semana: '2026-06-01', total: '2', enMisCcaa: '0' }],
      });
      licitacionRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.series(USER);

      // rama else: addSelect('0', 'enMisCcaa') y NO se setea el parámetro misCcaa
      expect(qb.addSelect).toHaveBeenCalledWith('0', 'enMisCcaa');
      expect(qb.setParameter).not.toHaveBeenCalled();
      expect(result).toEqual([{ semana: '2026-06-01', total: 2, enMisCcaa: 0 }]);
    });
  });
});