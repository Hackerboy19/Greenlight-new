import React from 'react';
import type { Article } from '../../../types';

export const STATUS_LABELS: Record<Article['status'], string> = {
  draft: 'Draft',
  review: 'In review',
  published: 'Published',
  scheduled: 'Scheduled',
  archived: 'Archived'
};

const STYLES: Record<Article['status'], string> = {
  draft: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
  review: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300',
  published: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300',
  scheduled: 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300',
  archived: 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
};

const DOTS: Record<Article['status'], string> = {
  draft: 'bg-slate-400',
  review: 'bg-amber-500',
  published: 'bg-emerald-500',
  scheduled: 'bg-sky-500',
  archived: 'bg-zinc-400'
};

/** Coloured pill for an article's workflow status. */
export const StatusBadge: React.FC<{ status: Article['status'] }> = ({ status }) => (
  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${STYLES[status] || STYLES.draft}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${DOTS[status] || DOTS.draft}`} />
    {STATUS_LABELS[status] || status}
  </span>
);
