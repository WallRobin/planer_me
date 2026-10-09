import { describe, expect, it } from 'vitest';
import type { Project, Task } from '../db/types';
import { missedDeadlineTasks, overdueTasks, projectMap, upcomingDeadlines } from './selectors';

const task = (t: Partial<Task>): Task => ({
  id: Math.random().toString(),
  title: 't',
  active: true,
  status: 'open',
  createdAt: 0,
  updatedAt: 0,
  ...t,
});

const project = (p: Partial<Project>): Project => ({
  id: 'p',
  title: 'p',
  kind: 'ziel',
  color: '#000',
  active: true,
  status: 'open',
  createdAt: 0,
  updatedAt: 0,
  ...p,
});

const today = '2026-10-09';

describe('overdueTasks', () => {
  it('findet offene Aufgaben mit vergangenem Termin', () => {
    const tasks = [
      task({ id: 'a', scheduledDate: '2026-10-08' }),
      task({ id: 'b', scheduledDate: today }),
      task({ id: 'c', scheduledDate: '2026-10-01', status: 'done' }),
      task({ id: 'd', scheduledDate: '2026-10-01', active: false }),
    ];
    expect(overdueTasks(tasks, projectMap([]), today).map((t) => t.id)).toEqual(['a']);
  });

  it('ignoriert Aufgaben in pausierten Projekten', () => {
    const tasks = [task({ id: 'a', scheduledDate: '2026-10-08', projectId: 'p' })];
    expect(overdueTasks(tasks, projectMap([project({ active: false })]), today)).toEqual([]);
    expect(overdueTasks(tasks, projectMap([project({})]), today)).toHaveLength(1);
  });
});

describe('missedDeadlineTasks', () => {
  it('zeigt verpasste Deadlines nur bis sie zur Kenntnis genommen wurden', () => {
    const tasks = [
      task({ id: 'a', deadline: '2026-10-08' }),
      task({ id: 'b', deadline: '2026-10-08', deadlineMissedAck: true }),
      task({ id: 'c', deadline: today }),
    ];
    expect(missedDeadlineTasks(tasks, projectMap([]), today).map((t) => t.id)).toEqual(['a']);
  });
});

describe('upcomingDeadlines', () => {
  it('nimmt Deadlines der nächsten 7 Tage', () => {
    const tasks = [
      task({ id: 'a', deadline: today }),
      task({ id: 'b', deadline: '2026-10-16' }),
      task({ id: 'c', deadline: '2026-10-17' }),
    ];
    expect(upcomingDeadlines(tasks, projectMap([]), today).map((t) => t.id)).toEqual(['a', 'b']);
  });
});
