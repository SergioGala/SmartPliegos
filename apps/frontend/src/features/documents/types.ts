export interface DocumentItem {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: string; // bigint serializado como string
  folder: string | null;
  licitacionId: string | null;
  createdAt: string;
}

export interface DocumentList {
  data: DocumentItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DocumentUsage {
  usedBytes: number;
  quotaBytes: number;
  count: number;
}