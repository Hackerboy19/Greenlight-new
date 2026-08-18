/**
 * RankDropsTable Component
 * Search Console automated 7-day comparison table highlighting ranking fluctuations and lost clicks
 */

import React, { useState } from 'react';
import { 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  Minus, 
  Search, 
  ExternalLink, 
  Filter, 
  ArrowUpDown,
  Download,
  Flame,
  CheckCircle2
} from 'lucide-react';

export interface RankDropRow {
  query: string;
  page: string;
  current_avg_pos: number;
  previous_avg_pos: number;
  pos_change: number; // positive = improvement, negative = drop
  current_clicks: number;
  previous_clicks: number;
  clicks_diff: number;
  current_impressions: number;
  previous_impressions: number;
  status: 'critical_drop' | 'slight_drop' | 'stable' | 'surging';
  severity: 'high' | 'low' | 'normal' | 'positive';
}

export interface RankDropsTableProps {
  data: RankDropRow[];
  summary?: {
    totalQueriesMonitored: number;
    criticalDropsCount: number;
    totalEstimatedLostClicks: number;
  };
  className?: string;
}

export const RankDropsTable: React.FC<RankDropsTableProps> = ({
  data,
  summary,
  className = ""
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'high' | 'positive'>('all');
  const [sortField, setSortField] = useState<'pos_change' | 'clicks_diff' | 'current_impressions'>('pos_change');
  const [sortAsc, setSortAsc] = useState<boolean>(true); // true = worst drop first

  // Filter & Sort
  const filtered = data
    .filter(row => {
      const matchQuery = row.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.page.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchQuery) return false;

      if (filterSeverity === 'high') return row.severity === 'high';
      if (filterSeverity === 'positive') return row.severity === 'positive';
      return true;
    })
    .sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      return sortAsc ? valA - valB : valB - valA;
    });

  const calculatedSummary = summary || {
    totalQueriesMonitored: data.length,
    criticalDropsCount: data.filter(r => r.severity === 'high').length,
    totalEstimatedLostClicks: Math.abs(data.filter(r => r.clicks_diff < 0).reduce((sum, r) => sum + r.clicks_diff, 0))
  };

  const handleExportCSV = () => {
    const headers = ['Query', 'Landing Page', 'Current Pos', 'Prev Pos', 'Pos Diff', 'Current Clicks', 'Lost Clicks', 'Status'];
    const rows = filtered.map(r => [
      `"${r.query}"`,
      `"${r.page}"`,
      r.current_avg_pos,
      r.previous_avg_pos,
      r.pos_change,
      r.current_clicks,
      r.clicks_diff,
      r.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `greenlight-rank-drops-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="rank-drops-table-container" className={`p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 ${className}`}>
      {/* Overview stats alert bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/80 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-rose-700 dark:text-rose-300">
              {calculatedSummary.criticalDropsCount} Queries
            </div>
            <p className="text-xs text-rose-600/80 dark:text-rose-400">Position Drop &gt; 2.5 Rank</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-amber-700 dark:text-amber-300">
              -{calculatedSummary.totalEstimatedLostClicks.toLocaleString()} Clicks
            </div>
            <p className="text-xs text-amber-600/80 dark:text-amber-400">Estimated Weekly Organic Impact</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-emerald-700 dark:text-emerald-300">
              {calculatedSummary.totalQueriesMonitored} Queries
            </div>
            <p className="text-xs text-emerald-600/80 dark:text-emerald-400">Automated 7-Day Window Tracked</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search keywords, queries, or URL paths..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFilterSeverity('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterSeverity === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterSeverity('high')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                filterSeverity === 'high' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-500'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Critical Drops</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterSeverity('positive')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                filterSeverity === 'positive' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500'
              }`}
            >
              <Flame className="w-3 h-3" />
              <span>Surging</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Data */}
      <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3 px-4">Search Query</th>
              <th className="py-3 px-4">Target Landing URL</th>
              <th 
                className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100"
                onClick={() => {
                  setSortField('pos_change');
                  setSortAsc(!sortAsc);
                }}
              >
                <div className="flex items-center gap-1">
                  <span>SERP Position (7d)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100"
                onClick={() => {
                  setSortField('clicks_diff');
                  setSortAsc(!sortAsc);
                }}
              >
                <div className="flex items-center gap-1">
                  <span>Lost / Gained Clicks</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4">Impact Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  No rank drop anomalies detected matching filters.
                </td>
              </tr>
            ) : (
              filtered.map((row, idx) => (
                <tr 
                  key={idx}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100 max-w-xs truncate">
                    {row.query}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px] max-w-xs truncate">
                    <span className="hover:text-emerald-600 cursor-pointer">
                      {row.page}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        #{row.current_avg_pos}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        (was #{row.previous_avg_pos})
                      </span>
                      {row.pos_change < 0 ? (
                        <span className="flex items-center text-rose-600 font-bold text-[11px] bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded">
                          ▼ {Math.abs(row.pos_change).toFixed(1)}
                        </span>
                      ) : row.pos_change > 0 ? (
                        <span className="flex items-center text-emerald-600 font-bold text-[11px] bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                          ▲ {row.pos_change.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold">
                      {row.clicks_diff < 0 ? (
                        <span className="text-rose-600">{row.clicks_diff.toLocaleString()} clicks</span>
                      ) : row.clicks_diff > 0 ? (
                        <span className="text-emerald-600">+{row.clicks_diff.toLocaleString()} clicks</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {row.severity === 'high' && (
                      <span className="px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold text-[10px] uppercase tracking-wider inline-flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Critical Drop
                      </span>
                    )}
                    {row.severity === 'low' && (
                      <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold text-[10px] uppercase tracking-wider">
                        Slight Drop
                      </span>
                    )}
                    {row.severity === 'positive' && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] uppercase tracking-wider inline-flex items-center gap-1">
                        <Flame className="w-3 h-3" />
                        Surging
                      </span>
                    )}
                    {row.severity === 'normal' && (
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                        Stable
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RankDropsTable;
