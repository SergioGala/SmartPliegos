// 📍 DESTINO: apps/frontend/src/features/licitaciones/pages/buscar-page.tsx  (REEMPLAZAR ENTERO)
//
// Buscar «Terminal» v2. Mismo motor de antes (URL ↔ params, useLicitaciones,
// useFilterOptions, paginación) — solo cambia el aspecto + se añade el control
// de Orden. El componente <LicitacionFilters> se mantiene intacto (ya hereda
// los tokens charcoal+lima de la Fase 0); su restyle a chips es un paso aparte.
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, Zap  } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { EstadoError } from '@/components/ui/estado-error';

import { useLicitaciones, useFilterOptions } from '../hooks/use-licitaciones';
import { useFavoritoIds } from '../../favoritos/hooks/use-favoritos';
import { LicitacionCard } from '../components/licitacion-card';
import { LicitacionCardSkeletonList } from '../components/licitacion-card-skeleton';
import { LicitacionFilters } from '../components/licitacion-filters';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SearchParams, LicitacionCard as LicitacionCardType } from '../types';

// ═══════════════════════════════════════════════
// Helpers URL ↔ SearchParams  (sin cambios)
// ═══════════════════════════════════════════════

function parseUrlToParams(searchParams: URLSearchParams): SearchParams {
  const getStr = (k: string) => searchParams.get(k) || undefined;
  const getArr = (k: string) => {
    const v = searchParams.get(k);
    if (!v) return undefined;
    const list = v.split(',').filter(Boolean);
    return list.length > 0 ? list : undefined;
  };

  return {
    q: getStr('q'),
    estado: getArr('estado'),
    tipoContrato: getArr('tipoContrato'),
    procedimiento: getArr('procedimiento'),
    tramitacion: getArr('tramitacion'),
    ccaa: getArr('ccaa'),
    provincia: getArr('provincia'),
    organoId: getStr('organoId'),
    page: Number(searchParams.get('page') || 1),
    pageSize: 20,
    sortBy: (getStr('sortBy') as SearchParams['sortBy']) || 'fecha',
    mode: getStr('mode') === 'hybrid' ? 'hybrid' : undefined,
  };
}

function paramsToUrl(params: SearchParams): URLSearchParams {
  const url = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    if (Array.isArray(v)) {
      if (v.length > 0) url.set(k, v.join(','));
    } else {
      url.set(k, String(v));
    }
  });
  return url;
}

// ═══════════════════════════════════════════════
// Página
// ═══════════════════════════════════════════════

