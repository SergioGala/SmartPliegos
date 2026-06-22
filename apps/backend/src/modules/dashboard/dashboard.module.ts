import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FavoritoEntity } from '../favoritos/entities';
import { AlertEntity } from '../alerts/entities';
import { Licitacion } from '../scraping/shared/entities/licitacion.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FavoritoEntity, Licitacion, AlertEntity])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}