export interface CalendarioEvento {
  licitacionId: string;
  title: string;
  fechaPresentacion: string; // ISO
  recordatorio: { id: string; daysBefore: number; status: string } | null;
}

export interface UpsertRecordatorioPayload {
  licitacionId: string;
  daysBefore: number;
  note?: string;
}

