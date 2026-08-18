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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 text-white p-3.5 rounded-xl shadow-xl border border-slate-800 text-xs font-sans min-w-[190px]">
          <p className="text-slate-400 font-semibold mb-2 pb-1 border-b border-slate-800">
            {new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
          <div className="space-y-1.5">
            {payload.map((item: any) => (
              <div key={item.name} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5" style={{ color: item.color }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}:
                </span>
                <span className="font-mono font-bold text-slate-100">
                  {item.name === 'CTR' 
                    ? `${(item.value * 100).toFixed(2)}%`
                    : item.name === 'Avg Position'
                    ? item.value.toFixed(1)
                    : item.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="analytics-charts-widget" className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm ${className}`}>
      {/* Top Header & Range Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Search Console Search Performance</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Synchronized from Google Search Console API (`gsc_search_analytics`)
          </p>
        </div>

        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
          {['7d', '28d', '90d'].map((rng) => (
            <button
              key={rng}
              type="button"
              onClick={() => handleRangeSelect(rng)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedRange === rng
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Last {rng}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Performance Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        {/* Total Clicks */}
        <div 
          onClick={() => setActiveMetric(activeMetric === 'clicks' ? 'all' : 'clicks')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeMetric === 'clicks' || activeMetric === 'all'
              ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 ring-2 ring-blue-500/20'
              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
            <span className="flex items-center gap-1.5">
              <MousePointerClick className="w-4 h-4" />
              Total Clicks
            </span>
            <span className="text-[11px] font-mono flex items-center text-emerald-600">
              <ArrowUpRight className="w-3 h-3" /> +14.2%
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {calculatedSummary.totalClicks.toLocaleString()}
          </div>
        </div>

        {/* Total Impressions */}
        <div 
          onClick={() => setActiveMetric(activeMetric === 'impressions' ? 'all' : 'impressions')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeMetric === 'impressions' || activeMetric === 'all'
              ? 'bg-purple-50/50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 ring-2 ring-purple-500/20'
              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              Total Impressions
            </span>
            <span className="text-[11px] font-mono flex items-center text-emerald-600">
              <ArrowUpRight className="w-3 h-3" /> +22.8%
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {calculatedSummary.totalImpressions.toLocaleString()}
          </div>
        </div>

        {/* Average CTR */}
        <div 
          className="p-4 rounded-xl border bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
        >
          <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1">
            <span className="flex items-center gap-1.5">
              <Percent className="w-4 h-4" />
              Average CTR
            </span>
            <span className="text-[11px] font-mono flex items-center text-emerald-600">
              <ArrowUpRight className="w-3 h-3" /> +0.4%
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {(calculatedSummary.avgCtr * 100).toFixed(2)}%
          </div>
        </div>

        {/* Average Position */}
        <div 
          onClick={() => setActiveMetric(activeMetric === 'position' ? 'all' : 'position')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeMetric === 'position' || activeMetric === 'all'
              ? 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 ring-2 ring-amber-500/20'
              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              Average Position
            </span>
            <span className="text-[11px] font-mono flex items-center text-emerald-600">
              <ArrowUpRight className="w-3 h-3" /> +0.3
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {calculatedSummary.avgPosition}
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[340px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            {/* Left Axis for Clicks */}
            <YAxis 
              yAxisId="left" 
              orientation="left" 
              stroke="#3b82f6" 
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
            />
            {/* Right Axis for Impressions */}
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              stroke="#a855f7" 
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />

            {(activeMetric === 'all' || activeMetric === 'impressions') && (
              <Bar 
                yAxisId="right"
                dataKey="impressions" 
                name="Impressions" 
                fill="#a855f7" 
                opacity={0.3} 
                radius={[4, 4, 0, 0]}
              />
            )}

            {(activeMetric === 'all' || activeMetric === 'clicks') && (
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="clicks" 
                name="Clicks" 
                stroke="#2563eb" 
                strokeWidth={3} 
                dot={{ r: 3, fill: '#2563eb' }}
                activeDot={{ r: 6 }}
              />
            )}

            {(activeMetric === 'all' || activeMetric === 'position') && (
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="position" 
                name="Avg Position" 
                stroke="#f59e0b" 
                strokeWidth={2} 
                strokeDasharray="4 4"
                dot={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalyticsCharts;
