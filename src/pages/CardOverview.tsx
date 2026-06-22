import React, { useMemo, useState } from 'react';
import {
  CreditCard, Wallet, Banknote, Clock, Sparkles, Layers, User2,
  Store, BarChart3, LineChart as LineChartIcon, CalendarRange,
} from 'lucide-react';
import { useAppStore, STORES, CATEGORIES, CONSULTANTS, PROJECTS } from '@/store/useAppStore';
import { StatCard } from '@/components/common/StatCard';
import { FilterBar } from '@/components/common/FilterBar';
import { CardStatusBadge } from '@/components/common/StatusBadge';
import { BarChartCard } from '@/components/charts/BarChartCard';
import { PieChartCard } from '@/components/charts/PieChartCard';
import { LineChartCard } from '@/components/charts/LineChartCard';
import {
  formatCurrencyCompact, formatCurrency, formatDate, formatPercent, formatNumber,
} from '@/utils/formatters';
import { calculateFulfillmentRate } from '@/utils/calculations';
import type { PieDataItem } from '@/components/charts/PieChartCard';

type StatView = 'store' | 'project' | 'consultant';
type TrendMetric = 'saleAmount' | 'cardCount' | 'unservedSessions';

const PIE_COLORS = ['#0F4C5C', '#E36414', '#2A9D8F', '#84bfc6', '#f4a261', '#e9c46a', '#264653', '#d62828', '#457B9D'];

