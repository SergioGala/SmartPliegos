// 📍 DESTINO: apps/frontend/src/features/licitaciones/pages/licitacion-page.tsx  (REEMPLAZAR ENTERO)
//
// Ficha «Terminal» v2. Mismos datos (useLicitacion) y mismo componente de IA
// (<ResumenIaCard>, que llama a generarResumen por dentro). Solo reorganiza al
// estilo editorial: meta mono + título grande + 2 columnas (datos a la izq,
// panel IA + datos clave sticky a la dcha). Se omite "valor estimado del
// contrato" porque tu modelo no trae ese campo (solo base y con IVA).
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import type { LicitacionDocumento } from '../types';
import { ResumenIaCard } from '../components/resumen-ia-card';
import { FavoritoButton } from '../../favoritos/components/favorito-button';
import { PliegosSection } from '../../pliegos/components/pliegos-section';
import { AddToKanbanButton } from '../../kanban/components';
import { useFavoritoIds } from '../../favoritos/hooks/use-favoritos';
import { useLicitacion } from '../hooks/use-licitaciones';
import {
  formatMoney,
  formatMoneyCompact,
  formatDateTime,
  daysUntil,
  prettyEnum,
  cpvLabel,
  getExternalSourceUrl,
  formatLocation,
} from '../utils';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// ─── helpers de presentación ───
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[0.66rem] uppercase tracking-[0.16em] text-muted-foreground/55">
      {children}
    </div>
  );
}

function DataRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/60 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={cn(
          'text-right tabular-nums',
          highlight
            ? 'font-display text-[1.7rem] font-bold leading-none text-primary'
            : 'font-mono text-sm font-medium text-foreground',
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function LicitacionPage() {
  const { t } = useTranslation('search');
  const { id } = useParams<{ id: string }>();
  const { data: lic, isLoading, error } = useLicitacion(id);
  const { data: favoritoIds = [] } = useFavoritoIds();

  const tEnum = (namespace: string, key: string | null | undefined) =>
    key ? t(`${namespace}.${key}`, { defaultValue: prettyEnum(key) }) : '';

  // ═══ Loading ═══
  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1180px] space-y-6 px-6 pt-10 md:px-12">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="grid gap-10 pt-6 lg:grid-cols-[1fr_360px]">
          <Skeleton className="h-64" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  // ═══ Error ═══
  if (error || !lic) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <h2 className="mb-2 font-display text-xl font-bold">
          {t('detail.notFoundTitle')}
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">{t('detail.notFoundBody')}</p>
        <Link
          to="/buscar"
          className="font-mono text-[0.75rem] uppercase tracking-[0.08em] text-primary hover:underline"
        >
          ← {t('detail.backToSearch')}
        </Link>
      </div>
    );
  }

  const isOpen = lic.estado === 'ABIERTA';
  const deadline = daysUntil(lic.fechaPresentacion);
  const moneyBase = formatMoneyCompact(lic.presupuestoBase);
  const moneyIva = formatMoneyCompact(lic.presupuestoConIva);
  const isFavorite = favoritoIds.includes(lic.id);
  const location = formatLocation(lic.municipio, lic.provincia, lic.ccaa);
  const sourceUrl = getExternalSourceUrl(lic.source, lic.externalId);
  const sourceLabel = lic.source === 'BOE' ? 'Ver en BOE' : 'Ver en PLACE';
  const dayWord = deadline.days === 1 ? t('detail.day', { defaultValue: 'día' }) : t('detail.days', { defaultValue: 'días' });

  return (
    <div className="mx-auto max-w-[1180px] px-6 pb-24 pt-8 md:px-12">
      {/* ═══ Back + fuente ═══ */}
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/buscar"
          className="font-mono text-[0.66rem] uppercase tracking-[0.1em] text-muted-foreground/60 transition-colors hover:text-foreground"
        >
          ← {t('detail.backToTerminal', { defaultValue: 'Volver a la terminal' })}
        </Link>
      </div>

      {/* ═══ Meta + Título + Sub ═══ */}
      <div className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[0.68rem] uppercase tracking-[0.1em]">
        <span className={isOpen ? 'text-primary' : 'text-muted-foreground/60'}>
          {tEnum('estado', lic.estado)}
        </span>
        {lic.tipoContrato && (
          <>
            <span className="text-muted-foreground/30">/</span>
            <span className="text-muted-foreground/70">{tEnum('tipoContrato', lic.tipoContrato)}</span>
          </>
        )}
        {lic.procedimiento && (
          <>
            <span className="text-muted-foreground/30">/</span>
            <span className="text-muted-foreground/70">{tEnum('procedimiento', lic.procedimiento)}</span>
          </>
        )}
        {isOpen && deadline.days !== null && deadline.days >= 0 && (
          <>
            <span className="text-muted-foreground/30">/</span>
            <span className="text-primary">
              {deadline.days} {dayWord} {t('detail.remaining', { defaultValue: 'restantes' })}
            </span>
          </>
        )}
      </div>

      <h1 className="mt-3 max-w-[20ch] font-display text-[clamp(2.2rem,5vw,3.6rem)] font-extrabold leading-[1.02] tracking-[-0.025em] text-foreground">
        {lic.title}
      </h1>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[0.72rem] text-muted-foreground/70">
        {lic.organo?.nombre && <span>{lic.organo.nombre}</span>}
        {location && <span>{location}</span>}
        {lic.externalId && <span>Exp. {lic.externalId}</span>}
        {lic.fechaPublicacion && (
          <span>
            {t('detail.publishedShort', { defaultValue: 'Publicada' })}{' '}
            {formatDateTime(lic.fechaPublicacion)}
          </span>
        )}
      </div>

      <hr className="mt-6 border-border" />

      {/* ═══ 2 columnas ═══ */}
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px] lg:items-start">
        {/* ── IZQUIERDA: datos ── */}
        <div className="min-w-0 space-y-10">
          {/* Datos económicos */}
          <section>
            <SectionLabel>{t('detail.economicTitle')}</SectionLabel>
            <div className="mt-3">
              <DataRow
                label={t('detail.budgetBaseNoIva')}
                value={`${moneyBase.num} ${moneyBase.unit}`}
                highlight
              />
              <DataRow
                label={t('detail.budgetWithIva')}
                value={`${moneyIva.num} ${moneyIva.unit}`}
              />
              {lic.importeAdjudicacion != null && (
                <DataRow
                  label={t('detail.awardAmount')}
                  value={formatMoney(lic.importeAdjudicacion)}
                />
              )}
              {lic.porcentajeBaja != null && (
                <DataRow label={t('detail.discount')} value={`${lic.porcentajeBaja}%`} />
              )}
              {lic.numLicitadores != null && (
                <DataRow label={t('detail.numBidders')} value={String(lic.numLicitadores)} />
              )}
              <DataRow
                label={t('detail.hasLots', { defaultValue: 'División en lotes' })}
                value={
                  lic.tieneLotes
                    ? t('detail.yes', { defaultValue: 'Sí' })
                    : t('detail.no', { defaultValue: 'No' })
                }
              />
            </div>
          </section>

          {/* CPV */}
          {lic.cpvCodes && lic.cpvCodes.length > 0 && (
            <section>
              <SectionLabel>{t('detail.cpvTitle')}</SectionLabel>
              <TooltipProvider>
                <div className="mt-3 flex flex-wrap gap-2">
                  {lic.cpvCodes.map((cpv: string) => {
                    const label = cpvLabel(cpv);
                    return (
                      <Tooltip key={cpv}>
                        <TooltipTrigger asChild>
                          <span className="cursor-help rounded-md border border-border px-2.5 py-1 font-mono text-[0.72rem] text-muted-foreground">
                            {cpv}
                          </span>
                        </TooltipTrigger>
                        {label && label !== cpv && (
                          <TooltipContent>
                            <p>{label}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    );
                  })}
                </div>
              </TooltipProvider>
            </section>
          )}

          {/* Fechas */}
          <section>
            <SectionLabel>{t('detail.datesTitle')}</SectionLabel>
            <div className="mt-3">
              <DataRow
                label={t('detail.publication')}
                value={formatDateTime(lic.fechaPublicacion)}
              />
              <DataRow
                label={t('detail.presentationDeadline')}
                value={formatDateTime(lic.fechaPresentacion)}
              />
              {lic.fechaAdjudicacion && (
                <DataRow
                  label={t('detail.awardDate')}
                  value={formatDateTime(lic.fechaAdjudicacion)}
                />
              )}
            </div>
          </section>

          {/* Adjudicatario */}
          {lic.adjudicatarioNombre?.trim() && (
            <section>
              <SectionLabel>{t('detail.awardeeTitle')}</SectionLabel>
              <div className="mt-3">
                <div className="font-display text-lg font-semibold text-foreground">
                  {lic.adjudicatarioNombre}
                </div>
                {lic.adjudicatarioNif && (
                  <div className="mt-0.5 font-mono text-xs text-muted-foreground">
                    {t('detail.nifLabel')} {lic.adjudicatarioNif}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Descripción */}
          {lic.description?.trim() && (
            <section>
              <SectionLabel>{t('detail.descriptionTitle')}</SectionLabel>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {lic.description}
              </p>
            </section>
          )}

          {/* Documentos */}
          {lic.documentos && lic.documentos.length > 0 && (
            <section>
              <SectionLabel>
                {t('detail.documentsTitle')} · {lic.documentos.length}
              </SectionLabel>
              <div className="mt-3 divide-y divide-border/60">
                {lic.documentos.map((doc: LicitacionDocumento, i: number) => (
                  <a
                    key={i}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 py-2.5 transition-colors"
                  >
                    <span className="flex-1 truncate text-sm text-foreground transition-colors group-hover:text-primary">
                      {doc.nombre ||
                        doc.tipo ||
                        t('detail.documentFallback', { defaultValue: 'Documento' })}
                    </span>
                    {doc.tipo && (
                      <span className="font-mono text-[0.62rem] uppercase tracking-[0.08em] text-muted-foreground/60">
                        {doc.tipo}
                      </span>
                    )}
                    <span className="text-muted-foreground/50 transition-colors group-hover:text-primary">
                      ↗
                    </span>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* ── Pliegos (Sprint P10) ── */}
          <PliegosSection licitacionId={lic.id} />
        </div>

        {/* ── DERECHA: panel IA + datos clave (sticky) ── */}
        <aside className="space-y-4 lg:sticky lg:top-8">
          {/* Panel de resumen IA (componente existente, cableado) */}
          <ResumenIaCard licitacionId={lic.id} resumenInicial={lic.resumenIA} />

          {/* Datos clave */}
          <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <div>
              <div className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-muted-foreground/50">
                {t('detail.budgetLabel')}
              </div>
              <div className="mt-1 flex items-baseline gap-1 tabular-nums">
                <span className="font-display text-[2rem] font-bold leading-none text-primary">
                  {moneyBase.num}
                </span>
                <span className="font-mono text-sm text-muted-foreground">
                  {moneyBase.unit}
                </span>
              </div>
              <div className="mt-1 font-mono text-[0.62rem] text-muted-foreground/60">
                {t('detail.ivaExcluded', { defaultValue: 'IVA excluido' })}
              </div>
            </div>

            {isOpen && deadline.days !== null && deadline.days >= 0 && (
              <div className="border-t border-border/60 pt-4">
                <div className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-muted-foreground/50">
                  {t('detail.deadlineWord', { defaultValue: 'Plazo' })}
                </div>
                <div className="mt-1 text-sm text-foreground">
                  {t('detail.presentationIn', { defaultValue: 'Presentación en' })}{' '}
                  <span className="font-semibold text-primary">
                    {deadline.days} {dayWord}
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-border/60 pt-4">
              <div className="flex items-center gap-3">
                <FavoritoButton licitacionId={lic.id} isSaved={isFavorite} />
                {sourceUrl && (
                  <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.06em] text-primary-foreground transition-transform hover:-translate-y-0.5"
                  >
                    ↗ {sourceLabel}
                  </a>
                )}
              </div>
              <AddToKanbanButton licitacionId={lic.id} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}