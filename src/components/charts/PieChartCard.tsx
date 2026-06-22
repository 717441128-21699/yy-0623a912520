import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrencyCompact, formatPercent } from '@/utils/formatters';

interface DataItem {
  categoryName: string;
  value: number;
  color: string;
}

interface Props {
  title: string;
  data: DataItem[];
  height?: number;
  subtitle?: React.ReactNode;
}

export const PieChartCard: React.FC<Props> = ({ title, data, height = 280, subtitle }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="section-title">{title}</div>
          {subtitle && <div className="text-xs text-zinc-500 mt-1">{subtitle}</div>}
          <div className="mt-2">
            <span className="stat-value text-lg">{formatCurrencyCompact(total)}</span>
            <span className="stat-label ml-2">合计</span>
          </div>
        </div>
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={58}
              outerRadius={88}
              paddingAngle={2}
              dataKey="value"
              nameKey="categoryName"
              stroke="#fff"
              strokeWidth={2}
            >
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 25px rgba(15, 76, 92, 0.1)',
                fontSize: 12,
              }}
              formatter={(v: number, n: string) => [
                `${formatCurrencyCompact(v)} · ${total > 0 ? formatPercent(v / total) : '0%'}`,
                n,
              ]}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, bottom: 0 }}
              formatter={(value, entry: any) => (
                <span className="text-zinc-600">
                  {value}
                  <span className="text-zinc-400 ml-1">
                    {total > 0 ? formatPercent(entry.value / total) : ''}
                  </span>
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
