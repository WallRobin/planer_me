import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { Habit, HabitLog, ISODate, Project, Task } from '../db/types';
import { todayISO } from './date';
import { projectMap, type ProjectMap } from './selectors';

export interface AppData {
  projects: Project[];
  tasks: Task[];
  habits: Habit[];
  habitLogs: HabitLog[];
  pmap: ProjectMap;
  today: ISODate;
}

const DataContext = createContext<AppData | null>(null);

/** Aktuelles Datum, das sich um Mitternacht bzw. beim Zurückkehren in die App aktualisiert. */
function useToday(): ISODate {
  const [today, setToday] = useState(todayISO());
  useEffect(() => {
    const check = () => setToday(todayISO());
    const timer = setInterval(check, 60_000);
    document.addEventListener('visibilitychange', check);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', check);
    };
  }, []);
  return today;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const projects = useLiveQuery(() => db.projects.toArray(), []);
  const tasks = useLiveQuery(() => db.tasks.toArray(), []);
  const habits = useLiveQuery(() => db.habits.toArray(), []);
  const habitLogs = useLiveQuery(() => db.habitLogs.toArray(), []);
  const today = useToday();

  const value = useMemo(() => {
    if (!projects || !tasks || !habits || !habitLogs) return null;
    return { projects, tasks, habits, habitLogs, pmap: projectMap(projects), today };
  }, [projects, tasks, habits, habitLogs, today]);

  if (!value) return <div className="p-8 text-center text-slate-400">Lade…</div>;
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): AppData {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData außerhalb von DataProvider');
  return ctx;
}
