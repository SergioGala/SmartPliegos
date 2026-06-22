import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SemanticIndexerService } from './semantic-indexer.service';

@Injectable()
export class SemanticIndexerScheduler {
  private readonly logger = new Logger(SemanticIndexerScheduler.name);
  private running = false;

  constructor(private readonly indexer: SemanticIndexerService) {}

  @Cron('*/10 * * * *', { name: 'semantic-index' })
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