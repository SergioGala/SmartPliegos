import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanCard } from './KanbanCard';
import type { KanbanColumnDto } from '../types/kanban.types';

interface KanbanColumnProps {
  column: KanbanColumnDto;
}

const colorMap: Record<string, { dot: string; bg: string; text: string }> = {
  slate: { dot: 'bg-slate-400', bg: 'bg-slate-500/5', text: 'text-slate-700 dark:text-slate-300' },
  amber: { dot: 'bg-amber-400', bg: 'bg-amber-500/5', text: 'text-amber-700 dark:text-amber-300' },
  orange: { dot: 'bg-orange-400', bg: 'bg-orange-500/5', text: 'text-orange-700 dark:text-orange-300' },
  indigo: { dot: 'bg-indigo-400', bg: 'bg-indigo-500/5', text: 'text-indigo-700 dark:text-indigo-300' },
  emerald: { dot: 'bg-emerald-400', bg: 'bg-emerald-500/5', text: 'text-emerald-700 dark:text-emerald-300' },
  rose: { dot: 'bg-rose-400', bg: 'bg-rose-500/5', text: 'text-rose-700 dark:text-rose-300' },
};

export function KanbanColumn({ column }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  const colorConfig = colorMap[column.color || 'slate'] || colorMap.slate;

  return (
    <div
      ref={setNodeRef}
      className={`flex h-full w-72 shrink-0 flex-col rounded-2xl border border-border/80 bg-background/50 p-3 transition-colors ${
        isOver ? 'bg-muted/50 border-muted-foreground/20' : ''
      }`}
    >
      {/* Column Header */}
      <div className={`flex items-center justify-between px-2 py-1.5 rounded-xl ${colorConfig.bg} mb-4`}>
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${colorConfig.dot}`} />
          <span className={`font-semibold text-xs uppercase tracking-wider ${colorConfig.text}`}>
            {column.name}
          </span>
        </div>
        <span className="rounded-full bg-background/80 px-2 py-0.5 font-mono text-[0.66rem] font-bold text-muted-foreground shadow-sm">
          {column.cards?.length || 0}
        </span>
      </div>

      {/* Cards List */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto min-h-[150px] pb-12 scrollbar-thin">
        <SortableContext
          items={column.cards?.map((c) => c.id) || []}
          strategy={verticalListSortingStrategy}
        >
          {column.cards?.map((card) => (
            <KanbanCard key={card.id} card={card} />
          ))}
        </SortableContext>
        
        {(!column.cards || column.cards.length === 0) && (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border/60 p-4 text-center">
            <span className="text-xs text-muted-foreground/60">
              Arrastra licitaciones aquí
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
