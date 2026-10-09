/** Kalenderdatum im Format YYYY-MM-DD (lokale Zeit). */
export type ISODate = string;
/** Uhrzeit im Format HH:mm. */
export type TimeOfDay = string;

export type ProjectKind = 'ziel' | 'projekt' | 'sammlung';

export interface Project {
  id: string;
  title: string;
  notes?: string;
  kind: ProjectKind;
  color: string;
  /** Bis hier WILL ich es geschafft haben. */
  targetDate?: ISODate;
  /** Bis hier MUSS es geschafft sein. */
  deadline?: ISODate;
  /** Verpasste Deadline wurde im Aufräumen-Dialog zur Kenntnis genommen. */
  deadlineMissedAck?: boolean;
  /** Pausierte Projekte blenden ihre Aufgaben und Wiederholungen überall aus. */
  active: boolean;
  status: 'open' | 'achieved' | 'dropped';
  createdAt: number;
  updatedAt: number;
}

export interface Task {
  id: string;
  title: string;
  notes?: string;
  projectId?: string;
  /** Termin: hier WILL ich es machen. */
  scheduledDate?: ISODate;
  scheduledTime?: TimeOfDay;
  /** Deadline: bis hier MUSS es gemacht sein. */
  deadline?: ISODate;
  deadlineTime?: TimeOfDay;
  deadlineMissedAck?: boolean;
  active: boolean;
  status: 'open' | 'done' | 'dropped';
  completedAt?: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * Wiederholungsregel.
 * - day/week/month: `times`-mal pro Block aus `every` Tagen/Wochen/Monaten,
 *   an welchen Tagen innerhalb des Blocks ist egal.
 * - weekdays: an festen Wochentagen (1 = Montag … 7 = Sonntag), `times`-mal pro Tag.
 */
export type HabitRule =
  | { unit: 'day' | 'week' | 'month'; every: number; times: number }
  | { unit: 'weekdays'; days: number[]; times: number };

export interface Habit {
  id: string;
  title: string;
  notes?: string;
  projectId?: string;
  rule: HabitRule;
  startDate: ISODate;
  active: boolean;
  archived: boolean;
  createdAt: number;
  updatedAt: number;
}

/** Wie oft eine Wiederholung an einem Tag erledigt wurde. id = `${habitId}_${date}` */
export interface HabitLog {
  id: string;
  habitId: string;
  date: ISODate;
  count: number;
}
