import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createReadStream, existsSync } from 'fs';
import { mkdir, writeFile, unlink, access } from 'fs/promises';
import { join, extname, resolve, sep } from 'path';
import { randomUUID } from 'crypto';
import { Readable } from 'stream';
import type { IStorageProvider, SaveFileParams, SavedFile } from '../storage.types';

@Injectable()
export class LocalDiskStorageProvider implements IStorageProvider {
  public readonly providerName = 'local-disk';
  private readonly logger = new Logger(LocalDiskStorageProvider.name);
  private readonly baseDir = resolve(process.env.UPLOAD_DIR ?? './uploads');

  async save({ buffer, originalName, scope }: SaveFileParams): Promise<SavedFile> {
    const ext = extname(originalName).toLowerCase().replace(/[^.a-z0-9]/g, '');
    const safeScope = scope.replace(/[^a-zA-Z0-9/_-]/g, '');
    const key = `${safeScope}/${randomUUID()}${ext}`;
    const fullPath = this.resolveKey(key);

    await mkdir(join(fullPath, '..'), { recursive: true });
    await writeFile(fullPath, buffer);
    return { key, sizeBytes: buffer.byteLength };
  }

  async getStream(key: string): Promise<Readable> {
    const fullPath = this.resolveKey(key);
    if (!existsSync(fullPath)) throw new NotFoundException('Archivo no encontrado');
    return createReadStream(fullPath);
  }

  async delete(key: string): Promise<void> {
    try {
      await unlink(this.resolveKey(key));
    } catch (e) {
      this.logger.warn(`No se pudo borrar ${key}: ${e instanceof Error ? e.message : 'unknown'}`);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await access(this.resolveKey(key));
      return true;
    } catch {
      return false;
    }
  }

  /** Anti path-traversal: la ruta resuelta DEBE quedar dentro de baseDir. */
  private resolveKey(key: string): string {
    const full = resolve(this.baseDir, key);
    if (!full.startsWith(this.baseDir + sep)) {
      throw new NotFoundException('Ruta inválida');
    }
    return full;
  }
}