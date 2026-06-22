import { Injectable } from '@nestjs/common';
import { Licitacion } from '../scraping/shared/entities/licitacion.entity';

@Injectable()
export class EmbeddingTextBuilder {
  /** ~8000 chars ≈ <2k tokens: barato y por debajo del límite de 8191 del modelo. */
  private readonly MAX_CHARS = 8000;

  build(
    lic: Pick<Licitacion, 'title' | 'description' | 'cpvCodes' | 'resumenIA' | 'tipoContrato' | 'ccaa'>,
  ): string {
    const parts = [
      lic.title,
      lic.tipoContrato ? `Tipo: ${lic.tipoContrato}` : null,
      lic.ccaa ? `Ubicación: ${lic.ccaa}` : null,
      lic.cpvCodes?.length ? `CPV: ${lic.cpvCodes.join(', ')}` : null,
      lic.resumenIA ?? lic.description ?? null,
    ].filter(Boolean);

    return parts.join('\n').slice(0, this.MAX_CHARS).trim();
  }
}