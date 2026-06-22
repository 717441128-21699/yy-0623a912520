import type {
  RiskCard, RiskType, RiskLevel, RiskProcessingStatus,
  RiskOperationLog, StoreReconSummary, FulfillmentPressure, ApprovalRequest, RiskOperationLog as ROL
} from '@/shared/types';
import type { CourseCard } from '@/shared/types';
import { STORES } from '../seed/stores';
import { PROJECTS } from '../seed/projects';

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randChoice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const pad = (n: number, len = 6) => n.toString().padStart(len, '0');

const RISK_TYPE_META: Record<RiskType, { label: string; defaultLevel: RiskLevel; desc: (c: CourseCard) => string }> = {
  longIdle: {
    label: '长期未消费',
    defaultLevel: 'medium',
    desc: (c) => `距上次消费/购买已超过90天，剩余${c.remainingSessions}次未履约`,
  },
  frequentChange: {
    label: '频繁改卡',
    defaultLevel: 'medium',
    desc: (c) => `30天内累计改卡${c.changeCount}次，存在异常操作嫌疑`,
  },
  manualDeduction: {
    label: '手工补扣',
    defaultLevel: 'high',
    desc: (c) => `存在${c.manualDeductionCount}次非系统自动核销的手工扣减记录`,
  },
  negativeBalance: {
    label: '负余次',
    defaultLevel: 'high',
    desc: (c) => `剩余次数为${c.remainingSessions}，存在超量核销问题`,
  },
  expiredRedeemed: {
    label: '过期核销',
    defaultLevel: 'high',
    desc: (c) => `该卡已于${c.expiryDate}过期，但仍存在核销记录`,
  },
};

const randomDateWithin = (daysMin: number, daysMax: number) => {
  const now = new Date();
  const offset = randInt(daysMin, daysMax);
  return new Date(now.getTime() - offset * 86400000).toISOString();
};

const ASSIGNEES = ['财务-苏美玲', '财务-蔡雪萍', '院长-张总'];
const OPERATORS = [
  { name: '苏美玲', role: '财务主管' },
  { name: '蔡雪萍', role: '财务审核' },
  { name: '张建国', role: '院长' },
  { name: '李思远', role: '运营经理' },
];

export const detectRiskCards = (cards: CourseCard[]): RiskCard[] => {
  const risks: RiskCard[] = [];
  let idx = 0;

  cards.forEach((card) => {
    const now = new Date();
    const riskTypes: RiskType[] = [];

    const refDate = card.lastRedemptionDate ? new Date(card.lastRedemptionDate) : new Date(card.saleDate);
    const daysIdle = (now.getTime() - refDate.getTime()) / 86400000;
    if (daysIdle > 90) riskTypes.push('longIdle');

    if (card.changeCount >= 3) riskTypes.push('frequentChange');
    if (card.manualDeductionCount > 0) riskTypes.push('manualDeduction');
    if (card.hasNegativeBalance) riskTypes.push('negativeBalance');
    if (card.expiredRedeemed) riskTypes.push('expiredRedeemed');

    riskTypes.forEach((rt) => {
      idx += 1;
      const meta = RISK_TYPE_META[rt];
      let level = meta.defaultLevel;
      if (card.hasNegativeBalance || card.expiredRedeemed) level = 'high';
      if (rt === 'longIdle' && daysIdle > 180) level = 'high';
      if (rt === 'manualDeduction' && card.manualDeductionCount >= 3) level = 'high';

      const firstOccur = randomDateWithin(10, 120);
      const lastUpdate = randomDateWithin(0, 9);

      const statuses: RiskProcessingStatus[] = ['pending', 'pending', 'reviewing', 'resolved', 'ignored'];
      const status = randChoice(statuses);

      const logCount = randInt(1, 4);
      const logs: RiskOperationLog[] = Array.from({ length: logCount }, (_, li) => {
        const op = randChoice(OPERATORS);
        const actions = [
          '系统自动检测并标记风险',
          '财务查看风险详情',
          '联系门店顾问核实情况',
          '联系顾客确认续卡意向',
          '登记处理方案：建议电话回访',
          '风险已解除：顾客已预约下次到店',
          '标记为已忽略，已做特殊备注',
        ];
        return {
          id: `LOG${pad(idx * 10 + li, 5)}`,
          operator: op.name,
          role: op.role,
          action: randChoice(actions),
          time: randomDateWithin(li, 30),
          remark: li === 0 ? '系统自动生成' : randChoice(['已电话沟通', '待院长确认', '已备注说明', '']),
        };
      });

      risks.push({
        id: `RSK${pad(idx, 6)}`,
        cardNo: card.cardNo,
        customerName: card.customerName,
        riskType: rt,
        riskLevel: level,
        firstOccurDate: firstOccur,
        lastUpdateDate: lastUpdate,
        involvedAmount: card.pendingAmount,
        involvedSessions: card.remainingSessions,
        processingStatus: status,
        assignee: randChoice(ASSIGNEES),
        description: meta.desc(card),
        operationLogs: logs,
      });
    });
  });

  return risks.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 } as const;
    return order[a.riskLevel] - order[b.riskLevel];
  });
};

