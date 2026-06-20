import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { KanbanService } from './kanban.service';
import { KanbanBoardEntity, KanbanColumnEntity, KanbanCardEntity } from './entities';
import { Licitacion } from '../scraping/shared/entities/licitacion.entity';

const ORG_ID = '11111111-1111-1111-1111-111111111111';
const BOARD_ID = '22222222-2222-2222-2222-222222222222';
const COL_A = '33333333-3333-3333-3333-333333333333';
const COL_B = '44444444-4444-4444-4444-444444444444';
const CARD_ID = '55555555-5555-5555-5555-555555555555';
const LIC_ID = '66666666-6666-6666-6666-666666666666';

function makeColumns(over: Partial<KanbanColumnEntity>[] = []): KanbanColumnEntity[] {
  const defaults = [
    { id: COL_A, boardId: BOARD_ID, name: 'NUEVA', color: 'slate', position: 0, isTerminal: false, cards: [] },
    { id: COL_B, boardId: BOARD_ID, name: 'EVALUANDO', color: 'amber', position: 1, isTerminal: false, cards: [] },
  ];
  return defaults.map((col, i) => ({ ...col, ...over[i] })) as KanbanColumnEntity[];
}

function makeBoard(columns = makeColumns()): KanbanBoardEntity {
  return { id: BOARD_ID, organizationId: ORG_ID, name: 'Board', columns } as KanbanBoardEntity;
}

function makeQueryRunner() {
  const manager = {
    findOne: jest.fn(),
    create: jest.fn().mockImplementation((_entity, data: Record<string, unknown>) => ({
      id: 'generated-id',
      ...data,
    })),
    save: jest.fn().mockImplementation((_entity: unknown, data: Record<string, unknown> | Record<string, unknown>[]) => {
      if (Array.isArray(data)) {
        return Promise.resolve(data);
      }
      return Promise.resolve({
        ...data,
        id: (data['id'] as string | undefined) ?? 'saved-id',
      });
    }),
    find: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
  };

  return {
    connect: jest.fn().mockResolvedValue(undefined),
    startTransaction: jest.fn().mockResolvedValue(undefined),
    commitTransaction: jest.fn().mockResolvedValue(undefined),
    rollbackTransaction: jest.fn().mockResolvedValue(undefined),
    release: jest.fn().mockResolvedValue(undefined),
    manager,
  };
}

