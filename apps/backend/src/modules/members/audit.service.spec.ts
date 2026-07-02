import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { AuditService } from './audit.service';
import { AuditLog, AuditAction } from './entities/audit-log.entity';

describe('AuditService', () => {
  let service: AuditService;

  const auditRepo = {
    create: jest.fn((x) => x),
    save: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: getRepositoryToken(AuditLog), useValue: auditRepo },
      ],
    }).compile();
    service = moduleRef.get(AuditService);
  });

  describe('log', () => {
    it('guarda la entrada normalizando los opcionales', async () => {
      auditRepo.save.mockResolvedValue({});

      await service.log({
        organizationId: 'org-1',
        actorUserId: 'user-1',
        action: AuditAction.MEMBER_JOINED,
      });

      expect(auditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-1',
          targetType: null,
          targetId: null,
          metadata: {},
        }),
      );
      expect(auditRepo.save).toHaveBeenCalled();
    });

    it('es best-effort: si el guardado falla NO relanza', async () => {
      auditRepo.save.mockRejectedValue(new Error('DB down'));

      await expect(
        service.log({
          organizationId: 'org-1',
          actorUserId: null,
          action: AuditAction.MEMBER_REMOVED,
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('list', () => {
    it('devuelve [] si no hay organizationId', async () => {
      expect(await service.list('')).toEqual([]);
      expect(auditRepo.find).not.toHaveBeenCalled();
    });

    it('lista con orden desc y paginación por defecto', async () => {
      auditRepo.find.mockResolvedValue([{ id: 'a1' }]);

      const result = await service.list('org-1');

      expect(auditRepo.find).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
        order: { createdAt: 'DESC' },
        take: 50,
        skip: 0,
      });
      expect(result).toEqual([{ id: 'a1' }]);
    });

    it('capa el take a 100 aunque pidas más', async () => {
      auditRepo.find.mockResolvedValue([]);
      await service.list('org-1', 500, 20);

      expect(auditRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100, skip: 20 }),
      );
    });
  });
});