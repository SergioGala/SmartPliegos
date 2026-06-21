import { useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useChangeMemberRole, useRemoveMember } from '../hooks/use-members';
import type { OrgMember, OrgRole } from '../types';

const ROLE_LABELS: Record<OrgRole, string> = {
  OWNER: 'Propietario',
  ADMIN: 'Administrador',
  MEMBER: 'Miembro',
};

interface Props {
  member: OrgMember;
  canManage: boolean;
}

export function MemberRow({ member, canManage }: Props) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const changeRole = useChangeMemberRole();
  const removeMember = useRemoveMember();
  const [confirming, setConfirming] = useState(false);

  const isSelf = member.userId === currentUserId;

  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3">
      <div className="min-w-0">
        <p className="truncate font-medium">
          {member.firstName} {member.lastName}
          {isSelf && <span className="ml-2 text-xs text-muted-foreground">(tú)</span>}
        </p>
        <p className="truncate text-sm text-muted-foreground">{member.email}</p>
      </div>

      <div className="flex items-center gap-2">
        {canManage && !isSelf ? (
          <select
            className="rounded-md border border-border bg-background px-2 py-1 text-sm"
            value={member.role}
            disabled={changeRole.isPending}
            onChange={(e) =>
              changeRole.mutate({ userId: member.userId, role: e.target.value as OrgRole })
            }
          >
            {(Object.keys(ROLE_LABELS) as OrgRole[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-sm text-muted-foreground">{ROLE_LABELS[member.role]}</span>
        )}

        {canManage && !isSelf && (
          confirming ? (
            <div className="flex items-center gap-1">
              <button
                className="rounded-md bg-destructive px-2 py-1 text-xs text-destructive-foreground"
                disabled={removeMember.isPending}
                onClick={() => removeMember.mutate(member.userId)}
              >
                Confirmar
              </button>
              <button
                className="rounded-md px-2 py-1 text-xs text-muted-foreground"
                onClick={() => setConfirming(false)}
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              className="rounded-md px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
              onClick={() => setConfirming(true)}
            >
              Expulsar
            </button>
          )
        )}
      </div>
    </div>
  );
}