export const CardOverview: React.FC = () => {
  const {
    courseCards, overviewStats,
    filters, setFilters, resetFilters,
  } = useAppStore();
  const [statView, setStatView] = useState<StatView>('store');
  const [trendMetric, setTrendMetric] = useState<TrendMetric>('saleAmount');

  const filteredCards = useMemo(() => {
    const kw = filters.searchKeyword.trim().toLowerCase();
    return courseCards.filter(c => {
      if (filters.storeIds.length > 0 && !filters.storeIds.includes(c.storeId)) return false;
      if (filters.categoryIds.length > 0 && !filters.categoryIds.includes(c.categoryId)) return false;
      if (filters.projectIds.length > 0 && !filters.projectIds.includes(c.projectId)) return false;
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
    if (filteredCards.length === courseCards.length && overviewStats) return overviewStats;
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

  const storeBarData = useMemo(() => {
    const map = new Map<string, { name: string; saleAmount: number; cardCount: number; unserved: number }>();
    STORES.forEach(s => map.set(s.id, { name: s.name, saleAmount: 0, cardCount: 0, unserved: 0 }));
    filteredCards.forEach(c => {
      const entry = map.get(c.storeId);
      if (entry) {
        entry.saleAmount += c.saleAmount;
        entry.cardCount += 1;
        entry.unserved += c.remainingSessions;
      }
    });
    return Array.from(map.values());
  }, [filteredCards]);

  const projectPieData = useMemo((): PieDataItem[] => {
    const map = new Map<string, number>();
    filteredCards.forEach(c => {
      const cur = map.get(c.categoryName) || 0;
      map.set(c.categoryName, cur + c.saleAmount);
    });
    const items = Array.from(map.entries()).map(([name, value], i) => ({
      name, value, color: PIE_COLORS[i % PIE_COLORS.length],
    }));
    const total = items.reduce((s, x) => s + x.value, 0);
    if (total > 0) {
      return items.map(x => ({ ...x, value: x.value, percent: x.value / total }));
    }
    return items;
  }, [filteredCards]);

  const consultantBarData = useMemo(() => {
    const map = new Map<string, { name: string; saleAmount: number; cardCount: number; unserved: number }>();
    filteredCards.forEach(c => {
      if (!map.has(c.consultantId)) {
        map.set(c.consultantId, { name: c.consultantName, saleAmount: 0, cardCount: 0, unserved: 0 });
      }
      const entry = map.get(c.consultantId)!;
      entry.saleAmount += c.saleAmount;
      entry.cardCount += 1;
      entry.unserved += c.remainingSessions;
    });
    return Array.from(map.values()).sort((a, b) => b.saleAmount - a.saleAmount).slice(0, 12);
  }, [filteredCards]);

  const dateTrendData = useMemo(() => {
    const bucket = new Map<string, { saleAmount: number; cardCount: number; unservedSessions: number }>();
    filteredCards.forEach(c => {
      const key = c.saleDate.slice(0, 7);
      if (!bucket.has(key)) bucket.set(key, { saleAmount: 0, cardCount: 0, unservedSessions: 0 });
      const e = bucket.get(key)!;
      e.saleAmount += c.saleAmount;
      e.cardCount += 1;
      e.unservedSessions += c.remainingSessions;
    });
    const keys = Array.from(bucket.keys()).sort();
    return keys.map(k => {
      const e = bucket.get(k)!;
      const [y, m] = k.split('-');
      return {
        label: `${y.slice(2)}/${m}`,
        saleAmount: Math.round(e.saleAmount),
        cardCount: e.cardCount,
        unservedSessions: e.unservedSessions,
      };
    });
  }, [filteredCards]);

  const barDisplayData = useMemo(() => {
    if (statView === 'store') {
      return storeBarData.map(s => ({
        label: s.name.replace('旗舰店', '').replace('店', ''),
        value: s.saleAmount,
        cardCount: s.cardCount,
        unserved: s.unserved,
      }));
    }
    if (statView === 'consultant') {
      return consultantBarData.map(s => ({
        label: s.name,
        value: s.saleAmount,
        cardCount: s.cardCount,
        unserved: s.unserved,
      }));
    }
    const projMap = new Map<string, { saleAmount: number; cardCount: number; unserved: number }>();
    filteredCards.forEach(c => {
      if (!projMap.has(c.projectName)) {
        projMap.set(c.projectName, { saleAmount: 0, cardCount: 0, unserved: 0 });
      }
      const entry = projMap.get(c.projectName)!;
      entry.saleAmount += c.saleAmount;
      entry.cardCount += 1;
      entry.unserved += c.remainingSessions;
    });
    return Array.from(projMap.entries())
      .sort((a, b) => b[1].saleAmount - a[1].saleAmount)
      .slice(0, 12)
      .map(([label, data]) => ({ label, value: data.saleAmount, cardCount: data.cardCount, unserved: data.unserved }));
  }, [statView, storeBarData, consultantBarData, filteredCards]);

  const trendUnit: 'currency' | 'number' = trendMetric === 'saleAmount' ? 'currency' : 'number';

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
        projects={PROJECTS.map(p => ({ value: p.id, label: p.name }))}
        consultants={CONSULTANTS.map(c => ({ value: c.id, label: c.name }))}
        selectedStoreIds={filters.storeIds}
        selectedCategoryIds={filters.categoryIds}
        selectedProjectIds={filters.projectIds}
        selectedConsultantIds={filters.consultantIds}
        dateFrom={filters.dateFrom}
        dateTo={filters.dateTo}
        searchKeyword={filters.searchKeyword}
        onStoresChange={(ids) => setFilters({ storeIds: ids })}
        onCategoriesChange={(ids) => setFilters({ categoryIds: ids })}
        onProjectsChange={(ids) => setFilters({ projectIds: ids })}
        onConsultantsChange={(ids) => setFilters({ consultantIds: ids })}
        onDateFromChange={(v) => setFilters({ dateFrom: v })}
        onDateToChange={(v) => setFilters({ dateTo: v })}
        onSearchChange={(v) => setFilters({ searchKeyword: v })}
        onReset={resetFilters}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-5">
        <div className="xl:col-span-2 space-y-4">
          <div className="card">
            <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-200 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <BarChart3 size={16} className="text-primary-700" />
                <div className="section-title !mb-0">售卡金额多维统计</div>
                <span className="text-xs text-zinc-500 ml-1">
                  {filteredCards.length < courseCards.length
                    ? `筛选口径：${formatNumber(filteredCards.length)}/${formatNumber(courseCards.length)}张`
                    : '全量口径'}
                </span>
              </div>
              <div className="flex items-center rounded-lg border border-zinc-200 bg-white p-1">
                {([
                  { key: 'store', label: '门店维度', Icon: Store },
                  { key: 'project', label: '项目维度', Icon: Layers },
                  { key: 'consultant', label: '顾问维度', Icon: User2 },
                ] as { key: StatView; label: string; Icon: any }[]).map(({ key, label, Icon }) => (
                  <button
                    key={key}
                    onClick={() => setStatView(key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all
                      ${statView === key
                        ? 'text-white shadow-sm'
                        : 'text-zinc-600 hover:bg-zinc-50'}`}
                    style={statView === key ? { background: 'linear-gradient(135deg, #0F4C5C, #31828b)' } : {}}
                  >
                    <Icon size={13} /> {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4">
              <BarChartCard
                title=""
                subtitle=""
                data={barDisplayData}
                unit="currency"
                height={260}
                showLegend
                legendItems={[
                  { color: '#0F4C5C', label: '售卡金额' },
                  { color: '#E36414', label: '未服务次数' },
                ]}
                extraData={barDisplayData.map(d => ({
                  unserved: d.unserved,
                  cardCount: d.cardCount,
                }))}
              />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-200 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <LineChartIcon size={16} className="text-primary-700" />
                <div className="section-title !mb-0">成交日期趋势</div>
              </div>
              <div className="flex items-center rounded-lg border border-zinc-200 bg-white p-1">
                {([
                  { key: 'saleAmount', label: '售卡金额(¥)', Icon: Banknote },
                  { key: 'cardCount', label: '售卡数量(张)', Icon: CreditCard },
                  { key: 'unservedSessions', label: '未服务次数', Icon: Clock },
                ] as { key: TrendMetric; label: string; Icon: any }[]).map(({ key, label, Icon }) => (
                  <button
                    key={key}
                    onClick={() => setTrendMetric(key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all
                      ${trendMetric === key
                        ? 'text-white shadow-sm'
                        : 'text-zinc-600 hover:bg-zinc-50'}`}
                    style={trendMetric === key ? { background: 'linear-gradient(135deg, #E36414, #f4a261)' } : {}}
                  >
                    <Icon size={13} /> {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4">
              <LineChartCard
                title=""
                subtitle={<span className="flex items-center gap-1"><CalendarRange size={12} /> 按月汇总，成交日期口径</span>}
                data={dateTrendData}
                unit={trendUnit}
                height={240}
                dataKey={trendMetric}
                lineColor={trendMetric === 'saleAmount' ? '#0F4C5C' : trendMetric === 'cardCount' ? '#E36414' : '#2A9D8F'}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <PieChartCard
            title="项目类别售卡占比"
            data={projectPieData}
            height={280}
            subtitle={<span className="flex items-center gap-1"><Layers size={12} /> 当前筛选口径下占比</span>}
          />
          <div className="card p-4">
            <div className="section-title flex items-center gap-2 mb-3">
              <User2 size={15} className="text-primary-700" />
              顾问售卡 Top 8
              <span className="text-xs text-zinc-400 ml-auto font-normal">未服务 / 售卡数</span>
            </div>
            <div className="space-y-2.5">
              {consultantBarData.slice(0, 8).map((c, i) => {
                const total = (c.cardCount + c.unserved) || 1;
                const unservedPct = c.unserved / total;
                return (
                  <div key={c.name} className="flex items-center gap-3">
                    <span className="w-5 text-center text-xs font-bold text-zinc-400 shrink-0">{i + 1}</span>
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                      {c.name.slice(0, 1)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-zinc-800 truncate">{c.name}</span>
                        <span className="font-mono text-primary-700 font-semibold ml-2 shrink-0">{formatCurrencyCompact(c.saleAmount)}</span>
                      </div>
                      <div className="relative h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                        <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full" style={{ width: `${(1 - unservedPct) * 100}%` }} />
                        <div className={`absolute inset-y-0 right-0 rounded-full ${unservedPct > 0.4 ? 'bg-accent-500' : 'bg-accent-300'}`} style={{ width: `${unservedPct * 100}%` }} />
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5 flex justify-between">
                        <span>已核销 <b className="text-emerald-600">{formatNumber(c.cardCount - (c.unserved > c.cardCount ? 0 : c.cardCount - (c.unserved > c.cardCount ? 0 : c.unserved)))}</b></span>
                        <span>未服务 <b className="text-accent-600">{formatNumber(c.unserved)}</b></span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {consultantBarData.length === 0 && (
                <div className="text-center py-8 text-zinc-400 text-xs">暂无数据</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 flex-wrap gap-3">
          <div>
            <div className="section-title">疗程卡明细表</div>
            <div className="text-xs text-zinc-500 mt-1">
              当前筛选共 <span className="font-semibold text-zinc-800">{formatNumber(filteredCards.length)}</span> 条记录
              · 售卡 <span className="font-semibold text-primary-700">{formatCurrencyCompact(computedStats.totalSaleAmount)}</span>
              · 待履约 <span className="font-semibold text-accent-600">{formatCurrencyCompact(computedStats.totalPendingAmount)}</span>
              · 未服务 <span className="font-semibold text-accent-600">{formatNumber(computedStats.totalUnservedSessions)}次</span>
            </div>
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
              {filteredCards.slice(0, 50).map((c) => {
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
