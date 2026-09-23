import React from 'react';

export type MetricTone = 'emerald' | 'amber' | 'sky' | 'slate';

const TONES: Record<MetricTone, string> = {
  emerald: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400',
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
export const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon: Icon, tone = 'emerald', hint, onClick, loading }) => {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className={`w-full text-left p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs ${
        onClick ? 'hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</span>
        <span className={`p-2 rounded-xl ${TONES[tone]}`}>
          <Icon className="w-4 h-4" />
        </span>
      </div>
      {loading ? (
        <div className="h-8 w-20 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
      ) : (
        <div className="text-3xl font-black text-slate-900 dark:text-slate-100 tabular-nums">{value}</div>
      )}
      {hint && <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{hint}</div>}
    </Tag>
  );
};
