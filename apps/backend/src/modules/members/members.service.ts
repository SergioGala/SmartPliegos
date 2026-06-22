import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationMember, OrgRole } from './entities/organization-member.entity';
import { AuditAction } from './entities/audit-log.entity';
import { AuditService } from './audit.service';
import { UpdateMemberRoleDto } from './dto';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(OrganizationMember)
    private readonly membersRepo: Repository<OrganizationMember>,
    private readonly audit: AuditService,
  ) {}

  async findAll(organizationId: string) {
    if (!organizationId) return [];

    const members = await this.membersRepo.find({
      where: { organizationId },
      order: { createdAt: 'ASC' },
    });

    return members.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      joinedAt: m.createdAt,
      firstName: m.user?.firstName ?? '',
      lastName: m.user?.lastName ?? '',
      email: m.user?.email ?? '',
    }));
  }

  async changeRole(
    actor: OrganizationMember,
    targetUserId: string,
    dto: UpdateMemberRoleDto,
  ) {
    const target = await this.findInOrgOrFail(actor.organizationId, targetUserId);

    if (target.role === OrgRole.OWNER && dto.role !== OrgRole.OWNER) {
      await this.assertNotLastOwner(actor.organizationId, target.userId);
    }

    // Un ADMIN no puede tocar a un OWNER ni nombrar OWNERs.
    if (
      actor.role === OrgRole.ADMIN &&
      (target.role === OrgRole.OWNER || dto.role === OrgRole.OWNER)
    ) {
      throw new ForbiddenException('Solo un propietario puede gestionar propietarios');
    }

    const previousRole = target.role;
    target.role = dto.role;

    const saved = await this.membersRepo.save(target);

    await this.audit.log({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: AuditAction.MEMBER_ROLE_CHANGED,
      targetType: 'user',
      targetId: target.userId,
      metadata: { from: previousRole, to: dto.role },
    });

    return saved;
  }

  async removeMember(actor: OrganizationMember, targetUserId: string) {
    if (actor.userId === targetUserId) {
      throw new BadRequestException(
        'No puedes expulsarte a ti mismo; usa "abandonar organización"',
      );
    }

    const target = await this.findInOrgOrFail(actor.organizationId, targetUserId);

    if (target.role === OrgRole.OWNER) {
      if (actor.role !== OrgRole.OWNER) {
        throw new ForbiddenException('Solo un propietario puede expulsar a otro propietario');
      }
      await this.assertNotLastOwner(actor.organizationId, target.userId);
    }

    await this.membersRepo.remove(target);

    await this.audit.log({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: AuditAction.MEMBER_REMOVED,
      targetType: 'user',
      targetId: targetUserId,
      metadata: { email: target.user?.email },
    });
  }

  /** Llamado desde el flujo de aceptar invitación. */
  async addMember(organizationId: string, userId: string, role = OrgRole.MEMBER) {
    const existing = await this.membersRepo.findOne({ where: { organizationId, userId } });
    if (existing) return existing;

    const member = await this.membersRepo.save(
      this.membersRepo.create({ organizationId, userId, role }),
    );

    await this.audit.log({
      organizationId,
      actorUserId: userId,
      action: AuditAction.MEMBER_JOINED,
      targetType: 'user',
      targetId: userId,
    });

    return member;
  }

  private async findInOrgOrFail(organizationId: string, userId: string) {
    const member = await this.membersRepo.findOne({ where: { organizationId, userId } });
    if (!member) throw new NotFoundException('Miembro no encontrado en tu organización');
    return member;
  }

  private async assertNotLastOwner(organizationId: string, excludingUserId: string) {
    const owners = await this.membersRepo.count({
      where: { organizationId, role: OrgRole.OWNER },
    });

    if (owners <= 1) {
      throw new BadRequestException('La organización debe tener al menos un propietario');
    }
    void excludingUserId;
  }
}
