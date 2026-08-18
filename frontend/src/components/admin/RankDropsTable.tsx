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
      return sortAsc ? (valA - valB) : (valB - valA);
    });

  const handleSort = (field: 'pos_change' | 'clicks_diff' | 'current_impressions') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const getStatusBadge = (row: RankDropRow) => {
    switch (row.status) {
      case 'critical_drop':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
            <AlertTriangle className="w-3 h-3" />
            Rank Drop (-{Math.abs(row.pos_change).toFixed(1)})
          </span>
        );
      case 'slight_drop':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
            <TrendingDown className="w-3 h-3" />
            Mild Slip (-{Math.abs(row.pos_change).toFixed(1)})
          </span>
        );
      case 'surging':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
            <Flame className="w-3 h-3 text-emerald-500" />
            Surging (+{row.pos_change.toFixed(1)})
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            <Minus className="w-3 h-3" />
            Stable
          </span>
        );
    }
  };

  return (
    <div id="rank-drops-table-widget" className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm ${className}`}>
      {/* Header & Metric Highlights */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-rose-500" />
            <span>7-Day Rank Drops & Lost Traffic Detector</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Compares average search position over the past 7 days vs the preceding 7 days
          </p>
        </div>

        {summary && (
          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs">
              <span className="text-rose-600 dark:text-rose-400 font-semibold">{summary.criticalDropsCount} Critical Drops</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs">
              <span className="text-amber-700 dark:text-amber-400 font-semibold font-mono">-{summary.totalEstimatedLostClicks.toLocaleString()} Clicks Impact</span>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 my-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter by query or landing page..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilterSeverity('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filterSeverity === 'all'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            All Queries ({data.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterSeverity('high')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filterSeverity === 'high'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100'
            }`}
          >
            Critical Drops Only
          </button>
          <button
            type="button"
            onClick={() => setFilterSeverity('positive')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filterSeverity === 'positive'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 hover:bg-emerald-100'
            }`}
          >
            Surging
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3 px-4">Search Query & Page</th>
              <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('pos_change')}>
                <div className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100">
                  <span>Position (7d vs Prev)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('clicks_diff')}>
                <div className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100">
                  <span>Clicks Impact</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('current_impressions')}>
                <div className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100">
                  <span>7d Impressions</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 text-right">Status Alert</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                  No rank change records matching your filter criteria.
                </td>
              </tr>
            ) : (
              filtered.map((row, idx) => (
                <tr 
                  key={idx} 
                  className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                    row.severity === 'high' ? 'bg-rose-50/20 dark:bg-rose-950/10' : ''
                  }`}
                >
                  <td className="py-3.5 px-4 max-w-sm">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {row.query}
                    </div>
                    <a
                      href={row.page}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-slate-400 hover:text-emerald-600 truncate block mt-0.5"
                    >
                      {row.page.replace('https://greenlight.fsia.in', '')}
                    </a>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        #{row.current_avg_pos}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        (was #{row.previous_avg_pos})
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1 font-mono">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {row.current_clicks}
                      </span>
                      <span className={`text-[11px] font-bold ${
                        row.clicks_diff < 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        ({row.clicks_diff > 0 ? `+${row.clicks_diff}` : row.clicks_diff})
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                    {row.current_impressions.toLocaleString()}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    {getStatusBadge(row)}
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
