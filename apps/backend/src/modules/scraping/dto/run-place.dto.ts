import { z } from 'zod';

export const runPlaceSchema = z.object({
  maxPages: z.coerce.number().int().min(1).max(10).optional().default(3),
});

export type RunPlaceDto = z.infer<typeof runPlaceSchema>;