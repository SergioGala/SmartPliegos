import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { calendarioApi } from '../api/calendario.api';
import type { UpsertRecordatorioPayload } from '../types';

export function useCalendario() {
  return useQuery({
    queryKey: ['calendario'],
    queryFn: () => calendarioApi.eventos(),
    staleTime: 60 * 1000,
  });
}

export function useUpsertRecordatorio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertRecordatorioPayload) => calendarioApi.upsertRecordatorio(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendario'] }),
  });
}

export function useRemoveRecordatorio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (licitacionId: string) => calendarioApi.removeRecordatorio(licitacionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendario'] }),
  });
}