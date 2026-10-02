import React from 'react';
import type { MagazineIssue } from '../../../types';

/** Draft or Live pill, in the same style as the articles table's status badge. */
export const IssueStatusBadge: React.FC<{ status: MagazineIssue['status'] }> = ({ status }) =>
  status === 'published' ? (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap bg-brand-100 dark:bg-brand-950/60 text-brand-800 dark:text-brand-300">
      <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
      Live
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      Draft
    </span>
  );
