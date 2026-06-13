\# Sprint 2 · Búsqueda semántica — `L`

\> Saltamos Favoritos por decisión tuya. Esta es la feature que \*\*cablea la infra IA ya montada\*\*: indexar licitaciones en Qdrant + endpoint semántico + búsqueda híbrida (texto + significado). Es la primera pieza que justifica tener `@qdrant/js-client-rest` y `openai` en el `package.json`.

\## 2.1 Objetivo

Que el buscador entienda \*\*significado\*\*, no solo palabras. Hoy `GET /licitaciones?q=...` usa `plainto\_tsquery('spanish', ...)` sobre `searchVector` ([search-query-builder.service.ts:34-42](apps/backend/src/modules/licitaciones/services/search-query-builder.service.ts:34)): si buscas "limpieza de hospitales" no encuentra "servicio de higienización de centros sanitarios". Tras este sprint:

1. \*\*Indexación incremental:\*\* cada licitación se convierte en un vector (OpenAI `text-embedding-3-small`, 1536 dims) y se sube a la collection `licitaciones` de Qdrant (que \*\*ya se crea sola\*\* en el bootstrap, [ai.module.ts:32-47](apps/backend/src/infrastructure/ai/ai.module.ts:32)). Un cron mantiene el índice al día y un endpoint admin hace el backfill histórico.
1. \*\*Búsqueda híbrida:\*\* `GET /licitaciones?q=...&mode=hybrid` fusiona el ranking full-text (PostgreSQL) con el de similitud vectorial (Qdrant) por \*\*RRF (Reciprocal Rank Fusion)\*\*. Los filtros estructurados (estado, CCAA, importe, fechas…) \*\*siguen mandando\*\*: PostgreSQL es la fuente de verdad de filtros.
1. \*\*Degradación elegante:\*\* sin `OPENAI\_API\_KEY`, `mode=semantic/hybrid` cae a full-text y el indexador es un no-op con warning. Nada se rompe.

\*\*No incluye:\*\* chat/RAG sobre pliegos (Feature 11) ni alertas semánticas (Feature 3, que consumirá lo que montamos aquí).

\## 2.2 Estado actual (verificado)

- \*\*Infra lista pero muerta:\*\* `AiService` ya expone `embed`, `embedBatch`, `upsertLicitacionVector`, `searchSimilarLicitaciones` ([ai.service.ts:28-55](apps/backend/src/modules/ai/ai.service.ts:28)). `QdrantProvider.search/upsert/ensureCollection` funcionan ([qdrant.provider.ts](apps/backend/src/infrastructure/ai/providers/qdrant.provider.ts)). `OpenAIEmbeddingsProvider.vectorSize = 1536` ([openai-embeddings.provider.ts:10](apps/backend/src/infrastructure/ai/providers/openai-embeddings.provider.ts:10)). \*\*Nadie los llama\*\* salvo el resumen, que solo usa `complete()`.
- \*\*`Licitacion`\*\* tiene `id` UUID (válido como point id de Qdrant), `title`, `description`, `cpvCodes[]`, `resumenIA`, y `updatedAt` (`@UpdateDateColumn`) ([licitacion.entity.ts:24-124](apps/backend/src/modules/scraping/shared/entities/licitacion.entity.ts:24)). \*\*No hay\*\* marca de "indexado".
- \*\*Búsqueda actual:\*\* `LicitacionesService.search(dto)` arma el query con `SearchQueryBuilderService` y pagina con `getManyAndCount` ([licitaciones.service.ts:60-100](apps/backend/src/modules/licitaciones/licitaciones.service.ts:60)). DTO con Zod ([search-licitaciones.dto.ts:35](apps/backend/src/modules/licitaciones/dto/search-licitaciones.dto.ts:35)). El front ya manda filtros como query params ([licitaciones.api.ts](apps/frontend/src/features/licitaciones/api/licitaciones.api.ts)).
- \*\*Cron pattern\*\* existente con lock `isRunning` ([scraping-scheduler.service.ts:34-53](apps/backend/src/modules/scraping/services/scraping-scheduler.service.ts:34)). `@nestjs/schedule` ya es dependencia.
- \*\*Clave:\*\* como `updatedAt` se autoactualiza en cada `save`, \*\*no hace falta tocar el scraper\*\*: el indexador detecta pendientes con `WHERE indexedAt IS NULL OR indexedAt < updatedAt`.

\## 2.3 Criterios de cierre

