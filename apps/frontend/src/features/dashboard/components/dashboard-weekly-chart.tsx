import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { DashboardSeriePunto } from '../types';

interface DashboardWeeklyChartProps {
  data: DashboardSeriePunto[];
}

const numberFormatter = new Intl.NumberFormat('es-ES');

const dateFormatter = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'short',
});

export function DashboardWeeklyChart({ data }: DashboardWeeklyChartProps) {
  const chartData = data.map((item) => ({
    semana: dateFormatter.format(new Date(`${item.semana}T00:00:00`)),
    total: item.total,
    enMisCcaa: item.enMisCcaa,
  }));

  return (
    <div
      className="h-80 w-full"
      aria-label="Gráfica de publicaciones por semana"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
          accessibilityLayer
        >
          <CartesianGrid
            stroke="var(--border)"
            strokeDasharray="4 4"
            vertical={false}
          />

          <XAxis
            dataKey="semana"
            axisLine={false}
            tickLine={false}
            tickMargin={12}
            stroke="var(--muted-foreground)"
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            width={56}
            stroke="var(--muted-foreground)"
            tickFormatter={(value) => numberFormatter.format(Number(value))}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              color: 'var(--foreground)',
            }}
            labelStyle={{
              color: 'var(--foreground)',
              fontWeight: 600,
            }}
          />

          <Legend />

          <Line
            type="monotone"
            dataKey="total"
            name="Total"
            stroke="var(--primary)"
            strokeWidth={2.5}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />

          <Line
            type="monotone"
            dataKey="enMisCcaa"
            name="En mis CCAA"
            stroke="var(--muted-foreground)"
            strokeWidth={2.5}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}