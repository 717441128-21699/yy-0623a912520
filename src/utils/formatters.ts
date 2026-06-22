export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return '¥0.00';
  return '¥' + value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatCurrencyCompact = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return '¥0';
  if (Math.abs(value) >= 10000) {
    return '¥' + (value / 10000).toFixed(1) + '万';
  }
  return '¥' + Math.round(value).toLocaleString('zh-CN');
};

export const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return '0';
  return value.toLocaleString('zh-CN');
};

export const formatPercent = (value: number | null | undefined, fixed = 1): string => {
  if (value === null || value === undefined || isNaN(value)) return '0%';
  return (value * 100).toFixed(fixed) + '%';
};

export const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const formatDateTime = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDateRange = (start: string, end: string): string => {
  return `${formatDate(start)} ~ ${formatDate(end)}`;
};

export const formatDaysAgo = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return '今天';
  if (diff === 1) return '昨天';
  if (diff < 30) return `${diff}天前`;
  if (diff < 365) return `${Math.floor(diff / 30)}个月前`;
  return `${Math.floor(diff / 365)}年前`;
};

export const maskPhone = (phone: string): string => {
  if (!phone || phone.length < 7) return phone || '-';
  return phone.slice(0, 3) + '****' + phone.slice(-4);
};

export const formatTrend = (value: number): { text: string; color: string; icon: 'up' | 'down' | 'flat' } => {
  if (value > 0) return { text: `+${value.toFixed(1)}%`, color: 'text-emerald-600', icon: 'up' };
  if (value < 0) return { text: `${value.toFixed(1)}%`, color: 'text-red-600', icon: 'down' };
  return { text: '0%', color: 'text-zinc-500', icon: 'flat' };
};
