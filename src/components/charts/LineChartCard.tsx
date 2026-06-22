import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from 'recharts';
import { formatCurrencyCompact } from '@/utils/formatters';

interface DataItem {
  month: string;
  saleAmount: number;
  recognizedAmount: number;
  [key: string]: any;
}

interface Props {
  title: string;
  data: DataItem[];
  lines: {
    key: string;
    label: string;
    color: string;
    dash?: string;
  }[];
  height?: number;
  subtitle?: React.ReactNode;
}

export const LineChartCard: React.FC<Props> = ({
  title, data, lines, height = 300, subtitle,
}) => {
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
          <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              {lines.map((l, i) => (
                <linearGradient key={i} id={`color_${l.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={l.color} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={l.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v >= 10000 ? `${(v / 10000).toFixed(0)}万` : `${v}`}
              width={60}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 25px rgba(15, 76, 92, 0.1)',
                fontSize: 12,
              }}
              formatter={(v: number, n: string) => [formatCurrencyCompact(v), n]}
            />
            <Legend
              iconType="line"
              wrapperStyle={{ fontSize: 12, bottom: 0 }}
            />
            {lines.map((l, i) => (
              <Line
                key={i}
                type="monotone"
                dataKey={l.key}
                name={l.label}
                stroke={l.color}
                strokeWidth={2.5}
                strokeDasharray={l.dash}
                dot={{ r: 3, strokeWidth: 2, fill: '#fff' }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
