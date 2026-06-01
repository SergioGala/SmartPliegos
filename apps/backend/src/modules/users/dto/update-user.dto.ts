import { z } from 'zod';
import { optionalPhoneSchema, optionalTimezoneSchema } from '../../../common/zod';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role, Plan } from '../enums';

export const updateUserSchema = z.object({
  firstName: z.string().trim().min(1, 'firstName cannot be empty').optional(),
  lastName: z.string().trim().min(1, 'lastName cannot be empty').optional(),
  phone: optionalPhoneSchema,
  timezone: optionalTimezoneSchema,
});

/** Tipo inferido. Reemplaza a la antigua clase. */
export type UpdateUserDto = z.infer<typeof updateUserSchema>;

/**
 * Swagger metadata class for PATCH /users/:userId.
 * NOT used for runtime validation — that is handled by updateUserSchema + ZodBody.
 */
export class UpdateUserDtoSwagger {

  @ApiPropertyOptional({ description: 'Nombre', example: 'Juan' })
  firstName?: string;

  @ApiPropertyOptional({ description: 'Apellido', example: 'García' })
  lastName?: string;

  @ApiPropertyOptional({ description: 'Teléfono', example: '+34 612 345 678' })
  phone?: string;

  @ApiPropertyOptional({ description: 'Zona horaria', example: 'Europe/Madrid' })
  timezone?: string;

}