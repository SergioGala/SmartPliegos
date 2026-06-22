import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Link } from 'react-router-dom';
import { Trash2, Calendar, DollarSign, GripVertical } from 'lucide-react';
import type { KanbanCardDto } from '../types/kanban.types';
import { formatMoneyCompact } from '@/features/licitaciones/utils';
import { useRemoveCard } from '../hooks/useKanbanMutations';

interface KanbanCardProps {
  card: KanbanCardDto;
}

export function KanbanCard({ card }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const { mutate: removeCard } = useRemoveCard();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : undefined,
  };

  const budget = card.licitacion?.presupuestoBase
    ? formatMoneyCompact(card.licitacion.presupuestoBase)
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative flex flex-col gap-2 rounded-xl border border-border bg-card p-4 pl-7 shadow-sm transition-all hover:shadow-md hover:border-muted-foreground/30"
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-1.5 top-1/2 -translate-y-1/2 p-1 cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      <div className="flex items-start justify-between gap-2">
        <Link
          to={`/licitaciones/${card.licitacionId}`}
          className="font-medium text-sm text-foreground line-clamp-2 hover:underline hover:text-primary transition-colors pr-6"
        >
          {card.licitacion?.title || 'Licitación sin título'}
        </Link>
        <button
          onClick={() => removeCard(card.id)}
          className="absolute right-3 top-3 p-1 rounded-md opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
        {budget && (
          <div className="flex items-center gap-0.5">
            <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
            <span>{budget.num} {budget.unit}</span>
          </div>
        )}

        {card.licitacion?.fechaPresentacion && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-amber-500" />
            <span>
              {new Date(card.licitacion.fechaPresentacion).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {card.notes && (
        <p className="text-xs text-muted-foreground/80 bg-muted/30 p-2 rounded border border-border/50 line-clamp-2 mt-1">
          {card.notes}
        </p>
      )}
    </div>
  );
}
