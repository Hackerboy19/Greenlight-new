import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import type { TrafficPoint } from '../../../types';
import { Card, SectionHeading } from '../ui';

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
    <Card as="section">
      <SectionHeading
        level="h3"
        className="mb-4"
        title="Traffic over 30 days"
        subtitle={loading ? 'Loading…' : `${full.format(totalViews)} page views`}
        action={
          source === 'mock' && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-amber-500/30 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300">
              Sample data
            </span>
          )
        }
      />

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
    </Card>
  );
};
