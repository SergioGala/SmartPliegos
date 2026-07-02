import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException, ConflictException } from '@nestjs/common';

import { UserSignupService } from './user-signup.service';
import { UserEntity } from '../entities';
import { UserSanitizeHelper } from '../helpers';
import { UserAuthService } from './user-auth.service';
import { EmailService } from '../../../infrastructure/email';
import { EmailTemplatesService } from '../../../common/email-templates';

describe('UserSignupService', () => {
  let service: UserSignupService;

  const manager = { findOne: jest.fn(), create: jest.fn((_e, x) => x), save: jest.fn((u) => Promise.resolve({ ...u, id: 'u1' })) };
  const queryRunner = {
    connect: jest.fn(), startTransaction: jest.fn(), commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(), release: jest.fn(), manager,
  };
  const dataSource = { createQueryRunner: jest.fn(() => queryRunner) };
  const usersRepository = { findOne: jest.fn(), save: jest.fn((u) => Promise.resolve(u)) };
  const sanitizeHelper = {
    sanitizeEmail: jest.fn((e: string) => e.toLowerCase().trim()),
    sanitizeName: jest.fn((n: string) => n.trim()),
  };
  const authService = { hashPassword: jest.fn().mockResolvedValue('hashed') };
  const emailService = { sendEmail: jest.fn() };
  const emailTemplatesService = { getSignupVerificationTemplate: jest.fn(() => '<html>') };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        UserSignupService,
        { provide: getRepositoryToken(UserEntity), useValue: usersRepository },
        { provide: DataSource, useValue: dataSource },
        { provide: UserSanitizeHelper, useValue: sanitizeHelper },
        { provide: UserAuthService, useValue: authService },
        { provide: EmailService, useValue: emailService },
        { provide: EmailTemplatesService, useValue: emailTemplatesService },
      ],
    }).compile();
    service = moduleRef.get(UserSignupService);
  });

  describe('createIncompleteUser', () => {
    const data = { email: 'New@Mail.com', firstName: 'Ana', lastName: 'Pi' };

    it('crea usuario inactivo con token de signup', async () => {
      manager.findOne.mockResolvedValueOnce(null);
      const result = await service.createIncompleteUser(data);
      expect(result.id).toBe('u1');
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('Conflict si el email ya existe', async () => {
      manager.findOne.mockResolvedValueOnce({ id: 'existe' });
      await expect(service.createIncompleteUser(data)).rejects.toThrow(ConflictException);
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('completeSignupWithPassword', () => {
    it('BadRequest si las contraseñas no coinciden', async () => {
      await expect(service.completeSignupWithPassword('tok', 'aaaaaaaa', 'bbbbbbbb')).rejects.toThrow(BadRequestException);
    });
    it('BadRequest si la contraseña es demasiado corta', async () => {
      await expect(service.completeSignupWithPassword('tok', '123', '123')).rejects.toThrow(BadRequestException);
    });
    it('BadRequest si el token no existe', async () => {
      usersRepository.findOne.mockResolvedValue(null);
      await expect(service.completeSignupWithPassword('tok', 'password1', 'password1')).rejects.toThrow(BadRequestException);
    });
    it('BadRequest si el token ha expirado', async () => {
      usersRepository.findOne.mockResolvedValue({ id: 'u1', signupTokenExpiresAt: new Date(Date.now() - 1000) });
      await expect(service.completeSignupWithPassword('tok', 'password1', 'password1')).rejects.toThrow(BadRequestException);
    });
    it('completa el signup con token válido', async () => {
      usersRepository.findOne.mockResolvedValue({
        id: 'u1', email: 'a@b.com', signupTokenExpiresAt: new Date(Date.now() + 60000),
      });
      const result = await service.completeSignupWithPassword('tok', 'password1', 'password1');
      expect(result.isActive).toBe(true);
      expect(authService.hashPassword).toHaveBeenCalled();
    });
  });

  describe('sendVerificationEmail', () => {
    it('envía el email de verificación', async () => {
      await service.sendVerificationEmail({
        email: 'a@b.com', firstName: 'Ana', signupToken: 'tok', signupTokenExpiresAt: new Date(),
      } as never);
      expect(emailService.sendEmail).toHaveBeenCalled();
    });
  });
});