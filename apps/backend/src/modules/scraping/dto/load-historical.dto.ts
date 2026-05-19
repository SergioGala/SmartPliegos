import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const loadHistoricalSchema = z.object({
  period: z
    .string()
    .regex(/^\d{4}(\d{2})?$/, 'period debe ser formato YYYY o YYYYMM (ej: 2024 o 202604)'),
});

/** Tipo inferido. Reemplaza a la antigua clase. */
export type LoadHistoricalDto = z.infer<typeof loadHistoricalSchema>;

export class LoadHistoricalDtoSwagger {
  @ApiProperty({
    description: 'Período en formato YYYY o YYYYMM (ej: 2024, 202604)',
    example: '202604',
  })
  period!: string;
}