import React, { useMemo, useState } from 'react';
import {
  Download, FileSpreadsheet, FileText, Users, Store, TrendingUp, ShieldAlert,
  History, CheckCircle2, XCircle, Clock, AlertTriangle, FileDown, ArrowRight,
  MessageSquare, RotateCcw, Repeat, DollarSign,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { StatCard } from '@/components/common/StatCard';
import { ApprovalStatusBadge } from '@/components/common/StatusBadge';
import { Modal } from '@/components/common/Modal';
import {
  formatCurrency, formatCurrencyCompact, formatNumber, formatDate, formatDateTime,
} from '@/utils/formatters';
import type { ApprovalRequest, ApprovalStatus } from '@/shared/types';
import {
  exportPendingBalance, exportConsultantUnconsumed, exportStoreRedemptionRanking,
  exportMonthlyRevenue, exportRiskSummary, exportRedemptionFlow,
} from '@/data/services/exportService';
import { CONSULTANTS } from '@/data/seed/consultants';

const REPORT_CARDS = [
  { key: 'pending', label: '未履约余额表', desc: '所有剩余次数>0的疗程卡，含金额/次数/折算价', Icon: FileSpreadsheet, color: 'from-primary-500 to-primary-700', tag: '月末必出' },
  { key: 'consultant', label: '顾问售卡未消耗表', desc: '按顾问维度统计售卡金额、已核销、消耗率', Icon: Users, color: 'from-accent-500 to-accent-700', tag: '绩效参考' },
  { key: 'ranking', label: '门店核销排行', desc: '门店期初+本期售卡-核销=期末，附排名', Icon: Store, color: 'from-emerald-500 to-emerald-700', tag: '对账使用' },
  { key: 'revenue', label: '月度收入确认表', desc: '收付实现制vs权责发生制双口径对比分析', Icon: TrendingUp, color: 'from-indigo-500 to-indigo-700', tag: '财报用' },
  { key: 'risk', label: '风险卡汇总表', desc: '5类风险卡完整明细，含处理状态/处理人/处理轨迹', Icon: ShieldAlert, color: 'from-red-500 to-red-700', tag: '内控审计' },
  { key: 'flow', label: '核销流水明细', desc: '全量核销记录，附三方一致性标识和差异说明', Icon: FileText, color: 'from-violet-500 to-violet-700', tag: '审计追溯' },
];

export const ReportsExport: React.FC = () => {
  const {
    courseCards, storeReconSummaries, monthlyRevenueTrend, riskCards, redemptionRecords,
    approvalRequests, currentRole, selectedApproval, modalApprovalOpen,
    openApprovalDetail, closeApprovalDetail, submitApprovalOpinion,
  } = useAppStore();

  const periodLabel = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const approvalSummary = useMemo(() => {
    const pending = approvalRequests.filter(a => a.status === 'pending_finance' || a.status === 'pending_director').length;
    const totalRefund = approvalRequests.filter(a => a.type === 'refund').reduce((s, a) => s + a.amount, 0);
    const totalTransfer = approvalRequests.filter(a => a.type === 'transfer').reduce((s, a) => s + a.amount, 0);
    const approved = approvalRequests.filter(a => a.status === 'approved').length;
    return { pending, totalRefund, totalTransfer, approved, total: approvalRequests.length };
  }, [approvalRequests]);

  const [financeOpinion, setFinanceOpinion] = useState('');
  const [directorOpinion, setDirectorOpinion] = useState('');

  const handleExport = (key: string) => {
    switch (key) {
      case 'pending': exportPendingBalance(courseCards, periodLabel); break;
      case 'consultant': exportConsultantUnconsumed(courseCards, CONSULTANTS, periodLabel); break;
      case 'ranking': exportStoreRedemptionRanking(storeReconSummaries, periodLabel); break;
      case 'revenue': exportMonthlyRevenue(monthlyRevenueTrend, periodLabel); break;
      case 'risk': exportRiskSummary(riskCards, periodLabel); break;
      case 'flow': exportRedemptionFlow(redemptionRecords, periodLabel); break;
    }
  };

  const handleApprove = (level: 'finance' | 'director') => {
    if (!selectedApproval) return;
    const opinion = level === 'finance' ? financeOpinion : directorOpinion;
    if (!opinion.trim()) return;
    submitApprovalOpinion(selectedApproval.id, level, true, opinion);
    setFinanceOpinion('');
    setDirectorOpinion('');
    closeApprovalDetail();
  };

  const handleReject = (level: 'finance' | 'director') => {
    if (!selectedApproval) return;
    const opinion = level === 'finance' ? financeOpinion : directorOpinion;
    if (!opinion.trim()) return;
    submitApprovalOpinion(selectedApproval.id, level, false, opinion);
    setFinanceOpinion('');
    setDirectorOpinion('');
    closeApprovalDetail();
  };

  const sel = selectedApproval;

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        <StatCard
          label="待审批申请"
          value={formatNumber(approvalSummary.pending)}
          subValue={`共${approvalSummary.total}笔历史申请`}
          icon={<Clock size={20} />}
          iconBg="bg-accent-50 text-accent-700"
          delay={0}
        />
        <StatCard
          label="申请退款金额"
          value={formatCurrencyCompact(approvalSummary.totalRefund)}
          subValue="需严格审批留痕"
          icon={<DollarSign size={20} />}
          iconBg="bg-red-50 text-red-700"
          delay={40}
        />
        <StatCard
          label="转卡涉及金额"
          value={formatCurrencyCompact(approvalSummary.totalTransfer)}
          subValue="门店间流转"
          icon={<Repeat size={20} />}
          iconBg="bg-indigo-50 text-indigo-700"
          delay={80}
        />
        <StatCard
          label="本月已通过"
          value={formatNumber(approvalSummary.approved)}
          subValue="财务+院长双审批"
          icon={<CheckCircle2 size={20} />}
          iconBg="bg-emerald-50 text-emerald-700"
          delay={120}
        />
      </div>

      <div className="card mb-5">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 flex-wrap gap-3">
          <div>
            <div className="section-title flex items-center gap-2">
              <FileDown size={16} className="text-primary-600" />
              月末报表导出
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              当前期间：{periodLabel.slice(0, 4)}年{periodLabel.slice(4)}月 · 所有报表均为Excel格式，含完整表头和合计行
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => REPORT_CARDS.forEach(c => handleExport(c.key))}
              className="btn-ghost"
            >
              <Download size={14} /> 一键全部导出
            </button>
          </div>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {REPORT_CARDS.map((c) => (
            <div
              key={c.key}
              className="group relative rounded-xl border border-zinc-200 hover:border-primary-300 transition-all p-4 bg-white hover:shadow-md overflow-hidden"
            >
              <div className={`absolute -right-8 -top-8 w-24 h-24 rounded-full bg-gradient-to-br ${c.color} opacity-10 group-hover:opacity-20 transition`} />
              <div className="relative">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} text-white flex items-center justify-center shadow-sm`}>
                    <c.Icon size={20} />
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-medium">
                    {c.tag}
                  </span>
                </div>
                <div className="font-semibold text-zinc-900 text-base mb-1">{c.label}</div>
                <div className="text-xs text-zinc-500 mb-3 leading-relaxed min-h-[32px]">{c.desc}</div>
                <button
                  onClick={() => handleExport(c.key)}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 transition"
                >
                  <Download size={14} /> 导出 Excel
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 flex-wrap gap-3">
          <div>
            <div className="section-title flex items-center gap-2">
              <History size={16} className="text-primary-600" />
              退款 / 转卡审批列表
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              所有退款与转卡操作均需填写<b className="text-red-600">审批意见</b>，财务初审 → 院长终审，二级审批留痕不可修改
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400"></span> 待财务</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> 待院长</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> 已通过</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> 已驳回</span>
          </div>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[1200px]">
            <thead className="table-head">
              <tr>
                <th className="table-cell">申请单号 / 类型</th>
                <th className="table-cell">卡号 / 顾客</th>
                <th className="table-cell text-right">涉及金额</th>
                <th className="table-cell text-right">涉及次数</th>
                <th className="table-cell">申请人</th>
                <th className="table-cell">申请时间</th>
                <th className="table-cell w-40">申请原因</th>
                <th className="table-cell w-40 text-center">审批进度</th>
                <th className="table-cell w-28 text-center">状态</th>
                <th className="table-cell w-24 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {approvalRequests.map((a) => (
                <tr key={a.id} className="table-row group">
                  <td className="table-cell">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0
                        ${a.type === 'refund' ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
                        {a.type === 'refund' ? <RotateCcw size={16} /> : <Repeat size={16} />}
                      </div>
                      <div>
                        <div className="font-mono text-sm text-primary-700 font-medium">{a.requestNo}</div>
                        <div className="text-xs mt-0.5">
                          <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium
                            ${a.type === 'refund' ? 'bg-red-50 text-red-700' : 'bg-indigo-50 text-indigo-700'}`}>
                            {a.type === 'refund' ? '退款申请' : '转卡申请'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="font-mono text-sm text-zinc-800">{a.cardNo}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">{a.customerName}</div>
                  </td>
                  <td className="table-cell text-right">
                    <span className={`font-mono font-semibold
                      ${a.type === 'refund' ? 'text-red-700' : 'text-indigo-700'}`}>
                      {a.type === 'refund' ? '-' : '±'}{formatCurrency(a.amount)}
                    </span>
                  </td>
                  <td className="table-cell text-right font-semibold text-zinc-800">{a.sessions}</td>
                  <td className="table-cell text-zinc-700 text-sm">{a.applicant}</td>
                  <td className="table-cell text-zinc-600 text-xs">{formatDateTime(a.applyTime)}</td>
                  <td className="table-cell">
                    <div className="text-xs text-zinc-600 max-w-[160px] truncate" title={a.reason}>
                      {a.reason}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px]
                          ${a.financeTime ? 'bg-emerald-500' : a.status === 'rejected' && !a.directorTime ? 'bg-red-500' : 'bg-zinc-300'}`}>
                          {a.financeTime ? <CheckCircle2 size={10} /> : a.status === 'rejected' && !a.directorTime ? <XCircle size={10} /> : '1'}
                        </div>
                        <span className={a.financeTime ? 'text-emerald-700 font-medium' : a.status === 'rejected' && !a.directorTime ? 'text-red-600 font-medium' : 'text-zinc-500'}>
                          财务审核
                        </span>
                        {a.financeTime && <span className="text-zinc-400 ml-auto">{formatDate(a.financeTime)}</span>}
                      </div>
                      <div className="w-full h-px bg-zinc-100 mx-2.5" />
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px]
                          ${a.directorTime ? (a.status === 'approved' ? 'bg-emerald-500' : 'bg-red-500') : a.status === 'pending_director' ? 'bg-yellow-500' : 'bg-zinc-300'}`}>
                          {a.directorTime ? (a.status === 'approved' ? <CheckCircle2 size={10} /> : <XCircle size={10} />) : '2'}
                        </div>
                        <span className={a.status === 'approved' ? 'text-emerald-700 font-medium' : a.status === 'rejected' && a.directorTime ? 'text-red-600 font-medium' : a.status === 'pending_director' ? 'text-yellow-700 font-medium' : 'text-zinc-500'}>
                          院长审批
                        </span>
                        {a.directorTime && <span className="text-zinc-400 ml-auto">{formatDate(a.directorTime)}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell text-center"><ApprovalStatusBadge status={a.status} /></td>
                  <td className="table-cell text-center">
                    {a.status === 'pending_finance' || a.status === 'pending_director' ? (
                      <button
                        onClick={() => openApprovalDetail(a)}
                        className="inline-flex items-center gap-1 text-xs text-primary-700 group-hover:text-primary-800 font-medium px-2 py-1 rounded group-hover:bg-primary-50 transition"
                      >
                        审批 <ArrowRight size={12} />
                      </button>
                    ) : (
                      <button
                        onClick={() => openApprovalDetail(a)}
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded transition group-hover:bg-zinc-50
                          ${a.status === 'approved' ? 'text-emerald-700' : 'text-red-700'}`}
                      >
                        查看 <History size={12} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modalApprovalOpen && !!sel}
        onClose={() => { closeApprovalDetail(); setFinanceOpinion(''); setDirectorOpinion(''); }}
        size="2xl"
        title={
          sel && (
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`px-2.5 py-1 rounded-md text-xs font-semibold
                ${sel.type === 'refund' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'}`}>
                {sel.type === 'refund' ? '退款申请' : '转卡申请'}
              </span>
              <span className="font-mono text-primary-700">{sel.requestNo}</span>
              <span className="text-zinc-500">·</span>
              <ApprovalStatusBadge status={sel.status} />
            </div>
          )
        }
      >
        {sel && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-xl bg-gradient-to-r from-zinc-50 to-primary-50/40 border border-zinc-200">
              <div>
                <div className="label-text">卡号 / 顾客</div>
                <div className="font-mono text-sm text-zinc-900 font-medium">{sel.cardNo}</div>
                <div className="text-xs text-zinc-500">{sel.customerName}</div>
              </div>
              <div>
                <div className="label-text">涉及金额</div>
                <div className={`text-lg font-bold ${sel.type === 'refund' ? 'text-red-700' : 'text-indigo-700'}`}>
                  {sel.type === 'refund' ? '-' : ''}{formatCurrency(sel.amount)}
                </div>
              </div>
              <div>
                <div className="label-text">涉及次数</div>
                <div className="text-lg font-bold text-zinc-800">{sel.sessions} 次</div>
              </div>
              <div>
                <div className="label-text">申请人 / 时间</div>
                <div className="text-sm font-medium text-zinc-800">{sel.applicant}</div>
                <div className="text-xs text-zinc-500">{formatDateTime(sel.applyTime)}</div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-l-4 border-primary-300 bg-primary-50/40">
              <div className="flex items-center gap-2 text-primary-700 font-semibold mb-1.5">
                <MessageSquare size={16} />
                申请原因
              </div>
              <div className="text-sm text-zinc-800 leading-relaxed">{sel.reason}</div>
            </div>

            {sel.financeOpinion && (
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
                    <CheckCircle2 size={14} /> 财务审核意见
                  </div>
                  <div className="text-xs text-zinc-500">
                    <span className="font-medium text-zinc-700">{sel.financeReviewer}</span> · {formatDateTime(sel.financeTime)}
                  </div>
                </div>
                <div className="text-sm text-zinc-800 bg-white rounded-lg px-3 py-2 border border-emerald-100">
                  {sel.status === 'rejected' && !sel.directorTime
                    ? <span className="text-red-700">【已驳回】</span>
                    : <span className="text-emerald-700">【审核通过，提交院长】</span>}
                  {sel.financeOpinion}
                </div>
              </div>
            )}

            {sel.directorOpinion && (
              <div className="p-4 rounded-xl border border-accent-200 bg-accent-50/40">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-accent-700 font-semibold text-sm">
                    <CheckCircle2 size={14} /> 院长审批意见
                  </div>
                  <div className="text-xs text-zinc-500">
                    <span className="font-medium text-zinc-700">{sel.directorReviewer}</span> · {formatDateTime(sel.directorTime)}
                  </div>
                </div>
                <div className="text-sm text-zinc-800 bg-white rounded-lg px-3 py-2 border border-accent-100">
                  {sel.status === 'rejected'
                    ? <span className="text-red-700">【终审驳回】</span>
                    : <span className="text-emerald-700">【终审通过】</span>}
                  {sel.directorOpinion}
                </div>
              </div>
            )}

            {sel.status === 'pending_finance' && currentRole === 'finance' && (
              <div className="pt-4 border-t border-zinc-200 space-y-3">
                <div>
                  <div className="label-text">
                    财务审核意见 <span className="text-red-500">*</span>
                    <span className="ml-2 text-zinc-400 font-normal">提交后将进入院长终审环节，意见不可修改</span>
                  </div>
                  <textarea
                    rows={3}
                    value={financeOpinion}
                    onChange={(e) => setFinanceOpinion(e.target.value)}
                    placeholder="请填写财务审核意见，例如：经核对金额与已核销部分无误，同意退款申请..."
                    className="input mt-1"
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button onClick={() => { closeApprovalDetail(); setFinanceOpinion(''); }} className="btn-ghost">取消</button>
                  <button
                    disabled={!financeOpinion.trim()}
                    onClick={() => handleReject('finance')}
                    className="btn-danger"
                  >
                    <XCircle size={14} /> 驳回申请
                  </button>
                  <button
                    disabled={!financeOpinion.trim()}
                    onClick={() => handleApprove('finance')}
                    className="btn-primary"
                  >
                    <CheckCircle2 size={14} /> 审核通过 → 送院长
                  </button>
                </div>
              </div>
            )}

            {sel.status === 'pending_director' && currentRole === 'director' && (
              <div className="pt-4 border-t border-zinc-200 space-y-3">
                <div>
                  <div className="label-text">
                    院长审批意见 <span className="text-red-500">*</span>
                    <span className="ml-2 text-zinc-400 font-normal">终审意见，不可修改，直接生效</span>
                  </div>
                  <textarea
                    rows={3}
                    value={directorOpinion}
                    onChange={(e) => setDirectorOpinion(e.target.value)}
                    placeholder="请填写院长终审意见，例如：同意转卡，建议跟进新门店履约安排..."
                    className="input mt-1"
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button onClick={() => { closeApprovalDetail(); setDirectorOpinion(''); }} className="btn-ghost">取消</button>
                  <button
                    disabled={!directorOpinion.trim()}
                    onClick={() => handleReject('director')}
                    className="btn-danger"
                  >
                    <XCircle size={14} /> 终审驳回
                  </button>
                  <button
                    disabled={!directorOpinion.trim()}
                    onClick={() => handleApprove('director')}
                    className="btn-primary"
                  >
                    <CheckCircle2 size={14} /> 终审通过
                  </button>
                </div>
              </div>
            )}

            {(sel.status === 'pending_finance' && currentRole !== 'finance') ||
             (sel.status === 'pending_director' && currentRole !== 'director') ? (
              <div className="p-4 rounded-xl border border-yellow-200 bg-yellow-50 flex items-center gap-3">
                <AlertTriangle size={20} className="text-yellow-600 shrink-0" />
                <div className="text-sm">
                  <div className="font-semibold text-yellow-800">审批权限提示</div>
                  <div className="text-yellow-700 mt-0.5">
                    {sel.status === 'pending_finance'
                      ? '当前申请待【财务】审核，请切换到财务视角或通知财务人员处理。'
                      : '当前申请待【院长】终审，请切换到院长视角或通知管理层审批。'}
                  </div>
                </div>
              </div>
            ) : null}

            {(sel.status === 'approved' || sel.status === 'rejected') && (
              <div className={`p-4 rounded-xl border flex items-center gap-3
                ${sel.status === 'approved' ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
                {sel.status === 'approved' ? (
                  <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                ) : (
                  <XCircle size={20} className="text-red-600 shrink-0" />
                )}
                <div className="text-sm">
                  <div className={`font-semibold ${sel.status === 'approved' ? 'text-emerald-800' : 'text-red-800'}`}>
                    审批已完成 · {sel.status === 'approved' ? '申请通过' : '申请已驳回'}
                  </div>
                  <div className={`mt-0.5 ${sel.status === 'approved' ? 'text-emerald-700' : 'text-red-700'}`}>
                    所有审批意见已永久留痕，可在审计日志中追溯查询
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
