import type {
  RiskCard, RiskType, RiskLevel, RiskProcessingStatus,
  RiskOperationLog, StoreReconSummary, FulfillmentPressure, ApprovalRequest,
  RiskTriggerEvidence, DiffSourceItem,
} from '@/shared/types';
import type { CourseCard, RedemptionRecord } from '@/shared/types';
import { STORES } from '../seed/stores';
import { PROJECTS } from '../seed/projects';

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randChoice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const pad = (n: number, len = 6) => n.toString().padStart(len, '0');

const DAY_MS = 86400000;

// ========= 审计规则阈值（真实审计口径） =========
const RULE = {
  longIdleDays: 90,           // 距上次核销/购卡>90天=长期未消费
  longIdleHighDays: 180,     // >180天=高风险
  frequentChangeTimes: 3,    // 30天内改卡>=3次=频繁改卡
  manualDeduction: 1,        // 存在手工补扣即为风险，>=3升级高风险
  negative: 0,               // remainingSessions<0=负余次
  expiredGraceDays: 0,       // 过期后任一次核销=过期核销风险
} as const;

const RISK_TYPE_META: Record<RiskType, { label: string; defaultLevel: RiskLevel }> = {
  longIdle:         { label: '长期未消费', defaultLevel: 'medium' },
  frequentChange:   { label: '频繁改卡',   defaultLevel: 'medium' },
  manualDeduction:  { label: '手工补扣',   defaultLevel: 'high'   },
  negativeBalance:  { label: '负余次',     defaultLevel: 'high'   },
  expiredRedeemed:  { label: '过期核销',   defaultLevel: 'high'   },
};

const ASSIGNEES = ['财务-苏美玲', '财务-蔡雪萍', '院长-张建国'];
const OPERATORS = [
  { name: '苏美玲', role: '财务主管' },
  { name: '蔡雪萍', role: '财务审核' },
  { name: '张建国', role: '院长' },
  { name: '李思远', role: '运营经理' },
];

/** 根据card和核销流水找最近一次核销操作 */
function findLastRedemption(cardId: string, records: RedemptionRecord[]) {
  const mine = records.filter(r => r.cardId === cardId);
  if (mine.length === 0) return null;
  mine.sort((a, b) => new Date(b.operationTime).getTime() - new Date(a.operationTime).getTime());
  return mine[0];
}

/**
 * 严格审计规则的风险检测：
 * 1. 只对确实命中阈值的卡写入风险清单（而非随机挑选）
 * 2. 每条风险都附带evidence（原始次数、日期、最近核销信息）
 */
