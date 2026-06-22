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
