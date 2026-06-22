import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, Legend } from 'recharts';
import { formatCurrency, formatNumber } from '@/utils/formatters';

interface DataItem {
  label: string;
  value: number;
  subLabel?: string;
  [key: string]: any;
}

export interface LegendItem { color: string; label: string; }

interface Props {
  title: string;
  data: DataItem[];
  unit?: 'currency' | 'number';
  height?: number;
  color?: string;
  subtitle?: React.ReactNode;
  showLegend?: boolean;
  legendItems?: LegendItem[];
  extraData?: Record<string, any>[];
  /** 是否去除外层 card 容器，供已有 card 的页面使用 */
  plain?: boolean;
}

export const BarChartCard: React.FC<Props> = ({
  title, data, unit = 'currency', height = 280, color = '#0F4C5C', subtitle,
  showLegend, legendItems, extraData, plain,
}) => {
  const colors = ['#0F4C5C', '#236871', '#31828b', '#509ea7', '#84bfc6'];
  const formatter = unit === 'currency' ? formatCurrency : formatNumber;

  const mergedData = extraData && extraData.length === data.length
    ? data.map((d, i) => ({ ...d, ...extraData[i] }))
    : data;

  const showSecondBar = !!extraData && extraData.some(e => typeof e?.unserved === 'number');

  const Wrapper: any = plain ? React.Fragment : 'div';
  const wrapperProps = plain ? {} : { className: 'card p-5' };

  return (
    <Wrapper {...wrapperProps}>
      {(title || subtitle) && (
        <div className="flex items-start justify-between mb-4">
          <div>
            {title && <div className="section-title">{title}</div>}
            {subtitle && <div className="text-xs text-zinc-500 mt-1">{subtitle}</div>}
          </div>
        </div>
      )}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mergedData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
              interval={0}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => unit === 'currency' && v >= 10000 ? `${(v / 10000).toFixed(0)}万` : formatNumber(v)}
              width={60}
            />
            {showSecondBar && (
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                width={50}
              />
            )}
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 25px rgba(15, 76, 92, 0.1)',
                fontSize: 12,
              }}
              formatter={(v: number, n: string) => {
                if (n === 'value' || n === '售卡金额') return [formatter(v), '售卡金额'];
                if (n === 'unserved' || n === '未服务次数') return [`${formatNumber(v)} 次`, '未服务次数'];
                return [formatter(v), n];
              }}
            />
            {(showLegend || showSecondBar) && (
              <Legend
                iconType="rect"
                wrapperStyle={{ fontSize: 12, bottom: -4 }}
                payload={legendItems && legendItems.length > 0
                  ? legendItems.map(l => ({ value: l.label, type: 'rect', color: l.color }))
                  : undefined}
              />
            )}
            <Bar
              yAxisId="left"
              dataKey="value"
              name="售卡金额"
              radius={[6, 6, 0, 0]}
              maxBarSize={48}
              fill={color}
            >
              {!showSecondBar && data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Bar>
            {showSecondBar && (
              <Bar
                yAxisId="right"
                dataKey="unserved"
                name="未服务次数"
                radius={[6, 6, 0, 0]}
                maxBarSize={28}
                fill="#E36414"
                opacity={0.85}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Wrapper>
  );
};
