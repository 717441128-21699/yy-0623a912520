import React, { useMemo, useState } from 'react';
import {
  Building2, Scale, AlertCircle, TrendingUp, Clock, Activity,
  ChevronRight, ArrowDownUp, Gauge, Zap, Users, CheckCircle2, XCircle,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { StatCard } from '@/components/common/StatCard';
import { Modal } from '@/components/common/Modal';
import {
  formatCurrency, formatCurrencyCompact, formatNumber, formatPercent,
} from '@/utils/formatters';
import type { StoreReconSummary, FulfillmentPressure } from '@/shared/types';

export const StoreReconciliation: React.FC = () => {
  const { storeReconSummaries, fulfillmentPressure, courseCards, redemptionRecords } = useAppStore();
  const [selectedStore, setSelectedStore] = useState<StoreReconSummary | null>(null);
  const [pressureView, setPressureView] = useState(false);

  const overallStats = useMemo(() => {
    const totalOpening = storeReconSummaries.reduce((s, r) => s + r.openingBalance, 0);
    const totalSale = storeReconSummaries.reduce((s, r) => s + r.currentPeriodSale, 0);
    const totalRedeemed = storeReconSummaries.reduce((s, r) => s + r.currentPeriodRedeemed, 0);
    const totalPending = storeReconSummaries.reduce((s, r) => s + r.pendingAmountTotal, 0);
    const totalDiff = storeReconSummaries.reduce((s, r) => s + r.difference, 0);
    const abnormalStores = storeReconSummaries.filter(r => Math.abs(r.difference) >= 0.01).length;
    const totalPendingSessions = storeReconSummaries.reduce((s, r) => s + r.pendingSessionsTotal, 0);
    return { totalOpening, totalSale, totalRedeemed, totalPending, totalDiff, abnormalStores, totalPendingSessions };
  }, [storeReconSummaries]);

  const storeDetail = useMemo(() => {
    if (!selectedStore) return null;
    const storeCards = courseCards.filter(c => c.storeId === selectedStore.storeId);
    const storeRedemptions = redemptionRecords.filter(r => r.storeId === selectedStore.storeId);
    const byProject = storeCards.reduce((acc: Record<string, { projectName: string; pendingAmount: number; pendingSessions: number; cardCount: number }>, card) => {
      if (!acc[card.projectId]) {
        acc[card.projectId] = { projectName: card.projectName, pendingAmount: 0, pendingSessions: 0, cardCount: 0 };
      }
      acc[card.projectId].pendingAmount += card.pendingAmount;
      acc[card.projectId].pendingSessions += card.remainingSessions;
      acc[card.projectId].cardCount += 1;
      return acc;
    }, {});
    const projectBreakdown = Object.values(byProject).sort((a, b) => b.pendingAmount - a.pendingAmount);
    const inconsistentCount = storeRedemptions.filter(r => !r.tripartiteConsistent).length;
    return { storeCards, storeRedemptions, projectBreakdown, inconsistentCount };
  }, [selectedStore, courseCards, redemptionRecords]);

  const avgPressureRatio = useMemo(() => {
    if (fulfillmentPressure.length === 0) return 0;
    return fulfillmentPressure.reduce((s, p) => s + p.pressureRatio, 0) / fulfillmentPressure.length;
  }, [fulfillmentPressure]);

  const getPressureColor = (ratio: number) => {
    if (ratio >= 1) return 'text-red-600';
    if (ratio >= 0.8) return 'text-accent-600';
    if (ratio >= 0.5) return 'text-yellow-600';
    return 'text-emerald-600';
  };

  const getPressureBar = (ratio: number) => {
    if (ratio >= 1) return 'bg-gradient-to-r from-red-500 to-red-600 animate-pulse';
    if (ratio >= 0.8) return 'bg-gradient-to-r from-accent-500 to-accent-600';
    if (ratio >= 0.5) return 'bg-gradient-to-r from-yellow-500 to-yellow-500';
    return 'bg-gradient-to-r from-emerald-500 to-emerald-500';
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <button
          onClick={() => setPressureView(false)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
            ${!pressureView ? 'bg-primary-800 text-white shadow-sm' : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50'}`}
        >
          <Scale size={15} /> 门店对账
        </button>
        <button
          onClick={() => setPressureView(true)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
            ${pressureView ? 'bg-primary-800 text-white shadow-sm' : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50'}`}
        >
          <Gauge size={15} /> 履约压力评估
        </button>
      </div>

      {!pressureView ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-5">
            <StatCard
              label="期初预收余额"
              value={formatCurrencyCompact(overallStats.totalOpening)}
              subValue="上月结转"
              icon={<ArrowDownUp size={20} />}
              iconBg="bg-slate-50 text-slate-600"
              delay={0}
            />
            <StatCard
              label="本期售卡金额"
              value={formatCurrencyCompact(overallStats.totalSale)}
              subValue="收付实现制"
              icon={<TrendingUp size={20} />}
              iconBg="bg-primary-50 text-primary-700"
              delay={40}
            />
            <StatCard
              label="本期核销金额"
              value={formatCurrencyCompact(overallStats.totalRedeemed)}
              subValue="权责发生制确认"
              icon={<CheckCircle2 size={20} />}
              iconBg="bg-emerald-50 text-emerald-700"
              delay={80}
            />
            <StatCard
              label="期末未履约余额"
              value={formatCurrencyCompact(overallStats.totalPending)}
              subValue={`${formatNumber(overallStats.totalPendingSessions)}次未服务`}
              icon={<Clock size={20} />}
              iconBg="bg-accent-50 text-accent-700"
              delay={120}
            />
            <StatCard
              label="对账差异合计"
              value={formatCurrencyCompact(overallStats.totalDiff)}
              subValue={overallStats.totalDiff === 0 ? '全部账实相符' : `${overallStats.abnormalStores}家门店有差异`}
              icon={overallStats.totalDiff === 0 ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              iconBg={overallStats.totalDiff === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}
              delay={160}
            />
            <StatCard
              label="异常门店"
              value={formatNumber(overallStats.abnormalStores)}
              subValue={`共${storeReconSummaries.length}家门店`}
              icon={<Building2 size={20} />}
              iconBg="bg-indigo-50 text-indigo-700"
              delay={200}
            />
          </div>

          <div className="card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 flex-wrap gap-3">
              <div>
                <div className="section-title flex items-center gap-2">
                  <Building2 size={16} className="text-primary-600" />
                  门店对账汇总表
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  公式：期初余额 + 本期售卡 − 本期核销 + 转入 − 转出 − 退款 = 理论期末；与实际期末比对差异
                </div>
              </div>
            </div>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[1400px]">
                <thead className="table-head">
                  <tr>
                    <th className="table-cell">门店</th>
                    <th className="table-cell text-right">期初余额</th>
                    <th className="table-cell text-right">本期售卡</th>
                    <th className="table-cell text-right">本期核销</th>
                    <th className="table-cell text-right">退款</th>
                    <th className="table-cell text-right">转卡出入</th>
                    <th className="table-cell text-right">理论期末</th>
                    <th className="table-cell text-right">实际期末</th>
                    <th className="table-cell text-right w-28">差异</th>
                    <th className="table-cell text-right">未服务次数</th>
                    <th className="table-cell text-right">未履约金额</th>
                    <th className="table-cell w-24 text-center">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {storeReconSummaries.map((r) => {
                    const netTransfer = r.transferIn - r.transferOut;
                    const hasDiff = Math.abs(r.difference) >= 0.01;
                    return (
                      <tr key={r.storeId} className="table-row group">
                        <td className="table-cell">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center shrink-0">
                              <Building2 size={16} />
                            </div>
                            <div>
                              <div className="font-semibold text-zinc-900">{r.storeName}</div>
                              <div className="text-xs text-zinc-500 mt-0.5">
                                履约率 {formatPercent(r.currentPeriodSale + r.openingBalance > 0
                                  ? r.currentPeriodRedeemed / (r.currentPeriodSale + r.openingBalance - r.pendingAmountTotal + r.currentPeriodRedeemed)
                                  : 0)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell text-right font-mono text-zinc-700">{formatCurrency(r.openingBalance)}</td>
                        <td className="table-cell text-right font-mono text-primary-700 font-semibold">{formatCurrency(r.currentPeriodSale)}</td>
                        <td className="table-cell text-right font-mono text-emerald-700 font-semibold">{formatCurrency(r.currentPeriodRedeemed)}</td>
                        <td className="table-cell text-right font-mono text-red-600">{formatCurrency(r.refundAmount)}</td>
                        <td className="table-cell text-right font-mono">
                          <span className={netTransfer >= 0 ? 'text-indigo-700' : 'text-orange-700'}>
                            {netTransfer >= 0 ? '+' : ''}{formatCurrency(netTransfer)}
                          </span>
                        </td>
                        <td className="table-cell text-right font-mono text-zinc-700 border-l-2 border-zinc-100">{formatCurrency(r.theoreticalClosing)}</td>
                        <td className="table-cell text-right font-mono text-zinc-700">{formatCurrency(r.actualClosing)}</td>
                        <td className="table-cell text-right">
                          {hasDiff ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-50 text-red-700 font-mono text-sm font-semibold border border-red-100">
                              <AlertCircle size={12} />
                              {r.difference >= 0 ? '+' : ''}{formatCurrency(r.difference)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-600 text-sm">
                              <CheckCircle2 size={14} /> 一致
                            </span>
                          )}
                        </td>
                        <td className="table-cell text-right font-semibold text-accent-700">{formatNumber(r.pendingSessionsTotal)}</td>
                        <td className="table-cell text-right font-mono font-semibold text-accent-700">{formatCurrency(r.pendingAmountTotal)}</td>
                        <td className="table-cell text-center">
                          <button
                            onClick={() => setSelectedStore(r)}
                            className="inline-flex items-center gap-1 text-xs text-primary-700 group-hover:text-primary-800 font-medium px-2 py-1 rounded group-hover:bg-primary-50 transition"
                          >
                            钻取 <ChevronRight size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-zinc-50/80 border-t-2 border-zinc-200">
                    <td className="table-cell font-semibold text-zinc-900 text-sm">合计 / 平均</td>
                    <td className="table-cell text-right font-mono font-semibold">{formatCurrency(overallStats.totalOpening)}</td>
                    <td className="table-cell text-right font-mono font-semibold text-primary-700">{formatCurrency(overallStats.totalSale)}</td>
                    <td className="table-cell text-right font-mono font-semibold text-emerald-700">{formatCurrency(overallStats.totalRedeemed)}</td>
                    <td className="table-cell text-right font-mono font-semibold text-red-600">
                      {formatCurrency(storeReconSummaries.reduce((s, r) => s + r.refundAmount, 0))}
                    </td>
                    <td className="table-cell text-right font-mono font-semibold text-indigo-700">
                      +{formatCurrency(storeReconSummaries.reduce((s, r) => s + r.transferIn - r.transferOut, 0))}
                    </td>
                    <td className="table-cell text-right font-mono font-semibold border-l-2 border-zinc-200">
                      {formatCurrency(storeReconSummaries.reduce((s, r) => s + r.theoreticalClosing, 0))}
                    </td>
                    <td className="table-cell text-right font-mono font-semibold">
                      {formatCurrency(storeReconSummaries.reduce((s, r) => s + r.actualClosing, 0))}
                    </td>
                    <td className="table-cell text-right">
                      <span className={`font-mono font-semibold ${Math.abs(overallStats.totalDiff) >= 0.01 ? 'text-red-700' : 'text-emerald-700'}`}>
                        {Math.abs(overallStats.totalDiff) >= 0.01
                          ? `${overallStats.totalDiff >= 0 ? '+' : ''}${formatCurrency(overallStats.totalDiff)}`
                          : '一致'}
                      </span>
                    </td>
                    <td className="table-cell text-right font-semibold text-accent-700">{formatNumber(overallStats.totalPendingSessions)}</td>
                    <td className="table-cell text-right font-mono font-semibold text-accent-700">{formatCurrency(overallStats.totalPending)}</td>
                    <td className="table-cell"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            <StatCard
              label="评估项目数"
              value={formatNumber(fulfillmentPressure.length)}
              subValue="含剩余次数的项目"
              icon={<Activity size={20} />}
              iconBg="bg-primary-50 text-primary-700"
              delay={0}
            />
            <StatCard
              label="平均压力指数"
              value={formatPercent(avgPressureRatio)}
              subValue={avgPressureRatio >= 0.8 ? '产能紧张，建议排班' : avgPressureRatio >= 0.5 ? '正常水平' : '产能充裕'}
              icon={<Gauge size={20} />}
              iconBg={avgPressureRatio >= 0.8 ? 'bg-red-50 text-red-700' : avgPressureRatio >= 0.5 ? 'bg-accent-50 text-accent-700' : 'bg-emerald-50 text-emerald-700'}
              delay={40}
            />
            <StatCard
              label="高压预警项目"
              value={formatNumber(fulfillmentPressure.filter(p => p.pressureRatio >= 0.8).length)}
              subValue="压力指数≥80%"
              icon={<Zap size={20} />}
              iconBg="bg-red-50 text-red-700"
              delay={80}
            />
            <StatCard
              label="剩余总服务时长"
              value={`${(fulfillmentPressure.reduce((s, p) => s + p.requiredHours, 0) / 8).toFixed(1)}人日`}
              subValue={`${fulfillmentPressure.reduce((s, p) => s + p.requiredHours, 0).toFixed(0)}小时`}
              icon={<Users size={20} />}
              iconBg="bg-indigo-50 text-indigo-700"
              delay={120}
            />
          </div>

          <div className="card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 flex-wrap gap-3">
              <div>
                <div className="section-title flex items-center gap-2">
                  <Gauge size={16} className="text-primary-600" />
                  项目履约压力评估
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  压力指数 = 剩余服务所需时长 ÷ (光电设备月产能 + 治疗师月产能)。≥80%黄色预警，≥100%红色闪烁
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500"></span> 充裕 &lt;50%
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-yellow-500"></span> 正常 50-80%
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-accent-500"></span> 紧张 80-100%
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-red-500 animate-pulse"></span> 超负荷 ≥100%
                </span>
              </div>
            </div>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[1100px]">
                <thead className="table-head">
                  <tr>
                    <th className="table-cell">项目名称</th>
                    <th className="table-cell text-right">剩余次数</th>
                    <th className="table-cell text-right">单次时长</th>
                    <th className="table-cell text-right">需服务时长</th>
                    <th className="table-cell text-right">设备产能(小时)</th>
                    <th className="table-cell text-right">治疗师产能(小时)</th>
                    <th className="table-cell w-80">压力指数</th>
                    <th className="table-cell w-44 text-center">院长建议</th>
                  </tr>
                </thead>
                <tbody>
                  {[...fulfillmentPressure].sort((a, b) => b.pressureRatio - a.pressureRatio).map((p) => (
                    <tr key={p.projectId} className="table-row">
                      <td className="table-cell">
                        <div className="font-medium text-zinc-900">{p.projectName}</div>
                      </td>
                      <td className="table-cell text-right font-semibold text-primary-700">{formatNumber(p.remainingSessions)}</td>
                      <td className="table-cell text-right text-zinc-700">{p.avgDurationPerSession} 分钟</td>
                      <td className="table-cell text-right font-semibold text-zinc-800">{p.requiredHours.toFixed(1)} h</td>
                      <td className="table-cell text-right text-zinc-700">{p.deviceCapacityHours.toFixed(0)} h</td>
                      <td className="table-cell text-right text-zinc-700">{p.therapistCapacityHours.toFixed(0)} h</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${getPressureBar(p.pressureRatio)}`}
                              style={{ width: `${Math.min(p.pressureRatio * 100, 110)}%` }}
                            />
                          </div>
                          <span className={`font-mono font-bold text-sm w-14 text-right ${getPressureColor(p.pressureRatio)}`}>
                            {formatPercent(p.pressureRatio, 0)}
                          </span>
                        </div>
                      </td>
                      <td className="table-cell text-center">
                        {p.pressureRatio >= 1 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-50 text-red-700 text-xs font-semibold border border-red-100">
                            <XCircle size={12} /> 立即增开排期
                          </span>
                        ) : p.pressureRatio >= 0.8 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-accent-50 text-accent-700 text-xs font-semibold border border-accent-100">
                            <Zap size={12} /> 预约加班/分流
                          </span>
                        ) : p.pressureRatio >= 0.5 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-yellow-50 text-yellow-700 text-xs font-medium border border-yellow-100">
                            <Clock size={12} /> 维持现有排班
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
                            <CheckCircle2 size={12} /> 可承接更多售卡
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <Modal
        open={!!selectedStore}
        onClose={() => setSelectedStore(null)}
        size="2xl"
        title={
          selectedStore && (
            <div className="flex items-center gap-3">
              <Building2 size={18} className="text-primary-700" />
              <span className="font-semibold">{selectedStore.storeName}</span>
              <span className="text-zinc-500">·</span>
              <span className="text-sm text-zinc-500">对账明细钻取</span>
            </div>
          )
        }
      >
        {selectedStore && storeDetail && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="label-text">疗程卡数量</div>
                <div className="text-xl font-bold text-slate-800 mt-0.5">{formatNumber(storeDetail.storeCards.length)}</div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="label-text">本期核销流水</div>
                <div className="text-xl font-bold text-emerald-800 mt-0.5">{formatNumber(storeDetail.storeRedemptions.length)}</div>
              </div>
              <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                <div className="label-text">三方不一致记录</div>
                <div className="text-xl font-bold text-red-700 mt-0.5">{formatNumber(storeDetail.inconsistentCount)}</div>
              </div>
              <div className="p-3 rounded-xl bg-primary-50 border border-primary-200">
                <div className="label-text">对账差异</div>
                <div className={`text-xl font-bold mt-0.5 ${Math.abs(selectedStore.difference) >= 0.01 ? 'text-red-700' : 'text-emerald-700'}`}>
                  {Math.abs(selectedStore.difference) >= 0.01 ? formatCurrency(selectedStore.difference) : '一致'}
                </div>
              </div>
            </div>

            <div>
              <div className="section-title mb-3 flex items-center gap-2">
                <Activity size={15} className="text-zinc-500" />
                项目未履约分布
              </div>
              <div className="rounded-xl border border-zinc-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-zinc-50">
                    <tr className="text-xs text-zinc-500 uppercase tracking-wide">
                      <th className="px-4 py-2.5 text-left">项目名称</th>
                      <th className="px-4 py-2.5 text-right">卡数</th>
                      <th className="px-4 py-2.5 text-right">未服务次数</th>
                      <th className="px-4 py-2.5 text-right">待履约金额</th>
                      <th className="px-4 py-2.5 w-48">占比</th>
                    </tr>
                  </thead>
                  <tbody>
                    {storeDetail.projectBreakdown.slice(0, 10).map((pb, i) => {
                      const totalPending = storeDetail.projectBreakdown.reduce((s, x) => s + x.pendingAmount, 0);
                      const pct = totalPending > 0 ? pb.pendingAmount / totalPending : 0;
                      return (
                        <tr key={i} className="border-t border-zinc-100">
                          <td className="px-4 py-2.5 font-medium text-zinc-800 text-sm">{pb.projectName}</td>
                          <td className="px-4 py-2.5 text-right text-zinc-700 text-sm font-mono">{pb.cardCount}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-primary-700 text-sm font-mono">{formatNumber(pb.pendingSessions)}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-accent-700 text-sm font-mono">{formatCurrency(pb.pendingAmount)}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full" style={{ width: `${pct * 100}%` }} />
                              </div>
                              <span className="text-xs font-mono text-zinc-600 w-10 text-right">{formatPercent(pct, 0)}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
