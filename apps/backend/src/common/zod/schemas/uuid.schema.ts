import { z } from 'zod';

export const uuidSchema = z.string().uuid('must be a valid UUID');