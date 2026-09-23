import React from 'react';
import { CheckCircle2, Edit3, FilePlus2, Send, Trash2, EyeOff, Undo2 } from 'lucide-react';
import type { ActivityAction, ActivityEntry } from '../../../types';

const ACTIONS: Record<ActivityAction, { verb: string; icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  created: { verb: 'created a draft', icon: FilePlus2, tone: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' },
  edited: { verb: 'edited', icon: Edit3, tone: 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400' },
  submitted: { verb: 'submitted for review', icon: Send, tone: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400' },
  returned: { verb: 'sent back to draft', icon: Undo2, tone: 'bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-400' },
  published: { verb: 'published', icon: CheckCircle2, tone: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400' },
  unpublished: { verb: 'unpublished', icon: EyeOff, tone: 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400' },
  deleted: { verb: 'deleted', icon: Trash2, tone: 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400' }
};

const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

export function timeAgo(iso: string, now = Date.now()) {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 45) return 'just now';
  if (abs < 3600) return relative.format(Math.round(seconds / 60), 'minute');
  if (abs < 86400) return relative.format(Math.round(seconds / 3600), 'hour');
  if (abs < 86400 * 30) return relative.format(Math.round(seconds / 86400), 'day');
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export interface RecentActivityFeedProps {
  entries: ActivityEntry[];
  loading?: boolean;
  /** Opens an article when its title is clicked (not offered for deleted ones). */
  onOpenArticle?: (articleId: number) => void;
  /** Whether an article can still be opened; titles of others are plain text. */
  canOpenArticle?: (articleId: number) => boolean;
}

/** Who recently created, edited, submitted or published which article. */
export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({ entries, loading, onOpenArticle, canOpenArticle }) => (
  <section className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Recent activity</h2>
    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Who edited or published what</p>

    {loading ? (
      <ul className="space-y-4">
        {[0, 1, 2, 3].map((i) => (
          <li key={i} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-3/4 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
              <div className="h-3 w-1/3 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
            </div>
          </li>
        ))}
      </ul>
    ) : entries.length === 0 ? (
      <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
        No activity yet. Changes to articles will show up here.
      </p>
    ) : (
      <ol className="space-y-4">
        {entries.map((entry) => {
          const { verb, icon: Icon, tone } = ACTIONS[entry.action] || ACTIONS.edited;
          const canOpen =
            onOpenArticle &&
            entry.article_id !== null &&
            entry.action !== 'deleted' &&
            (!canOpenArticle || canOpenArticle(entry.article_id));
          return (
            <li key={entry.id} className="flex gap-3">
              <span className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${tone}`}>
                <Icon className="w-4 h-4" />
              </span>
              <div className="min-w-0 text-sm">
                <p className="text-slate-700 dark:text-slate-300 leading-snug">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{entry.actor_name}</span> {verb}{' '}
                  {canOpen ? (
                    <button
                      type="button"
                      onClick={() => onOpenArticle!(entry.article_id!)}
                      className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline text-left"
                    >
                      {entry.article_title || 'an article'}
                    </button>
                  ) : (
                    <span className="font-semibold">{entry.article_title || 'an article'}</span>
                  )}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  <time dateTime={entry.created_at} title={new Date(entry.created_at).toLocaleString()}>
                    {timeAgo(entry.created_at)}
                  </time>
                  {entry.actor_role && <span className="capitalize"> · {entry.actor_role}</span>}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    )}
  </section>
);
