import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { pliegosApi } from '../api/pliegos.api';
import type { PliegoSnippet } from '../types';

export function usePliegos(licitacionId: string) {
  return useQuery({
    queryKey: ['pliegos', licitacionId],
    queryFn: () => pliegosApi.list(licitacionId),
    enabled: !!licitacionId,
  });
}

export function useSyncPliegos(licitacionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => pliegosApi.sync(licitacionId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['pliegos', licitacionId] });
      if (res.errors > 0) {
        toast.warning(
          `${res.ready} pliego(s) listos, ${res.errors} con error.`,
        );
      } else if (res.ready > 0) {
        toast.success(`${res.ready} pliego(s) descargados.`);
      } else {
        toast.info('No había pliegos nuevos que descargar.');
      }
    },
    onError: () => toast.error('No se pudieron descargar los pliegos.'),
  });
}

export function usePliegoSearch(pliegoId: string | null) {
  return useMutation<PliegoSnippet[], unknown, string>({
    mutationFn: (q: string) => {
      if (!pliegoId) return Promise.resolve([]);
      return pliegosApi.search(pliegoId, q);
    },
    onError: () => toast.error('No se pudo buscar en el pliego.'),
  });
}
