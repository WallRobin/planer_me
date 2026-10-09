import { deleteProject, updateProject } from '../db/actions';
import { longLabel, untilLabel } from '../lib/date';
import { useData } from '../lib/data';
import { useEditors } from '../lib/editors';
import { navigate } from '../lib/router';
import { byListOrder } from '../lib/selectors';
import { HabitRow } from '../components/HabitRow';
import { KIND_INFO } from '../components/ProjectEditor';
import { QuickAdd } from '../components/QuickAdd';
import { Empty, ListCard, Section } from '../components/Section';
import { TaskRow } from '../components/TaskRow';
import { DoneSection } from './TasksView';

export function ProjectDetailView({ id }: { id: string }) {
  const { projects, tasks, habits, today } = useData();
  const { openProject, openHabit } = useEditors();
  const p = projects.find((x) => x.id === id);

  if (!p) {
    return (
      <div>
        <a href="#/ziele" className="text-sm text-indigo-600">
          ← Ziele
        </a>
        <Empty>Nicht gefunden.</Empty>
      </div>
    );
  }

  const own = tasks.filter((t) => t.projectId === p.id);
  const openTasks = own.filter((t) => t.status === 'open' && t.active).sort(byListOrder);
  const pausedTasks = own.filter((t) => t.status === 'open' && !t.active);
  const doneTasks = own.filter((t) => t.status === 'done').sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
  const ownHabits = habits.filter((h) => h.projectId === p.id && !h.archived);
  const activeHabits = ownHabits.filter((h) => h.active);
  const pausedHabits = ownHabits.filter((h) => !h.active);
  const isOpen = p.status === 'open';

  return (
    <div>
      <a href="#/ziele" className="text-sm text-indigo-600">
        ← Ziele & Projekte
      </a>
      <div className="mt-2 rounded-xl p-4 text-white" style={{ background: p.color }}>
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-wide opacity-80">
              {KIND_INFO[p.kind].icon} {KIND_INFO[p.kind].label}
              {!p.active && ' · pausiert'}
              {p.status === 'achieved' && ' · geschafft ✓'}
              {p.status === 'dropped' && ' · verworfen'}
            </div>
            <h1 className="break-words text-2xl font-bold">{p.title}</h1>
          </div>
          <button className="rounded-lg bg-white/20 px-3 py-1.5 text-sm font-medium hover:bg-white/30" onClick={() => openProject(p)}>
            Bearbeiten
          </button>
        </div>
        {p.notes && <p className="mt-2 whitespace-pre-wrap text-sm opacity-90">{p.notes}</p>}
        {(p.targetDate || p.deadline) && (
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            {p.targetDate && <span className="rounded-md bg-white/20 px-2 py-0.5">🎯 Will bis {longLabel(p.targetDate)}</span>}
            {p.deadline && (
              <span className="rounded-md bg-white/20 px-2 py-0.5">
                ⚑ Muss bis {longLabel(p.deadline)} ({untilLabel(p.deadline, today)})
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {isOpen && (
          <button className="btn-secondary" onClick={() => updateProject(p.id, { active: !p.active })}>
            {p.active ? '⏸ Pausieren' : '▶ Aktivieren'}
          </button>
        )}
        {isOpen ? (
          <button className="btn-secondary" onClick={() => updateProject(p.id, { status: 'achieved' })}>
            ✓ {p.kind === 'ziel' ? 'Ziel erreicht' : 'Abschließen'}
          </button>
        ) : (
          <button className="btn-secondary" onClick={() => updateProject(p.id, { status: 'open' })}>
            ↺ Wieder öffnen
          </button>
        )}
        <button
          className="btn-danger ml-auto"
          onClick={async () => {
            if (!confirm(`„${p.title}" löschen?`)) return;
            const withContent = own.length + ownHabits.length > 0
              ? confirm('Auch alle Aufgaben und Wiederholungen darin löschen?\n\nOK = mitlöschen, Abbrechen = behalten (ohne Ziel)')
              : true;
            await deleteProject(p.id, withContent);
            navigate({ name: 'ziele' });
          }}
        >
          Löschen
        </button>
      </div>

      {isOpen && (
        <div className="mt-4">
          <QuickAdd placeholder={`Aufgabe zu „${p.title}"…`} defaults={{ projectId: p.id }} />
        </div>
      )}

      <Section
        title="Wiederkehrend"
        count={activeHabits.length}
        action={
          isOpen && (
            <button className="text-xs font-medium normal-case text-indigo-600" onClick={() => openHabit(undefined, { projectId: p.id })}>
              + Wiederholung
            </button>
          )
        }
      >
        {activeHabits.length ? (
          <ListCard>
            {activeHabits.map((h) => (
              <HabitRow key={h.id} habit={h} showProject={false} />
            ))}
          </ListCard>
        ) : (
          <Empty>z. B. „30 Minuten am Tag trainieren"</Empty>
        )}
      </Section>

      <Section title="Aufgaben" count={openTasks.length}>
        {openTasks.length ? (
          <ListCard>
            {openTasks.map((t) => (
              <TaskRow key={t.id} task={t} showProject={false} />
            ))}
          </ListCard>
        ) : (
          <Empty>Keine offenen Aufgaben</Empty>
        )}
      </Section>

      {pausedTasks.length + pausedHabits.length > 0 && (
        <Section title="Pausiert" count={pausedTasks.length + pausedHabits.length} collapsible defaultOpen={false}>
          <ListCard>
            {pausedHabits.map((h) => (
              <HabitRow key={h.id} habit={h} showProject={false} />
            ))}
            {pausedTasks.map((t) => (
              <TaskRow key={t.id} task={t} showProject={false} />
            ))}
          </ListCard>
        </Section>
      )}

      {doneTasks.length > 0 && <DoneSection tasks={doneTasks} />}
    </div>
  );
}
