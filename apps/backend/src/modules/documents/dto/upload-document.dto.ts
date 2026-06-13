import { z } from 'zod';
import { ApiPropertyOptional } from '@nestjs/swagger';

export const uploadDocumentSchema = z.object({
  folder: z.string().trim().max(120).optional(),
  licitacionId: z.string().uuid().optional(),
});
export type UploadDocumentDto = z.infer<typeof uploadDocumentSchema>;

export class UploadDocumentDtoSwagger {
  @ApiPropertyOptional({ type: 'string', format: 'binary' }) file!: any;
  @ApiPropertyOptional({ example: 'Solvencia' }) folder?: string;
  @ApiPropertyOptional({ format: 'uuid' }) licitacionId?: string;
}