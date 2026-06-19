import { z } from 'zod';

export const createCardSchema = z.object({
  licitacionId: z.string().uuid('licitacionId debe ser un UUID válido'),
  columnId: z.string().uuid('columnId debe ser un UUID válido').optional(),
  notes: z.string().optional(),
});

export type CreateCardDto = z.infer<typeof createCardSchema>;
