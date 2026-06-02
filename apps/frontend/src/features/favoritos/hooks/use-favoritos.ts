import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { favoritosApi } from '../api/favoritos.api';
import type { CreateFavoritoPayload } from '../types';

export function useFavoritos() {
  return useQuery({
    queryKey: ['favoritos'],
    queryFn: () => favoritosApi.list(),
  });
}

export function useFavoritoIds() {
  return useQuery({
    queryKey: ['favoritos-ids'],
    queryFn: () => favoritosApi.ids(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useAddFavorito() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateFavoritoPayload) => favoritosApi.add(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favoritos'] });
      queryClient.invalidateQueries({ queryKey: ['favoritos-ids'] });
    },
  });
}

export function useRemoveFavoritoByLicitacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (licitacionId: string) => favoritosApi.removeByLicitacion(licitacionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favoritos'] });
      queryClient.invalidateQueries({ queryKey: ['favoritos-ids'] });
    },
  });
}