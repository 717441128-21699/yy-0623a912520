export const calculateUnitPrice = (saleAmount: number, paidSessions: number, giftedSessions: number): number => {
  const effectiveSessions = paidSessions + giftedSessions;
  if (effectiveSessions === 0) return 0;
  return saleAmount / effectiveSessions;
};

export const calculateRedeemedAmount = (unitPrice: number, usedSessions: number): number => {
  return unitPrice * usedSessions;
};

export const calculatePendingAmount = (saleAmount: number, redeemedAmount: number): number => {
  return saleAmount - redeemedAmount;
};

export const calculateFulfillmentRate = (usedSessions: number, totalSessions: number): number => {
  if (totalSessions === 0) return 0;
  return usedSessions / totalSessions;
};

export const calculatePressureRatio = (
  requiredHours: number,
  deviceCapacity: number,
  therapistCapacity: number
): number => {
  const totalCapacity = Math.min(deviceCapacity, therapistCapacity);
  if (totalCapacity === 0) return 1;
  return Math.min(requiredHours / totalCapacity, 1);
};

export const sumByKey = <T>(arr: T[], key: keyof T): number => {
  return arr.reduce((sum, item) => sum + (Number(item[key]) || 0), 0);
};

export const groupAndSum = <T, K extends keyof T>(
  arr: T[],
  groupKey: K,
  sumKey: keyof T,
  labelMap?: Record<string, string>
): { key: string; label: string; value: number }[] => {
  const map = new Map<string, number>();
  const labelMap2 = new Map<string, string>();
  arr.forEach((item) => {
    const k = String(item[groupKey]);
    const current = map.get(k) || 0;
    map.set(k, current + (Number(item[sumKey]) || 0));
    if (labelMap && !labelMap2.has(k)) {
      labelMap2.set(k, labelMap[k] || k);
    }
  });
  return Array.from(map.entries()).map(([key, value]) => ({
    key,
    label: labelMap2.get(key) || key,
    value,
  }));
};

export const isLongIdle = (lastRedemptionDate: string | null, saleDate: string): boolean => {
  const now = new Date();
  const refDate = lastRedemptionDate ? new Date(lastRedemptionDate) : new Date(saleDate);
  const days = (now.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24);
  return days > 90;
};

export const isExpired = (expiryDate: string): boolean => {
  return new Date(expiryDate) < new Date();
};
