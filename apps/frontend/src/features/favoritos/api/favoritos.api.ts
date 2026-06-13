import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api-client';
import type { CreateFavoritoPayload, Favorito, UpdateFavoritoPayload } from '../types';

export const favoritosApi = {
  /** GET /favoritos — lista de favoritos del usuario */
  async list(): Promise<Favorito[]> {
    return apiGet<Favorito[]>('/favoritos');
  },

  /** GET /favoritos/ids — ids para marcar corazones */
  async ids(): Promise<string[]> {
    return apiGet<string[]>('/favoritos/ids');
  },

  /** POST /favoritos */
  async add(payload: CreateFavoritoPayload): Promise<Favorito> {
    return apiPost<Favorito, CreateFavoritoPayload>('/favoritos', payload);
  },

  /** PATCH /favoritos/:id */
  async updateNota(id: string, payload: UpdateFavoritoPayload): Promise<Favorito> {
    return apiPatch<Favorito, UpdateFavoritoPayload>(`/favoritos/${id}`, payload);
  },

  /** DELETE /favoritos/:id */
  async remove(id: string): Promise<void> {
    return apiDelete(`/favoritos/${id}`);
  },

  /** DELETE /favoritos/licitacion/:licitacionId */
  async removeByLicitacion(licitacionId: string): Promise<void> {
    return apiDelete(`/favoritos/licitacion/${licitacionId}`);
  },
};