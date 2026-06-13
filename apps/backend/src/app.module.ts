import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WinstonModule } from 'nest-winston';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { typeormConfig } from './config/typeorm.config';
import { winstonConfig } from './config/winston-nest.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { HealthModule } from './modules/health/health.module';
import { ScrapingModule } from './modules/scraping/scraping.module';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { LicitacionesModule } from './modules/licitaciones/licitaciones.module';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { FavoritosModule } from './modules/favoritos/favoritos.module';
import { SearchModule } from './modules/search/search.module';
import { OrganosModule } from './modules/organos/organos.module';
import { RedisModule } from './infrastructure/redis';
import { RequestIdMiddleware } from './common/middleware';
import { AiInfrastructureModule } from './infrastructure/ai';
import { AiModule } from './modules/ai/ai.module';
import { SemanticModule } from './modules/semantic/semantic.module';
import { StorageModule } from './infrastructure/storage';
import { DocumentsModule } from './modules/documents/documents.module';
import { RecordatoriosModule } from './modules/recordatorios/recordatorios.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot(typeormConfig),
    WinstonModule.forRoot(winstonConfig),
    ScheduleModule.forRoot(),
    HttpModule.register({ timeout: 120000 }),
    AuthModule,
    UsersModule,
    HealthModule,
    ScrapingModule,
    LicitacionesModule,
    InvitationsModule,
    AlertsModule,
    FavoritosModule,
    SearchModule,
    OrganosModule,
    RedisModule,
    AiInfrastructureModule,
    AiModule,
    SemanticModule,
    StorageModule,
    DocumentsModule,
    RecordatoriosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}