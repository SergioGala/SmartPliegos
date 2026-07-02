import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

import { UserAuthService } from './user-auth.service';
import { UserEntity } from '../entities';
import { UserQueryHelper } from '../helpers';

jest.mock('bcrypt');

describe('UserAuthService', () => {
  let service: UserAuthService;
  let qb: { where: jest.Mock; addSelect: jest.Mock; getOne: jest.Mock };

  const usersRepository = {};
  const queryHelper = { buildUserQuery: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    qb = {
      where: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };
    queryHelper.buildUserQuery.mockReturnValue(qb);

    const moduleRef = await Test.createTestingModule({
      providers: [
        UserAuthService,
        { provide: getRepositoryToken(UserEntity), useValue: usersRepository },
        { provide: UserQueryHelper, useValue: queryHelper },
      ],
    }).compile();
    service = moduleRef.get(UserAuthService);
  });

  describe('findByEmailWithPassword', () => {
    it('normaliza el email (lower+trim), pide el password y devuelve el usuario', async () => {
      const user = { id: 'u1' };
      qb.getOne.mockResolvedValue(user);

      const result = await service.findByEmailWithPassword('  Test@Mail.COM ');

      expect(qb.where).toHaveBeenCalledWith('user.email = :email', { email: 'test@mail.com' });
      expect(qb.addSelect).toHaveBeenCalledWith('user.password');
      expect(result).toBe(user);
    });
  });

  describe('findByGoogleId', () => {
    it('filtra por google_id', async () => {
      qb.getOne.mockResolvedValue(null);
      const result = await service.findByGoogleId('g-123');
      expect(qb.where).toHaveBeenCalledWith('user.google_id = :google_id', { google_id: 'g-123' });
      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('normaliza el email y NO añade el password', async () => {
      qb.getOne.mockResolvedValue({ id: 'u1' });
      await service.findByEmail(' A@B.com ');
      expect(qb.where).toHaveBeenCalledWith('user.email = :email', { email: 'a@b.com' });
      expect(qb.addSelect).not.toHaveBeenCalled();
    });
  });

  describe('validatePassword', () => {
    it('delega en bcrypt.compare', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const ok = await service.validatePassword('plain', 'hash');
      expect(bcrypt.compare).toHaveBeenCalledWith('plain', 'hash');
      expect(ok).toBe(true);
    });
  });

  describe('hashPassword', () => {
    it('hashea con 10 rounds', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      const h = await service.hashPassword('plain');
      expect(bcrypt.hash).toHaveBeenCalledWith('plain', 10);
      expect(h).toBe('hashed');
    });
  });
});