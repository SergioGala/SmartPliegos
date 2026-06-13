// 📍 DESTINO: apps/frontend/src/features/favoritos/pages/guardadas-page.tsx  (REEMPLAZAR ENTERO)
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LicitacionCard } from '../../licitaciones/components/licitacion-card';
import { LicitacionCardSkeletonList } from '../../licitaciones/components/licitacion-card-skeleton';
import type { LicitacionCard as LicitacionCardType } from '../../licitaciones/types';
import { useFavoritos, useUpdateNota } from '../hooks/use-favoritos';
import type { Favorito } from '../types';

/** GET /favoritos devuelve la licitación cruda (importe string). Normalizamos. */
function toCard(l: NonNullable<Favorito['licitacion']>): LicitacionCardType {
  return {
    ...l,
    presupuestoBase: l.presupuestoBase != null ? Number(l.presupuestoBase) : null,
  };
}

function GuardadaItem({ fav }: { fav: Favorito }) {
  const { t } = useTranslation('favoritos');
  const updateNota = useUpdateNota();
  const [nota, setNota] = useState(fav.nota ?? '');

  const saveNota = () => {
    const value = nota.trim() === '' ? null : nota.trim();
    if (value !== (fav.nota ?? null)) {
      updateNota.mutate({ id: fav.id, nota: value });
    }
  };

  return (
    <div className="space-y-2">
      {fav.licitacion && <LicitacionCard licitacion={toCard(fav.licitacion)} isSaved />}
      <div className="rounded-xl border border-border bg-card p-3">
        <label className="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-muted-foreground/60">
          {t('note.label')}
        </label>
        <textarea
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          onBlur={saveNota}
          rows={2}
          maxLength={2000}
          placeholder={t('note.placeholder')}
          className="mt-1.5 w-full resize-none rounded-md border border-input bg-background p-2 text-sm outline-none focus:border-primary/40"
        />
      </div>
    </div>
  );
}

export function GuardadasPage() {
  const { t } = useTranslation('favoritos');
  const { data: favoritos, isLoading } = useFavoritos();

  return (
    <div className="mx-auto max-w-[1180px] px-6 pb-24 pt-10 md:px-12">
      <div className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-primary">
        / {t('title')}
      </div>
      <h1 className="mt-2 font-display text-[clamp(2rem,4.5vw,3rem)] font-bold tracking-[-0.025em] text-foreground">
        {t('title')}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{t('subtitle')}</p>

      <div className="mt-8">
        {isLoading ? (
          <LicitacionCardSkeletonList count={4} />
        ) : favoritos && favoritos.length > 0 ? (
          <div className="space-y-6">
            {favoritos.map((fav) => (
              <GuardadaItem key={fav.id} fav={fav} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="font-mono text-[0.66rem] uppercase tracking-[0.14em] text-muted-foreground/50">
              {t('empty.title')}
            </div>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">{t('empty.hint')}</p>
            <Link
              to="/buscar"
              className="mt-6 inline-flex items-center rounded-full bg-primary px-5 py-2.5 font-mono text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              {t('empty.cta')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}