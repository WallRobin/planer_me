import { describe, expect, it } from 'vitest';
import type { Habit, HabitLog, HabitRule } from '../db/types';
import { periodFor, progressFor, ruleLabel } from './recurrence';

const habit = (rule: Habit['rule'], startDate = '2026-10-01'): Habit => ({
  id: 'h',
  title: 'x',
  rule,
  startDate,
  active: true,
  archived: false,
  createdAt: 0,
  updatedAt: 0,
});

describe('periodFor', () => {
  it('täglich: jeder Tag ist ein eigener Zeitraum', () => {
    expect(periodFor({ unit: 'day', every: 1, times: 1 }, '2026-10-01', '2026-10-09')).toEqual({
      start: '2026-10-09',
      end: '2026-10-09',
    });
  });

  it('vor dem Startdatum steht nichts an', () => {
    expect(periodFor({ unit: 'day', every: 1, times: 1 }, '2026-10-10', '2026-10-09')).toBeNull();
  });

  it('alle 3 Tage: Blöcke ab Startdatum', () => {
    const rule = { unit: 'day', every: 3, times: 1 } as const;
    expect(periodFor(rule, '2026-10-01', '2026-10-03')).toEqual({ start: '2026-10-01', end: '2026-10-03' });
    expect(periodFor(rule, '2026-10-01', '2026-10-04')).toEqual({ start: '2026-10-04', end: '2026-10-06' });
  });

  it('feste Wochentage', () => {
    const rule: HabitRule = { unit: 'weekdays', days: [1, 3], times: 1 };
    expect(periodFor(rule, '2026-10-01', '2026-10-05')).not.toBeNull(); // Montag
    expect(periodFor(rule, '2026-10-01', '2026-10-06')).toBeNull(); // Dienstag
  });

  it('pro Woche: Montag bis Sonntag', () => {
    // 2026-10-09 ist ein Freitag
    expect(periodFor({ unit: 'week', every: 1, times: 3 }, '2026-10-01', '2026-10-09')).toEqual({
      start: '2026-10-05',
      end: '2026-10-11',
    });
  });

  it('alle 2 Wochen: Blöcke ab der Startwoche', () => {
    const rule = { unit: 'week', every: 2, times: 1 } as const;
    expect(periodFor(rule, '2026-10-01', '2026-10-09')).toEqual({ start: '2026-09-28', end: '2026-10-11' });
    expect(periodFor(rule, '2026-10-01', '2026-10-12')).toEqual({ start: '2026-10-12', end: '2026-10-25' });
  });

  it('pro Monat', () => {
    expect(periodFor({ unit: 'month', every: 1, times: 2 }, '2026-01-15', '2026-02-28')).toEqual({
      start: '2026-02-01',
      end: '2026-02-28',
    });
  });
});

describe('progressFor', () => {
  it('zählt Erledigungen im Zeitraum, vergangene Tage stören nicht', () => {
    const h = habit({ unit: 'week', every: 1, times: 3 });
    const logs: HabitLog[] = [
      { id: '1', habitId: 'h', date: '2026-10-02', count: 1 }, // Vorwoche
      { id: '2', habitId: 'h', date: '2026-10-06', count: 1 },
      { id: '3', habitId: 'h', date: '2026-10-08', count: 1 },
    ];
    const p = progressFor(h, logs, '2026-10-09')!;
    expect(p.done).toBe(2);
    expect(p.target).toBe(3);
    expect(p.complete).toBe(false);
  });

  it('täglich mehrfach', () => {
    const h = habit({ unit: 'day', every: 1, times: 2 });
    const logs: HabitLog[] = [{ id: '1', habitId: 'h', date: '2026-10-09', count: 2 }];
    expect(progressFor(h, logs, '2026-10-09')!.complete).toBe(true);
    expect(progressFor(h, logs, '2026-10-10')!.done).toBe(0);
  });
});

describe('ruleLabel', () => {
  it('beschreibt Regeln', () => {
    expect(ruleLabel({ unit: 'day', every: 1, times: 1 })).toBe('täglich');
    expect(ruleLabel({ unit: 'week', every: 1, times: 3 })).toBe('3× pro Woche');
    expect(ruleLabel({ unit: 'weekdays', days: [1, 2, 3, 4, 5], times: 1 })).toBe('werktags');
    expect(ruleLabel({ unit: 'weekdays', days: [1, 3], times: 1 })).toBe('Mo, Mi');
  });
});
