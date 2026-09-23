import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Clock, Eye, RefreshCw } from 'lucide-react';
import { authFetch } from '../../../utils/adminAuth';
import type { DashboardSummary } from '../../../types';
import { MetricCard } from './MetricCard';
import { TrafficChart } from './TrafficChart';
import { RecentActivityFeed } from './RecentActivityFeed';

export interface DashboardHomeProps {
  isDark: boolean;
  /** Changes whenever articles are saved, so the numbers refresh. */
  refreshKey?: unknown;
  onOpenArticles?: (status?: 'published' | 'review') => void;
  onOpenArticle?: (articleId: number) => void;
  /** Whether an article in the feed can still be opened. */
  canOpenArticle?: (articleId: number) => boolean;
}

const number = new Intl.NumberFormat('en');

/** The Admin CMS home screen: headline numbers, traffic and recent activity. */
export const DashboardHome: React.FC<DashboardHomeProps> = ({
  isDark,
  refreshKey,
  onOpenArticles,
  onOpenArticle,
  canOpenArticle
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Total published"
          icon={CheckCircle2}
          tone="emerald"
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
