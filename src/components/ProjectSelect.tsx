import { useData } from '../lib/data';

export function ProjectSelect({ value, onChange }: { value?: string; onChange: (id?: string) => void }) {
  const { projects } = useData();
  const open = projects.filter((p) => p.status === 'open' || p.id === value).sort((a, b) => a.title.localeCompare(b.title));
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">Ziel / Projekt</span>
      <select className="field" value={value ?? ''} onChange={(e) => onChange(e.target.value || undefined)}>
        <option value="">– keins –</option>
        {open.map((p) => (
          <option key={p.id} value={p.id}>
            {p.title}
            {!p.active ? ' (pausiert)' : ''}
          </option>
        ))}
      </select>
    </label>
  );
}
