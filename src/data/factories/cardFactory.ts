import type { CourseCard, OverviewStats, StoreSaleStat, ProjectDistStat } from '@/shared/types';
import { STORES } from '../seed/stores';
import { PROJECTS, CATEGORIES } from '../seed/projects';
import { CONSULTANTS, CUSTOMER_NAMES, CUSTOMER_PHONE_PREFIXES } from '../seed/consultants';
import { calculateUnitPrice, calculateRedeemedAmount, calculatePendingAmount } from '@/utils/calculations';

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randChoice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const pad = (n: number, len = 6) => n.toString().padStart(len, '0');

const generatePhone = () => {
  const prefix = randChoice(CUSTOMER_PHONE_PREFIXES);
  return prefix + randInt(10000000, 99999999).toString();
};

const randomDateWithinMonths = (monthsBack: number, endOffset = 0) => {
  const now = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - monthsBack);
  const end = new Date();
  end.setDate(end.getDate() - endOffset);
  const time = randInt(start.getTime(), end.getTime());
  return new Date(time).toISOString().split('T')[0];
};

const projectPricing: Record<string, { priceRange: [number, number]; sessionRange: [number, number] }> = {
  PJ001: { priceRange: [28000, 68000], sessionRange: [1, 3] },
  PJ002: { priceRange: [18000, 48000], sessionRange: [1, 3] },
  PJ003: { priceRange: [15000, 35000], sessionRange: [2, 5] },
  PJ004: { priceRange: [3800, 9800], sessionRange: [5, 12] },
  PJ005: { priceRange: [5800, 18800], sessionRange: [3, 8] },
  PJ006: { priceRange: [4800, 12800], sessionRange: [4, 8] },
  PJ007: { priceRange: [8800, 28800], sessionRange: [1, 3] },
  PJ008: { priceRange: [3800, 9800], sessionRange: [2, 4] },
  PJ009: { priceRange: [1800, 4800], sessionRange: [1, 3] },
  PJ010: { priceRange: [2800, 6800], sessionRange: [5, 12] },
  PJ011: { priceRange: [4800, 12800], sessionRange: [4, 10] },
  PJ012: { priceRange: [1800, 4800], sessionRange: [5, 12] },
  PJ013: { priceRange: [980, 2800], sessionRange: [6, 15] },
  PJ014: { priceRange: [2800, 6800], sessionRange: [5, 10] },
};

const generateOneCard = (index: number): CourseCard => {
  const project = randChoice(PROJECTS);
  const pricing = projectPricing[project.id];
  const store = randChoice(STORES);
  const storeConsultants = CONSULTANTS.filter(c => c.storeId === store.id);
  const consultant = storeConsultants.length > 0 ? randChoice(storeConsultants) : randChoice(CONSULTANTS);
  const customerName = CUSTOMER_NAMES[index % CUSTOMER_NAMES.length];

  const paidSessions = randInt(pricing.sessionRange[0], pricing.sessionRange[1]);
  const giftedRatio = [0, 0, 0.1, 0.15, 0.2, 0.25][randInt(0, 5)];
  const giftedSessions = Math.floor(paidSessions * giftedRatio);
  const totalSessions = paidSessions + giftedSessions;

  const basePrice = randInt(pricing.priceRange[0], pricing.priceRange[1]);
  const saleAmount = Math.round(basePrice * paidSessions / 100) * 100;
  const unitPrice = calculateUnitPrice(saleAmount, paidSessions, giftedSessions);

  const usedSessions = Math.random() < 0.25 ? 0 : randInt(0, totalSessions);
  const remainingSessions = totalSessions - usedSessions;
  const redeemedAmount = calculateRedeemedAmount(unitPrice, usedSessions);
  const pendingAmount = calculatePendingAmount(saleAmount, redeemedAmount);

  const saleDate = randomDateWithinMonths(12);
  const expiry = new Date(saleDate);
  expiry.setFullYear(expiry.getFullYear() + 1);
  const expiryDate = expiry.toISOString().split('T')[0];

  const lastRedemptionDate = usedSessions > 0 ? randomDateWithinMonths(4) : null;

  let status: CourseCard['status'] = 'active';
  if (remainingSessions <= 0) status = 'completed';
  else if (new Date(expiryDate) < new Date()) status = 'expired';

  const changeCount = [0, 0, 0, 0, 1, 1, 2, 3, 4][randInt(0, 8)];
  const manualDeductionCount = [0, 0, 0, 0, 0, 0, 1, 2][randInt(0, 7)];
  const hasNegativeBalance = remainingSessions < 0 || Math.random() < 0.02;
  const expiredRedeemed = status === 'expired' && Math.random() < 0.1;
  if (hasNegativeBalance || expiredRedeemed) status = 'abnormal';

  return {
    id: `CRD${pad(index + 1, 6)}`,
    cardNo: `LC${new Date(saleDate).getFullYear()}${pad(index + 1001, 6)}`,
    customerName,
    customerPhone: generatePhone(),
    projectId: project.id,
    projectName: project.name,
    categoryId: project.categoryId,
    categoryName: project.categoryName,
    storeId: store.id,
    storeName: store.name,
    consultantId: consultant.id,
    consultantName: consultant.name,
    saleDate,
    saleAmount,
    giftedSessions,
    paidSessions,
    totalSessions,
    unitPrice: Math.round(unitPrice * 100) / 100,
    usedSessions,
    remainingSessions,
    redeemedAmount: Math.round(redeemedAmount * 100) / 100,
    pendingAmount: Math.round(pendingAmount * 100) / 100,
    expiryDate,
    status,
    changeCount,
    lastRedemptionDate,
    manualDeductionCount,
    hasNegativeBalance,
    expiredRedeemed,
  };
};

