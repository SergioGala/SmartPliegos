import { z } from 'zod';

export const vencimientosQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(30),
});

export type VencimientosQueryDto = z.infer<typeof vencimientosQuerySchema>;