export function BuscarPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo(() => parseUrlToParams(searchParams), [searchParams]);
  const { t } = useTranslation('search');

  const [searchText, setSearchText] = useState(params.q || '');
  const [focused, setFocused] = useState(false);

  const smartSearch = params.mode === 'hybrid';

  const toggleSmartSearch = () => {
    commit({ ...params, mode: smartSearch ? undefined : 'hybrid' }, false);
  };

  const { data, isLoading, isError, refetch } = useLicitaciones(params);
  const { data: filterOptions } = useFilterOptions();
  const { data: favoritoIds = [] } = useFavoritoIds();

  const commit = (next: SearchParams, resetPage = true) => {
    const final = { ...next, page: resetPage ? 1 : next.page };
    setSearchParams(paramsToUrl(final));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    commit({ ...params, q: searchText || undefined });
  };

  const goToPage = (newPage: number) => {
    commit({ ...params, page: newPage }, false);
  };

  const totalLabel = data?.total != null ? data.total.toLocaleString('es-ES') : '…';

  const SORT_OPTIONS: { value: NonNullable<SearchParams['sortBy']>; label: string }[] = [
    { value: 'fecha', label: t('sort.fecha', { defaultValue: 'Fecha' }) },
    { value: 'importe', label: t('sort.importe', { defaultValue: 'Importe' }) },
    { value: 'deadline', label: t('sort.deadline', { defaultValue: 'Plazo' }) },
  ];

  return (
    <div className="mx-auto max-w-[1180px] px-6 pb-24 pt-10 md:px-12">
      {/* ═══ Barra de estado ═══ */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[0.66rem] uppercase tracking-[0.1em] text-muted-foreground/70">
        <span className="flex items-center gap-1.5 text-primary">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          {t('page.scrapingActive')}
        </span>
        <span className="text-muted-foreground/40">·</span>
        <span>{t('source.official', { defaultValue: 'Fuente oficial' })}</span>
        <span className="text-muted-foreground/40">·</span>
        <span>
          {totalLabel} {t('page.indexedCount')}
        </span>
      </div>

      {/* ═══ Titular ═══ */}
      <div className="mt-7 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-primary">
        / 02
      </div>
      <h1 className="mt-2 font-display text-[clamp(2rem,4.5vw,3.2rem)] font-bold leading-[1.04] tracking-[-0.025em] text-foreground">
        /{' '}
        {t('page.searchHeading', {
          defaultValue: 'buscar entre {{count}} licitaciones…',
          count: totalLabel,
        })}
      </h1>

      {/* ═══ Búsqueda ═══ */}
      <form onSubmit={handleSearch} className="mt-6">
        <div
          className={cn(
            'flex items-center gap-3 rounded-2xl border px-5 transition-all duration-200',
            focused ? 'border-primary/50 bg-primary/[0.03]' : 'border-border bg-card',
          )}
        >
          <Search
            size={18}
            className={cn(
              'shrink-0 transition-colors',
              focused ? 'text-primary' : 'text-muted-foreground/50',
            )}
          />
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={t('input.placeholder')}
            className="flex-1 bg-transparent py-4 text-[0.95rem] text-foreground outline-none placeholder:text-muted-foreground/40"
          />
          <kbd className="hidden items-center rounded border border-border bg-muted px-2 py-1 font-mono text-[10px] text-muted-foreground sm:inline-flex">
            ⌘K
          </kbd>
          <button
            type="button"
            onClick={toggleSmartSearch}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
              smartSearch
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
            title={t('smartToggle.tooltip')}
          >
            <Zap size={13} className={smartSearch ? 'fill-current' : ''} />
            {t('smartToggle.label')}
          </button>
          <Button type="submit" size="sm" className="h-9 rounded-xl">
            {t('input.submitButton')}
          </Button>
        </div>
      </form>

      {/* ═══ Filtros (componente existente, ya tematizado) ═══ */}
      <div className="mt-5">
        <LicitacionFilters
          filters={params}
          options={filterOptions}
          onChange={(next) => commit(next)}
        />
      </div>

      {/* ═══ Meta de resultados + Orden ═══ */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
        <span className="font-mono text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground/70">
          <span className="font-semibold text-foreground tabular-nums">{totalLabel}</span>{' '}
          {t('results.count', { defaultValue: 'resultados' })}
        </span>

        <label className="flex items-center gap-2 font-mono text-[0.66rem] uppercase tracking-[0.1em] text-muted-foreground/60">
          {t('sort.label', { defaultValue: 'Orden' })} ·
          <select
            value={params.sortBy ?? 'fecha'}
            onChange={(e) =>
              commit({ ...params, sortBy: e.target.value as SearchParams['sortBy'] })
            }
            className="cursor-pointer rounded-md border border-border bg-card px-2 py-1 font-mono text-[0.7rem] text-foreground outline-none focus:border-primary/50"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* ═══ Resultados ═══ */}
      <div className="mt-2">
        {isError ? (
          <EstadoError
            titulo={t('results.errorTitle', {
              defaultValue: 'No se pudieron cargar las licitaciones',
            })}
            onReintentar={() => refetch()}
          />
        ) : isLoading ? (
          <LicitacionCardSkeletonList count={6} />
        ) : data && data.data.length > 0 ? (
          <>
            <div>
              {data.data.map((lic: LicitacionCardType, i: number) => (
                <LicitacionCard
                  key={lic.id}
                  licitacion={lic}
                  index={(((data.page ?? 1) - 1) * (data.pageSize ?? 20)) + i}
                  isSaved={favoritoIds.includes(lic.id)}
                />
              ))}
            </div>

            {data.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3 border-t border-border pt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(params.page ?? 1) <= 1}
                  onClick={() => goToPage((params.page ?? 1) - 1)}
                >
                  <ChevronLeft size={14} />
                  {t('pagination.previous')}
                </Button>
                <span className="px-3 font-mono text-[0.75rem] uppercase tracking-[0.08em] text-muted-foreground">
                  {t('pagination.pageLabel')}{' '}
                  <span className="font-bold text-foreground tabular-nums">{data.page}</span>{' '}
                  {t('pagination.of')}{' '}
                  <span className="font-bold text-foreground tabular-nums">
                    {data.totalPages}
                  </span>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data.hasMore}
                  onClick={() => goToPage((params.page ?? 1) + 1)}
                >
                  {t('pagination.next')}
                  <ChevronRight size={14} />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border">
              <Search size={20} className="text-muted-foreground/40" />
            </div>
            <h3 className="mb-1 font-display text-base font-semibold text-foreground">
              {t('results.empty')}
            </h3>
            <p className="text-sm text-muted-foreground">{t('results.emptyHint')}</p>
          </div>
        )}
      </div>
    </div>
  );
}