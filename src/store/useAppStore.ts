import { create } from 'zustand';
import type {
  CourseCard, RedemptionRecord, RiskCard, StoreReconSummary,
  FulfillmentPressure, ApprovalRequest, OverviewStats, StoreSaleStat,
  ProjectDistStat, MonthlyRevenueTrend, RevenueBreakdown,
} from '@/shared/types';
import { generateCourseCards, computeOverviewStats, computeStoreSaleStats, computeProjectDistribution } from '@/data/factories/cardFactory';
import { generateRedemptionRecords, generateMonthlyRevenueTrend, computeRevenueBreakdown } from '@/data/factories/redemptionFactory';
import { detectRiskCards, generateStoreReconSummaries, generateFulfillmentPressure, generateApprovalRequests } from '@/data/factories/riskFactory';
import { STORES } from '@/data/seed/stores';
import { PROJECTS, CATEGORIES } from '@/data/seed/projects';
import { CONSULTANTS } from '@/data/seed/consultants';

export type UserRole = 'finance' | 'director';

interface Filters {
  storeIds: string[];
  categoryIds: string[];
  consultantIds: string[];
  projectIds: string[];
  dateFrom: string;
  dateTo: string;
  status: string[];
  searchKeyword: string;
}

interface AppState {
  initialized: boolean;
  currentRole: UserRole;
  sidebarCollapsed: boolean;
  filters: Filters;

  courseCards: CourseCard[];
  redemptionRecords: RedemptionRecord[];
  riskCards: RiskCard[];
  storeReconSummaries: StoreReconSummary[];
  fulfillmentPressure: FulfillmentPressure[];
  approvalRequests: ApprovalRequest[];

  overviewStats: OverviewStats | null;
  storeSaleStats: StoreSaleStat[];
  projectDistribution: ProjectDistStat[];
  monthlyRevenueTrend: MonthlyRevenueTrend[];
  revenueBreakdown: RevenueBreakdown | null;

  selectedRiskCard: RiskCard | null;
  selectedApproval: ApprovalRequest | null;
  modalRiskOpen: boolean;
  modalApprovalOpen: boolean;

  initialize: () => void;
  setRole: (role: UserRole) => void;
  toggleSidebar: () => void;
  setFilters: (partial: Partial<Filters>) => void;
  resetFilters: () => void;

  openRiskDetail: (risk: RiskCard) => void;
  closeRiskDetail: () => void;
  openApprovalDetail: (approval: ApprovalRequest) => void;
  closeApprovalDetail: () => void;

  updateRiskStatus: (riskId: string, status: RiskCard['processingStatus'], remark: string) => void;
  submitApprovalOpinion: (
    approvalId: string,
    type: 'finance' | 'director',
    approve: boolean,
    opinion: string
  ) => void;
}

const defaultFilters = (): Filters => {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  return {
    storeIds: [],
    categoryIds: [],
    consultantIds: [],
    projectIds: [],
    dateFrom: from.toISOString().split('T')[0],
    dateTo: now.toISOString().split('T')[0],
    status: [],
    searchKeyword: '',
  };
};

export const useAppStore = create<AppState>((set, get) => ({
  initialized: false,
  currentRole: 'finance',
  sidebarCollapsed: false,
  filters: defaultFilters(),

  courseCards: [],
  redemptionRecords: [],
  riskCards: [],
  storeReconSummaries: [],
  fulfillmentPressure: [],
  approvalRequests: [],

  overviewStats: null,
  storeSaleStats: [],
  projectDistribution: [],
  monthlyRevenueTrend: [],
  revenueBreakdown: null,

  selectedRiskCard: null,
  selectedApproval: null,
  modalRiskOpen: false,
  modalApprovalOpen: false,

  initialize: () => {
    if (get().initialized) return;
    const cards = generateCourseCards(180);
    const redemptions = generateRedemptionRecords(cards, 260);
    const risks = detectRiskCards(cards);
    const storeRecon = generateStoreReconSummaries(cards);
    const pressure = generateFulfillmentPressure(cards);
    const approvals = generateApprovalRequests(cards);

    set({
      initialized: true,
      courseCards: cards,
      redemptionRecords: redemptions,
      riskCards: risks,
      storeReconSummaries: storeRecon,
      fulfillmentPressure: pressure,
      approvalRequests: approvals,
      overviewStats: computeOverviewStats(cards),
      storeSaleStats: computeStoreSaleStats(cards),
      projectDistribution: computeProjectDistribution(cards),
      monthlyRevenueTrend: generateMonthlyRevenueTrend(cards),
      revenueBreakdown: computeRevenueBreakdown(cards),
    });
  },

  setRole: (role) => set({ currentRole: role }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setFilters: (partial) => set((s) => ({ filters: { ...s.filters, ...partial } })),
  resetFilters: () => set({ filters: defaultFilters() }),

  openRiskDetail: (risk) => set({ selectedRiskCard: risk, modalRiskOpen: true }),
  closeRiskDetail: () => set({ modalRiskOpen: false, selectedRiskCard: null }),
  openApprovalDetail: (approval) => set({ selectedApproval: approval, modalApprovalOpen: true }),
  closeApprovalDetail: () => set({ modalApprovalOpen: false, selectedApproval: null }),

  updateRiskStatus: (riskId, status, remark) => {
    set((s) => ({
      riskCards: s.riskCards.map((r) => {
        if (r.id !== riskId) return r;
        return {
          ...r,
          processingStatus: status,
          lastUpdateDate: new Date().toISOString(),
          operationLogs: [
            ...r.operationLogs,
            {
              id: 'LOG' + Date.now(),
              operator: s.currentRole === 'finance' ? '财务审核员' : '院长',
              role: s.currentRole === 'finance' ? '财务主管' : '院长',
              action: `更新处理状态为「${
                { pending: '待处理', reviewing: '审核中', resolved: '已解决', ignored: '已忽略' }[status]
              }」`,
              time: new Date().toISOString(),
              remark,
            },
          ],
        };
      }),
    }));
  },

  submitApprovalOpinion: (approvalId, type, approve, opinion) => {
    set((s) => ({
      approvalRequests: s.approvalRequests.map((a) => {
        if (a.id !== approvalId) return a;
        const now = new Date().toISOString();
        const reviewer = s.currentRole === 'finance' ? '苏美玲' : '张建国';
        if (type === 'finance') {
          return {
            ...a,
            status: approve ? 'pending_director' : 'rejected',
            financeOpinion: opinion,
            financeReviewer: reviewer,
            financeTime: now,
          };
        }
        return {
          ...a,
          status: approve ? 'approved' : 'rejected',
          directorOpinion: opinion,
          directorReviewer: reviewer,
          directorTime: now,
        };
      }),
    }));
  },
}));

export { STORES, PROJECTS, CATEGORIES, CONSULTANTS };
