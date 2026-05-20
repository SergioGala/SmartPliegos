import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { Licitacion } from '../shared/entities/licitacion.entity';
import { ScrapingLog } from '../shared/entities/scraping-log.entity';
import { BoeParserService } from './boe-parser.service';
import { BoeParsedDisposicion, BoeSumarioResponse } from './boe.types';

export interface ScrapeResult {
  source: 'BOE';
  date: string;
  newItems: number;
  updatedItems: number;
  errors: number;
  durationMs: number;
}

@Injectable()
export class BoeScraperService {
  private readonly logger = new Logger(BoeScraperService.name);
  private readonly BASE_URL = 'https://www.boe.es/datosabiertos/api/boe/sumario';

  constructor(
    @InjectRepository(Licitacion)
    private readonly licRepo: Repository<Licitacion>,
    @InjectRepository(ScrapingLog)
    private readonly logRepo: Repository<ScrapingLog>,
    private readonly http: HttpService,
    private readonly parser: BoeParserService,
    private readonly dataSource: DataSource,
  ) {}

  async scrapeDay(date: Date): Promise<ScrapeResult> {
    const startedAt = new Date();
    const dateStr = this.toBoeDateParam(date);
    const isoDate = date.toISOString().slice(0, 10);

    const log = await this.logRepo.save(
      this.logRepo.create({ source: 'BOE', status: 'RUNNING', startedAt }),
    );

    let newItems = 0;
    let updatedItems = 0;
    let errors = 0;

    try {
      const sumario = await this.fetchSumario(dateStr);
      if (!sumario) {
        this.logger.log(`BOE sumario for ${isoDate} not available (404). Empty day.`);
      } else {
        const disposiciones = this.parser.parseSumario(sumario);
        this.logger.log(`BOE ${isoDate}: ${disposiciones.length} disposiciones in section III`);

        await this.dataSource.transaction(async (manager) => {
          const licRepoTx = manager.getRepository(Licitacion);
          for (const disp of disposiciones) {
            try {
              const status = await this.upsert(disp, licRepoTx);
              if (status === 'new') newItems += 1;
              else if (status === 'updated') updatedItems += 1;
            } catch (err) {
              errors += 1;
              this.logger.error(
                `BOE upsert error for ${disp.externalId}: ${err instanceof Error ? err.message : 'unknown'}`,
              );
            }
          }
        });
      }

      const finishedAt = new Date();
      await this.logRepo.update(log.id, {
        status: 'SUCCESS',
        itemsNew: newItems,
        itemsUpdated: updatedItems,
        itemsErrors: errors,
        duration: finishedAt.getTime() - startedAt.getTime(),
        finishedAt,
      });

      return { source: 'BOE', date: isoDate, newItems, updatedItems, errors, durationMs: finishedAt.getTime() - startedAt.getTime() };
    } catch (err) {
      const finishedAt = new Date();
      await this.logRepo.update(log.id, {
        status: 'FAILED',
        itemsErrors: 1,
        duration: finishedAt.getTime() - startedAt.getTime(),
        finishedAt,
      });
      throw err;
    }
  }

  async scrapeRange(from: Date, to: Date): Promise<ScrapeResult[]> {
    if (to < from) throw new Error('scrapeRange: "to" must be >= "from"');
    const results: ScrapeResult[] = [];
    const cursor = new Date(from.getTime());
    while (cursor <= to) {
      results.push(await this.scrapeDay(new Date(cursor.getTime())));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return results;
  }

  private async fetchSumario(yyyymmdd: string): Promise<BoeSumarioResponse | null> {
    const url = `${this.BASE_URL}/${yyyymmdd}`;
    try {
      const response = await firstValueFrom(
        this.http.get<BoeSumarioResponse>(url, {
          headers: { Accept: 'application/json' },
          timeout: 30_000,
        }),
      );
      return response.data;
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 404) {
        return null;
      }
      throw err;
    }
  }

  private async upsert(
    disp: BoeParsedDisposicion,
    licRepo: Repository<Licitacion>,
  ): Promise<'new' | 'updated'> {
    const existing = await licRepo.findOneBy({ externalId: disp.externalId, source: 'BOE' });

    const documentos = [
      disp.urlPdf ? { tipo: 'pdf', url: disp.urlPdf } : null,
      disp.urlXml ? { tipo: 'xml', url: disp.urlXml } : null,
      disp.urlHtml ? { tipo: 'html', url: disp.urlHtml } : null,
    ].filter((d): d is { tipo: string; url: string } => d !== null);

    if (existing) {
      await licRepo.update(existing.id, {
        title: disp.titulo,
        description: disp.epigrafeNombre,
        fechaPublicacion: disp.fechaPublicacion,
        documentos: documentos as any,
      });
      return 'updated';
    }

    const nueva = licRepo.create();
    nueva.externalId = disp.externalId;
    nueva.source = 'BOE';
    nueva.title = disp.titulo;
    nueva.description = disp.epigrafeNombre;
    nueva.cpvCodes = [];
    nueva.presupuestoBase = null;
    nueva.presupuestoConIva = null;
    nueva.tipoContrato = null;
    nueva.procedimiento = null;
    nueva.estado = 'PUBLICADO';
    nueva.tramitacion = null;
    nueva.ccaa = null;
    nueva.provincia = null;
    nueva.municipio = null;
    nueva.fechaPublicacion = disp.fechaPublicacion;
    nueva.fechaPresentacion = null;
    nueva.fechaAdjudicacion = null;
    nueva.adjudicatarioNombre = null;
    nueva.adjudicatarioNif = null;
    nueva.importeAdjudicacion = null;
    nueva.porcentajeBaja = null;
    nueva.numLicitadores = null;
    nueva.tieneLotes = false;
    nueva.documentos = documentos;
    nueva.organoId = null;
    await licRepo.save(nueva);
    return 'new';
  }

  private toBoeDateParam(date: Date): string {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}${m}${d}`;
  }
}
