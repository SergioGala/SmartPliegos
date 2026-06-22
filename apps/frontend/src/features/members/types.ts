export type OrgRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface OrgMember {
  id: string;
  userId: string;
  role: OrgRole;
  joinedAt: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface AuditLogEntry {
  id: string;
  actorUserId: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}