export const generateStoreReconSummaries = (cards: CourseCard[]): StoreReconSummary[] => {
  return STORES.map((store) => {
    const storeCards = cards.filter((c) => c.storeId === store.id);
    const currentPeriodSale = storeCards.reduce((s, c) => s + c.saleAmount, 0);
    const currentPeriodRedeemed = storeCards.reduce((s, c) => s + c.redeemedAmount, 0);
    const pendingAmountTotal = storeCards.reduce((s, c) => s + c.pendingAmount, 0);
    const pendingSessionsTotal = storeCards.reduce((s, c) => s + c.remainingSessions, 0);
    const refundAmount = Math.round(currentPeriodSale * 0.02 * 100) / 100;
    const transferIn = Math.round(currentPeriodSale * 0.015 * 100) / 100;
    const transferOut = Math.round(currentPeriodSale * 0.012 * 100) / 100;
    const openingBalance = Math.round(pendingAmountTotal * 0.88 * 100) / 100;
    const theoreticalClosing = openingBalance + currentPeriodSale - currentPeriodRedeemed - refundAmount - transferOut + transferIn;
    const diffVariance = Math.random() < 0.3 ? randInt(-500, 500) : 0;
    const actualClosing = theoreticalClosing + diffVariance;
    return {
      storeId: store.id,
      storeName: store.name,
      openingBalance: Math.round(openingBalance * 100) / 100,
      currentPeriodSale: Math.round(currentPeriodSale * 100) / 100,
      currentPeriodRedeemed: Math.round(currentPeriodRedeemed * 100) / 100,
      refundAmount,
      transferIn,
      transferOut,
      theoreticalClosing: Math.round(theoreticalClosing * 100) / 100,
      actualClosing: Math.round(actualClosing * 100) / 100,
      difference: Math.round((actualClosing - theoreticalClosing) * 100) / 100,
      pendingSessionsTotal,
      pendingAmountTotal: Math.round(pendingAmountTotal * 100) / 100,
    };
  });
};

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

export const generateApprovalRequests = (cards: CourseCard[]): ApprovalRequest[] => {
  const requests: ApprovalRequest[] = [];
  const sampleCards = cards.slice().sort(() => Math.random() - 0.5).slice(0, 18);

  sampleCards.forEach((card, idx) => {
    const type: ApprovalRequest['type'] = Math.random() < 0.55 ? 'refund' : 'transfer';
    const now = new Date();
    const applyTime = new Date(now.getTime() - randInt(0, 20) * 86400000 - randInt(0, 36000000));
    const amountRatio = 0.2 + Math.random() * 0.7;
    const amount = Math.round(card.pendingAmount * amountRatio * 100) / 100;
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
        ? '金额核算有误，请重新核对剩余次数及折算价'
        : '已核对卡项余额、剩余次数与对应金额，同意办理';
      req.financeTime = new Date(applyTime.getTime() + randInt(1, 72) * 3600000).toISOString();
    }
    if (directorReviewed) {
      req.directorReviewer = '张建国';
      req.directorOpinion = status === 'rejected'
        ? '暂不同意退款，请与顾客进一步沟通转卡方案'
        : '同意办理，请财务做好账务调整记录';
      req.directorTime = new Date(applyTime.getTime() + randInt(4, 96) * 3600000).toISOString();
    }

    requests.push(req);
  });

  return requests.sort((a, b) => new Date(b.applyTime).getTime() - new Date(a.applyTime).getTime());
};

export const RISK_TYPE_META_EXPORT = RISK_TYPE_META;
export { ROL };
