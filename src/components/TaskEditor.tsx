import { useState } from 'react';
import type { Task } from '../db/types';
import { createTask, deleteTask, updateTask } from '../db/actions';
import { useData } from '../lib/data';
import { DateField } from './DateField';
import { Modal } from './Modal';
import { ProjectSelect } from './ProjectSelect';
import { Toggle } from './Toggle';

interface Props {
  task?: Task;
  defaults?: Partial<Task>;
  onClose: () => void;
}

export function TaskEditor({ task, defaults, onClose }: Props) {
  const { today } = useData();
  const [draft, setDraft] = useState<Partial<Task>>(() => task ?? { active: true, ...defaults });
  const set = (patch: Partial<Task>) => setDraft((d) => ({ ...d, ...patch }));
  const valid = !!draft.title?.trim();

  const save = async () => {
    if (!valid) return;
    const data = {
      title: draft.title!.trim(),
      notes: draft.notes?.trim() || undefined,
      projectId: draft.projectId,
      scheduledDate: draft.scheduledDate,
      scheduledTime: draft.scheduledTime,
      deadline: draft.deadline,
      deadlineTime: draft.deadlineTime,
      active: draft.active ?? true,
    };
    if (task) {
      const { deadline, ...rest } = data;
      // Deadline nur als geändert markieren, wenn sie wirklich geändert wurde
      await updateTask(task.id, deadline !== task.deadline ? data : rest);
    } else {
      await createTask(data);
    }
    onClose();
  };

  return (
    <Modal
      title={task ? 'Aufgabe bearbeiten' : 'Neue Aufgabe'}
      onClose={onClose}
      footer={
        <div className="flex items-center gap-2">
          {task && (
            <button
              className="btn-danger"
              onClick={async () => {
                if (confirm('Aufgabe wirklich löschen?')) {
                  await deleteTask(task.id);
                  onClose();
                }
              }}
            >
              Löschen
            </button>
          )}
          <div className="flex-1" />
          <button className="btn-secondary" onClick={onClose}>
            Abbrechen
          </button>
          <button className="btn-primary" disabled={!valid} onClick={save}>
            Speichern
          </button>
        </div>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <input
          className="field text-lg"
          placeholder="Was ist zu tun?"
          value={draft.title ?? ''}
          onChange={(e) => set({ title: e.target.value })}
          autoFocus={!task}
          aria-label="Titel"
        />
        <ProjectSelect value={draft.projectId} onChange={(projectId) => set({ projectId })} />
        <DateField
          label="Termin"
          hint="hier WILL ich es machen"
          date={draft.scheduledDate}
          time={draft.scheduledTime}
          today={today}
          onChange={(scheduledDate, scheduledTime) => set({ scheduledDate, scheduledTime })}
        />
        <DateField
          label="Deadline"
          hint="bis hier MUSS es erledigt sein"
          accent="red"
          date={draft.deadline}
          time={draft.deadlineTime}
          today={today}
          onChange={(deadline, deadlineTime) => set({ deadline, deadlineTime })}
        />
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Notizen</span>
          <textarea className="field min-h-20" value={draft.notes ?? ''} onChange={(e) => set({ notes: e.target.value })} />
        </label>
        <Toggle
          label="Aktiv"
          hint="Pausierte Aufgaben tauchen nirgends auf, bis du sie wieder aktivierst"
          checked={draft.active ?? true}
          onChange={(active) => set({ active })}
        />
        {task && task.status !== 'open' && (
          <button type="button" className="btn-secondary w-full" onClick={() => updateTask(task.id, { status: 'open' }).then(onClose)}>
            Wieder öffnen ({task.status === 'done' ? 'war erledigt' : 'war verworfen'})
          </button>
        )}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
