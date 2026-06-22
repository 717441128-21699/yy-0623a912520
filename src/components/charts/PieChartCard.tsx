import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrencyCompact, formatPercent } from '@/utils/formatters';

export interface PieDataItem {
  /** 兼容 categoryName / name 两种字段 */
  categoryName?: string;
  name?: string;
  value: number;
  color: string;
  percent?: number;
}

interface Props {
  title: string;
  data: PieDataItem[];
  height?: number;
  subtitle?: React.ReactNode;
  plain?: boolean;
}

export const PieChartCard: React.FC<Props> = ({ title, data, height = 280, subtitle, plain }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  const normalized = data.map(d => ({
    ...d,
    _label: d.categoryName || d.name || '未知',
  }));

  const Wrapper: any = plain ? React.Fragment : 'div';
  const wrapperProps = plain ? {} : { className: 'card p-5' };

  return (
    <Wrapper {...wrapperProps}>
      <div className="flex items-start justify-between mb-4">
        <div>
          {title && <div className="section-title">{title}</div>}
          {subtitle && <div className="text-xs text-zinc-500 mt-1">{subtitle}</div>}
          {!plain && (
            <div className="mt-2">
              <span className="stat-value text-lg">{formatCurrencyCompact(total)}</span>
              <span className="stat-label ml-2">合计</span>
            </div>
          )}
        </div>
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={normalized}
              cx="50%"
              cy={plain ? '50%' : '45%'}
              innerRadius={52}
              outerRadius={plain ? Math.max(80, height * 0.42) : 88}
              paddingAngle={2}
              dataKey="value"
              nameKey="_label"
              stroke="#fff"
              strokeWidth={2}
            >
              {normalized.map((d, i) => (
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
              formatter={(v: number) => [
                `${formatCurrencyCompact(v)} · ${total > 0 ? formatPercent(v / total) : '0%'}`,
                '金额',
              ]}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, bottom: 0 }}
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
    </Wrapper>
  );
};
