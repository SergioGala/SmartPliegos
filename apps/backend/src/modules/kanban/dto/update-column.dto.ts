import { z } from 'zod';

export const updateColumnSchema = z.object({
  name: z.string().min(1, 'El nombre no puede estar vacío').max(255).optional(),
  color: z.string().max(50).optional(),
  isTerminal: z.boolean().optional(),
});

export type UpdateColumnDto = z.infer<typeof updateColumnSchema>;
