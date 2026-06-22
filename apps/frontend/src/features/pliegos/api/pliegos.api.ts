import { apiClient, apiGet, apiPost } from '@/lib/api-client';
import type { PliegoListItem, PliegoSnippet, SyncResult } from '../types';

export const pliegosApi = {
  /** GET /pliegos/licitacion/:licitacionId — lista de pliegos de la licitación */
  list(licitacionId: string): Promise<PliegoListItem[]> {
    return apiGet<PliegoListItem[]>(`/pliegos/licitacion/${licitacionId}`);
  },

  /** POST /pliegos/licitacion/:licitacionId/sync — descarga e indexa */
  sync(licitacionId: string): Promise<SyncResult> {
    return apiPost<SyncResult>(`/pliegos/licitacion/${licitacionId}/sync`);
  },

  /** GET /pliegos/:id/search?q= — snippets dentro del pliego */
  search(pliegoId: string, q: string): Promise<PliegoSnippet[]> {
    return apiGet<PliegoSnippet[]>(`/pliegos/${pliegoId}/search`, {
      params: { q },
    });
  },

  /**
   * GET /pliegos/:id/file — descarga el PDF como Blob (con el Bearer token del
   * interceptor). Devolvemos un object URL para usarlo en el <iframe> del visor.
   * Acuérdate de revocar el URL con URL.revokeObjectURL cuando ya no se use.
   */
  async fileObjectUrl(pliegoId: string): Promise<string> {
    const res = await apiClient.get(`/pliegos/${pliegoId}/file`, {
      responseType: 'blob',
    });
    return URL.createObjectURL(res.data as Blob);
  },
};
