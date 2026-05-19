import { z } from 'zod';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { parseCommaList } from '../../licitaciones/dto/search-licitaciones.dto';

function toOptionalInt(val: unknown) {
  if (val === undefined || val === null || val === '') return undefined;
  const n = Number(val);
  return isNaN(n) ? undefined : n;
}

const commaArray = z.preprocess(parseCommaList, z.array(z.string()).optional());

export const searchOrganosSchema = z.object({
  q: z.string().optional(),
  ccaa: commaArray,
  provincia: commaArray,
  limit: z.preprocess(toOptionalInt, z.number().int().min(1).max(50).default(30)),
});

/** Tipo inferido. Reemplaza a la antigua clase. */
export type SearchOrganosDto = z.infer<typeof searchOrganosSchema>;

export class SearchOrganosDtoSwagger {
  @ApiPropertyOptional({ description: 'Texto de búsqueda' })
  q?: string;

  @ApiPropertyOptional({ description: 'CCAAs (comma-separated)' })
  ccaa?: string;

  @ApiPropertyOptional({ description: 'Provincias (comma-separated)' })
  provincia?: string;

  @ApiPropertyOptional({ default: 30, maximum: 50, type: Number })
  limit?: number;
}