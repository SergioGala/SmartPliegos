import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';
import { emailSchema, optionalPhoneSchema, optionalTimezoneSchema } from '../../../common/zod';

export const signupSchema = z.object({
  email: emailSchema,
  firstName: z.string().trim().min(1, 'firstName is required'),
  lastName: z.string().trim().min(1, 'lastName is required'),
  phone: optionalPhoneSchema,
  timezone: optionalTimezoneSchema
})

export type SignupDto = z.infer<typeof signupSchema>;

export class SignupDtoSwagger {
  @ApiProperty({ example: 'user@example.com'})
  email!: string;

  @ApiProperty({ example: 'John', minLength: 2})
  firstName!: string;

  @ApiProperty({ example: 'Doe', minLength: 2})
  lastName!: string;

  @ApiProperty({ example: '+34912345678', required: false })
  phone?: string;

  @ApiProperty({ example: 'Europe/Madrid', required: false })
  timezone?: string;
}



/**
 * DTO para Signup/Registro (Step 1)
 * No incluye password - se solicita en POST /complete-signup/:token
 */
/*  export class SignupDto {
  @ApiProperty({
    description: 'Email del usuario (debe ser único)',
    example: 'user@example.com',
    type: String,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'John',
    type: String,
    minLength: 2,
  })
  @IsString()
  @MinLength(2)
  firstName: string;

  @ApiProperty({
    description: 'Apellido del usuario',
    example: 'Doe',
    type: String,
    minLength: 2,
  })
  @IsString()
  @MinLength(2)
  lastName: string;

  @ApiProperty({
    description: 'Número de teléfono (opcional)',
    example: '+34912345678',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'Zona horaria del usuario (opcional, default: UTC)',
    example: 'Europe/Madrid',
    type: String,
    enum: Object.values(Timezone),
    required: false,
  })
  @IsOptional()
  @IsString()
  timezone?: Timezone;
} 
 */