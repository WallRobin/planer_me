import { useEffect, useMemo, useState } from 'react';
import { DataProvider, useData } from './lib/data';
import { EditorContext, type EditorApi, type EditorState } from './lib/editors';
import { href, useRoute, type Route } from './lib/router';
import { missedDeadlineProjects, missedDeadlineTasks, overdueTasks } from './lib/selectors';
import { HabitEditor } from './components/HabitEditor';
import { ProjectEditor } from './components/ProjectEditor';
import { ReviewDialog } from './components/ReviewDialog';
import { TaskEditor } from './components/TaskEditor';
import { ProjectDetailView } from './views/ProjectDetailView';
import { ProjectsView } from './views/ProjectsView';
import { SettingsView } from './views/SettingsView';
import { TasksView } from './views/TasksView';
import { TodayView } from './views/TodayView';

const NAV: { route: Route; label: string; icon: string; match: Route['name'][] }[] = [
  { route: { name: 'heute' }, label: 'Heute', icon: '☀️', match: ['heute'] },
  { route: { name: 'aufgaben' }, label: 'Aufgaben', icon: '✅', match: ['aufgaben'] },
  { route: { name: 'ziele' }, label: 'Ziele', icon: '🎯', match: ['ziele', 'ziel'] },
  { route: { name: 'einstellungen' }, label: 'Mehr', icon: '⚙️', match: ['einstellungen'] },
];

export default function App() {
  return (
    <DataProvider>
      <Shell />
    </DataProvider>
  );
}

function Shell() {
  const route = useRoute();
  const [editor, setEditor] = useState<EditorState>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  useAutoReview(setReviewOpen);

  const api = useMemo<EditorApi>(
    () => ({
      openTask: (task, defaults) => setEditor({ kind: 'task', task, defaults }),
      openHabit: (habit, defaults) => setEditor({ kind: 'habit', habit, defaults }),
      openProject: (project, defaults) => setEditor({ kind: 'project', project, defaults }),
      openReview: () => setReviewOpen(true),
    }),
    [],
  );
  const close = () => setEditor(null);

  const fabDefaults = route.name === 'ziel' ? { projectId: route.id } : undefined;

  return (
    <EditorContext.Provider value={api}>
      <div className="min-h-dvh pb-24 sm:pb-8">
        <header className="sticky top-0 z-30 hidden border-b border-slate-200 bg-white/90 backdrop-blur sm:block">
          <nav className="mx-auto flex max-w-3xl items-center gap-1 px-4 py-2">
            <span className="mr-4 font-bold text-indigo-600">Planer</span>
            {NAV.map((n) => (
              <a
                key={n.label}
                href={href(n.route)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${n.match.includes(route.name) ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {n.icon} {n.label}
              </a>
            ))}
          </nav>
        </header>

        <main className="mx-auto max-w-3xl px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:pt-6">
          {route.name === 'heute' && <TodayView />}
          {route.name === 'aufgaben' && <TasksView />}
          {route.name === 'ziele' && <ProjectsView />}
          {route.name === 'ziel' && <ProjectDetailView id={route.id} />}
          {route.name === 'einstellungen' && <SettingsView />}
        </main>

        <button
          className="fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-3xl text-white shadow-lg hover:bg-indigo-700 sm:bottom-6"
          onClick={() => (route.name === 'ziele' ? api.openProject() : api.openTask(undefined, fabDefaults))}
          aria-label={route.name === 'ziele' ? 'Neues Ziel' : 'Neue Aufgabe'}
        >
          +
        </button>

        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] sm:hidden">
          {NAV.map((n) => (
            <a
              key={n.label}
              href={href(n.route)}
              className={`flex flex-col items-center py-2 text-xs ${n.match.includes(route.name) ? 'font-semibold text-indigo-600' : 'text-slate-500'}`}
            >
              <span className="text-lg leading-tight">{n.icon}</span>
              {n.label}
            </a>
          ))}
        </nav>
      </div>

      {editor?.kind === 'task' && <TaskEditor task={editor.task} defaults={editor.defaults} onClose={close} />}
      {editor?.kind === 'habit' && <HabitEditor habit={editor.habit} defaults={editor.defaults} onClose={close} />}
      {editor?.kind === 'project' && <ProjectEditor project={editor.project} defaults={editor.defaults} onClose={close} />}
      {reviewOpen && <ReviewDialog onClose={() => setReviewOpen(false)} />}
    </EditorContext.Provider>
  );
}

/** Öffnet den Aufräumen-Dialog einmal pro Tag und Sitzung, wenn es etwas aufzuräumen gibt. */
function useAutoReview(setOpen: (v: boolean) => void) {
  const { tasks, projects, pmap, today } = useData();
  const pending =
    overdueTasks(tasks, pmap, today).length +
      missedDeadlineTasks(tasks, pmap, today).length +
      missedDeadlineProjects(projects, today).length >
    0;

  useEffect(() => {
    if (!pending) return;
    const key = 'planer.reviewShown';
    let shown: string | null = null;
    try {
      shown = sessionStorage.getItem(key);
    } catch {
      // sessionStorage nicht verfügbar
    }
    if (shown === today) return;
    try {
      sessionStorage.setItem(key, today);
    } catch {
      // egal
    }
    setOpen(true);
  }, [pending, today, setOpen]);
}
