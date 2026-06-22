import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import pdfParse from 'pdf-parse';


import { PliegoDocument, PliegoStatus } from './entities/pliego-document.entity';
import { Licitacion } from '../scraping/shared/entities/licitacion.entity';
import { STORAGE_PROVIDER, type IStorageProvider } from '../../infrastructure/storage';

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB
const DOWNLOAD_TIMEOUT_MS = 30_000;
const SNIPPET_CONTEXT = 120;
const MAX_SNIPPETS = 20;
const parsePdf = pdfParse as unknown as (data: Buffer) => Promise<{ text: string }>;


export interface PliegoSnippet {
  /** Posición del match dentro del texto extraído. */
  index: number;
  before: string;
  match: string;
  after: string;
}

@Injectable()
export class PliegosService {
  private readonly logger = new Logger(PliegosService.name);

  constructor(
    @InjectRepository(PliegoDocument)
    private readonly pliegosRepo: Repository<PliegoDocument>,
    @InjectRepository(Licitacion)
    private readonly licitacionesRepo: Repository<Licitacion>,
    @Inject(STORAGE_PROVIDER)
    private readonly storage: IStorageProvider,
  ) {}

  /** Lista los pliegos de una licitación (sin el texto extraído). */
  async findByLicitacion(licitacionId: string) {
    const docs = await this.pliegosRepo.find({
      where: { licitacionId },
      order: { createdAt: 'ASC' },
    });
    return docs.map((d) => this.toListItem(d));
  }

  /**
   * Descarga e indexa los documentos de la licitación. Idempotente:
   * solo procesa sourceUrls que no existan aún o que estén en ERROR.
   */
  async sync(licitacionId: string) {
    const licitacion = await this.licitacionesRepo.findOne({
      where: { id: licitacionId },
    });
    if (!licitacion) {
      throw new NotFoundException('Licitación no encontrada');
    }

    const fuentes = (licitacion.documentos ?? []).filter((d) => !!d.url);
    if (!fuentes.length) {
      return { processed: 0, ready: 0, errors: 0, documents: [] };
    }

    const existing = await this.pliegosRepo.find({ where: { licitacionId } });
    const byUrl = new Map(existing.map((e) => [e.sourceUrl, e]));

    let ready = 0;
    let errors = 0;

    for (const fuente of fuentes) {
      const prev = byUrl.get(fuente.url);
      if (prev && prev.status === PliegoStatus.READY) continue; // ya descargado

      const doc =
        prev ??
        this.pliegosRepo.create({
          licitacionId,
          tipo: fuente.tipo ?? 'OTRO',
          nombre: fuente.nombre ?? null,
          sourceUrl: fuente.url,
          status: PliegoStatus.PENDING,
        });

      try {
        await this.downloadAndExtract(doc);
        ready++;
      } catch (err) {
        doc.status = PliegoStatus.ERROR;
        doc.errorMessage =
          err instanceof Error ? err.message.slice(0, 480) : 'Error desconocido';
        errors++;
        this.logger.warn(`Pliego falló (${fuente.url}): ${doc.errorMessage}`);
      }

      await this.pliegosRepo.save(doc);
    }

    const documents = await this.findByLicitacion(licitacionId);
    return { processed: ready + errors, ready, errors, documents };
  }

  /** Devuelve el stream del PDF para servirlo en el visor. */
  async getFile(pliegoId: string) {
    const doc = await this.pliegosRepo.findOne({ where: { id: pliegoId } });
    if (!doc || doc.status !== PliegoStatus.READY || !doc.storageKey) {
      throw new NotFoundException('Pliego no disponible');
    }

    const stream = await this.storage.getStream(doc.storageKey);
    return {
      stream,
      mimeType: doc.mimeType ?? 'application/pdf',
      filename: doc.nombre ?? 'pliego.pdf',
    };
  }

  /** Busca un término dentro del texto extraído y devuelve snippets con contexto. */
  async search(pliegoId: string, q: string): Promise<PliegoSnippet[]> {
    // extractedText tiene select:false → hay que pedirlo explícitamente.
    const doc = await this.pliegosRepo
      .createQueryBuilder('p')
      .addSelect('p.extractedText')
      .where('p.id = :pliegoId', { pliegoId })
      .getOne();

    if (!doc) throw new NotFoundException('Pliego no encontrado');
    if (doc.status !== PliegoStatus.READY || !doc.extractedText) {
      throw new BadRequestException('El pliego no tiene texto extraído todavía');
    }

    const text = doc.extractedText;
    const haystack = text.toLowerCase();
    const needle = q.toLowerCase();
    const snippets: PliegoSnippet[] = [];

    let from = 0;
    while (snippets.length < MAX_SNIPPETS) {
      const idx = haystack.indexOf(needle, from);
      if (idx === -1) break;

      const start = Math.max(0, idx - SNIPPET_CONTEXT);
      const end = Math.min(text.length, idx + needle.length + SNIPPET_CONTEXT);

      snippets.push({
        index: idx,
        before: (start > 0 ? '…' : '') + text.slice(start, idx),
        match: text.slice(idx, idx + needle.length),
        after: text.slice(idx + needle.length, end) + (end < text.length ? '…' : ''),
      });

      from = idx + needle.length;
    }

    return snippets;
  }

  // ── privados ───────────────────────────────────────────────────────────

  private async downloadAndExtract(doc: PliegoDocument): Promise<void> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(doc.sourceUrl, {
        signal: controller.signal,
        redirect: 'follow',
        headers: { 'User-Agent': 'SmartPliegos/1.0 (+https://smartpliegos.es)' },
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} al descargar`);
    }

    const contentType = response.headers.get('content-type') ?? '';
    const buffer = Buffer.from(await response.arrayBuffer());

    if (buffer.byteLength > MAX_BYTES) {
      throw new Error(
        `Documento demasiado grande (${Math.round(buffer.byteLength / 1e6)} MB)`,
      );
    }

    // PLACE a veces devuelve content-type genérico: validar por magic bytes.
    const isPdf = buffer.subarray(0, 5).toString('latin1') === '%PDF-';
    if (!isPdf && !contentType.includes('pdf')) {
      throw new Error(`No es un PDF (content-type: ${contentType || 'desconocido'})`);
    }

    const saved = await this.storage.save({
      buffer,
      originalName: doc.nombre ?? `pliego-${doc.licitacionId}.pdf`,
      mimeType: 'application/pdf',
      scope: `pliegos/${doc.licitacionId}`,
    });

    let extractedText: string | null = null;
    try {
      const parsed = await parsePdf(buffer);
      extractedText = parsed.text?.split('\u0000').join('').trim() || null;
    } catch {
      extractedText = null;
    }

    doc.storageKey = saved.key;
    doc.mimeType = 'application/pdf';
    doc.sizeBytes = String(buffer.byteLength);
    doc.extractedText = extractedText;
    doc.status = PliegoStatus.READY;
    doc.errorMessage = null;
  }

  private toListItem(d: PliegoDocument) {
    return {
      id: d.id,
      tipo: d.tipo,
      nombre: d.nombre,
      sourceUrl: d.sourceUrl,
      sizeBytes: d.sizeBytes,
      status: d.status,
      errorMessage: d.errorMessage,
      hasText: d.status === PliegoStatus.READY, // el texto en sí nunca viaja en la lista
      createdAt: d.createdAt,
    };
  }
}
