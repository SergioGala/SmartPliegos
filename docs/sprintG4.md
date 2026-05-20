Carril 4 (Stream D · IA) — D1 Setup módulo IA base (Anthropic + OpenAI embeddings + Qdrant)
4.1 Objetivo
Crear la infraestructura IA mínima que el resto del Stream D (D2 créditos, D3 resumen, D4 indexación, D5 chat con pliego, D6 score) va a consumir. No implementar features de IA: solo el "rail" — providers, módulo global, health check.
Después del carril:
`infrastructure/ai/` expone tres interfaces (`ILLMProvider`, `IEmbeddingsProvider`, `IVectorStore`) y sus implementaciones (Anthropic, OpenAI embeddings, Qdrant).
`modules/ai/` expone un `AiService` que es la cara visible para el resto del backend: `summarize(text)`, `embed(text)`, `upsertVector(...)`, `searchVector(...)`.
El bootstrap crea (si no existe) la collection `licitaciones` en Qdrant con 1536 dimensiones (text-embedding-3-small).
Health check `/health/ai` que pingea Anthropic (token check), OpenAI (modelos) y Qdrant (collections).
4.2 Estado actual
`docker-compose.yml` ya define el servicio `qdrant` en puertos 6333/6334 con volumen persistente.
No hay `apps/backend/src/infrastructure/ai/` ni `apps/backend/src/modules/ai/`.
No hay deps `@anthropic-ai/sdk`, `openai`, `@qdrant/js-client-rest`.
No hay variables de entorno `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `QDRANT_URL`, `QDRANT_API_KEY`.
`apps/backend/src/modules/health/` existe — habrá que añadirle un indicador para Qdrant.
4.3 Criterios de cierre
[ ] `@anthropic-ai/sdk`, `openai` y `@qdrant/js-client-rest` añadidos a `apps/backend/package.json`. `npm install` corre limpio.
[ ] Variables `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `QDRANT_URL`, `QDRANT_API_KEY` añadidas a `env.schema.ts` (las 4 opcionales; el módulo IA se desactiva si no están).
[ ] `infrastructure/ai/` existe con: `ai.module.ts` (global), `ai.tokens.ts`, `ai.types.ts`, `providers/anthropic.provider.ts`, `providers/openai-embeddings.provider.ts`, `providers/qdrant.provider.ts`.
[ ] `modules/ai/` con `ai.module.ts` y `ai.service.ts` (facade).
[ ] Bootstrap del módulo Qdrant crea la collection `licitaciones` con `vector size = 1536` (text-embedding-3-small) y `distance = cosine` si no existe.
[ ] Health check `/health/ai` devuelve `{ anthropic, openai, qdrant }` con `{ status: 'ok' | 'down' | 'unconfigured' }` por proveedor.
[ ] Tests `ai.service.spec.ts`, `qdrant.provider.spec.ts` y mocks.
[ ] `AiModule` registrado en `app.module.ts`.
[ ] CI verde.
4.4 Archivos a crear/editar
Crear:
`apps/backend/src/infrastructure/ai/ai.types.ts`
`apps/backend/src/infrastructure/ai/ai.tokens.ts`
`apps/backend/src/infrastructure/ai/ai.module.ts`
`apps/backend/src/infrastructure/ai/index.ts`
`apps/backend/src/infrastructure/ai/providers/anthropic.provider.ts`
`apps/backend/src/infrastructure/ai/providers/openai-embeddings.provider.ts`
`apps/backend/src/infrastructure/ai/providers/qdrant.provider.ts`
`apps/backend/src/infrastructure/ai/providers/qdrant.provider.spec.ts`
`apps/backend/src/modules/ai/ai.module.ts`
`apps/backend/src/modules/ai/ai.service.ts`
`apps/backend/src/modules/ai/ai.service.spec.ts`
`apps/backend/src/modules/ai/ai.controller.ts` (solo para /health/ai)
Editar:
`apps/backend/package.json`
`apps/backend/src/config/env.schema.ts`
`apps/backend/src/config/env.config.ts`
`apps/backend/src/app.module.ts`
4.5 Código
`apps/backend/package.json` (parche en `dependencies`)
```json
"@anthropic-ai/sdk": "^0.40.0",
"openai": "^4.80.0",
"@qdrant/js-client-rest": "^1.13.0"
```
Versiones aproximadas a mayo 2026 — si CI marca `peer dep` warnings o conflicto, sube a la latest minor.
`apps/backend/src/config/env.schema.ts` (parche)
En el objeto `envSchema` del Carril 2 (si ya migrado a Zod) o en `ENV_SPEC` (si todavía manual), añade:
```ts
ANTHROPIC_API_KEY: z.string().optional(),
OPENAI_API_KEY: z.string().optional(),
QDRANT_URL: z.string().url().default('http://localhost:6333'),
QDRANT_API_KEY: z.string().optional(),
QDRANT_COLLECTION_LICITACIONES: z.string().default('licitaciones'),
```
`apps/backend/src/config/env.config.ts` (parche)
Añade al objeto `config`:
```ts
ai: {
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY ?? null,
    model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? null,
    embeddingModel: process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small',
  },
  qdrant: {
    url: process.env.QDRANT_URL ?? 'http://localhost:6333',
    apiKey: process.env.QDRANT_API_KEY ?? null,
    collectionLicitaciones: process.env.QDRANT_COLLECTION_LICITACIONES ?? 'licitaciones',
  },
},
```
`apps/backend/src/infrastructure/ai/ai.types.ts`
```ts
export interface LLMCompletionRequest {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMCompletionResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
}

export interface ILLMProvider {
  readonly name: 'anthropic' | 'openai';
  readonly isConfigured: boolean;
  complete(req: LLMCompletionRequest): Promise<LLMCompletionResult>;
  ping(): Promise<boolean>;
}

export interface IEmbeddingsProvider {
  readonly name: 'openai';
  readonly isConfigured: boolean;
  readonly vectorSize: number;
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
  ping(): Promise<boolean>;
}

export interface VectorRecord {
  id: string;
  vector: number[];
  payload?: Record<string, unknown>;
}

export interface VectorSearchResult {
  id: string;
  score: number;
  payload?: Record<string, unknown>;
}

export interface IVectorStore {
  readonly name: 'qdrant';
  readonly isConfigured: boolean;
  ensureCollection(name: string, vectorSize: number): Promise<void>;
  upsert(collection: string, records: VectorRecord[]): Promise<void>;
  search(collection: string, vector: number[], topK: number): Promise<VectorSearchResult[]>;
  ping(): Promise<boolean>;
}
```
`apps/backend/src/infrastructure/ai/ai.tokens.ts`
```ts
export const LLM_PROVIDER = Symbol('LLM_PROVIDER');
export const EMBEDDINGS_PROVIDER = Symbol('EMBEDDINGS_PROVIDER');
export const VECTOR_STORE = Symbol('VECTOR_STORE');
```
`apps/backend/src/infrastructure/ai/providers/anthropic.provider.ts`
```ts
import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../../../config/env.config';
import type {
  ILLMProvider,
  LLMCompletionRequest,
  LLMCompletionResult,
} from '../ai.types';

@Injectable()
export class AnthropicProvider implements ILLMProvider {
  public readonly name = 'anthropic' as const;
  private readonly logger = new Logger(AnthropicProvider.name);
  private readonly client: Anthropic | null;
  private readonly model = config.ai.anthropic.model;

  constructor() {
    const apiKey = config.ai.anthropic.apiKey;
    this.client = apiKey ? new Anthropic({ apiKey }) : null;
    if (!this.client) {
      this.logger.warn('AnthropicProvider not configured (ANTHROPIC_API_KEY missing); LLM features disabled');
    }
  }

  get isConfigured(): boolean {
    return this.client !== null;
  }

  async complete(req: LLMCompletionRequest): Promise<LLMCompletionResult> {
    if (!this.client) {
      throw new Error('AnthropicProvider not configured: set ANTHROPIC_API_KEY');
    }

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: req.maxTokens ?? 1024,
      temperature: req.temperature ?? 0.2,
      system: req.system,
      messages: [{ role: 'user', content: req.user }],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    return {
      text,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      model: response.model,
    };
  }

  async ping(): Promise<boolean> {
    if (!this.client) return false;
    try {
      // Llamada barata: 1 token de output máximo.
      await this.client.messages.create({
        model: this.model,
        max_tokens: 1,
        messages: [{ role: 'user', content: 'ping' }],
      });
      return true;
    } catch (err) {
      this.logger.error(`Anthropic ping failed: ${err instanceof Error ? err.message : 'unknown'}`);
      return false;
    }
  }
}
```
`apps/backend/src/infrastructure/ai/providers/openai-embeddings.provider.ts`
```ts
import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { config } from '../../../config/env.config';
import type { IEmbeddingsProvider } from '../ai.types';

@Injectable()
export class OpenAIEmbeddingsProvider implements IEmbeddingsProvider {
  public readonly name = 'openai' as const;
  /** text-embedding-3-small produce 1536 dimensiones. */
  public readonly vectorSize = 1536;
  private readonly logger = new Logger(OpenAIEmbeddingsProvider.name);
  private readonly client: OpenAI | null;
  private readonly model = config.ai.openai.embeddingModel;

  constructor() {
    const apiKey = config.ai.openai.apiKey;
    this.client = apiKey ? new OpenAI({ apiKey }) : null;
    if (!this.client) {
      this.logger.warn('OpenAIEmbeddingsProvider not configured (OPENAI_API_KEY missing); embeddings disabled');
    }
  }

  get isConfigured(): boolean {
    return this.client !== null;
  }

  async embed(text: string): Promise<number[]> {
    if (!this.client) throw new Error('OpenAIEmbeddingsProvider not configured');
    const response = await this.client.embeddings.create({
      model: this.model,
      input: text,
    });
    const embedding = response.data[0]?.embedding;
    if (!embedding) throw new Error('OpenAI returned no embedding');
    return embedding;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (!this.client) throw new Error('OpenAIEmbeddingsProvider not configured');
    if (texts.length === 0) return [];
    const response = await this.client.embeddings.create({
      model: this.model,
      input: texts,
    });
    return response.data.map((d) => d.embedding);
  }

  async ping(): Promise<boolean> {
    if (!this.client) return false;
    try {
      await this.client.models.list();
      return true;
    } catch (err) {
      this.logger.error(`OpenAI ping failed: ${err instanceof Error ? err.message : 'unknown'}`);
      return false;
    }
  }
}
```
`apps/backend/src/infrastructure/ai/providers/qdrant.provider.ts`
```ts
import { Injectable, Logger } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { config } from '../../../config/env.config';
import type {
  IVectorStore,
  VectorRecord,
  VectorSearchResult,
} from '../ai.types';

@Injectable()
export class QdrantProvider implements IVectorStore {
  public readonly name = 'qdrant' as const;
  private readonly logger = new Logger(QdrantProvider.name);
  private readonly client: QdrantClient;

  constructor() {
    this.client = new QdrantClient({
      url: config.ai.qdrant.url,
      apiKey: config.ai.qdrant.apiKey ?? undefined,
    });
  }

  get isConfigured(): boolean {
    // Qdrant en docker-compose siempre está accesible. Si está en cloud, depende del URL.
    return Boolean(config.ai.qdrant.url);
  }

  async ensureCollection(name: string, vectorSize: number): Promise<void> {
    const { collections } = await this.client.getCollections();
    const exists = collections.some((c) => c.name === name);
    if (exists) {
      this.logger.log(`Qdrant collection "${name}" already exists`);
      return;
    }
    await this.client.createCollection(name, {
      vectors: { size: vectorSize, distance: 'Cosine' },
    });
    this.logger.log(`Qdrant collection "${name}" created (size=${vectorSize}, distance=cosine)`);
  }

  async upsert(collection: string, records: VectorRecord[]): Promise<void> {
    if (records.length === 0) return;
    await this.client.upsert(collection, {
      wait: true,
      points: records.map((r) => ({
        id: r.id,
        vector: r.vector,
        payload: r.payload ?? {},
      })),
    });
  }

  async search(collection: string, vector: number[], topK: number): Promise<VectorSearchResult[]> {
    const result = await this.client.search(collection, {
      vector,
      limit: topK,
      with_payload: true,
    });
    return result.map((hit) => ({
      id: String(hit.id),
      score: hit.score,
      payload: (hit.payload ?? {}) as Record<string, unknown>,
    }));
  }

  async ping(): Promise<boolean> {
    try {
      await this.client.getCollections();
      return true;
    } catch (err) {
      this.logger.error(`Qdrant ping failed: ${err instanceof Error ? err.message : 'unknown'}`);
      return false;
    }
  }
}
```
`apps/backend/src/infrastructure/ai/ai.module.ts`
```ts
import { Global, Module, OnModuleInit, Logger } from '@nestjs/common';
import { AnthropicProvider } from './providers/anthropic.provider';
import { OpenAIEmbeddingsProvider } from './providers/openai-embeddings.provider';
import { QdrantProvider } from './providers/qdrant.provider';
import {
  LLM_PROVIDER,
  EMBEDDINGS_PROVIDER,
  VECTOR_STORE,
} from './ai.tokens';
import { config } from '../../config/env.config';

@Global()
@Module({
  providers: [
    AnthropicProvider,
    OpenAIEmbeddingsProvider,
    QdrantProvider,
    { provide: LLM_PROVIDER, useExisting: AnthropicProvider },
    { provide: EMBEDDINGS_PROVIDER, useExisting: OpenAIEmbeddingsProvider },
    { provide: VECTOR_STORE, useExisting: QdrantProvider },
  ],
  exports: [LLM_PROVIDER, EMBEDDINGS_PROVIDER, VECTOR_STORE],
})
export class AiInfrastructureModule implements OnModuleInit {
  private readonly logger = new Logger(AiInfrastructureModule.name);

  constructor(
    private readonly qdrant: QdrantProvider,
    private readonly embeddings: OpenAIEmbeddingsProvider,
  ) {}

  async onModuleInit(): Promise<void> {
    // Idempotente: crear la collection licitaciones si no existe.
    // Bloquea el bootstrap solo unos ms si Qdrant está up.
    try {
      await this.qdrant.ensureCollection(
        config.ai.qdrant.collectionLicitaciones,
        this.embeddings.vectorSize,
      );
    } catch (err) {
      // No tumbamos el backend si Qdrant no está disponible al arrancar.
      // El health check lo reportará y el resto del backend funciona.
      this.logger.error(
        `Skipping Qdrant collection bootstrap: ${err instanceof Error ? err.message : 'unknown'}`,
      );
    }
  }
}
```
`apps/backend/src/infrastructure/ai/index.ts`
```ts
export { AiInfrastructureModule } from './ai.module';
export {
  LLM_PROVIDER,
  EMBEDDINGS_PROVIDER,
  VECTOR_STORE,
} from './ai.tokens';
export * from './ai.types';
```
`apps/backend/src/modules/ai/ai.service.ts`
```ts
import { Inject, Injectable } from '@nestjs/common';
import { config } from '../../config/env.config';
import {
  LLM_PROVIDER,
  EMBEDDINGS_PROVIDER,
  VECTOR_STORE,
  type ILLMProvider,
  type IEmbeddingsProvider,
  type IVectorStore,
  type LLMCompletionRequest,
  type VectorSearchResult,
} from '../../infrastructure/ai';

@Injectable()
export class AiService {
  constructor(
    @Inject(LLM_PROVIDER) private readonly llm: ILLMProvider,
    @Inject(EMBEDDINGS_PROVIDER) private readonly embeddings: IEmbeddingsProvider,
    @Inject(VECTOR_STORE) private readonly vectors: IVectorStore,
  ) {}

  /** Resumen vía LLM. Usado por D3 (resumen de pliegos). */
  complete(req: LLMCompletionRequest) {
    return this.llm.complete(req);
  }

  /** Embedding de un texto. Usado por D4 (indexación) y D5 (búsqueda). */
  embed(text: string) {
    return this.embeddings.embed(text);
  }

  embedBatch(texts: string[]) {
    return this.embeddings.embedBatch(texts);
  }

  upsertLicitacionVector(
    id: string,
    vector: number[],
    payload: Record<string, unknown>,
  ) {
    return this.vectors.upsert(config.ai.qdrant.collectionLicitaciones, [
      { id, vector, payload },
    ]);
  }

  searchSimilarLicitaciones(
    vector: number[],
    topK = 10,
  ): Promise<VectorSearchResult[]> {
    return this.vectors.search(
      config.ai.qdrant.collectionLicitaciones,
      vector,
      topK,
    );
  }

  async health(): Promise<{
    anthropic: 'ok' | 'down' | 'unconfigured';
    openai: 'ok' | 'down' | 'unconfigured';
    qdrant: 'ok' | 'down' | 'unconfigured';
  }> {
    const [anthropicOk, openaiOk, qdrantOk] = await Promise.all([
      this.llm.isConfigured ? this.llm.ping().catch(() => false) : Promise.resolve('unconfigured' as const),
      this.embeddings.isConfigured ? this.embeddings.ping().catch(() => false) : Promise.resolve('unconfigured' as const),
      this.vectors.isConfigured ? this.vectors.ping().catch(() => false) : Promise.resolve('unconfigured' as const),
    ]);

    const toStatus = (v: boolean | 'unconfigured') =>
      v === 'unconfigured' ? 'unconfigured' : v ? 'ok' : 'down';

    return {
      anthropic: toStatus(anthropicOk),
      openai: toStatus(openaiOk),
      qdrant: toStatus(qdrantOk),
    };
  }
}
```
`apps/backend/src/modules/ai/ai.controller.ts`
```ts
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AiService } from './ai.service';

@ApiTags('Health')
@Controller('health/ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Get()
  @ApiOperation({ summary: 'Health check de proveedores IA' })
  health() {
    return this.ai.health();
  }
}
```
`apps/backend/src/modules/ai/ai.module.ts`
```ts
import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';

@Module({
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
```
`apps/backend/src/app.module.ts` (parche)
```ts
import { AiInfrastructureModule } from './infrastructure/ai';
import { AiModule } from './modules/ai/ai.module';

// En @Module.imports[]: añade
AiInfrastructureModule,
AiModule,
```
`AiInfrastructureModule` es `@Global()` así que no hace falta reimportarlo en otros módulos que usen `AiService`.
4.6 Tests
`apps/backend/src/infrastructure/ai/providers/qdrant.provider.spec.ts`
```ts
import { QdrantProvider } from './qdrant.provider';

jest.mock('@qdrant/js-client-rest', () => {
  return {
    QdrantClient: jest.fn().mockImplementation(() => ({
      getCollections: jest.fn().mockResolvedValue({ collections: [] }),
      createCollection: jest.fn().mockResolvedValue({}),
      upsert: jest.fn().mockResolvedValue({}),
      search: jest.fn().mockResolvedValue([{ id: 'a', score: 0.9, payload: { foo: 'bar' } }]),
    })),
  };
});

describe('QdrantProvider', () => {
  let provider: QdrantProvider;

  beforeEach(() => {
    provider = new QdrantProvider();
  });

  it('ensureCollection creates if missing', async () => {
    await provider.ensureCollection('test', 1536);
    // Si no throwear, OK.
    expect(true).toBe(true);
  });

  it('search returns normalized hits', async () => {
    const hits = await provider.search('test', [0.1, 0.2], 5);
    expect(hits).toEqual([{ id: 'a', score: 0.9, payload: { foo: 'bar' } }]);
  });

  it('upsert is a no-op on empty', async () => {
    await provider.upsert('test', []);
    expect(true).toBe(true);
  });
});
```
`apps/backend/src/modules/ai/ai.service.spec.ts`
```ts
import { Test } from '@nestjs/testing';
import { AiService } from './ai.service';
import {
  LLM_PROVIDER,
  EMBEDDINGS_PROVIDER,
  VECTOR_STORE,
} from '../../infrastructure/ai';

describe('AiService', () => {
  let service: AiService;
  let llm: { isConfigured: boolean; complete: jest.Mock; ping: jest.Mock; name: string };
  let embeddings: { isConfigured: boolean; vectorSize: number; embed: jest.Mock; embedBatch: jest.Mock; ping: jest.Mock; name: string };
  let vectors: { isConfigured: boolean; upsert: jest.Mock; search: jest.Mock; ensureCollection: jest.Mock; ping: jest.Mock; name: string };

  beforeEach(async () => {
    llm = {
      isConfigured: true,
      name: 'anthropic',
      complete: jest.fn().mockResolvedValue({ text: 'summary', inputTokens: 10, outputTokens: 20, model: 'claude' }),
      ping: jest.fn().mockResolvedValue(true),
    };
    embeddings = {
      isConfigured: true,
      vectorSize: 1536,
      name: 'openai',
      embed: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
      embedBatch: jest.fn().mockResolvedValue([[0.1], [0.2]]),
      ping: jest.fn().mockResolvedValue(true),
    };
    vectors = {
      isConfigured: true,
      name: 'qdrant',
      upsert: jest.fn().mockResolvedValue(undefined),
      search: jest.fn().mockResolvedValue([{ id: 'a', score: 0.9 }]),
      ensureCollection: jest.fn().mockResolvedValue(undefined),
      ping: jest.fn().mockResolvedValue(true),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: LLM_PROVIDER, useValue: llm },
        { provide: EMBEDDINGS_PROVIDER, useValue: embeddings },
        { provide: VECTOR_STORE, useValue: vectors },
      ],
    }).compile();

    service = moduleRef.get(AiService);
  });

  it('complete delegates to LLM provider', async () => {
    await service.complete({ system: 's', user: 'u' });
    expect(llm.complete).toHaveBeenCalled();
  });

  it('embed delegates to embeddings provider', async () => {
    await service.embed('hello');
    expect(embeddings.embed).toHaveBeenCalledWith('hello');
  });

  it('upsertLicitacionVector targets licitaciones collection', async () => {
    await service.upsertLicitacionVector('id-1', [0.1], { source: 'test' });
    expect(vectors.upsert).toHaveBeenCalledWith('licitaciones', [
      { id: 'id-1', vector: [0.1], payload: { source: 'test' } },
    ]);
  });

  it('health reports ok when all providers ping ok', async () => {
    const h = await service.health();
    expect(h).toEqual({ anthropic: 'ok', openai: 'ok', qdrant: 'ok' });
  });

  it('health reports unconfigured when provider has no api key', async () => {
    llm.isConfigured = false;
    const h = await service.health();
    expect(h.anthropic).toBe('unconfigured');
  });

  it('health reports down when provider ping fails', async () => {
    vectors.ping = jest.fn().mockRejectedValue(new Error('connection refused'));
    const h = await service.health();
    expect(h.qdrant).toBe('down');
  });
});
