import React, { useCallback, useEffect, useState } from 'react';
import { BookOpen, Loader2, Plus } from 'lucide-react';
import type { MagazineIssue } from '../../../types';
import { BrandPanel, Card, buttonClass } from '../ui';
import { IssueEditor } from './IssueEditor';
import { IssueStatusBadge } from './IssueStatusBadge';
import { fetchIssue, fetchIssues } from './magazineApi';

export interface MagazineBuilderProps {
  canPublish: boolean;
  canUpload: boolean;
  canDeletePublished: boolean;
  onNotice: (message: string) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** The Admin CMS "Magazine" tab: every issue as a cover, and the editor for one issue. */
export const MagazineBuilder: React.FC<MagazineBuilderProps> = ({ canPublish, canUpload, canDeletePublished, onNotice }) => {
  const [issues, setIssues] = useState<MagazineIssue[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  // undefined: the list; null: a new issue; an issue: editing it.
  const [editing, setEditing] = useState<MagazineIssue | null | undefined>(undefined);
  const [opening, setOpening] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoadError(null);
    fetchIssues()
      .then(setIssues)
      .catch((err) => setLoadError(err.message));
  }, []);

  useEffect(load, [load]);

  const open = async (id: number) => {
    setOpening(id);
    try {
      setEditing(await fetchIssue(id));
    } catch (err) {
      onNotice(err instanceof Error ? err.message : 'The issue could not be opened.');
    } finally {
      setOpening(null);
    }
  };

  if (editing !== undefined) {
    return (
      <IssueEditor
        key={editing?.id ?? 'new'}
        issue={editing}
        canPublish={canPublish}
        canUpload={canUpload}
        canDeletePublished={canDeletePublished}
        onBack={() => {
          setEditing(undefined);
          load();
        }}
        onSaved={() => {}}
        onDeleted={() => {
          setEditing(undefined);
          load();
        }}
        onNotice={onNotice}
      />
    );
  }

  const live = (issues || []).filter((i) => i.status === 'published').length;

  return (
    <div className="space-y-6">
      <BrandPanel className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-brand-400 font-semibold text-xs tracking-wider uppercase">
              <BookOpen className="w-4 h-4" />
              <span>Digital magazine</span>
            </div>
            <h2 className="mt-1.5 font-serif text-xl sm:text-2xl font-bold">Build an issue, publish it as a flipbook</h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-xl">
              Upload the pages in order, preview the page-turn, then publish. Readers find it under Magazine on the site.
            </p>
          </div>
          <button type="button" onClick={() => setEditing(null)} className={buttonClass('cta', 'md', 'shrink-0')}>
            <Plus className="w-4 h-4" />
            New issue
          </button>
        </div>
      </BrandPanel>

      {loadError ? (
        <Card className="text-sm text-red-700 dark:text-red-400 flex items-center justify-between gap-3">
          <span>{loadError}</span>
          <button type="button" onClick={load} className={buttonClass('secondary', 'sm')}>
            Try again
          </button>
        </Card>
      ) : issues === null ? (
        <div className="flex items-center gap-2 py-10 text-sm text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading issues…
        </div>
      ) : issues.length === 0 ? (
        <Card className="py-12 text-center">
          <BookOpen className="w-8 h-8 mx-auto text-brand-600" />
          <p className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">No issues yet</p>
          <p className="mt-1 text-xs text-slate-500">Start with "New issue" and add 7 or 8 page images.</p>
        </Card>
      ) : (
        <>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {issues.length} issue{issues.length === 1 ? '' : 's'} · {live} live
          </p>
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
            {issues.map((issue) => (
              <li key={issue.id}>
                <button type="button" onClick={() => open(issue.id)} className="group w-full text-left" disabled={opening !== null}>
                  <div className="relative aspect-[3/4] rounded-card overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800 shadow-card transition-all duration-300 group-hover:shadow-card-hover group-hover:-translate-y-0.5 group-hover:border-brand-500/40">
                    {issue.cover_url ? (
                      <img src={issue.cover_url} alt="" loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-4 text-center font-serif font-bold text-slate-500">{issue.title}</div>
                    )}
                    <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/20 to-transparent" aria-hidden="true" />
                    {opening === issue.id && (
                      <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-brand-600 animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-400 truncate">
                      {issue.issue_label || `${issue.page_count} pages`}
                    </span>
                    <IssueStatusBadge status={issue.status} />
                  </div>
                  <div className="font-serif text-sm font-bold text-ink dark:text-slate-100 leading-snug line-clamp-2 group-hover:text-brand-700 dark:group-hover:text-brand-400">
                    {issue.title}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500">
                    {issue.page_count} pages · edited {formatDate(issue.updated_at)}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};
