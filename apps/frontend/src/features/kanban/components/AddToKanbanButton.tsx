import axios from 'axios';
import { useKanbanBoard } from '../hooks/useKanbanBoard';
import { useAddCard } from '../hooks/useKanbanMutations';
import { toast } from 'sonner';
import { LayoutGrid, Check, Loader2 } from 'lucide-react';

interface AddToKanbanButtonProps {
  licitacionId: string;
}

export function AddToKanbanButton({ licitacionId }: AddToKanbanButtonProps) {
  const { board, noOrg, isLoading } = useKanbanBoard();
  const { mutate: addCard, isPending } = useAddCard();

  const hasCard = board?.columns
    ?.flatMap((c) => c.cards || [])
    ?.some((c) => c.licitacionId === licitacionId);

  const handleClick = () => {
    if (noOrg) {
      toast.error('Necesitas una organización para usar el tablero Kanban.');
      return;
    }
    if (hasCard) {
      toast.info('Esta licitación ya está en tu tablero.');
      return;
    }

    addCard(
      { licitacionId },
      {
        onSuccess: () => {
          toast.success('Licitación añadida al tablero Kanban.');
        },
        onError: (err: unknown) => {
          if (
            axios.isAxiosError(err) &&
            (err.response?.data as { code?: string })?.code === 'NO_ORGANIZATION'
          ) {
            toast.error('Necesitas una organización para usar el tablero Kanban.');
          } else {
            toast.error('Error al añadir la licitación al tablero.');
          }
        },
      }
    );
  };

  if (isLoading) {
    return (
      <button
        disabled
        className="flex items-center gap-2 rounded-lg border border-border bg-muted px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Cargando tablero...</span>
      </button>
    );
  }

  if (hasCard) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 shadow-sm">
        <Check className="h-4 w-4" />
        <span>En el Tablero</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      title={noOrg ? 'Requiere pertenecer a una organización' : undefined}
      className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium shadow-sm transition-all ${
        noOrg
          ? 'border-border bg-muted text-muted-foreground/60 cursor-not-allowed'
          : 'border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary hover:border-primary/40 active:scale-[0.98]'
      }`}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LayoutGrid className="h-4 w-4" />
      )}
      <span>Añadir al Tablero</span>
    </button>
  );
}
