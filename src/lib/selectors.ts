import type { Habit, ISODate, Project, Task } from '../db/types';
import { addDays } from './date';

export type ProjectMap = Map<string, Project>;

export function projectMap(projects: Project[]): ProjectMap {
  return new Map(projects.map((p) => [p.id, p]));
}

/** Ein Projekt ist "lebendig", wenn es offen und nicht pausiert ist. */
export function projectLive(p: Project | undefined): boolean {
  return !p || (p.active && p.status === 'open');
}

/** Aufgabe ist aktiv und gehört zu keinem pausierten/abgeschlossenen Projekt. */
export function taskLive(t: Task, projects: ProjectMap): boolean {
  return t.active && projectLive(t.projectId ? projects.get(t.projectId) : undefined);
}

export function habitLive(h: Habit, projects: ProjectMap): boolean {
  return h.active && !h.archived && projectLive(h.projectId ? projects.get(h.projectId) : undefined);
}

export function openLiveTasks(tasks: Task[], projects: ProjectMap): Task[] {
  return tasks.filter((t) => t.status === 'open' && taskLive(t, projects));
}

/** Aufgaben, deren Termin vor heute lag und die noch offen sind. */
export function overdueTasks(tasks: Task[], projects: ProjectMap, today: ISODate): Task[] {
  return openLiveTasks(tasks, projects)
    .filter((t) => t.scheduledDate && t.scheduledDate < today)
    .sort(byScheduled);
}

/** Offene Aufgaben mit verpasster Deadline, die noch nicht zur Kenntnis genommen wurden. */
export function missedDeadlineTasks(tasks: Task[], projects: ProjectMap, today: ISODate): Task[] {
  return openLiveTasks(tasks, projects)
    .filter((t) => t.deadline && t.deadline < today && !t.deadlineMissedAck)
    .sort((a, b) => a.deadline!.localeCompare(b.deadline!));
}

export function missedDeadlineProjects(projects: Project[], today: ISODate): Project[] {
  return projects
    .filter((p) => p.status === 'open' && p.active && p.deadline && p.deadline < today && !p.deadlineMissedAck)
    .sort((a, b) => a.deadline!.localeCompare(b.deadline!));
}

export function tasksScheduledOn(tasks: Task[], projects: ProjectMap, date: ISODate): Task[] {
  return tasks
    .filter((t) => t.scheduledDate === date && taskLive(t, projects) && t.status !== 'dropped')
    .sort(byScheduled);
}

/** Deadlines in den nächsten `days` Tagen (inkl. heute), ohne Aufgaben, die heute eh geplant sind. */
export function upcomingDeadlines(tasks: Task[], projects: ProjectMap, today: ISODate, days = 7): Task[] {
  const until = addDays(today, days);
  return openLiveTasks(tasks, projects)
    .filter((t) => t.deadline && t.deadline >= today && t.deadline <= until && t.scheduledDate !== today)
    .sort((a, b) => (a.deadline! + (a.deadlineTime ?? '')).localeCompare(b.deadline! + (b.deadlineTime ?? '')));
}

export function upcomingScheduled(tasks: Task[], projects: ProjectMap, today: ISODate, days = 7): Task[] {
  const until = addDays(today, days);
  return openLiveTasks(tasks, projects)
    .filter((t) => t.scheduledDate && t.scheduledDate > today && t.scheduledDate <= until)
    .sort(byScheduled);
}

export function byScheduled(a: Task, b: Task): number {
  const ka = (a.scheduledDate ?? '9999') + (a.scheduledTime ?? '99:99');
  const kb = (b.scheduledDate ?? '9999') + (b.scheduledTime ?? '99:99');
  return ka.localeCompare(kb) || a.createdAt - b.createdAt;
}

/** Sortierung für Listen: Termine zuerst, dann Deadlines, dann Rest nach Erstellung. */
export function byListOrder(a: Task, b: Task): number {
  const ka = a.scheduledDate ?? a.deadline ?? '9999';
  const kb = b.scheduledDate ?? b.deadline ?? '9999';
  return ka.localeCompare(kb) || a.createdAt - b.createdAt;
}
