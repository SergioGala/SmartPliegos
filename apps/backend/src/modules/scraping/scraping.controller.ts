 
 
import {
  Controller,
  Post,
  Get,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlaceScraperService } from './place/place-scraper.service';
import { PlaceHistoricalService } from './place/place-historical.service';
import { BoeScraperService } from './boe';
import { Licitacion } from './shared/entities/licitacion.entity';
import { ScrapingLog } from './shared/entities/scraping-log.entity';
import { ZodBody } from '../../common/zod';
import { runPlaceSchema, type RunPlaceDto } from './dto/run-place.dto';
import { runBoeSchema, type RunBoeDto } from './dto/run-boe.dto';
import { ScrapingResultDtoSwagger } from './dto/scraping-result.dto';
import { SecureAuthEndpoint, RequireRoles } from '../../common/decorators';
import { Role } from '../users/enums';

@ApiTags('Scraping')
@Controller('scraping')
export class ScrapingController {
  constructor(
    private readonly placeScraper: PlaceScraperService,
    private readonly placeHistorical: PlaceHistoricalService,
    private readonly boeScraper: BoeScraperService,
    @InjectRepository(Licitacion)
    private readonly licitacionRepo: Repository<Licitacion>,
    @InjectRepository(ScrapingLog)
    private readonly logRepo: Repository<ScrapingLog>
  ) { }

  @Post('boe/run')
  @SecureAuthEndpoint()
  @RequireRoles(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Ejecutar scraper BOE para un día (sección III)' })
  @ApiResponse({ status: 202, description: 'Scraping BOE iniciado' })
  async runBoe(@ZodBody(runBoeSchema) dto: RunBoeDto) {
    const target = dto.date ? new Date(`${dto.date}T00:00:00Z`) : new Date();
    return this.boeScraper.scrapeDay(target);
  }

  @Post('place/run')
  @SecureAuthEndpoint()
  @RequireRoles(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.ACCEPTED)

  @ApiOperation({
    summary: 'Ejecutar scraping de PLACE manualmente',
    description:
      'Scrappea las últimas licitaciones de PLACE (páginas configurables)',
  })
  @ApiResponse({
    status: 202,
    description: 'Scraping iniciado exitosamente',
    type: ScrapingResultDtoSwagger,
  })
  async runPlace(@ZodBody(runPlaceSchema) dto: RunPlaceDto) {
    return this.placeScraper.scrapeCurrentFeed(dto.maxPages ?? 3);
  }

  @Post('place/historical/:period')
  @SecureAuthEndpoint()
  @RequireRoles(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Cargar histórico de PLACE por período',
    description:
      'Descarga y procesa un ZIP con licitaciones del período especificado',
  })
  @ApiParam({
    name: 'period',
    description: 'Período en formato YYYY o YYYYMM (ej: 2024, 202604)',
    example: '202604',
  })
  @ApiResponse({
    status: 202,
    description: 'Carga de histórico iniciada',
    type: ScrapingResultDtoSwagger,
  })
  async loadHistorical(@Param('period') params: string) {
    return this.placeHistorical.loadHistorical(params);
  }

  @Post('place/historical-all')
  @SecureAuthEndpoint()
  @RequireRoles(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Cargar TODO el histórico de PLACE',
    description:
      'Procesa todos los períodos de 2024 hasta presente (30-60 min)',
  })
  @ApiResponse({
    status: 202,
    description: 'Carga completa iniciada',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          period: { example: '2024' },
          newItems: { example: 1000 },
          errors: { example: 5 },
          duration: { example: '60s' },
        },
      },
    },
  })
  async loadAll() {
    return this.placeHistorical.loadAll();
  }

  @Get('stats')
  @SecureAuthEndpoint()
  @RequireRoles(Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Obtener estadísticas de licitaciones',
    description:
      'Retorna conteos de licitaciones por estado y datos del último scraping',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas',
    schema: {
      type: 'object',
      properties: {
        totalLicitaciones: { type: 'number', example: 5420 },
        abiertas: { type: 'number', example: 1230 },
        adjudicadas: { type: 'number', example: 4190 },
        ultimoScraping: {
          type: 'object',
          nullable: true,
          properties: {
            fecha: { type: 'string', format: 'date-time' },
            estado: { type: 'string', enum: ['SUCCESS', 'PARTIAL', 'PENDING'] },
            nuevas: { type: 'number' },
            actualizadas: { type: 'number' },
            errores: { type: 'number' },
            duracion: { type: 'string', example: '5230ms' },
          },
        },
      },
    },
  })
  async stats() {
    const total = await this.licitacionRepo.count();
    const abiertas = await this.licitacionRepo.count({
      where: { estado: 'ABIERTA' },
    });
    const adjudicadas = await this.licitacionRepo.count({
      where: { estado: 'ADJUDICADA' },
    });
    const lastLog = await this.logRepo.findOne({
      where: { source: 'PLACE' },
      order: { startedAt: 'DESC' },
    });

    return {
      totalLicitaciones: total,
      abiertas,
      adjudicadas,
      ultimoScraping: lastLog
        ? {
          fecha: lastLog.startedAt,
          estado: lastLog.status,
          nuevas: lastLog.itemsNew,
          actualizadas: lastLog.itemsUpdated,
          errores: lastLog.itemsErrors,
          duracion: `${lastLog.duration}ms`,
        }
        : null,
    };
  }
}
