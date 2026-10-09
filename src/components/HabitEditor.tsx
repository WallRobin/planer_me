import { useState } from 'react';
import type { Habit, HabitRule } from '../db/types';
import { createHabit, defaultRule, deleteHabit, updateHabit } from '../db/actions';
import { WEEKDAY_SHORT } from '../lib/date';
import { useData } from '../lib/data';
import { ruleLabel } from '../lib/recurrence';
import { Modal } from './Modal';
import { ProjectSelect } from './ProjectSelect';
import { Toggle } from './Toggle';

interface Props {
  habit?: Habit;
  defaults?: Partial<Habit>;
  onClose: () => void;
}

type Unit = HabitRule['unit'];
const UNIT_LABEL: Record<Exclude<Unit, 'weekdays'>, [string, string]> = {
  day: ['Tag', 'Tage'],
  week: ['Woche', 'Wochen'],
  month: ['Monat', 'Monate'],
};

export function HabitEditor({ habit, defaults, onClose }: Props) {
  const { today } = useData();
  const [draft, setDraft] = useState<Partial<Habit>>(
    () => habit ?? { active: true, rule: defaultRule(), startDate: today, ...defaults },
  );
  const set = (patch: Partial<Habit>) => setDraft((d) => ({ ...d, ...patch }));
  const rule = draft.rule ?? defaultRule();
  const valid = !!draft.title?.trim() && (rule.unit !== 'weekdays' || rule.days.length > 0);

  const setUnit = (unit: Unit) => {
    if (unit === 'weekdays') set({ rule: { unit, days: [1, 2, 3, 4, 5], times: rule.times } });
    else set({ rule: { unit, every: rule.unit === 'weekdays' ? 1 : rule.every, times: rule.times } });
  };

  const save = async () => {
    if (!valid) return;
    const data = {
      title: draft.title!.trim(),
      notes: draft.notes?.trim() || undefined,
      projectId: draft.projectId,
      rule,
      startDate: draft.startDate ?? today,
      active: draft.active ?? true,
    };
    if (habit) await updateHabit(habit.id, data);
    else await createHabit(data);
    onClose();
  };

  return (
    <Modal
      title={habit ? 'Wiederholung bearbeiten' : 'Neue Wiederholung'}
      onClose={onClose}
      footer={
        <div className="flex items-center gap-2">
          {habit && (
            <button
              className="btn-danger"
              onClick={async () => {
                if (confirm('Wiederholung samt Verlauf wirklich löschen?')) {
                  await deleteHabit(habit.id);
                  onClose();
                }
              }}
            >
              Löschen
            </button>
          )}
          <div className="flex-1" />
          <button className="btn-secondary" onClick={onClose}>
            Abbrechen
          </button>
          <button className="btn-primary" disabled={!valid} onClick={save}>
            Speichern
          </button>
        </div>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <input
          className="field text-lg"
          placeholder="z. B. 30 Minuten trainieren"
          value={draft.title ?? ''}
          onChange={(e) => set({ title: e.target.value })}
          autoFocus={!habit}
          aria-label="Titel"
        />
        <ProjectSelect value={draft.projectId} onChange={(projectId) => set({ projectId })} />

        <fieldset className="space-y-3 rounded-lg border border-slate-200 p-3">
          <legend className="px-1 text-sm font-medium text-slate-700">Wie oft?</legend>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="number"
              min={1}
              max={50}
              className="field w-20"
              value={rule.times}
              onChange={(e) => set({ rule: { ...rule, times: Math.max(1, Number(e.target.value) || 1) } })}
              aria-label="Anzahl"
            />
            <span>mal</span>
            <select className="field w-auto flex-1" value={rule.unit} onChange={(e) => setUnit(e.target.value as Unit)} aria-label="Zeitraum">
              <option value="day">pro Tag</option>
              <option value="week">pro Woche (Tage egal)</option>
              <option value="month">pro Monat (Tage egal)</option>
              <option value="weekdays">an bestimmten Wochentagen</option>
            </select>
          </div>
          {rule.unit === 'weekdays' ? (
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAY_SHORT.map((label, i) => {
                const day = i + 1;
                const on = rule.days.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    className={`h-9 w-10 rounded-lg border text-sm ${on ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 text-slate-600'}`}
                    onClick={() =>
                      set({ rule: { ...rule, days: on ? rule.days.filter((d) => d !== day) : [...rule.days, day].sort() } })
                    }
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm">
              <span>Zeitraum: alle</span>
              <input
                type="number"
                min={1}
                max={365}
                className="field w-20"
                value={rule.every}
                onChange={(e) => set({ rule: { ...rule, every: Math.max(1, Number(e.target.value) || 1) } })}
                aria-label="Intervall"
              />
              <span>{UNIT_LABEL[rule.unit][rule.every === 1 ? 0 : 1]}</span>
            </div>
          )}
          <p className="rounded-md bg-emerald-50 px-2 py-1.5 text-sm text-emerald-800">↻ {ruleLabel(rule)}</p>
          <p className="text-xs text-slate-500">
            Verpasste Tage musst du nicht nachbearbeiten – es geht immer mit dem aktuellen Zeitraum weiter. Nachtragen
            kannst du über den Verlauf (▾).
          </p>
        </fieldset>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Ab wann?</span>
          <input type="date" className="field" value={draft.startDate ?? today} onChange={(e) => set({ startDate: e.target.value || today })} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Notizen</span>
          <textarea className="field min-h-16" value={draft.notes ?? ''} onChange={(e) => set({ notes: e.target.value })} />
        </label>
        <Toggle
          label="Aktiv"
          hint="Pausieren, wenn gerade keine Zeit dafür ist – später einfach wieder aktivieren"
          checked={draft.active ?? true}
          onChange={(active) => set({ active })}
        />
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
