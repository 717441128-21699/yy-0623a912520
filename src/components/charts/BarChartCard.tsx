import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { formatCurrency, formatNumber } from '@/utils/formatters';

interface DataItem {
  label: string;
  value: number;
  subLabel?: string;
}

interface Props {
  title: string;
  data: DataItem[];
  unit?: 'currency' | 'number';
  height?: number;
  color?: string;
  subtitle?: React.ReactNode;
}

export const BarChartCard: React.FC<Props> = ({
  title, data, unit = 'currency', height = 280, color = '#0F4C5C', subtitle,
}) => {
  const colors = ['#0F4C5C', '#236871', '#31828b', '#509ea7', '#84bfc6'];
  const formatter = unit === 'currency' ? formatCurrency : formatNumber;
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="section-title">{title}</div>
          {subtitle && <div className="text-xs text-zinc-500 mt-1">{subtitle}</div>}
        </div>
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
              interval={0}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => unit === 'currency' && v >= 10000 ? `${(v / 10000).toFixed(0)}万` : formatNumber(v)}
              width={60}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 25px rgba(15, 76, 92, 0.1)',
                fontSize: 12,
              }}
              formatter={(v: number) => [formatter(v), '金额']}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48} fill={color}>
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
