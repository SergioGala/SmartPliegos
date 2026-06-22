import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Licitacion } from '../scraping/shared/entities/licitacion.entity';
import { AiService } from '../ai/ai.service';
import { EmbeddingTextBuilder } from './embedding-text.builder';
import { EMBEDDINGS_PROVIDER, type IEmbeddingsProvider } from '../../infrastructure/ai';

@Injectable()
export class SemanticIndexerService {
  private readonly logger = new Logger(SemanticIndexerService.name);

  constructor(
    @InjectRepository(Licitacion) private readonly licRepo: Repository<Licitacion>,
    private readonly ai: AiService,
    private readonly textBuilder: EmbeddingTextBuilder,
    @Inject(EMBEDDINGS_PROVIDER) private readonly embeddings: IEmbeddingsProvider,
  ) {}

  get enabled(): boolean {
    return this.embeddings.isConfigured;
  }

  /** Pendientes = nunca indexados o modificados desde el último indexado. */
  private pendingQuery() {
    return this.licRepo
      .createQueryBuilder('l')
      .where('l.indexedAt IS NULL OR l.indexedAt < l.updatedAt')
      .orderBy('l.updatedAt', 'ASC');
  }

  async countPending(): Promise<number> {
    return this.pendingQuery().getCount();
  }
  
    async countTotal(): Promise<number> {
    return this.licRepo.count();
  }

  /** Indexa un lote. Devuelve cuántos vectores subió. Seguro de re-ejecutar. */
  async indexPending(batchSize = 100): Promise<number> {
    if (!this.enabled) {
      this.logger.warn('Indexación desactivada (OPENAI_API_KEY ausente)');
      return 0;
    }

    const rows = await this.pendingQuery().take(batchSize).getMany();
    if (rows.length === 0) return 0;

    const texts = rows.map((l) => this.textBuilder.build(l));
    const vectors = await this.ai.embedBatch(texts);

    const records = rows.map((l, i) => ({
      id: l.id,
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

    await this.ai.upsertLicitacionVectors(records);

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

  /** Backfill histórico: itera lotes hasta vaciar la cola. */
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