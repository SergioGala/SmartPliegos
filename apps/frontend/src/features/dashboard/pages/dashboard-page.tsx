import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { EstadoError } from '@/components/ui/estado-error';
import { Skeleton } from '@/components/ui/skeleton';

import {
  useDashboardDistribucion,
  useDashboardSeries,
  useDashboardSummary,
  useDashboardVencimientos,
} from '../hooks/use-dashboard';

import { DashboardWeeklyChart } from '../components/dashboard-weekly-chart';

const numberFormatter = new Intl.NumberFormat('es-ES');

function formatNumber(value: number | undefined) {
  return numberFormatter.format(value ?? 0);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function formatCurrency(value: string | null) {
  if (!value) return 'Sin presupuesto';

  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function DashboardMetricCard({
  label,
  value,
  description,
  isLoading,
}: {
  label: string;
  value: number | undefined;
  description: string;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl">
          {isLoading ? <Skeleton className="h-8 w-20" /> : formatNumber(value)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const summaryQuery = useDashboardSummary();
  const vencimientosQuery = useDashboardVencimientos(7);
  const distribucionQuery = useDashboardDistribucion();
  const seriesQuery = useDashboardSeries();

  const isError =
    summaryQuery.isError ||
    vencimientosQuery.isError ||
    distribucionQuery.isError ||
    seriesQuery.isError;

  const refetchAll = () => {
    summaryQuery.refetch();
    vencimientosQuery.refetch();
    distribucionQuery.refetch();
    seriesQuery.refetch();
  };

  if (isError) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
        <EstadoError
          titulo="No se pudo cargar el dashboard"
          mensaje="Ha ocurrido un error al obtener los datos del dashboard."
          onReintentar={refetchAll}
        />
      </div>
    );
  }

  const summary = summaryQuery.data;
  const vencimientos = vencimientosQuery.data ?? [];
  const distribucion = distribucionQuery.data;
  const series = seriesQuery.data ?? [];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Dashboard
        </p>
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Vista general
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Resumen de tus licitaciones guardadas, próximos vencimientos y actividad reciente.
          </p>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          label="Favoritos"
          value={summary?.favoritos}
          description="Licitaciones guardadas por ti."
          isLoading={summaryQuery.isLoading}
        />
        <DashboardMetricCard
          label="Vencen en 7 días"
          value={summary?.venciendoEn7Dias}
          description="Guardadas con fecha de presentación próxima."
          isLoading={summaryQuery.isLoading}
        />
        <DashboardMetricCard
          label="Recordatorios"
          value={summary?.recordatoriosPendientes}
          description="Pendientes de implementación en backend."
          isLoading={summaryQuery.isLoading}
        />
        <DashboardMetricCard
          label="Nuevas esta semana"
          value={summary?.nuevasEstaSemana}
          description="Publicadas desde el inicio de la semana."
          isLoading={summaryQuery.isLoading}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Próximos vencimientos</CardTitle>
            <CardDescription>
              Licitaciones guardadas que vencen en los próximos 7 días.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {vencimientosQuery.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : vencimientos.length === 0 ? (
              <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                No tienes vencimientos próximos.
              </p>
            ) : (
              <div className="space-y-3">
                {vencimientos.map((item) => (
                  <article
                    key={item.licitacionId}
                    className="rounded-lg border bg-background/50 p-4"
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="line-clamp-2 text-sm font-medium">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.organo ?? 'Órgano no disponible'}
                        </p>
                      </div>
                      <div className="shrink-0 text-sm font-medium">
                        {item.diasRestantes} días
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>{formatDate(item.fechaPresentacion)}</span>
                      <span>{formatCurrency(item.presupuestoBase)}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribución</CardTitle>
            <CardDescription>
              Tus guardadas por tipo de contrato y comunidad autónoma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {distribucionQuery.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-4/5" />
                <Skeleton className="h-8 w-3/5" />
              </div>
            ) : (
              <div className="grid gap-6">
                <div>
                  <h3 className="mb-3 text-sm font-medium">Por tipo</h3>
                  <div className="space-y-2">
                    {(distribucion?.porTipoContrato ?? []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">Sin datos.</p>
                    ) : (
                      distribucion?.porTipoContrato.map((item) => (
                        <div
                          key={item.key}
                          className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm"
                        >
                          <span>{item.key}</span>
                          <span className="font-medium">{item.count}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-medium">Por CCAA</h3>
                  <div className="space-y-2">
                    {(distribucion?.porCcaa ?? []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">Sin datos.</p>
                    ) : (
                      distribucion?.porCcaa.map((item) => (
                        <div
                          key={item.key}
                          className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm"
                        >
                          <span>{item.key}</span>
                          <span className="font-medium">{item.count}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Publicaciones por semana</CardTitle>
          <CardDescription>
            Evolución semanal de publicaciones totales y coincidencias con tus CCAA.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {seriesQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : series.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              No hay datos suficientes para mostrar la serie semanal.
            </p>
          ) : (
            <DashboardWeeklyChart data={series} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
