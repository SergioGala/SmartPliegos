import type { LicitacionCard } from '../../licitaciones/types';

export interface KanbanCardDto {
  id: string;
  columnId: string;
  licitacionId: string;
  organizationId: string;
  position: number;
  notes?: string | null;
  assignedToId?: string | null;
  createdAt: string;
  updatedAt: string;
  licitacion: LicitacionCard;
}

export interface KanbanColumnDto {
  id: string;
  boardId: string;
  name: string;
  color?: string | null;
  position: number;
  isTerminal: boolean;
  cards: KanbanCardDto[];
  createdAt: string;
  updatedAt: string;
}

export interface KanbanBoardDto {
  id: string;
  organizationId: string;
  name: string;
  columns: KanbanColumnDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCardPayload {
  licitacionId: string;
  columnId?: string;
  notes?: string;
}

export interface MoveCardPayload {
  columnId: string;
  position: number;
}

export interface CreateColumnPayload {
  name: string;
  color?: string;
  isTerminal?: boolean;
}

export interface UpdateColumnPayload {
  name?: string;
  color?: string | null;
  isTerminal?: boolean;
}

export interface ReorderColumnsPayload {
  columnIds: string[];
}
