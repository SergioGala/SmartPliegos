import type { LicitacionCard } from '../licitaciones/types';

export interface Favorito {
  id: string;
  userId: string;
  licitacionId: string;
  nota?: string | null;
  createdAt: string;
  licitacion?: LicitacionCard;
}

export interface CreateFavoritoPayload {
  licitacionId: string;
  nota?: string;
}

export interface UpdateFavoritoPayload {
  nota: string | null;
}