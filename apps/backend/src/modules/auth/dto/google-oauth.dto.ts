import { z } from 'zod';
import { emailSchema } from '../../../common/zod';

/**
 * DTO interno: lo produce el guard de Google, no lo envía el cliente.
 * No necesita clase Swagger.
 */
export const googleOAuthSchema = z.object({
  google_id: z.string().min(1),
  email: emailSchema,
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export type GoogleOAuthDto = z.infer<typeof googleOAuthSchema>;