- [ ] `Licitacion.indexedAt` (timestamptz, nullable) + migración. Índice parcial para localizar pendientes rápido.
- [ ] `EmbeddingTextBuilder`: construye el texto a embeber (title + description + CPVs legibles + resumenIA) y lo trunca a un límite seguro de tokens.
- [ ] `SemanticIndexerService.indexPending(batchSize)`: coge pendientes, `embedBatch`, `upsert` a Qdrant con payload, marca `indexedAt = now()`. Idempotente, resistente a fallos parciales.
- [ ] Cron de indexación (cada 10 min) con lock; \*\*gated\*\* por `embeddings.isConfigured`.
- [ ] `POST /admin/semantic/reindex` (SUPER\_ADMIN): backfill histórico en background; `GET /admin/semantic/status` devuelve `{ total, indexed, pending }`.
- [ ] `SemanticSearchService.search(dto)`: modo `text` (actual), `semantic` (Qdrant→PG con filtros), `hybrid` (RRF). Filtros estructurados aplican en los 3 modos.
- [ ] `GET /licitaciones?...&mode=` integrado. Sin `OPENAI\_API\_KEY` → cae a `text` transparentemente. Respuesta mantiene el shape `ISearchResponse` + añade `mode` efectivo y `score` por item.
- [ ] Front: toggle "Búsqueda inteligente" en `/buscar` (persistido en URL `?mode=hybrid`), badge de relevancia opcional. Traducciones en los 6 idiomas.
- [ ] Tests: indexer (mock embeddings+qdrant), RRF (unitario puro), search service (modos + fallback). CI verde.
- [ ] `/health/ai` y un log de arranque dejan claro si la indexación está activa.

\## 2.4 Archivos a crear / editar

\*\*Crear\*\*

\```

apps/backend/src/modules/semantic/semantic.module.ts

apps/backend/src/modules/semantic/embedding-text.builder.ts

apps/backend/src/modules/semantic/semantic-indexer.service.ts

apps/backend/src/modules/semantic/semantic-indexer.scheduler.ts

apps/backend/src/modules/semantic/semantic-search.service.ts

apps/backend/src/modules/semantic/rrf.ts

apps/backend/src/modules/semantic/semantic-admin.controller.ts

apps/backend/src/modules/semantic/semantic-search.service.spec.ts

apps/backend/src/modules/semantic/rrf.spec.ts

apps/backend/src/database/migrations/1782000000000-AddLicitacionIndexedAt.ts

\```

\*\*Editar\*\*

\```

apps/backend/src/modules/scraping/shared/entities/licitacion.entity.ts   (indexedAt)

apps/backend/src/modules/licitaciones/dto/search-licitaciones.dto.ts      (mode)

apps/backend/src/modules/licitaciones/licitaciones.service.ts            (delega a SemanticSearchService)

apps/backend/src/modules/licitaciones/licitaciones.module.ts             (importa SemanticModule)

apps/backend/src/modules/licitaciones/licitaciones.controller.ts         (ApiQuery mode)

apps/backend/src/app.module.ts                                            (SemanticModule)

apps/frontend/src/features/licitaciones/types.ts                          (mode + score)

apps/frontend/src/features/licitaciones/pages/buscar-page.tsx             (toggle)

apps/frontend/src/i18n/locales/\*/search.json                             (6 idiomas)

\```

\## 2.5 Código

\### Entidad + migración

`licitacion.entity.ts` — añade junto a `pliegosProcesados`:

\```ts

@Column({ type: 'timestamptz', nullable: true })

@Index('idx\_licitaciones\_indexed\_at')

indexedAt!: Date | null;

\```

`1782000000000-AddLicitacionIndexedAt.ts`:

\```ts

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLicitacionIndexedAt1782000000000 implements MigrationInterface {

public async up(q: QueryRunner): Promise<void> {

await q.query(`ALTER TABLE "licitaciones" ADD COLUMN IF NOT EXISTS "indexedAt" TIMESTAMPTZ`);

// Índice parcial: localizar pendientes en O(pendientes), no O(total)

await q.query(

`CREATE INDEX IF NOT EXISTS "idx\_licitaciones\_pending\_index"

ON "licitaciones" ("updatedAt")

