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

  const pct = usage ? Math.min(100, Math.round((usage.usedBytes / usage.quotaBytes) * 100)) : 0;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t('subtitle')}</p>
      </div>

      {usage && (
        <div className="rounded-lg border border-border p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">{t('usage.label', { count: usage.count })}</span>
            <span className="font-medium">{humanSize(usage.usedBytes)} / {humanSize(usage.quotaBytes)}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className={pct > 90 ? 'h-full bg-destructive' : 'h-full bg-primary'} style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <UploadDropzone />

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          placeholder={t('searchPlaceholder')}
          className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-sm"
        />
      </div>

      <div className="rounded-lg border border-border">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground text-center">{t('loading')}</p>
        ) : data && data.data.length > 0 ? (
          data.data.map((doc) => <DocumentRow key={doc.id} doc={doc} />)
        ) : (
          <p className="p-8 text-sm text-muted-foreground text-center">{t('empty')}</p>
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
            className="h-8 px-3 rounded-md border border-border text-sm disabled:opacity-40">
            {t('pagination.prev')}
          </button>
          <span className="text-sm text-muted-foreground">{page} / {data.totalPages}</span>
          <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}
            className="h-8 px-3 rounded-md border border-border text-sm disabled:opacity-40">
            {t('pagination.next')}
          </button>
        </div>
      )}
    </div>
  );
}