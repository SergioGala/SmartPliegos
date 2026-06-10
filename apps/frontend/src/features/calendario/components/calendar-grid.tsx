import dayjs, { type Dayjs } from 'dayjs';
import { cn } from '@/lib/utils';
import type { CalendarioEvento } from '../types';

interface CalendarGridProps {
  month: Dayjs;
  eventsByDay: Map<string, CalendarioEvento[]>; // key: YYYY-MM-DD
  onSelectEvent: (ev: CalendarioEvento) => void;
}

const WEEKDAYS = [
  { short: 'Lun', initial: 'L' },
  { short: 'Mar', initial: 'M' },
  { short: 'Mié', initial: 'X' },
  { short: 'Jue', initial: 'J' },
  { short: 'Vie', initial: 'V' },
  { short: 'Sáb', initial: 'S' },
  { short: 'Dom', initial: 'D' },
];

export function CalendarGrid({ month, eventsByDay, onSelectEvent }: CalendarGridProps) {
  const startOfMonth = month.startOf('month');
  const firstWeekday = (startOfMonth.day() + 6) % 7; // 0 = lunes
  const gridStart = startOfMonth.subtract(firstWeekday, 'day');
  const days = Array.from({ length: 42 }, (_, i) => gridStart.add(i, 'day'));
  const today = dayjs().format('YYYY-MM-DD');

  return (
    <div>
      <div className="mb-4 grid grid-cols-7 px-4">
        {WEEKDAYS.map((d) => (
          <div key={d.short} className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
            <span className="hidden md:inline">{d.short}</span>
            <span className="md:hidden">{d.initial}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-3 sm:gap-4">
        {days.map((day) => {
          const key = day.format('YYYY-MM-DD');
          const inMonth = day.month() === month.month();
          const dayEvents = eventsByDay.get(key) ?? [];
          return (
            <div
              key={key}
              className={cn(
                'group relative flex min-h-[120px] flex-col gap-2 rounded-3xl border p-3 transition-all duration-300',
                inMonth 
                  ? 'border-border bg-card shadow-sm hover:border-primary/50 hover:shadow-primary/5 hover:-translate-y-1' 
                  : 'border-transparent bg-transparent opacity-30 grayscale',
                key === today && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
              )}
            >
              <div className="flex justify-end">
                <span
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-xl text-xs font-black transition-all',
                    key === today
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground group-hover:text-foreground',
                  )}
                >
                  {day.date()}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                {dayEvents.map((ev) => (
                  <button
                    key={ev.licitacionId}
                    type="button"
                    onClick={() => onSelectEvent(ev)}
                    title={ev.title}
                    className={cn(
                      'w-full truncate rounded-xl px-2.5 py-1.5 text-left text-[10px] font-bold shadow-sm transition-all hover:ring-2 hover:ring-white/20 active:scale-95',
                      ev.recordatorio
                        ? 'bg-gradient-to-r from-primary to-blue-600 text-white shadow-primary/20'
                        : 'bg-secondary/80 text-secondary-foreground backdrop-blur-sm',
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      {ev.recordatorio && <div className="h-1 w-1 rounded-full bg-white animate-pulse" />}
                      <span className="truncate">{ev.title}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}