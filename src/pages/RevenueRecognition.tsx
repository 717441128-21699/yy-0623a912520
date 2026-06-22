import React, { useMemo } from 'react';
import {
  Vault, CheckCircle2, PiggyBank, TrendingUp, ReceiptText, Calculator,
} from 'lucide-react';
import { useAppStore, STORES, CATEGORIES } from '@/store/useAppStore';
import { StatCard } from '@/components/common/StatCard';
import { LineChartCard } from '@/components/charts/LineChartCard';
import { FilterBar } from '@/components/common/FilterBar';
import { CardStatusBadge } from '@/components/common/StatusBadge';
import {
  formatCurrency, formatCurrencyCompact, formatDate, formatPercent, formatNumber,
} from '@/utils/formatters';
import { calculateFulfillmentRate } from '@/utils/calculations';

export const RevenueRecognition: React.FC = () => {
  const {
    courseCards, revenueBreakdown, monthlyRevenueTrend,
    filters, setFilters, resetFilters,
  } = useAppStore();

  const filteredCards = useMemo(() => {
    const kw = filters.searchKeyword.trim().toLowerCase();
    return courseCards.filter(c => {
      if (filters.storeIds.length > 0 && !filters.storeIds.includes(c.storeId)) return false;
      if (filters.categoryIds.length > 0 && !filters.categoryIds.includes(c.categoryId)) return false;
      if (c.saleDate < filters.dateFrom || c.saleDate > filters.dateTo) return false;
      if (kw) {
        const haystack = (c.cardNo + c.customerName + c.projectName).toLowerCase();
        if (!haystack.includes(kw)) return false;
      }
      return true;
    });
  }, [courseCards, filters]);

  const computedBreakdown = useMemo(() => {
    if (!revenueBreakdown || filteredCards.length === courseCards.length) return revenueBreakdown;
    const currentRecognized = filteredCards.reduce((s, c) => s + c.redeemedAmount, 0);
    const endingPending = filteredCards.reduce((s, c) => s + c.pendingAmount, 0);
    const beginning = endingPending * (0.85 + Math.random() * 0.1);
    const total = beginning + filteredCards.reduce((s, c) => s + c.saleAmount, 0);
    return {
      advanceReceived: endingPending,
      currentRecognized,
      endingPending,
      beginningPending: Math.round(beginning * 100) / 100,
      recognitionRate: total > 0 ? currentRecognized / total : 0,
    };
  }, [filteredCards, courseCards.length, revenueBreakdown]);

  if (!revenueBreakdown) return <div className="p-10 text-center text-zinc-500">加载中...</div>;

  const recognitionCards = filteredCards.filter(c => c.usedSessions > 0);
  const formula = (
    <span className="text-xs text-zinc-600 font-mono bg-primary-50/70 px-2 py-1 rounded border border-primary-100">
      单次折算价 = 销售金额 ÷ (付费次数 + 赠送次数)
    </span>
  );

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        <StatCard
          label="预收账款余额（期初）"
          value={formatCurrencyCompact(computedBreakdown.beginningPending)}
          icon={<Vault size={20} />}
          iconBg="bg-indigo-50 text-indigo-700"
          delay={50}
          footer={
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">+ 本期新增售卡</span>
                <span className="text-zinc-800 font-medium">
                  {formatCurrencyCompact(filteredCards.reduce((s, c) => s + c.saleAmount, 0))}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">− 本期确认收入</span>
                <span className="text-emerald-700 font-medium">
                  {formatCurrencyCompact(computedBreakdown.currentRecognized)}
                </span>
              </div>
            </div>
          }
        />
        <StatCard
          label="本期确认收入（权责发生制）"
          value={formatCurrencyCompact(computedBreakdown.currentRecognized)}
          icon={<CheckCircle2 size={20} />}
          iconBg="bg-emerald-50 text-emerald-700"
          trend={8.5}
          trendLabel="对比上月"
          delay={100}
          footer={
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-zinc-500">累计收入确认率</span>
                <span className="font-semibold text-emerald-700">
                  {formatPercent(computedBreakdown.recognitionRate)}
                </span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill bg-gradient-to-r from-emerald-400 via-primary-500 to-primary-700"
                  style={{ width: `${Math.min(computedBreakdown.recognitionRate * 100, 100)}%` }}
                />
              </div>
            </div>
          }
        />
        <StatCard
          label="期末待履约余额（预收）"
          value={formatCurrencyCompact(computedBreakdown.endingPending)}
          subValue={`${formatNumber(filteredCards.reduce((s, c) => s + c.remainingSessions, 0))} 次服务未交付`}
          icon={<PiggyBank size={20} />}
          iconBg="bg-accent-50 text-accent-600"
          delay={150}
          footer={
            <div className="text-xs text-zinc-500 flex items-center gap-1.5">
              <Calculator size={12} />
              需在未来服务交付时逐笔确认收入
            </div>
          }
        />
      </div>

      <div className="card mb-5 p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <div className="section-title flex items-center gap-2">
              <TrendingUp size={16} className="text-primary-600" />
              售卡收入 vs 确认收入趋势
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              权责发生制下，售卡当月确认为预收，实际核销时逐笔转为营业收入
            </div>
          </div>
          {formula}
        </div>
        <LineChartCard
          title=""
          data={monthlyRevenueTrend as any}
          lines={[
            { key: 'saleAmount', label: '售卡收入(收付实现制)', color: '#E36414' },
            { key: 'recognizedAmount', label: '确认收入(权责发生制)', color: '#0F4C5C', dash: '5 3' },
          ]}
          height={280}
        />
      </div>

      <FilterBar
        stores={STORES.map(s => ({ value: s.id, label: s.name }))}
        categories={CATEGORIES.map(c => ({ value: c.id, label: c.name }))}
        consultants={[]}
        selectedStoreIds={filters.storeIds}
        selectedCategoryIds={filters.categoryIds}
        selectedConsultantIds={[]}
        dateFrom={filters.dateFrom}
        dateTo={filters.dateTo}
        searchKeyword={filters.searchKeyword}
        onStoresChange={(ids) => setFilters({ storeIds: ids })}
        onCategoriesChange={(ids) => setFilters({ categoryIds: ids })}
        onConsultantsChange={() => {}}
        onDateFromChange={(v) => setFilters({ dateFrom: v })}
        onDateToChange={(v) => setFilters({ dateTo: v })}
        onSearchChange={(v) => setFilters({ searchKeyword: v })}
        onReset={resetFilters}
        showConsultant={false}
      />

      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 flex-wrap gap-3">
          <div>
            <div className="section-title flex items-center gap-2">
              <ReceiptText size={16} className="text-primary-600" />
              收入确认明细
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              共 <span className="font-semibold text-zinc-800">{formatNumber(recognitionCards.length)}</span> 张卡有核销记录，
              累计确认收入 <span className="font-semibold text-emerald-700">
                {formatCurrency(recognitionCards.reduce((s, c) => s + c.redeemedAmount, 0))}
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[1500px]">
            <thead className="table-head">
              <tr>
                <th className="table-cell">卡号</th>
                <th className="table-cell">顾客</th>
                <th className="table-cell">项目</th>
                <th className="table-cell text-right">销售金额<br/><span className="font-normal text-zinc-400">(1) 预收</span></th>
                <th className="table-cell text-right">总次数</th>
                <th className="table-cell text-right">单次折算价<br/><span className="font-normal text-zinc-400">(1)÷(2)</span></th>
                <th className="table-cell text-right">已核销次数<br/><span className="font-normal text-zinc-400">(3)</span></th>
                <th className="table-cell text-right">累计确认收入<br/><span className="font-normal text-zinc-400">(单价)×(3)</span></th>
                <th className="table-cell text-right">预收余额<br/><span className="font-normal text-zinc-400">(1)−已确认</span></th>
                <th className="table-cell text-center">确认率</th>
                <th className="table-cell">最近核销日</th>
                <th className="table-cell w-24 text-center">卡状态</th>
              </tr>
            </thead>
            <tbody>
              {recognitionCards.slice(0, 60).map((c) => {
                const rate = calculateFulfillmentRate(c.usedSessions, c.totalSessions);
                return (
                  <tr key={c.id} className="table-row">
                    <td className="table-cell font-mono text-primary-700 font-medium">{c.cardNo}</td>
                    <td className="table-cell font-medium text-zinc-900">{c.customerName}</td>
                    <td className="table-cell text-zinc-700">{c.projectName}</td>
                    <td className="table-cell text-right font-semibold text-zinc-900">{formatCurrency(c.saleAmount)}</td>
                    <td className="table-cell text-right">{c.totalSessions}</td>
                    <td className="table-cell text-right font-mono text-zinc-600">{formatCurrency(c.unitPrice)}</td>
                    <td className="table-cell text-right text-emerald-700 font-medium">{c.usedSessions}</td>
                    <td className="table-cell text-right font-semibold text-emerald-700">{formatCurrency(c.redeemedAmount)}</td>
                    <td className="table-cell text-right font-semibold text-accent-600">{formatCurrency(c.pendingAmount)}</td>
                    <td className="table-cell w-32">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 progress-track">
                          <div
                            className={`progress-fill ${rate >= 0.8 ? 'bg-emerald-500' : rate >= 0.4 ? 'bg-primary-500' : 'bg-accent-500'}`}
                            style={{ width: `${rate * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium w-10 text-right text-zinc-600">
                          {formatPercent(rate, 0)}
                        </span>
                      </div>
                    </td>
                    <td className="table-cell">{formatDate(c.lastRedemptionDate)}</td>
                    <td className="table-cell text-center"><CardStatusBadge status={c.status} /></td>
                  </tr>
                );
              })}
              {recognitionCards.length === 0 && (
                <tr>
                  <td colSpan={12} className="table-cell text-center py-16 text-zinc-400">
                    当前筛选条件下暂无核销记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
