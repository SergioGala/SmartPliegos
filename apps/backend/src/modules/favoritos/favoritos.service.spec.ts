import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';

import { FavoritosService } from './favoritos.service';
import { FavoritoEntity } from './entities';

describe('FavoritosService', () => {
  let service: FavoritosService;

  const favRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const USER = 'user-1';

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        FavoritosService,
        { provide: getRepositoryToken(FavoritoEntity), useValue: favRepo },
      ],
    }).compile();
    service = moduleRef.get(FavoritosService);
  });

  // ── create ───────────────────────────────────────────────────────────
  describe('create', () => {
    it('crea un favorito nuevo con nota', async () => {
      favRepo.findOne.mockResolvedValue(null);
      const created = { id: 'f1', userId: USER, licitacionId: 'lic-1', nota: 'interesante' };
      favRepo.create.mockReturnValue(created);
      favRepo.save.mockResolvedValue(created);

      const result = await service.create(USER, { licitacionId: 'lic-1', nota: 'interesante' });

      expect(favRepo.create).toHaveBeenCalledWith({
        userId: USER,
        licitacionId: 'lic-1',
        nota: 'interesante',
      });
      expect(result).toBe(created);
    });

    it('usa null cuando no se pasa nota', async () => {
      favRepo.findOne.mockResolvedValue(null);
      favRepo.create.mockImplementation((x) => x);
      favRepo.save.mockImplementation((x) => Promise.resolve(x));

      await service.create(USER, { licitacionId: 'lic-1' });

      expect(favRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ nota: null }),
      );
    });

    it('lanza Conflict si la licitación ya está en favoritos', async () => {
      favRepo.findOne.mockResolvedValue({ id: 'ya-existe' });

      await expect(
        service.create(USER, { licitacionId: 'lic-1' }),
      ).rejects.toThrow(ConflictException);
      expect(favRepo.save).not.toHaveBeenCalled();
    });
  });

  // ── findAllByUser ────────────────────────────────────────────────────
  describe('findAllByUser', () => {
    it('devuelve los favoritos del usuario con la licitación y orden desc', async () => {
      const rows = [{ id: 'f1' }, { id: 'f2' }];
      favRepo.find.mockResolvedValue(rows);

      const result = await service.findAllByUser(USER);

      expect(favRepo.find).toHaveBeenCalledWith({
        where: { userId: USER },
        relations: ['licitacion'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toBe(rows);
    });
  });

  // ── findLicitacionIds ────────────────────────────────────────────────
  describe('findLicitacionIds', () => {
    it('devuelve solo los ids de licitación', async () => {
      favRepo.find.mockResolvedValue([
        { licitacionId: 'lic-1' },
        { licitacionId: 'lic-2' },
      ]);

      const result = await service.findLicitacionIds(USER);

      expect(result).toEqual(['lic-1', 'lic-2']);
    });

    it('devuelve array vacío si no hay favoritos', async () => {
      favRepo.find.mockResolvedValue([]);
      expect(await service.findLicitacionIds(USER)).toEqual([]);
    });
  });

  // ── updateNota ───────────────────────────────────────────────────────
  describe('updateNota', () => {
    it('actualiza la nota de un favorito existente', async () => {
      const fav = { id: 'f1', userId: USER, nota: 'vieja' };
      favRepo.findOne.mockResolvedValue(fav);
      favRepo.save.mockImplementation((x) => Promise.resolve(x));

      const result = await service.updateNota(USER, 'f1', { nota: 'nueva' });

      expect(result.nota).toBe('nueva');
      expect(favRepo.save).toHaveBeenCalledWith(expect.objectContaining({ nota: 'nueva' }));
    });

    it('pone la nota a null si se pasa vacía/undefined', async () => {
      const fav = { id: 'f1', userId: USER, nota: 'vieja' };
      favRepo.findOne.mockResolvedValue(fav);
      favRepo.save.mockImplementation((x) => Promise.resolve(x));

      const result = await service.updateNota(USER, 'f1', {});

      expect(result.nota).toBeNull();
    });

    it('lanza NotFound si el favorito no existe (o no es del usuario)', async () => {
      favRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateNota(USER, 'no-existe', { nota: 'x' }),
      ).rejects.toThrow(NotFoundException);
      expect(favRepo.save).not.toHaveBeenCalled();
    });
  });

  // ── remove ───────────────────────────────────────────────────────────
  describe('remove', () => {
    it('borra el favorito por id', async () => {
      favRepo.delete.mockResolvedValue({ affected: 1 });

      await expect(service.remove(USER, 'f1')).resolves.toBeUndefined();
      expect(favRepo.delete).toHaveBeenCalledWith({ id: 'f1', userId: USER });
    });

    it('lanza NotFound si no se borró nada', async () => {
      favRepo.delete.mockResolvedValue({ affected: 0 });
      await expect(service.remove(USER, 'f1')).rejects.toThrow(NotFoundException);
    });
  });

  // ── removeByLicitacion ───────────────────────────────────────────────
  describe('removeByLicitacion', () => {
    it('borra el favorito por licitacionId', async () => {
      favRepo.delete.mockResolvedValue({ affected: 1 });

      await expect(service.removeByLicitacion(USER, 'lic-1')).resolves.toBeUndefined();
      expect(favRepo.delete).toHaveBeenCalledWith({ userId: USER, licitacionId: 'lic-1' });
    });

    it('lanza NotFound si no había favorito para esa licitación', async () => {
      favRepo.delete.mockResolvedValue({ affected: 0 });
      await expect(service.removeByLicitacion(USER, 'lic-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});