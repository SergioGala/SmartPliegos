import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';
import { emailSchema, passwordSchema } from '../../../common/zod';

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

/** Tipo inferido. Reemplaza a la antigua clase. */
export type LoginDto = z.infer<typeof loginSchema>;

/**
 * Swagger sigue queriendo una clase para generar el JSON schema.
 * La declaramos solo con@ApiProperty, sin validación: la validación va por Zod.
 */
export class LoginDtoSwagger {
  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @ApiProperty({ example: 'SecurePassword123!', minLength: 8 })
  password!: string;
}



/* import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para Login
 
export class LoginDto {
  @ApiProperty({
    description: 'Email del usuario',
    example: 'user@example.com',
    type: String,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Contraseña del usuario (mínimo 8 caracteres)',
    example: 'SecurePassword123!',
    type: String,
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;
} */
