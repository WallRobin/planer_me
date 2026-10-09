import { db, newId } from './db';
import type { Habit, HabitRule, ISODate, Project, ProjectKind, Task } from './types';
import { todayISO } from '../lib/date';

const now = () => Date.now();

/* ---------- Projekte ---------- */

export const PROJECT_COLORS = [
  '#4f46e5', '#0891b2', '#059669', '#65a30d', '#d97706', '#dc2626', '#db2777', '#7c3aed', '#475569',
];

export async function createProject(data: {
  title: string;
  kind: ProjectKind;
  color?: string;
  notes?: string;
  targetDate?: ISODate;
  deadline?: ISODate;
}): Promise<string> {
  const id = newId();
  await db.projects.add({
    id,
    title: data.title.trim(),
    kind: data.kind,
    color: data.color ?? PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)],
    notes: data.notes,
    targetDate: data.targetDate,
    deadline: data.deadline,
    active: true,
    status: 'open',
    createdAt: now(),
    updatedAt: now(),
  });
  return id;
}

export async function updateProject(id: string, changes: Partial<Project>) {
  const patch: Partial<Project> = { ...changes, updatedAt: now() };
  if ('deadline' in changes) patch.deadlineMissedAck = false;
  await db.projects.update(id, patch);
}

/** Löscht das Projekt; Aufgaben und Wiederholungen bleiben als "ohne Projekt" erhalten, wenn gewünscht. */
export async function deleteProject(id: string, withContent: boolean) {
  await db.transaction('rw', [db.projects, db.tasks, db.habits, db.habitLogs], async () => {
    if (withContent) {
      const habitIds = (await db.habits.where('projectId').equals(id).primaryKeys()) as string[];
      await db.habitLogs.where('habitId').anyOf(habitIds).delete();
      await db.habits.where('projectId').equals(id).delete();
      await db.tasks.where('projectId').equals(id).delete();
    } else {
      await db.tasks.where('projectId').equals(id).modify({ projectId: undefined });
      await db.habits.where('projectId').equals(id).modify({ projectId: undefined });
    }
    await db.projects.delete(id);
  });
}

/* ---------- Aufgaben ---------- */

export type TaskInput = Pick<
  Task,
  'title' | 'notes' | 'projectId' | 'scheduledDate' | 'scheduledTime' | 'deadline' | 'deadlineTime'
> & { active?: boolean };

export async function createTask(data: TaskInput): Promise<string> {
  const id = newId();
  await db.tasks.add({
    ...data,
    id,
    title: data.title.trim(),
    active: data.active ?? true,
    status: 'open',
    createdAt: now(),
    updatedAt: now(),
  });
  return id;
}

export async function updateTask(id: string, changes: Partial<Task>) {
  const patch: Partial<Task> = { ...changes, updatedAt: now() };
  if ('deadline' in changes) patch.deadlineMissedAck = false;
  if (changes.status === 'done' || changes.status === 'dropped') patch.completedAt = now();
  if (changes.status === 'open') patch.completedAt = undefined;
  await db.tasks.update(id, patch);
}

export async function updateTasks(ids: string[], changes: Partial<Task>) {
  await db.transaction('rw', db.tasks, async () => {
    for (const id of ids) await updateTask(id, changes);
  });
}

export async function toggleTaskDone(task: Task) {
  await updateTask(task.id, { status: task.status === 'done' ? 'open' : 'done' });
}

export async function deleteTask(id: string) {
  await db.tasks.delete(id);
}

/* ---------- Wiederholungen ---------- */

export type HabitInput = Pick<Habit, 'title' | 'notes' | 'projectId' | 'rule' | 'startDate'> & {
  active?: boolean;
};

export async function createHabit(data: HabitInput): Promise<string> {
  const id = newId();
  await db.habits.add({
    ...data,
    id,
    title: data.title.trim(),
    active: data.active ?? true,
    archived: false,
    createdAt: now(),
    updatedAt: now(),
  });
  return id;
}

export async function updateHabit(id: string, changes: Partial<Habit>) {
  await db.habits.update(id, { ...changes, updatedAt: now() });
}

export async function deleteHabit(id: string) {
  await db.transaction('rw', [db.habits, db.habitLogs], async () => {
    await db.habitLogs.where('habitId').equals(id).delete();
    await db.habits.delete(id);
  });
}

/** Setzt die Anzahl der Erledigungen an einem Tag (0 löscht den Eintrag). */
export async function setHabitCount(habitId: string, date: ISODate, count: number) {
  const id = `${habitId}_${date}`;
  if (count <= 0) await db.habitLogs.delete(id);
  else await db.habitLogs.put({ id, habitId, date, count });
}

export async function addHabitCount(habitId: string, date: ISODate, delta: number) {
  await db.transaction('rw', db.habitLogs, async () => {
    const existing = await db.habitLogs.get(`${habitId}_${date}`);
    await setHabitCount(habitId, date, (existing?.count ?? 0) + delta);
  });
}

export function defaultRule(): HabitRule {
  return { unit: 'day', every: 1, times: 1 };
}

export function defaultHabitStart(): ISODate {
  return todayISO();
}

/* ---------- Backup ---------- */

export interface Backup {
  app: 'planer';
  version: 1;
  exportedAt: string;
  projects: Project[];
  tasks: Task[];
  habits: Habit[];
  habitLogs: import('./types').HabitLog[];
}

export async function exportData(): Promise<Backup> {
  const [projects, tasks, habits, habitLogs] = await Promise.all([
    db.projects.toArray(),
    db.tasks.toArray(),
    db.habits.toArray(),
    db.habitLogs.toArray(),
  ]);
  return { app: 'planer', version: 1, exportedAt: new Date().toISOString(), projects, tasks, habits, habitLogs };
}

export async function importData(data: Backup) {
  if (data.app !== 'planer' || data.version !== 1) throw new Error('Keine gültige Planer-Sicherung');
  await db.transaction('rw', [db.projects, db.tasks, db.habits, db.habitLogs], async () => {
    await Promise.all([db.projects.clear(), db.tasks.clear(), db.habits.clear(), db.habitLogs.clear()]);
    await db.projects.bulkAdd(data.projects);
    await db.tasks.bulkAdd(data.tasks);
    await db.habits.bulkAdd(data.habits);
    await db.habitLogs.bulkAdd(data.habitLogs);
  });
}
