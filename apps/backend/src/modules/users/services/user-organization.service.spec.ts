import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { UserOrganizationService } from './user-organization.service';
import { UserEntity, OrganizationEntity } from '../entities';
import { Role, Plan } from '../enums';
import { EmailService } from '../../../infrastructure/email';
import { UserSanitizeHelper } from '../helpers';
import { UserAuthService } from './user-auth.service';

describe('UserOrganizationService', () => {
  let service: UserOrganizationService;

  const manager = { findOne: jest.fn(), save: jest.fn(), create: jest.fn((_e, x) => x) };
  const queryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager,
  };
  const dataSource = { createQueryRunner: jest.fn(() => queryRunner) };
  const emailService = { sendWelcomeEmail: jest.fn() };
  const sanitizeHelper = {
    sanitizeEmail: jest.fn((e: string) => e.toLowerCase().trim()),
    sanitizeName: jest.fn((n: string) => n.trim()),
  };
  const authService = { hashPassword: jest.fn().mockResolvedValue('hashed') };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        UserOrganizationService,
        { provide: getRepositoryToken(UserEntity), useValue: {} },
        { provide: getRepositoryToken(OrganizationEntity), useValue: {} },
        { provide: DataSource, useValue: dataSource },
        { provide: EmailService, useValue: emailService },
        { provide: UserSanitizeHelper, useValue: sanitizeHelper },
        { provide: UserAuthService, useValue: authService },
      ],
    }).compile();
    service = moduleRef.get(UserOrganizationService);
  });

  describe('promoteToOrgOwner', () => {
    it('promueve un PUBLIC_USER sin organización a ORG_OWNER', async () => {
      const user = { id: 'u1', email: 'a@b.com', role: Role.PUBLIC_USER, organizationId: null };
      manager.findOne
        .mockResolvedValueOnce(user) // usuario
        .mockResolvedValueOnce({ id: 'org-1' }); // organización
      manager.save.mockImplementation((u) => Promise.resolve(u));

      const result = await service.promoteToOrgOwner('u1', 'org-1');

      expect(result.role).toBe(Role.ORG_OWNER);
      expect(result.organizationId).toBe('org-1');
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('NotFound si el usuario no existe (y hace rollback)', async () => {
      manager.findOne.mockResolvedValueOnce(null);
      await expect(service.promoteToOrgOwner('u1', 'org-1')).rejects.toThrow(NotFoundException);
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('BadRequest si el rol no es PUBLIC_USER', async () => {
      manager.findOne.mockResolvedValueOnce({ id: 'u1', role: Role.ORG_OWNER });
      await expect(service.promoteToOrgOwner('u1', 'org-1')).rejects.toThrow(BadRequestException);
    });

    it('BadRequest si el usuario ya tiene organización', async () => {
      manager.findOne.mockResolvedValueOnce({ id: 'u1', role: Role.PUBLIC_USER, organizationId: 'x' });
      await expect(service.promoteToOrgOwner('u1', 'org-1')).rejects.toThrow(BadRequestException);
    });

    it('NotFound si la organización no existe', async () => {
      manager.findOne
        .mockResolvedValueOnce({ id: 'u1', role: Role.PUBLIC_USER, organizationId: null })
        .mockResolvedValueOnce(null);
      await expect(service.promoteToOrgOwner('u1', 'org-1')).rejects.toThrow(NotFoundException);
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('createUserWithGoogle', () => {
    const data = { google_id: 'g1', email: 'New@Mail.com', firstName: 'Ana', lastName: 'Pi' };

    it('crea el usuario y manda bienvenida', async () => {
      manager.findOne.mockResolvedValueOnce(null); // no existe
      manager.save.mockImplementation((u) => Promise.resolve({ ...u, id: 'u1' }));

      const result = await service.createUserWithGoogle(data);

      expect(authService.hashPassword).toHaveBeenCalled();
      expect(result.email).toBe('new@mail.com');
      expect(result.role).toBe(Role.PUBLIC_USER);
      expect(result.userPlan).toBe(Plan.FREE);
      expect(emailService.sendWelcomeEmail).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('Conflict si el email ya existe', async () => {
      manager.findOne.mockResolvedValueOnce({ id: 'existe' });
      await expect(service.createUserWithGoogle(data)).rejects.toThrow(ConflictException);
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('no revienta si el correo de bienvenida falla', async () => {
      manager.findOne.mockResolvedValueOnce(null);
      manager.save.mockImplementation((u) => Promise.resolve({ ...u, id: 'u1' }));
      emailService.sendWelcomeEmail.mockRejectedValue(new Error('SMTP down'));

      await expect(service.createUserWithGoogle(data)).resolves.toMatchObject({ id: 'u1' });
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });
  });
});