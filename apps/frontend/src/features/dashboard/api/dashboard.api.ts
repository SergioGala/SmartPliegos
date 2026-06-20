import { apiGet } from '@/lib/api-client';

import type {
  DashboardDistribucion,
  DashboardSeriePunto,
  DashboardSummary,
  DashboardVencimientoItem,
} from '../types';

export const dashboardApi = {
  getSummary: () => apiGet<DashboardSummary>('/dashboard/summary'),

  getVencimientos: (days = 7) =>
    apiGet<DashboardVencimientoItem[]>(`/dashboard/vencimientos?days=${days}`),

  getDistribucion: () => apiGet<DashboardDistribucion>('/dashboard/distribucion'),

  getSeries: () => apiGet<DashboardSeriePunto[]>('/dashboard/series'),
};
