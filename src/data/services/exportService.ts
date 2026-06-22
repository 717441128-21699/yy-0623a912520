import * as XLSX from 'xlsx';
import type { CourseCard, RedemptionRecord, RiskCard, StoreReconSummary, ApprovalRequest, Consultant } from '@/shared/types';
import { formatCurrency, formatDate, formatDateTime, formatPercent } from '@/utils/formatters';

const downloadWorkbook = (wb: XLSX.WorkBook, filename: string) => {
  XLSX.writeFile(wb, filename);
};

const jsonToSheet = <T>(data: T[], columns: { key: keyof T | string; label: string; formatter?: (v: any, row: T) => string }[]): XLSX.WorkSheet => {
  const rows = data.map((row) => {
    const obj: Record<string, any> = {};
    columns.forEach((col) => {
      const val = typeof col.key === 'string' && !(col.key in (row as any))
        ? ''
        : (row as any)[col.key as string];
      obj[col.label] = col.formatter ? col.formatter(val, row) : val;
    });
    return obj;
  });
  return XLSX.utils.json_to_sheet(rows);
};

export const exportPendingBalance = (cards: CourseCard[], periodLabel: string) => {
  const wb = XLSX.utils.book_new();
  const pendingCards = cards.filter(c => c.remainingSessions > 0);
  const ws = jsonToSheet(pendingCards, [
    { key: 'cardNo', label: '卡号' },
    { key: 'customerName', label: '顾客姓名' },
    { key: 'storeName', label: '购买门店' },
    { key: 'consultantName', label: '销售顾问' },
    { key: 'categoryName', label: '项目类别' },
    { key: 'projectName', label: '项目名称' },
    { key: 'saleDate', label: '成交日期', formatter: (v) => formatDate(v) },
    { key: 'saleAmount', label: '销售金额', formatter: (v) => formatCurrency(v) },
    { key: 'totalSessions', label: '总次数' },
    { key: 'usedSessions', label: '已核销次数' },
    { key: 'remainingSessions', label: '剩余次数' },
    { key: 'unitPrice', label: '单次折算价', formatter: (v) => formatCurrency(v) },
    { key: 'redeemedAmount', label: '已核销金额', formatter: (v) => formatCurrency(v) },
    { key: 'pendingAmount', label: '待履约金额', formatter: (v) => formatCurrency(v) },
    { key: 'expiryDate', label: '到期日期', formatter: (v) => formatDate(v) },
  ]);
  XLSX.utils.book_append_sheet(wb, ws, '未履约余额明细');

  const totalRow = {
    '汇总': '合计',
    '卡号': '',
    '顾客姓名': `共${pendingCards.length}张卡`,
    '销售金额': formatCurrency(pendingCards.reduce((s, c) => s + c.saleAmount, 0)),
    '总次数': pendingCards.reduce((s, c) => s + c.totalSessions, 0),
    '已核销次数': pendingCards.reduce((s, c) => s + c.usedSessions, 0),
    '剩余次数': pendingCards.reduce((s, c) => s + c.remainingSessions, 0),
    '已核销金额': formatCurrency(pendingCards.reduce((s, c) => s + c.redeemedAmount, 0)),
    '待履约金额': formatCurrency(pendingCards.reduce((s, c) => s + c.pendingAmount, 0)),
  };
  XLSX.utils.sheet_add_json(ws, [totalRow], { skipHeader: true, origin: -1 });

  downloadWorkbook(wb, `未履约余额表_${periodLabel}.xlsx`);
};

