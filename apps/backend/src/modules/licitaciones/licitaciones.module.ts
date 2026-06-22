import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LicitacionesController } from './licitaciones.controller';
import { LicitacionesService } from './licitaciones.service';
import { SearchQueryBuilderService } from './services/search-query-builder.service';
import { LicitacionFormatterService } from './services/licitacion-formatter.service';
import { LicitacionResumenService } from './services/licitacion-resumen.service';
import { Licitacion } from '../scraping/shared/entities/licitacion.entity';
import { OrganoContratacion } from '../scraping/shared/entities/organo-contratacion.entity';
import { AiModule } from '../ai/ai.module';
import { CommonModule } from '../../common/common.module';
import { SemanticModule } from '../semantic/semantic.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([Licitacion, OrganoContratacion]),
    AiModule,
    CommonModule,
    SemanticModule,
  ],
  controllers: [LicitacionesController],
  providers: [
    LicitacionesService,
    SearchQueryBuilderService,
    LicitacionFormatterService,
    LicitacionResumenService,
  ],
  exports: [LicitacionesService],
})
export class LicitacionesModule {}