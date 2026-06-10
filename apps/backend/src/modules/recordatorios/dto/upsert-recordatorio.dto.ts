import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const upsertRecordatorioSchema = z.object({
  licitacionId: z.string().uuid(),
  daysBefore: z.number().int().min(1).max(60),
  note: z.string().max(500).optional(),
});
export type UpsertRecordatorioDto = z.infer<typeof upsertRecordatorioSchema>;

export class UpsertRecordatorioDtoSwagger {
  @ApiProperty({ format: 'uuid' }) licitacionId!: string;
  @ApiProperty({ example: 3, minimum: 1, maximum: 60 }) daysBefore!: number;
  @ApiPropertyOptional({ example: 'Preparar documentación de solvencia' }) note?: string;
}