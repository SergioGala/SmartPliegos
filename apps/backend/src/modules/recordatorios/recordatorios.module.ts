import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecordatorioEntity } from './recordatorio.entity';
import { Licitacion } from '../scraping/shared/entities/licitacion.entity';
import { RecordatoriosService } from './recordatorios.service';
import { RecordatoriosController } from './recordatorios.controller';
import { RecordatoriosScheduler } from './recordatorios.scheduler';
import { FavoritosModule } from '../favoritos/favoritos.module';
import { EmailModule } from '../../infrastructure/email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RecordatorioEntity, Licitacion]),
    FavoritosModule, // expone FavoritosService (plazos de guardadas)
    EmailModule,     // expone EmailService (envío de avisos)
  ],
  controllers: [RecordatoriosController],
  providers: [RecordatoriosService, RecordatoriosScheduler],
})
export class RecordatoriosModule {}
