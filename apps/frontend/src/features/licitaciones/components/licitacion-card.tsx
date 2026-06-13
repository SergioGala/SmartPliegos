// 📍 DESTINO: apps/frontend/src/features/licitaciones/components/licitacion-card.tsx  (REEMPLAZAR ENTERO)
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { LicitacionCard as LicitacionCardType } from '../types';
import {
  daysUntil,
  deadlineLabel,
  formatLocation,
  formatMoneyCompact,
  prettyEnum,
} from '../utils';
import { cn } from '@/lib/utils';
import { FavoritoButton } from '../../favoritos/components/favorito-button';

interface LicitacionCardProps {
  licitacion: LicitacionCardType;
  index?: number;
  isSaved?: boolean;
  /**
   * Afinidad 0–100. OPCIONAL: el modelo actual no la trae (depende del
   * matching semántico, aún sin cablear). Si no se pasa, no se pinta la barra.
   */
  match?: number;
}

type DeadlineLevel = 'critical' | 'warning' | 'info' | 'relaxed';

/** Color del plazo (texto, no badge) usando tokens semánticos del tema. */
const deadlineColor: Record<DeadlineLevel, string> = {
  critical: 'text-destructive',
  warning: 'text-warning',
  info: 'text-muted-foreground',
  relaxed: 'text-muted-foreground/60',
};

export function LicitacionCard({
  licitacion,
  index = 0,
  isSaved = false,
  match,
}: LicitacionCardProps) {
  const { t } = useTranslation('search');

  // Anima la barra de afinidad de 0 → match% al montar.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Diferir el setState fuera del cuerpo del efecto (evita render en cascada
    // y satisface react-hooks/set-state-in-effect); además garantiza un frame
    // pintado a 0% antes de transicionar a match%.
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const tEnum = (namespace: string, key: string | null | undefined) =>
    key ? t(`${namespace}.${key}`, { defaultValue: prettyEnum(key) }) : '';

  const estadoLabel = tEnum('estado', licitacion.estado);
  const isOpen = licitacion.estado === 'ABIERTA';

  const deadline = daysUntil(licitacion.fechaPresentacion);
  const location = formatLocation(
    licitacion.municipio,
    licitacion.provincia,
    licitacion.ccaa,
  );
  const money = formatMoneyCompact(licitacion.presupuestoBase);

  const deadlineLevel: DeadlineLevel | null =
    !isOpen || deadline.days === null
      ? null
      : deadline.days <= 5
      ? 'critical'
      : deadline.days <= 14
      ? 'warning'
      : deadline.days <= 30
      ? 'info'
      : 'relaxed';

  const hasMatch = typeof match === 'number';
  const strongMatch = hasMatch && match! >= 70;
  const ix = String(index + 1).padStart(3, '0');

  return (
    <Link
      to={`/licitaciones/${licitacion.id}`}
      className={cn(
        'group grid items-center rounded-[13px] border-t border-border',
        'grid-cols-[28px_1fr_auto_36px] gap-4 px-3 py-5',
        'sm:grid-cols-[40px_1fr_auto_40px] sm:gap-[30px] sm:px-5 sm:py-6',
        'transition-colors hover:bg-accent/50',
      )}
    >
      {/* ── 1 · Índice ── */}
      <span className="self-start pt-1 font-mono text-[0.72rem] tabular-nums tracking-[0.05em] text-muted-foreground/45 transition-colors group-hover:text-primary">
        {ix}
      </span>

      {/* ── 2 · Contenido ── */}
      <div className="min-w-0 pr-2.5">
        {/* Meta mono */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[0.66rem] uppercase tracking-[0.08em]">
          <span className={isOpen ? 'text-primary' : 'text-muted-foreground/60'}>
            {estadoLabel}
          </span>
          {licitacion.tipoContrato && (
            <>
              <span className="text-muted-foreground/30">/</span>
              <span className="text-muted-foreground/70">
                {tEnum('tipoContrato', licitacion.tipoContrato)}
              </span>
            </>
          )}
          {licitacion.procedimiento && (
            <>
              <span className="text-muted-foreground/30">/</span>
              <span className="text-muted-foreground/70">
                {tEnum('procedimiento', licitacion.procedimiento)}
              </span>
            </>
          )}
          {licitacion.tramitacion === 'URGENTE' && (
            <span className="text-warning">· {t('card.urgent')}</span>
          )}
        </div>

        {/* Título */}
        <h3 className="mt-2 line-clamp-2 max-w-[60ch] font-display text-[1.22rem] font-semibold leading-[1.12] tracking-[-0.015em] text-foreground">
          {licitacion.title}
        </h3>

        {/* Sub: órgano · localización · expediente */}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[0.78rem] text-muted-foreground/70">
          {licitacion.organo?.nombre && (
            <span className="max-w-[320px] truncate">{licitacion.organo.nombre}</span>
          )}
          {location && <span>{location}</span>}
          {licitacion.externalId && (
            <span className="font-mono text-[0.72rem] text-muted-foreground/50">
              {licitacion.externalId}
            </span>
          )}
        </div>
      </div>

      {/* ── 3 · Derecha: afinidad + importe + plazo ── */}
      <div className="flex items-center gap-5 sm:gap-[34px]">
        {hasMatch && (
          <div className="hidden w-[104px] md:block">
            <div className="h-[3px] w-full overflow-hidden rounded-full bg-foreground/10">
              <div
                className={cn(
                  'h-full rounded-full transition-[width] duration-700 ease-out',
                  strongMatch ? 'bg-primary' : 'bg-muted-foreground/60',
                )}
                style={{ width: mounted ? `${match}%` : '0%' }}
              />
            </div>
            <div
              className={cn(
                'mt-1.5 font-mono text-[0.62rem] uppercase tracking-[0.06em] tabular-nums',
                strongMatch ? 'text-primary' : 'text-muted-foreground/70',
              )}
            >
              {match}% {t('card.affinity', { defaultValue: 'afinidad' })}
            </div>
          </div>
        )}

        <div className="min-w-[120px] text-right sm:min-w-[132px]">
          {money.num !== '—' ? (
            <div className="flex items-baseline justify-end gap-0.5 tabular-nums">
              <span className="font-display text-[1.7rem] font-bold leading-none tracking-[-0.03em] text-foreground">
                {money.num}
              </span>
              <span className="font-mono text-sm font-medium leading-none text-muted-foreground">
                {money.unit}
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground/50">
              {t('card.noAmount')}
            </span>
          )}
          {isOpen && deadline.days !== null && deadlineLevel && (
            <div
              className={cn(
                'mt-1 font-mono text-[0.72rem] tabular-nums',
                deadlineColor[deadlineLevel],
              )}
            >
              {deadlineLabel(deadline.days, t)}
            </div>
          )}
        </div>
      </div>

      {/* ── 4 · Favorito (columna propia; aparece en hover salvo si guardada) ── */}
      <div
        className={cn(
          'flex justify-center transition-opacity',
          isSaved
            ? 'opacity-100'
            : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100',
        )}
      >
        <FavoritoButton licitacionId={licitacion.id} isSaved={isSaved} />
      </div>
    </Link>
  );
}