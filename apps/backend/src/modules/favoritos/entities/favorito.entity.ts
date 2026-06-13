import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { Licitacion } from '../../scraping/shared/entities/licitacion.entity';

@Entity('favoritos')
@Unique('uq_favorito_user_licitacion', ['userId', 'licitacionId'])
@Index('idx_favorito_user', ['userId'])
export class FavoritoEntity {
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

  @Column({ type: 'text', nullable: true })
  nota?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}