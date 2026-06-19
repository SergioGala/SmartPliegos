import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { kanbanApi } from '../api/kanban.api';
import { useKanbanStore } from '../store/kanban.store';

export function useKanbanBoard() {
  const setBoard = useKanbanStore((state) => state.setBoard);
  const board = useKanbanStore((state) => state.board);

  const query = useQuery({
    queryKey: ['kanban', 'board'],
    queryFn: () => kanbanApi.getBoard(),
    retry: false,
  });

  useEffect(() => {
    if (query.data) {
      setBoard(query.data);
    }
  }, [query.data, setBoard]);

  const error = query.error;
  const noOrg =
    axios.isAxiosError(error) &&
    (error.response?.data as { code?: string })?.code === 'NO_ORGANIZATION';

  return {
    ...query,
    board,
    noOrg,
  };
}
