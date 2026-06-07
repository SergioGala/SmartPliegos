import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FavoritoEntity } from './entities';
import type { CreateFavoritoDto, UpdateFavoritoDto } from './dto';

@Injectable()
export class FavoritosService {
  constructor(
    @InjectRepository(FavoritoEntity)
    private readonly favRepo: Repository<FavoritoEntity>,
  ) {}

  async create(userId: string, dto: CreateFavoritoDto): Promise<FavoritoEntity> {
    const exists = await this.favRepo.findOne({
      where: { userId, licitacionId: dto.licitacionId },
    });

    if (exists) {
      throw new ConflictException('Esta licitación ya está en tus favoritos');
    }

    const favorito = this.favRepo.create({
      userId,
      licitacionId: dto.licitacionId,
      nota: dto.nota ?? null,
    });

    return this.favRepo.save(favorito);
  }

  findAllByUser(userId: string): Promise<FavoritoEntity[]> {
    return this.favRepo.find({
      where: { userId },
      relations: ['licitacion'],
      order: { createdAt: 'DESC' },
    });
  }

  async findLicitacionIds(userId: string): Promise<string[]> {
    const rows = await this.favRepo.find({
      where: { userId },
      select: { licitacionId: true },
    });

    return rows.map((row) => row.licitacionId);
  }

  async updateNota(userId: string, id: string, dto: UpdateFavoritoDto): Promise<FavoritoEntity> {
    const favorito = await this.favRepo.findOne({
      where: { id, userId },
    });

    if (!favorito) {
      throw new NotFoundException('Favorito no encontrado');
    }

    favorito.nota = dto.nota ?? null;

    return this.favRepo.save(favorito);
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.favRepo.delete({ id, userId });

    if (!result.affected) {
      throw new NotFoundException('Favorito no encontrado');
    }
  }

  async removeByLicitacion(userId: string, licitacionId: string): Promise<void> {
    const result = await this.favRepo.delete({ userId, licitacionId });

    if (!result.affected) {
      throw new NotFoundException('Favorito no encontrado');
    }
  }
}