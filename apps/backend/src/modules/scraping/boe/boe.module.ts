import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoeScraperService } from './boe-scraper.service';
import { BoeParserService } from './boe-parser.service';
import { Licitacion } from '../shared/entities/licitacion.entity';
import { ScrapingLog } from '../shared/entities/scraping-log.entity';

@Module({
  imports: [
    HttpModule.register({ timeout: 60_000 }),
    TypeOrmModule.forFeature([Licitacion, ScrapingLog]),
  ],
  providers: [BoeScraperService, BoeParserService],
  exports: [BoeScraperService],
})
export class BoeModule {}
