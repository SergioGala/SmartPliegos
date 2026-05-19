import { z } from 'zod';

/**
 * Política de contraseñas. Mínimo 8 caracteres. No imponemos mayúsculas/dígitos
 * por defecto (UX) — eso se decide en otro stream si hace falta.
 */
export const passwordSchema = z
  .string()
  .min(8, 'password must be at least 8 characters')
  .max(128, 'password is too long');