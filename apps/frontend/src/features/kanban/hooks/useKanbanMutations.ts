import { useMutation, useQueryClient } from '@tanstack/react-query';
import { kanbanApi } from '../api/kanban.api';
import { useKanbanStore } from '../store/kanban.store';
import type { CreateCardPayload } from '../types/kanban.types';

export function useMoveCard() {
  const queryClient = useQueryClient();
  const moveCardOptimistic = useKanbanStore((state) => state.moveCardOptimistic);
  const setBoard = useKanbanStore((state) => state.setBoard);

  return useMutation({
    mutationFn: ({ cardId, destColumnId, position }: { cardId: string; destColumnId: string; position: number }) =>
      kanbanApi.moveCard(cardId, { columnId: destColumnId, position }),
    onMutate: async ({ cardId, destColumnId, position }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['kanban', 'board'] });

      // Move optimistically, return previous board state for rollback
      const previousBoard = moveCardOptimistic(cardId, destColumnId, position);
      return { previousBoard };
    },
    onError: (_err, _variables, context) => {
      // Rollback to previous board state
      if (context?.previousBoard) {
        setBoard(context.previousBoard);
      }
    },
    onSettled: () => {
      // Refetch board
      queryClient.invalidateQueries({ queryKey: ['kanban', 'board'] });
    },
  });
}

export function useAddCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCardPayload) => kanbanApi.addCard(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban', 'board'] });
    },
  });
}

export function useRemoveCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cardId: string) => kanbanApi.removeCard(cardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban', 'board'] });
    },
  });
}

export function useCreateColumn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; color?: string; isTerminal?: boolean }) =>
      kanbanApi.createColumn(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban', 'board'] });
    },
  });
}

export function useUpdateColumn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { name?: string; color?: string | null; isTerminal?: boolean } }) =>
      kanbanApi.updateColumn(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban', 'board'] });
    },
  });
}

export function useReorderColumns() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (columnIds: string[]) => kanbanApi.reorderColumns({ columnIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban', 'board'] });
    },
  });
}
