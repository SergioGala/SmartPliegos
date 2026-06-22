import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { usePliegoSearch } from '../hooks/use-pliegos';

interface Props {
  pliegoId: string;
}

export function PliegoSearch({ pliegoId }: Props) {
  const [q, setQ] = useState('');
  const search = usePliegoSearch(pliegoId);

  const onSubmit = () => {
    const term = q.trim();
    if (term.length < 2) return;
    search.mutate(term);
  };

  const snippets = search.data ?? [];

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          placeholder="Buscar en el pliego… (ej: solvencia técnica)"
          className="flex-1 rounded-md border px-3 py-2 text-sm"
        />
        <button
          onClick={onSubmit}
          disabled={search.isPending || q.trim().length < 2}
          className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {search.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          Buscar
        </button>
      </div>

      {search.isSuccess && snippets.length === 0 && (
        <p className="text-sm text-muted-foreground">Sin resultados.</p>
      )}

      <ul className="space-y-2">
        {snippets.map((s) => (
          <li key={s.index} className="rounded-md border bg-muted/30 p-3 text-sm leading-relaxed">
            <span className="text-muted-foreground">{s.before}</span>
            <mark className="rounded bg-yellow-200 px-0.5 font-semibold">{s.match}</mark>
            <span className="text-muted-foreground">{s.after}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
