import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';

export interface FilterOption<V extends string | number> {
  value: V;
  label: string;
  /** Rows this choice would match, shown on the right. */
  count?: number;
}

export interface MultiSelectFilterProps<V extends string | number> {
  label: string;
  options: FilterOption<V>[];
  selected: V[];
  onChange: (selected: V[]) => void;
}

/** A dropdown of checkboxes. Nothing selected means "all". */
export function MultiSelectFilter<V extends string | number>({ label, options, selected, onChange }: MultiSelectFilterProps<V>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = (value: V) =>
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);

  const summary =
    selected.length === 0
      ? 'All'
      : selected.length === 1
        ? options.find((o) => o.value === selected[0])?.label ?? '1 selected'
        : `${selected.length} selected`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`group h-10 inline-flex items-center gap-1.5 px-3.5 rounded-full border text-xs font-semibold transition-all active:scale-95 ${
          selected.length
            ? 'border-brand-600 bg-brand-600 text-white font-bold shadow-card ring-2 ring-brand-500/20'
            : 'border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
        }`}
      >
        <span className={`font-medium ${selected.length ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>{label}:</span>
        <span className="max-w-[9rem] truncate">{summary}</span>
        <ChevronDown className="w-3.5 h-3.5 opacity-60" />
      </button>

      {open && (
        <div
          role="listbox"
          aria-multiselectable="true"
          aria-label={label}
          className="absolute z-30 mt-1.5 w-60 max-h-72 overflow-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-1"
        >
          {options.map((option) => {
            const checked = selected.includes(option.value);
            return (
              <button
                key={String(option.value)}
                type="button"
                role="option"
                aria-selected={checked}
                onClick={() => toggle(option.value)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <span
                  className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center ${
                    checked ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {checked && <Check className="w-3 h-3" />}
                </span>
                <span className="flex-1 truncate">{option.label}</span>
                {option.count !== undefined && <span className="text-slate-400 tabular-nums">{option.count}</span>}
              </button>
            );
          })}
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="w-full mt-1 flex items-center justify-center gap-1 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:text-red-600 border-t border-slate-100 dark:border-slate-800"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
