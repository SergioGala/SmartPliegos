import { z } from 'zod';
import { OrgRole } from '../entities/organization-member.entity';

export const updateMemberRoleSchema = z.object({
  role: z.nativeEnum(OrgRole),
});

export type UpdateMemberRoleDto = z.infer<typeof updateMemberRoleSchema>;
