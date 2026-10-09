import { useState } from 'react';
import type { Habit } from '../db/types';
import { addHabitCount, setHabitCount } from '../db/actions';
import { addDays, fromISODate, WEEKDAY_SHORT, isoWeekday } from '../lib/date';
import { useData } from '../lib/data';
import { useEditors } from '../lib/editors';
import { periodFor, periodRestLabel, progressFor, ruleLabel } from '../lib/recurrence';
import { Check } from './Check';

interface Props {
  habit: Habit;
  showProject?: boolean;
  /** Verlauf direkt aufgeklappt zeigen. */
  expanded?: boolean;
}

export function HabitRow({ habit, showProject = true, expanded = false }: Props) {
  const { pmap, today, habitLogs } = useData();
  const { openHabit } = useEditors();
  const [open, setOpen] = useState(expanded);
  const project = habit.projectId ? pmap.get(habit.projectId) : undefined;
  const progress = progressFor(habit, habitLogs, today);
  const color = project?.color ?? '#4f46e5';

  const onCheck = () => {
    if (!progress) return;
    if (progress.complete && progress.doneOnDay > 0) addHabitCount(habit.id, today, -1);
    else if (!progress.complete) addHabitCount(habit.id, today, 1);
  };

  const multi = habit.rule.times > 1 || habit.rule.unit === 'week' || habit.rule.unit === 'month' || (habit.rule.unit === 'day' && habit.rule.every > 1);
  const rest = progress ? periodRestLabel(progress, today) : null;

  return (
    <div className={`px-3 py-2.5 ${!habit.active ? 'opacity-50' : ''}`}>
      <div className="flex cursor-pointer items-start gap-3" onClick={() => openHabit(habit)}>
        <div className="pt-0.5">
          {progress ? (
            <Check
              checked={progress.complete}
              progress={progress.done / progress.target}
              onChange={onCheck}
              color={color}
              label={`${habit.title} abhaken`}
            />
          ) : (
            <span className="block h-6 w-6 rounded-full border-2 border-dashed border-slate-300" title="Heute nicht dran" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className={`break-words ${progress?.complete ? 'text-slate-400' : ''}`}>{habit.title}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <span className="chip bg-emerald-50 text-emerald-700">↻ {ruleLabel(habit.rule)}</span>
            {progress && multi && (
              <span className="chip bg-slate-100 text-slate-600">
                {progress.done}/{progress.target}
                {rest ? ` · ${rest}` : ''}
              </span>
            )}
            {showProject && project && (
              <span className="chip text-slate-500">
                <span className="h-2 w-2 rounded-full" style={{ background: project.color }} />
                {project.title}
              </span>
            )}
            {!habit.active && <span className="chip bg-slate-100 text-slate-500">pausiert</span>}
            {habit.notes && <span className="chip text-slate-400" title={habit.notes}>📝</span>}
          </div>
        </div>
        <button
          className="btn-ghost px-2 py-1 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!open);
          }}
          aria-expanded={open}
          title="Verlauf / nachtragen"
        >
          {open ? '▴' : '▾'}
        </button>
      </div>
      {open && <HabitHistory habit={habit} color={color} />}
    </div>
  );
}

/** Die letzten 14 Tage: antippen trägt nach bzw. zählt hoch, bei Maximum wieder auf 0. */
function HabitHistory({ habit, color }: { habit: Habit; color: string }) {
  const { today, habitLogs } = useData();
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13));
  const perDayMax = Math.max(1, habit.rule.times);

  return (
    <div className="mt-2 pl-9">
      <div className="mb-1 text-xs text-slate-400">Letzte 14 Tage – antippen zum Nachtragen</div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const count = habitLogs.find((l) => l.habitId === habit.id && l.date === d)?.count ?? 0;
          const due = periodFor(habit.rule, habit.startDate, d) !== null;
          const isToday = d === today;
          return (
            <button
              key={d}
              disabled={!due && count === 0}
              onClick={() => setHabitCount(habit.id, d, count >= perDayMax ? 0 : count + 1)}
              className={`flex h-11 flex-col items-center justify-center rounded-md text-[10px] leading-tight ${
                isToday ? 'ring-2 ring-slate-400' : ''
              } ${!due && count === 0 ? 'cursor-default text-slate-300' : 'text-slate-600'}`}
              style={count > 0 ? { background: color, color: 'white', opacity: count >= perDayMax ? 1 : 0.6 } : { background: due ? '#f1f5f9' : 'transparent' }}
              title={d}
            >
              <span>{WEEKDAY_SHORT[isoWeekday(d) - 1]}</span>
              <span className="text-xs font-semibold">{fromISODate(d).getDate()}</span>
              {count > 1 && <span>{count}×</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