export function detectRiskCards(cards: CourseCard[], redemptionRecords: RedemptionRecord[] = []): RiskCard[] {
  const risks: RiskCard[] = [];
  let idx = 0;
  const now = Date.now();

  cards.forEach((card) => {
    // 关联该卡的核销记录
    const cardReds = redemptionRecords.filter(r => r.cardId === card.id);
    const lastRed = cardReds.length > 0
      ? cardReds.reduce((a, b) => new Date(a.operationTime) > new Date(b.operationTime) ? a : b)
      : null;

    // refDate = 最近核销日；若无核销则为购卡日
    const refDateMs = lastRed
      ? new Date(lastRed.operationTime).getTime()
      : new Date(card.saleDate).getTime();
    const daysIdle = Math.floor((now - refDateMs) / DAY_MS);

    const expiryMs = new Date(card.expiryDate).getTime();
    const expiredDays = Math.floor((now - expiryMs) / DAY_MS);
    const hasExpiredRedeemed = cardReds.some(r => new Date(r.operationTime).getTime() > expiryMs);

    const triggers: { type: RiskType; evidence: RiskTriggerEvidence; description: string }[] = [];

    // Rule 1: 长期未消费 —— 必须remaining>0且days>阈值
    if (card.remainingSessions > 0 && daysIdle >= RULE.longIdleDays) {
      triggers.push({
        type: 'longIdle',
        evidence: {
          triggerCount: daysIdle,
          threshold: RULE.longIdleDays,
          triggerDate: new Date(refDateMs).toISOString(),
          lastRedemptionDate: lastRed ? lastRed.operationTime : null,
          lastRedemptionInfo: lastRed ? {
            sessions: lastRed.sessions, amount: lastRed.amount, operator: lastRed.therapistName,
          } : null,
          sessionSnapshot: {
            originalTotal: card.totalSessions,
            used: card.usedSessions,
            remaining: card.remainingSessions,
          },
          detail: lastRed
            ? `自最后一次核销(${new Date(lastRed.operationTime).toISOString().slice(0,10)})起已${daysIdle}天无消费记录`
            : `自购卡日(${card.saleDate})起未消费`,
        },
        description: `距${lastRed ? '上次核销' : '购卡'}已${daysIdle}天，剩余${card.remainingSessions}次未履约`,
      });
    }

    // Rule 2: 频繁改卡 —— 30天内改卡>=3次
    if (card.changeCount >= RULE.frequentChangeTimes) {
      triggers.push({
        type: 'frequentChange',
        evidence: {
          triggerCount: card.changeCount,
          threshold: RULE.frequentChangeTimes,
          triggerDate: new Date(refDateMs).toISOString(),
          lastRedemptionDate: lastRed ? lastRed.operationTime : null,
          lastRedemptionInfo: lastRed ? { sessions: lastRed.sessions, amount: lastRed.amount, operator: lastRed.receptionistName } : null,
          sessionSnapshot: { originalTotal: card.totalSessions, used: card.usedSessions, remaining: card.remainingSessions },
          detail: `30天内改卡操作累计${card.changeCount}次，超过正常改卡频率(≤2次/月)`,
        },
        description: `近期累计改卡${card.changeCount}次，存在异常操作嫌疑`,
      });
    }

    // Rule 3: 手工补扣 —— 存在manualDeductionCount
    if (card.manualDeductionCount >= RULE.manualDeduction) {
      const manualReds = cardReds.filter(r => r.isManual);
      const lastManual = manualReds.length > 0
        ? manualReds.reduce((a, b) => new Date(a.operationTime) > new Date(b.operationTime) ? a : b)
        : null;
      triggers.push({
        type: 'manualDeduction',
        evidence: {
          triggerCount: card.manualDeductionCount,
          threshold: RULE.manualDeduction,
          triggerDate: lastManual ? lastManual.operationTime : new Date(refDateMs).toISOString(),
          lastRedemptionDate: lastManual ? lastManual.operationTime : (lastRed ? lastRed.operationTime : null),
          lastRedemptionInfo: lastManual ? {
            sessions: lastManual.sessions, amount: lastManual.amount, operator: lastManual.remark || '手工操作',
          } : (lastRed ? { sessions: lastRed.sessions, amount: lastRed.amount, operator: lastRed.therapistName } : null),
          sessionSnapshot: { originalTotal: card.totalSessions, used: card.usedSessions, remaining: card.remainingSessions },
          detail: lastManual
            ? `最近一次手工操作于${new Date(lastManual.operationTime).toISOString().slice(0,10)}，单号${lastManual.redemptionNo}，备注：${lastManual.remark || '无'}`
            : `存在${card.manualDeductionCount}条手工补扣核销记录，非系统自动扣减`,
        },
        description: `存在${card.manualDeductionCount}次非系统自动核销的手工扣减记录`,
      });
    }

    // Rule 4: 负余次 —— remainingSessions<0
    if (card.remainingSessions < RULE.negative) {
      triggers.push({
        type: 'negativeBalance',
        evidence: {
          triggerCount: Math.abs(card.remainingSessions),   // 超用了多少次
          threshold: 0,
          triggerDate: lastRed ? lastRed.operationTime : new Date().toISOString(),
          lastRedemptionDate: lastRed ? lastRed.operationTime : null,
          lastRedemptionInfo: lastRed ? { sessions: lastRed.sessions, amount: lastRed.amount, operator: lastRed.therapistName } : null,
          sessionSnapshot: {
            originalTotal: card.totalSessions,
            used: card.usedSessions,
            remaining: card.remainingSessions,   // 负值
          },
          detail: `剩余次数为${card.remainingSessions}，当前已核销${card.usedSessions}次 / 总${card.totalSessions}次，` +
                  `超用${Math.abs(card.remainingSessions)}次，折合金额约¥${Math.abs(card.remainingSessions) * card.unitPrice}`,
        },
        description: `剩余次数为${card.remainingSessions}，存在超量核销问题`,
      });
    }

    // Rule 5: 过期核销 —— 卡已过期，且至少一次核销发生在过期后
    if (hasExpiredRedeemed && card.expiredRedeemed) {
      const expiredReds = cardReds.filter(r => new Date(r.operationTime).getTime() > expiryMs);
      const lastExpiredRed = expiredReds.reduce((a, b) => new Date(a.operationTime) > new Date(b.operationTime) ? a : b);
      triggers.push({
        type: 'expiredRedeemed',
        evidence: {
          triggerCount: expiredDays,                    // 过期多少天
          threshold: RULE.expiredGraceDays,
          triggerDate: lastExpiredRed.operationTime,
          lastRedemptionDate: lastExpiredRed.operationTime,
          lastRedemptionInfo: {
            sessions: lastExpiredRed.sessions, amount: lastExpiredRed.amount, operator: lastExpiredRed.therapistName,
          },
          sessionSnapshot: { originalTotal: card.totalSessions, used: card.usedSessions, remaining: card.remainingSessions },
          detail: `卡有效期至${card.expiryDate}，但在${new Date(lastExpiredRed.operationTime).toISOString().slice(0,10)}（过期第${Math.floor((new Date(lastExpiredRed.operationTime).getTime()-expiryMs)/DAY_MS)}天）仍有核销记录，单号${lastExpiredRed.redemptionNo}`,
        },
        description: `该卡已于${card.expiryDate}过期，但仍存在${expiredReds.length}笔过期后核销记录`,
      });
    }

    // ============= 生成 RiskCard =============
    triggers.forEach(({ type, evidence, description }) => {
      idx += 1;
      const meta = RISK_TYPE_META[type];
      let level = meta.defaultLevel;
      if (type === 'longIdle' && evidence.triggerCount >= RULE.longIdleHighDays) level = 'high';
      if (type === 'manualDeduction' && evidence.triggerCount >= 3) level = 'high';
      if (type === 'negativeBalance') level = 'high';
      if (type === 'expiredRedeemed') level = 'high';

      const triggerMs = new Date(evidence.triggerDate).getTime();
      const firstOccurMs = triggerMs - randInt(0, 5) * DAY_MS;
      const lastUpdateMs = Math.min(now, triggerMs + randInt(0, 4) * DAY_MS);

      const allStatuses: RiskProcessingStatus[] = ['pending', 'pending', 'reviewing', 'resolved', 'ignored'];
      // 高风险更大概率处于未处理
      const status: RiskProcessingStatus = level === 'high'
        ? randChoice(['pending', 'pending', 'pending', 'reviewing', 'resolved'])
        : randChoice(allStatuses);

      const logCount = randInt(status === 'pending' ? 1 : 2, 4);
      const logs: RiskOperationLog[] = Array.from({ length: logCount }, (_, li) => {
        const op = randChoice(OPERATORS);
        const actions = [
          '系统自动检测并标记风险（根据审计规则）',
          '财务查看风险详情并下载证据',
          '联系门店顾问核实卡项情况',
          '电话联系顾客确认续卡/履约意向',
          '登记处理方案：建议电话回访安排服务',
          '顾客已预约近期到店服务，风险解除',
          '标记为已忽略，已做特殊审批备注',
        ];
        return {
          id: `LOG${pad(idx * 10 + li, 6)}`,
          operator: op.name,
          role: op.role,
          action: li === 0 ? '系统自动检测并标记风险（根据审计规则）' : randChoice(actions),
          time: new Date(Math.min(now, firstOccurMs + li * randInt(1, 3) * DAY_MS / 2)).toISOString(),
          remark: li === 0 ? '审计引擎自动生成' : randChoice(['已电话沟通', '待院长确认', '已备注说明', '顾客确认已知情', '']),
        };
      });

      risks.push({
        id: `RSK${pad(idx, 6)}`,
        cardNo: card.cardNo,
        customerName: card.customerName,
        riskType: type,
        riskLevel: level,
        firstOccurDate: new Date(firstOccurMs).toISOString(),
        lastUpdateDate: new Date(lastUpdateMs).toISOString(),
        involvedAmount: card.pendingAmount,
        involvedSessions: card.remainingSessions,
        processingStatus: status,
        assignee: randChoice(ASSIGNEES),
        description,
        operationLogs: logs,
        evidence,
      });
    });
  });

  return risks.sort((a, b) => {
    const order: Record<RiskLevel, number> = { high: 0, medium: 1, low: 2 };
    return order[a.riskLevel] - order[b.riskLevel];
  });
}

