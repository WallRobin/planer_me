import {
  addDays as dfAddDays,
  addMonths,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { de } from 'date-fns/locale';
import type { ISODate } from '../db/types';

export function toISODate(d: Date): ISODate {
  return format(d, 'yyyy-MM-dd');
}

export function fromISODate(s: ISODate): Date {
  return parseISO(s);
}

export function todayISO(now: Date = new Date()): ISODate {
  return toISODate(now);
}

export function addDays(date: ISODate, n: number): ISODate {
  return toISODate(dfAddDays(fromISODate(date), n));
}

export function addMonthsISO(date: ISODate, n: number): ISODate {
  return toISODate(addMonths(fromISODate(date), n));
}

export function diffDays(from: ISODate, to: ISODate): number {
  return differenceInCalendarDays(fromISODate(to), fromISODate(from));
}

export function diffMonths(from: ISODate, to: ISODate): number {
  return differenceInCalendarMonths(fromISODate(to), fromISODate(from));
}

/** Montag der Woche, in der `date` liegt. */
export function weekStart(date: ISODate): ISODate {
  return toISODate(startOfWeek(fromISODate(date), { weekStartsOn: 1 }));
}

export function monthStart(date: ISODate): ISODate {
  return toISODate(startOfMonth(fromISODate(date)));
}

/** 1 = Montag … 7 = Sonntag */
export function isoWeekday(date: ISODate): number {
  const d = fromISODate(date).getDay();
  return d === 0 ? 7 : d;
}

export function nextMonday(date: ISODate): ISODate {
  return addDays(weekStart(date), 7);
}

export const WEEKDAY_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

/** Kurze, menschliche Datumsangabe relativ zu heute. */
export function relativeLabel(date: ISODate, today: ISODate = todayISO()): string {
  const diff = diffDays(today, date);
  if (diff === 0) return 'Heute';
  if (diff === 1) return 'Morgen';
  if (diff === -1) return 'Gestern';
  if (diff > 1 && diff < 7) return format(fromISODate(date), 'EEEE', { locale: de });
  const sameYear = date.slice(0, 4) === today.slice(0, 4);
  return format(fromISODate(date), sameYear ? 'EEE d. MMM' : 'd. MMM yyyy', { locale: de });
}

export function longLabel(date: ISODate): string {
  return format(fromISODate(date), 'EEEE, d. MMMM yyyy', { locale: de });
}

export function overdueLabel(date: ISODate, today: ISODate = todayISO()): string {
  const diff = diffDays(date, today);
  if (diff === 1) return 'seit gestern';
  return `seit ${diff} Tagen`;
}

export function untilLabel(date: ISODate, today: ISODate = todayISO()): string {
  const diff = diffDays(today, date);
  if (diff < 0) return diff === -1 ? 'seit gestern verpasst' : `seit ${-diff} Tagen verpasst`;
  if (diff === 0) return 'heute fällig';
  if (diff === 1) return 'morgen fällig';
  return `in ${diff} Tagen`;
}