export const generateCourseCards = (count = 180): CourseCard[] => {
  return Array.from({ length: count }, (_, i) => generateOneCard(i));
};

export const computeOverviewStats = (cards: CourseCard[]): OverviewStats => {
  const totalSaleAmount = cards.reduce((s, c) => s + c.saleAmount, 0);
  const totalSessions = cards.reduce((s, c) => s + c.totalSessions, 0);
  const totalRedeemedAmount = cards.reduce((s, c) => s + c.redeemedAmount, 0);
  const totalPendingAmount = cards.reduce((s, c) => s + c.pendingAmount, 0);
  const totalUnservedSessions = cards.reduce((s, c) => s + c.remainingSessions, 0);
  const completedCount = cards.filter(c => c.status === 'completed').length;
  const abnormalCount = cards.filter(c => c.status === 'abnormal').length;
  const avgFulfillmentRate = cards.length > 0
    ? cards.reduce((s, c) => s + (c.totalSessions > 0 ? c.usedSessions / c.totalSessions : 0), 0) / cards.length
    : 0;
  return {
    totalSaleAmount,
    totalSessions,
    totalRedeemedAmount,
    totalPendingAmount,
    totalUnservedSessions,
    cardCount: cards.length,
    completedCount,
    abnormalCount,
    avgFulfillmentRate,
    saleAmountTrend: randInt(-5, 18) + Math.random(),
    redeemedAmountTrend: randInt(-3, 12) + Math.random(),
  };
};

export const computeStoreSaleStats = (cards: CourseCard[]): StoreSaleStat[] => {
  const map = new Map<string, StoreSaleStat>();
  STORES.forEach(s => map.set(s.id, {
    storeId: s.id,
    storeName: s.name,
    saleAmount: 0,
    cardCount: 0,
    sessions: 0,
  }));
  cards.forEach(c => {
    const stat = map.get(c.storeId)!;
    stat.saleAmount += c.saleAmount;
    stat.cardCount += 1;
    stat.sessions += c.totalSessions;
  });
  return Array.from(map.values()).sort((a, b) => b.saleAmount - a.saleAmount);
};

export const computeProjectDistribution = (cards: CourseCard[]): ProjectDistStat[] => {
  const map = new Map<string, { categoryName: string; value: number; color: string }>();
  CATEGORIES.forEach(c => map.set(c.id, { categoryName: c.name, value: 0, color: c.color }));
  cards.forEach(c => {
    const stat = map.get(c.categoryId)!;
    if (stat) stat.value += c.saleAmount;
  });
  return Array.from(map.values()).filter(s => s.value > 0);
};
