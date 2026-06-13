import { apiClient, apiGet, apiDelete } from '@/lib/api-client';
import type { CalendarioEvento, UpsertRecordatorioPayload } from '../types';

export const calendarioApi = {
  eventos: () => apiGet<CalendarioEvento[]>('/recordatorios/calendario'),

  upsertRecordatorio: (payload: UpsertRecordatorioPayload): Promise<void> =>
    apiClient.put('/recordatorios', payload).then(() => undefined),

  removeRecordatorio: (licitacionId: string): Promise<void> =>
    apiDelete<void>(`/recordatorios/licitacion/${licitacionId}`),
};