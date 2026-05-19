import { z } from 'zod';
import { createOrganizationSchema } from './create-organization.dto';

/**
 * DTO para actualizar una organización
 */
/**
 * Todos los campos de createOrganizationSchema se vuelven opcionales.
 * No duplicar validaciones: .partial() lo hace automáticamente.
 */
export const updateOrganizationSchema = createOrganizationSchema.partial();

/** Tipo inferido. Reemplaza a la antigua clase. */
export type UpdateOrganizationDto = z.infer<typeof updateOrganizationSchema>;
