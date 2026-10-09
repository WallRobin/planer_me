import { useState, type ReactNode } from 'react';

interface Props {
  title: string;
  count?: number;
  children: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  action?: ReactNode;
}

export function Section({ title, count, children, collapsible, defaultOpen = true, action }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const header = (
    <>
      {collapsible && <span className="w-3 text-slate-400">{open ? '▾' : '▸'}</span>}
      <span>{title}</span>
      {count !== undefined && <span className="rounded-full bg-slate-200 px-1.5 text-[10px] text-slate-600">{count}</span>}
    </>
  );
  return (
    <section>
      <div className="section-title">
        {collapsible ? (
          <button className="flex items-center gap-2 uppercase" onClick={() => setOpen(!open)} aria-expanded={open}>
            {header}
          </button>
        ) : (
          header
        )}
        <span className="flex-1" />
        {action}
      </div>
      {(!collapsible || open) && children}
    </section>
  );
}

export function ListCard({ children }: { children: ReactNode }) {
  return <div className="card divide-y divide-slate-100 overflow-visible">{children}</div>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-400">{children}</p>;
}
