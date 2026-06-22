import React, { useMemo, useState } from 'react';
import {
  ShieldAlert, AlertOctagon, Clock, Edit3, Hash, AlertTriangle,
  ArrowRight, MessageSquare, History, UserCog, Check, X, MoreHorizontal,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { StatCard } from '@/components/common/StatCard';
import { RiskTypeBadge, RiskLevelBadge, getRiskTypeLabel } from '@/components/common/RiskBadge';
import { ProcessingStatusBadge } from '@/components/common/StatusBadge';
import { Modal } from '@/components/common/Modal';
import {
  formatCurrency, formatCurrencyCompact, formatDate, formatDateTime, formatNumber,
} from '@/utils/formatters';
import type { RiskCard, RiskType, RiskProcessingStatus } from '@/shared/types';

const TABS: { key: RiskType | 'all'; label: string; Icon: any }[] = [
  { key: 'all', label: '全部', Icon: ShieldAlert },
  { key: 'longIdle', label: '长期未消费', Icon: Clock },
  { key: 'frequentChange', label: '频繁改卡', Icon: Edit3 },
  { key: 'manualDeduction', label: '手工补扣', Icon: Hash },
  { key: 'negativeBalance', label: '负余次', Icon: AlertOctagon },
  { key: 'expiredRedeemed', label: '过期核销', Icon: AlertTriangle },
];

export const RiskCards: React.FC = () => {
  const {
    riskCards, selectedRiskCard, modalRiskOpen, openRiskDetail, closeRiskDetail,
    updateRiskStatus,
  } = useAppStore();
  const [activeTab, setActiveTab] = useState<RiskType | 'all'>('all');
  const [remark, setRemark] = useState('');

  const filteredRisks = useMemo(() => {
    return activeTab === 'all' ? riskCards : riskCards.filter(r => r.riskType === activeTab);
  }, [riskCards, activeTab]);

  const summary = useMemo(() => {
    const byLevel = { high: 0, medium: 0, low: 0 };
    riskCards.forEach(r => { byLevel[r.riskLevel]++; });
    const pending = riskCards.filter(r => r.processingStatus === 'pending').length;
    const totalAmount = riskCards.reduce((s, r) => s + r.involvedAmount, 0);
    return { ...byLevel, pending, totalAmount, total: riskCards.length };
  }, [riskCards]);

  const selectedCard = selectedRiskCard;

  const handleUpdate = (status: RiskProcessingStatus) => {
    if (!selectedCard) return;
    updateRiskStatus(selectedCard.id, status, remark);
    setRemark('');
    closeRiskDetail();
  };

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-5">
        <StatCard
          label="风险卡总数"
          value={formatNumber(summary.total)}
          subValue="系统自动识别"
          icon={<ShieldAlert size={20} />}
          iconBg="bg-primary-50 text-primary-700"
          delay={0}
        />
        <StatCard
          label="高风险"
          value={formatNumber(summary.high)}
          subValue="需立即处理"
          icon={<AlertOctagon size={20} />}
          iconBg="bg-red-50 text-red-600"
          delay={50}
        />
        <StatCard
          label="中风险"
          value={formatNumber(summary.medium)}
          subValue="建议关注"
          icon={<AlertTriangle size={20} />}
          iconBg="bg-accent-50 text-accent-600"
          delay={100}
        />
        <StatCard
          label="待处理数"
          value={formatNumber(summary.pending)}
          subValue="未分配处理人"
          icon={<Clock size={20} />}
          iconBg="bg-yellow-50 text-yellow-700"
          delay={150}
        />
        <StatCard
          label="涉及金额"
          value={formatCurrencyCompact(summary.totalAmount)}
          subValue="待履约部分"
          icon={<MoreHorizontal size={20} />}
          iconBg="bg-indigo-50 text-indigo-600"
          delay={200}
        />
      </div>

      <div className="card mb-5">
        <div className="flex items-center gap-1 p-2 overflow-x-auto scrollbar-thin">
          {TABS.map(({ key, label, Icon }) => {
            const isActive = activeTab === key;
            const count = key === 'all'
              ? riskCards.length
              : riskCards.filter(r => r.riskType === key).length;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                  ${isActive
                    ? 'bg-primary-800 text-white shadow-sm'
                    : 'text-zinc-600 hover:bg-zinc-100'}`}
              >
                <Icon size={15} />
                {label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold
                  ${isActive ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-600'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 flex-wrap gap-3">
          <div>
            <div className="section-title flex items-center gap-2">
              <ShieldAlert size={16} className="text-primary-600" />
              风险卡清单
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              共 <span className="font-semibold text-zinc-800">{formatNumber(filteredRisks.length)}</span> 条风险记录
              ，点击行查看详情并处理
            </div>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[1400px]">
            <thead className="table-head">
              <tr>
                <th className="table-cell">卡号 / 顾客</th>
                <th className="table-cell">风险类型</th>
                <th className="table-cell w-28">风险等级</th>
                <th className="table-cell text-right">涉及金额</th>
                <th className="table-cell text-right">涉及次数</th>
                <th className="table-cell">首次发现</th>
                <th className="table-cell">最近更新</th>
                <th className="table-cell">处理人</th>
                <th className="table-cell w-32 text-center">处理状态</th>
                <th className="table-cell w-32 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredRisks.slice(0, 80).map((r) => (
                <tr
                  key={r.id}
                  onClick={() => openRiskDetail(r)}
                  className="table-row cursor-pointer group"
                >
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                        ${r.riskLevel === 'high' ? 'bg-red-50 text-red-500' :
                          r.riskLevel === 'medium' ? 'bg-accent-50 text-accent-500' : 'bg-yellow-50 text-yellow-600'}`}>
                        {r.riskLevel === 'high' ? <AlertOctagon size={14} /> :
                         r.riskLevel === 'medium' ? <AlertTriangle size={14} /> : <Clock size={14} />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-mono text-sm text-primary-700 font-medium">{r.cardNo}</div>
                        <div className="text-xs text-zinc-600 mt-0.5">{r.customerName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <RiskTypeBadge type={r.riskType} />
                    <div className="text-xs text-zinc-500 mt-1.5 max-w-[240px] truncate" title={r.description}>
                      {r.description}
                    </div>
                  </td>
                  <td className="table-cell text-center"><RiskLevelBadge level={r.riskLevel} /></td>
                  <td className="table-cell text-right font-semibold text-red-600">{formatCurrency(r.involvedAmount)}</td>
                  <td className="table-cell text-right font-medium text-zinc-800">{r.involvedSessions}</td>
                  <td className="table-cell text-zinc-700">{formatDate(r.firstOccurDate)}</td>
                  <td className="table-cell text-zinc-700">{formatDate(r.lastUpdateDate)}</td>
                  <td className="table-cell text-zinc-700">{r.assignee}</td>
                  <td className="table-cell text-center"><ProcessingStatusBadge status={r.processingStatus} /></td>
                  <td className="table-cell text-center">
                    <span className="inline-flex items-center gap-1 text-xs text-primary-700 group-hover:text-primary-800 font-medium px-2 py-1 rounded group-hover:bg-primary-50 transition">
                      查看详情 <ArrowRight size={12} />
                    </span>
                  </td>
                </tr>
              ))}
              {filteredRisks.length === 0 && (
                <tr>
                  <td colSpan={10} className="table-cell text-center py-20 text-zinc-400">
                    <ShieldAlert size={40} className="mx-auto mb-3 opacity-50" />
                    暂无该类别的风险记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modalRiskOpen && !!selectedCard}
        onClose={closeRiskDetail}
        size="xl"
        title={
          selectedCard && (
            <div className="flex items-center gap-3 flex-wrap">
              <RiskLevelBadge level={selectedCard.riskLevel} />
              <span className="font-mono text-primary-700">{selectedCard.cardNo}</span>
              <span className="text-zinc-500">·</span>
              <RiskTypeBadge type={selectedCard.riskType} />
            </div>
          )
        }
      >
        {selectedCard && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-gradient-to-r from-zinc-50 to-primary-50/50 border border-zinc-200">
              <div>
                <div className="label-text">顾客姓名</div>
                <div className="font-semibold text-zinc-900">{selectedCard.customerName}</div>
              </div>
              <div>
                <div className="label-text">涉及金额</div>
                <div className="font-semibold text-red-600">{formatCurrency(selectedCard.involvedAmount)}</div>
              </div>
              <div>
                <div className="label-text">涉及次数</div>
                <div className="font-semibold text-zinc-800">{selectedCard.involvedSessions} 次</div>
              </div>
              <div>
                <div className="label-text">处理人</div>
                <div className="flex items-center gap-1.5 text-zinc-800">
                  <UserCog size={13} className="text-zinc-500" />
                  {selectedCard.assignee}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-l-4 border-red-300 bg-red-50/40">
              <div className="flex items-center gap-2 text-red-700 font-semibold mb-1.5">
                <AlertTriangle size={16} />
                风险详情
              </div>
              <div className="text-sm text-red-900/80 leading-relaxed">{selectedCard.description}</div>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-red-200/60 text-xs text-red-700/80">
                <span>首次发现：{formatDate(selectedCard.firstOccurDate)}</span>
                <span>最近更新：{formatDateTime(selectedCard.lastUpdateDate)}</span>
              </div>
            </div>

            <div>
              <div className="section-title mb-3 flex items-center gap-2">
                <History size={15} className="text-zinc-500" />
                处理轨迹（{selectedCard.operationLogs.length}条）
              </div>
              <div className="relative pl-6 border-l-2 border-primary-100 space-y-4">
                {selectedCard.operationLogs.slice().reverse().map((log, i, arr) => (
                  <div key={log.id} className="relative">
                    <div className={`absolute -left-[29px] top-0.5 w-3.5 h-3.5 rounded-full border-2 border-white
                      ${i === 0 ? 'bg-primary-600' : 'bg-primary-300'}`}
                    />
                    <div className="p-3 rounded-lg bg-white border border-zinc-200 shadow-sm">
                      <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-zinc-900">{log.operator}</span>
                          <span className="badge-gray">{log.role}</span>
                        </div>
                        <span className="text-xs text-zinc-500">{formatDateTime(log.time)}</span>
                      </div>
                      <div className="text-sm text-zinc-700">{log.action}</div>
                      {log.remark && (
                        <div className="mt-2 text-xs text-zinc-600 bg-zinc-50 rounded px-2.5 py-1.5 border border-zinc-100">
                          <MessageSquare size={11} className="inline mr-1 mb-0.5 opacity-60" />
                          {log.remark}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-200 space-y-3">
              <div>
                <div className="label-text">
                  处理意见 <span className="text-red-500">*</span>
                  <span className="ml-2 text-zinc-400 font-normal">填写后不可修改，将永久留痕</span>
                </div>
                <textarea
                  rows={3}
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="请描述处理方案，如：已电话联系顾客，建议XX..."
                  className="input mt-1"
                />
              </div>
              <div className="flex items-center justify-end gap-2 flex-wrap pt-1">
                <button onClick={closeRiskDetail} className="btn-ghost">稍后处理</button>
                <button
                  disabled={!remark.trim()}
                  onClick={() => handleUpdate('reviewing')}
                  className="btn-ghost"
                >
                  <Clock size={14} /> 标记审核中
                </button>
                <button
                  disabled={!remark.trim()}
                  onClick={() => handleUpdate('ignored')}
                  className="btn-ghost"
                >
                  <X size={14} /> 忽略此风险
                </button>
                <button
                  disabled={!remark.trim()}
                  onClick={() => handleUpdate('resolved')}
                  className="btn-primary"
                >
                  <Check size={14} /> 标记已解决
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
