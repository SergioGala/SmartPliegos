import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { KanbanBoardEntity, KanbanColumnEntity, KanbanCardEntity } from './entities';
import { Licitacion } from '../scraping/shared/entities/licitacion.entity';
import type { CreateCardDto, MoveCardDto, CreateColumnDto, UpdateColumnDto, ReorderColumnsDto } from './dto';

@Injectable()
export class KanbanService {
  constructor(
    @InjectRepository(KanbanBoardEntity)
    private readonly boardRepo: Repository<KanbanBoardEntity>,
    @InjectRepository(KanbanColumnEntity)
    private readonly columnRepo: Repository<KanbanColumnEntity>,
    @InjectRepository(KanbanCardEntity)
    private readonly cardRepo: Repository<KanbanCardEntity>,
    @InjectRepository(Licitacion)
    private readonly licitacionRepo: Repository<Licitacion>,
    private readonly dataSource: DataSource,
  ) {}

  async getOrCreateBoard(organizationId: string): Promise<KanbanBoardEntity> {
    if (!organizationId) {
      throw new ForbiddenException({
        code: 'NO_ORGANIZATION',
        message: 'Necesitas pertenecer a una organización para usar el tablero.',
      });
    }

    let board = await this.boardRepo.findOne({
      where: { organizationId },
      relations: ['columns', 'columns.cards', 'columns.cards.licitacion'],
    });

    if (!board) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        // Double check within transaction
        let existingBoard = await queryRunner.manager.findOne(KanbanBoardEntity, {
          where: { organizationId },
        });

        if (!existingBoard) {
          const newBoard = queryRunner.manager.create(KanbanBoardEntity, {
            organizationId,
            name: 'Tablero de Licitaciones',
          });
          existingBoard = await queryRunner.manager.save(KanbanBoardEntity, newBoard);

          const defaultColumns = [
            { name: 'NUEVA', color: 'slate', position: 0, isTerminal: false },
            { name: 'EVALUANDO', color: 'amber', position: 1, isTerminal: false },
            { name: 'EN PROCESO', color: 'orange', position: 2, isTerminal: false },
            { name: 'PRESENTADA', color: 'indigo', position: 3, isTerminal: false },
            { name: 'GANADA', color: 'emerald', position: 4, isTerminal: true },
            { name: 'DESCARTADA', color: 'rose', position: 5, isTerminal: true },
          ];

          for (const col of defaultColumns) {
            const newCol = queryRunner.manager.create(KanbanColumnEntity, {
              boardId: existingBoard.id,
              name: col.name,
              color: col.color,
              position: col.position,
              isTerminal: col.isTerminal,
            });
            await queryRunner.manager.save(KanbanColumnEntity, newCol);
          }
        }

        await queryRunner.commitTransaction();
        
        board = await this.boardRepo.findOne({
          where: { organizationId },
          relations: ['columns', 'columns.cards', 'columns.cards.licitacion'],
        });
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    }

    if (board) {
      // Sort columns by position, and cards inside columns by position
      board.columns = board.columns.sort((a, b) => a.position - b.position);
      for (const col of board.columns) {
        if (col.cards) {
          col.cards = col.cards.sort((a, b) => a.position - b.position);
        } else {
          col.cards = [];
        }
      }
    }

