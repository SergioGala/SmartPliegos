import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { optionalPhoneSchema, optionalCifSchema } from '../../../../../common/zod/';

/**
 * DTO para crear una nueva organización
 * Usado cuando un PUBLIC_USER crea su primera organización (automáticamente se convierte en ORG_OWNER)
 */

/**
 * optionalPhoneSchema y optionalCifSchema deben estar definidos en common/zod.
 * Ver nota de migración al final de este archivo.
 */
export const createOrganizationSchema = z.object({
  name: z.string().trim().min(3, 'name debe tener al menos 3 caracteres').max(255),
  description: z.string().max(1000).optional(),
  website: z.string().url('website debe ser una URL válida').max(255).optional(),
  logo: z.string().url('logo debe ser una URL válida').max(255).optional(),
  phone: optionalPhoneSchema,
  cif: optionalCifSchema,
});

/** Tipo inferido. Reemplaza a la antigua clase. */
export type CreateOrganizationDto = z.infer<typeof createOrganizationSchema>;

export class CreateOrganizationDtoSwagger {
  @ApiProperty({ example: 'Acme Corp', minLength: 3, maxLength: 255 })
  name!: string;

  @ApiPropertyOptional({ example: 'Empresa líder en tecnología', maxLength: 1000 })
  description?: string;

  @ApiPropertyOptional({ example: 'https://acme.com', maxLength: 255 })
  website?: string;

  @ApiPropertyOptional({ example: 'https://acme.com/logo.png', maxLength: 255 })
  logo?: string;

  @ApiPropertyOptional({ example: '+34912345678' })
  phone?: string;

  @ApiPropertyOptional({ example: 'A12345678' })
  cif?: string;
}

/*
export class CreateOrganizationDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @Length(3, 255)
  name: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  description?: string;

  @IsOptional()
  @IsUrl()
  @Length(0, 255)
  website?: string;

  @IsOptional()
  @IsUrl()
  @Length(0, 255)
  logo?: string;

  @IsOptional()
  @Matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, {
    message: 'El teléfono debe tener un formato válido (ej: +34 912345678)',
  })
  phone?: string;

  @IsOptional()
  @Matches(/^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-Z]$/, {
    message: 'El CIF debe tener un formato válido español (ej: A12345678)',
  })
  cif?: string;
}
*/