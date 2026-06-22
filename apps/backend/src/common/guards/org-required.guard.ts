import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

interface ReqWithUser extends Request {
  user?: { organizationId?: string | null };
}

/**
 * Bloquea el acceso si el usuario no pertenece a una organización.
 * DEBE ejecutarse después del guard de JWT (que pobla request.user).
 * Devuelve 403 con code NO_ORGANIZATION para que el frontend muestre el banner.
 */
@Injectable()
export class OrgRequiredGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<ReqWithUser>();
    if (!req.user?.organizationId) {
      throw new ForbiddenException({
        code: 'NO_ORGANIZATION',
        message: 'Necesitas pertenecer a una organización para usar el tablero.',
      });
    }
    return true;
  }
}
