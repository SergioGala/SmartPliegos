import { apiClient, apiGet, apiPatch, apiDelete } from '@/lib/api-client';
import type { DocumentList, DocumentUsage, DocumentItem } from '../types';

export const documentsApi = {
  // El interceptor global ya desenvuelve {success,data} para /documents.
  list: (params: { page?: number; folder?: string; q?: string } = {}) =>
    apiGet<DocumentList>('/documents', { params }),

  usage: () => apiGet<DocumentUsage>('/documents/usage'),

  upload: (
    file: File,
    meta: { folder?: string; licitacionId?: string } = {},
    onProgress?: (pct: number) => void,
  ) => {
    const form = new FormData();
    form.append('file', file);
    if (meta.folder) form.append('folder', meta.folder);
    if (meta.licitacionId) form.append('licitacionId', meta.licitacionId);
    return apiClient
      .post<DocumentItem>('/documents', form, {
        onUploadProgress: (e) =>
          onProgress?.(Math.round((e.loaded * 100) / (e.total ?? 1))),
      })
      .then((r) => r.data);
  },

  download: async (id: string, filename: string) => {
    // Blob → el interceptor no desenvuelve (no es un envelope {success})
    const res = await apiClient.get(`/documents/${id}/download`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

  rename: (id: string, body: { filename?: string; folder?: string | null }) =>
    apiPatch<DocumentItem, typeof body>(`/documents/${id}`, body),

  remove: (id: string) => apiDelete<{ message: string }>(`/documents/${id}`),
};