export const exportConsultantUnconsumed = (cards: CourseCard[], consultants: Consultant[], periodLabel: string) => {
  const wb = XLSX.utils.book_new();
  const rows = consultants.map((c) => {
    const consultantCards = cards.filter((card) => card.consultantId === c.id);
    const cardCount = consultantCards.length;
    const totalSale = consultantCards.reduce((s, card) => s + card.saleAmount, 0);
    const totalPendingAmount = consultantCards.reduce((s, card) => s + card.pendingAmount, 0);
    const totalPendingSessions = consultantCards.reduce((s, card) => s + card.remainingSessions, 0);
    const totalRedeemed = consultantCards.reduce((s, card) => s + card.redeemedAmount, 0);
    const consumedRate = totalSale > 0 ? totalRedeemed / totalSale : 0;
    return {
      consultantName: c.name,
      storeName: consultantCards[0]?.storeName || '-',
      cardCount,
      totalSale: formatCurrency(totalSale),
      totalRedeemed: formatCurrency(totalRedeemed),
      totalPendingAmount: formatCurrency(totalPendingAmount),
      totalPendingSessions,
      consumedRate: formatPercent(consumedRate),
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows, {
    header: ['consultantName', 'storeName', 'cardCount', 'totalSale', 'totalRedeemed',
      'totalPendingAmount', 'totalPendingSessions', 'consumedRate'],
  });
  XLSX.utils.sheet_add_aoa(ws, [
    ['顾问姓名', '所属门店', '售卡数(张)', '售卡总金额', '已核销金额',
      '待履约金额', '未服务次数', '消耗率'],
  ], { origin: 'A1' });
  XLSX.utils.book_append_sheet(wb, ws, '顾问售卡未消耗');
  downloadWorkbook(wb, `顾问售卡未消耗表_${periodLabel}.xlsx`);
};

export const exportStoreRedemptionRanking = (summaries: StoreReconSummary[], periodLabel: string) => {
  const wb = XLSX.utils.book_new();
  const sorted = [...summaries].sort((a, b) => b.currentPeriodRedeemed - a.currentPeriodRedeemed);
  const rows = sorted.map((s, i) => ({
    rank: i + 1,
    storeName: s.storeName,
    openingBalance: formatCurrency(s.openingBalance),
    currentPeriodSale: formatCurrency(s.currentPeriodSale),
    currentPeriodRedeemed: formatCurrency(s.currentPeriodRedeemed),
    pendingAmountTotal: formatCurrency(s.pendingAmountTotal),
    pendingSessionsTotal: s.pendingSessionsTotal,
    difference: formatCurrency(s.difference),
  }));
  const ws = XLSX.utils.json_to_sheet(rows, {
    header: ['rank', 'storeName', 'openingBalance', 'currentPeriodSale',
      'currentPeriodRedeemed', 'pendingAmountTotal', 'pendingSessionsTotal', 'difference'],
  });
  XLSX.utils.sheet_add_aoa(ws, [
    ['排名', '门店', '期初余额', '本期售卡', '本期核销金额',
      '期末未履约金额', '未服务总次数', '对账差异'],
  ], { origin: 'A1' });
  XLSX.utils.book_append_sheet(wb, ws, '门店核销排行');
  downloadWorkbook(wb, `门店核销排行_${periodLabel}.xlsx`);
};

export const exportMonthlyRevenue = (
  trend: { month: string; saleAmount: number; recognizedAmount: number }[],
  periodLabel: string
) => {
  const wb = XLSX.utils.book_new();
  const rows = trend.map((t) => ({
    month: t.month,
    saleAmount: formatCurrency(t.saleAmount),
    recognizedAmount: formatCurrency(t.recognizedAmount),
    difference: formatCurrency(t.saleAmount - t.recognizedAmount),
    recognitionRate: formatPercent(t.saleAmount > 0 ? t.recognizedAmount / t.saleAmount : 0),
  }));
  const ws = XLSX.utils.json_to_sheet(rows, {
    header: ['month', 'saleAmount', 'recognizedAmount', 'difference', 'recognitionRate'],
  });
  XLSX.utils.sheet_add_aoa(ws, [
    ['月份', '售卡收入(收付实现制)', '确认收入(权责发生制)', '差额', '收入确认率'],
  ], { origin: 'A1' });
  XLSX.utils.book_append_sheet(wb, ws, '月度收入确认');
  downloadWorkbook(wb, `月度收入确认表_${periodLabel}.xlsx`);
};

export const exportRiskSummary = (risks: RiskCard[], periodLabel: string) => {
  const wb = XLSX.utils.book_new();
  const ws = jsonToSheet(risks, [
    { key: 'cardNo', label: '卡号' },
    { key: 'customerName', label: '顾客姓名' },
    { key: 'riskType', label: '风险类型', formatter: (v) => (
      { longIdle: '长期未消费', frequentChange: '频繁改卡', manualDeduction: '手工补扣',
        negativeBalance: '负余次', expiredRedeemed: '过期核销' }[v as string] || v
    ) },
    { key: 'riskLevel', label: '风险等级', formatter: (v) => (
      { high: '高', medium: '中', low: '低' }[v as string] || v
    ) },
    { key: 'involvedAmount', label: '涉及金额', formatter: (v) => formatCurrency(v) },
    { key: 'involvedSessions', label: '涉及次数' },
    { key: 'firstOccurDate', label: '首次发现', formatter: (v) => formatDate(v) },
    { key: 'lastUpdateDate', label: '最近更新', formatter: (v) => formatDateTime(v) },
    { key: 'processingStatus', label: '处理状态', formatter: (v) => (
      { pending: '待处理', reviewing: '审核中', resolved: '已解决', ignored: '已忽略' }[v as string] || v
    ) },
    { key: 'assignee', label: '处理人' },
    { key: 'description', label: '风险描述' },
  ]);
  XLSX.utils.book_append_sheet(wb, ws, '风险卡汇总');
  downloadWorkbook(wb, `风险卡汇总表_${periodLabel}.xlsx`);
};

export const exportRedemptionFlow = (records: RedemptionRecord[], periodLabel: string) => {
  const wb = XLSX.utils.book_new();
  const ws = jsonToSheet(records, [
    { key: 'redemptionNo', label: '核销单号' },
    { key: 'cardNo', label: '卡号' },
    { key: 'customerName', label: '顾客姓名' },
    { key: 'storeName', label: '门店' },
    { key: 'projectName', label: '项目' },
    { key: 'sessions', label: '核销次数' },
    { key: 'amount', label: '核销金额', formatter: (v) => formatCurrency(v) },
    { key: 'receptionistName', label: '前台登记' },
    { key: 'receptionRecordId', label: '前台记录号' },
    { key: 'cashierName', label: '收银员' },
    { key: 'receiptNo', label: '收银单号' },
    { key: 'therapistName', label: '治疗师' },
    { key: 'treatmentNo', label: '治疗单号' },
    { key: 'operationTime', label: '操作时间', formatter: (v) => formatDateTime(v) },
    { key: 'tripartiteConsistent', label: '三方一致', formatter: (v) => v ? '是' : '否' },
    { key: 'isManual', label: '手工操作', formatter: (v) => v ? '是' : '否' },
    { key: 'remark', label: '备注' },
  ]);
  XLSX.utils.book_append_sheet(wb, ws, '核销流水明细');
  downloadWorkbook(wb, `核销流水_${periodLabel}.xlsx`);
};