describe('KanbanService', () => {
  let service: KanbanService;
  let boardRepo: { findOne: jest.Mock; create: jest.Mock; save: jest.Mock };
  let columnRepo: { create: jest.Mock; save: jest.Mock };
  let cardRepo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let licitacionRepo: { findOne: jest.Mock };
  let queryRunner: ReturnType<typeof makeQueryRunner>;
  let dataSource: { createQueryRunner: jest.Mock };

  beforeEach(async () => {
    boardRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    columnRepo = {
      create: jest.fn().mockImplementation((d: Record<string, unknown>) => d),
      save: jest.fn().mockImplementation((d: Record<string, unknown>) => Promise.resolve({ id: 'col-new', ...d })),
    };
    cardRepo = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((d: Record<string, unknown>) => d),
      save: jest.fn().mockImplementation((d: Record<string, unknown>) => Promise.resolve({ id: CARD_ID, ...d })),
    };
    licitacionRepo = { findOne: jest.fn() };
    queryRunner = makeQueryRunner();
    dataSource = { createQueryRunner: jest.fn().mockReturnValue(queryRunner) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        KanbanService,
        { provide: getRepositoryToken(KanbanBoardEntity), useValue: boardRepo },
        { provide: getRepositoryToken(KanbanColumnEntity), useValue: columnRepo },
        { provide: getRepositoryToken(KanbanCardEntity), useValue: cardRepo },
        { provide: getRepositoryToken(Licitacion), useValue: licitacionRepo },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = moduleRef.get(KanbanService);
  });

  describe('getOrCreateBoard / getBoard', () => {
    it('rejects empty organizationId with NO_ORGANIZATION', async () => {
      await expect(service.getOrCreateBoard('')).rejects.toMatchObject({
        response: { code: 'NO_ORGANIZATION' },
      });
      await expect(service.getOrCreateBoard('')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('returns existing board with sorted columns and cards', async () => {
      const board = makeBoard([
        { id: COL_B, position: 1, cards: [{ id: CARD_ID, position: 1 } as KanbanCardEntity] },
        { id: COL_A, position: 0, cards: [{ id: 'c2', position: 0 } as KanbanCardEntity] },
      ] as Partial<KanbanColumnEntity>[]);
      boardRepo.findOne.mockResolvedValue(board);

      const result = await service.getBoard(ORG_ID);

      expect(result.columns[0].id).toBe(COL_A);
      expect(result.columns[1].id).toBe(COL_B);
      expect(result.columns[0].cards[0].position).toBe(0);
      expect(result.columns[1].cards[0].position).toBe(1);
    });

    it('initializes empty cards array for columns without cards', async () => {
      const board = makeBoard([
        { id: COL_A, position: 0 },
        { id: COL_B, position: 1 },
      ] as Partial<KanbanColumnEntity>[]);
      boardRepo.findOne.mockResolvedValue(board);

      const result = await service.getBoard(ORG_ID);

      expect(result.columns[0].cards).toEqual([]);
      expect(result.columns[1].cards).toEqual([]);
    });

    it('creates board with default columns when none exists', async () => {
      const createdBoard = makeBoard();
      boardRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(createdBoard);
      queryRunner.manager.findOne.mockResolvedValue(null);

      const result = await service.getOrCreateBoard(ORG_ID);

      expect(dataSource.createQueryRunner).toHaveBeenCalled();
      expect(queryRunner.manager.save).toHaveBeenCalled();
      expect(result).toBe(createdBoard);
    });

    it('rolls back when board creation fails', async () => {
      boardRepo.findOne.mockResolvedValue(null);
      queryRunner.manager.findOne.mockResolvedValue(null);
      queryRunner.manager.save.mockRejectedValue(new Error('create failed'));

      await expect(service.getOrCreateBoard(ORG_ID)).rejects.toThrow('create failed');
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('addCard', () => {
    beforeEach(() => {
      boardRepo.findOne.mockResolvedValue(makeBoard());
    });

    it('rejects when tender does not exist', async () => {
      licitacionRepo.findOne.mockResolvedValue(null);
      await expect(service.addCard(ORG_ID, { licitacionId: LIC_ID })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('rejects duplicate card on board', async () => {
      licitacionRepo.findOne.mockResolvedValue({ id: LIC_ID });
      cardRepo.findOne.mockResolvedValue({ id: CARD_ID, licitacionId: LIC_ID });

      await expect(service.addCard(ORG_ID, { licitacionId: LIC_ID })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('appends card to end of first column by default', async () => {
      licitacionRepo.findOne.mockResolvedValue({ id: LIC_ID });
      cardRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: CARD_ID, licitacionId: LIC_ID, position: 0 });

      const card = await service.addCard(ORG_ID, { licitacionId: LIC_ID, notes: 'note' });

      expect(cardRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          columnId: COL_A,
          licitacionId: LIC_ID,
          organizationId: ORG_ID,
          position: 0,
          notes: 'note',
        }),
      );
      expect(cardRepo.save).toHaveBeenCalled();
      expect(card.id).toBe(CARD_ID);
    });

    it('appends card after existing cards in column', async () => {
      boardRepo.findOne.mockResolvedValue(
        makeBoard([
          { id: COL_A, position: 0, cards: [{ id: 'c1', position: 0 } as KanbanCardEntity] },
          { id: COL_B, position: 1, cards: [] },
        ] as Partial<KanbanColumnEntity>[]),
      );
      licitacionRepo.findOne.mockResolvedValue({ id: LIC_ID });
      cardRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: CARD_ID, licitacionId: LIC_ID, position: 1 });

      await service.addCard(ORG_ID, { licitacionId: LIC_ID });

      expect(cardRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ columnId: COL_A, position: 1 }),
      );
    });

    it('rejects non-existent destination column', async () => {
      licitacionRepo.findOne.mockResolvedValue({ id: LIC_ID });
      cardRepo.findOne.mockResolvedValue(null);

      await expect(
        service.addCard(ORG_ID, { licitacionId: LIC_ID, columnId: '00000000-0000-0000-0000-000000000000' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects when board has no columns', async () => {
      boardRepo.findOne.mockResolvedValue({
        id: BOARD_ID,
        organizationId: ORG_ID,
        name: 'Board',
        columns: [],
      });
      licitacionRepo.findOne.mockResolvedValue({ id: LIC_ID });
      cardRepo.findOne.mockResolvedValue(null);

      await expect(service.addCard(ORG_ID, { licitacionId: LIC_ID })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('moveCard', () => {
    const card = {
      id: CARD_ID,
      columnId: COL_A,
      organizationId: ORG_ID,
      licitacionId: LIC_ID,
      position: 0,
    };

    beforeEach(() => {
      boardRepo.findOne.mockResolvedValue(makeBoard());
    });

    it('rejects non-existent card', async () => {
      cardRepo.findOne.mockResolvedValue(null);
      await expect(
        service.moveCard(ORG_ID, CARD_ID, { columnId: COL_B, position: 0 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects non-existent destination column', async () => {
      cardRepo.findOne.mockResolvedValue(card);
      await expect(
        service.moveCard(ORG_ID, CARD_ID, {
          columnId: '00000000-0000-0000-0000-000000000000',
          position: 0,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('reorders within the same column', async () => {
      cardRepo.findOne
        .mockResolvedValueOnce(card)
        .mockResolvedValueOnce({ ...card, position: 1, licitacion: { id: LIC_ID } });

      queryRunner.manager.find.mockResolvedValue([
        { id: CARD_ID, columnId: COL_A, position: 0 },
        { id: 'c2', columnId: COL_A, position: 1 },
      ]);

      const moved = await service.moveCard(ORG_ID, CARD_ID, { columnId: COL_A, position: 1 });

      expect(queryRunner.manager.save).toHaveBeenCalled();
      expect(moved.position).toBe(1);
    });

    it('moves card to another column', async () => {
      cardRepo.findOne
        .mockResolvedValueOnce(card)
        .mockResolvedValueOnce({ ...card, columnId: COL_B, position: 0, licitacion: { id: LIC_ID } });

      queryRunner.manager.find
        .mockResolvedValueOnce([{ id: CARD_ID, columnId: COL_A, position: 0 }])
        .mockResolvedValueOnce([]);

      const moved = await service.moveCard(ORG_ID, CARD_ID, { columnId: COL_B, position: 0 });

      expect(moved.columnId).toBe(COL_B);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('compacts source column when moving across columns', async () => {
      cardRepo.findOne
        .mockResolvedValueOnce(card)
        .mockResolvedValueOnce({ ...card, columnId: COL_B, position: 1, licitacion: { id: LIC_ID } });

      queryRunner.manager.find
        .mockResolvedValueOnce([
          { id: CARD_ID, columnId: COL_A, position: 0 },
          { id: 'c-other', columnId: COL_A, position: 1 },
        ])
        .mockResolvedValueOnce([{ id: 'd1', columnId: COL_B, position: 0 }]);

      await service.moveCard(ORG_ID, CARD_ID, { columnId: COL_B, position: 2 });

      expect(queryRunner.manager.save).toHaveBeenCalledWith(
        KanbanCardEntity,
        expect.objectContaining({ id: 'c-other', position: 0 }),
      );
    });

    it('clamps out-of-range position when moving within same column', async () => {
      cardRepo.findOne
        .mockResolvedValueOnce(card)
        .mockResolvedValueOnce({ ...card, position: 1, licitacion: { id: LIC_ID } });

      queryRunner.manager.find.mockResolvedValue([
        { id: CARD_ID, columnId: COL_A, position: 0 },
        { id: 'c2', columnId: COL_A, position: 1 },
      ]);

      await service.moveCard(ORG_ID, CARD_ID, { columnId: COL_A, position: 99 });

      expect(queryRunner.manager.save).toHaveBeenCalled();
    });

    it('rolls back when transaction fails', async () => {
      cardRepo.findOne.mockResolvedValue(card);
      queryRunner.manager.find.mockResolvedValue([{ id: CARD_ID, columnId: COL_A, position: 0 }]);
      queryRunner.manager.save.mockRejectedValue(new Error('db error'));

      await expect(
        service.moveCard(ORG_ID, CARD_ID, { columnId: COL_A, position: 0 }),
      ).rejects.toThrow('db error');
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('removeCard', () => {
    it('rejects non-existent card', async () => {
      cardRepo.findOne.mockResolvedValue(null);
      await expect(service.removeCard(ORG_ID, CARD_ID)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('removes card and compacts positions', async () => {
      cardRepo.findOne.mockResolvedValue({
        id: CARD_ID,
        columnId: COL_A,
        organizationId: ORG_ID,
        position: 0,
      });
      queryRunner.manager.find.mockResolvedValue([
        { id: 'c2', columnId: COL_A, position: 1 },
      ]);

      await service.removeCard(ORG_ID, CARD_ID);

      expect(queryRunner.manager.delete).toHaveBeenCalledWith(KanbanCardEntity, { id: CARD_ID });
      expect(queryRunner.manager.save).toHaveBeenCalledWith(
        KanbanCardEntity,
        expect.objectContaining({ id: 'c2', position: 0 }),
      );
    });

    it('rolls back when deletion fails', async () => {
      cardRepo.findOne.mockResolvedValue({
        id: CARD_ID,
        columnId: COL_A,
        organizationId: ORG_ID,
        position: 0,
      });
      queryRunner.manager.delete.mockRejectedValue(new Error('delete failed'));

      await expect(service.removeCard(ORG_ID, CARD_ID)).rejects.toThrow('delete failed');
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('createColumn', () => {
    it('appends column to end of board', async () => {
      boardRepo.findOne.mockResolvedValue(makeBoard());

      const col = await service.createColumn(ORG_ID, { name: 'CUSTOM', color: 'blue' });

      expect(columnRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          boardId: BOARD_ID,
          name: 'CUSTOM',
          color: 'blue',
          position: 2,
          isTerminal: false,
        }),
      );
      expect(col.id).toBe('col-new');
    });
  });

  describe('updateColumn', () => {
    it('rejects non-existent column', async () => {
      boardRepo.findOne.mockResolvedValue(makeBoard());
      await expect(
        service.updateColumn(ORG_ID, '00000000-0000-0000-0000-000000000000', { name: 'X' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('updates name and color', async () => {
      const col = { id: COL_A, boardId: BOARD_ID, name: 'NUEVA', color: 'slate', position: 0, isTerminal: false };
      boardRepo.findOne.mockResolvedValue(makeBoard([col as KanbanColumnEntity]));
      columnRepo.save.mockResolvedValue({ ...col, name: 'Renamed', color: 'violet' });

      const updated = await service.updateColumn(ORG_ID, COL_A, { name: 'Renamed', color: 'violet' });

      expect(columnRepo.save).toHaveBeenCalledWith(expect.objectContaining({ name: 'Renamed', color: 'violet' }));
      expect(updated.name).toBe('Renamed');
    });

    it('updates isTerminal without changing other fields', async () => {
      const col = { id: COL_A, boardId: BOARD_ID, name: 'NUEVA', color: 'slate', position: 0, isTerminal: false };
      boardRepo.findOne.mockResolvedValue(makeBoard([col as KanbanColumnEntity]));
      columnRepo.save.mockResolvedValue({ ...col, isTerminal: true });

      const updated = await service.updateColumn(ORG_ID, COL_A, { isTerminal: true });

      expect(columnRepo.save).toHaveBeenCalledWith(expect.objectContaining({ isTerminal: true, name: 'NUEVA' }));
      expect(updated.isTerminal).toBe(true);
    });
  });

  describe('reorderColumns', () => {
    it('rejects column IDs that do not match the board', async () => {
      boardRepo.findOne.mockResolvedValue(makeBoard());
      await expect(
        service.reorderColumns(ORG_ID, { columnIds: [COL_A] }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('reorders columns according to provided array', async () => {
      const board = makeBoard();
      boardRepo.findOne.mockResolvedValue(board);

      const columns = await service.reorderColumns(ORG_ID, { columnIds: [COL_B, COL_A] });

      expect(queryRunner.manager.update).toHaveBeenCalledWith(
        KanbanColumnEntity,
        { id: COL_B },
        { position: 0 },
      );
      expect(queryRunner.manager.update).toHaveBeenCalledWith(
        KanbanColumnEntity,
        { id: COL_A },
        { position: 1 },
      );
      expect(columns).toBe(board.columns);
    });

    it('rolls back when reorder fails', async () => {
      boardRepo.findOne.mockResolvedValue(makeBoard());
      queryRunner.manager.update.mockRejectedValue(new Error('update failed'));

      await expect(
        service.reorderColumns(ORG_ID, { columnIds: [COL_B, COL_A] }),
      ).rejects.toThrow('update failed');
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });
});
