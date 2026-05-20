import { Module } from '@nestjs/common';
import { ScrapingController } from './scraping.controller';
import { ScrapingService } from './scraping.service';
import { PlaceModule } from './place/place.module';
import { BoeModule } from './boe';
import { SharedModule } from './shared/shared.module';
import { ScrapingScheduler } from './services/scraping-scheduler.service';

@Module({
  imports: [PlaceModule, BoeModule, SharedModule],
  controllers: [ScrapingController],
  providers: [ScrapingService, ScrapingScheduler],
  exports: [PlaceModule, BoeModule, SharedModule],
})
export class ScrapingModule {}
