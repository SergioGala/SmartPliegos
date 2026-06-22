import { z } from 'zod';

export const searchPliegoSchema = z.object({
  q: z.string().trim().min(2, 'Mínimo 2 caracteres').max(200),
});

export type SearchPliegoDto = z.infer<typeof searchPliegoSchema>;
