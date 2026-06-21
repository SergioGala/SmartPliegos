import { apiDelete, apiGet, apiPatch } from '@/lib/api-client';
import type { AuditLogEntry, OrgMember, OrgRole } from '../types';

export const membersApi = {
  async list(): Promise<OrgMember[]> {
    return apiGet<OrgMember[]>('/organizations/members');
  },

  async changeRole(userId: string, role: OrgRole): Promise<OrgMember> {
    return apiPatch<OrgMember, { role: OrgRole }>(
      `/organizations/members/${userId}/role`,
      { role },
    );
  },

  async remove(userId: string): Promise<void> {
    return apiDelete(`/organizations/members/${userId}`);
  },

  async audit(limit = 50): Promise<AuditLogEntry[]> {
    return apiGet<AuditLogEntry[]>(`/organizations/audit?limit=${limit}`);
  },
};
