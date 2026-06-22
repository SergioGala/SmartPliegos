import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationMember, OrgRole } from '../entities/organization-member.entity';
import { ORG_ROLES_KEY } from '../decorators/org-roles.decorator';

/**
 * Comprueba que el usuario autenticado tiene uno de los roles requeridos
 * EN SU ORGANIZACIÓN (no el Role global). Inyecta `request.membership`
 * para que el controlador no tenga que volver a buscarlo.
 */
@Injectable()
export class OrgRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(OrganizationMember)
    private readonly membersRepo: Repository<OrganizationMember>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<OrgRole[]>(ORG_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const userId: string | undefined = request.user?.id ?? request.user?.sub;
    const globalRole = request.user?.role;

    if (!userId) throw new ForbiddenException('No autenticado');

    if (globalRole === 'SUPER_ADMIN' || globalRole === 'ORG_OWNER') {
      // Si es administrador global o de org, tiene poder total como OWNER
      request.membership = {
        organizationId: request.user.organizationId,
        userId: userId,
        role: OrgRole.OWNER,
      } as OrganizationMember;
      return true;
    }

    const membership = await this.membersRepo.findOne({
      where: { userId },
      relations: { user: false },
    });

    if (!membership) {
      throw new ForbiddenException('No perteneces a ninguna organización');
    }

    request.membership = membership;

    if (required?.length && !required.includes(membership.role)) {
      throw new ForbiddenException('Necesitas permisos de administrador de la organización');
    }

    return true;
  }
}
