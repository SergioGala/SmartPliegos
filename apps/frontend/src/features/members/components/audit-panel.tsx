import { useOrgAudit } from '../hooks/use-members';
import type { AuditLogEntry } from '../types';

const ACTION_LABELS: Record<string, string> = {
  MEMBER_ROLE_CHANGED: 'cambió el rol de un miembro',
  MEMBER_REMOVED: 'expulsó a un miembro',
  MEMBER_JOINED: 'se unió a la organización',
  INVITATION_SENT: 'envió una invitación',
  ORG_UPDATED: 'actualizó los datos de la organización',
};

function describe(entry: AuditLogEntry): string {
  const base = ACTION_LABELS[entry.action] ?? entry.action;

  if (entry.action === 'MEMBER_ROLE_CHANGED' && entry.metadata?.from) {
    return `${base} (${String(entry.metadata.from)} → ${String(entry.metadata.to)})`;
  }

  return base;
}

export function AuditPanel() {
  const { data, isLoading } = useOrgAudit();

  if (isLoading) return <p className="text-sm text-muted-foreground">Cargando actividad…</p>;
  if (!data?.length) return <p className="text-sm text-muted-foreground">Sin actividad todavía.</p>;

  return (
    <ul className="space-y-2">
      {data.map((entry) => (
        <li key={entry.id} className="flex items-baseline gap-2 text-sm">
          <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
            {new Date(entry.createdAt).toLocaleString('es-ES', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          <span>{describe(entry)}</span>
        </li>
      ))}
    </ul>
  );
}
