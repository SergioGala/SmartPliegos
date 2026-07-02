import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

import { UserCrudService } from './user-crud.service';
import { UserEntity } from '../entities';
import { UserSanitizeHelper, UserQueryHelper } from '../helpers';

describe('UserCrudService', () => {
  let service: UserCrudService;
  let qb: Record<string, jest.Mock>;

  const usersRepository = { save: jest.fn((u) => Promise.resolve(u)), remove: jest.fn() };
  const sanitizeHelper = { sanitizeName: jest.fn((n: string) => n.trim()) };
  const queryHelper = {
    buildUserQuery: jest.fn(),
    applyUserSelect: jest.fn((q) => q),
    getListFields: jest.fn(() => []),
    getSafeFields: jest.fn(() => []),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    queryHelper.buildUserQuery.mockReturnValue(qb);

    const moduleRef = await Test.createTestingModule({
      providers: [
        UserCrudService,
        { provide: getRepositoryToken(UserEntity), useValue: usersRepository },
        { provide: UserSanitizeHelper, useValue: sanitizeHelper },
        { provide: UserQueryHelper, useValue: queryHelper },
      ],
    }).compile();
    service = moduleRef.get(UserCrudService);
  });

  describe('findOne', () => {
    it('devuelve el usuario si existe', async () => {
      qb.getOne.mockResolvedValue({ id: 'u1' });
      expect(await service.findOne('u1')).toEqual({ id: 'u1' });
    });
    it('aplica filtro de organización si se pasa', async () => {
      qb.getOne.mockResolvedValue({ id: 'u1' });
      await service.findOne('u1', 'org-1');
      expect(qb.andWhere).toHaveBeenCalled();
    });
    it('NotFound si no existe', async () => {
      qb.getOne.mockResolvedValue(null);
      await expect(service.findOne('u1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateUser', () => {
    it('sanitiza nombre, guarda y devuelve el usuario', async () => {
      qb.getOne.mockResolvedValue({ id: 'u1', email: 'a@b.com' });
      const result = await service.updateUser('u1', undefined, { firstName: ' Ana ' } as never);
      expect(sanitizeHelper.sanitizeName).toHaveBeenCalledWith(' Ana ');
      expect(usersRepository.save).toHaveBeenCalled();
      expect(result).toMatchObject({ id: 'u1', firstName: 'Ana' });
    });
    it('NotFound si el usuario no existe', async () => {
      qb.getOne.mockResolvedValue(null);
      await expect(service.updateUser('u1', undefined, {} as never)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deactivate', () => {
    it('desactiva al usuario', async () => {
      const user = { id: 'u1', email: 'a@b.com', isActive: true };
      qb.getOne.mockResolvedValue(user);
      await service.deactivate('u1', 'org-1');
      expect(user.isActive).toBe(false);
      expect(usersRepository.save).toHaveBeenCalledWith(user);
    });
    it('NotFound si no existe', async () => {
      qb.getOne.mockResolvedValue(null);
      await expect(service.deactivate('u1', 'org-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteUser', () => {
    it('elimina al usuario', async () => {
      const user = { id: 'u1', email: 'a@b.com' };
      qb.getOne.mockResolvedValue(user);
      await service.deleteUser('u1');
      expect(usersRepository.remove).toHaveBeenCalledWith(user);
    });
    it('NotFound si no existe', async () => {
      qb.getOne.mockResolvedValue(null);
      await expect(service.deleteUser('u1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('listByOrganization', () => {
    it('devuelve la lista de la organización', async () => {
      qb.getMany.mockResolvedValue([{ id: 'u1' }]);
      expect(await service.listByOrganization('org-1')).toEqual([{ id: 'u1' }]);
    });
  });
});