import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Licitacion } from '../scraping/shared/entities/licitacion.entity';
import { SearchQueryBuilderService } from '../licitaciones/services/search-query-builder.service';
import { LicitacionFormatterService } from '../licitaciones/services/licitacion-formatter.service';
import { SearchLicitacionesDto } from '../licitaciones/dto/search-licitaciones.dto';
import { ISearchResponse } from '../licitaciones/interfaces/search-response.interface';
import { LicitacionListItemDto } from '../licitaciones/interfaces/licitacion-formatter.interface';
import { AiService } from '../ai/ai.service';
import { EMBEDDINGS_PROVIDER, type IEmbeddingsProvider } from '../../infrastructure/ai';
import { reciprocalRankFusion } from './rrf';

const CANDIDATE_POOL = 300; // candidatos por señal antes de fusionar

@Injectable()
export class SemanticSearchService {
  private readonly logger = new Logger(SemanticSearchService.name);

  constructor(
    @InjectRepository(Licitacion) private readonly licRepo: Repository<Licitacion>,
    private readonly queryBuilder: SearchQueryBuilderService,
    private readonly formatter: LicitacionFormatterService,
    private readonly ai: AiService,
    @Inject(EMBEDDINGS_PROVIDER) private readonly embeddings: IEmbeddingsProvider,
  ) {}

  /** Aplica SOLO los filtros estructurados del dto (sin full-text, sin orden, sin paginar). */
  private filteredBase(dto: SearchLicitacionesDto) {
    return this.queryBuilder
      .addStateFilter(dto.estado)
      .addTypeFilter(dto.tipoContrato)
      .addProcedureFilter(dto.procedimiento)
      .addUrgencyFilter(dto.tramitacion)
      .addLocationFilters(dto.ccaa, dto.provincia)
      .addCpvFilter(dto.cpv)
      .addPriceRange(dto.importeMin, dto.importeMax)
      .addPublicationDateRange(
        dto.fechaDesde ? new Date(dto.fechaDesde) : undefined,
        dto.fechaHasta ? new Date(dto.fechaHasta) : undefined,
      )
      .addOpenDeadlineFilter(dto.soloConPlazo)
      .addOrganoFilter(dto.organoId)
      .build();
  }

  async search(dto: SearchLicitacionesDto): Promise<ISearchResponse<LicitacionListItemDto> & { mode: string }> {
    const wantSemantic = (dto.mode === 'semantic' || dto.mode === 'hybrid') && !!dto.q?.trim();

    // Fallback transparente si no hay embeddings configurados
    const effectiveMode = wantSemantic && this.embeddings.isConfigured ? dto.mode! : 'text';

    if (effectiveMode === 'text') {
      const res = await this.textSearch(dto);
      return { ...res, mode: 'text' };
    }

    const page = Math.max(1, dto.page ?? 1);
    const pageSize = Math.min(Math.max(1, dto.pageSize ?? 20), 100);

    // 1) Candidatos full-text (filtrados) con ts_rank
    const textBase = this.filteredBase(dto);
    const textRows = dto.q?.trim()
      ? await textBase
          .andWhere(`l."searchVector" @@ plainto_tsquery('spanish', :q)`, { q: dto.q.trim() })
          .addSelect(`ts_rank(l."searchVector", plainto_tsquery('spanish', :q))`, 'rank')
          .orderBy('rank', 'DESC')
          .take(CANDIDATE_POOL)
          .getMany()
      : [];
    const textIds = textRows.map((r) => ({ id: r.id }));

    // 2) Candidatos semánticos (Qdrant) → intersectados con el set filtrado
    const queryVector = await this.ai.embed(dto.q!.trim());
    const hits = await this.ai.searchSimilarLicitaciones(queryVector, CANDIDATE_POOL);
    const semanticIdsAll = hits.map((h) => h.id);

    let allowedSemantic: { id: string }[] = [];
    if (semanticIdsAll.length) {
      const allowedRows = await this.filteredBase(dto)
        .andWhere('l.id = ANY(:ids)', { ids: semanticIdsAll })
        .select('l.id', 'id')
        .getRawMany<{ id: string }>();

      const allowed = new Set(allowedRows.map((r) => r.id));
      allowedSemantic = semanticIdsAll
        .filter((id) => allowed.has(id))
        .map((id) => ({ id })); // mantiene orden de Qdrant
    }

    // 3) Fusión
    const fused =
      effectiveMode === 'semantic'
        ? allowedSemantic.map((x, i) => ({ id: x.id, score: 1 / (60 + i + 1) }))
        : reciprocalRankFusion([allowedSemantic, textIds]);

    const total = fused.length;
    const pageSlice = fused.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

    // 4) Hidratar filas en el orden fusionado
    const rows = await this.licRepo.find({
      where: { id: In(pageSlice.map((p) => p.id)) },
      relations: ['organo'],
    });

    const byId = new Map(rows.map((r) => [r.id, r]));
    const data = pageSlice
      .map((p) => {
        const row = byId.get(p.id);
        return row ? { ...this.formatter.formatList(row), _score: p.score } : null;
      })
      .filter(Boolean) as LicitacionListItemDto[];

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      hasMore: page * pageSize < total,
      mode: effectiveMode,
    };
  }

  /** Búsqueda full-text actual (movida tal cual desde LicitacionesService.search). */
  private async textSearch(dto: SearchLicitacionesDto): Promise<ISearchResponse<LicitacionListItemDto>> {
    const page = Math.max(1, dto.page ?? 1);
    const pageSize = Math.min(Math.max(1, dto.pageSize ?? 20), 100);

    const qb = this.queryBuilder
      .addFullTextSearch(dto.q)
      .addStateFilter(dto.estado)
      .addTypeFilter(dto.tipoContrato)
      .addProcedureFilter(dto.procedimiento)
      .addUrgencyFilter(dto.tramitacion)
      .addLocationFilters(dto.ccaa, dto.provincia)
      .addCpvFilter(dto.cpv)
      .addPriceRange(dto.importeMin, dto.importeMax)
      .addPublicationDateRange(
        dto.fechaDesde ? new Date(dto.fechaDesde) : undefined,
        dto.fechaHasta ? new Date(dto.fechaHasta) : undefined,
      )
      .addOpenDeadlineFilter(dto.soloConPlazo)
      .addOrganoFilter(dto.organoId)
      .applyOrderBy(dto.sortBy, dto.sortOrder)
      .build();

    const [data, total] = await qb.skip((page - 1) * pageSize).take(pageSize).getManyAndCount();

    return {
      data: data.map((l) => this.formatter.formatList(l)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      hasMore: page * pageSize < total,
    };
  }
}