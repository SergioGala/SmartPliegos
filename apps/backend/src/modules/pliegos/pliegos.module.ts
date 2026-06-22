import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PliegoDocument } from './entities/pliego-document.entity';
import { Licitacion } from '../scraping/shared/entities/licitacion.entity';
import { PliegosService } from './pliegos.service';
import { PliegosController } from './pliegos.controller';
import { CommonModule } from '../../common/common.module';
// StorageModule es @Global → no hace falta importarlo aquí.

@Module({
  imports: [TypeOrmModule.forFeature([PliegoDocument, Licitacion]), CommonModule],
  controllers: [PliegosController],
  providers: [PliegosService],
  exports: [PliegosService],
})
export class PliegosModule {}
