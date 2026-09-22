/**
 * Social Media Share Counts & Click-Through Rates (CTR) Dashboard Component
 * Designed for Greenlight CMS Admin to monitor social distribution virality,
 * channel performance (WhatsApp, LinkedIn, X, Facebook, Telegram), and referral CTR.
 * Styled in light English editorial aesthetic.
 */

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import {
  Share2,
  MousePointerClick,
  Percent,
  TrendingUp,
  Flame,
  ArrowUpRight,
  Search,
  Filter,
  Download,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Link as LinkIcon,
  MessageSquare,
  Twitter,
  Linkedin,
  Facebook,
  Send,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { Article } from '../../types';
import {
  SocialPlatform,
  SOCIAL_PLATFORMS,
  ArticleSocialMetrics,
  loadPersistedSocialMetrics,
  generateSocialTimeSeries,
  calculatePlatformSummaries,
  recordSocialShareEvent,
  recordSocialClickEvent,
  buildUtmLink,
  generateSeedMetrics
} from '../../data/socialShareData';

interface SocialShareAnalyticsProps {
  articles: Article[];
  onSelectArticle?: (slug: string) => void;
}

export const SocialShareAnalytics: React.FC<SocialShareAnalyticsProps> = ({
  articles,
  onSelectArticle
}) => {
  // State for metrics dataset
  const [metricsMap, setMetricsMap] = useState<Record<number, ArticleSocialMetrics>>(() =>
    loadPersistedSocialMetrics(articles)
  );

  // Filters & Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<SocialPlatform | 'all'>('all');
  const [sortBy, setSortBy] = useState<'shares' | 'clicks' | 'ctr' | 'viral'>('shares');
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d'>('14d');
  const [chartView, setChartView] = useState<'overview' | 'channels' | 'ctr'>('overview');

  // UTM Generator Modal/Drawer State
  const [selectedArticleForUtm, setSelectedArticleForUtm] = useState<Article | null>(null);
  const [utmPlatform, setUtmPlatform] = useState<SocialPlatform>('whatsapp');
  const [utmCampaign, setUtmCampaign] = useState('weekly_edition');
  const [copiedUtmUrl, setCopiedUtmUrl] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setActionToast(message);
    setTimeout(() => setActionToast(null), 3000);
  };

  // Convert metrics map into array
  const metricsList = useMemo(() => {
    return Object.values(metricsMap);
  }, [metricsMap]);

  // Aggregate Executive Summaries
  const summaries = useMemo(() => {
    const totalShares = metricsList.reduce((acc, m) => acc + m.totalShares, 0);
    const totalClicks = metricsList.reduce((acc, m) => acc + m.totalClicks, 0);
    const overallCtr = totalShares > 0 ? Number(((totalClicks / totalShares) * 100).toFixed(1)) : 0;

    // Platform Breakdown
    const platformStats = calculatePlatformSummaries(metricsList);
    const topPlatform = platformStats.reduce(
      (top, current) => (current.ctr > top.ctr ? current : top),
      platformStats[0] || { name: 'WhatsApp', ctr: 28.5 }
    );

    // Top shared story
    const topShared = [...metricsList].sort((a, b) => b.totalShares - a.totalShares)[0];

    return {
      totalShares,
      totalClicks,
      overallCtr,
      topPlatform,
      topShared,
      platformStats
    };
  }, [metricsList]);

  // Generate Recharts Time Series Data
  const timeSeriesData = useMemo(() => {
    const raw = generateSocialTimeSeries(articles);
    if (timeRange === '7d') {
      return raw.slice(-7);
    }
    return raw;
  }, [articles, timeRange]);

  // Filtered & Sorted Articles Table
  const filteredArticles = useMemo(() => {
    let result = metricsList.filter((m) => {
      const matchSearch =
        m.articleTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.articleSlug.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;
      if (platformFilter !== 'all') {
        return (m.shares[platformFilter] || 0) > 0;
      }
      return true;
    });

    result.sort((a, b) => {
      if (sortBy === 'shares') return b.totalShares - a.totalShares;
      if (sortBy === 'clicks') return b.totalClicks - a.totalClicks;
      if (sortBy === 'ctr') return b.ctr - a.ctr;
      if (sortBy === 'viral') return b.viralVelocity - a.viralVelocity;
      return 0;
    });

    return result;
  }, [metricsList, searchQuery, platformFilter, sortBy]);

  // Helper to record a test share
  const handleTestShare = (articleId: number, platform: SocialPlatform) => {
    const updated = recordSocialShareEvent(articleId, platform, articles);
    setMetricsMap((prev) => ({
      ...prev,
      [articleId]: updated
    }));
    showToast(`+1 ${SOCIAL_PLATFORMS[platform].name} Share recorded for "${updated.articleTitle.slice(0, 30)}..."`);
  };

  // Helper to record a test click
  const handleTestClick = (articleId: number, platform: SocialPlatform) => {
    const updated = recordSocialClickEvent(articleId, platform, articles);
    setMetricsMap((prev) => ({
      ...prev,
      [articleId]: updated
    }));
    showToast(`+1 ${SOCIAL_PLATFORMS[platform].name} Click-through recorded (CTR updated to ${updated.ctr}%)`);
  };

  // Reset to default seed
  const handleResetMetrics = () => {
    const fresh = generateSeedMetrics(articles);
    localStorage.setItem('greenlight_social_metrics_v2', JSON.stringify(fresh));
    setMetricsMap(fresh);
    showToast('Reset social metrics to baseline seed data.');
  };

  // Export CSV Report
  const handleExportCsv = () => {
    const headers = [
      'Article ID',
      'Title',
      'Category',
      'Total Shares',
      'WhatsApp Shares',
      'LinkedIn Shares',
      'Twitter Shares',
      'Facebook Shares',
      'Telegram Shares',
      'Direct Shares',
      'Total Clicks',
      'Social CTR %',
      'Viral Index'
    ];

    const rows = metricsList.map((m) => [
      m.articleId,
      `"${m.articleTitle.replace(/"/g, '""')}"`,
      `"${m.categoryName}"`,
      m.totalShares,
      m.shares.whatsapp || 0,
      m.shares.linkedin || 0,
      m.shares.twitter || 0,
      m.shares.facebook || 0,
      m.shares.telegram || 0,
      m.shares.direct || 0,
      m.totalClicks,
      `${m.ctr}%`,
      m.viralVelocity
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `greenlight-social-shares-ctr-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported social performance report to CSV');
  };

  // Generate UTM link preview
  const generatedUtmLink = selectedArticleForUtm
    ? buildUtmLink(window.location.origin, selectedArticleForUtm.slug, utmPlatform, utmCampaign)
    : '';

  const getPlatformIcon = (platform: SocialPlatform, className: string = 'w-4 h-4') => {
    switch (platform) {
      case 'whatsapp':
        return <MessageSquare className={className} />;
      case 'twitter':
        return <Twitter className={className} />;
      case 'linkedin':
        return <Linkedin className={className} />;
      case 'facebook':
        return <Facebook className={className} />;
      case 'telegram':
        return <Send className={className} />;
      case 'direct':
        return <LinkIcon className={className} />;
      default:
        return <Share2 className={className} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {actionToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-3">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{actionToast}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/40">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Social Media Shares & Click-Through Rates (CTR)</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Tracking
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Monitor social media distribution, viral sharing velocity, and outbound referral clicks with UTM tracking.
              </p>
            </div>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportCsv}
            className="min-h-[40px] px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl flex items-center gap-1.5 transition-colors active:scale-95"
            title="Download full analytics as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleResetMetrics}
            className="min-h-[40px] px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-1.5 transition-colors active:scale-95"
            title="Reset to fresh seed metrics"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Seed</span>
          </button>
        </div>
      </div>

      {/* 1. Executive Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Shares */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Shares</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
              {summaries.totalShares.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+14.8% vs previous period</span>
            </div>
          </div>
        </div>

        {/* Total Referral Clicks */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Referral Clicks</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <MousePointerClick className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
              {summaries.totalClicks.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+22.4% organic click-throughs</span>
            </div>
          </div>
        </div>

        {/* Aggregate Social CTR */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Average Social CTR</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              {summaries.overallCtr}%
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span>Clicks / Total Shares ratio</span>
            </div>
          </div>
        </div>

        {/* Top Converting Channel */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Top Viral Channel</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>{summaries.topPlatform?.name || 'WhatsApp'}</span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                {summaries.topPlatform?.ctr}% CTR
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
              <span>Highest reader retention</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Platform Breakdown Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
            <span>Platform Channel Breakdown</span>
          </h3>
          <span className="text-xs text-slate-500">
            Click any channel to filter article distribution below
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {summaries.platformStats.map((item) => {
            const config = SOCIAL_PLATFORMS[item.platform];
            const isSelected = platformFilter === item.platform;
            return (
              <button
                key={item.platform}
                type="button"
                onClick={() => setPlatformFilter(isSelected ? 'all' : item.platform)}
                className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'ring-2 ring-emerald-500 bg-white dark:bg-slate-800 border-emerald-400 shadow-md scale-[1.02]'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {item.name}
                    </span>
                    <div className={`w-6 h-6 rounded-lg ${config.bgColor} ${config.textColor} flex items-center justify-center shrink-0`}>
                      {getPlatformIcon(item.platform, 'w-3.5 h-3.5')}
                    </div>
                  </div>

                  <div className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
                    {item.shares.toLocaleString()}
                    <span className="text-[10px] font-normal text-slate-400 ml-1">shares</span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-mono">
                    {item.clicks.toLocaleString()} clicks
                  </span>
                  <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {item.ctr}% CTR
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Recharts Interactive Charts Section */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Social Growth & Virality Dynamics</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Historical distribution of outgoing shared links and incoming referral traffic.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setChartView('overview')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  chartView === 'overview'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Shares vs Clicks
              </button>
              <button
                type="button"
                onClick={() => setChartView('channels')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  chartView === 'channels'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                By Channel
              </button>
              <button
                type="button"
                onClick={() => setChartView('ctr')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  chartView === 'ctr'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                CTR % Trend
              </button>
            </div>

            {/* Time Range Selector */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setTimeRange('7d')}
                className={`px-2.5 py-1.5 rounded-lg transition-colors ${
                  timeRange === '7d'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                7D
              </button>
              <button
                type="button"
                onClick={() => setTimeRange('14d')}
                className={`px-2.5 py-1.5 rounded-lg transition-colors ${
                  timeRange === '14d'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                14D
              </button>
            </div>
          </div>
        </div>

        {/* Chart Render Area */}
        <div className="h-[280px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {chartView === 'overview' ? (
              <ComposedChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#10B981' }} tickLine={false} axisLine={false} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#F8FAFC',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar yAxisId="left" dataKey="totalShares" name="Shares" fill="#94A3B8" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar yAxisId="left" dataKey="totalClicks" name="Clicks" fill="#059669" radius={[4, 4, 0, 0]} barSize={16} />
                <Line yAxisId="right" type="monotone" dataKey="ctr" name="CTR %" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} />
              </ComposedChart>
            ) : chartView === 'channels' ? (
              <LineChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#F8FAFC',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="whatsappClicks" name="WhatsApp" stroke="#25D366" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="linkedinClicks" name="LinkedIn" stroke="#0A66C2" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="twitterClicks" name="X (Twitter)" stroke="#000000" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="directClicks" name="Direct" stroke="#64748B" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="facebookClicks" name="Facebook" stroke="#1877F2" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="telegramClicks" name="Telegram" stroke="#229ED9" strokeWidth={1.5} dot={false} />
              </LineChart>
            ) : (
              <LineChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#F8FAFC',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="ctr" name="Overall CTR %" stroke="#059669" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Article-by-Article Social Table & UTM Link Tools */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Article Share Performance & Referral Tracking
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              ({filteredArticles.length} stories)
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles..."
                className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500 font-medium"
              >
                <option value="shares">Total Shares</option>
                <option value="clicks">Referral Clicks</option>
                <option value="ctr">Click-Through Rate (CTR)</option>
                <option value="viral">Viral Velocity</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Story & Category</th>
                <th className="py-3 px-3 text-right">Shares</th>
                <th className="py-3 px-3">Channel Distribution</th>
                <th className="py-3 px-3 text-right">Clicks</th>
                <th className="py-3 px-3 text-right">CTR %</th>
                <th className="py-3 px-3 text-center">Viral Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredArticles.map((m) => {
                const article = articles.find((a) => a.id === m.articleId);
                const isHighCtr = m.ctr >= 18;
                const isModerateCtr = m.ctr >= 12;

                return (
                  <tr
                    key={m.articleId}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Story Title & Slug */}
                    <td className="py-3.5 px-4 max-w-[280px]">
                      <div className="font-serif font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                        {m.articleTitle}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                          {m.categoryName}
                        </span>
                        <span className="font-mono truncate">/{m.articleSlug}</span>
                      </div>
                    </td>

                    {/* Total Shares */}
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      {m.totalShares.toLocaleString()}
                    </td>

                    {/* Channel Mini Badges */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1 flex-wrap max-w-[240px]">
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50"
                          title="WhatsApp shares"
                        >
                          WA: {m.shares.whatsapp || 0}
                        </span>
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200/50"
                          title="LinkedIn shares"
                        >
                          LI: {m.shares.linkedin || 0}
                        </span>
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200"
                          title="X/Twitter shares"
                        >
                          X: {m.shares.twitter || 0}
                        </span>
                      </div>
                    </td>

                    {/* Total Referral Clicks */}
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {m.totalClicks.toLocaleString()}
                    </td>

                    {/* CTR % with color indicator */}
                    <td className="py-3.5 px-3 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-mono font-bold text-xs ${
                          isHighCtr
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : isModerateCtr
                            ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {m.ctr}%
                      </span>
                    </td>

                    {/* Viral Velocity Indicator */}
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          m.viralVelocity > 80
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : m.viralVelocity > 60
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {m.viralVelocity > 80 && <Flame className="w-3 h-3 text-rose-500" />}
                        <span>{m.viralVelocity}/100</span>
                      </span>
                    </td>

                    {/* Actions Toolbar */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Simulate Quick Share */}
                        <button
                          type="button"
                          onClick={() => handleTestShare(m.articleId, 'whatsapp')}
                          className="px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-800/40"
                          title="Simulate 1 WhatsApp Share"
                        >
                          +Share
                        </button>

                        {/* Simulate Quick Click */}
                        <button
                          type="button"
                          onClick={() => handleTestClick(m.articleId, 'whatsapp')}
                          className="px-2 py-1 text-[11px] font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg transition-colors border border-blue-200 dark:border-blue-800/40"
                          title="Simulate 1 Referral Click"
                        >
                          +Click
                        </button>

                        {/* UTM Link Generator */}
                        <button
                          type="button"
                          onClick={() => {
                            if (article) {
                              setSelectedArticleForUtm(article);
                            }
                          }}
                          className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Build Tracked UTM Campaign Link"
                        >
                          <LinkIcon className="w-3.5 h-3.5" />
                        </button>

                        {/* View in Reader */}
                        {onSelectArticle && (
                          <button
                            type="button"
                            onClick={() => onSelectArticle(m.articleSlug)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Open in Public Reader"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Campaign UTM Link Builder Modal */}
      {selectedArticleForUtm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-emerald-600" />
                  <span>Campaign UTM Link Builder</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Generate trackable URLs with UTM parameters to measure social click-throughs.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedArticleForUtm(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 line-clamp-1">
                {selectedArticleForUtm.title}
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                /{selectedArticleForUtm.slug}
              </div>
            </div>

            {/* Platform Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Select Distribution Channel (utm_source)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(SOCIAL_PLATFORMS) as SocialPlatform[]).map((p) => {
                  const conf = SOCIAL_PLATFORMS[p];
                  const isSelected = utmPlatform === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setUtmPlatform(p)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {getPlatformIcon(p, 'w-3.5 h-3.5')}
                      <span>{conf.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Campaign Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Campaign Name (utm_campaign)
              </label>
              <input
                type="text"
                value={utmCampaign}
                onChange={(e) => setUtmCampaign(e.target.value)}
                placeholder="e.g. weekly_edition, breaking_alert, influencer_blast"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
              />
            </div>

            {/* Generated Link Display */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Tracked Share URL
              </label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={generatedUtmLink}
                  className="w-full text-xs font-mono pl-3.5 pr-20 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 select-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedUtmLink);
                    setCopiedUtmUrl(true);
                    setTimeout(() => setCopiedUtmUrl(false), 2000);
                    showToast('Copied UTM tracked link to clipboard!');
                  }}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1 transition-colors"
                >
                  {copiedUtmUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUtmUrl ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Test Action */}
            <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">
                Medium: <code className="text-slate-600 dark:text-slate-300">social</code>
              </span>
              <button
                type="button"
                onClick={() => {
                  handleTestShare(selectedArticleForUtm.id, utmPlatform);
                  setSelectedArticleForUtm(null);
                }}
                className="px-4 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl hover:bg-emerald-100 transition-colors"
              >
                Simulate Launch Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
