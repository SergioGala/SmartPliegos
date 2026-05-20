import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PlaceScraperService } from '../place/place-scraper.service';
import { BoeScraperService } from '../boe';

@Injectable()
export class ScrapingScheduler {
  private readonly logger = new Logger(ScrapingScheduler.name);
  private isRunning = false;
  private isBoeRunning = false;

  constructor(
    private readonly placeScraper: PlaceScraperService,
    private readonly boeScraper: BoeScraperService,
  ) {}

  @Cron('0 8 * * *', { name: 'scraping-boe', timeZone: 'Europe/Madrid' })
  async runBoe(): Promise<void> {
    if (this.isBoeRunning) {
      this.logger.warn('[Cron] BOE ya en ejecución, skip');
      return;
    }
    this.isBoeRunning = true;
    try {
      const result = await this.boeScraper.scrapeDay(new Date());
      this.logger.log(`[Cron] BOE ${result.date}: ${result.newItems} new, ${result.updatedItems} updated`);
    } catch (err) {
      this.logger.error(`[Cron] BOE error: ${err instanceof Error ? err.message : 'unknown'}`);
    } finally {
      this.isBoeRunning = false;
    }
  }

  @Cron('*/5 * * * *', { name: 'scraping-place' })
  async runScraping(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('[Cron] Ya en ejecución, skip');
      return;
    }
    this.isRunning = true;
    this.logger.log('[Cron] Scraping PLACE...');
    try {
      const r = (await this.placeScraper.scrapeCurrentFeed(5));
      this.logger.log(
        `[Cron] PLACE: ${r.newItems} new, ${r.updatedItems} updated`,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      this.logger.error(`[Cron] Error: ${msg}`);
    } finally {
      this.isRunning = false;
    }
  }
}
