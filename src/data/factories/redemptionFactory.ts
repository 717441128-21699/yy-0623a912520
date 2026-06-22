import type { RedemptionRecord, InconsistencyDetail, MonthlyRevenueTrend, RevenueBreakdown } from '@/shared/types';
import type { CourseCard } from '@/shared/types';
import { STORES } from '../seed/stores';
import { PROJECTS } from '../seed/projects';
import { RECEPTIONISTS, CASHIERS, THERAPISTS, CUSTOMER_NAMES } from '../seed/consultants';

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randChoice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const pad = (n: number, len = 6) => n.toString().padStart(len, '0');

export const generateRedemptionRecords = (cards: CourseCard[], count = 260): RedemptionRecord[] => {
  const records: RedemptionRecord[] = [];
  const usedCards = cards.filter(c => c.usedSessions > 0);

  for (let i = 0; i < count; i++) {
    const card = usedCards.length > 0 ? randChoice(usedCards) : randChoice(cards);
    const store = STORES.find(s => s.id === card.storeId) || randChoice(STORES);
    const storeRecep = RECEPTIONISTS.filter(r => r.storeId === store.id);
    const receptionist = storeRecep.length > 0 ? randChoice(storeRecep) : randChoice(RECEPTIONISTS);
    const cashier = randChoice(CASHIERS);
    const therapist = randChoice(THERAPISTS);

    const sessions = randInt(1, Math.max(1, Math.min(3, card.remainingSessions + 2)));
    const amount = Math.round(card.unitPrice * sessions * 100) / 100;

    const now = new Date();
    const daysBack = randInt(0, 120);
    const hours = randInt(9, 20);
    const minutes = randInt(0, 59);
    const opTime = new Date(now.getTime() - daysBack * 86400000);
    opTime.setHours(hours, minutes, 0, 0);

    const isInconsistent = Math.random() < 0.12;
    const inconsistencyTypes: RedemptionRecord['inconsistencyType'][] =
      ['reception', 'receipt', 'treatment', 'amount', 'multi'];
    const inconsistencyType = isInconsistent ? randChoice(inconsistencyTypes) : undefined;

    const isManual = Math.random() < 0.06;

    records.push({
      id: `RED${pad(i + 1, 6)}`,
      redemptionNo: `HX${opTime.getFullYear()}${pad(opTime.getMonth() + 1, 2)}${pad(i + 101, 5)}`,
      cardId: card.id,
      cardNo: card.cardNo,
      customerName: card.customerName,
      projectId: card.projectId,
      projectName: card.projectName,
      sessions,
      amount,
      storeId: store.id,
      storeName: store.name,
      receptionistId: receptionist.id,
      receptionistName: receptionist.name,
      receptionRecordId: isInconsistent && inconsistencyType === 'reception' ? '' : `QT${pad(randInt(1000, 99999), 5)}`,
      cashierId: cashier.id,
      cashierName: cashier.name,
      receiptNo: isInconsistent && (inconsistencyType === 'receipt' || inconsistencyType === 'multi') ? '' : `SY${pad(randInt(10000, 999999), 6)}`,
      therapistId: therapist.id,
      therapistName: therapist.name,
      treatmentNo: isInconsistent && (inconsistencyType === 'treatment' || inconsistencyType === 'multi') ? '' : `ZL${pad(randInt(10000, 999999), 6)}`,
      operationTime: opTime.toISOString(),
      tripartiteConsistent: !isInconsistent,
      inconsistencyType,
      remark: isInconsistent ? '三方单据存在差异，请核对' : (isManual ? '手工补扣操作' : ''),
      isManual,
    });
  }

  return records.sort((a, b) => new Date(b.operationTime).getTime() - new Date(a.operationTime).getTime());
};

export const getInconsistencyDetail = (record: RedemptionRecord): InconsistencyDetail => {
  const mismatches: string[] = [];
  const hasReception = !!record.receptionRecordId;
  const hasReceipt = !!record.receiptNo;
  const hasTreatment = !!record.treatmentNo;
  const isAmountMismatch = record.inconsistencyType === 'amount' || record.inconsistencyType === 'multi';

  const amountA = Math.round(record.amount * 100) / 100;
  const amountB = isAmountMismatch ? Math.round(record.amount * 1.1 * 100) / 100 : amountA;
  const amountC = isAmountMismatch ? Math.round(record.amount * 0.9 * 100) / 100 : amountA;

  if (!hasReception) mismatches.push('前台登记记录缺失');
  if (!hasReceipt) mismatches.push('收银单号缺失');
  if (!hasTreatment) mismatches.push('治疗单缺失');
  if (isAmountMismatch) mismatches.push('三方金额不一致（前台/收银/治疗金额不匹配）');

  return {
    reception: {
      exists: hasReception,
      recordId: record.receptionRecordId || '-',
      sessions: hasReception ? record.sessions : 0,
      amount: hasReception ? amountA : 0,
      time: hasReception ? record.operationTime : '-',
    },
    receipt: {
      exists: hasReceipt,
      receiptNo: record.receiptNo || '-',
      sessions: hasReceipt ? record.sessions : 0,
      amount: hasReceipt ? (isAmountMismatch ? amountB : amountA) : 0,
      time: hasReceipt ? record.operationTime : '-',
    },
    treatment: {
      exists: hasTreatment,
      treatmentNo: record.treatmentNo || '-',
      sessions: hasTreatment ? record.sessions : 0,
      amount: hasTreatment ? (isAmountMismatch ? amountC : amountA) : 0,
      time: hasTreatment ? record.operationTime : '-',
    },
    mismatches,
  };
};

export const generateMonthlyRevenueTrend = (baseCards: CourseCard[]): MonthlyRevenueTrend[] => {
  const months: MonthlyRevenueTrend[] = [];
  const now = new Date();
  const totalSale = baseCards.reduce((s, c) => s + c.saleAmount, 0);
  const totalRedeemed = baseCards.reduce((s, c) => s + c.redeemedAmount, 0);

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    const jitter = 0.7 + Math.random() * 0.6;
    const saleBase = totalSale / 12 * jitter;
    const redeemJitter = 0.6 + Math.random() * 0.7;
    const redeemBase = totalRedeemed / 12 * redeemJitter;
    months.push({
      month: label,
      saleAmount: Math.round(saleBase),
      recognizedAmount: Math.round(redeemBase),
    });
  }
  return months;
};

export const computeRevenueBreakdown = (cards: CourseCard[]): RevenueBreakdown => {
  const advanceReceived = cards.reduce((s, c) => s + c.pendingAmount, 0);
  const currentRecognized = cards.reduce((s, c) => s + c.redeemedAmount, 0);
  const endingPending = advanceReceived;
  const beginningPending = advanceReceived * (0.85 + Math.random() * 0.1);
  const totalLiability = beginningPending + cards.reduce((s, c) => s + c.saleAmount, 0);
  const recognitionRate = totalLiability > 0 ? currentRecognized / totalLiability : 0;
  return {
    advanceReceived: Math.round(advanceReceived * 100) / 100,
    currentRecognized: Math.round(currentRecognized * 100) / 100,
    endingPending: Math.round(endingPending * 100) / 100,
    beginningPending: Math.round(beginningPending * 100) / 100,
    recognitionRate,
  };
};

export { CUSTOMER_NAMES, PROJECTS };
