// 📍 DESTINO: apps/frontend/src/features/documents/pages/documentos-page.tsx  (REEMPLAZAR ENTERO)
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { useDocuments, useDocumentUsage } from '../hooks/use-documents';
import { UploadDropzone } from '../components/upload-dropzone';
import { DocumentRow } from '../components/document-row';

function humanSize(bytes: number): string {
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

export function DocumentosPage() {
  const { t } = useTranslation('documents');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useDocuments({ page, q: q || undefined });
  const { data: usage } = useDocumentUsage();

  const pct = usage
    ? Math.min(100, Math.round((usage.usedBytes / usage.quotaBytes) * 100))
    : 0;

  return (
    <div className="mx-auto max-w-3xl px-6 pb-24 pt-10">
      <div className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-primary">
        / {t('title')}
      </div>
      <h1 className="mt-2 font-display text-[clamp(2rem,4.5vw,3rem)] font-bold tracking-[-0.025em] text-foreground">
        {t('title')}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{t('subtitle')}</p>

      {/* Uso de almacenamiento */}
      {usage && (
        <div className="mt-8 rounded-xl border border-border bg-card p-4">
          <div className="mb-2 flex justify-between font-mono text-[0.7rem] uppercase tracking-[0.08em]">
            <span className="text-muted-foreground/70">
              {t('usage.label', { count: usage.count })}
            </span>
            <span className="text-foreground tabular-nums">
              {humanSize(usage.usedBytes)} / {humanSize(usage.quotaBytes)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={pct > 90 ? 'h-full bg-destructive' : 'h-full bg-primary'}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-6">
        <UploadDropzone />
      </div>

      {/* Búsqueda */}
      <div className="relative mt-6">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50"
        />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder={t('searchPlaceholder')}
          className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-primary/40"
        />
      </div>

      {/* Lista */}
      <div className="mt-4 overflow-hidden rounded-xl border border-border">
        {isLoading ? (
          <p className="p-6 text-center text-sm text-muted-foreground">{t('loading')}</p>
        ) : data && data.data.length > 0 ? (
          data.data.map((doc) => <DocumentRow key={doc.id} doc={doc} />)
        ) : (
          <p className="p-8 text-center text-sm text-muted-foreground">{t('empty')}</p>
        )}
      </div>

      {/* Paginación */}
      {data && data.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="h-8 rounded-md border border-border px-3 font-mono text-[0.7rem] uppercase tracking-[0.08em] disabled:opacity-40"
          >
            {t('pagination.prev')}
          </button>
          <span className="font-mono text-[0.72rem] tabular-nums text-muted-foreground">
            {page} / {data.totalPages}
          </span>
          <button
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="h-8 rounded-md border border-border px-3 font-mono text-[0.7rem] uppercase tracking-[0.08em] disabled:opacity-40"
          >
            {t('pagination.next')}
          </button>
        </div>
      )}
    </div>
  );
}