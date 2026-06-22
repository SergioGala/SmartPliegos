import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { KanbanBoardEntity } from './kanban-board.entity';
import { KanbanCardEntity } from './kanban-card.entity';

@Entity('kanban_columns')
@Index('idx_kanban_column_board_position', ['boardId', 'position'])
export class KanbanColumnEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  boardId!: string;

  @ManyToOne(() => KanbanBoardEntity, (board) => board.columns, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'boardId' })
  board!: KanbanBoardEntity;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  color?: string | null;

  @Column({ type: 'integer' })
  position!: number;

  @Column({ type: 'boolean', default: false })
  isTerminal!: boolean;

  @OneToMany(() => KanbanCardEntity, (card) => card.column)
  cards!: KanbanCardEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
