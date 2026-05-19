import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── ScrapingResult ───────────────────────────────────────────────────────────

export const scrapingResultSchema = z.object({
  newItems: z.number().int(),
  updatedItems: z.number().int().optional(),
  errors: z.number().int(),
  duration: z.string(),
});

export type ScrapingResultDto = z.infer<typeof scrapingResultSchema>;

// ─── ScrapingStatus ───────────────────────────────────────────────────────────

export const scrapingStatusSchema = z.object({
  status: z.enum(['SUCCESS', 'PARTIAL', 'PENDING']),
  result: scrapingResultSchema,
});

export type ScrapingStatusDto = z.infer<typeof scrapingStatusSchema>;

// ─── Swagger (solo para documentación de respuestas) ─────────────────────────

export class ScrapingResultDtoSwagger {
  @ApiProperty({ example: 150 })
  newItems!: number;

  @ApiPropertyOptional({ example: 45 })
  updatedItems?: number;

  @ApiProperty({ example: 5 })
  errors!: number;

  @ApiProperty({ example: '5.23s' })
  duration!: string;
}

export class ScrapingStatusDtoSwagger {
  @ApiProperty({ example: 'SUCCESS', enum: ['SUCCESS', 'PARTIAL', 'PENDING'] })
  status!: 'SUCCESS' | 'PARTIAL' | 'PENDING';

  @ApiProperty({ type: () => ScrapingResultDtoSwagger })
  result!: ScrapingResultDtoSwagger;
}
