import { z } from 'zod';

export const createFavoritoSchema = z.object({
  licitacionId: z.string().uuid('licitacionId debe ser un UUID válido'),
  nota: z.string().max(2000).optional(),
});

export type CreateFavoritoDto = z.infer<typeof createFavoritoSchema>;