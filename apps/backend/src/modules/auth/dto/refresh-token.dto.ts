import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para Refresh Token
 */

export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1, 'refresh_token is required'),
});

/** Tipo inferido. Reemplaza a la antigua clase. */
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;

export class RefreshTokenDtoSwagger {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  })
  refresh_token!: string;
}
