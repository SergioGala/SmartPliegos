import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bookmark } from 'lucide-react';
import { LicitacionCard } from '../../licitaciones/components/licitacion-card';
import { LicitacionCardSkeletonList } from '../../licitaciones/components/licitacion-card-skeleton';
import type { LicitacionCard as LicitacionCardType } from '../../licitaciones/types';
import { useFavoritos, useUpdateNota } from '../hooks/use-favoritos';
import type { Favorito } from '../types';

/**
 * GET /favoritos devuelve `licitacion` como entidad cruda: el importe llega
 * como string (bigint) y `organo` puede no venir. Normalizamos a LicitacionCard.
 */
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
      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <label className="text-xs font-medium text-muted-foreground">{t('note.label')}</label>
        <textarea
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          onBlur={saveNota}
          rows={2}
          maxLength={2000}
          placeholder={t('note.placeholder')}
          className="mt-1 w-full resize-none rounded-md border border-input bg-background p-2 text-sm outline-none focus:border-primary/40"
        />
      </div>
    </div>
  );
}

export function GuardadasPage() {
  const { t } = useTranslation('favoritos');
  const { data: favoritos, isLoading } = useFavoritos();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      {isLoading ? (
        <LicitacionCardSkeletonList count={4} />
      ) : favoritos && favoritos.length > 0 ? (
        <div className="space-y-4">
          {favoritos.map((fav) => (
            <GuardadaItem key={fav.id} fav={fav} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <Bookmark size={22} className="text-muted-foreground/40" />
          </div>
          <h3 className="mb-1 text-base font-semibold">{t('empty.title')}</h3>
          <p className="mb-4 text-sm text-muted-foreground">{t('empty.hint')}</p>
          <Link
            to="/buscar"
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t('empty.cta')}
          </Link>
        </div>
      )}
    </div>
  );
}