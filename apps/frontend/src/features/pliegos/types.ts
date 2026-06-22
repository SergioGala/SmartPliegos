export type PliegoStatus = 'PENDING' | 'READY' | 'ERROR';

export interface PliegoListItem {
  id: string;
  tipo: string;
  nombre: string | null;
  sourceUrl: string;
  sizeBytes: string | null;
  status: PliegoStatus;
  errorMessage: string | null;
  hasText: boolean;
  createdAt: string;
}

export interface SyncResult {
  processed: number;
  ready: number;
  errors: number;
  documents: PliegoListItem[];
}

export interface PliegoSnippet {
  index: number;
  before: string;
  match: string;
  after: string;
}
