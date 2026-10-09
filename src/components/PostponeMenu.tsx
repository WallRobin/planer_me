import { useEffect, useRef, useState } from 'react';
import type { ISODate } from '../db/types';
import { addDays, nextMonday } from '../lib/date';

interface Props {
  today: ISODate;
  onPick: (date: ISODate | undefined) => void;
  label?: string;
  className?: string;
  /** "Ohne Termin" anbieten (Termin entfernen). */
  allowClear?: boolean;
  clearLabel?: string;
}

/** Knopf mit Menü zum Verschieben auf ein anderes Datum. */
export function PostponeMenu({ today, onPick, label = 'Verschieben', className = 'btn-secondary', allowClear = true, clearLabel = 'Ohne Termin' }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const pick = (d: ISODate | undefined) => {
    setOpen(false);
    onPick(d);
  };

  const options: [string, ISODate][] = [
    ['Heute', today],
    ['Morgen', addDays(today, 1)],
    ['In 3 Tagen', addDays(today, 3)],
    ['Nächste Woche', nextMonday(today)],
  ];

  return (
    <div className="relative" ref={ref}>
      <button type="button" className={className} onClick={() => setOpen(!open)} aria-expanded={open}>
        {label}
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-52 rounded-lg bg-white p-1 shadow-lg ring-1 ring-slate-200">
          {options.map(([l, d]) => (
            <button key={l} type="button" className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-slate-100" onClick={() => pick(d)}>
              {l}
            </button>
          ))}
          {allowClear && (
            <button type="button" className="block w-full rounded px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-100" onClick={() => pick(undefined)}>
              {clearLabel}
            </button>
          )}
          <label className="block px-3 py-2 text-sm">
            <span className="mb-1 block text-xs text-slate-500">Datum wählen</span>
            <input type="date" className="field py-1" min={today} onChange={(e) => e.target.value >= today && pick(e.target.value)} />
          </label>
        </div>
      )}
    </div>
  );
}
