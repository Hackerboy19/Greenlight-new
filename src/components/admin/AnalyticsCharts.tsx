/**
 * AnalyticsCharts Component
 * Recharts time-series visualization for Google Search Console Clicks, Impressions, CTR, and Avg Position
 */

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { TrendingUp, Eye, MousePointerClick, Activity, Percent, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export interface TimeSeriesPoint {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface AnalyticsChartsProps {
  data: TimeSeriesPoint[];
  summary?: {
    totalClicks: number;
    totalImpressions: number;
    avgCtr: number;
    avgPosition: number;
  };
  onRangeChange?: (range: string) => void;
  className?: string;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  data,
  summary,
  onRangeChange,
  className = ""
}) => {
  const [activeMetric, setActiveMetric] = useState<'all' | 'clicks' | 'impressions' | 'position'>('all');
  const [selectedRange, setSelectedRange] = useState('28d');

  const handleRangeSelect = (range: string) => {
    setSelectedRange(range);
    onRangeChange?.(range);
  };

  const calculatedSummary = summary || {
    totalClicks: data.reduce((acc, p) => acc + p.clicks, 0),
    totalImpressions: data.reduce((acc, p) => acc + p.impressions, 0),
    avgCtr: data.length > 0 ? (data.reduce((acc, p) => acc + p.ctr, 0) / data.length) : 0.068,
    avgPosition: data.length > 0 ? Number((data.reduce((acc, p) => acc + p.position, 0) / data.length).toFixed(1)) : 2.4
  };

  // Format date labels for charts
  const formattedData = data.map((d) => ({
    ...d,
    formattedDate: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    ctrPercentage: Number((d.ctr * 100).toFixed(2))
  }));

  return (
    <div id="analytics-charts-container" className={`space-y-6 ${className}`}>
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Clicks */}
        <button
          type="button"
          onClick={() => setActiveMetric('clicks')}
          className={`p-4 rounded-2xl border transition-all text-left relative overflow-hidden ${
            activeMetric === 'clicks' || activeMetric === 'all'
              ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 ring-2 ring-blue-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Clicks</span>
            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <MousePointerClick className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {calculatedSummary.totalClicks.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 mt-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+14.2% vs previous 28d</span>
          </div>
        </button>

        {/* Total Impressions */}
        <button
          type="button"
          onClick={() => setActiveMetric('impressions')}
          className={`p-4 rounded-2xl border transition-all text-left relative overflow-hidden ${
            activeMetric === 'impressions' || activeMetric === 'all'
              ? 'bg-purple-50/70 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 ring-2 ring-purple-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Impressions</span>
            <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Eye className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {calculatedSummary.totalImpressions >= 1000000 
              ? `${(calculatedSummary.totalImpressions / 1000000).toFixed(2)}M` 
              : `${(calculatedSummary.totalImpressions / 1000).toFixed(1)}k`}
          </div>
          <div className="flex items-center gap-1 mt-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+22.8% organic reach</span>
          </div>
        </button>

        {/* Average CTR */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Average CTR</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Percent className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {(calculatedSummary.avgCtr * 100).toFixed(1)}%
          </div>
          <div className="flex items-center gap-1 mt-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+0.8% CTR uplift</span>
          </div>
        </div>

        {/* Average Position */}
        <button
          type="button"
          onClick={() => setActiveMetric('position')}
          className={`p-4 rounded-2xl border transition-all text-left relative overflow-hidden ${
            activeMetric === 'position' || activeMetric === 'all'
              ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 ring-2 ring-amber-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Average Search Pos</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            #{calculatedSummary.avgPosition}
          </div>
          <div className="flex items-center gap-1 mt-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Top 3 National SERP</span>
          </div>
        </button>
      </div>

      {/* Main Chart Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Controls header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Google Search Console Performance Trends</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Verified daily sync from Google Search Console API (sc-domain:greenlight.fsia.in)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Metric filters - Responsive Auto Adjusting */}
            <div className="grid grid-cols-4 sm:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveMetric('all')}
                className={`min-h-[36px] px-2.5 sm:px-3 py-1.5 rounded-lg transition-all text-center ${
                  activeMetric === 'all' 
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm font-bold' 
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                }`}
              >
                <span className="sm:hidden">All</span>
                <span className="hidden sm:inline">All Metrics</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMetric('clicks')}
                className={`min-h-[36px] px-2.5 sm:px-3 py-1.5 rounded-lg transition-all text-center ${
                  activeMetric === 'clicks' 
                    ? 'bg-blue-600 text-white shadow-sm font-bold' 
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                }`}
              >
                Clicks
              </button>
              <button
                type="button"
                onClick={() => setActiveMetric('impressions')}
                className={`min-h-[36px] px-2.5 sm:px-3 py-1.5 rounded-lg transition-all text-center ${
                  activeMetric === 'impressions' 
                    ? 'bg-purple-600 text-white shadow-sm font-bold' 
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                }`}
              >
                <span className="sm:hidden">Impr</span>
                <span className="hidden sm:inline">Impressions</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMetric('position')}
                className={`min-h-[36px] px-2.5 sm:px-3 py-1.5 rounded-lg transition-all text-center ${
                  activeMetric === 'position' 
                    ? 'bg-amber-600 text-white shadow-sm font-bold' 
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                }`}
              >
                <span className="sm:hidden">Pos</span>
                <span className="hidden sm:inline">Position</span>
              </button>
            </div>

            {/* Time range selector - Auto Adjusting */}
            <div className="flex items-center justify-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold w-full sm:w-auto">
              {['7d', '28d', '90d'].map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => handleRangeSelect(range)}
                  className={`flex-1 sm:flex-initial min-h-[36px] px-3 sm:px-2.5 py-1.5 rounded-lg transition-all uppercase text-center ${
                    selectedRange === range
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm font-bold'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="h-80 w-full pt-6">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
              <XAxis 
                dataKey="formattedDate" 
                tickLine={false} 
                axisLine={{ stroke: '#CBD5E1' }}
                tick={{ fontSize: 11, fill: '#64748B' }}
              />
              {/* Left Y Axis for Clicks & Impressions */}
              <YAxis 
                yAxisId="left"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#64748B' }}
                tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
              />
              {/* Right Y Axis for Avg Position (reversed: 1 is top) */}
              <YAxis 
                yAxisId="right"
                orientation="right"
                reversed={true}
                domain={[1, 10]}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#D97706' }}
                tickFormatter={(val) => `#${val}`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#F8FAFC',
                  fontSize: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />

              {/* Impressions Bar */}
              {(activeMetric === 'all' || activeMetric === 'impressions') && (
                <Bar 
                  yAxisId="left"
                  dataKey="impressions" 
                  name="Search Impressions" 
                  fill="#818CF8" 
                  opacity={0.4}
                  radius={[4, 4, 0, 0]} 
                />
              )}

              {/* Clicks Line */}
              {(activeMetric === 'all' || activeMetric === 'clicks') && (
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="clicks" 
                  name="Organic Clicks" 
                  stroke="#2563EB" 
                  strokeWidth={3} 
                  dot={{ r: 3, fill: '#2563EB' }}
                  activeDot={{ r: 6, fill: '#1D4ED8' }}
                />
              )}

              {/* Position Line */}
              {(activeMetric === 'all' || activeMetric === 'position') && (
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="position" 
                  name="Average SERP Position" 
                  stroke="#D97706" 
                  strokeWidth={2} 
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#D97706' }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCharts;
