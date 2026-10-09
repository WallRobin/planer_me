import { useState } from 'react';
import type { ISODate, Project, Task } from '../db/types';
import { updateProject, updateTask, updateTasks } from '../db/actions';
import { longLabel, overdueLabel, relativeLabel, untilLabel } from '../lib/date';
import { useData } from '../lib/data';
import { missedDeadlineProjects, missedDeadlineTasks, overdueTasks } from '../lib/selectors';
import { Modal } from './Modal';
import { PostponeMenu } from './PostponeMenu';

/** Aufräumen: erst überfällige Termine, danach verpasste Deadlines. */
export function ReviewDialog({ onClose }: { onClose: () => void }) {
  const { tasks, projects, pmap, today } = useData();
  const [skipOverdue, setSkipOverdue] = useState(false);

  const overdue = overdueTasks(tasks, pmap, today);
  const missedTasks = missedDeadlineTasks(tasks, pmap, today);
  const missedProjects = missedDeadlineProjects(projects, today);

  const step = overdue.length > 0 && !skipOverdue ? 'overdue' : missedTasks.length + missedProjects.length > 0 ? 'deadlines' : 'done';

  return (
    <Modal title="Aufräumen" onClose={onClose} wide>
      {step === 'overdue' && (
        <OverdueStep
          tasks={overdue}
          today={today}
          onSkip={() => setSkipOverdue(true)}
          hasNext={missedTasks.length + missedProjects.length > 0}
          onClose={onClose}
        />
      )}
      {step === 'deadlines' && <DeadlineStep tasks={missedTasks} projects={missedProjects} today={today} onClose={onClose} />}
      {step === 'done' && (
        <div className="py-10 text-center">
          <div className="text-4xl">✨</div>
          <p className="mt-2 text-lg font-medium">Alles aufgeräumt</p>
          <p className="text-sm text-slate-500">Keine überfälligen Termine oder verpassten Deadlines.</p>
          <button className="btn-primary mt-6" onClick={onClose}>
            Weiter
          </button>
        </div>
      )}
    </Modal>
  );
}

