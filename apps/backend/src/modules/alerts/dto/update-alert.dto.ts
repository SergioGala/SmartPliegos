import { z } from 'zod';
import { createAlertSchema } from './create-alert.dto';

export const updateAlertSchema = createAlertSchema.partial();

/** Tipo inferido. Reemplaza a la antigua clase. */
export type UpdateAlertDto = z.infer<typeof updateAlertSchema>;