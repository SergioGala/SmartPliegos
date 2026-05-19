import { z } from 'zod';
import {
  emailSchema,
  passwordSchema,
  uuidSchema,
  optionalPhoneSchema,
  optionalTimezoneSchema,
} from '../../../common/zod';
import { Role, Plan } from '../enums';

export const createUserSchema = z.object({
  email: emailSchema,
  firstName: z.string().trim().min(1, 'firstName is required'),
  lastName: z.string().trim().min(1, 'lastName is required'),
  phone: optionalPhoneSchema,
  timezone: optionalTimezoneSchema,
  password: passwordSchema,
  role: z.nativeEnum(Role).optional().default(Role.PUBLIC_USER),
  userPlan: z.nativeEnum(Plan).optional().default(Plan.FREE),
  organizationId: uuidSchema.optional(),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;


/* export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @Matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, {
    message: 'El teléfono debe tener un formato válido (ej: +34 912345678)',
  })
  @IsOptional()
  phone?: string;

  @IsEnum(Timezone)
  @IsOptional()
  timezone?: Timezone = Timezone.UTC;

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role = Role.PUBLIC_USER;

  /**
   * Plan del usuario (solo para PUBLIC_USER sin organizationId)
   
  @IsEnum(Plan)
  @IsOptional()
  userPlan?: Plan = Plan.FREE;

  @IsUUID()
  @IsOptional()
  organizationId?: string;
} */