// ========= 门店对账：附加差异来源明细 =========
export const generateStoreReconSummaries = (
  cards: CourseCard[],
  approvals: ApprovalRequest[] = [],
  redemptions: RedemptionRecord[] = [],
): StoreReconSummary[] => {
  const now = new Date();
  const nowMs = now.getTime();

  return STORES.map((store) => {
    const storeCards = cards.filter((c) => c.storeId === store.id);
    const currentPeriodSale = storeCards.reduce((s, c) => s + c.saleAmount, 0);
    const currentPeriodRedeemed = storeCards.reduce((s, c) => s + c.redeemedAmount, 0);
    const pendingAmountTotal = storeCards.reduce((s, c) => s + c.pendingAmount, 0);
    const pendingSessionsTotal = storeCards.reduce((s, c) => s + c.remainingSessions, 0);

    // 从审批申请里取真实退款/转卡
    const storeApproved = approvals.filter(a => {
      const card = cards.find(c => c.cardNo === a.cardNo);
      return card?.storeId === store.id;
    });
    let refundAmount = Math.round(currentPeriodSale * 0.02 * 100) / 100;
    let transferIn = Math.round(currentPeriodSale * 0.015 * 100) / 100;
    let transferOut = Math.round(currentPeriodSale * 0.012 * 100) / 100;
    const approvedRefund = storeApproved.filter(a => a.type === 'refund' && a.status === 'approved').reduce((s, a) => s + a.amount, 0);
    const approvedTransferOut = storeApproved.filter(a => a.type === 'transfer' && a.status === 'approved').reduce((s, a) => s + a.amount, 0);
    if (approvedRefund > 0) refundAmount = Math.round(approvedRefund * 100) / 100;
    if (approvedTransferOut > 0) transferOut = Math.round(approvedTransferOut * 100) / 100;

    const openingBalance = Math.round(pendingAmountTotal * 0.88 * 100) / 100;
    const theoreticalClosing = openingBalance + currentPeriodSale - currentPeriodRedeemed - refundAmount - transferOut + transferIn;
    // 25%概率产生差异
    const hasDiff = Math.random() < 0.28;
    const diffVariance = hasDiff ? randInt(-800, 800) : 0;
    const actualClosing = theoreticalClosing + diffVariance;
    const difference = Math.round((actualClosing - theoreticalClosing) * 100) / 100;

    // ========== 差异来源明细 ==========
    const diffSources: DiffSourceItem[] = [];
    let dsId = 0;

    // 退款差异
    if (refundAmount > 0) {
      dsId++;
      const refundApprovedActual = refundAmount * (0.9 + Math.random() * 0.2);
      diffSources.push({
        id: `DF${store.id}${pad(dsId, 3)}`,
        type: 'refund',
        sourceNo: `TK${now.getFullYear()}${pad(parseInt(store.id.slice(-2), 10) || 1, 2)}${pad(randInt(1, 999), 3)}`,
        date: new Date(nowMs - randInt(2, 12) * DAY_MS).toISOString().slice(0, 10),
        description: '顾客退费（审批单号见备注）',
        theoreticalAmount: Math.round(refundAmount * 100) / 100,
        actualAmount: Math.round(refundApprovedActual * 100) / 100,
        difference: Math.round((refundAmount - refundApprovedActual) * 100) / 100,
        remark: `涉${randInt(1, 3)}笔退款申请`,
      });
    }
    // 转卡差异
    if (Math.abs(transferIn - transferOut) > 0) {
      dsId++;
      const net = transferIn - transferOut;
      const actualNet = net * (0.92 + Math.random() * 0.15);
      diffSources.push({
        id: `DF${store.id}${pad(dsId, 3)}`,
        type: 'transfer',
        sourceNo: `ZK${now.getFullYear()}${pad(parseInt(store.id.slice(-2), 10) || 1, 2)}${pad(randInt(1, 999), 3)}`,
        date: new Date(nowMs - randInt(1, 18) * DAY_MS).toISOString().slice(0, 10),
        description: '门店间转卡净额（转入-转出）',
        theoreticalAmount: Math.round(net * 100) / 100,
        actualAmount: Math.round(actualNet * 100) / 100,
        difference: Math.round((net - actualNet) * 100) / 100,
        remark: '含跨店、跨项目转卡',
      });
    }
    // 核销差异（三方不一致的记录汇总）
    const storeInconsistentReds = redemptions.filter(r => r.storeId === store.id && !r.tripartiteConsistent);
    if (storeInconsistentReds.length > 0) {
      dsId++;
      const diff = storeInconsistentReds.reduce((s, r) => s + r.amount * (Math.random() < 0.5 ? -0.05 : 0.08), 0);
      diffSources.push({
        id: `DF${store.id}${pad(dsId, 3)}`,
        type: 'redemption',
        sourceNo: `HX-DIFF-${store.id}`,
        date: new Date(nowMs - randInt(0, 2) * DAY_MS).toISOString().slice(0, 10),
        description: `核销流水三方单据不一致（${storeInconsistentReds.length}条）`,
        theoreticalAmount: 0,
        actualAmount: Math.round(diff * 100) / 100,
        difference: Math.round(diff * 100) / 100,
        operator: '系统自动',
        remark: '详见核销流水页"仅看差异"筛选',
      });
    }
    // 手工调整差异
    if (hasDiff && Math.abs(difference) > 200) {
      dsId++;
      const manDiff = difference * 0.6;
      diffSources.push({
        id: `DF${store.id}${pad(dsId, 3)}`,
        type: 'manual',
        sourceNo: `SG${now.getFullYear()}${pad(parseInt(store.id.slice(-2), 10) || 1, 2)}${pad(randInt(100, 999), 3)}`,
        date: new Date(nowMs - randInt(0, 5) * DAY_MS).toISOString().slice(0, 10),
        description: '收银端手工调整（抹零/补收）',
        theoreticalAmount: 0,
        actualAmount: Math.round(manDiff * 100) / 100,
        difference: Math.round(manDiff * 100) / 100,
        remark: '待财务复核确认',
      });
    }
    // 售卡金额四舍五入差异
    if (hasDiff) {
      dsId++;
      const saleDiff = difference * 0.4;
      diffSources.push({
        id: `DF${store.id}${pad(dsId, 3)}`,
        type: 'sale',
        sourceNo: `SK${now.getFullYear()}${pad(parseInt(store.id.slice(-2), 10) || 1, 2)}${pad(randInt(1000, 9999), 4)}`,
        date: new Date(nowMs - randInt(0, 10) * DAY_MS).toISOString().slice(0, 10),
        description: '售卡结算尾差（四舍五入/抹零）',
        theoreticalAmount: 0,
        actualAmount: Math.round(saleDiff * 100) / 100,
        difference: Math.round(saleDiff * 100) / 100,
        remark: 'POS端小数进位差异',
      });
    }

    const reconStatus: StoreReconSummary['reconStatus'] =
      Math.abs(difference) < 0.01 ? 'finished' : hasDiff ? 'processing' : 'draft';

    return {
      storeId: store.id,
      storeName: store.name,
      openingBalance: Math.round(openingBalance * 100) / 100,
      currentPeriodSale: Math.round(currentPeriodSale * 100) / 100,
      currentPeriodRedeemed: Math.round(currentPeriodRedeemed * 100) / 100,
      refundAmount: Math.round(refundAmount * 100) / 100,
      transferIn: Math.round(transferIn * 100) / 100,
      transferOut: Math.round(transferOut * 100) / 100,
      theoreticalClosing: Math.round(theoreticalClosing * 100) / 100,
      actualClosing: Math.round(actualClosing * 100) / 100,
      difference,
      pendingSessionsTotal,
      pendingAmountTotal: Math.round(pendingAmountTotal * 100) / 100,
      diffSources,
      reconLogs: [],
      reconStatus,
      reconFinishedTime: reconStatus === 'finished' ? new Date(nowMs - randInt(0, 2) * DAY_MS).toISOString() : undefined,
      reconFinishedBy: reconStatus === 'finished' ? randChoice(['苏美玲', '蔡雪萍']) : undefined,
    };
  });
};

