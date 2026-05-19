import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { emailSchema } from '../../../common/zod';

export const createAlertSchema = z.object({
  name: z.string().min(1, 'name is required'),
  description: z.string().optional(),
  email: emailSchema.optional(),
  estados: z.array(z.string()).optional(),
  tiposContrato: z.array(z.string()).optional(),
  procedimientos: z.array(z.string()).optional(),
  tramitaciones: z.array(z.string()).optional(),
  ccaas: z.array(z.string()).optional(),
  provincias: z.array(z.string()).optional(),
  cpvCodes: z.array(z.string()).optional(),
  importeMin: z.string().optional(),
  importeMax: z.string().optional(),
  palabrasClave: z.string().optional(),
  isActive: z.boolean().optional(),
});

/** Tipo inferido. Reemplaza a la antigua clase. */
export type CreateAlertDto = z.infer<typeof createAlertSchema>;

export class CreateAlertDtoSwagger {
  @ApiProperty({ description: 'Nombre descriptivo de la alerta', example: 'Licitaciones de Servicios de Limpieza' })
  name!: string;

  @ApiPropertyOptional({ description: 'Descripción detallada', example: 'Servicios de limpieza en Cataluña' })
  description?: string;

  @ApiPropertyOptional({ description: 'Email de notificaciones (default: email del usuario)', example: 'alerts@example.com' })
  email?: string;

  @ApiPropertyOptional({ description: 'Estados a filtrar', example: ['ABIERTA', 'CERRADA'], type: [String] })
  estados?: string[];

  @ApiPropertyOptional({ description: 'Tipos de contrato a filtrar', example: ['SERVICIO', 'OBRA'], type: [String] })
  tiposContrato?: string[];

  @ApiPropertyOptional({ description: 'Procedimientos a filtrar', example: ['ABIERTO', 'RESTRINGIDO'], type: [String] })
  procedimientos?: string[];

  @ApiPropertyOptional({ description: 'Tramitaciones a filtrar', example: ['ORDINARIA', 'URGENTE'], type: [String] })
  tramitaciones?: string[];

  @ApiPropertyOptional({ description: 'Comunidades autónomas a filtrar', example: ['Cataluña', 'Madrid'], type: [String] })
  ccaas?: string[];

  @ApiPropertyOptional({ description: 'Provincias a filtrar', example: ['Barcelona', 'Madrid'], type: [String] })
  provincias?: string[];

  @ApiPropertyOptional({ description: 'Códigos CPV a filtrar', example: ['72000000', '79000000'], type: [String] })
  cpvCodes?: string[];

  @ApiPropertyOptional({ description: 'Importe mínimo', example: '10000' })
  importeMin?: string;

  @ApiPropertyOptional({ description: 'Importe máximo', example: '100000' })
  importeMax?: string;

  @ApiPropertyOptional({ description: 'Palabras clave (búsqueda full-text)', example: 'servicios tecnológicos' })
  palabrasClave?: string;

  @ApiPropertyOptional({ description: 'Si la alerta está activa', example: true, default: true })
  isActive?: boolean;
}