WHERE "indexedAt" IS NULL OR "indexedAt" < "updatedAt"`,

);

}

public async down(q: QueryRunner): Promise<void> {

await q.query(`DROP INDEX IF EXISTS "idx\_licitaciones\_pending\_index"`);

await q.query(`ALTER TABLE "licitaciones" DROP COLUMN IF EXISTS "indexedAt"`);

}

}

\```

\### Texto a embeber

`embedding-text.builder.ts` — un buen embedding necesita texto compacto y representativo:

\```ts

import { Injectable } from '@nestjs/common';

import { Licitacion } from '../scraping/shared/entities/licitacion.entity';

@Injectable()

export class EmbeddingTextBuilder {

/\*\* ~8000 chars ≈ <2k tokens: barato y por debajo del límite de 8191 del modelo. \*/

private readonly MAX\_CHARS = 8000;

build(lic: Pick<Licitacion, 'title' | 'description' | 'cpvCodes' | 'resumenIA' | 'tipoContrato' | 'ccaa'>): string {

const parts = [

lic.title,

lic.tipoContrato ? `Tipo: ${lic.tipoContrato}` : null,

lic.ccaa ? `Ubicación: ${lic.ccaa}` : null,

lic.cpvCodes?.length ? `CPV: ${lic.cpvCodes.join(', ')}` : null,

lic.resumenIA ?? lic.description ?? null, // resumen IA si existe; si no, descripción

].filter(Boolean);

return parts.join('\n').slice(0, this.MAX\_CHARS).trim();

}

}

\```

\### RRF (función pura, testeable)

`rrf.ts`:

\```ts

export interface RankedId { id: string; }

/\*\*

* Reciprocal Rank Fusion. Fusiona N listas ya ordenadas (mejor primero).
* score(id) = Σ 1 / (k + rank\_en\_lista\_i).  k=60 es el valor canónico.
* No necesita normalizar escalas (ts\_rank vs cosine) — solo posiciones.

\*/

export function reciprocalRankFusion(

lists: RankedId[][],

k = 60,

): Array<{ id: string; score: number }> {

const scores = new Map<string, number>();

for (const list of lists) {

list.forEach((item, idx) => {

const prev = scores.get(item.id) ?? 0;

scores.set(item.id, prev + 1 / (k + idx + 1));

});

}

return [...scores.entries()]

.map(([id, score]) => ({ id, score }))

.sort((a, b) => b.score - a.score);

}

\```

\### Indexador

`semantic-indexer.service.ts`:

\```ts

import { Injectable, Logger, Inject } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository, IsNull } from 'typeorm';

import { Licitacion } from '../scraping/shared/entities/licitacion.entity';

import { AiService } from '../ai/ai.service';

import { EmbeddingTextBuilder } from './embedding-text.builder';

import { EMBEDDINGS\_PROVIDER, type IEmbeddingsProvider } from '../../infrastructure/ai';

@Injectable()

export class SemanticIndexerService {

private readonly logger = new Logger(SemanticIndexerService.name);

constructor(

@InjectRepository(Licitacion) private readonly licRepo: Repository<Licitacion>,

private readonly ai: AiService,

private readonly textBuilder: EmbeddingTextBuilder,

@Inject(EMBEDDINGS\_PROVIDER) private readonly embeddings: IEmbeddingsProvider,

) {}

get enabled(): boolean {

return this.embeddings.isConfigured;

}

/\*\* Pendientes = nunca indexados o modificados desde el último indexado. \*/

private pendingQuery() {

return this.licRepo

.createQueryBuilder('l')

.where('l.indexedAt IS NULL OR l.indexedAt < l.updatedAt')

.orderBy('l.updatedAt', 'ASC');

}

async countPending(): Promise<number> {

return this.pendingQuery().getCount();

}

/\*\* Indexa un lote. Devuelve cuántos vectores subió. Seguro de re-ejecutar. \*/

async indexPending(batchSize = 100): Promise<number> {

if (!this.enabled) {

this.logger.warn('Indexación desactivada (OPENAI\_API\_KEY ausente)');

return 0;

}

const rows = await this.pendingQuery().take(batchSize).getMany();

if (rows.length === 0) return 0;

const texts = rows.map((l) => this.textBuilder.build(l));

const vectors = await this.ai.embedBatch(texts);

const records = rows.map((l, i) => ({

id: l.id, // UUID → válido para Qdrant

vector: vectors[i],

payload: {

source: l.source,

estado: l.estado,

ccaa: l.ccaa,

provincia: l.provincia,

tipoContrato: l.tipoContrato,

cpvCodes: l.cpvCodes,

presupuestoBase: l.presupuestoBase,

fechaPublicacion: l.fechaPublicacion?.toISOString() ?? null,

title: l.title?.slice(0, 200),

},

}));

// upsert directo a la collection (AiService.upsertLicitacionVector es 1-a-1; aquí batch)

await this.ai['vectors'].upsert(

// si prefieres no tocar visibilidad, añade un método batch en AiService:

// this.ai.upsertLicitacionVectors(records)

(await import('../../config/env.config')).config.ai.qdrant.collectionLicitaciones,

records,

);

const now = new Date();

await this.licRepo

.createQueryBuilder()

.update(Licitacion)

.set({ indexedAt: now })

.whereInIds(rows.map((r) => r.id))

.execute();

this.logger.log(`Indexadas ${rows.length} licitaciones`);

return rows.length;

}

/\*\* Backfill histórico: itera lotes hasta vaciar la cola. \*/

async reindexAll(batchSize = 100): Promise<number> {

let total = 0;

for (;;) {

const n = await this.indexPending(batchSize);

total += n;

if (n < batchSize) break;

}

this.logger.log(`Backfill completo: ${total} licitaciones`);

return total;

}

}

\```

\> \*\*Limpieza recomendada en `AiService`:\*\* añade un método batch público para no acceder a `this.ai['vectors']`:

\> ```ts