// ========= 履约压力 =========
const PROJECT_DURATIONS: Record<string, number> = {
  PJ001: 120, PJ002: 90, PJ003: 75, PJ004: 40, PJ005: 50, PJ006: 60,
  PJ007: 30, PJ008: 25, PJ009: 20, PJ010: 45, PJ011: 50, PJ012: 35,
  PJ013: 40, PJ014: 45,
};

export const generateFulfillmentPressure = (cards: CourseCard[]): FulfillmentPressure[] => {
  const projectMap = new Map<string, number>();
  cards.forEach((c) => {
    const current = projectMap.get(c.projectId) || 0;
    projectMap.set(c.projectId, current + c.remainingSessions);
  });

  return PROJECTS.map((p) => {
    const remainingSessions = projectMap.get(p.id) || 0;
    const avgDuration = PROJECT_DURATIONS[p.id] || 45;
    const requiredHours = Math.round(remainingSessions * avgDuration / 60 * 10) / 10;
    const baseCapacity = Math.round((8 * 22 * 0.6) * 10) / 10;
    const deviceCapacityHours = baseCapacity * (0.8 + Math.random() * 0.8);
    const therapistCapacityHours = baseCapacity * (0.9 + Math.random() * 0.7);
    const minCapacity = Math.min(deviceCapacityHours, therapistCapacityHours);
    const pressureRatio = minCapacity > 0 ? Math.min(requiredHours / minCapacity, 1.5) : 0;
    return {
      projectId: p.id,
      projectName: p.name,
      remainingSessions,
      avgDurationPerSession: avgDuration,
      requiredHours,
      deviceCapacityHours: Math.round(deviceCapacityHours * 10) / 10,
      therapistCapacityHours: Math.round(therapistCapacityHours * 10) / 10,
      pressureRatio: Math.round(pressureRatio * 1000) / 1000,
    };
  }).filter((p) => p.remainingSessions > 0).sort((a, b) => b.pressureRatio - a.pressureRatio);
};

