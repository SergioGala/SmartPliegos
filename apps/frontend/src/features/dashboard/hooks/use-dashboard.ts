import { useQuery } from '@tanstack/react-query';

import { dashboardApi } from '../api/dashboard.api';

export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  summary: () => [...dashboardQueryKeys.all, 'summary'] as const,
  vencimientos: (days: number) =>
    [...dashboardQueryKeys.all, 'vencimientos', days] as const,
  distribucion: () => [...dashboardQueryKeys.all, 'distribucion'] as const,
  series: () => [...dashboardQueryKeys.all, 'series'] as const,
};

export function useDashboardSummary() {
  return useQuery({
    queryKey: dashboardQueryKeys.summary(),
    queryFn: dashboardApi.getSummary,
  });
}

export function useDashboardVencimientos(days = 7) {
  return useQuery({
    queryKey: dashboardQueryKeys.vencimientos(days),
    queryFn: () => dashboardApi.getVencimientos(days),
  });
}

export function useDashboardDistribucion() {
  return useQuery({
    queryKey: dashboardQueryKeys.distribucion(),
    queryFn: dashboardApi.getDistribucion,
  });
}

export function useDashboardSeries() {
  return useQuery({
    queryKey: dashboardQueryKeys.series(),
    queryFn: dashboardApi.getSeries,
  });
}
