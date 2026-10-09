import { createContext, useContext } from 'react';
import type { Habit, Project, Task } from '../db/types';

export type EditorState =
  | { kind: 'task'; task?: Task; defaults?: Partial<Task> }
  | { kind: 'habit'; habit?: Habit; defaults?: Partial<Habit> }
  | { kind: 'project'; project?: Project; defaults?: Partial<Project> }
  | null;

export interface EditorApi {
  openTask: (task?: Task, defaults?: Partial<Task>) => void;
  openHabit: (habit?: Habit, defaults?: Partial<Habit>) => void;
  openProject: (project?: Project, defaults?: Partial<Project>) => void;
  openReview: () => void;
}

export const EditorContext = createContext<EditorApi | null>(null);

export function useEditors(): EditorApi {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditors außerhalb von EditorContext');
  return ctx;
}
