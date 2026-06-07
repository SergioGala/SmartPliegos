import { z } from 'zod';
import { ApiPropertyOptional } from '@nestjs/swagger';

/** Mismo helper que search-licitaciones.dto.ts: '' / null → undefined */
function toOptionalInt(val: unknown) {
  if (val === undefined || val === null || val === '') return undefined;
  const n = Number(val);
  return isNaN(n) ? undefined : n;
}

export const listDocumentsSchema = z.object({
  folder: z.string().trim().optional(),
  q: z.string().trim().optional(),
  licitacionId: z.string().uuid().optional(),
  page: z.preprocess(toOptionalInt, z.number().int().min(1).optional()),
  pageSize: z.preprocess(toOptionalInt, z.number().int().min(1).max(100).optional()),
});

export type ListDocumentsDto = z.infer<typeof listDocumentsSchema>;

export class ListDocumentsDtoSwagger {
  @ApiPropertyOptional({ description: 'Filtrar por carpeta' })
  folder?: string;

  @ApiPropertyOptional({ description: 'Buscar por nombre (ILIKE)' })
  q?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Documentos vinculados a una licitación' })
  licitacionId?: string;

  @ApiPropertyOptional({ type: Number, default: 1 })
  page?: number;

  @ApiPropertyOptional({ type: Number, default: 20, maximum: 100 })
  pageSize?: number;
}