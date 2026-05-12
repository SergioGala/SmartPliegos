import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/**
 * Shape del request tras pasar por JwtAuthGuard.
 * El guard inyecta el payload del JWT en request.user, que incluye
 * al menos el `id` del usuario. Otros campos (email, role) pueden estar
 * presentes según el strategy de JWT.
 *
 * Si extiendes el JwtStrategy.validate() para devolver más campos,
 * añade aquí los nuevos campos para que TypeScript los reconozca.
 */
interface AuthenticatedUserPayload {
  id: string;
  email?: string;
  role?: string;
}

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUserPayload;
}

/**
 * Decorador para obtener el ID del usuario autenticado desde el contexto del request.
 *
 * Requiere que el endpoint esté protegido por JwtAuthGuard (o equivalente)
 * que haya poblado request.user. Si no, lanza error.
 *
 * Uso:
 *   @Get()
 *   getProfile(@CurrentUser() userId: string) {
 *     return this.userService.findById(userId);
 *   }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.user?.id;
    if (!userId) {
      throw new Error('User ID not found in request context');
    }
    return userId;
  },
);