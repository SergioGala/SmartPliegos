// 📍 DESTINO: apps/frontend/src/features/home/pages/home-page.tsx  (REEMPLAZAR ENTERO)
//
// Inicio «Terminal» v2. Usa SOLO datos reales que ya expone tu API:
//   · useLicitaciones({})      → total indexado + feed reciente
//   · useFavoritoIds()         → nº de guardadas + corazones del feed
//   · alertsApi.list()         → nº de alertas activas
//
// El diseño original gira en torno a la AFINIDAD/matching (“N para ti hoy”,
// “mejor coincidencia”, anillo %). Eso aún no está cableado, así que NO se
// inventa: el héroe muestra el total real, la card es la “Destacada” (más
// reciente, sin anillo) y el strip son cifras reales. Cuando exista el
// matching, aquí se cambia el número del héroe por las coincidencias y se
// pasa `match` a las filas / se pinta el anillo.
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import { useLicitaciones } from '../../licitaciones/hooks/use-licitaciones';
import { useFavoritoIds } from '../../favoritos/hooks/use-favoritos';
import { alertsApi } from '../../alerts/api/alerts.api';
import { LicitacionCard } from '../../licitaciones/components/licitacion-card';
import { LicitacionCardSkeletonList } from '../../licitaciones/components/licitacion-card-skeleton';
import {
  formatMoneyCompact,
  daysUntil,
  formatLocation,
} from '../../licitaciones/utils';
import type { LicitacionCard as LicitacionCardType } from '../../licitaciones/types';
import { cn } from '@/lib/utils';

