import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException, ConflictException } from '@nestjs/common';

import { UserCreateService } from './user-create.service';
import { UserEntity, OrganizationEntity } from '../entities';
import { Role, Plan } from '../enums';
import { EmailService } from '../../../infrastructure/email';
import { UserSanitizeHelper } from '../helpers';
import { UserAuthService } from './user-auth.service';

describe('UserCreateService', () => {
  let service: UserCreateService;

  const manager = {
    findOne: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn((_e, x) => x),
    save: jest.fn((u) => Promise.resolve({ ...u, id: 'u1' })),
  };
  const queryRunner = {
    connect: jest.fn(), startTransaction: jest.fn(), commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(), release: jest.fn(), manager,
  };
  const dataSource = { createQueryRunner: jest.fn(() => queryRunner) };
  const emailService = { sendWelcomeEmail: jest.fn() };
  const sanitizeHelper = {
    sanitizeEmail: jest.fn((e: string) => e.toLowerCase().trim()),
    sanitizeName: jest.fn((n: string) => n.trim()),
  };
  const authService = { hashPassword: jest.fn().mockResolvedValue('hashed') };

  const baseDto = { email: 'A@B.com', firstName: 'Ana', lastName: 'Pi', password: 'Secret123!' };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        UserCreateService,
        { provide: getRepositoryToken(UserEntity), useValue: {} },
        { provide: getRepositoryToken(OrganizationEntity), useValue: {} },
        { provide: DataSource, useValue: dataSource },
        { provide: EmailService, useValue: emailService },
        { provide: UserSanitizeHelper, useValue: sanitizeHelper },
        { provide: UserAuthService, useValue: authService },
      ],
    }).compile();
    service = moduleRef.get(UserCreateService);
  });

  it('crea un usuario individual FREE y manda bienvenida', async () => {
    manager.findOne.mockResolvedValueOnce(null); // no existe
    const result = await service.createUser({ ...baseDto, userPlan: Plan.FREE } as never);
    expect(result.id).toBe('u1');
    expect(emailService.sendWelcomeEmail).toHaveBeenCalled();
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
  });

  it('Conflict si el email ya existe', async () => {
    manager.findOne.mockResolvedValueOnce({ id: 'existe' });
    await expect(service.createUser(baseDto as never)).rejects.toThrow(ConflictException);
    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
  });

  it('BadRequest si sin organización se pide un rol distinto de PUBLIC_USER', async () => {
    manager.findOne.mockResolvedValueOnce(null);
    await expect(
      service.createUser({ ...baseDto, role: Role.ORG_OWNER } as never),
    ).rejects.toThrow(BadRequestException);
  });

  it('BadRequest si la organización indicada no existe', async () => {
    manager.findOne
      .mockResolvedValueOnce(null) // email libre
      .mockResolvedValueOnce(null); // org no existe
    await expect(
      service.createUser({ ...baseDto, organizationId: 'org-x', role: Role.ORG_MEMBER } as never),
    ).rejects.toThrow(BadRequestException);
  });
});