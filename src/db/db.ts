import Dexie, { type EntityTable } from 'dexie';
import type { Habit, HabitLog, Project, Task } from './types';

export class PlanerDB extends Dexie {
  projects!: EntityTable<Project, 'id'>;
  tasks!: EntityTable<Task, 'id'>;
  habits!: EntityTable<Habit, 'id'>;
  habitLogs!: EntityTable<HabitLog, 'id'>;

  constructor(name = 'planer') {
    super(name);
    this.version(1).stores({
      projects: 'id',
      tasks: 'id, projectId',
      habits: 'id, projectId',
      habitLogs: 'id, habitId, date',
    });
  }
}

export const db = new PlanerDB();

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    try {
      return crypto.randomUUID();
    } catch {
      // randomUUID gibt es nur in sicheren Kontexten (https/localhost)
    }
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}
