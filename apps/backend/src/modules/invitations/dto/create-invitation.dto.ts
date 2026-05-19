import { z } from 'zod';
import { emailSchema, uuidSchema } from '../../../common/zod';
import { ApiProperty } from '@nestjs/swagger';

export const createInvitationSchema = z.object({
  organizationId: uuidSchema,
  email: emailSchema,
});

/** Tipo inferido. Reemplaza a la antigua clase. */
export type CreateInvitationDto = z.infer<typeof createInvitationSchema>;

/** Swagger metadata class — runtime validation uses createInvitationSchema + ZodBody. */
export class CreateInvitationDtoSwagger {
  @ApiProperty({ description: 'ID de la organización', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' })
  organizationId!: string;

  @ApiProperty({ description: 'Email del invitado', example: 'invitado@example.com' })
  email!: string;
}