import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from 'recharts';
import { formatCurrencyCompact, formatNumber } from '@/utils/formatters';

interface DataItem {
  label?: string;
  month?: string;
  saleAmount?: number;
  recognizedAmount?: number;
  [key: string]: any;
}

interface LineSpec {
  key: string;
  label: string;
  color: string;
  dash?: string;
}

interface Props {
  title: string;
  data: DataItem[];
  /** 单线条模式：直接给dataKey */
  dataKey?: string;
  lineColor?: string;
  lines?: LineSpec[];
  unit?: 'currency' | 'number';
  height?: number;
  subtitle?: React.ReactNode;
  plain?: boolean;
}

export const LineChartCard: React.FC<Props> = ({
  title, data, lines, height = 300, subtitle, dataKey, lineColor, unit = 'currency', plain,
}) => {
  const singleMode = !!dataKey;
  const normalizedLines: LineSpec[] = singleMode
    ? [{ key: dataKey!, label: '', color: lineColor || '#0F4C5C' }]
    : (lines || []);

  const xKey = data[0]?.label !== undefined ? 'label' : 'month';
  const fmt = unit === 'currency' ? formatCurrencyCompact : (v: any) => formatNumber(v);

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
          <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              {normalizedLines.map((l, i) => (
                <linearGradient key={i} id={`line_color_${l.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={l.color} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={l.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => {
                if (unit === 'currency') return v >= 10000 ? `${(v / 10000).toFixed(0)}万` : `${v}`;
                return formatNumber(v);
              }}
              width={60}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 25px rgba(15, 76, 92, 0.1)',
                fontSize: 12,
              }}
              formatter={(v: number, n: string) => [fmt(v), n || '数值']}
            />
            {!singleMode && (
              <Legend iconType="line" wrapperStyle={{ fontSize: 12, bottom: 0 }} />
            )}
            {normalizedLines.map((l, i) => (
              <Line
                key={i}
                type="monotone"
                dataKey={l.key}
                name={l.label}
                stroke={l.color}
                strokeWidth={2.5}
                strokeDasharray={l.dash}
                fill={`url(#line_color_${l.key})`}
                dot={{ r: 3, strokeWidth: 2, fill: '#fff' }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Wrapper>
  );
};
