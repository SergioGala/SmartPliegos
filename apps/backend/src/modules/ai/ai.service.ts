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