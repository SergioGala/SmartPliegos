import { z } from 'zod';

export const moveCardSchema = z.object({
  columnId: z.string().uuid('columnId debe ser un UUID válido'),
  position: z.number().int().min(0, 'position debe ser mayor o igual a 0'),
});

export type MoveCardDto = z.infer<typeof moveCardSchema>;
