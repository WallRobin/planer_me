import type { ISODate, TimeOfDay } from '../db/types';
import { addDays, nextMonday, relativeLabel } from '../lib/date';

interface Props {
  label: string;
  hint: string;
  date?: ISODate;
  time?: TimeOfDay;
  today: ISODate;
  onChange: (date?: ISODate, time?: TimeOfDay) => void;
  accent?: 'indigo' | 'red';
  withTime?: boolean;
}

/** Datum + optionale Uhrzeit mit Schnellauswahl. */
export function DateField({ label, hint, date, time, today, onChange, accent = 'indigo', withTime = true }: Props) {
  const quick: [string, ISODate][] = [
    ['Heute', today],
    ['Morgen', addDays(today, 1)],
    ['Nächste Woche', nextMonday(today)],
  ];
  const active = accent === 'red' ? 'bg-red-600 text-white border-red-600' : 'bg-indigo-600 text-white border-indigo-600';
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-xs text-slate-400">{hint}</span>
      </div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {quick.map(([l, d]) => (
          <button
            key={l}
            type="button"
            className={`chip border px-2.5 py-1 ${date === d ? active : 'border-slate-300 text-slate-600'}`}
            onClick={() => onChange(d, time)}
          >
            {l}
          </button>
        ))}
        {date && (
          <button type="button" className="chip border border-slate-300 px-2.5 py-1 text-slate-500" onClick={() => onChange(undefined, undefined)}>
            Entfernen
          </button>
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="date"
          className="field flex-1"
          value={date ?? ''}
          onChange={(e) => onChange(e.target.value || undefined, e.target.value ? time : undefined)}
          aria-label={`${label} Datum`}
        />
        {withTime && (
        <input
          type="time"
          className="field w-32"
          value={time ?? ''}
          disabled={!date}
          onChange={(e) => onChange(date, e.target.value || undefined)}
          aria-label={`${label} Uhrzeit`}
        />
        )}
      </div>
      {date && <p className="mt-1 text-xs text-slate-500">{relativeLabel(date, today)}{time ? `, ${time} Uhr` : ''}</p>}
    </div>
  );
}
