import { z } from 'zod';

export const reorderColumnsSchema = z.object({
  columnIds: z.array(z.string().uuid('Cada columna debe ser un UUID válido')),
});

export type ReorderColumnsDto = z.infer<typeof reorderColumnsSchema>;
