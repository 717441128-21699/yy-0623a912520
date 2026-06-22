export interface CourseCard {
  id: string;
  cardNo: string;
  customerName: string;
  customerPhone: string;
  projectId: string;
  projectName: string;
  categoryId: string;
  categoryName: string;
  storeId: string;
  storeName: string;
  consultantId: string;
  consultantName: string;
  saleDate: string;
  saleAmount: number;
  giftedSessions: number;
  paidSessions: number;
  totalSessions: number;
  unitPrice: number;
  usedSessions: number;
  remainingSessions: number;
  redeemedAmount: number;
  pendingAmount: number;
  expiryDate: string;
  status: 'active' | 'completed' | 'expired' | 'abnormal';
  changeCount: number;
  lastRedemptionDate: string | null;
  manualDeductionCount: number;
  hasNegativeBalance: boolean;
  expiredRedeemed: boolean;
}

export interface RedemptionRecord {
  id: string;
  redemptionNo: string;
  cardId: string;
  cardNo: string;
  customerName: string;
  projectId: string;
  projectName: string;
  sessions: number;
  amount: number;
  storeId: string;
  storeName: string;
  receptionistId: string;
  receptionistName: string;
  receptionRecordId: string;
  cashierId: string;
  cashierName: string;
  receiptNo: string;
  therapistId: string;
  therapistName: string;
  treatmentNo: string;
  operationTime: string;
  tripartiteConsistent: boolean;
  inconsistencyType?: 'reception' | 'receipt' | 'treatment' | 'amount' | 'multi';
  remark: string;
  isManual: boolean;
}

export interface RiskOperationLog {
  id: string;
  operator: string;
  role: string;
  action: string;
  time: string;
  remark: string;
}

export type RiskType = 'longIdle' | 'frequentChange' | 'manualDeduction' | 'negativeBalance' | 'expiredRedeemed';
export type RiskLevel = 'high' | 'medium' | 'low';
export type RiskProcessingStatus = 'pending' | 'reviewing' | 'resolved' | 'ignored';

export interface RiskTriggerEvidence {
  /** 触发风险时的关键次数（负余次：超用次数；长期未消费：未消费天数；频繁改卡：30天改卡次数；手工补扣：手工次数；过期核销：过期后天数） */
  triggerCount: number;
  /** 触发阈值（审计规则口径） */
  threshold: number;
  /** 触发原始日期 */
  triggerDate: string;
  /** 最近一次核销时间（若存在） */
  lastRedemptionDate?: string | null;
  /** 最近一次核销次数和金额摘要 */
  lastRedemptionInfo?: { sessions: number; amount: number; operator?: string } | null;
  /** 卡内原始次数快照（销售时/当前对比） */
  sessionSnapshot?: { originalTotal: number; used: number; remaining: number };
  /** 触发备注 */
  detail?: string;
}

export interface RiskCard {
  id: string;
  cardNo: string;
  customerName: string;
  riskType: RiskType;
  riskLevel: RiskLevel;
  firstOccurDate: string;
  lastUpdateDate: string;
  involvedAmount: number;
  involvedSessions: number;
  processingStatus: RiskProcessingStatus;
  assignee: string;
  description: string;
  operationLogs: RiskOperationLog[];
  /** 风险触发原始证据（严格审计规则计算） */
  evidence: RiskTriggerEvidence;
}

export type DiffSourceType = 'refund' | 'transfer' | 'redemption' | 'sale' | 'manual';

export interface DiffSourceItem {
  id: string;
  type: DiffSourceType;
  sourceNo: string;
  date: string;
  description: string;
  theoreticalAmount: number;
  actualAmount: number;
  difference: number;
  cardNo?: string;
  customerName?: string;
  operator?: string;
  remark?: string;
}

export interface ReconLogItem {
  id: string;
  sourceId: string;
  checked: boolean;
  checker: string;
  checkTime: string;
  checkOpinion: string;
  adjustmentAmount?: number;
}

export interface StoreReconSummary {
  storeId: string;
  storeName: string;
  openingBalance: number;
  currentPeriodSale: number;
  currentPeriodRedeemed: number;
  refundAmount: number;
  transferIn: number;
  transferOut: number;
  theoreticalClosing: number;
  actualClosing: number;
  difference: number;
  pendingSessionsTotal: number;
  pendingAmountTotal: number;
  /** 差异来源明细 */
  diffSources?: DiffSourceItem[];
  /** 对账处理记录 */
  reconLogs?: ReconLogItem[];
  /** 对账完成状态 */
  reconStatus?: 'draft' | 'processing' | 'finished';
  reconFinishedTime?: string;
  reconFinishedBy?: string;
}

export interface FulfillmentPressure {
  projectId: string;
  projectName: string;
  remainingSessions: number;
  avgDurationPerSession: number;
  requiredHours: number;
  deviceCapacityHours: number;
  therapistCapacityHours: number;
  pressureRatio: number;
}

export type ApprovalType = 'refund' | 'transfer';
export type ApprovalStatus = 'pending_finance' | 'pending_director' | 'approved' | 'rejected';

export interface ApprovalRequest {
  id: string;
  requestNo: string;
  type: ApprovalType;
  cardNo: string;
  customerName: string;
  amount: number;
  sessions: number;
  applicant: string;
  applyTime: string;
  reason: string;
  financeOpinion?: string;
  financeReviewer?: string;
  financeTime?: string;
  directorOpinion?: string;
  directorReviewer?: string;
  directorTime?: string;
  status: ApprovalStatus;
}

export interface Store { id: string; name: string; }
export interface Project { id: string; name: string; categoryId: string; categoryName: string; }
export interface Consultant { id: string; name: string; storeId: string; }

export interface OverviewStats {
  totalSaleAmount: number;
  totalSessions: number;
  totalRedeemedAmount: number;
  totalPendingAmount: number;
  totalUnservedSessions: number;
  cardCount: number;
  completedCount: number;
  abnormalCount: number;
  avgFulfillmentRate: number;
  saleAmountTrend: number;
  redeemedAmountTrend: number;
}

export interface StoreSaleStat {
  storeId: string;
  storeName: string;
  saleAmount: number;
  cardCount: number;
  sessions: number;
}

export interface ProjectDistStat {
  categoryName: string;
  value: number;
  color: string;
}

export interface MonthlyRevenueTrend {
  month: string;
  saleAmount: number;
  recognizedAmount: number;
}

export interface InconsistencyDetail {
  reception: { exists: boolean; recordId: string; sessions: number; amount: number; time: string; };
  receipt: { exists: boolean; receiptNo: string; sessions: number; amount: number; time: string; };
  treatment: { exists: boolean; treatmentNo: string; sessions: number; amount: number; time: string; };
  mismatches: string[];
}

export interface RevenueBreakdown {
  advanceReceived: number;
  currentRecognized: number;
  endingPending: number;
  beginningPending: number;
  recognitionRate: number;
}
