import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RecordatoriosService } from './recordatorios.service';

@Injectable()
export class RecordatoriosScheduler {
  private readonly logger = new Logger(RecordatoriosScheduler.name);
  private running = false;

  constructor(private readonly service: RecordatoriosService) {}

  @Cron('*/15 * * * *', { name: 'recordatorios-send' })
  async run(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      await this.service.sendDue();
    } catch (e) {
      this.logger.error(`[Cron] recordatorios: ${e instanceof Error ? e.message : 'unknown'}`);
    } finally {
      this.running = false;
    }
  }
}