// ========= 审批申请 =========
export const generateApprovalRequests = (cards: CourseCard[]): ApprovalRequest[] => {
  const requests: ApprovalRequest[] = [];
  const abnormalCards = cards.filter(c => c.status !== 'completed');
  const sampleCards = abnormalCards.length >= 18
    ? abnormalCards.slice().sort(() => Math.random() - 0.5).slice(0, 18)
    : cards.slice().sort(() => Math.random() - 0.5).slice(0, 18);

  sampleCards.forEach((card, idx) => {
    const type: ApprovalRequest['type'] = Math.random() < 0.55 ? 'refund' : 'transfer';
    const now = Date.now();
    const applyTime = new Date(now - randInt(0, 20) * DAY_MS - randInt(0, 36000000));
    const amountRatio = 0.2 + Math.random() * 0.7;
    const amount = Math.round(Math.max(card.pendingAmount, card.unitPrice * 2) * amountRatio * 100) / 100;
    const sessions = Math.max(1, Math.floor(card.remainingSessions * amountRatio));
    const statuses: ApprovalRequest['status'][] = ['pending_finance', 'pending_finance', 'pending_director', 'approved', 'approved', 'rejected'];
    const status = randChoice(statuses);

    const financeReviewed = status !== 'pending_finance';
    const directorReviewed = status === 'approved' || status === 'rejected' || status === 'pending_director';

    const reasons = [
      '顾客个人原因要求退款，已与顾问沟通确认',
      '转卡至顾客本人名下其他项目',
      '顾客搬家至外地，无法继续到店消费',
      '项目效果未达预期，协商部分退款',
      '顾客怀孕暂停服务，申请转卡至家人',
      '医美机构项目升级，旧卡换新卡补差',
      '服务体验不佳协商退款',
      '顾客经济情况变化申请暂停退款',
    ];

    const req: ApprovalRequest = {
      id: `APV${pad(idx + 1, 6)}`,
      requestNo: `SP${applyTime.getFullYear()}${pad(applyTime.getMonth() + 1, 2)}${pad(idx + 101, 5)}`,
      type,
      cardNo: card.cardNo,
      customerName: card.customerName,
      amount,
      sessions,
      applicant: card.consultantName,
      applyTime: applyTime.toISOString(),
      reason: randChoice(reasons),
      status,
    };

    if (financeReviewed) {
      const fOp = randChoice(['苏美玲', '蔡雪萍']);
      req.financeReviewer = fOp;
      req.financeOpinion = status === 'rejected'
        ? '金额核算有误，请重新核对剩余次数及折算价，已与门店顾问电话确认'
        : '已核对卡项余额、剩余次数与对应金额，单据齐全，同意办理';
      req.financeTime = new Date(applyTime.getTime() + randInt(1, 72) * 3600000).toISOString();
    }
    if (directorReviewed) {
      req.directorReviewer = '张建国';
      req.directorOpinion = status === 'rejected'
        ? '暂不同意退款，请与顾客进一步沟通转卡或冻结方案'
        : '同意办理，请财务做好账务调整与单据留档';
      req.directorTime = new Date(applyTime.getTime() + randInt(4, 96) * 3600000).toISOString();
    }

    requests.push(req);
  });

  return requests.sort((a, b) => new Date(b.applyTime).getTime() - new Date(a.applyTime).getTime());
};

export { RISK_TYPE_META };
