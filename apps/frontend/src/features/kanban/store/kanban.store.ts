import { create } from 'zustand';
import type { KanbanBoardDto, KanbanCardDto } from '../types/kanban.types';

interface KanbanState {
  board: KanbanBoardDto | null;
  setBoard: (board: KanbanBoardDto | null) => void;
  moveCardOptimistic: (cardId: string, destColumnId: string, position: number) => KanbanBoardDto | null;
}

export const useKanbanStore = create<KanbanState>()((set, get) => ({
  board: null,
  setBoard: (board) => set({ board }),
  moveCardOptimistic: (cardId, destColumnId, position) => {
    const currentBoard = get().board;
    if (!currentBoard) return null;

    // Deep clone the current board state
    const previousBoard = JSON.parse(JSON.stringify(currentBoard)) as KanbanBoardDto;
    
    // Find card and move it
    let movingCard: KanbanCardDto | null = null;
    
    // Find card in columns and remove it
    const updatedColumns = currentBoard.columns.map((col) => {
      const cardIdx = col.cards.findIndex((c) => c.id === cardId);
      if (cardIdx !== -1) {
        movingCard = { ...col.cards[cardIdx], columnId: destColumnId };
        const newCards = [...col.cards];
        newCards.splice(cardIdx, 1);
        // Re-calculate positions in source column
        return {
          ...col,
          cards: newCards.map((c, i) => ({ ...c, position: i })),
        };
      }
      return col;
    });

    if (!movingCard) return previousBoard;

    // Insert movingCard into dest column
    const finalColumns = updatedColumns.map((col) => {
      if (col.id === destColumnId) {
        const newCards = [...col.cards];
        // Insert card at position
        let targetPos = position;
        if (targetPos > newCards.length) targetPos = newCards.length;
        newCards.splice(targetPos, 0, movingCard);
        
        // Re-calculate positions in dest column
        return {
          ...col,
          cards: newCards.map((c, i) => ({ ...c, position: i })),
        };
      }
      return col;
    });

    set({
      board: {
        ...currentBoard,
        columns: finalColumns,
      },
    });

    return previousBoard;
  },
}));
