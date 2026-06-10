import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, CalendarDays, Sparkles, Clock } from 'lucide-react';
import { useCalendario } from '../hooks/use-calendario';
import { CalendarGrid } from '../components/calendar-grid';
import { RecordatorioDialog } from '../components/recordatorio-dialog';
import type { CalendarioEvento } from '../types';

export function CalendarioPage() {
  const { t, i18n } = useTranslation('calendario');
  const [month, setMonth] = useState(() => dayjs());
  const [selected, setSelected] = useState<CalendarioEvento | null>(null);
  const { data: eventos = [], isLoading } = useCalendario();

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarioEvento[]>();
    for (const ev of eventos) {
      const key = dayjs(ev.fechaPresentacion).format('YYYY-MM-DD');
      const arr = map.get(key) ?? [];
      arr.push(ev);
      map.set(key, arr);
    }
    return map;
  }, [eventos]);

  const monthLabel = month.toDate().toLocaleDateString(i18n.language, {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">{t('title')}</h1>
          <p className="mt-2 text-base text-muted-foreground">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <button
              onClick={() => setMonth((m) => m.subtract(1, 'month'))}
              className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-accent"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setMonth(dayjs())}
              className="border-x border-border px-4 text-sm font-semibold transition-colors hover:bg-accent"
            >
              Hoy
            </button>
            <button
              onClick={() => setMonth((m) => m.add(1, 'month'))}
              className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-accent"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <span className="hidden min-w-[160px] text-right text-lg font-bold capitalize text-foreground md:block">
            {monthLabel}
          </span>
        </div>
      </div>

      {isLoading ? (
        <p className="py-20 text-center text-sm text-muted-foreground">{t('loading')}</p>
      ) : eventos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <CalendarDays size={22} className="text-muted-foreground/40" />
          </div>
          <h3 className="mb-1 text-base font-semibold">{t('empty.title')}</h3>
          <p className="text-sm text-muted-foreground">{t('empty.hint')}</p>
        </div>
      ) : (
        <CalendarGrid month={month} eventsByDay={eventsByDay} onSelectEvent={setSelected} />
      )}

      {selected && <RecordatorioDialog evento={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}