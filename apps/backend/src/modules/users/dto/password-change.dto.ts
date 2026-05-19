import { z } from 'zod';
import { emailSchema, passwordSchema } from '../../../common/zod';
import { ApiProperty } from '@nestjs/swagger';

// ─── Solicitar cambio (envía solo email) ──────────────────────────────────────

export const requestPasswordChangeSchema = z.object({
  email: emailSchema,
});

export type RequestPasswordChangeDto = z.infer<typeof requestPasswordChangeSchema>;

/** Swagger metadata class — runtime validation uses requestPasswordChangeSchema + ZodBody. */
export class RequestPasswordChangeDtoSwagger {
  @ApiProperty({ description: 'Email del usuario', example: 'user@example.com' })
  email!: string;
}

// ─── Confirmar cambio vía token (token va en params, no en body) ──────────────

export const confirmPasswordChangeSchema = z.object({
  newPassword: passwordSchema,
});

export type ConfirmPasswordChangeDto = z.infer<typeof confirmPasswordChangeSchema>;

/** Swagger metadata class — runtime validation uses confirmPasswordChangeSchema + ZodBody. */
export class ConfirmPasswordChangeDtoSwagger {
  @ApiProperty({ description: 'Nueva contraseña', example: 'NewSecurePassword123!' })
  newPassword!: string;
}

// ─── Cambio directo (usuario logueado) ────────────────────────────────────────

export const changePasswordSchema = z
  .object({
    oldPassword: passwordSchema,
    newPassword: passwordSchema,
    newPasswordConfirm: z.string().min(1, 'newPasswordConfirm is required'),
  })
  .refine((data) => data.newPassword === data.newPasswordConfirm, {
    message: 'Las contraseñas no coinciden',
    path: ['newPasswordConfirm'],
  });

export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;

/** Swagger metadata class — runtime validation uses changePasswordSchema + ZodBody. */
export class ChangePasswordDtoSwagger {
  @ApiProperty({ description: 'Contraseña actual', example: 'CurrentPassword123!' })
  oldPassword!: string;

  @ApiProperty({ description: 'Nueva contraseña', example: 'NewSecurePassword456!' })
  newPassword!: string;

  @ApiProperty({ description: 'Confirmación de la nueva contraseña', example: 'NewSecurePassword456!' })
  newPasswordConfirm!: string;
}