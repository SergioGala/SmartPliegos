import {
  Injectable, Inject, Logger, NotFoundException,
  BadRequestException, PayloadTooLargeException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { DocumentEntity } from './document.entity';
import { STORAGE_PROVIDER, type IStorageProvider } from '../../infrastructure/storage';
import { ALLOWED_MIME_TYPES, DEFAULT_USER_QUOTA_BYTES, MAX_UPLOAD_BYTES } from './documents.constants';

interface UploadInput {
  ownerUserId: string;
  organizationId: string | null;
  file: { originalname: string; mimetype: string; buffer: Buffer; size: number };
  folder?: string;
  licitacionId?: string;
}

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    @InjectRepository(DocumentEntity) private readonly repo: Repository<DocumentEntity>,
    @Inject(STORAGE_PROVIDER) private readonly storage: IStorageProvider,
  ) {}

  async upload(input: UploadInput): Promise<DocumentEntity> {
    const { file, ownerUserId } = input;

    if (!file) throw new BadRequestException('Falta el archivo');
    if (!ALLOWED_MIME_TYPES.has(file.mimetype))
      throw new BadRequestException(`Tipo de archivo no permitido: ${file.mimetype}`);
    if (file.size > MAX_UPLOAD_BYTES)
      throw new PayloadTooLargeException(`El archivo supera el máximo (${MAX_UPLOAD_BYTES} bytes)`);

    const used = await this.usedBytes(ownerUserId);
    if (used + file.size > DEFAULT_USER_QUOTA_BYTES)
      throw new PayloadTooLargeException('Has superado tu cuota de almacenamiento');

    const saved = await this.storage.save({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      scope: `user/${ownerUserId}`,
    });

    const doc = this.repo.create({
      ownerUserId,
      organizationId: input.organizationId,
      filename: this.sanitizeName(file.originalname),
      mimeType: file.mimetype,
      sizeBytes: String(saved.sizeBytes),
      storageKey: saved.key,
      checksum: createHash('sha256').update(file.buffer).digest('hex'),
      folder: input.folder ?? null,
      licitacionId: input.licitacionId ?? null,
    });
    return this.repo.save(doc);
  }

  async list(ownerUserId: string, opts: { page: number; pageSize: number; folder?: string; q?: string; licitacionId?: string }) {
    const qb = this.repo.createQueryBuilder('d').where('d.ownerUserId = :ownerUserId', { ownerUserId });
    if (opts.folder) qb.andWhere('d.folder = :folder', { folder: opts.folder });
    if (opts.licitacionId) qb.andWhere('d.licitacionId = :lid', { lid: opts.licitacionId });
    if (opts.q?.trim()) qb.andWhere('d.filename ILIKE :q', { q: `%${opts.q.trim()}%` });
    qb.orderBy('d.createdAt', 'DESC');

    const [data, total] = await qb
      .skip((opts.page - 1) * opts.pageSize)
      .take(opts.pageSize)
      .getManyAndCount();
    return { data, total, page: opts.page, pageSize: opts.pageSize, totalPages: Math.ceil(total / opts.pageSize) };
  }

  /** Devuelve la entidad SOLO si pertenece al usuario; si no, 404 (no filtra existencia). */
  async getOwned(id: string, ownerUserId: string): Promise<DocumentEntity> {
    const doc = await this.repo.findOne({ where: { id, ownerUserId } });
    if (!doc) throw new NotFoundException('Documento no encontrado');
    return doc;
  }

  async getDownload(id: string, ownerUserId: string) {
    const doc = await this.getOwned(id, ownerUserId);
    const stream = await this.storage.getStream(doc.storageKey);
    return { doc, stream };
  }

  async rename(id: string, ownerUserId: string, patch: { filename?: string; folder?: string | null }) {
    const doc = await this.getOwned(id, ownerUserId);
    if (patch.filename) doc.filename = this.sanitizeName(patch.filename);
    if (patch.folder !== undefined) doc.folder = patch.folder;
    return this.repo.save(doc);
  }

  async remove(id: string, ownerUserId: string): Promise<void> {
    const doc = await this.getOwned(id, ownerUserId);
    await this.storage.delete(doc.storageKey);
    await this.repo.softRemove(doc);
  }

  async usage(ownerUserId: string) {
    const used = await this.usedBytes(ownerUserId);
    const count = await this.repo.count({ where: { ownerUserId } });
    return { usedBytes: used, quotaBytes: DEFAULT_USER_QUOTA_BYTES, count };
  }

  private async usedBytes(ownerUserId: string): Promise<number> {
  const raw = await this.repo
    .createQueryBuilder('d')
    .select('COALESCE(SUM(d.sizeBytes), 0)', 'sum')
    .where('d.ownerUserId = :ownerUserId', { ownerUserId })
    .getRawOne<{ sum: string }>();
  return Number(raw?.sum ?? 0);
}

  private sanitizeName(name: string): string {
    return name.replace(/[\r\n"]/g, '').replace(/[/\\]/g, '_').slice(0, 500).trim() || 'documento';
  }
}