    return board!;
  }

  async getBoard(organizationId: string): Promise<KanbanBoardEntity> {
    return this.getOrCreateBoard(organizationId);
  }

  async addCard(organizationId: string, dto: CreateCardDto): Promise<KanbanCardEntity> {
    const board = await this.getOrCreateBoard(organizationId);

    // Verify licitacion exists
    const licitacionExists = await this.licitacionRepo.findOne({
      where: { id: dto.licitacionId },
    });
    if (!licitacionExists) {
      throw new NotFoundException('Licitación no encontrada');
    }

    // Verify duplicate card
    const duplicate = await this.cardRepo.findOne({
      where: { organizationId, licitacionId: dto.licitacionId },
    });
    if (duplicate) {
      throw new ConflictException('Esta licitación ya está en el tablero');
    }

    let targetColumn: KanbanColumnEntity | undefined;
    if (dto.columnId) {
      targetColumn = board.columns.find((c) => c.id === dto.columnId);
      if (!targetColumn) {
        throw new NotFoundException('Columna de destino no encontrada');
      }
    } else {
      targetColumn = board.columns[0];
      if (!targetColumn) {
        throw new NotFoundException('No hay columnas en el tablero');
      }
    }

    const cardsInCol = targetColumn.cards || [];
    const maxPos = cardsInCol.length > 0 ? Math.max(...cardsInCol.map((c) => c.position)) : -1;

    const card = this.cardRepo.create({
      columnId: targetColumn.id,
      licitacionId: dto.licitacionId,
      organizationId,
      position: maxPos + 1,
      notes: dto.notes ?? null,
    });

    const savedCard = await this.cardRepo.save(card);
    // Reload to get licitacion relation
    return this.cardRepo.findOne({
      where: { id: savedCard.id },
      relations: ['licitacion'],
    }) as Promise<KanbanCardEntity>;
  }

  async moveCard(organizationId: string, cardId: string, dto: MoveCardDto): Promise<KanbanCardEntity> {
    const card = await this.cardRepo.findOne({
      where: { id: cardId, organizationId },
    });
    if (!card) {
      throw new NotFoundException('Tarjeta no encontrada');
    }

    const board = await this.getOrCreateBoard(organizationId);
    const destColumn = board.columns.find((c) => c.id === dto.columnId);
    if (!destColumn) {
      throw new NotFoundException('Columna de destino no encontrada');
    }

    const sourceColId = card.columnId;
    const destColId = dto.columnId;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (sourceColId === destColId) {
        const cards = await queryRunner.manager.find(KanbanCardEntity, {
          where: { columnId: sourceColId },
          order: { position: 'ASC' },
        });

        const movingCardIndex = cards.findIndex((c) => c.id === cardId);
        if (movingCardIndex !== -1) {
          const [movingCard] = cards.splice(movingCardIndex, 1);
          
          // Insert at target position
          let targetPos = dto.position;
          if (targetPos > cards.length) targetPos = cards.length;
          cards.splice(targetPos, 0, movingCard);

          // Compact positions
          for (let i = 0; i < cards.length; i++) {
            cards[i].position = i;
            await queryRunner.manager.save(KanbanCardEntity, cards[i]);
          }
        }
      } else {
        const sourceCards = await queryRunner.manager.find(KanbanCardEntity, {
          where: { columnId: sourceColId },
          order: { position: 'ASC' },
        });
        const destCards = await queryRunner.manager.find(KanbanCardEntity, {
          where: { columnId: destColId },
          order: { position: 'ASC' },
        });

        const movingCard = sourceCards.find((c) => c.id === cardId);
        if (movingCard) {
          // Remove from source
          const updatedSourceCards = sourceCards.filter((c) => c.id !== cardId);
          for (let i = 0; i < updatedSourceCards.length; i++) {
            updatedSourceCards[i].position = i;
            await queryRunner.manager.save(KanbanCardEntity, updatedSourceCards[i]);
          }

          // Add to destination
          movingCard.columnId = destColId;
          let targetPos = dto.position;
          if (targetPos > destCards.length) targetPos = destCards.length;
          destCards.splice(targetPos, 0, movingCard);

          for (let i = 0; i < destCards.length; i++) {
            destCards[i].position = i;
            await queryRunner.manager.save(KanbanCardEntity, destCards[i]);
          }
        }
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    return (await this.cardRepo.findOne({
      where: { id: cardId },
      relations: ['licitacion'],
    }))!;
  }

  async removeCard(organizationId: string, cardId: string): Promise<void> {
    const card = await this.cardRepo.findOne({
      where: { id: cardId, organizationId },
    });
    if (!card) {
      throw new NotFoundException('Tarjeta no encontrada');
    }

    const colId = card.columnId;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.delete(KanbanCardEntity, { id: cardId });

      const remainingCards = await queryRunner.manager.find(KanbanCardEntity, {
        where: { columnId: colId },
        order: { position: 'ASC' },
      });

      for (let i = 0; i < remainingCards.length; i++) {
        remainingCards[i].position = i;
        await queryRunner.manager.save(KanbanCardEntity, remainingCards[i]);
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async createColumn(organizationId: string, dto: CreateColumnDto): Promise<KanbanColumnEntity> {
    const board = await this.getOrCreateBoard(organizationId);

    const maxPos = board.columns.length > 0 ? Math.max(...board.columns.map((c) => c.position)) : -1;

    const col = this.columnRepo.create({
      boardId: board.id,
      name: dto.name,
      color: dto.color ?? null,
      isTerminal: dto.isTerminal ?? false,
      position: maxPos + 1,
    });

    return this.columnRepo.save(col);
  }

  async updateColumn(organizationId: string, columnId: string, dto: UpdateColumnDto): Promise<KanbanColumnEntity> {
    const board = await this.getOrCreateBoard(organizationId);
    const col = board.columns.find((c) => c.id === columnId);
    if (!col) {
      throw new NotFoundException('Columna no encontrada');
    }

    if (dto.name !== undefined) col.name = dto.name;
    if (dto.color !== undefined) col.color = dto.color ?? null;
    if (dto.isTerminal !== undefined) col.isTerminal = dto.isTerminal;

    return this.columnRepo.save(col);
  }

  async reorderColumns(organizationId: string, dto: ReorderColumnsDto): Promise<KanbanColumnEntity[]> {
    const board = await this.getOrCreateBoard(organizationId);

    // Verify all IDs belong to the board
    const colIds = board.columns.map((c) => c.id);
    const isValid = dto.columnIds.length === colIds.length && dto.columnIds.every((id) => colIds.includes(id));
    if (!isValid) {
      throw new BadRequestException('Los IDs de columnas proporcionados no coinciden con las del tablero');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (let i = 0; i < dto.columnIds.length; i++) {
        const colId = dto.columnIds[i];
        await queryRunner.manager.update(KanbanColumnEntity, { id: colId }, { position: i });
      }
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    const updatedBoard = await this.getOrCreateBoard(organizationId);
    return updatedBoard.columns;
  }
}
