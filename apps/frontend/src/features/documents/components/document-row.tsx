// 📍 DESTINO: apps/frontend/src/features/documents/components/document-row.tsx  (REEMPLAZAR ENTERO)
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FileText, Download, Trash2, Pencil } from 'lucide-react';
import type { DocumentItem } from '../types';
import { documentsApi } from '../api/documents.api';
import { useDeleteDocument, useRenameDocument } from '../hooks/use-documents';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

export function DocumentRow({ doc }: { doc: DocumentItem }) {
  const { t, i18n } = useTranslation(['documents', 'common']);
  const del = useDeleteDocument();
  const rename = useRenameDocument();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(doc.filename);

  const onDownload = async () => {
    try {
      await documentsApi.download(doc.id, doc.filename);
    } catch {
      toast.error(t('errors.download'));
    }
  };

  const commitRename = async () => {
    setEditing(false);
    if (name.trim() && name.trim() !== doc.filename) {
      try {
        await rename.mutateAsync({ id: doc.id, body: { filename: name.trim() } });
      } catch {
        toast.error(t('errors.generic'));
        setName(doc.filename);
      }
    } else {
      setName(doc.filename);
    }
  };

  return (
    <div className="group flex items-center gap-3 border-b border-border/60 px-4 py-3 transition-colors last:border-0 hover:bg-accent/40">
      <FileText size={16} className="shrink-0 text-muted-foreground/60" />
      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void commitRename();
              if (e.key === 'Escape') {
                setEditing(false);
                setName(doc.filename);
              }
            }}
            className="w-full rounded border border-input bg-background px-2 py-1 text-sm"
          />
        ) : (
          <p className="truncate text-sm font-medium text-foreground">{doc.filename}</p>
        )}
        <p className="mt-0.5 font-mono text-[0.66rem] text-muted-foreground/60">
          {humanSize(Number(doc.sizeBytes))} ·{' '}
          {new Date(doc.createdAt).toLocaleDateString(i18n.language)}
          {doc.folder ? ` · ${doc.folder}` : ''}
        </p>
      </div>

      <button
        onClick={() => setEditing(true)}
        title={t('actions.rename')}
        className="p-2 text-muted-foreground/60 transition-colors hover:text-foreground"
      >
        <Pencil size={15} />
      </button>
      <button
        onClick={onDownload}
        title={t('actions.download')}
        className="p-2 text-muted-foreground/60 transition-colors hover:text-primary"
      >
        <Download size={15} />
      </button>

      <AlertDialog>
        <AlertDialogTrigger
          title={t('actions.delete')}
          className="p-2 text-muted-foreground/60 transition-colors hover:text-destructive"
        >
          <Trash2 size={15} />
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('delete.description', { name: doc.filename })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => del.mutate(doc.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}