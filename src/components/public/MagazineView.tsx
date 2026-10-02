import React, { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, Loader2 } from 'lucide-react';
import type { MagazineIssue } from '../../types';
import { FlipbookViewer } from '../magazine/FlipbookViewer';

export interface MagazineViewProps {
  /** The issue being read, or null for the shelf of issues. */
  slug: string | null;
  onOpenIssue: (slug: string) => void;
  onBackToShelf: () => void;
}

function formatDate(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

/** /magazine: published issues as covers on a shelf; /magazine/<slug>: the flipbook. */
export const MagazineView: React.FC<MagazineViewProps> = ({ slug, onOpenIssue, onBackToShelf }) => {
  const [issues, setIssues] = useState<MagazineIssue[] | null>(null);
  const [issue, setIssue] = useState<MagazineIssue | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/public/magazine')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((body) => setIssues(body.data || []))
      .catch(() => setIssues([]));
  }, []);

  useEffect(() => {
    setIssue(null);
    setError(null);
    if (!slug) return;
    let cancelled = false;
    fetch(`/api/public/magazine/${encodeURIComponent(slug)}`)
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (cancelled) return;
        if (res.ok && body?.data) setIssue(body.data);
        else setError(body?.message || 'This issue is not available.');
      })
      .catch(() => !cancelled && setError('The issue could not be loaded. Check your connection.'));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const others = (issues || []).filter((i) => i.slug !== slug);

  return (
    <div className="space-y-8 sm:space-y-10">
      {slug ? (
        <section className="space-y-5">
          <button
            type="button"
            onClick={onBackToShelf}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            All issues
          </button>

          {error ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-600 dark:text-slate-300">
              {error}
            </div>
          ) : !issue ? (
            <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Opening the issue…
            </div>
          ) : (
            <>
              <header className="max-w-3xl">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs tracking-wider uppercase">
                  <BookOpen className="w-4 h-4" />
                  <span>{issue.issue_label || 'Greenlight Magazine'}</span>
                  {issue.published_at && !issue.issue_label && <span className="text-slate-400 normal-case tracking-normal font-medium">· {formatDate(issue.published_at)}</span>}
                </div>
                <h1 className="mt-2 font-serif text-2xl sm:text-4xl font-bold text-slate-900 dark:text-white leading-tight">{issue.title}</h1>
                {issue.description && <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400">{issue.description}</p>}
              </header>
              <FlipbookViewer title={issue.title} pages={issue.pages || []} />
              <p className="text-center text-xs text-slate-500">Drag a page corner or use the arrow keys to turn pages.</p>
            </>
          )}
        </section>
      ) : (
        <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-500/30 p-6 sm:p-10 text-white shadow-lg">
          <div className="absolute top-0 right-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
          <div className="relative max-w-2xl">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs tracking-wider uppercase">
              <BookOpen className="w-4 h-4" />
              <span>Greenlight Magazine</span>
            </div>
            <h1 className="mt-3 font-serif text-3xl sm:text-5xl font-bold leading-tight">Turn the pages of every issue</h1>
            <p className="mt-3 text-sm sm:text-base text-slate-300">
              Our print editions, online. Open an issue and flip through it like the magazine in your hands.
            </p>
          </div>
        </header>
      )}

      {(!slug || others.length > 0) && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <span className="w-2 h-6 rounded-full bg-emerald-600" aria-hidden="true" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{slug ? 'More issues' : 'All issues'}</h2>
          </div>
          {issues === null ? (
            <div className="flex items-center gap-2 py-10 text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading issues…
            </div>
          ) : others.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center text-sm text-slate-500">
              The first issue is on its way. Check back soon.
            </div>
          ) : (
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
              {others.map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => onOpenIssue(item.slug)} className="group w-full text-left">
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 group-hover:border-emerald-500/50">
                      {item.cover_url ? (
                        <img src={item.cover_url} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-slate-900 to-emerald-950 p-4 text-center font-serif text-lg font-bold text-white">
                          {item.title}
                        </div>
                      )}
                      {/* Spine shading, so the cover reads as a magazine. */}
                      <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/25 to-transparent" aria-hidden="true" />
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-slate-950/70 text-[10px] font-bold text-white">
                        {item.page_count} pages
                      </span>
                    </div>
                    <div className="mt-2.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      {item.issue_label || formatDate(item.published_at)}
                    </div>
                    <div className="font-serif font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                      {item.title}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
};
