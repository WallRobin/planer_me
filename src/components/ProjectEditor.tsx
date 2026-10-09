import { useState } from 'react';
import type { Project, ProjectKind } from '../db/types';
import { createProject, PROJECT_COLORS, updateProject } from '../db/actions';
import { useData } from '../lib/data';
import { navigate } from '../lib/router';
import { DateField } from './DateField';
import { Modal } from './Modal';
import { Toggle } from './Toggle';

export const KIND_INFO: Record<ProjectKind, { label: string; plural: string; icon: string; hint: string }> = {
  ziel: { label: 'Ziel', plural: 'Ziele', icon: '🎯', hint: 'langfristig, z. B. „Zeichnen lernen"' },
  projekt: { label: 'Projekt', plural: 'Projekte', icon: '📦', hint: 'kurzlebig, z. B. „Einkaufen"' },
  sammlung: { label: 'Sammlung', plural: 'Sammlungen', icon: '🗂️', hint: 'Sammelliste, z. B. „Haus"' },
};

interface Props {
  project?: Project;
  defaults?: Partial<Project>;
  onClose: () => void;
}

export function ProjectEditor({ project, defaults, onClose }: Props) {
  const { today } = useData();
  const [draft, setDraft] = useState<Partial<Project>>(
    () => project ?? { kind: 'ziel', active: true, color: PROJECT_COLORS[0], ...defaults },
  );
  const set = (patch: Partial<Project>) => setDraft((d) => ({ ...d, ...patch }));
  const valid = !!draft.title?.trim();

  const save = async () => {
    if (!valid) return;
    const data = {
      title: draft.title!.trim(),
      kind: draft.kind ?? 'ziel',
      color: draft.color,
      notes: draft.notes?.trim() || undefined,
      targetDate: draft.targetDate,
      deadline: draft.deadline,
    };
    if (project) {
      const { deadline, ...rest } = data;
      await updateProject(project.id, { ...(deadline !== project.deadline ? data : rest), active: draft.active ?? true });
      onClose();
    } else {
      const id = await createProject(data);
      onClose();
      navigate({ name: 'ziel', id });
    }
  };

  return (
    <Modal
      title={project ? 'Bearbeiten' : 'Neues Ziel / Projekt'}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
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
          placeholder="z. B. Gut in Fighting Games werden"
          value={draft.title ?? ''}
          onChange={(e) => set({ title: e.target.value })}
          autoFocus={!project}
          aria-label="Titel"
        />
        <div>
          <span className="mb-1 block text-sm font-medium text-slate-700">Art</span>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(KIND_INFO) as ProjectKind[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => set({ kind: k })}
                className={`rounded-lg border p-2 text-left ${draft.kind === k ? 'border-indigo-600 bg-indigo-50' : 'border-slate-300'}`}
              >
                <div className="text-sm font-medium">
                  {KIND_INFO[k].icon} {KIND_INFO[k].label}
                </div>
                <div className="text-[11px] leading-tight text-slate-500">{KIND_INFO[k].hint}</div>
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="mb-1 block text-sm font-medium text-slate-700">Farbe</span>
          <div className="flex flex-wrap gap-2">
            {PROJECT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Farbe ${c}`}
                onClick={() => set({ color: c })}
                className={`h-8 w-8 rounded-full ${draft.color === c ? 'ring-2 ring-offset-2' : ''}`}
                style={{ background: c, ['--tw-ring-color' as string]: c }}
              />
            ))}
          </div>
        </div>
        <DateField
          label="Zieldatum"
          hint="bis hier WILL ich es schaffen"
          date={draft.targetDate}
          today={today}
          withTime={false}
          onChange={(targetDate) => set({ targetDate })}
        />
        <DateField
          label="Deadline"
          hint="bis hier MUSS es geschafft sein"
          accent="red"
          date={draft.deadline}
          today={today}
          withTime={false}
          onChange={(deadline) => set({ deadline })}
        />
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Beschreibung</span>
          <textarea className="field min-h-20" value={draft.notes ?? ''} onChange={(e) => set({ notes: e.target.value })} />
        </label>
        {project && (
          <Toggle
            label="Aktiv"
            hint="Pausiert: alle Aufgaben und Wiederholungen darin werden ausgeblendet"
            checked={draft.active ?? true}
            onChange={(active) => set({ active })}
          />
        )}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
