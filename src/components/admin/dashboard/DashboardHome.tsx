import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Clock, Eye, PenLine, RefreshCw, ShieldCheck } from 'lucide-react';
import { authFetch } from '../../../utils/adminAuth';
import type { DashboardSummary } from '../../../types';
import { MetricCard } from './MetricCard';
import { TrafficChart } from './TrafficChart';
import { RecentActivityFeed } from './RecentActivityFeed';
import { BrandPanel, buttonClass } from '../ui';

export interface DashboardHomeProps {
  isDark: boolean;
  /** Changes whenever articles are saved, so the numbers refresh. */
  refreshKey?: unknown;
  onOpenArticles?: (status?: 'published' | 'review') => void;
  onOpenArticle?: (articleId: number) => void;
  /** Whether an article in the feed can still be opened. */
  canOpenArticle?: (articleId: number) => boolean;
  /** Signed-in person's name, for the greeting. */
  userName?: string;
  /** Opens a blank article. Hidden when the person cannot create articles. */
  onNewArticle?: () => void;
}

function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const number = new Intl.NumberFormat('en');

/** The Admin CMS home screen: headline numbers, traffic and recent activity. */
export const DashboardHome: React.FC<DashboardHomeProps> = ({
  isDark,
  refreshKey,
  onOpenArticles,
  onOpenArticle,
  canOpenArticle,
  userName,
  onNewArticle
}) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('/api/admin/dashboard');
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.data) throw new Error(body?.message || `The dashboard could not load (${res.status}).`);
      setSummary(body.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The dashboard could not load.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const metrics = summary?.metrics;
  const showSkeleton = loading && !summary;

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-sm text-red-700 dark:text-red-300">
          <span>{error}</span>
          <button type="button" onClick={load} className="inline-flex items-center gap-1.5 font-semibold hover:underline">
            <RefreshCw className="w-3.5 h-3.5" /> Try again
          </button>
        </div>
      )}

      {/* Greeting in the reader site's sponsor-banner style. */}
      <BrandPanel className="p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                Editorial desk
              </span>
              <span className="text-[10px] text-slate-300 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-brand-400 shrink-0" />
                greenlight.fsia.in
              </span>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-black tracking-tight text-white">
              {greeting()}
              {userName ? `, ${userName.split(/\s+/)[0]}` : ''}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              {metrics
                ? `${metrics.pendingReview} ${metrics.pendingReview === 1 ? 'story is' : 'stories are'} waiting for review and ${metrics.drafts} ${
                    metrics.drafts === 1 ? 'draft is' : 'drafts are'
                  } in progress.`
                : 'Loading the newsroom…'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {onOpenArticles && metrics && metrics.pendingReview > 0 && (
              <button
                type="button"
                onClick={() => onOpenArticles('review')}
                className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl text-sm font-bold text-brand-200 bg-slate-950/60 border border-brand-500/30 hover:border-brand-400 hover:text-white transition-colors"
              >
                <Clock className="w-4 h-4" />
                Review queue
              </button>
            )}
            {onNewArticle && (
              <button type="button" onClick={onNewArticle} className={buttonClass('cta', 'md', 'min-h-[44px] px-5 text-xs group')}>
                <PenLine className="w-4 h-4 group-hover:-rotate-12 transition-transform" />
                Write a story
              </button>
            )}
          </div>
        </div>
      </BrandPanel>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Total published"
          icon={CheckCircle2}
          tone="brand"
          loading={showSkeleton}
          value={number.format(metrics?.published ?? 0)}
          hint={metrics && `${metrics.drafts} ${metrics.drafts === 1 ? 'draft' : 'drafts'} in progress`}
          onClick={onOpenArticles && (() => onOpenArticles('published'))}
        />
        <MetricCard
          label="Pending reviews"
          icon={Clock}
          tone="amber"
          loading={showSkeleton}
          value={number.format(metrics?.pendingReview ?? 0)}
          hint={metrics && (metrics.pendingReview ? 'Waiting for an editor' : 'Nothing waiting')}
          onClick={onOpenArticles && (() => onOpenArticles('review'))}
        />
        <MetricCard
          label="Total views"
          icon={Eye}
          tone="sky"
          loading={showSkeleton}
          value={number.format(metrics?.totalViews ?? 0)}
          hint="All articles, all time"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <TrafficChart
            data={summary?.traffic.days ?? []}
            source={summary?.traffic.source}
            isDark={isDark}
            loading={showSkeleton}
          />
        </div>
        <RecentActivityFeed
          entries={summary?.activity ?? []}
          loading={showSkeleton}
          onOpenArticle={onOpenArticle}
          canOpenArticle={canOpenArticle}
        />
      </div>
    </div>
  );
};
