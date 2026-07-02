import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

import { AlertsService } from './alerts.service';
import { AlertEntity } from './entities';
import { Licitacion } from '../scraping/shared/entities/licitacion.entity';
import { EmailService } from '../../infrastructure/email';
import { SearchEngineService } from '../search/search.engine';

// Evitamos renderizar plantillas reales (solo nos importa el flujo).
jest.mock('../../common/email-templates', () => ({
  generateAlertEmailTemplate: () => '<html>',
  generateAlertDigestEmailTemplate: () => '<html>',
}));

function makeQB(rows: unknown[], total: number) {
  const qb: Record<string, jest.Mock> = {};
  for (const m of ['where', 'andWhere', 'orderBy', 'take']) qb[m] = jest.fn().mockReturnThis();
  qb.getCount = jest.fn().mockResolvedValue(total);
  qb.getMany = jest.fn().mockResolvedValue(rows);
  return qb;
}

describe('AlertsService', () => {
  let service: AlertsService;

  const alertRepo = {
    create: jest.fn((x) => x),
    save: jest.fn((x) => Promise.resolve(x)),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };
  const licRepo = { createQueryBuilder: jest.fn() };
  const emailService = { sendEmail: jest.fn() };
  const searchEngine = { search: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AlertsService,
        { provide: getRepositoryToken(AlertEntity), useValue: alertRepo },
        { provide: getRepositoryToken(Licitacion), useValue: licRepo },
        { provide: EmailService, useValue: emailService },
        { provide: SearchEngineService, useValue: searchEngine },
      ],
    }).compile();
    service = moduleRef.get(AlertsService);
  });

  // ── CRUD ─────────────────────────────────────────────────────────────
  describe('CRUD', () => {
    it('create asigna userId y email null por defecto', async () => {
      await service.create('user-1', { name: 'A' } as never);
      expect(alertRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1', email: null }),
      );
      expect(alertRepo.save).toHaveBeenCalled();
    });

    it('findAll devuelve las alertas del usuario ordenadas', async () => {
      alertRepo.find.mockResolvedValue([{ id: 'a1' }]);
      const result = await service.findAll('user-1');
      expect(alertRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual([{ id: 'a1' }]);
    });

    it('findOne devuelve la alerta si existe', async () => {
      alertRepo.findOne.mockResolvedValue({ id: 'a1' });
      expect(await service.findOne('a1', 'user-1')).toEqual({ id: 'a1' });
    });

    it('findOne lanza NotFound si no existe', async () => {
      alertRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('a1', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('update aplica cambios y guarda', async () => {
      alertRepo.findOne.mockResolvedValue({ id: 'a1', isActive: false });
      const result = await service.update('a1', 'user-1', { isActive: true } as never);
      expect(result).toMatchObject({ isActive: true });
      expect(alertRepo.save).toHaveBeenCalled();
    });

    it('remove elimina la alerta existente', async () => {
      const alert = { id: 'a1' };
      alertRepo.findOne.mockResolvedValue(alert);
      await service.remove('a1', 'user-1');
      expect(alertRepo.remove).toHaveBeenCalledWith(alert);
    });

    it('remove lanza NotFound si no existe', async () => {
      alertRepo.findOne.mockResolvedValue(null);
      await expect(service.remove('a1', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ── findLicitacionesForAlert ─────────────────────────────────────────
  describe('findLicitacionesForAlert', () => {
    it('devuelve licitaciones y total, aplicando filtro de palabras clave', async () => {
      const qb = makeQB([{ id: 'l1' }], 1);
      licRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findLicitacionesForAlert(
        { palabrasClave: 'obras' } as never,
        10,
        30,
      );

      expect(qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('plainto_tsquery'),
        { kw: 'obras' },
      );
      expect(result).toEqual({ licitaciones: [{ id: 'l1' }], total: 1 });
    });
  });

  // ── triggerAlertsForLicitacion ───────────────────────────────────────
  describe('triggerAlertsForLicitacion', () => {
    it('no envía nada si no hay alertas activas', async () => {
      alertRepo.find.mockResolvedValue([]);
      await service.triggerAlertsForLicitacion({ id: 'l1' } as Licitacion);
      expect(emailService.sendEmail).not.toHaveBeenCalled();
    });

    it('envía email y actualiza el contador cuando una alerta sin criterios coincide', async () => {
      const alert = { id: 'a1', triggerCount: 0, email: 'a@b.com', user: { email: 'u@b.com' } };
      alertRepo.find.mockResolvedValue([alert]);

      await service.triggerAlertsForLicitacion({
        id: 'l1', estado: 'PUB', title: 'X', cpvCodes: [],
      } as unknown as Licitacion);

      expect(emailService.sendEmail).toHaveBeenCalled();
      expect(alert.triggerCount).toBe(1);
      expect(alertRepo.save).toHaveBeenCalledWith(alert);
    });
  });

  // ── sendDailyDigestForAllAlerts ──────────────────────────────────────
  describe('sendDailyDigestForAllAlerts', () => {
    it('envía digest cuando hay resultados', async () => {
      const alert = { id: 'a1', name: 'Mi alerta', triggerCount: 0, email: 'a@b.com', user: { email: 'u@b.com' } };
      alertRepo.find.mockResolvedValue([alert]);
      jest
        .spyOn(service, 'findLicitacionesForAlert')
        .mockResolvedValue({ licitaciones: [{ id: 'l1' } as Licitacion], total: 3 });

      await service.sendDailyDigestForAllAlerts();

      expect(emailService.sendEmail).toHaveBeenCalled();
      expect(alertRepo.save).toHaveBeenCalledWith(alert);
    });

    it('salta las alertas sin destino y sin resultados', async () => {
      const sinEmail = { id: 'a1', name: 'X', triggerCount: 0, email: null, user: null };
      const sinResultados = { id: 'a2', name: 'Y', triggerCount: 0, email: 'y@b.com', user: null };
      alertRepo.find.mockResolvedValue([sinEmail, sinResultados]);
      jest
        .spyOn(service, 'findLicitacionesForAlert')
        .mockResolvedValue({ licitaciones: [], total: 0 });

      await service.sendDailyDigestForAllAlerts();

      expect(emailService.sendEmail).not.toHaveBeenCalled();
    });
  });
});