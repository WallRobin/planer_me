import type { Habit, HabitLog, HabitRule, ISODate } from '../db/types';
import {
  addDays,
  addMonthsISO,
  diffDays,
  diffMonths,
  isoWeekday,
  monthStart,
  weekStart,
  WEEKDAY_SHORT,
} from './date';

export interface Period {
  start: ISODate;
  /** inklusive */
  end: ISODate;
}

/**
 * Der Zeitraum, zu dem `date` für diese Regel gehört,
 * oder null, wenn die Wiederholung an diesem Tag nicht ansteht.
 */
export function periodFor(rule: HabitRule, startDate: ISODate, date: ISODate): Period | null {
  if (date < startDate) return null;
  switch (rule.unit) {
    case 'weekdays':
      return rule.days.includes(isoWeekday(date)) ? { start: date, end: date } : null;
    case 'day': {
      const every = Math.max(1, rule.every);
      const block = Math.floor(diffDays(startDate, date) / every);
      const start = addDays(startDate, block * every);
      return { start, end: addDays(start, every - 1) };
    }
    case 'week': {
      const every = Math.max(1, rule.every);
      const anchor = weekStart(startDate);
      const weeks = Math.floor(diffDays(anchor, weekStart(date)) / 7);
      const start = addDays(anchor, Math.floor(weeks / every) * every * 7);
      return { start, end: addDays(start, every * 7 - 1) };
    }
    case 'month': {
      const every = Math.max(1, rule.every);
      const anchor = monthStart(startDate);
      const months = diffMonths(anchor, monthStart(date));
      const start = addMonthsISO(anchor, Math.floor(months / every) * every);
      return { start, end: addDays(addMonthsISO(start, every), -1) };
    }
  }
}

export interface HabitProgress {
  period: Period;
  done: number;
  target: number;
  complete: boolean;
  /** Erledigungen nur an genau diesem Tag. */
  doneOnDay: number;
}

export function countInPeriod(logs: HabitLog[], habitId: string, period: Period): number {
  let sum = 0;
  for (const l of logs) {
    if (l.habitId === habitId && l.date >= period.start && l.date <= period.end) sum += l.count;
  }
  return sum;
}

export function progressFor(habit: Habit, logs: HabitLog[], date: ISODate): HabitProgress | null {
  const period = periodFor(habit.rule, habit.startDate, date);
  if (!period) return null;
  const done = countInPeriod(logs, habit.id, period);
  const target = Math.max(1, habit.rule.times);
  const doneOnDay = logs.find((l) => l.habitId === habit.id && l.date === date)?.count ?? 0;
  return { period, done, target, complete: done >= target, doneOnDay };
}

export function ruleLabel(rule: HabitRule): string {
  const times = rule.times > 1 ? `${rule.times}× ` : '';
  switch (rule.unit) {
    case 'weekdays': {
      const days = [...rule.days].sort((a, b) => a - b);
      const label =
        days.length === 7
          ? 'täglich'
          : days.length === 5 && days.every((d, i) => d === i + 1)
            ? 'werktags'
            : days.map((d) => WEEKDAY_SHORT[d - 1]).join(', ');
      return times ? `${times}${label}` : label;
    }
    case 'day':
      if (rule.every === 1) return rule.times > 1 ? `${rule.times}× täglich` : 'täglich';
      return `${rule.times}× in ${rule.every} Tagen`;
    case 'week':
      return rule.every === 1 ? `${rule.times}× pro Woche` : `${rule.times}× in ${rule.every} Wochen`;
    case 'month':
      return rule.every === 1 ? `${rule.times}× pro Monat` : `${rule.times}× in ${rule.every} Monaten`;
  }
}

export function periodRestLabel(progress: HabitProgress, today: ISODate): string | null {
  const daysLeft = diffDays(today, progress.period.end);
  if (daysLeft <= 0) return progress.period.start === progress.period.end ? null : 'letzter Tag';
  return daysLeft === 1 ? 'noch bis morgen' : `noch ${daysLeft + 1} Tage`;
}
