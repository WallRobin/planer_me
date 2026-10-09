interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}

export function Toggle({ checked, onChange, label, hint }: Props) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span>
        <span className="block text-sm font-medium text-slate-700">{label}</span>
        {hint && <span className="block text-xs text-slate-400">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-slate-300'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-5.5' : 'left-0.5'}`} />
      </button>
    </label>
  );
}