function OverdueStep({
  tasks,
  today,
  onSkip,
  hasNext,
  onClose,
}: {
  tasks: Task[];
  today: ISODate;
  onSkip: () => void;
  hasNext: boolean;
  onClose: () => void;
}) {
  const { pmap } = useData();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const ids = tasks.map((t) => t.id);
  const sel = ids.filter((id) => selected.has(id));
  const target = sel.length > 0 ? sel : ids;
  const targetLabel = sel.length > 0 ? `${sel.length} ausgewählte` : `alle ${ids.length}`;

  const toggle = (list: string[], on: boolean) =>
    setSelected((s) => {
      const n = new Set(s);
      list.forEach((id) => (on ? n.add(id) : n.delete(id)));
      return n;
    });

  // nach Termin-Datum gruppieren
  const groups = new Map<ISODate, Task[]>();
  for (const t of tasks) groups.set(t.scheduledDate!, [...(groups.get(t.scheduledDate!) ?? []), t]);

  const reschedule = (list: string[], date?: ISODate) =>
    updateTasks(list, date ? { scheduledDate: date } : { scheduledDate: undefined, scheduledTime: undefined });

  return (
    <div>
      <p className="mb-3 text-sm text-slate-600">
        <strong>{tasks.length}</strong> {tasks.length === 1 ? 'Termin ist' : 'Termine sind'} vorbei, ohne erledigt zu sein. Hake
        ab, was du gemacht hast, und verschiebe oder verwirf den Rest.
      </p>

      <div className="sticky -top-4 z-10 -mx-4 mb-2 flex flex-wrap items-center gap-2 border-b border-slate-100 bg-white px-4 py-2">
        <span className="basis-full text-xs text-slate-500 sm:mr-auto sm:basis-auto">Für {targetLabel}:</span>
        <button className="btn-secondary px-2.5 py-1.5" onClick={() => updateTasks(target, { status: 'done' })}>
          ✓ Erledigt
        </button>
        <button className="btn-secondary px-2.5 py-1.5" onClick={() => updateTasks(target, { status: 'dropped' })}>
          ✕ Nicht gemacht
        </button>
        <PostponeMenu today={today} className="btn-primary px-2.5 py-1.5" label="⏭ Verschieben" onPick={(d) => reschedule(target, d)} />
      </div>

      <div className="space-y-3">
        {[...groups.entries()].map(([date, list]) => {
          const groupIds = list.map((t) => t.id);
          const allOn = groupIds.every((id) => selected.has(id));
          return (
            <div key={date}>
              <label className="mb-1 flex cursor-pointer items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <input type="checkbox" checked={allOn} onChange={() => toggle(groupIds, !allOn)} className="h-4 w-4" />
                {relativeLabel(date, today)} · {overdueLabel(date, today)}
              </label>
              <div className="card divide-y divide-slate-100">
                {list.map((t) => {
                  const project = t.projectId ? pmap.get(t.projectId) : undefined;
                  return (
                    <div key={t.id} className="flex items-center gap-2 px-3 py-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 shrink-0"
                        checked={selected.has(t.id)}
                        onChange={() => toggle([t.id], !selected.has(t.id))}
                        aria-label={`${t.title} auswählen`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate">{t.title}</div>
                        <div className="flex flex-wrap gap-1.5 text-xs text-slate-500">
                          {project && (
                            <span className="inline-flex items-center gap-1">
                              <span className="h-2 w-2 rounded-full" style={{ background: project.color }} />
                              {project.title}
                            </span>
                          )}
                          {t.deadline && <span className="text-red-600">⚑ {untilLabel(t.deadline, today)}</span>}
                        </div>
                      </div>
                      <button className="btn-ghost px-2 text-emerald-700" title="Erledigt" aria-label="Erledigt" onClick={() => updateTask(t.id, { status: 'done' })}>
                        ✓
                      </button>
                      <button className="btn-ghost px-2 text-slate-500" title="Nicht gemacht – weg damit" aria-label="Nicht gemacht" onClick={() => updateTask(t.id, { status: 'dropped' })}>
                        ✕
                      </button>
                      <PostponeMenu today={today} className="btn-ghost px-2" label="⏭" onPick={(d) => reschedule([t.id], d)} />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button className="btn-ghost" onClick={onClose}>
          Später
        </button>
        {hasNext && (
          <button className="btn-secondary" onClick={onSkip}>
            Weiter zu Deadlines →
          </button>
        )}
      </div>
    </div>
  );
}

function DeadlineStep({ tasks, projects, today, onClose }: { tasks: Task[]; projects: Project[]; today: ISODate; onClose: () => void }) {
  const { pmap } = useData();
  return (
    <div>
      <p className="mb-3 text-sm text-slate-600">
        Diese Deadlines wurden nicht geschafft. Erledigt, neue Deadline, oder bewusst ohne weitermachen?
      </p>
      <div className="space-y-2">
        {projects.map((p) => (
          <DeadlineRow
            key={p.id}
            title={`${p.title}`}
            sub={`${p.kind === 'ziel' ? 'Ziel' : p.kind === 'projekt' ? 'Projekt' : 'Sammlung'} · Deadline ${longLabel(p.deadline!)}`}
            color={p.color}
            deadline={p.deadline!}
            today={today}
            doneLabel="Geschafft"
            onDone={() => updateProject(p.id, { status: 'achieved' })}
            onDrop={() => updateProject(p.id, { status: 'dropped' })}
            onNewDeadline={(d) => updateProject(p.id, { deadline: d })}
            onKeep={() => updateProject(p.id, { deadlineMissedAck: true })}
          />
        ))}
        {tasks.map((t) => {
          const project = t.projectId ? pmap.get(t.projectId) : undefined;
          return (
            <DeadlineRow
              key={t.id}
              title={t.title}
              sub={`${project ? project.title + ' · ' : ''}Deadline ${longLabel(t.deadline!)}`}
              color={project?.color}
              deadline={t.deadline!}
              today={today}
              doneLabel="Erledigt"
              onDone={() => updateTask(t.id, { status: 'done' })}
              onDrop={() => updateTask(t.id, { status: 'dropped' })}
              onNewDeadline={(d) => updateTask(t.id, { deadline: d, deadlineTime: d ? t.deadlineTime : undefined })}
              onKeep={() => updateTask(t.id, { deadlineMissedAck: true })}
            />
          );
        })}
      </div>
      <div className="mt-4 flex justify-end">
        <button className="btn-ghost" onClick={onClose}>
          Später
        </button>
      </div>
    </div>
  );
}

function DeadlineRow(props: {
  title: string;
  sub: string;
  color?: string;
  deadline: ISODate;
  today: ISODate;
  doneLabel: string;
  onDone: () => void;
  onDrop: () => void;
  onNewDeadline: (d: ISODate | undefined) => void;
  onKeep: () => void;
}) {
  return (
    <div className="card px-3 py-2.5">
      <div className="flex items-start gap-2">
        <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: props.color ?? '#94a3b8' }} />
        <div className="min-w-0 flex-1">
          <div className="font-medium">{props.title}</div>
          <div className="text-xs text-slate-500">{props.sub}</div>
          <div className="text-xs font-medium text-red-600">{untilLabel(props.deadline, props.today)}</div>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap justify-end gap-1.5">
        <button className="btn-secondary px-2.5 py-1.5 text-emerald-700" onClick={props.onDone}>
          ✓ {props.doneLabel}
        </button>
        <PostponeMenu
          today={props.today}
          className="btn-secondary px-2.5 py-1.5"
          label="Neue Deadline"
          clearLabel="Deadline entfernen"
          onPick={props.onNewDeadline}
        />
        <button className="btn-secondary px-2.5 py-1.5" onClick={props.onKeep} title="Deadline bleibt als verpasst markiert, Aufgabe bleibt offen">
          Offen lassen
        </button>
        <button className="btn-ghost px-2.5 py-1.5 text-slate-500" onClick={props.onDrop}>
          ✕ Verwerfen
        </button>
      </div>
    </div>
  );
}
