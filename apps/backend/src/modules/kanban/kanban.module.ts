import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KanbanBoardEntity, KanbanColumnEntity, KanbanCardEntity } from './entities';
import { Licitacion } from '../scraping/shared/entities/licitacion.entity';
import { KanbanController } from './kanban.controller';
import { KanbanService } from './kanban.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      KanbanBoardEntity,
      KanbanColumnEntity,
      KanbanCardEntity,
      Licitacion,
    ]),
  ],
  controllers: [KanbanController],
  providers: [KanbanService],
  exports: [KanbanService],
})
export class KanbanModule {}
