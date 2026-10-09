import { useState } from 'react';
import type { Task } from '../db/types';
import { relativeLabel } from '../lib/date';
import { useData } from '../lib/data';
import { useEditors } from '../lib/editors';
import { byListOrder, byScheduled, habitLive, openLiveTasks, projectLive } from '../lib/selectors';
import { HabitRow } from '../components/HabitRow';
import { QuickAdd } from '../components/QuickAdd';
import { Empty, ListCard, Section } from '../components/Section';
import { TaskRow } from '../components/TaskRow';

type Filter = 'eingang' | 'geplant' | 'alle' | 'pausiert';
const FILTERS: [Filter, string][] = [
  ['eingang', 'Eingang'],
  ['geplant', 'Geplant'],
  ['alle', 'Alle'],
  ['pausiert', 'Pausiert'],
];

export function TasksView() {
  const [filter, setFilter] = useState<Filter>('eingang');

  return (
    <div>
      <h1 className="mb-3 text-2xl font-bold">Aufgaben</h1>
      <div className="mb-4 grid grid-cols-4 gap-1 rounded-lg bg-slate-200 p-1">
        {FILTERS.map(([f, label]) => (
          <button
            key={f}
            className={`rounded-md py-1.5 text-sm font-medium ${filter === f ? 'bg-white shadow-sm' : 'text-slate-600'}`}
            onClick={() => setFilter(f)}
          >
            {label}
          </button>
        ))}
      </div>
      {filter === 'eingang' && <Inbox />}
      {filter === 'geplant' && <Planned />}
      {filter === 'alle' && <AllTasks />}
      {filter === 'pausiert' && <Paused />}
    </div>
  );
}

function Inbox() {
  const { tasks, habits, pmap } = useData();
  const { openHabit } = useEditors();
  const list = openLiveTasks(tasks, pmap).filter((t) => !t.projectId).sort(byListOrder);
  const loose = habits.filter((h) => !h.projectId && habitLive(h, pmap));
  const done = tasks
    .filter((t) => !t.projectId && t.status === 'done')
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
    .slice(0, 20);

  return (
    <>
      <p className="mb-3 text-sm text-slate-500">Aufgaben ohne Ziel oder Projekt.</p>
      <QuickAdd placeholder="Neue Aufgabe…" />
      <Section title="Offen" count={list.length}>
        {list.length ? (
          <ListCard>
            {list.map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
          </ListCard>
        ) : (
          <Empty>Eingang ist leer 🎉</Empty>
        )}
      </Section>
      <Section
        title="Wiederholungen ohne Ziel"
        count={loose.length}
        action={
          <button className="text-xs font-medium normal-case text-indigo-600" onClick={() => openHabit()}>
            + Neu
          </button>
        }
      >
        {loose.length ? (
          <ListCard>
            {loose.map((h) => (
              <HabitRow key={h.id} habit={h} />
            ))}
          </ListCard>
        ) : (
          <Empty>Keine</Empty>
        )}
      </Section>
      {done.length > 0 && <DoneSection tasks={done} />}
    </>
  );
}

function Planned() {
  const { tasks, pmap, today } = useData();
  const list = openLiveTasks(tasks, pmap)
    .filter((t) => t.scheduledDate && t.scheduledDate >= today)
    .sort(byScheduled);
  const groups = new Map<string, Task[]>();
  for (const t of list) groups.set(t.scheduledDate!, [...(groups.get(t.scheduledDate!) ?? []), t]);
  const deadlinesOnly = openLiveTasks(tasks, pmap)
    .filter((t) => !t.scheduledDate && t.deadline)
    .sort((a, b) => a.deadline!.localeCompare(b.deadline!));

  return (
    <>
      {list.length === 0 && deadlinesOnly.length === 0 && <Empty>Nichts geplant.</Empty>}
      {[...groups.entries()].map(([date, items]) => (
        <Section key={date} title={relativeLabel(date, today)} count={items.length}>
          <ListCard>
            {items.map((t) => (
              <TaskRow key={t.id} task={t} hideDate />
            ))}
          </ListCard>
        </Section>
      ))}
      {deadlinesOnly.length > 0 && (
        <Section title="Nur mit Deadline (noch kein Termin)" count={deadlinesOnly.length}>
          <ListCard>
            {deadlinesOnly.map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
          </ListCard>
        </Section>
      )}
    </>
  );
}

function AllTasks() {
  const { tasks, projects, pmap } = useData();
  const open = openLiveTasks(tasks, pmap);
  const without = open.filter((t) => !t.projectId).sort(byListOrder);
  const withProject = projects
    .filter((p) => projectLive(p))
    .map((p) => ({ p, list: open.filter((t) => t.projectId === p.id).sort(byListOrder) }))
    .filter((x) => x.list.length > 0)
    .sort((a, b) => a.p.title.localeCompare(b.p.title));

  if (open.length === 0) return <Empty>Keine offenen Aufgaben.</Empty>;
  return (
    <>
      {without.length > 0 && (
        <Section title="Ohne Ziel" count={without.length}>
          <ListCard>
            {without.map((t) => (
              <TaskRow key={t.id} task={t} showProject={false} />
            ))}
          </ListCard>
        </Section>
      )}
      {withProject.map(({ p, list }) => (
        <Section key={p.id} title={p.title} count={list.length} collapsible>
          <ListCard>
            {list.map((t) => (
              <TaskRow key={t.id} task={t} showProject={false} />
            ))}
          </ListCard>
        </Section>
      ))}
    </>
  );
}

function Paused() {
  const { tasks, habits, projects } = useData();
  const pausedTasks = tasks.filter((t) => !t.active && t.status === 'open');
  const pausedHabits = habits.filter((h) => !h.active && !h.archived);
  const pausedProjects = projects.filter((p) => !p.active && p.status === 'open');
  const { openProject } = useEditors();

  if (!pausedTasks.length && !pausedHabits.length && !pausedProjects.length)
    return <Empty>Nichts pausiert. Pausieren kannst du Aufgaben, Wiederholungen und ganze Ziele beim Bearbeiten.</Empty>;

  return (
    <>
      {pausedProjects.length > 0 && (
        <Section title="Ziele & Projekte" count={pausedProjects.length}>
          <ListCard>
            {pausedProjects.map((p) => (
              <a key={p.id} href={`#/ziele/${p.id}`} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50">
                <span className="h-3 w-3 rounded-full" style={{ background: p.color }} />
                <span className="flex-1">{p.title}</span>
                <button
                  className="btn-secondary px-2 py-1 text-xs"
                  onClick={(e) => {
                    e.preventDefault();
                    openProject(p);
                  }}
                >
                  Bearbeiten
                </button>
              </a>
            ))}
          </ListCard>
        </Section>
      )}
      {pausedHabits.length > 0 && (
        <Section title="Wiederholungen" count={pausedHabits.length}>
          <ListCard>
            {pausedHabits.map((h) => (
              <HabitRow key={h.id} habit={h} />
            ))}
          </ListCard>
        </Section>
      )}
      {pausedTasks.length > 0 && (
        <Section title="Aufgaben" count={pausedTasks.length}>
          <ListCard>
            {pausedTasks.map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
          </ListCard>
        </Section>
      )}
    </>
  );
}

export function DoneSection({ tasks }: { tasks: Task[] }) {
  return (
    <Section title="Erledigt" count={tasks.length} collapsible defaultOpen={false}>
      <ListCard>
        {tasks.map((t) => (
          <TaskRow key={t.id} task={t} />
        ))}
      </ListCard>
    </Section>
  );
}
