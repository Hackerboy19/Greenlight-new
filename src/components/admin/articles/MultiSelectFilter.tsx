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
        className={`h-9 inline-flex items-center gap-1.5 px-3 rounded-xl border text-xs font-semibold transition-colors ${
          selected.length
            ? 'border-emerald-500/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
        }`}
      >
        <span className="text-slate-500 dark:text-slate-400 font-medium">{label}:</span>
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
                    checked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 dark:border-slate-600'
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
