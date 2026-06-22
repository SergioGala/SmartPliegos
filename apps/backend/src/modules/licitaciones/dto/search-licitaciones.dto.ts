import { z } from 'zod';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Transforma "A,B,C" → ['A','B','C']. Tolera arrays ya parseados.
 * Exportado para reutilizar en otros Query DTOs (ej: SearchOrganosDto).
 */
export function parseCommaList(value: unknown): string[] | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === 'string')
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  return undefined;
}

/** z.preprocess listo para campos multi-select de query string */
const commaArray = z.preprocess(parseCommaList, z.array(z.string()).optional());

/** Coerce numérico seguro: undefined/'' → undefined, resto → Number */
function toOptionalInt(val: unknown) {
  if (val === undefined || val === null || val === '') return undefined;
  const n = Number(val);
  return isNaN(n) ? undefined : n;
}

/** Coerce booleano desde query string */
function toOptionalBool(val: unknown) {
  if (val === undefined || val === null || val === '') return undefined;
  return val === 'true' || val === true;
}

export const searchLicitacionesSchema = z.object({
  // Full-text
  q: z.string().optional(),

  // Multi-select (comma-separated en query string)
  estado: commaArray,
  tipoContrato: commaArray,
  procedimiento: commaArray,
  tramitacion: commaArray,
  ccaa: commaArray,
  provincia: commaArray,

  // Filtros single-value
  cpv: z.string().optional(),
  importeMin: z.preprocess(toOptionalInt, z.number().int().min(0).optional()),
  importeMax: z.preprocess(toOptionalInt, z.number().int().min(0).optional()),
  fechaDesde: z.string().date().optional(),
  fechaHasta: z.string().date().optional(),
  soloConPlazo: z.preprocess(toOptionalBool, z.boolean().optional()),
  organoId: z.string().uuid().optional(),
  mode: z.enum(['text', 'semantic', 'hybrid']).optional(),

  // Ordenación
  sortBy: z.enum(['fecha', 'importe', 'deadline']).optional(),
  sortOrder: z.enum(['ASC', 'DESC']).optional(),

  // Paginación
  page: z.preprocess(toOptionalInt, z.number().int().min(1).optional()),
  pageSize: z.preprocess(toOptionalInt, z.number().int().min(1).max(100).optional()),
});

/** Tipo inferido. Reemplaza a la antigua clase. */
export type SearchLicitacionesDto = z.infer<typeof searchLicitacionesSchema>;

export class SearchLicitacionesDtoSwagger {
  @ApiPropertyOptional({ description: 'Búsqueda full-text' })
  q?: string;

  @ApiPropertyOptional({ description: 'Estados (separados por coma): ABIERTA,ADJUDICADA' })
  estado?: string;

  @ApiPropertyOptional({ description: 'Tipos de contrato (separados por coma)' })
  tipoContrato?: string;

  @ApiPropertyOptional({ description: 'Procedimientos (separados por coma)' })
  procedimiento?: string;

  @ApiPropertyOptional({ description: 'Tramitaciones (separadas por coma)' })
  tramitacion?: string;

  @ApiPropertyOptional({ description: 'CCAAs (separadas por coma)' })
  ccaa?: string;

  @ApiPropertyOptional({ description: 'Provincias (separadas por coma)' })
  provincia?: string;

  @ApiPropertyOptional({ description: 'Código CPV' })
  cpv?: string;

  @ApiPropertyOptional({ description: 'Importe mínimo (en céntimos)', type: Number })
  importeMin?: number;

  @ApiPropertyOptional({ description: 'Importe máximo (en céntimos)', type: Number })
  importeMax?: number;

  @ApiPropertyOptional({ description: 'Fecha desde (ISO date: YYYY-MM-DD)' })
  fechaDesde?: string;

  @ApiPropertyOptional({ description: 'Fecha hasta (ISO date: YYYY-MM-DD)' })
  fechaHasta?: string;

  @ApiPropertyOptional({ description: 'Solo licitaciones con plazo abierto', type: Boolean })
  soloConPlazo?: boolean;

  @ApiPropertyOptional({ description: 'ID del órgano de contratación' })
  organoId?: string;

  @ApiPropertyOptional({ enum: ['fecha', 'importe', 'deadline'] })
  sortBy?: 'fecha' | 'importe' | 'deadline';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'] })
  sortOrder?: 'ASC' | 'DESC';

  @ApiPropertyOptional({ default: 1, type: Number })
  page?: number;

  @ApiPropertyOptional({ default: 20, maximum: 100, type: Number })
  pageSize?: number;
  
  @ApiPropertyOptional({ enum: ['text', 'semantic', 'hybrid'], description: 'Estrategia de búsqueda (default: text)' })
  mode?: 'text' | 'semantic' | 'hybrid';
}