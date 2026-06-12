// 📍 DESTINO: apps/frontend/src/features/alerts/pages/alertas-page.tsx  (REEMPLAZAR ENTERO)
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { alertsApi } from '../api/alerts.api';
import { AlertCard } from '../components/alert-card';
import { AlertFormDialog } from '../components/alert-form-dialog';
import { EstadoError } from '@/components/ui/estado-error';
import { cn } from '@/lib/utils';

type FilterTab = 'all' | 'active' | 'inactive';

export function AlertasPage() {
  const { t } = useTranslation('alerts');
  const [filter, setFilter] = useState<FilterTab>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: alerts = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertsApi.list(),
  });

  const filtered = alerts.filter((a) => {
    if (filter === 'active') return a.isActive;
    if (filter === 'inactive') return !a.isActive;
    return true;
  });

  const handleCreate = () => {
    setEditingId(null);
    setDialogOpen(true);
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setDialogOpen(true);
  };

  return (
    <>
      <Helmet>
        <title>{t('page.title')} · SmartPliegos</title>
      </Helmet>

      <div className="mx-auto max-w-[1180px] px-6 pb-24 pt-10 md:px-12">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-primary">
              / {t('page.title')}
            </div>
            <h1 className="mt-2 font-display text-[clamp(2rem,4.5vw,3rem)] font-bold tracking-[-0.025em] text-foreground">
              {t('page.title')}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{t('page.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-mono text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-primary-foreground transition-transform hover:-translate-y-0.5"
          >
            <Plus size={14} />
            {t('page.createButton')}
          </button>
        </header>

        {/* Filtros */}
        {alerts.length > 0 && (
          <div className="mt-8 flex items-center gap-5 border-b border-border">
            {(['all', 'active', 'inactive'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={cn(
                  '-mb-px border-b-2 pb-3 font-mono text-[0.7rem] uppercase tracking-[0.1em] transition-colors',
                  filter === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground/60 hover:text-foreground',
                )}
              >
                {t(`page.filters.${tab}`)}
              </button>
            ))}
          </div>
        )}

        <div className="mt-8">
          {/* Error */}
          {!isLoading && isError && (
            <EstadoError
              titulo={t('page.errorTitle', {
                defaultValue: 'No se pudieron cargar tus alertas',
              })}
              onReintentar={() => refetch()}
            />
          )}

          {/* Empty */}
          {!isLoading && !isError && alerts.length === 0 && (
            <div className="rounded-2xl border border-border bg-card p-10 text-center">
              <div className="font-mono text-[0.66rem] uppercase tracking-[0.14em] text-muted-foreground/50">
                {t('page.empty.title')}
              </div>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                {t('page.empty.subtitle')}
              </p>
              <button
                type="button"
                onClick={handleCreate}
                className="mt-6 inline-flex items-center rounded-full bg-primary px-5 py-2.5 font-mono text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-primary-foreground transition-transform hover:-translate-y-0.5"
              >
                {t('page.empty.cta')}
              </button>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-2xl border border-border bg-card p-5"
                >
                  <div className="mb-3 h-5 w-3/4 rounded bg-muted" />
                  <div className="mb-4 h-3 w-1/2 rounded bg-muted" />
                  <div className="flex gap-2">
                    <div className="h-6 w-16 rounded bg-muted" />
                    <div className="h-6 w-20 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Lista */}
          {!isLoading && filtered.length > 0 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filtered.map((alert) => (
                <AlertCard key={alert.id} alert={alert} onEdit={handleEdit} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialog crear/editar */}
      <AlertFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingId={editingId}
      />
    </>
  );
}