/** Compacta enteros grandes: 288412 → "288K", 39900 → "39.9K". */
function compactInt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, '')}K`;
  return String(n);
}

export function HomePage() {
  const { t } = useTranslation('home');
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useLicitaciones({});
  const { data: favoritoIds = [] } = useFavoritoIds();
  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertsApi.list(),
    refetchInterval: 60_000,
  });

  const total = data?.total ?? null;
  const feed = data?.data ?? [];
  const activeAlerts = alerts.filter((a) => a.isActive).length;
  const saved = favoritoIds.length;

  // "Cierran pronto" = abiertas con ≤7 días, calculado sobre el feed visible.
  const closingSoon = feed.filter((l) => {
    if (l.estado !== 'ABIERTA') return false;
    const d = daysUntil(l.fechaPresentacion).days;
    return d !== null && d >= 0 && d <= 7;
  }).length;

  const featured = feed[0];

  const now = new Date();
  const fecha = now
    .toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
    .toUpperCase();
  const hora = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="mx-auto max-w-[1180px] px-6 pb-24 pt-10 md:px-12">
      {/* ═══ Barra de estado ═══ */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[0.66rem] uppercase tracking-[0.1em] text-muted-foreground/70">
        <span className="flex items-center gap-1.5 text-primary">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          {t('status.live', { defaultValue: 'En vivo' })}
        </span>
        {total !== null && (
          <span>
            {total.toLocaleString('es-ES')}{' '}
            {t('status.tenders', { defaultValue: 'licitaciones' })}
          </span>
        )}
        <span className="text-muted-foreground/50">
          {fecha} · {hora}
        </span>
      </div>

      {/* ═══ Héroe + Destacada ═══ */}
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px] lg:items-start">
        <div>
          <div className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-primary">
            / {t('hero.eyebrow', { defaultValue: 'panel' })}
          </div>
          <h1 className="mt-3 font-display text-[clamp(2.6rem,7vw,5rem)] font-extrabold leading-[0.98] tracking-[-0.03em] text-foreground">
            <span className="text-primary">
              {total !== null ? total.toLocaleString('es-ES') : '—'}
            </span>
            <br />
            {t('hero.headline', { defaultValue: 'licitaciones públicas en seguimiento.' })}
          </h1>
          <p className="mt-5 max-w-[48ch] text-[0.95rem] leading-relaxed text-muted-foreground">
            {t('hero.lead', {
              defaultValue:
                '{{saved}} guardadas · {{alerts}} alertas activas vigilando el BOE y PLACE en tiempo real.',
              saved,
              alerts: activeAlerts,
            })}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/buscar')}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-mono text-[0.75rem] font-semibold uppercase tracking-[0.06em] text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              {t('hero.cta', { defaultValue: 'Explorar licitaciones' })} →
            </button>
            <button
              type="button"
              onClick={() => navigate('/alertas')}
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 font-mono text-[0.75rem] font-semibold uppercase tracking-[0.06em] text-foreground transition-colors hover:bg-accent/50"
            >
              {t('hero.cta2', { defaultValue: 'Mis alertas' })}
            </button>
          </div>
        </div>

        {featured && (
          <FeaturedCard
            licitacion={featured}
            onOpen={() => navigate(`/licitaciones/${featured.id}`)}
            label={t('featured.label', { defaultValue: 'Destacada' })}
            ctaLabel={t('featured.cta', { defaultValue: 'Ver ficha' })}
          />
        )}
      </div>

      {/* ═══ Strip de cifras (reales) ═══ */}
      <div className="mt-14 grid grid-cols-2 gap-6 border-t border-border pt-8 md:grid-cols-4">
        <Stat
          value={total !== null ? compactInt(total) : '—'}
          label={t('stats.indexed', { defaultValue: 'Indexadas' })}
        />
        <Stat
          value={String(activeAlerts)}
          label={t('stats.alerts', { defaultValue: 'Alertas activas' })}
        />
        <Stat
          value={String(saved)}
          label={t('stats.saved', { defaultValue: 'Guardadas' })}
        />
        <Stat
          value={String(closingSoon)}
          label={t('stats.closing', { defaultValue: 'Cierran pronto' })}
        />
      </div>

      {/* ═══ Feed reciente ═══ */}
      <div className="mt-16">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-muted-foreground/70">
            / {t('feed.title', { defaultValue: 'lo más reciente' })}
          </h2>
          <button
            type="button"
            onClick={() => navigate('/buscar')}
            className="font-mono text-[0.66rem] uppercase tracking-[0.08em] text-muted-foreground/60 transition-colors hover:text-primary"
          >
            {t('feed.all', { defaultValue: 'ver todo' })} →
          </button>
        </div>

        {isLoading ? (
          <LicitacionCardSkeletonList count={5} />
        ) : isError ? (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              {t('feed.error', { defaultValue: 'No se pudo cargar el feed.' })}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-3 font-mono text-[0.7rem] uppercase tracking-[0.08em] text-primary hover:underline"
            >
              {t('feed.retry', { defaultValue: 'Reintentar' })}
            </button>
          </div>
        ) : feed.length > 0 ? (
          <div>
            {feed.slice(0, 8).map((lic, i) => (
              <LicitacionCard
                key={lic.id}
                licitacion={lic}
                index={i}
                isSaved={favoritoIds.includes(lic.id)}
              />
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-sm text-muted-foreground">
            {t('feed.empty', { defaultValue: 'Todavía no hay licitaciones.' })}
          </p>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//   Card «Destacada» — la más reciente del feed (sin afinidad)
// ═══════════════════════════════════════════════════════════

function FeaturedCard({
  licitacion,
  onOpen,
  label,
  ctaLabel,
}: {
  licitacion: LicitacionCardType;
  onOpen: () => void;
  label: string;
  ctaLabel: string;
}) {
  const money = formatMoneyCompact(licitacion.presupuestoBase);
  const deadline = daysUntil(licitacion.fechaPresentacion);
  const loc = formatLocation(
    licitacion.municipio,
    licitacion.provincia,
    licitacion.ccaa,
  );

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'group w-full rounded-2xl border border-border bg-card p-6 text-left',
        'transition-colors hover:border-primary/40',
      )}
    >
      <div className="flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-[0.1em] text-primary">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        {label}
      </div>

      <h3 className="mt-3 line-clamp-3 font-display text-[1.25rem] font-semibold leading-snug tracking-[-0.015em] text-foreground">
        {licitacion.title}
      </h3>

      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[0.64rem] text-muted-foreground/70">
        {licitacion.organo?.nombre && (
          <span className="max-w-[200px] truncate">{licitacion.organo.nombre}</span>
        )}
        {loc && <span>· {loc}</span>}
        {licitacion.externalId && <span>· {licitacion.externalId}</span>}
      </div>

      <div className="mt-5 flex items-end justify-between">
        {money.num !== '—' ? (
          <div className="flex items-baseline gap-0.5 tabular-nums">
            <span className="font-display text-[2rem] font-bold leading-none tracking-[-0.03em] text-foreground">
              {money.num}
            </span>
            <span className="font-mono text-sm text-muted-foreground">{money.unit}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground/50">—</span>
        )}

        <span className="inline-flex items-center gap-2 font-mono text-[0.66rem] uppercase tracking-[0.06em] text-muted-foreground transition-colors group-hover:text-primary">
          {licitacion.estado === 'ABIERTA' &&
            deadline.days !== null &&
            deadline.days >= 0 && (
              <span className="tabular-nums">
                {deadline.days === 0 ? 'hoy' : `${deadline.days} días`}
              </span>
            )}
          {ctaLabel} →
        </span>
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════
//   Stat — cifra Bricolage + etiqueta mono
// ═══════════════════════════════════════════════════════════

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display text-[2.4rem] font-bold leading-none tracking-[-0.02em] text-foreground tabular-nums">
        {value}
      </div>
      <div className="mt-2 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-muted-foreground/60">
        {label}
      </div>
    </div>
  );
}