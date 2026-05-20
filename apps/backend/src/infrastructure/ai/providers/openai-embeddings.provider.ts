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