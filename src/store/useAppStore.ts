import { create } from 'zustand';
import {
  generateCourseCards, computeOverviewStats, computeStoreSaleStats, computeProjectDistribution,
} from '@/data/factories/cardFactory';
import { generateRedemptionRecords, generateMonthlyRevenueTrend, computeRevenueBreakdown } from '@/data/factories/redemptionFactory';
import {
  detectRiskCards, generateStoreReconSummaries, generateFulfillmentPressure, generateApprovalRequests,
} from '@/data/factories/riskFactory';
import type {
  CourseCard, OverviewStats, StoreSaleStat, ProjectDistStat,
  RedemptionRecord, RiskCard, RiskProcessingStatus, StoreReconSummary,
  FulfillmentPressure, ApprovalRequest, MonthlyRevenueTrend, RevenueBreakdown, ReconLogItem,
} from '@/shared/types';
import { STORES as _STORES } from '@/data/seed/stores';
import { CATEGORIES as _CATEGORIES, PROJECTS as _PROJECTS } from '@/data/seed/projects';
import { CONSULTANTS as _CONSULTANTS } from '@/data/seed/consultants';

export const STORES = _STORES;
export const CATEGORIES = _CATEGORIES;
export const PROJECTS = _PROJECTS;
export const CONSULTANTS = _CONSULTANTS;

// ============ localStorage 持久化 key ============
const LS_KEYS = {
  riskCards: 'aesthetic_risk_cards_v1',
  approvalRequests: 'aesthetic_approvals_v1',
  reconLogs: 'aesthetic_recon_logs_v1',
  seededFlag: 'aesthetic_seeded_v1',     // 保证只初始化一次数据
  seedHash: 'aesthetic_seed_hash_v1',    // 数据规模指纹，防止数据变化
};

function safeLSGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    return fallback;
  }
}
function safeLSSet(key: string, value: any) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
}
function safeLSDel(key: string) {
  try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
}

// ============ 数据规模指纹 ============
const DATA_HASH = `cards=180|reds=260|stores=${STORES.length}|cons=${CONSULTANTS.length}`;

export interface Filters {
  storeIds: string[];
  categoryIds: string[];
  projectIds: string[];
  consultantIds: string[];
  dateFrom: string;
  dateTo: string;
  searchKeyword: string;
}

export interface UserRole {
  current: 'finance' | 'director';
}

interface ApproveOpinionLevel {
  level: 'finance' | 'director';
  approved: boolean;
  opinion: string;
  reviewerName: string;
  time: string;
}

interface AppState {
  initialized: boolean;
  courseCards: CourseCard[];
  overviewStats: OverviewStats | null;
  storeSaleStats: StoreSaleStat[];
  projectDistribution: ProjectDistStat[];
  redemptionRecords: RedemptionRecord[];
  monthlyRevenueTrend: MonthlyRevenueTrend[];
  revenueBreakdown: RevenueBreakdown | null;

  riskCards: RiskCard[];
  storeReconSummaries: StoreReconSummary[];
  fulfillmentPressure: FulfillmentPressure[];
  approvalRequests: ApprovalRequest[];

  filters: Filters;
  currentRole: 'finance' | 'director';
  sidebarCollapsed: boolean;

  // ============ UI 状态 ============
  selectedRisk: RiskCard | null;
  modalRiskOpen: boolean;
  selectedApproval: ApprovalRequest | null;
  modalApprovalOpen: boolean;

  // ============ 初始化 ============
  initialize: () => void;
  resetAllData: () => void;

  // ============ 筛选器 ============
  setFilters: (patch: Partial<Filters>) => void;
  resetFilters: () => void;
  switchRole: () => void;
  setRole: (role: 'finance' | 'director') => void;
  toggleSidebar: () => void;

  // ============ 风险卡 ============
  openRiskDetail: (risk: RiskCard) => void;
  closeRiskDetail: () => void;
  updateRiskStatus: (id: string, nextStatus: RiskProcessingStatus, remark: string) => void;

