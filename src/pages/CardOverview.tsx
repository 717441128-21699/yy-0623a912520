import React, { useMemo } from 'react';
import {
  CreditCard, Wallet, Banknote, Clock, Sparkles, Layers,
} from 'lucide-react';
import { useAppStore, STORES, CATEGORIES, CONSULTANTS } from '@/store/useAppStore';
import { StatCard } from '@/components/common/StatCard';
import { FilterBar } from '@/components/common/FilterBar';
import { CardStatusBadge } from '@/components/common/StatusBadge';
import { BarChartCard } from '@/components/charts/BarChartCard';
import { PieChartCard } from '@/components/charts/PieChartCard';
import {
  formatCurrencyCompact, formatCurrency, formatDate, formatPercent, formatNumber,
} from '@/utils/formatters';
import { calculateFulfillmentRate } from '@/utils/calculations';

export const CardOverview: React.FC = () => {
  const {
    courseCards, overviewStats, storeSaleStats, projectDistribution,
    filters, setFilters, resetFilters,
  } = useAppStore();

  const filteredCards = useMemo(() => {
    const kw = filters.searchKeyword.trim().toLowerCase();
    return courseCards.filter(c => {
      if (filters.storeIds.length > 0 && !filters.storeIds.includes(c.storeId)) return false;
      if (filters.categoryIds.length > 0 && !filters.categoryIds.includes(c.categoryId)) return false;
      if (filters.consultantIds.length > 0 && !filters.consultantIds.includes(c.consultantId)) return false;
      if (c.saleDate < filters.dateFrom || c.saleDate > filters.dateTo) return false;
      if (kw) {
        const haystack = (c.cardNo + c.customerName + c.projectName + c.consultantName).toLowerCase();
        if (!haystack.includes(kw)) return false;
      }
      return true;
    });
  }, [courseCards, filters]);

  const computedStats = useMemo(() => {
    if (!overviewStats || filteredCards.length === courseCards.length) return overviewStats;
    const totalSale = filteredCards.reduce((s, c) => s + c.saleAmount, 0);
    const totalSess = filteredCards.reduce((s, c) => s + c.totalSessions, 0);
    const totalRedeemed = filteredCards.reduce((s, c) => s + c.redeemedAmount, 0);
    const totalPending = filteredCards.reduce((s, c) => s + c.pendingAmount, 0);
    const totalUnserved = filteredCards.reduce((s, c) => s + c.remainingSessions, 0);
    const completed = filteredCards.filter(c => c.status === 'completed').length;
    const abnormal = filteredCards.filter(c => c.status === 'abnormal').length;
    const avgRate = filteredCards.length > 0
      ? filteredCards.reduce((s, c) => s + calculateFulfillmentRate(c.usedSessions, c.totalSessions), 0) / filteredCards.length
      : 0;
    return {
      totalSaleAmount: totalSale,
      totalSessions: totalSess,
      totalRedeemedAmount: totalRedeemed,
      totalPendingAmount: totalPending,
      totalUnservedSessions: totalUnserved,
      cardCount: filteredCards.length,
      completedCount: completed,
      abnormalCount: abnormal,
      avgFulfillmentRate: avgRate,
      saleAmountTrend: overviewStats?.saleAmountTrend || 0,
      redeemedAmountTrend: overviewStats?.redeemedAmountTrend || 0,
    };
  }, [filteredCards, courseCards.length, overviewStats]);

  if (!overviewStats) return <div className="p-10 text-center text-zinc-500">加载中...</div>;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-5">
        <StatCard
          label="售卡总金额"
          value={formatCurrencyCompact(computedStats.totalSaleAmount)}
          subValue={`共 ${formatNumber(computedStats.cardCount)} 张`}
          icon={<Banknote size={20} />}
          iconBg="bg-primary-50 text-primary-700"
          trend={computedStats.saleAmountTrend}
          trendLabel="环比上期"
          delay={50}
          footer={
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">累计总次数</span>
              <span className="font-semibold text-zinc-800">{formatNumber(computedStats.totalSessions)} 次</span>
            </div>
          }
        />
        <StatCard
          label="已核销金额"
          value={formatCurrencyCompact(computedStats.totalRedeemedAmount)}
          icon={<Wallet size={20} />}
          iconBg="bg-emerald-50 text-emerald-700"
          trend={computedStats.redeemedAmountTrend}
          trendLabel="环比上期"
          delay={100}
          footer={
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-zinc-500">平均履约率</span>
                <span className="font-semibold text-emerald-700">
                  {formatPercent(computedStats.avgFulfillmentRate)}
                </span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill bg-gradient-to-r from-emerald-400 to-primary-500"
                  style={{ width: `${Math.min(computedStats.avgFulfillmentRate * 100, 100)}%` }}
                />
              </div>
            </div>
          }
        />
        <StatCard
          label="待履约金额"
          value={formatCurrencyCompact(computedStats.totalPendingAmount)}
          icon={<CreditCard size={20} />}
          iconBg="bg-accent-50 text-accent-600"
          delay={150}
          footer={
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">未服务总次数</span>
              <span className="font-semibold text-accent-600">
                {formatNumber(computedStats.totalUnservedSessions)} 次
              </span>
            </div>
          }
        />
        <StatCard
          label="已完成卡数"
          value={formatNumber(computedStats.completedCount)}
          subValue={`${formatPercent(computedStats.cardCount > 0 ? computedStats.completedCount / computedStats.cardCount : 0)} 占比`}
          icon={<Sparkles size={20} />}
          iconBg="bg-indigo-50 text-indigo-600"
          delay={200}
        />
        <StatCard
          label="异常卡数"
          value={formatNumber(computedStats.abnormalCount)}
          subValue={computedStats.abnormalCount > 0 ? '需关注处理' : '运行良好'}
          icon={<Clock size={20} />}
          iconBg={computedStats.abnormalCount > 0 ? 'bg-red-50 text-red-600' : 'bg-zinc-100 text-zinc-600'}
          delay={250}
        />
      </div>

      <FilterBar
        stores={STORES.map(s => ({ value: s.id, label: s.name }))}
        categories={CATEGORIES.map(c => ({ value: c.id, label: c.name }))}
        consultants={CONSULTANTS.map(c => ({ value: c.id, label: c.name }))}
        selectedStoreIds={filters.storeIds}
        selectedCategoryIds={filters.categoryIds}
        selectedConsultantIds={filters.consultantIds}
        dateFrom={filters.dateFrom}
        dateTo={filters.dateTo}
        searchKeyword={filters.searchKeyword}
        onStoresChange={(ids) => setFilters({ storeIds: ids })}
        onCategoriesChange={(ids) => setFilters({ categoryIds: ids })}
        onConsultantsChange={(ids) => setFilters({ consultantIds: ids })}
        onDateFromChange={(v) => setFilters({ dateFrom: v })}
        onDateToChange={(v) => setFilters({ dateTo: v })}
        onSearchChange={(v) => setFilters({ searchKeyword: v })}
        onReset={resetFilters}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        <div className="lg:col-span-2">
          <BarChartCard
            title="各门店售卡金额"
            data={storeSaleStats.map(s => ({ label: s.storeName.replace('店', ''), value: s.saleAmount }))}
            unit="currency"
            height={260}
            subtitle={`${filteredCards.length > 0 ? '当前筛选条件下' : '全部'} · 按门店维度统计`}
          />
        </div>
        <PieChartCard
          title="项目类别售卡占比"
          data={projectDistribution}
          height={260}
          subtitle={<span className="flex items-center gap-1"><Layers size={12} /> 按销售金额占比</span>}
        />
      </div>

      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200">
          <div>
            <div className="section-title">疗程卡明细表</div>
            <div className="text-xs text-zinc-500 mt-1">
              当前筛选共 <span className="font-semibold text-zinc-800">{formatNumber(filteredCards.length)}</span> 条记录
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge-blue">{formatCurrencyCompact(computedStats.totalSaleAmount)} 售卡</span>
            <span className="badge-green">{formatCurrencyCompact(computedStats.totalRedeemedAmount)} 已核</span>
            <span className="badge-orange">{formatCurrencyCompact(computedStats.totalPendingAmount)} 待履约</span>
          </div>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[1800px]">
            <thead className="table-head">
              <tr>
                <th className="table-cell w-36">卡号</th>
                <th className="table-cell">顾客</th>
                <th className="table-cell">项目</th>
                <th className="table-cell">门店</th>
                <th className="table-cell">顾问</th>
                <th className="table-cell">成交日期</th>
                <th className="table-cell text-right">销售金额</th>
                <th className="table-cell text-right">次数(赠)</th>
                <th className="table-cell text-right">单次折算价</th>
                <th className="table-cell text-right">已核销</th>
                <th className="table-cell text-right">剩余次数</th>
                <th className="table-cell text-right">已核销金额</th>
                <th className="table-cell text-right">待履约金额</th>
                <th className="table-cell text-center">履约率</th>
                <th className="table-cell">到期日</th>
                <th className="table-cell w-24 text-center">状态</th>
              </tr>
            </thead>
            <tbody>
              {filteredCards.slice(0, 50).map((c, i) => {
                const rate = calculateFulfillmentRate(c.usedSessions, c.totalSessions);
                return (
                  <tr key={c.id} className="table-row">
                    <td className="table-cell font-mono text-primary-700 font-medium">{c.cardNo}</td>
                    <td className="table-cell">
                      <div className="font-medium text-zinc-900">{c.customerName}</div>
                    </td>
                    <td className="table-cell">
                      <span className="badge-blue">{c.categoryName}</span>
                      <div className="mt-1 text-zinc-700">{c.projectName}</div>
                    </td>
                    <td className="table-cell">{c.storeName}</td>
                    <td className="table-cell">{c.consultantName}</td>
                    <td className="table-cell">{formatDate(c.saleDate)}</td>
                    <td className="table-cell text-right font-semibold text-zinc-900">{formatCurrency(c.saleAmount)}</td>
                    <td className="table-cell text-right">
                      {c.paidSessions + c.giftedSessions}
                      {c.giftedSessions > 0 && (
                        <span className="text-accent-600 text-xs ml-1">(赠{c.giftedSessions})</span>
                      )}
                    </td>
                    <td className="table-cell text-right text-zinc-600">{formatCurrency(c.unitPrice)}</td>
                    <td className="table-cell text-right text-emerald-700 font-medium">{c.usedSessions}</td>
                    <td className="table-cell text-right">
                      <span className={c.remainingSessions <= 0 ? 'text-zinc-400' : 'text-accent-600 font-medium'}>
                        {c.remainingSessions}
                      </span>
                    </td>
                    <td className="table-cell text-right text-emerald-700">{formatCurrency(c.redeemedAmount)}</td>
                    <td className="table-cell text-right font-semibold text-accent-600">{formatCurrency(c.pendingAmount)}</td>
                    <td className="table-cell w-36">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 progress-track">
                          <div
                            className={`progress-fill ${rate >= 0.8 ? 'bg-emerald-500' : rate >= 0.4 ? 'bg-primary-500' : 'bg-accent-500'}`}
                            style={{ width: `${rate * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-zinc-600 w-10 text-right">{formatPercent(rate, 0)}</span>
                      </div>
                    </td>
                    <td className="table-cell">{formatDate(c.expiryDate)}</td>
                    <td className="table-cell text-center"><CardStatusBadge status={c.status} /></td>
                  </tr>
                );
              })}
              {filteredCards.length === 0 && (
                <tr>
                  <td colSpan={16} className="table-cell text-center py-16 text-zinc-400">
                    暂无符合筛选条件的数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filteredCards.length > 50 && (
          <div className="px-5 py-3 border-t border-zinc-100 text-xs text-center text-zinc-500 bg-zinc-50/60">
            仅展示前 50 条 · 共 {formatNumber(filteredCards.length)} 条记录 · 导出完整数据请前往「导出报表」
          </div>
        )}
      </div>
    </div>
  );
};
