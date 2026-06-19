import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useKanbanBoard } from '../hooks/useKanbanBoard';
import { useMoveCard } from '../hooks/useKanbanMutations';
import { KanbanColumn } from './KanbanColumn';
import { Building2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export function KanbanBoard() {
  const { board, isLoading, noOrg } = useKanbanBoard();
  const { mutate: moveCard } = useMoveCard();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Evita disparar arrastre al hacer click sencillo
      },
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || !board) return;

    const cardId = active.id as string;
    const overId = over.id as string;

    // Over puede ser una columna o una tarjeta
    let destColumnId = '';
    let targetPosition = 0;

    // Validar si el ID de destino es una columna directamente
    const isColumn = board.columns.some((col) => col.id === overId);

    if (isColumn) {
      destColumnId = overId;
      const col = board.columns.find((c) => c.id === overId);
      targetPosition = col?.cards?.length || 0;
    } else {
      // El destino es otra tarjeta, buscar a qué columna pertenece
      const foundCol = board.columns.find((col) =>
        col.cards?.some((c) => c.id === overId)
      );
      if (foundCol) {
        destColumnId = foundCol.id;
        const cardIdx = foundCol.cards?.findIndex((c) => c.id === overId) ?? 0;
        targetPosition = cardIdx;
      }
    }

    if (!destColumnId) return;

    // Obtener la tarjeta actual y su posición/columna original
    const currentCard = board.columns
      .flatMap((c) => c.cards || [])
      .find((c) => c.id === cardId);

    if (currentCard) {
      // Evitar llamadas innecesarias si no cambia nada
      if (currentCard.columnId === destColumnId && currentCard.position === targetPosition) {
        return;
      }
      moveCard({ cardId, destColumnId, position: targetPosition });
    }
  }

  if (noOrg) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center p-6 text-center">
        <div className="relative flex flex-col items-center max-w-md rounded-2xl border border-border/85 bg-card/65 p-8 shadow-xl backdrop-blur-md">
          <div className="absolute -top-10 flex h-20 w-20 items-center justify-center rounded-full border border-border bg-background shadow-lg">
            <Building2 className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mt-8 text-xl font-bold text-foreground">
            Tablero Colaborativo
          </h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Organiza tus licitaciones en un embudo de ventas, asigna responsables,
            añade notas y colabora en tiempo real con tu equipo.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 w-full">
            <Link
              to="/ajustes?tab=organizacion"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Configurar mi Organización</span>
            </Link>
            <span className="text-xs text-muted-foreground/60">
              Necesitas pertenecer a una organización para usar el tablero.
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">
            Cargando tablero...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full gap-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Tablero de Licitaciones</span>
            <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestión visual del embudo de licitaciones de {board?.name}
          </p>
        </div>
      </div>

      {/* Board */}
      <div className="flex flex-1 gap-4 overflow-x-auto pb-6 scrollbar-thin">
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          {board?.columns.map((column) => (
            <KanbanColumn key={column.id} column={column} />
          ))}
        </DndContext>
      </div>
    </div>
  );
}
