import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { SecureAuthEndpoint } from '../../common/decorators';
import { ZodBody } from '../../common/zod';
import { MembersService } from './members.service';
import { AuditService } from './audit.service';
import { OrgRoleGuard } from './guards/org-role.guard';
import { OrgRoles } from './decorators/org-roles.decorator';
import { OrgRole } from './entities/organization-member.entity';
import { updateMemberRoleSchema, type UpdateMemberRoleDto } from './dto';

@ApiTags('Organización · Miembros')
@ApiBearerAuth('access_token')
@Controller({ path: 'organizations', version: '1' })
export class MembersController {
  constructor(
    private readonly membersService: MembersService,
    private readonly auditService: AuditService,
  ) {}

  @Get('members')
  @SecureAuthEndpoint()
  @UseGuards(OrgRoleGuard) // cualquier miembro puede ver la lista
  @ApiOperation({ summary: 'Listar miembros de mi organización' })
  findAll(@Req() req: { membership: { organizationId: string } }) {
    return this.membersService.findAll(req.membership.organizationId);
  }

  @Patch('members/:userId/role')
  @SecureAuthEndpoint()
  @UseGuards(OrgRoleGuard)
  @OrgRoles(OrgRole.OWNER, OrgRole.ADMIN)
  @ApiParam({ name: 'userId', format: 'uuid' })
  @ApiOperation({ summary: 'Cambiar el rol de un miembro' })
  changeRole(
    @Req() req: { membership: never },
    @Param('userId') userId: string,
    @ZodBody(updateMemberRoleSchema) dto: UpdateMemberRoleDto,
  ) {
    return this.membersService.changeRole(req.membership, userId, dto);
  }

  @Delete('members/:userId')
  @SecureAuthEndpoint()
  @UseGuards(OrgRoleGuard)
  @OrgRoles(OrgRole.OWNER, OrgRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'userId', format: 'uuid' })
  @ApiOperation({ summary: 'Expulsar a un miembro de la organización' })
  remove(@Req() req: { membership: never }, @Param('userId') userId: string) {
    return this.membersService.removeMember(req.membership, userId);
  }

  @Get('audit')
  @SecureAuthEndpoint()
  @UseGuards(OrgRoleGuard)
  @OrgRoles(OrgRole.OWNER, OrgRole.ADMIN)
  @ApiOperation({ summary: 'Registro de auditoría de la organización' })
  audit(
    @Req() req: { membership: { organizationId: string } },
    @Query('limit') limit = '50',
    @Query('offset') offset = '0',
  ) {
    return this.auditService.list(
      req.membership.organizationId,
      Number(limit) || 50,
      Number(offset) || 0,
    );
  }
}
