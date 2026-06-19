import { KanbanBoard } from '../components/KanbanBoard';

export function KanbanPage() {
  return (
    <div className="mx-auto w-full max-w-[1300px] px-6 pb-24 pt-10 md:px-12 flex flex-col h-[calc(100vh-140px)]">
      <div className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-primary">
        / Kanban
      </div>
      <div className="flex-1 mt-2 min-h-0">
        <KanbanBoard />
      </div>
    </div>
  );
}
