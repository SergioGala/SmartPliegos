import { z } from 'zod';
import { ApiPropertyOptional } from '@nestjs/swagger';

export const updateDocumentSchema = z
  .object({
    filename: z.string().trim().min(1).max(500).optional(),
    // null = quitar de la carpeta; undefined = no tocar
    folder: z.string().trim().max(120).nullable().optional(),
  })
  .refine((d) => d.filename !== undefined || d.folder !== undefined, {
    message: 'No hay nada que actualizar',
  });

export type UpdateDocumentDto = z.infer<typeof updateDocumentSchema>;

export class UpdateDocumentDtoSwagger {
  @ApiPropertyOptional({ example: 'Certificado AEAT 2026.pdf' })
  filename?: string;

  @ApiPropertyOptional({ example: 'Solvencia', nullable: true })
  folder?: string | null;
}