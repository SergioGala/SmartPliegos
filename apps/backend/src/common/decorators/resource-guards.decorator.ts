import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import {
  ResourceExistsGuard,
  RESOURCE_EXISTS_KEY,
  RESOURCE_ENTITY_KEY,
} from '../guards/resource/resource-exists.guard';

/**
 * Constructor de una entity TypeORM.
 * Cualquier clase tiene `name`, así que con este tipo TypeScript
 * sabe que `entity.name` es siempre string.
 */
type EntityConstructor = { new (...args: unknown[]): object; name: string };

/**
 * Decorador compuesto para validar existencia de recursos en BD antes
 * de ejecutar el handler.
 *
 * Aplica:
 * 1. Metadata con el nombre del param de ruta a buscar.
 * 2. Metadata con la entity TypeORM contra la que buscar.
 * 3. ResourceExistsGuard, que lee esa metadata y hace findOne en BD.
 * 4. Documentación Swagger del 404.
 *
 * Si el recurso no existe, el guard devuelve 404 antes de llegar al
 * controller.
 *
 * @example
 *   @Get(':id')
 *   @ValidateResourceExists(LicitacionEntity, 'id')
 *   async getOne(@Param('id') id: string) { }
 */
export const ValidateResourceExists = (
  entity: EntityConstructor,
  paramName: string,
) =>
  applyDecorators(
    SetMetadata(RESOURCE_EXISTS_KEY, paramName),
    SetMetadata(RESOURCE_ENTITY_KEY, entity),
    UseGuards(ResourceExistsGuard),
    ApiResponse({
      status: 404,
      description: `${entity.name} no encontrado`,
    }),
  );