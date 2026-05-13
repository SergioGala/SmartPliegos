import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  Repository,
  DataSource,
  EntityTarget,
  ObjectLiteral,
} from 'typeorm';
import type { Request } from 'express';

export const RESOURCE_EXISTS_KEY = 'resource_exists';
export const RESOURCE_ENTITY_KEY = 'resource_entity';

/**
 * Tipo para clases Entity de TypeORM.
 * Es un constructor que produce un ObjectLiteral (cualquier entity).
 */
type EntityClass<T extends ObjectLiteral = ObjectLiteral> = EntityTarget<T> & {
  name: string;
};

/**
 * Request con la propiedad custom existingResource que este guard
 * inyecta para uso posterior en handlers o decoradores.
 */
interface RequestWithResource extends Request {
  existingResource?: ObjectLiteral;
}

/**
 * Guard que valida que un recurso existe en BD antes de operaciones.
 *
 * Uso:
 *   @Get(':id')
 *   @ValidateResourceExists(LicitacionEntity, 'id')
 *   async getOne(@Param('id') id: string) { ... }
 *
 * Sin metadata (paramName o entity ausentes): pasa transparentemente.
 */
@Injectable()
export class ResourceExistsGuard implements CanActivate {
  private readonly logger = new Logger(ResourceExistsGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const paramName = this.reflector.get<string | undefined>(
      RESOURCE_EXISTS_KEY,
      context.getHandler(),
    );
    const entity = this.reflector.get<EntityClass | undefined>(
      RESOURCE_ENTITY_KEY,
      context.getHandler(),
    );

    // Sin metadata, el guard pasa (es opcional)
    if (!paramName || !entity) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithResource>();

    // request.params[x] puede ser string | string[]. Normalizamos a string.
    const rawResourceId = request.params[paramName];
    const resourceId = Array.isArray(rawResourceId)
      ? rawResourceId[0]
      : rawResourceId;

    if (!resourceId) {
      throw new BadRequestException(
        `Parámetro requerido no encontrado: ${paramName}`,
      );
    }

    const entityName = entity.name || 'Resource';

    // Obtener repositorio de la entity
    let repository: Repository<ObjectLiteral>;
    try {
      repository = this.dataSource.getRepository<ObjectLiteral>(entity);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown';
      this.logger.warn(
        `ResourceExistsGuard: No se pudo obtener repositorio para ${entityName}: ${message}`,
      );
      throw new BadRequestException('Configuración de repositorio inválida');
    }

    // SELECT id FROM entity WHERE id = ?
    const exists = await repository.findOne({
      where: { id: resourceId },
      select: ['id'],
    });

    if (!exists) {
      this.logger.debug(
        `ResourceExistsGuard: Recurso ${entityName} con id ${resourceId} no encontrado`,
      );
      throw new NotFoundException(
        `${entityName} no encontrado: ${resourceId}`,
      );
    }

    // Guardar para reuso en handlers posteriores
    request.existingResource = exists;

    return true;
  }
}