import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';

import { UserPasswordService } from './user-password.service';
import { UserEntity } from '../entities';
import { EmailService } from '../../../infrastructure/email';
import { EmailTemplatesService } from '../../../common/email-templates';
import { UserQueryHelper, UserSanitizeHelper } from '../helpers';
import { UserAuthService } from './user-auth.service';

describe('UserPasswordService', () => {
  let service: UserPasswordService;
  let qb: Record<string, jest.Mock>;

  const usersRepository = {
    save: jest.fn((u) => Promise.resolve(u)),
    createQueryBuilder: jest.fn(),
  };
  const emailService = { sendEmail: jest.fn() };
  const emailTemplatesService = {
    getPasswordResetTemplate: jest.fn(() => '<html>'),
    getPasswordChangedTemplate: jest.fn(() => '<html>'),
  };
  const sanitizeHelper = { sanitizeEmail: jest.fn((e: string) => e.toLowerCase().trim()) };
  const authService = {
    hashPassword: jest.fn().mockResolvedValue('hashed'),
    validatePassword: jest.fn(),
  };
  const queryHelper = { buildUserQuery: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    qb = {
      where: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };
    queryHelper.buildUserQuery.mockReturnValue(qb);
    usersRepository.createQueryBuilder.mockReturnValue(qb);

    const moduleRef = await Test.createTestingModule({
      providers: [
        UserPasswordService,
        { provide: getRepositoryToken(UserEntity), useValue: usersRepository },
        { provide: EmailService, useValue: emailService },
        { provide: EmailTemplatesService, useValue: emailTemplatesService },
        { provide: UserQueryHelper, useValue: queryHelper },
        { provide: UserSanitizeHelper, useValue: sanitizeHelper },
        { provide: UserAuthService, useValue: authService },
      ],
    }).compile();
    service = moduleRef.get(UserPasswordService);
  });

  describe('requestPasswordChange', () => {
    it('no revela si el email no existe (mensaje genérico, sin email)', async () => {
      qb.getOne.mockResolvedValue(null);
      const res = await service.requestPasswordChange('no@existe.com');
      expect(res.message).toContain('Si el email existe');
      expect(emailService.sendEmail).not.toHaveBeenCalled();
    });
    it('genera token y envía email si el usuario existe', async () => {
      qb.getOne.mockResolvedValue({ id: 'u1', email: 'a@b.com', firstName: 'Ana' });
      await service.requestPasswordChange('a@b.com');
      expect(usersRepository.save).toHaveBeenCalled();
      expect(emailService.sendEmail).toHaveBeenCalled();
    });
  });

  describe('confirmPasswordChange', () => {
    it('BadRequest si el token no existe', async () => {
      qb.getOne.mockResolvedValue(null);
      await expect(service.confirmPasswordChange('tok', 'newpass')).rejects.toThrow(BadRequestException);
    });
    it('BadRequest si el token ha expirado', async () => {
      qb.getOne.mockResolvedValue({ id: 'u1', passwordResetExpiresAt: new Date(Date.now() - 1000) });
      await expect(service.confirmPasswordChange('tok', 'newpass')).rejects.toThrow(BadRequestException);
    });
    it('cambia la contraseña con token válido', async () => {
      qb.getOne.mockResolvedValue({
        id: 'u1', email: 'a@b.com', firstName: 'Ana',
        passwordResetExpiresAt: new Date(Date.now() + 60000),
      });
      const res = await service.confirmPasswordChange('tok', 'newpass');
      expect(authService.hashPassword).toHaveBeenCalledWith('newpass');
      expect(res.message).toContain('actualizada');
    });
  });

  describe('changePassword', () => {
    it('BadRequest si las contraseñas no coinciden', async () => {
      await expect(service.changePassword('u1', 'old', 'a', 'b')).rejects.toThrow(BadRequestException);
    });
    it('BadRequest si la contraseña actual es incorrecta', async () => {
      qb.getOne.mockResolvedValue({ id: 'u1', password: 'hash' });
      authService.validatePassword.mockResolvedValue(false);
      await expect(service.changePassword('u1', 'old', 'new', 'new')).rejects.toThrow(BadRequestException);
    });
    it('cambia la contraseña si todo es correcto', async () => {
      qb.getOne.mockResolvedValue({ id: 'u1', email: 'a@b.com', password: 'hash' });
      authService.validatePassword.mockResolvedValue(true);
      const res = await service.changePassword('u1', 'old', 'new', 'new');
      expect(usersRepository.save).toHaveBeenCalled();
      expect(res.message).toContain('actualizada');
    });
  });
});