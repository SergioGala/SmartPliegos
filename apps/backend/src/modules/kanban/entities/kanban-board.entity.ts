import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Unique,
} from 'typeorm';
import { KanbanColumnEntity } from './kanban-column.entity';

@Entity('kanban_boards')
@Unique('uq_kanban_boards_organization', ['organizationId'])
export class KanbanBoardEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  organizationId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @OneToMany(() => KanbanColumnEntity, (column) => column.board)
  columns!: KanbanColumnEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
