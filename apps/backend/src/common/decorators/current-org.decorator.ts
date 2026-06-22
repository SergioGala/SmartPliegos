import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

interface AuthenticatedUserPayload {
  id: string;
  email?: string;
  role?: string;
  organizationId?: string | null;
}

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUserPayload;
}

/**
 * Devuelve el organizationId del usuario autenticado, o null si no pertenece a
 * ninguna organización. JwtStrategy.validate() ya lo inyecta en request.user.
 *
 * Para endpoints que EXIGEN organización, úsalo con @SecureOrgEndpoint():
 * el guard garantiza que no sea null antes de llegar al controller, así que
 * ahí puedes tiparlo directamente como `string`.
 */
export const CurrentOrg = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user?.organizationId ?? null;
  },
);
