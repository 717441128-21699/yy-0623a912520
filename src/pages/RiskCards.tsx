import React, { useMemo, useState } from 'react';
import {
  ShieldAlert, AlertOctagon, Clock, Edit3, Hash, AlertTriangle,
  ArrowRight, MessageSquare, History, UserCog, Check, X, MoreHorizontal,
  Activity, CalendarCheck, FileSearch, TrendingDown, Zap, Gauge,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { StatCard } from '@/components/common/StatCard';
import { RiskTypeBadge, RiskLevelBadge, getRiskTypeLabel } from '@/components/common/RiskBadge';
import { ProcessingStatusBadge } from '@/components/common/StatusBadge';
import { Modal } from '@/components/common/Modal';
import {
  formatCurrency, formatCurrencyCompact, formatDate, formatDateTime, formatNumber, formatPercent,
} from '@/utils/formatters';
import type { RiskCard, RiskType, RiskProcessingStatus, RiskTriggerEvidence } from '@/shared/types';

const TABS: { key: RiskType | 'all'; label: string; Icon: any }[] = [
  { key: 'all', label: '全部', Icon: ShieldAlert },
  { key: 'longIdle', label: '长期未消费', Icon: Clock },
  { key: 'frequentChange', label: '频繁改卡', Icon: Edit3 },
  { key: 'manualDeduction', label: '手工补扣', Icon: Hash },
  { key: 'negativeBalance', label: '负余次', Icon: AlertOctagon },
  { key: 'expiredRedeemed', label: '过期核销', Icon: AlertTriangle },
];

const RISK_RULE_LABELS: Record<RiskType, { metric: string; unit: string; short: string }> = {
  longIdle:        { metric: '距上次消费/购卡', unit: '天', short: '未消费天数' },
  frequentChange:  { metric: '30天内改卡次数', unit: '次', short: '改卡次数' },
  manualDeduction: { metric: '手工补扣记录', unit: '次', short: '手工操作' },
  negativeBalance: { metric: '超用次数',       unit: '次', short: '负余次' },
  expiredRedeemed: { metric: '过期后仍核销',   unit: '天', short: '过期天数' },
};

export const RiskCards: React.FC = () => {
  const {
    riskCards, selectedRisk, modalRiskOpen, openRiskDetail, closeRiskDetail,
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

  const selectedCard = selectedRisk;

  const handleUpdate = (status: RiskProcessingStatus) => {
    if (!selectedCard) return;
    updateRiskStatus(selectedCard.id, status, remark);
    setRemark('');
    closeRiskDetail();
  };

  const isClosed = selectedCard && (selectedCard.processingStatus === 'resolved' || selectedCard.processingStatus === 'ignored');

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-5">
        <StatCard
          label="风险卡总数"
          value={formatNumber(summary.total)}
          subValue="系统按审计规则自动识别"
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
          subValue="未分配处理人/未开始"
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
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-100 flex-wrap gap-3">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin py-1">
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
          <div className="text-[11px] text-zinc-500 flex items-center gap-1">
            <FileSearch size={12} />
            仅展示严格命中审计规则阈值的风险记录，可刷新页面重置
          </div>
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
              ，点击行查看触发证据与核销详情
            </div>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[1400px]">
            <thead className="table-head">
              <tr>
                <th className="table-cell">卡号 / 顾客</th>
                <th className="table-cell">风险类型</th>
                <th className="table-cell w-24">等级</th>
                <th className="table-cell text-right">涉及金额</th>
                <th className="table-cell text-right">涉及次数</th>
                <th className="table-cell">触发值 / 阈值</th>
                <th className="table-cell">首次发现</th>
                <th className="table-cell">最近更新</th>
                <th className="table-cell">处理人</th>
                <th className="table-cell w-28 text-center">状态</th>
                <th className="table-cell w-24 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredRisks.slice(0, 80).map((r) => {
                const ev = r.evidence;
                const rule = RISK_RULE_LABELS[r.riskType];
                const pct = ev ? Math.min(ev.triggerCount / Math.max(ev.threshold, 1) * 100, 120) : 0;
                return (
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
                      <div className="text-xs text-zinc-500 mt-1.5 max-w-[200px] truncate" title={r.description}>
                        {r.description}
                      </div>
                    </td>
                    <td className="table-cell text-center"><RiskLevelBadge level={r.riskLevel} /></td>
                    <td className="table-cell text-right font-semibold text-red-600">{formatCurrency(r.involvedAmount)}</td>
                    <td className="table-cell text-right font-medium text-zinc-800">{r.involvedSessions}</td>
                    <td className="table-cell">
                      {ev && (
                        <div className="min-w-[180px]">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="font-mono text-zinc-700 font-semibold">
                              {ev.triggerCount} {rule.unit}
                              <span className="text-zinc-400 font-normal ml-1">/ {ev.threshold}+</span>
                            </span>
                            <span className={pct >= 150 ? 'text-red-600' : pct >= 100 ? 'text-accent-600' : 'text-yellow-600'}>
                              {formatPercent(pct / 100, 0)}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${pct >= 150 ? 'bg-red-500' : pct >= 100 ? 'bg-accent-500' : 'bg-yellow-500'}`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="table-cell text-zinc-700">{formatDate(r.firstOccurDate)}</td>
                    <td className="table-cell text-zinc-700">{formatDate(r.lastUpdateDate)}</td>
                    <td className="table-cell text-zinc-700">{r.assignee}</td>
                    <td className="table-cell text-center"><ProcessingStatusBadge status={r.processingStatus} /></td>
                    <td className="table-cell text-center">
                      <span className="inline-flex items-center gap-1 text-xs text-primary-700 group-hover:text-primary-800 font-medium px-2 py-1 rounded group-hover:bg-primary-50 transition">
                        详情 <ArrowRight size={12} />
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredRisks.length === 0 && (
                <tr>
                  <td colSpan={11} className="table-cell text-center py-20 text-zinc-400">
                    <ShieldAlert size={40} className="mx-auto mb-3 opacity-50" />
                    暂无该类别的风险记录（仅严格符合审计规则阈值的卡才列入清单）
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
        size="2xl"
        title={
          selectedCard && (
            <div className="flex items-center gap-3 flex-wrap">
              <RiskLevelBadge level={selectedCard.riskLevel} />
              <span className="font-mono text-primary-700">{selectedCard.cardNo}</span>
              <span className="text-zinc-500">·</span>
              <RiskTypeBadge type={selectedCard.riskType} />
              {isClosed && (
                <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-medium">
                  已{selectedCard.processingStatus === 'resolved' ? '解决' : '忽略'}，不可再编辑
                </span>
              )}
            </div>
          )
        }
      >
        {selectedCard && (() => {
          const ev: RiskTriggerEvidence = selectedCard.evidence;
          const rule = RISK_RULE_LABELS[selectedCard.riskType];
          const snap = ev.sessionSnapshot;
          const pct = Math.min(ev.triggerCount / Math.max(ev.threshold, 1) * 100, 150);
          return (
            <div className="space-y-5">
              {/* 顶部4卡片 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-xl bg-gradient-to-r from-zinc-50 to-primary-50/50 border border-zinc-200">
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

              {/* ====== 审计规则触发证据 ====== */}
              <div className="rounded-xl border-2 border-red-200/70 bg-gradient-to-br from-red-50/60 via-white to-orange-50/40 overflow-hidden">
                <div className="px-4 py-3 border-b border-red-200/60 bg-red-50/60 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-red-700 font-semibold">
                    <Zap size={16} />
                    审计规则触发证据
                  </div>
                  <div className="text-[11px] text-red-600/80 font-medium flex items-center gap-1">
                    <Gauge size={12} />
                    规则类别：{getRiskTypeLabel(selectedCard.riskType)}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                  {/* 左：阈值对比 */}
                  <div className="space-y-3">
                    <div className="flex items-end justify-between">
                      <div className="text-xs text-zinc-500">{rule.metric}</div>
                      <div className="text-[11px] text-zinc-400">阈值 ≥ {ev.threshold}{rule.unit}</div>
                    </div>
                    <div className="flex items-end gap-3">
                      <div>
                        <div className={`text-3xl font-bold font-mono ${pct >= 150 ? 'text-red-600' : pct >= 100 ? 'text-accent-600' : 'text-yellow-600'}`}>
                          {ev.triggerCount}
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-0.5">实际触发值（{rule.unit}）</div>
                      </div>
                      <div className="flex-1 h-4 mb-1.5 rounded-full bg-zinc-100 overflow-hidden relative">
                        <div
                          className="absolute inset-y-0 left-0 border-r border-dashed border-zinc-300"
                          style={{ width: `${Math.min(100 / (pct / 100), 100)}%` }}
                        />
                        <div
                          className={`absolute inset-y-0 left-0 rounded-full ${pct >= 150 ? 'bg-gradient-to-r from-red-400 to-red-600' : pct >= 100 ? 'bg-gradient-to-r from-accent-400 to-accent-600' : 'bg-gradient-to-r from-yellow-400 to-yellow-500'}`}
                          style={{ width: `${Math.min(pct, 150) / 1.5}%` }}
                        />
                      </div>
                      <span className={`text-sm font-bold mb-1.5 ${pct >= 100 ? 'text-red-600' : 'text-yellow-600'}`}>
                        {formatPercent(pct / 100, 0)}
                      </span>
                    </div>
                    <div className="pt-3 border-t border-red-100/80 text-xs text-red-800 leading-relaxed">
                      <FileSearch size={12} className="inline mr-1 mb-0.5 opacity-70" />
                      {ev.detail || selectedCard.description}
                    </div>
                  </div>

                  {/* 右：日期 + 快照 */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-white border border-red-100/80">
                        <div className="flex items-center gap-1 text-[11px] text-zinc-500 mb-1">
                          <CalendarCheck size={11} /> 触发日期
                        </div>
                        <div className="text-sm font-semibold text-zinc-900 font-mono">{formatDate(ev.triggerDate)}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-white border border-red-100/80">
                        <div className="flex items-center gap-1 text-[11px] text-zinc-500 mb-1">
                          <TrendingDown size={11} /> 升级为{selectedCard.riskLevel === 'high' ? '高' : '中'}风险
                        </div>
                        <div className="text-sm font-semibold text-zinc-900">
                          {selectedCard.riskLevel === 'high' ? '需立即处理' : '建议关注跟进'}
                        </div>
                      </div>
                    </div>
                    {snap && (
                      <div className="p-3 rounded-lg bg-white border border-red-100/80">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-[11px] text-zinc-500 flex items-center gap-1">
                            <Activity size={11} /> 卡内次数快照
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            剩余率 {snap.originalTotal > 0 ? formatPercent(snap.remaining / snap.originalTotal, 0) : '0%'}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center text-xs mb-2">
                          <div>
                            <div className="text-[10px] text-zinc-400 mb-0.5">总次数</div>
                            <div className="font-mono font-bold text-zinc-800">{snap.originalTotal}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-emerald-600 mb-0.5">已核销</div>
                            <div className="font-mono font-bold text-emerald-700">{snap.used}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-accent-600 mb-0.5">剩余</div>
                            <div className={`font-mono font-bold ${snap.remaining < 0 ? 'text-red-600' : 'text-accent-700'}`}>
                              {snap.remaining}
                            </div>
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-zinc-100 overflow-hidden flex">
                          <div
                            className="bg-gradient-to-r from-emerald-400 to-emerald-500"
                            style={{ width: `${snap.originalTotal > 0 ? Math.max(0, Math.min(snap.used / snap.originalTotal, 1)) * 100 : 0}%` }}
                          />
                          {snap.remaining > 0 && (
                            <div
                              className="bg-gradient-to-r from-accent-400 to-accent-500"
                              style={{ width: `${snap.originalTotal > 0 ? Math.max(0, Math.min(snap.remaining / snap.originalTotal, 1)) * 100 : 0}%` }}
                            />
                          )}
                          {snap.remaining < 0 && (
                            <div
                              className="bg-gradient-to-r from-red-400 to-red-500"
                              style={{ width: `${snap.originalTotal > 0 ? Math.min(Math.abs(snap.remaining) / snap.originalTotal * 100, 30) : 0}%` }}
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ====== 最近一次核销信息 ====== */}
              {(ev.lastRedemptionInfo || ev.lastRedemptionDate) && (
                <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50">
                  <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800 mb-3">
                    <Clock size={14} className="text-primary-600" />
                    最近一次核销信息
                    <span className="text-[10px] text-zinc-400 ml-auto font-normal">
                      用于追溯风险发生前的操作轨迹
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <div className="label-text !text-[10px]">核销时间</div>
                      <div className="text-sm font-medium text-zinc-800 font-mono">
                        {ev.lastRedemptionDate ? formatDateTime(ev.lastRedemptionDate) : '—'}
                      </div>
                    </div>
                    <div>
                      <div className="label-text !text-[10px]">核销次数</div>
                      <div className="text-sm font-semibold text-emerald-700">
                        {ev.lastRedemptionInfo ? `${ev.lastRedemptionInfo.sessions} 次` : '—'}
                      </div>
                    </div>
                    <div>
                      <div className="label-text !text-[10px]">核销金额</div>
                      <div className="text-sm font-semibold text-primary-700 font-mono">
                        {ev.lastRedemptionInfo ? formatCurrency(ev.lastRedemptionInfo.amount) : '—'}
                      </div>
                    </div>
                    <div>
                      <div className="label-text !text-[10px]">操作人/治疗师</div>
                      <div className="text-sm font-medium text-zinc-800">
                        {ev.lastRedemptionInfo?.operator || (selectedCard.riskType === 'manualDeduction' ? '手工补扣' : '—')}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ====== 处理轨迹 ====== */}
              <div>
                <div className="section-title mb-3 flex items-center gap-2">
                  <History size={15} className="text-zinc-500" />
                  处理轨迹（{selectedCard.operationLogs.length}条）
                </div>
                <div className="relative pl-6 border-l-2 border-primary-100 space-y-4">
                  {selectedCard.operationLogs.slice().reverse().map((log, i) => (
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

              {/* ====== 处理操作区 ====== */}
              {!isClosed ? (
                <div className="pt-4 border-t border-zinc-200 space-y-3">
                  <div>
                    <div className="label-text">
                      处理意见 <span className="text-red-500">*</span>
                      <span className="ml-2 text-zinc-400 font-normal">填写后不可修改，将永久留痕到处理轨迹</span>
                    </div>
                    <textarea
                      rows={3}
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      placeholder={`请描述处理方案，例如：已电话联系${selectedCard.customerName}，建议本周末安排到店服务...`}
                      className="input mt-1"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 flex-wrap pt-1">
                    <button onClick={() => { closeRiskDetail(); setRemark(''); }} className="btn-ghost">
                      稍后处理
                    </button>
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
              ) : (
                <div className={`p-4 rounded-xl flex items-start gap-3
                  ${selectedCard.processingStatus === 'resolved' ? 'bg-emerald-50 border border-emerald-200' : 'bg-zinc-50 border border-zinc-200'}`}>
                  <Check size={20} className={selectedCard.processingStatus === 'resolved' ? 'text-emerald-600 shrink-0 mt-0.5' : 'text-zinc-500 shrink-0 mt-0.5'} />
                  <div className="text-sm flex-1">
                    <div className={`font-semibold ${selectedCard.processingStatus === 'resolved' ? 'text-emerald-800' : 'text-zinc-700'}`}>
                      处理已完成 · {selectedCard.processingStatus === 'resolved' ? '风险已解决' : '风险已忽略'}
                    </div>
                    <div className={`mt-1 text-xs ${selectedCard.processingStatus === 'resolved' ? 'text-emerald-700/90' : 'text-zinc-600'}`}>
                      该风险已由 {selectedCard.operationLogs[selectedCard.operationLogs.length - 1]?.operator || '管理员'} 处理完成，
                      所有操作永久留痕，如需重开请联系系统管理员。
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};
