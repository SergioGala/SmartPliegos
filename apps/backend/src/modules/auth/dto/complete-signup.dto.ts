import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';
import { passwordSchema } from '../../../common/zod';

export const completeSignupSchema = z
  .object({
    password: passwordSchema,
    passwordConfirm: z.string().min(1, 'passwordConfirm is required'),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Las contraseñas no coinciden',
    path: ['passwordConfirm'],
  });

/** Tipo inferido. Reemplaza a la antigua clase. */
export type CompleteSignupDto = z.infer<typeof completeSignupSchema>;

export class CompleteSignupDtoSwagger {
  @ApiProperty({ example: 'SecurePassword123!', minLength: 8 })
  password!: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  passwordConfirm!: string;
}


/**
 * DTO para Completar Signup (Step 2)
 */
/* export class CompleteSignupDto {
  @ApiProperty({
    description: 'Contraseña nueva (mínimo 8 caracteres, debe incluir mayúscula, minúscula, número)',
    example: 'SecurePassword123!',
    type: String,
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message: 'La contraseña debe contener mayúsculas, minúsculas, números y caracteres especiales',
    },
  )
  password: string;

  @ApiProperty({
    description: 'Confirmación de contraseña (debe ser igual a password)',
    example: 'SecurePassword123!',
    type: String,
  })
  @IsString()
  passwordConfirm: string;
}
 */