import type { Task } from '../db/types';
import { toggleTaskDone } from '../db/actions';
import { diffDays, relativeLabel, untilLabel } from '../lib/date';
import { useData } from '../lib/data';
import { useEditors } from '../lib/editors';
import { Check } from './Check';

interface Props {
  task: Task;
  showProject?: boolean;
  /** Termin-Datum ausblenden (z. B. in der Heute-Ansicht nur Uhrzeit zeigen). */
  hideDate?: boolean;
}

export function TaskRow({ task, showProject = true, hideDate }: Props) {
  const { pmap, today } = useData();
  const { openTask } = useEditors();
  const project = task.projectId ? pmap.get(task.projectId) : undefined;
  const done = task.status === 'done';
  const dropped = task.status === 'dropped';
  const finished = done || dropped;

  const deadlineDiff = task.deadline ? diffDays(today, task.deadline) : null;
  const deadlineClass =
    deadlineDiff === null
      ? ''
      : deadlineDiff < 0
        ? 'bg-red-600 text-white'
        : deadlineDiff <= 2
          ? 'bg-red-100 text-red-700'
          : 'bg-amber-50 text-amber-700';

  return (
    <div
      className={`flex cursor-pointer items-start gap-3 px-3 py-2.5 hover:bg-slate-50 ${!task.active ? 'opacity-50' : ''}`}
      onClick={() => openTask(task)}
    >
      <div className="pt-0.5">
        <Check
          checked={done}
          dropped={dropped}
          onChange={() => toggleTaskDone(task)}
          color={project?.color}
          label={done ? `${task.title} wieder öffnen` : `${task.title} erledigen`}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className={`break-words ${finished ? 'text-slate-400 line-through' : ''}`}>{task.title}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 empty:hidden">
          {task.scheduledDate && !(hideDate && !task.scheduledTime) && (
            <span className="chip bg-indigo-50 text-indigo-700" title="Termin: hier will ich es machen">
              📅 {hideDate ? '' : relativeLabel(task.scheduledDate, today)}
              {task.scheduledTime ? `${hideDate ? '' : ', '}${task.scheduledTime}` : ''}
            </span>
          )}
          {task.deadline && !finished && (
            <span className={`chip ${deadlineClass}`} title="Deadline: bis hier muss es erledigt sein">
              ⚑ {untilLabel(task.deadline, today)}
              {task.deadlineTime ? `, ${task.deadlineTime}` : ''}
            </span>
          )}
          {showProject && project && (
            <span className="chip text-slate-500">
              <span className="h-2 w-2 rounded-full" style={{ background: project.color }} />
              {project.title}
            </span>
          )}
          {!task.active && <span className="chip bg-slate-100 text-slate-500">pausiert</span>}
          {task.notes && <span className="chip text-slate-400" title={task.notes}>📝</span>}
        </div>
      </div>
    </div>
  );
}
