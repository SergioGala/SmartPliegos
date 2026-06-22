import { useState } from 'react';
import {
  FileText,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { usePliegos, useSyncPliegos } from '../hooks/use-pliegos';
import { PliegoViewer } from './pliego-viewer';
import { PliegoSearch } from './pliego-search';
import type { PliegoListItem, PliegoStatus } from '../types';

interface Props {
  licitacionId: string;
}

function StatusBadge({ status }: { status: PliegoStatus }) {
  const map = {
    READY: { icon: CheckCircle2, text: 'Listo', cls: 'text-green-600' },
    PENDING: { icon: Clock, text: 'Pendiente', cls: 'text-amber-600' },
    ERROR: { icon: AlertCircle, text: 'Error', cls: 'text-red-600' },
  } as const;
  const { icon: Icon, text, cls } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${cls}`}>
      <Icon className="h-3.5 w-3.5" />
      {text}
    </span>
  );
}

export function PliegosSection({ licitacionId }: Props) {
  const { data: pliegos = [], isLoading } = usePliegos(licitacionId);
  const sync = useSyncPliegos(licitacionId);
  const [selected, setSelected] = useState<PliegoListItem | null>(null);

  return (
    <section className="space-y-4 rounded-xl border p-5">
      <header className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <FileText className="h-5 w-5" />
          Pliegos
        </h3>
        <button
          onClick={() => sync.mutate()}
          disabled={sync.isPending}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {sync.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {sync.isPending ? 'Descargando…' : 'Descargar pliegos'}
        </button>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : pliegos.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Aún no hay pliegos descargados. Pulsa «Descargar pliegos» para traerlos.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {pliegos.map((p) => (
            <li
              key={p.id}
              className={`flex items-center justify-between gap-3 px-4 py-3 ${
                p.status === 'READY' ? 'cursor-pointer hover:bg-muted/40' : ''
              } ${selected?.id === p.id ? 'bg-muted/50' : ''}`}
              onClick={() => p.status === 'READY' && setSelected(p)}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {p.nombre ?? p.tipo}
                </p>
                <p className="truncate text-xs text-muted-foreground">{p.tipo}</p>
                {p.status === 'ERROR' && p.errorMessage && (
                  <p className="truncate text-xs text-red-500">{p.errorMessage}</p>
                )}
              </div>
              <StatusBadge status={p.status} />
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <div className="space-y-4 pt-2">
          <h4 className="text-sm font-semibold">
            {selected.nombre ?? selected.tipo}
          </h4>
          {selected.hasText && <PliegoSearch pliegoId={selected.id} />}
          <PliegoViewer pliegoId={selected.id} />
        </div>
      )}
    </section>
  );
}