\> upsertLicitacionVectors(records: { id: string; vector: number[]; payload: Record<string, unknown> }[]) {

\>   return this.vectors.upsert(config.ai.qdrant.collectionLicitaciones, records);

\> }

\> ```

\> y en el indexer usa `this.ai.upsertLicitacionVectors(records)`.

`semantic-indexer.scheduler.ts` (mismo patrón que `ScrapingScheduler`):

\```ts

import { Injectable, Logger } from '@nestjs/common';

import { Cron } from '@nestjs/schedule';

import { SemanticIndexerService } from './semantic-indexer.service';

@Injectable()

export class SemanticIndexerScheduler {

private readonly logger = new Logger(SemanticIndexerScheduler.name);

private running = false;

constructor(private readonly indexer: SemanticIndexerService) {}

@Cron('\*/10 \* \* \* \*', { name: 'semantic-index' })

async run(): Promise<void> {

if (!this.indexer.enabled || this.running) return;

this.running = true;

try {

const n = await this.indexer.indexPending(100);

if (n > 0) this.logger.log(`[Cron] Indexadas ${n}`);

} catch (e) {

this.logger.error(`[Cron] Indexación: ${e instanceof Error ? e.message : 'unknown'}`);

} finally {

this.running = false;

}

}

}

\```

\### Búsqueda híbrida

`semantic-search.service.ts` — el corazón del sprint. PostgreSQL filtra; Qdrant aporta semántica; RRF fusiona:

\```ts

import { Injectable, Logger, Inject } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Licitacion } from '../scraping/shared/entities/licitacion.entity';

import { SearchQueryBuilderService } from '../licitaciones/services/search-query-builder.service';

import { LicitacionFormatterService } from '../licitaciones/services/licitacion-formatter.service';

import { SearchLicitacionesDto } from '../licitaciones/dto/search-licitaciones.dto';

import { ISearchResponse } from '../licitaciones/interfaces/search-response.interface';

import { AiService } from '../ai/ai.service';

import { EMBEDDINGS\_PROVIDER, type IEmbeddingsProvider } from '../../infrastructure/ai';

import { reciprocalRankFusion } from './rrf';

const CANDIDATE\_POOL = 300; // candidatos por señal antes de fusionar

@Injectable()

export class SemanticSearchService {

private readonly logger = new Logger(SemanticSearchService.name);

constructor(

@InjectRepository(Licitacion) private readonly licRepo: Repository<Licitacion>,

private readonly queryBuilder: SearchQueryBuilderService,

private readonly formatter: LicitacionFormatterService,

private readonly ai: AiService,

@Inject(EMBEDDINGS\_PROVIDER) private readonly embeddings: IEmbeddingsProvider,

) {}

/\*\* Aplica SOLO los filtros estructurados del dto (sin full-text, sin orden, sin paginar). \*/

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

async search(dto: SearchLicitacionesDto): Promise<ISearchResponse<any> & { mode: string }> {

const wantSemantic = (dto.mode === 'semantic' || dto.mode === 'hybrid') && !!dto.q?.trim();

// Fallback transparente si no hay embeddings configurados

const effectiveMode = wantSemantic && this.embeddings.isConfigured ? dto.mode! : 'text';

if (effectiveMode === 'text') {

const res = await this.textSearch(dto);

return { ...res, mode: 'text' };

}

const page = Math.max(1, dto.page ?? 1);

const pageSize = Math.min(Math.max(1, dto.pageSize ?? 20), 100);

// 1) Candidatos full-text (filtrados) con ts\_rank

const textBase = this.filteredBase(dto);

const textRows = dto.q?.trim()

? await textBase

.andWhere(`l."searchVector" @@ plainto\_tsquery('spanish', :q)`, { q: dto.q.trim() })

.addSelect(`ts\_rank(l."searchVector", plainto\_tsquery('spanish', :q))`, 'rank')

.orderBy('rank', 'DESC')

.take(CANDIDATE\_POOL)

.getMany()

: [];

const textIds = textRows.map((r) => ({ id: r.id }));

// 2) Candidatos semánticos (Qdrant) → intersectados con el set filtrado

const queryVector = await this.ai.embed(dto.q!.trim());

const hits = await this.ai.searchSimilarLicitaciones(queryVector, CANDIDATE\_POOL);

const semanticIdsAll = hits.map((h) => h.id);

let allowedSemantic: { id: string }[] = [];

if (semanticIdsAll.length) {

const allowedRows = await this.filteredBase(dto)

.andWhere('l.id = ANY(:ids)', { ids: semanticIdsAll })

.select('l.id', 'id')

.getRawMany<{ id: string }>();

const allowed = new Set(allowedRows.map((r) => r.id));

allowedSemantic = semanticIdsAll.filter((id) => allowed.has(id)).map((id) => ({ id })); // mantiene orden de Qdrant

}

// 3) Fusión

const fused =

effectiveMode === 'semantic'

? allowedSemantic.map((x, i) => ({ id: x.id, score: 1 / (60 + i + 1) }))

: reciprocalRankFusion([allowedSemantic, textIds]);

const total = fused.length;

const pageSlice = fused.slice((page - 1) \* pageSize, (page - 1) \* pageSize + pageSize);

// 4) Hidratar filas en el orden fusionado

const rows = await this.licRepo.find({

where: { id: In(pageSlice.map((p) => p.id)) },

relations: ['organo'],

});

const byId = new Map(rows.map((r) => [r.id, r]));

const data = pageSlice

.map((p) => {

const row = byId.get(p.id);

return row ? { ...this.formatter.formatList(row), \_score: p.score } : null;

})

.filter(Boolean);

return {

data,

total,

page,

pageSize,

totalPages: Math.ceil(total / pageSize),

hasMore: page \* pageSize < total,

mode: effectiveMode,

};

}

/\*\* Búsqueda full-text actual (movida tal cual desde LicitacionesService.search). \*/

private async textSearch(dto: SearchLicitacionesDto): Promise<ISearchResponse<any>> {

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

const [data, total] = await qb.skip((page - 1) \* pageSize).take(pageSize).getManyAndCount();

return {

data: data.map((l) => this.formatter.formatList(l)),

total, page, pageSize,

totalPages: Math.ceil(total / pageSize),

hasMore: page \* pageSize < total,

};

}

}

\```

\> Importa `In` de `typeorm`. \*\*Ojo con un detalle real del código:\*\* `SearchQueryBuilderService` guarda el `qb` en estado de instancia y lo resetea en `build()`. Como aquí lo invoco dos veces (`filteredBase`) en la misma request, cada cadena debe terminar en `.build()` antes de empezar otra — el código de arriba ya lo respeta. Si te preocupa la concurrencia entre requests (es un singleton con estado mutable), este sprint es buen momento para anotar la deuda; el patrón actual ya tiene ese riesgo en producción.

\### DTO + delegación + controller

`search-licitaciones.dto.ts` — añade al schema y a la clase Swagger:

\```ts

mode: z.enum(['text', 'semantic', 'hybrid']).optional(),

\```

\```ts

@ApiPropertyOptional({ enum: ['text', 'semantic', 'hybrid'], description: 'Estrategia de búsqueda (default: text)' })

mode?: 'text' | 'semantic' | 'hybrid';

\```

`licitaciones.service.ts` — `search()` delega:

\```ts

// inyecta private readonly semanticSearch: SemanticSearchService

async search(dto: SearchLicitacionesDto) {

return this.semanticSearch.search(dto);

}

\```

`licitaciones.module.ts` — `imports: [..., SemanticModule]`. `semantic.module.ts` exporta `SemanticSearchService` y reexporta lo necesario (importa `AiModule`, `TypeOrmModule.forFeature([Licitacion])`, y provee `SearchQueryBuilderService`/`LicitacionFormatterService` o los importa del módulo de licitaciones — evita ciclo extrayéndolos a un `LicitacionesSharedModule` si hiciera falta).

`semantic-admin.controller.ts`:

\```ts

@ApiTags('🔧 Admin · Semantic')

@Controller('admin/semantic')

export class SemanticAdminController {

constructor(private readonly indexer: SemanticIndexerService) {}

@Post('reindex')

@SecureAuthEndpoint()

@RequireRoles(Role.SUPER\_ADMIN)

@HttpCode(HttpStatus.ACCEPTED)

@ApiOperation({ summary: 'Backfill del índice semántico (background)' })

reindex() {

void this.indexer.reindexAll(100); // fire-and-forget; responde 202

return { message: 'Reindexación lanzada en background' };

}

@Get('status')

@SecureAuthEndpoint()

@RequireRoles(Role.SUPER\_ADMIN)

async status() {

const [total, pending] = await Promise.all([

this.indexer['licRepo'].count(),

this.indexer.countPending(),

]);

return { total, indexed: total - pending, pending, enabled: this.indexer.enabled };

}

}

\```

\### Frontend (toggle)

`types.ts` → `SearchParams` añade `mode?: 'text' | 'hybrid'` y `LicitacionCard` un `\_score?: number` opcional. En `buscar-page.tsx`, junto a `searchText`, un switch (usa `@radix-ui/react-switch`, ya instalado) "Búsqueda inteligente" que hace `commit({ ...params, mode: on ? 'hybrid' : undefined })`. El `toParams` de `licitaciones.api.ts` ya serializa `mode` sin cambios. Traducción `search.smartToggle` en los 6 locales.

\## 2.6 Verificación / demo

1. `docker compose up -d qdrant`, `OPENAI\_API\_KEY` en `.env`, `npm run migration:run`.
1. Arrancar backend → log de bootstrap "collection licitaciones existe" + scheduler activo.
1. `POST /api/v1/admin/semantic/reindex` (token SUPER\_ADMIN) → esperar → `GET /admin/semantic/status` muestra `pending: 0`.
1. Comparar: `GET /licitaciones?q=limpieza de hospitales&mode=text` vs `&mode=hybrid`. El híbrido debe traer "higienización de centros sanitarios", "desinfección hospitalaria", etc.
1. Filtros + semántica: `?q=...&mode=hybrid&estado=ABIERTA&ccaa=Madrid` → todos los resultados respetan los filtros.
1. Quitar `OPENAI\_API\_KEY` y reiniciar → `mode=hybrid` responde `"mode":"text"` sin error. `/health/ai` marca `openai: unconfigured`.
1. `npm run test` + `type-check` verdes.

\## 2.7 Orden de frentes (dentro del sprint)

1. \*\*Datos\*\* — entidad `indexedAt` + migración (1 commit, base de todo).
1. \*\*Indexación\*\* — `EmbeddingTextBuilder` + `SemanticIndexerService` + admin endpoint + backfill. Demo: vectores en Qdrant. \*(`feat(semantic): indexación de licitaciones en Qdrant`)\*
1. \*\*Cron\*\* — scheduler de indexación incremental.
1. \*\*Búsqueda\*\* — `rrf.ts` + `SemanticSearchService` + `mode` en DTO/controller. \*(`feat(semantic): búsqueda híbrida texto+vectorial`)\*
1. \*\*Front\*\* — toggle + i18n. \*(`feat(search): toggle de búsqueda inteligente`)\*

\> Riesgo a vigilar: coste/latencia de OpenAI en el backfill inicial (miles de licitaciones). El batch de 100 + `text-embedding-3-small` lo hace barato (~$0.02/1M tokens), pero lanza el primer `reindex` fuera de hora punta.

\---

Sprint 2 listo. El siguiente sería \*\*Sprint 3 · Alertas semánticas\*\*, que es más corto de lo que parece: el `triggerAlertsForLicitacion` y el digest \*\*ya existen\*\* ([alerts.service.ts:332](apps/backend/src/modules/alerts/alerts.service.ts:332)), así que consistirá en sustituir el matching por palabra (`matchesKeywordsCriteria`) por matching vectorial reusando lo que acabamos de montar. ¿Sigo con el Sprint 3?
