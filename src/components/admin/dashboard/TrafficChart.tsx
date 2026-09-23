import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import type { TrafficPoint } from '../../../types';

export interface TrafficChartProps {
  data: TrafficPoint[];
  isDark: boolean;
  /** 'mock' shows a note that the numbers are sample data. */
  source?: 'mock' | 'live';
  loading?: boolean;
}

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const full = new Intl.NumberFormat('en');

function shortDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

/** "Traffic over 30 days" line chart: page views and unique visitors per day. */
export const TrafficChart: React.FC<TrafficChartProps> = ({ data, isDark, source = 'live', loading }) => {
  const axis = isDark ? '#64748b' : '#94a3b8';
  const grid = isDark ? '#1e293b' : '#e2e8f0';
  const totalViews = data.reduce((sum, d) => sum + d.views, 0);

  return (
    <section className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Traffic over 30 days</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {loading ? 'Loading…' : `${full.format(totalViews)} page views`}
          </p>
        </div>
        {source === 'mock' && (
          <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
            Sample data
          </span>
        )}
      </div>

      <div className="h-72">
        {loading ? (
          <div className="h-full rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={shortDate}
                stroke={axis}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                minTickGap={24}
              />
              <YAxis
                tickFormatter={(v: number) => compact.format(v)}
                stroke={axis}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={48}
              />
              <Tooltip
                labelFormatter={(label) => shortDate(String(label))}
                formatter={(value, name) => [full.format(Number(value)), name]}
                contentStyle={{
                  borderRadius: 12,
                  border: `1px solid ${grid}`,
                  background: isDark ? '#0f172a' : '#ffffff',
                  color: isDark ? '#e2e8f0' : '#0f172a',
                  fontSize: 12
                }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="views" name="Page views" stroke="#10b981" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="visitors" name="Visitors" stroke="#0ea5e9" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
};
