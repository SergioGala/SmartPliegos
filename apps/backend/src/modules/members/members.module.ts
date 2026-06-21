import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationMember } from './entities/organization-member.entity';
import { AuditLog } from './entities/audit-log.entity';
import { MembersService } from './members.service';
import { AuditService } from './audit.service';
import { MembersController } from './members.controller';
import { OrgRoleGuard } from './guards/org-role.guard';

@Module({
  imports: [TypeOrmModule.forFeature([OrganizationMember, AuditLog])],
  controllers: [MembersController],
  providers: [MembersService, AuditService, OrgRoleGuard],
  exports: [MembersService, AuditService],
})
export class MembersModule {}
