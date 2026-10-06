import React from 'react';

export type MetricTone = 'brand' | 'amber' | 'sky' | 'slate';

const TONES: Record<MetricTone, string> = {
  brand: 'bg-brand-100 dark:bg-brand-950/60 text-brand-700 dark:text-brand-400',
  amber: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400',
  sky: 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400',
  slate: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
};

export interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  tone?: MetricTone;
  /** One line under the number, e.g. "3 drafts". */
  hint?: React.ReactNode;
  onClick?: () => void;
  loading?: boolean;
}

/** A headline number on the dashboard. Clickable when onClick is set. */
export const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon: Icon, tone = 'brand', hint, onClick, loading }) => {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className={`group w-full text-left p-5 rounded-card bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-card ${
        onClick ? 'hover:border-brand-500/40 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-700/80 dark:text-brand-400/80">{label}</span>
        <span className={`p-2 rounded-xl ${TONES[tone]}`}>
          <Icon className="w-4 h-4" />
        </span>
      </div>
      {loading ? (
        <div className="h-8 w-20 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
      ) : (
        <div className="font-serif text-4xl font-black tracking-tight text-ink dark:text-slate-100 tabular-nums">{value}</div>
      )}
      {hint && <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{hint}</div>}
    </Tag>
  );
};
