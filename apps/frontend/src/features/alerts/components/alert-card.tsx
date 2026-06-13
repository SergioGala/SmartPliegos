// 📍 DESTINO: apps/frontend/src/features/alerts/components/alert-card.tsx  (REEMPLAZAR ENTERO)
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Power, PowerOff, Pencil, Trash2 } from 'lucide-react';
import { alertsApi } from '../api/alerts.api';
import type { Alert } from '../types';
import { cn } from '@/lib/utils';
import { DeleteAlertDialog } from './delete-alert-dialog';

interface AlertCardProps {
  alert: Alert;
  onEdit: (id: string) => void;
}

export function AlertCard({ alert, onEdit }: AlertCardProps) {
  const { t } = useTranslation('alerts');
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const toggleMutation = useMutation({
    mutationFn: () => alertsApi.update(alert.id, { isActive: !alert.isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success(t('form.success.updated'));
    },
    onError: () => toast.error(t('form.errors.updateFailed')),
  });

  const criteriaChips: string[] = [];
  if (alert.ccaas?.length) {
    criteriaChips.push(`${alert.ccaas.length} CCAA`);
  }
  if (alert.tiposContrato?.length) {
    criteriaChips.push(alert.tiposContrato.slice(0, 2).join(', '));
  }
  if (alert.importeMin || alert.importeMax) {
    criteriaChips.push(
      `${alert.importeMin ? `≥${alert.importeMin}€` : ''}${
        alert.importeMax ? ` ≤${alert.importeMax}€` : ''
      }`.trim(),
    );
  }
  if (alert.palabrasClave) {
    criteriaChips.push(`"${alert.palabrasClave.slice(0, 20)}..."`);
  }

  return (
    <>
      <div
        className={cn(
          'rounded-2xl border bg-card p-5 transition-colors',
          alert.isActive
            ? 'border-border hover:border-primary/40'
            : 'border-border/50 opacity-60 hover:opacity-90',
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-display text-base font-semibold text-foreground">
                {alert.name}
              </h3>
              {!alert.isActive && (
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.1em] text-muted-foreground">
                  {t('card.paused')}
                </span>
              )}
            </div>
            {alert.description && (
              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                {alert.description}
              </p>
            )}
          </div>
          <span
            className={cn(
              'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
              alert.isActive ? 'bg-primary' : 'bg-muted-foreground/40',
            )}
          />
        </div>

        {/* Chips de criterios */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {criteriaChips.map((chip, i) => (
            <span
              key={i}
              className="rounded-full border border-border px-2 py-0.5 font-mono text-[0.62rem] text-muted-foreground"
            >
              {chip}
            </span>
          ))}
          {criteriaChips.length === 0 && (
            <span className="font-mono text-[0.62rem] text-muted-foreground/60">
              {t('common:status.none')}
            </span>
          )}
        </div>

        {/* Acciones */}
        <div className="mt-4 flex items-center gap-1 border-t border-border/60 pt-3">
          <button
            type="button"
            onClick={() => toggleMutation.mutate()}
            disabled={toggleMutation.isPending}
            className="flex h-8 items-center gap-1.5 rounded-md px-2.5 font-mono text-[0.66rem] uppercase tracking-[0.06em] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label={alert.isActive ? t('card.pauseButton') : t('card.activateButton')}
          >
            {alert.isActive ? <PowerOff size={12} /> : <Power size={12} />}
            {alert.isActive ? t('card.pauseButton') : t('card.activateButton')}
          </button>
          <button
            type="button"
            onClick={() => onEdit(alert.id)}
            className="flex h-8 items-center gap-1.5 rounded-md px-2.5 font-mono text-[0.66rem] uppercase tracking-[0.06em] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Pencil size={12} />
            {t('card.editButton')}
          </button>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="ml-auto flex h-8 items-center gap-1.5 rounded-md px-2.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            aria-label={t('card.deleteButton')}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <DeleteAlertDialog open={deleteOpen} onOpenChange={setDeleteOpen} alert={alert} />
    </>
  );
}