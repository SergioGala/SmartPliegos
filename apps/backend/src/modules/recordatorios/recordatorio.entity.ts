import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index, Unique,
} from 'typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { Licitacion } from '../scraping/shared/entities/licitacion.entity';

export type RecordatorioStatus = 'PENDING' | 'SENT';

@Entity('recordatorios')
@Unique('uq_recordatorio_user_licitacion', ['userId', 'licitacionId'])
@Index('idx_recordatorio_user', ['userId'])
@Index('idx_recordatorio_due', ['status', 'remindAt'])
export class RecordatorioEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @Column({ type: 'uuid' })
  licitacionId!: string;

  @ManyToOne(() => Licitacion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'licitacionId' })
  licitacion!: Licitacion;

  /** Días antes del plazo de presentación en que avisar. */
  @Column({ type: 'int' })
  daysBefore!: number;

  /** Momento exacto en que el cron debe enviar el aviso. */
  @Column({ type: 'timestamptz' })
  remindAt!: Date;

  @Column({ type: 'text', nullable: true })
  note?: string | null;

  @Column({ type: 'varchar', length: 16, default: 'PENDING' })
  status!: RecordatorioStatus;

  @Column({ type: 'timestamptz', nullable: true })
  sentAt?: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}