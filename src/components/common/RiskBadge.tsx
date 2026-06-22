import React from 'react';
import type { RiskType, RiskLevel } from '@/shared/types';

const TYPE_LABEL: Record<RiskType, { label: string; desc: string }> = {
  longIdle: { label: '长期未消费', desc: '超过90天未核销' },
  frequentChange: { label: '频繁改卡', desc: '30天内改卡≥3次' },
  manualDeduction: { label: '手工补扣', desc: '存在人工干预记录' },
  negativeBalance: { label: '负余次', desc: '剩余次数异常' },
  expiredRedeemed: { label: '过期核销', desc: '超期仍有核销' },
};

const LEVEL_STYLE: Record<RiskLevel, { label: string; dot: string; cls: string }> = {
  high: { label: '高风险', dot: 'risk-dot-high', cls: 'badge-red' },
  medium: { label: '中风险', dot: 'risk-dot-medium', cls: 'badge-orange' },
  low: { label: '低风险', dot: 'risk-dot-low', cls: 'badge-yellow' },
};

export const RiskTypeBadge: React.FC<{ type: RiskType }> = ({ type }) => {
  const meta = TYPE_LABEL[type];
  return (
    <span className="badge-blue" title={meta.desc}>
      {meta.label}
    </span>
  );
};

export const RiskLevelBadge: React.FC<{ level: RiskLevel }> = ({ level }) => {
  const style = LEVEL_STYLE[level];
  return (
    <span className={style.cls}>
      <span className={style.dot}></span>
      {style.label}
    </span>
  );
};

export const getRiskTypeLabel = (type: RiskType) => TYPE_LABEL[type].label;
