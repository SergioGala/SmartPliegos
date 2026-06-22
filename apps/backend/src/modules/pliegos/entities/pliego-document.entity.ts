import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum PliegoStatus {
  PENDING = 'PENDING',
  READY = 'READY',
  ERROR = 'ERROR',
}

@Entity('pliego_documents')
@Index(['licitacionId', 'sourceUrl'], { unique: true })
export class PliegoDocument {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  licitacionId!: string;

  /** Tipo según el scraping: PLIEGO_ADMINISTRATIVO, PLIEGO_TECNICO, ANUNCIO, OTRO… */
  @Column({ type: 'varchar', default: 'OTRO' })
  tipo!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  nombre!: string | null;

  @Column({ type: 'varchar', length: 2000 })
  sourceUrl!: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  mimeType!: string | null;

  @Column({ type: 'bigint', nullable: true })
  sizeBytes!: string | null;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  storageKey!: string | null;

  /** Texto plano del PDF. NUNCA se serializa entero hacia el cliente (ver toListItem). */
  @Column({ type: 'text', nullable: true, select: false })
  extractedText!: string | null;

  @Column({ type: 'varchar', default: PliegoStatus.PENDING })
  status!: PliegoStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  errorMessage!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
