import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RecordatoriosService } from './recordatorios.service';
import { RecordatorioEntity } from './recordatorio.entity';
import { Licitacion } from '../scraping/shared/entities/licitacion.entity';
import { FavoritosService } from '../favoritos/favoritos.service';
import { EmailService } from '../../infrastructure/email/email.service';

describe('RecordatoriosService', () => {
  let service: RecordatoriosService;
  let repo: { find: jest.Mock; findOne: jest.Mock; create: jest.Mock; save: jest.Mock; delete: jest.Mock };
  let licRepo: { findOne: jest.Mock };
  let favoritos: { findAllByUser: jest.Mock };
  let email: { sendEmail: jest.Mock };

  beforeEach(async () => {
    repo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((d: Partial<RecordatorioEntity>) => d),
      save: jest.fn().mockImplementation((d: Partial<RecordatorioEntity>) => Promise.resolve({ id: 'r1', ...d })),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    licRepo = { findOne: jest.fn() };
    favoritos = { findAllByUser: jest.fn().mockResolvedValue([]) };
    email = { sendEmail: jest.fn().mockResolvedValue(undefined) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        RecordatoriosService,
        { provide: getRepositoryToken(RecordatorioEntity), useValue: repo },
        { provide: getRepositoryToken(Licitacion), useValue: licRepo },
        { provide: FavoritosService, useValue: favoritos },
        { provide: EmailService, useValue: email },
      ],
    }).compile();

    service = moduleRef.get(RecordatoriosService);
  });

  it('upsert rechaza si la licitación no existe', async () => {
    licRepo.findOne.mockResolvedValue(null);
    await expect(service.upsert('u1', { licitacionId: 'l1', daysBefore: 3 }))
      .rejects.toBeInstanceOf(NotFoundException);
  });

  it('upsert rechaza si no hay fecha de presentación', async () => {
    licRepo.findOne.mockResolvedValue({ id: 'l1', fechaPresentacion: null });
    await expect(service.upsert('u1', { licitacionId: 'l1', daysBefore: 3 }))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it('upsert calcula remindAt = plazo - daysBefore', async () => {
    licRepo.findOne.mockResolvedValue({ id: 'l1', fechaPresentacion: new Date('2026-07-10T12:00:00Z') });
    const rec = await service.upsert('u1', { licitacionId: 'l1', daysBefore: 3 });
    expect(new Date(rec.remindAt).toISOString()).toBe('2026-07-07T12:00:00.000Z');
    expect(rec.status).toBe('PENDING');
  });

  it('sendDue envía email y marca SENT', async () => {
    repo.find.mockResolvedValue([
      { id: 'r1', daysBefore: 3, user: { email: 'a@b.com' }, licitacion: { id: 'l1', title: 'Obra X', fechaPresentacion: new Date() } },
    ]);
    const sent = await service.sendDue(new Date());
    expect(email.sendEmail).toHaveBeenCalledTimes(1);
    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'SENT' }));
    expect(sent).toBe(1);
  });

  it('getCalendario solo incluye favoritos con plazo', async () => {
    favoritos.findAllByUser.mockResolvedValue([
      { licitacionId: 'l1', licitacion: { title: 'Obra X', fechaPresentacion: new Date('2026-07-10T00:00:00Z') } },
      { licitacionId: 'l2', licitacion: { title: 'Sin plazo', fechaPresentacion: null } },
    ]);
    repo.find.mockResolvedValue([{ id: 'r1', licitacionId: 'l1', daysBefore: 5, status: 'PENDING' }]);
    const events = await service.getCalendario('u1');
    expect(events).toHaveLength(1);
    expect(events[0].recordatorio?.daysBefore).toBe(5);
  });
});