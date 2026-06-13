import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Bell, BellOff } from 'lucide-react';
import { toast } from 'sonner';
import type { CalendarioEvento } from '../types';
import { useUpsertRecordatorio, useRemoveRecordatorio } from '../hooks/use-calendario';
import { cn } from '@/lib/utils';

const DAYS_OPTIONS = [1, 3, 7, 14];

interface Props {
  evento: CalendarioEvento;
  onClose: () => void;
}

export function RecordatorioDialog({ evento, onClose }: Props) {
  const { t, i18n } = useTranslation('calendario');
  const upsert = useUpsertRecordatorio();
  const remove = useRemoveRecordatorio();
  const [days, setDays] = useState(evento.recordatorio?.daysBefore ?? 3);

  const deadline = new Date(evento.fechaPresentacion).toLocaleString(i18n.language, {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  const save = async () => {
    try {
      await upsert.mutateAsync({ licitacionId: evento.licitacionId, daysBefore: days });
      toast.success(t('dialog.saved'));
      onClose();
    } catch {
      toast.error(t('errors.generic'));
    }
  };

  const removeReminder = async () => {
    try {
      await remove.mutateAsync(evento.licitacionId);
      toast.success(t('dialog.removed'));
      onClose();
    } catch {
      toast.error(t('errors.generic'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-lg border border-border bg-card p-5 shadow-lg">
        <button onClick={onClose} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
          <X size={18} />
        </button>
        <h3 className="pr-6 text-base font-semibold">{evento.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t('dialog.deadline')}: {deadline}</p>

        <label className="mt-4 block text-sm font-medium">{t('dialog.remindLabel')}</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {DAYS_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={cn(
                'rounded-md border px-3 py-1.5 text-sm transition-colors',
                days === d ? 'border-primary bg-primary/10 text-primary' : 'border-input hover:bg-accent',
              )}
            >
              {t('dialog.daysBefore', { count: d })}
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between gap-2">
          {evento.recordatorio ? (
            <button
              type="button"
              onClick={removeReminder}
              disabled={remove.isPending}
              className="inline-flex items-center gap-1.5 text-sm text-destructive hover:underline disabled:opacity-50"
            >
              <BellOff size={14} /> {t('dialog.remove')}
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={save}
            disabled={upsert.isPending}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Bell size={14} /> {evento.recordatorio ? t('dialog.update') : t('dialog.create')}
          </button>
        </div>
      </div>
    </div>
  );
}