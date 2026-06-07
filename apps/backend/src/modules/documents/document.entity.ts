import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, DeleteDateColumn, Index,
} from 'typeorm';

@Entity('documents')
@Index(['ownerUserId'])
@Index(['organizationId'])
export class DocumentEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ type: 'uuid' }) ownerUserId!: string;
  @Column({ type: 'uuid', nullable: true }) organizationId!: string | null;

  @Column({ type: 'varchar', length: 500 }) filename!: string; // nombre visible
  @Column({ type: 'varchar', length: 150 }) mimeType!: string;
  @Column({ type: 'bigint' }) sizeBytes!: string; // bigint → string en pg

  @Column({ type: 'varchar', length: 1000, unique: true }) storageKey!: string;
  @Column({ type: 'varchar', length: 64, nullable: true }) checksum!: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true }) folder!: string | null;
  @Column({ type: 'uuid', nullable: true }) licitacionId!: string | null; // soft ref, sin FK

  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
  @DeleteDateColumn({ type: 'timestamptz', nullable: true }) deletedAt!: Date | null;
}