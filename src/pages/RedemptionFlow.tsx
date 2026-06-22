import React, { useMemo, useState } from 'react';
import {
  FileClock, CheckCircle2, XCircle, ChevronDown, ChevronUp, Eye,
  AlertTriangle, Receipt, ClipboardList, UserCheck, Zap,
} from 'lucide-react';
import { useAppStore, STORES } from '@/store/useAppStore';
import { FilterBar } from '@/components/common/FilterBar';
import { ConsistencyBadge } from '@/components/common/StatusBadge';
import { Modal } from '@/components/common/Modal';
import {
  formatCurrency, formatCurrencyCompact, formatDate, formatDateTime, formatNumber,
} from '@/utils/formatters';
import { getInconsistencyDetail } from '@/data/factories/redemptionFactory';
import type { RedemptionRecord } from '@/shared/types';

export const RedemptionFlow: React.FC = () => {
  const { redemptionRecords, filters, setFilters, resetFilters } = useAppStore();
  const [onlyInconsistent, setOnlyInconsistent] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailRecord, setDetailRecord] = useState<RedemptionRecord | null>(null);

  const filteredRecords = useMemo(() => {
    const kw = filters.searchKeyword.trim().toLowerCase();
    return redemptionRecords.filter(r => {
      if (filters.storeIds.length > 0 && !filters.storeIds.includes(r.storeId)) return false;
      const opDate = r.operationTime.split('T')[0];
      if (opDate < filters.dateFrom || opDate > filters.dateTo) return false;
      if (onlyInconsistent && r.tripartiteConsistent) return false;
      if (kw) {
        const haystack = (r.redemptionNo + r.cardNo + r.customerName + r.projectName +
          r.receptionistName + r.cashierName + r.therapistName).toLowerCase();
        if (!haystack.includes(kw)) return false;
      }
      return true;
    });
  }, [redemptionRecords, filters, onlyInconsistent]);

  const stats = useMemo(() => {
    const total = filteredRecords.length;
    const inconsistent = filteredRecords.filter(r => !r.tripartiteConsistent).length;
    const manual = filteredRecords.filter(r => r.isManual).length;
    const amount = filteredRecords.reduce((s, r) => s + r.amount, 0);
    const sessions = filteredRecords.reduce((s, r) => s + r.sessions, 0);
    return { total, inconsistent, manual, amount, sessions,
      consistentRate: total > 0 ? (total - inconsistent) / total : 1 };
  }, [filteredRecords]);

  const detail = detailRecord ? getInconsistencyDetail(detailRecord) : null;

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-5">
        <div className="card p-4 stagger-enter" style={{ animationDelay: '0ms' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center shrink-0">
              <FileClock size={18} />
            </div>
            <div className="min-w-0">
              <div className="stat-label">核销流水总数</div>
              <div className="stat-value text-xl">{formatNumber(stats.total)}</div>
            </div>
          </div>
        </div>
        <div className="card p-4 stagger-enter" style={{ animationDelay: '50ms' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Zap size={18} />
            </div>
            <div className="min-w-0">
              <div className="stat-label">核销总金额</div>
              <div className="stat-value text-xl">{formatCurrencyCompact(stats.amount)}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{formatNumber(stats.sessions)} 次服务</div>
            </div>
          </div>
        </div>
        <div className="card p-4 stagger-enter" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div className="min-w-0">
              <div className="stat-label">三方一致率</div>
              <div className="stat-value text-xl">{(stats.consistentRate * 100).toFixed(1)}%</div>
              <div className="mt-1.5 progress-track">
                <div
                  className="progress-fill bg-gradient-to-r from-emerald-400 to-emerald-600"
                  style={{ width: `${stats.consistentRate * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="card p-4 stagger-enter" style={{ animationDelay: '150ms' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <AlertTriangle size={18} />
            </div>
            <div className="min-w-0">
              <div className="stat-label">存在差异</div>
              <div className="stat-value text-xl text-red-600">{formatNumber(stats.inconsistent)}</div>
              <div className="text-xs text-zinc-500 mt-0.5">需财务核对处理</div>
            </div>
          </div>
        </div>
        <div className="card p-4 stagger-enter" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center shrink-0">
              <UserCheck size={18} />
            </div>
            <div className="min-w-0">
              <div className="stat-label">手工补扣记录</div>
              <div className="stat-value text-xl text-accent-600">{formatNumber(stats.manual)}</div>
              <div className="text-xs text-zinc-500 mt-0.5">建议重点核查</div>
            </div>
          </div>
        </div>
      </div>

      <FilterBar
        stores={STORES.map(s => ({ value: s.id, label: s.name }))}
        categories={[]}
        projects={[]}
        consultants={[]}
        selectedStoreIds={filters.storeIds}
        selectedCategoryIds={[]}
        selectedProjectIds={[]}
        selectedConsultantIds={[]}
        dateFrom={filters.dateFrom}
        dateTo={filters.dateTo}
        searchKeyword={filters.searchKeyword}
        onStoresChange={(ids) => setFilters({ storeIds: ids })}
        onCategoriesChange={() => {}}
        onProjectsChange={() => {}}
        onConsultantsChange={() => {}}
        onDateFromChange={(v) => setFilters({ dateFrom: v })}
        onDateToChange={(v) => setFilters({ dateTo: v })}
        onSearchChange={(v) => setFilters({ searchKeyword: v })}
        onReset={resetFilters}
        showConsultant={false}
        extraFilters={
          <label className="flex items-center gap-2 px-3 py-2 rounded-md border border-zinc-300 bg-white hover:border-primary-400 cursor-pointer transition-all">
            <input
              type="checkbox"
              checked={onlyInconsistent}
              onChange={(e) => setOnlyInconsistent(e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded border-zinc-300 focus:ring-primary-500"
            />
            <span className="text-sm text-zinc-700">仅看差异记录</span>
          </label>
        }
      />

      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 flex-wrap gap-3">
          <div>
            <div className="section-title flex items-center gap-2">
              <FileClock size={16} className="text-primary-600" />
              核销流水明细
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              共 <span className="font-semibold text-zinc-800">{formatNumber(filteredRecords.length)}</span> 条核销记录
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 text-zinc-600">
              <Receipt size={13} /> 前台
            </span>
            <span className="text-zinc-300">+</span>
            <span className="flex items-center gap-1 text-zinc-600">
              <ClipboardList size={13} /> 收银
            </span>
            <span className="text-zinc-300">+</span>
            <span className="flex items-center gap-1 text-zinc-600">
              <UserCheck size={13} /> 治疗
            </span>
            <span className="text-zinc-400 ml-1">= 三方核对</span>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[1700px]">
            <thead className="table-head">
              <tr>
                <th className="table-cell w-10"></th>
                <th className="table-cell">核销单号</th>
                <th className="table-cell">顾客 / 卡号</th>
                <th className="table-cell">门店</th>
                <th className="table-cell">项目</th>
                <th className="table-cell text-right">次数</th>
                <th className="table-cell text-right">核销金额</th>
                <th className="table-cell">前台 / 记录号</th>
                <th className="table-cell">收银 / 单号</th>
                <th className="table-cell">治疗师 / 治疗单</th>
                <th className="table-cell">操作时间</th>
                <th className="table-cell w-28 text-center">一致性</th>
                <th className="table-cell w-24 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.slice(0, 80).map((r) => {
                const expanded = expandedId === r.id;
                return (
                  <React.Fragment key={r.id}>
                    <tr
                      className={`table-row ${!r.tripartiteConsistent ? 'bg-accent-50/40 hover:bg-accent-50/60' : ''} ${r.isManual ? 'ring-1 ring-inset ring-accent-200/50' : ''}`}
                    >
                      <td className="table-cell">
                        <button
                          className="p-1 rounded hover:bg-zinc-100 text-zinc-400 transition"
                          onClick={() => setExpandedId(expanded ? null : r.id)}
                        >
                          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </td>
                      <td className="table-cell font-mono text-primary-700 font-medium">{r.redemptionNo}</td>
                      <td className="table-cell">
                        <div className="font-medium text-zinc-900">{r.customerName}</div>
                        <div className="text-xs text-zinc-500 font-mono mt-0.5">{r.cardNo}</div>
                      </td>
                      <td className="table-cell text-zinc-700">{r.storeName}</td>
                      <td className="table-cell text-zinc-700">{r.projectName}</td>
                      <td className="table-cell text-right font-semibold text-zinc-800">{r.sessions}</td>
                      <td className="table-cell text-right font-semibold text-emerald-700">{formatCurrency(r.amount)}</td>
                      <td className="table-cell">
                        <div className="text-zinc-800">{r.receptionistName}</div>
                        <div className={`text-xs font-mono ${r.receptionRecordId ? 'text-zinc-500' : 'text-red-500'}`}>
                          {r.receptionRecordId || '缺失'}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="text-zinc-800">{r.cashierName}</div>
                        <div className={`text-xs font-mono ${r.receiptNo ? 'text-zinc-500' : 'text-red-500'}`}>
                          {r.receiptNo || '缺失'}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="text-zinc-800">{r.therapistName}</div>
                        <div className={`text-xs font-mono ${r.treatmentNo ? 'text-zinc-500' : 'text-red-500'}`}>
                          {r.treatmentNo || '缺失'}
                        </div>
                      </td>
                      <td className="table-cell text-zinc-700">{formatDateTime(r.operationTime)}</td>
                      <td className="table-cell text-center">
                        <ConsistencyBadge consistent={r.tripartiteConsistent} />
                        {r.isManual && (
                          <div className="mt-1">
                            <span className="badge-orange !text-[10px]">手工</span>
                          </div>
                        )}
                      </td>
                      <td className="table-cell text-center">
                        <button
                          onClick={() => setDetailRecord(r)}
                          className="inline-flex items-center gap-1 text-xs text-primary-700 hover:text-primary-800 font-medium px-2 py-1 rounded hover:bg-primary-50 transition"
                        >
                          <Eye size={12} /> 详情
                        </button>
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="bg-zinc-50/80">
                        <td colSpan={13} className="!py-0">
                          <div className="px-12 py-4 text-sm border-l-4 border-primary-300">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <div className="label-text">前台记录</div>
                                <div className="font-medium text-zinc-800">
                                  {r.receptionRecordId ? `${r.receptionRecordId} · ${r.sessions}次 · ${formatCurrency(r.amount)}` : '缺失'}
                                </div>
                              </div>
                              <div>
                                <div className="label-text">收银单</div>
                                <div className="font-medium text-zinc-800">
                                  {r.receiptNo ? `${r.receiptNo} · ${r.cashierName}` : '缺失'}
                                </div>
                              </div>
                              <div>
                                <div className="label-text">治疗单</div>
                                <div className="font-medium text-zinc-800">
                                  {r.treatmentNo ? `${r.treatmentNo} · ${r.therapistName}` : '缺失'}
                                </div>
                              </div>
                            </div>
                            {(r.remark || r.isManual) && (
                              <div className="mt-3 pt-3 border-t border-zinc-200">
                                <div className="label-text">备注说明</div>
                                <div className="text-zinc-700">
                                  {r.remark || (r.isManual ? '此核销为系统外手工补扣，请复核原始凭证' : '无')}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={13} className="table-cell text-center py-16 text-zinc-400">
                    暂无符合条件的核销记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={!!detailRecord}
        onClose={() => setDetailRecord(null)}
        title={
          <div className="flex items-center gap-2">
            {detailRecord && detailRecord.tripartiteConsistent
              ? <CheckCircle2 size={18} className="text-emerald-600" />
              : <XCircle size={18} className="text-red-600" />}
            <span>核销单三方比对 · {detailRecord?.redemptionNo}</span>
          </div>
        }
        size="xl"
        footer={
          <button onClick={() => setDetailRecord(null)} className="btn-primary">
            已核对，关闭
          </button>
        }
      >
        {detailRecord && detail && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-zinc-50 border border-zinc-200">
              <div>
                <div className="label-text">顾客姓名</div>
                <div className="font-semibold text-zinc-900">{detailRecord.customerName}</div>
              </div>
              <div>
                <div className="label-text">关联卡号</div>
                <div className="font-mono text-primary-700 font-medium">{detailRecord.cardNo}</div>
              </div>
              <div>
                <div className="label-text">项目</div>
                <div className="text-zinc-900">{detailRecord.projectName}</div>
              </div>
              <div>
                <div className="label-text">核销时间</div>
                <div className="text-zinc-900">{formatDateTime(detailRecord.operationTime)}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { key: 'reception', label: '前台登记', icon: Receipt, data: detail.reception, idKey: 'recordId' },
                { key: 'receipt', label: '收银单', icon: ClipboardList, data: detail.receipt, idKey: 'receiptNo' },
                { key: 'treatment', label: '治疗单', icon: UserCheck, data: detail.treatment, idKey: 'treatmentNo' },
              ].map((col: any) => (
                <div key={col.key}
                  className={`border rounded-xl p-4 transition-all ${
                    col.data.exists
                      ? 'border-emerald-200 bg-emerald-50/40'
                      : 'border-red-200 bg-red-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <col.icon size={16} className={col.data.exists ? 'text-emerald-600' : 'text-red-500'} />
                      <span className="text-sm font-semibold text-zinc-800">{col.label}</span>
                    </div>
                    {col.data.exists ? (
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    ) : (
                      <XCircle size={16} className="text-red-500" />
                    )}
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">单号</span>
                      <span className={`font-mono ${col.data.exists ? 'text-zinc-800' : 'text-red-600'}`}>
                        {col.data[col.idKey] || '未关联'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">次数</span>
                      <span className="text-zinc-800 font-medium">{col.data.sessions || '-'} 次</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">金额</span>
                      <span className="text-zinc-800 font-medium">{formatCurrency(col.data.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">时间</span>
                      <span className="text-zinc-700">{col.data.time !== '-' ? formatDateTime(col.data.time) : '-'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {detail.mismatches.length > 0 && (
              <div className="border border-red-200 bg-red-50/60 rounded-xl p-4">
                <div className="flex items-center gap-2 text-red-700 font-semibold mb-2">
                  <AlertTriangle size={16} />
                  差异说明（{detail.mismatches.length}项）
                </div>
                <ul className="space-y-1.5 pl-6 list-disc text-sm text-red-700/90">
                  {detail.mismatches.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
                <div className="mt-4 pt-3 border-t border-red-200/60">
                  <div className="label-text !text-red-500">财务处理意见（留痕）</div>
                  <textarea
                    rows={3}
                    placeholder="请输入核对意见与处理方案..."
                    className="input mt-1"
                  />
                </div>
              </div>
            )}

            {detail.mismatches.length === 0 && (
              <div className="border border-emerald-200 bg-emerald-50/60 rounded-xl p-4">
                <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                  <CheckCircle2 size={16} />
                  三方单据信息一致，核销合规
                </div>
                <div className="mt-1 text-xs text-emerald-700/70">
                  前台记录号、收银单号、治疗单号齐全，次数与金额三方完全匹配
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
