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
      payload: (hit.payload ?? {}),
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