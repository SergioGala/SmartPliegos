import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { documentsApi } from '../api/documents.api';

export function useDocuments(params: { page?: number; folder?: string; q?: string }) {
  return useQuery({
    queryKey: ['documents', params],
    queryFn: () => documentsApi.list(params),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });
}

export function useDocumentUsage() {
  return useQuery({
    queryKey: ['documents-usage'],
    queryFn: () => documentsApi.usage(),
    staleTime: 30 * 1000,
  });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { file: File; meta?: { folder?: string }; onProgress?: (p: number) => void }) =>
      documentsApi.upload(vars.file, vars.meta, vars.onProgress),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] });
      qc.invalidateQueries({ queryKey: ['documents-usage'] });
    },
  });
}

export function useRenameDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; body: { filename?: string; folder?: string | null } }) =>
      documentsApi.rename(vars.id, vars.body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] });
      qc.invalidateQueries({ queryKey: ['documents-usage'] });
    },
  });
}