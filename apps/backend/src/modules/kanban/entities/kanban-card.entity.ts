import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { KanbanColumnEntity } from './kanban-column.entity';
import { Licitacion } from '../../scraping/shared/entities/licitacion.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('kanban_cards')
@Unique('uq_kanban_cards_org_licitacion', ['organizationId', 'licitacionId'])
@Index('idx_kanban_card_column_position', ['columnId', 'position'])
export class KanbanCardEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  columnId!: string;

  @ManyToOne(() => KanbanColumnEntity, (column) => column.cards, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'columnId' })
  column!: KanbanColumnEntity;

  @Column({ type: 'uuid' })
  licitacionId!: string;

  @ManyToOne(() => Licitacion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'licitacionId' })
  licitacion!: Licitacion;

  @Column({ type: 'uuid' })
  organizationId!: string;

  @Column({ type: 'integer' })
  position!: number;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ type: 'uuid', nullable: true })
  assignedToId?: string | null;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assignedToId' })
  assignedTo?: UserEntity | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
