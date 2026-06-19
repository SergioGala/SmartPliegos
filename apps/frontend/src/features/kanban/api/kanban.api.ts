import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api-client';
import type {
  KanbanBoardDto,
  KanbanCardDto,
  KanbanColumnDto,
  CreateCardPayload,
  MoveCardPayload,
  CreateColumnPayload,
  UpdateColumnPayload,
  ReorderColumnsPayload,
} from '../types/kanban.types';

export const kanbanApi = {
  /** GET /kanban/board — obtener el tablero */
  async getBoard(): Promise<KanbanBoardDto> {
    return apiGet<KanbanBoardDto>('/kanban/board');
  },

  /** POST /kanban/cards — añadir tarjeta */
  async addCard(payload: CreateCardPayload): Promise<KanbanCardDto> {
    return apiPost<KanbanCardDto, CreateCardPayload>('/kanban/cards', payload);
  },

  /** PATCH /kanban/cards/:id/move — mover tarjeta */
  async moveCard(id: string, payload: MoveCardPayload): Promise<KanbanCardDto> {
    return apiPatch<KanbanCardDto, MoveCardPayload>(`/kanban/cards/${id}/move`, payload);
  },

  /** DELETE /kanban/cards/:id — eliminar tarjeta */
  async removeCard(id: string): Promise<void> {
    return apiDelete(`/kanban/cards/${id}`);
  },

  /** POST /kanban/columns — crear columna */
  async createColumn(payload: CreateColumnPayload): Promise<KanbanColumnDto> {
    return apiPost<KanbanColumnDto, CreateColumnPayload>('/kanban/columns', payload);
  },

  /** PATCH /kanban/columns/:id — actualizar columna */
  async updateColumn(id: string, payload: UpdateColumnPayload): Promise<KanbanColumnDto> {
    return apiPatch<KanbanColumnDto, UpdateColumnPayload>(`/kanban/columns/${id}`, payload);
  },

  /** PATCH /kanban/columns/reorder — reordenar columnas */
  async reorderColumns(payload: ReorderColumnsPayload): Promise<KanbanColumnDto[]> {
    return apiPatch<KanbanColumnDto[], ReorderColumnsPayload>('/kanban/columns/reorder', payload);
  },
};
