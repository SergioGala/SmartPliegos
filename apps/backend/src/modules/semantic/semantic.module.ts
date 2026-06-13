import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Licitacion } from '../scraping/shared/entities/licitacion.entity';
import { OrganoContratacion } from '../scraping/shared/entities/organo-contratacion.entity';
import { AiModule } from '../ai/ai.module';
import { SearchQueryBuilderService } from '../licitaciones/services/search-query-builder.service';
import { LicitacionFormatterService } from '../licitaciones/services/licitacion-formatter.service';
import { EmbeddingTextBuilder } from './embedding-text.builder';
import { SemanticIndexerService } from './semantic-indexer.service';
import { SemanticIndexerScheduler } from './semantic-indexer.scheduler';
import { SemanticSearchService } from './semantic-search.service';
import { SemanticAdminController } from './semantic-admin.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Licitacion, OrganoContratacion]),
    AiModule,
  ],
  controllers: [SemanticAdminController],
  providers: [
    EmbeddingTextBuilder,
    SearchQueryBuilderService,
    LicitacionFormatterService,
    SemanticIndexerService,
    SemanticIndexerScheduler,
    SemanticSearchService,
  ],
  exports: [SemanticSearchService, SemanticIndexerService],
})
export class SemanticModule {}