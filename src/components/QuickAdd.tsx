import { useState } from 'react';
import type { Task } from '../db/types';
import { createTask } from '../db/actions';
import { useEditors } from '../lib/editors';

interface Props {
  placeholder: string;
  defaults?: Partial<Task>;
}

/** Schnelles Hinzufügen: Enter legt an, "Details" öffnet den vollen Editor. */
export function QuickAdd({ placeholder, defaults = {} }: Props) {
  const [title, setTitle] = useState('');
  const { openTask } = useEditors();

  const add = async () => {
    if (!title.trim()) return;
    await createTask({ ...defaults, title });
    setTitle('');
  };

  return (
    <form
      className="card flex items-center gap-2 px-3 py-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        add();
      }}
    >
      <span className="text-xl leading-none text-indigo-600">+</span>
      <input
        className="min-w-0 flex-1 bg-transparent py-1.5 outline-none"
        placeholder={placeholder}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        aria-label={placeholder}
      />
      {title ? (
        <>
          <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={() => { openTask(undefined, { ...defaults, title }); setTitle(''); }}>
            Details
          </button>
          <button type="submit" className="btn-primary px-3 py-1">
            OK
          </button>
        </>
      ) : null}
    </form>
  );
}
