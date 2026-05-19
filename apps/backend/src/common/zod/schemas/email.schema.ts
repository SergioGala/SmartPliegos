import { z } from 'zod';

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('email must be a valid email address')
  .max(254, 'email is too long');