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