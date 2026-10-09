interface Props {
  checked: boolean;
  onChange: () => void;
  color?: string;
  label: string;
  /** Fortschritt 0..1 für mehrfache Wiederholungen. */
  progress?: number;
  dropped?: boolean;
}

export function Check({ checked, onChange, color = '#4f46e5', label, progress, dropped }: Props) {
  const partial = !checked && progress !== undefined && progress > 0;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
      style={{
        borderColor: color,
        background: checked ? color : partial ? `conic-gradient(${color}55 ${progress! * 360}deg, transparent 0)` : undefined,
      }}
    >
      {checked && (
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {dropped && <span className="text-xs text-slate-400">✕</span>}
    </button>
  );
}
