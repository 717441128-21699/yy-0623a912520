import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, XCircle, AlertOctagon } from 'lucide-react';

interface Props {
  status: 'active' | 'completed' | 'expired' | 'abnormal';
}

export const CardStatusBadge: React.FC<Props> = ({ status }) => {
  const map: Record<Props['status'], { label: string; cls: string; Icon: any }> = {
    active: { label: '进行中', cls: 'badge-green', Icon: CheckCircle2 },
    completed: { label: '已完成', cls: 'badge-gray', Icon: CheckCircle2 },
    expired: { label: '已过期', cls: 'badge-orange', Icon: Clock },
    abnormal: { label: '异常', cls: 'badge-red', Icon: AlertOctagon },
  };
  const { label, cls, Icon } = map[status];
  return (
    <span className={cls}>
      <Icon size={12} />
      {label}
    </span>
  );
};

export const ConsistencyBadge: React.FC<{ consistent: boolean; type?: string }> = ({ consistent, type }) => {
  if (consistent) {
    return (
      <span className="badge-green">
        <CheckCircle2 size={12} />
        一致
      </span>
    );
  }
  return (
    <span className="badge-red">
      <XCircle size={12} />
      不一致{type ? `(${type})` : ''}
    </span>
  );
};

export const ProcessingStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: '待处理', cls: 'badge-red' },
    reviewing: { label: '审核中', cls: 'badge-orange' },
    resolved: { label: '已解决', cls: 'badge-green' },
    ignored: { label: '已忽略', cls: 'badge-gray' },
  };
  const conf = map[status] || { label: status, cls: 'badge-gray' };
  return <span className={conf.cls}>{conf.label}</span>;
};

export const ApprovalStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { label: string; cls: string; Icon: any }> = {
    pending_finance: { label: '待财务审核', cls: 'badge-orange', Icon: Clock },
    pending_director: { label: '待院长审批', cls: 'badge-yellow', Icon: AlertTriangle },
    approved: { label: '已通过', cls: 'badge-green', Icon: CheckCircle2 },
    rejected: { label: '已驳回', cls: 'badge-red', Icon: XCircle },
  };
  const conf = map[status] || { label: status, cls: 'badge-gray', Icon: Clock };
  return (
    <span className={conf.cls}>
      <conf.Icon size={12} />
      {conf.label}
    </span>
  );
};
