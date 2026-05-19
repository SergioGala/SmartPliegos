export * from './email.schema';
export * from './password.schema';
export * from './uuid.schema';
export * from './phone.schema';
export * from './timezone.schema';

import { z } from 'zod';
 
// ─── Phone (ya existe como optionalPhoneSchema — confirmar que usa esta regex) ──
 
const PHONE_REGEX = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
 
export const phoneSchema = z
  .string()
  .regex(PHONE_REGEX, 'El teléfono debe tener un formato válido (ej: +34 912345678)');
 
export const optionalPhoneSchema = phoneSchema.optional();
 
// ─── CIF español (nuevo) ──────────────────────────────────────────────────────
 
const CIF_REGEX = /^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-Z]$/;
 
export const cifSchema = z
  .string()
  .regex(CIF_REGEX, 'El CIF debe tener un formato válido español (ej: A12345678)');
 
export const optionalCifSchema = cifSchema.optional();