import React from 'react';
import { ChevronUp, ChevronDown, Minus } from 'lucide-react';
import { formatTrend } from '@/utils/formatters';

interface Props {
  label: string;
  value: string;
  subValue?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  trend?: number;
  trendLabel?: string;
  footer?: React.ReactNode;
  delay?: number;
}

export const StatCard: React.FC<Props> = ({
  label, value, subValue, icon, iconBg = 'bg-primary-50 text-primary-700',
  trend, trendLabel, footer, delay = 0,
}) => {
  const trendConf = trend !== undefined ? formatTrend(trend) : null;
  return (
    <div
      className="card p-5 card-hover stagger-enter"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="stat-label">{label}</div>
          <div className="mt-2 flex items-baseline gap-2 flex-wrap">
            <span className="stat-value">{value}</span>
            {subValue && <span className="text-sm text-zinc-500">{subValue}</span>}
          </div>
          {trendConf && (
            <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${trendConf.color}`}>
              {trendConf.icon === 'up' && <ChevronUp size={14} />}
              {trendConf.icon === 'down' && <ChevronDown size={14} />}
              {trendConf.icon === 'flat' && <Minus size={14} />}
              <span>{trendConf.text}</span>
              {trendLabel && <span className="text-zinc-400">· {trendLabel}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div className={`flex items-center justify-center w-11 h-11 rounded-xl ${iconBg}`}>
            {icon}
          </div>
        )}
      </div>
      {footer && <div className="mt-4 pt-4 border-t border-zinc-100">{footer}</div>}
    </div>
  );
};
