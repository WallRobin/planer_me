import type { Project, ProjectKind } from '../db/types';
import { relativeLabel, untilLabel } from '../lib/date';
import { useData } from '../lib/data';
import { useEditors } from '../lib/editors';
import { href } from '../lib/router';
import { KIND_INFO } from '../components/ProjectEditor';
import { Empty, Section } from '../components/Section';

export function ProjectsView() {
  const { projects } = useData();
  const { openProject } = useEditors();
  const open = projects.filter((p) => p.status === 'open').sort((a, b) => a.title.localeCompare(b.title));
  const active = open.filter((p) => p.active);
  const paused = open.filter((p) => !p.active);
  const finished = projects.filter((p) => p.status !== 'open').sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ziele & Projekte</h1>
        <button className="btn-primary" onClick={() => openProject()}>
          + Neu
        </button>
      </div>
      {projects.length === 0 && (
        <div className="mt-4">
          <Empty>
            Noch keine Ziele. Leg los mit etwas wie „Zeichnen lernen", „Einkaufen" oder „Im Haus zu erledigen".
          </Empty>
        </div>
      )}
      {(['ziel', 'projekt', 'sammlung'] as ProjectKind[]).map((kind) => {
        const list = active.filter((p) => p.kind === kind);
        if (!list.length) return null;
        return (
          <Section key={kind} title={`${KIND_INFO[kind].icon} ${KIND_INFO[kind].plural}`} count={list.length}>
            <div className="grid gap-2 sm:grid-cols-2">
              {list.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          </Section>
        );
      })}
      {paused.length > 0 && (
        <Section title="⏸ Pausiert" count={paused.length} collapsible>
          <div className="grid gap-2 sm:grid-cols-2">
            {paused.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </Section>
      )}
      {finished.length > 0 && (
        <Section title="Abgeschlossen" count={finished.length} collapsible defaultOpen={false}>
          <div className="grid gap-2 sm:grid-cols-2">
            {finished.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function ProjectCard({ project: p }: { project: Project }) {
  const { tasks, habits, today } = useData();
  const own = tasks.filter((t) => t.projectId === p.id && t.status !== 'dropped');
  const done = own.filter((t) => t.status === 'done').length;
  const openCount = own.length - done;
  const habitCount = habits.filter((h) => h.projectId === p.id && h.active && !h.archived).length;
  const pct = own.length ? Math.round((done / own.length) * 100) : 0;

  return (
    <a
      href={href({ name: 'ziel', id: p.id })}
      className={`card block p-3 hover:ring-slate-300 ${!p.active || p.status !== 'open' ? 'opacity-60' : ''}`}
      style={{ borderLeft: `4px solid ${p.color}` }}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="font-medium">{p.title}</div>
          <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-slate-500">
            <span>{openCount} offen</span>
            {habitCount > 0 && <span>· ↻ {habitCount}</span>}
            {p.status === 'achieved' && <span className="text-emerald-700">· ✓ geschafft</span>}
            {p.status === 'dropped' && <span>· verworfen</span>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 text-xs">
          {p.targetDate && <span className="chip bg-indigo-50 text-indigo-700">🎯 {relativeLabel(p.targetDate, today)}</span>}
          {p.deadline && p.status === 'open' && (
            <span className={`chip ${p.deadline < today ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700'}`}>⚑ {untilLabel(p.deadline, today)}</span>
          )}
        </div>
      </div>
      {own.length > 0 && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: p.color }} />
        </div>
      )}
    </a>
  );
}