  // ============ 审批申请 ============
  openApprovalDetail: (appr: ApprovalRequest) => void;
  closeApprovalDetail: () => void;
  submitApprovalOpinion: (id: string, level: 'finance' | 'director', approved: boolean, opinion: string) => void;

  // ============ 对账 ============
  updateReconStatus: (storeId: string, checkedIds: string[], opinion: string, adjustment?: number) => void;
}

const makeDefaultFilters = (): Filters => {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  return {
    storeIds: [],
    categoryIds: [],
    projectIds: [],
    consultantIds: [],
    dateFrom: from.toISOString().slice(0, 10),
    dateTo: now.toISOString().slice(0, 10),
    searchKeyword: '',
  };
};

function buildStoreLogsKey(storeId: string) { return `${LS_KEYS.reconLogs}_${storeId}`; }

export const useAppStore = create<AppState>((set, get) => ({
  initialized: false,
  courseCards: [],
  overviewStats: null,
  storeSaleStats: [],
  projectDistribution: [],
  redemptionRecords: [],
  monthlyRevenueTrend: [],
  revenueBreakdown: null,
  riskCards: [],
  storeReconSummaries: [],
  fulfillmentPressure: [],
  approvalRequests: [],

  filters: makeDefaultFilters(),
  currentRole: 'finance',
  sidebarCollapsed: false,

  selectedRisk: null,
  modalRiskOpen: false,
  selectedApproval: null,
  modalApprovalOpen: false,

  initialize: () => {
    if (get().initialized) return;

    // 数据规模或版本变化 -> 清掉缓存，重新初始化
    const cachedHash = safeLSGet<string | null>(LS_KEYS.seedHash, null);
    if (cachedHash !== DATA_HASH) {
      safeLSDel(LS_KEYS.riskCards);
      safeLSDel(LS_KEYS.approvalRequests);
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith(LS_KEYS.reconLogs) || k.startsWith('aesthetic_recon_meta_')) safeLSDel(k);
      });
      safeLSSet(LS_KEYS.seedHash, DATA_HASH);
    }

    // ========= 基础数据（纯前端seed，每次刷新一致） =========
    const cards = generateCourseCards(180);
    const redemptions = generateRedemptionRecords(cards, 260);
    const monthly = generateMonthlyRevenueTrend(cards);
    const breakdown = computeRevenueBreakdown(cards);

    // ========= 审批申请：首次生成后，之后从 localStorage 读取（保留审批结果） =========
    let approvals = safeLSGet<ApprovalRequest[] | null>(LS_KEYS.approvalRequests, null);
    if (!approvals || approvals.length === 0) {
      approvals = generateApprovalRequests(cards);
      safeLSSet(LS_KEYS.approvalRequests, approvals);
    }

    // ========= 对账汇总（含diffSources） =========
    const reconSummaries = generateStoreReconSummaries(cards, approvals, redemptions);

    // 加载各门店已有的对账处理日志
    reconSummaries.forEach(rs => {
      const cachedLogs = safeLSGet<ReconLogItem[] | null>(buildStoreLogsKey(rs.storeId), null);
      if (cachedLogs && cachedLogs.length > 0) {
        rs.reconLogs = cachedLogs;
        const allIds = (rs.diffSources || []).map(d => d.id);
        const allChecked = allIds.length > 0 && allIds.every(id => cachedLogs.some(l => l.sourceId === id));
        if (allChecked) {
          rs.reconStatus = 'finished';
        } else if (cachedLogs.length > 0) {
          rs.reconStatus = 'processing';
        }
        const metaKey = `aesthetic_recon_meta_${rs.storeId}`;
        const meta = safeLSGet<{ reconStatus?: string; reconFinishedTime?: string; reconFinishedBy?: string } | null>(metaKey, null);
        if (meta) {
          if (meta.reconStatus) rs.reconStatus = meta.reconStatus as StoreReconSummary['reconStatus'];
          if (meta.reconFinishedTime) rs.reconFinishedTime = meta.reconFinishedTime;
          if (meta.reconFinishedBy) rs.reconFinishedBy = meta.reconFinishedBy;
        } else if (allChecked && !rs.reconFinishedTime) {
          const lastLog = cachedLogs[cachedLogs.length - 1];
          rs.reconFinishedTime = lastLog.checkTime;
          rs.reconFinishedBy = lastLog.checker;
        }
      }
    });

    // ========= 风险卡：首次基于 seed + 严格审计规则生成 =========
    // 但是 processingStatus / operationLogs 等用户操作后需要持久化
    let risks = safeLSGet<RiskCard[] | null>(LS_KEYS.riskCards, null);
    if (!risks || risks.length === 0) {
      risks = detectRiskCards(cards, redemptions);
      safeLSSet(LS_KEYS.riskCards, risks);
    } else {
      // 如果基础卡片数据变化了，重新基于严格审计规则生成，再合并已有处理状态
      const freshRisks = detectRiskCards(cards, redemptions);
      const existingById = new Map(risks.map(r => [r.cardNo + '|' + r.riskType, r]));
      risks = freshRisks.map(fr => {
        const old = existingById.get(fr.cardNo + '|' + fr.riskType);
        if (!old) return fr;
        return {
          ...fr,
          id: old.id,
          processingStatus: old.processingStatus,
          assignee: old.assignee,
          operationLogs: old.operationLogs,
        };
      });
      safeLSSet(LS_KEYS.riskCards, risks);
    }

    set({
      initialized: true,
      courseCards: cards,
      overviewStats: computeOverviewStats(cards),
      storeSaleStats: computeStoreSaleStats(cards),
      projectDistribution: computeProjectDistribution(cards),
      redemptionRecords: redemptions,
      monthlyRevenueTrend: monthly,
      revenueBreakdown: breakdown,
      approvalRequests: approvals,
      riskCards: risks,
      storeReconSummaries: reconSummaries,
      fulfillmentPressure: generateFulfillmentPressure(cards),
    });
  },

  resetAllData: () => {
    safeLSDel(LS_KEYS.riskCards);
    safeLSDel(LS_KEYS.approvalRequests);
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith(LS_KEYS.reconLogs) || k.startsWith('aesthetic_recon_meta_')) safeLSDel(k);
    });
    safeLSDel(LS_KEYS.seedHash);
    set({ initialized: false });
    get().initialize();
  },

  setFilters: (patch) => set(s => ({ filters: { ...s.filters, ...patch } })),
  resetFilters: () => set({ filters: makeDefaultFilters() }),
  switchRole: () => set(s => ({ currentRole: s.currentRole === 'finance' ? 'director' : 'finance' })),
  setRole: (role) => set({ currentRole: role }),
  toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  // ========= 风险卡 =========
  openRiskDetail: (risk) => set({ selectedRisk: risk, modalRiskOpen: true }),
  closeRiskDetail: () => set({ selectedRisk: null, modalRiskOpen: false }),

  updateRiskStatus: (id, nextStatus, remark) => {
    const now = new Date().toISOString();
    const reviewerName = get().currentRole === 'finance' ? (safeLSGet('userNameFinance', '苏美玲') as string) : (safeLSGet('userNameDirector', '张建国') as string);
    const reviewerRole = get().currentRole === 'finance' ? '财务主管' : '院长';
    set(s => {
      const nextRisks = s.riskCards.map(r => {
        if (r.id !== id) return r;
        const newLogs = [
          ...r.operationLogs,
          {
            id: `LOG${Date.now()}`,
            operator: reviewerName,
            role: reviewerRole,
            action: `风险处理状态更新为「${
              nextStatus === 'pending' ? '待处理' :
              nextStatus === 'reviewing' ? '处理中' :
              nextStatus === 'resolved' ? '已解决' : '已忽略'
            }」`,
            time: now,
            remark,
          },
        ];
        return {
          ...r,
          processingStatus: nextStatus,
          lastUpdateDate: now,
          operationLogs: newLogs,
        };
      });
      safeLSSet(LS_KEYS.riskCards, nextRisks);
      return { riskCards: nextRisks };
    });
  },

  // ========= 审批申请 =========
  openApprovalDetail: (appr) => set({ selectedApproval: appr, modalApprovalOpen: true }),
  closeApprovalDetail: () => set({ selectedApproval: null, modalApprovalOpen: false }),

  submitApprovalOpinion: (id, level, approved, opinion) => {
    const now = new Date().toISOString();
    const reviewerName = level === 'finance'
      ? (safeLSGet('userNameFinance', '苏美玲') as string)
      : (safeLSGet('userNameDirector', '张建国') as string);

    set(s => {
      const nextApprovals = s.approvalRequests.map(a => {
        if (a.id !== id) return a;
        const na: ApprovalRequest = { ...a };
        if (level === 'finance') {
          na.financeReviewer = reviewerName;
          na.financeOpinion = opinion;
          na.financeTime = now;
          if (!approved) {
            na.status = 'rejected';
          } else {
            na.status = 'pending_director';
          }
        } else {
          na.directorReviewer = reviewerName;
          na.directorOpinion = opinion;
          na.directorTime = now;
          na.status = approved ? 'approved' : 'rejected';
        }
        return na;
      });
      safeLSSet(LS_KEYS.approvalRequests, nextApprovals);
      return { approvalRequests: nextApprovals, modalApprovalOpen: false, selectedApproval: null };
    });
  },

  // ========= 对账处理 =========
  updateReconStatus: (storeId, checkedIds, opinion, adjustment = 0) => {
    const now = new Date().toISOString();
    const checker = get().currentRole === 'finance'
      ? (safeLSGet('userNameFinance', '苏美玲') as string)
      : (safeLSGet('userNameDirector', '张建国') as string);

    set(s => {
      const store = s.storeReconSummaries.find(r => r.storeId === storeId);
      if (!store) return {};
      const existingSourceIds = new Set((store.reconLogs || []).map(l => l.sourceId));
      const newIds = checkedIds.filter(id => !existingSourceIds.has(id));
      if (newIds.length === 0) return {};
      const newLogs: ReconLogItem[] = newIds.map(sid => ({
        id: `RL${Date.now()}_${sid}`,
        sourceId: sid,
        checked: true,
        checker,
        checkTime: now,
        checkOpinion: opinion,
        adjustmentAmount: adjustment,
      }));
      const mergedLogs = [...(store.reconLogs || []), ...newLogs];

      const nextSummaries = s.storeReconSummaries.map(r => {
        if (r.storeId !== storeId) return r;
        const allIds = (r.diffSources || []).map(d => d.id);
        const allChecked = allIds.length > 0 && allIds.every(id => mergedLogs.find(l => l.sourceId === id));
        const next: StoreReconSummary = {
          ...r,
          reconLogs: mergedLogs,
          reconStatus: allChecked ? 'finished' : 'processing',
        };
        if (allChecked) {
          next.reconFinishedTime = now;
          next.reconFinishedBy = checker;
        }
        return next;
      });

      safeLSSet(buildStoreLogsKey(storeId), mergedLogs);

      const reconStatusKey = `aesthetic_recon_meta_${storeId}`;
      const updatedStore = nextSummaries.find(r => r.storeId === storeId)!;
      safeLSSet(reconStatusKey, {
        reconStatus: updatedStore.reconStatus,
        reconFinishedTime: updatedStore.reconFinishedTime,
        reconFinishedBy: updatedStore.reconFinishedBy,
      });

      return { storeReconSummaries: nextSummaries };
    });
  },
}));
