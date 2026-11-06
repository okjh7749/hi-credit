import { AutoTransferItem, CurrencyCode } from '../types';

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function diffDays(targetDateStr?: string, refDateStr?: string): number | null {
  if (!targetDateStr) return null;
  const ref = refDateStr ? new Date(refDateStr + 'T00:00:00') : new Date();
  const target = new Date(targetDateStr + 'T00:00:00');
  if (isNaN(target.getTime()) || isNaN(ref.getTime())) return null;
  const diffMs = target.getTime() - ref.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function formatDDay(days: number | null): {
  label: string;
  tone: 'urgent' | 'soon' | 'safe' | 'passed' | 'neutral';
} {
  if (days === null) {
    return { label: '미지정', tone: 'neutral' };
  }
  if (days === 0) {
    return { label: 'D-Day (오늘)', tone: 'urgent' };
  }
  if (days < 0) {
    return { label: `D+${Math.abs(days)} (경과/완료)`, tone: 'passed' };
  }
  if (days <= 30) {
    return { label: `D-${days} (임박)`, tone: 'urgent' };
  }
  if (days <= 90) {
    return { label: `D-${days}`, tone: 'soon' };
  }
  return { label: `D-${days}`, tone: 'safe' };
}

export function addMonthsToDate(dateStr: string, months: number, endOfMonth = false): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return '';
  if (endOfMonth) {
    const target = new Date(d.getFullYear(), d.getMonth() + months + 1, 0);
    const y = target.getFullYear();
    const m = String(target.getMonth() + 1).padStart(2, '0');
    const day = String(target.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } else {
    const target = new Date(d.getFullYear(), d.getMonth() + months, d.getDate());
    const y = target.getFullYear();
    const m = String(target.getMonth() + 1).padStart(2, '0');
    const day = String(target.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}

export function formatKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(Math.round(amount)) + '원';
}

export function formatAmountWithCurrency(
  amount: number,
  currency: CurrencyCode,
  usdRate: number
): { primary: string; secondary?: string; monthlyKrw: number } {
  if (currency === 'USD') {
    const krw = Math.round(amount * usdRate);
    return {
      primary: `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
      secondary: `약 ${formatKRW(krw)}`,
      monthlyKrw: krw,
    };
  }
  return {
    primary: formatKRW(amount),
    monthlyKrw: amount,
  };
}

export function getMonthlyNormalizedKrw(item: AutoTransferItem, usdRate: number): number {
  const baseKrw = item.currency === 'USD' ? item.amount * usdRate : item.amount;
  return item.billingCycle === 'yearly' ? Math.round(baseKrw / 12) : Math.round(baseKrw);
}
