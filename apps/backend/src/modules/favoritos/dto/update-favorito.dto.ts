import { z } from 'zod';

export const updateFavoritoSchema = z.object({
  nota: z.string().max(2000).nullable().optional(),
});

export type UpdateFavoritoDto = z.infer<typeof updateFavoritoSchema>;