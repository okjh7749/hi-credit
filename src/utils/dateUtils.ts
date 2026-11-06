import { AutoTransferItem, CardItem } from '../types';

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addMonthsEndOfMonth(dateStr: string, months: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return '';
  const target = new Date(d.getFullYear(), d.getMonth() + months + 1, 0);
  const y = target.getFullYear();
  const m = String(target.getMonth() + 1).padStart(2, '0');
  const day = String(target.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addMonthsExact(dateStr: string, months: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return '';
  const target = new Date(d.getFullYear(), d.getMonth() + months, d.getDate());
  const y = target.getFullYear();
  const m = String(target.getMonth() + 1).padStart(2, '0');
  const day = String(target.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function diffDays(targetDateStr?: string, refDateStr?: string): number | null {
  if (!targetDateStr) return null;
  const ref = refDateStr ? new Date(refDateStr + 'T00:00:00') : new Date();
  const target = new Date(targetDateStr + 'T00:00:00');
  if (isNaN(target.getTime()) || isNaN(ref.getTime())) return null;
  return Math.round((target.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24));
}

export function shortDate(dateStr?: string): string {
  if (!dateStr) return '-';
  return dateStr.slice(2).replace(/-/g, '.');
}

export function calcCardDates(card: CardItem, refDate: string) {
  // 1. 해지가능일 (혜택수령일 기준 M + keepMonths 말일)
  const lockEndDate = card.benefitDate
    ? addMonthsEndOfMonth(card.benefitDate, card.keepMonths)
    : undefined;

  // 2. 무사용 N개월 충족일 (마지막사용일 + noUseMonths)
  const noUseEndDate = card.lastUsedDate
    ? addMonthsExact(card.lastUsedDate, card.noUseMonths)
    : undefined;

  // 3. N년 이후 혜택미수령자 충족일 (혜택수령일 + noBenefitYears * 12)
  const noBenefitEndDate = card.benefitDate
    ? addMonthsExact(card.benefitDate, card.noBenefitYears * 12)
    : undefined;

  const lockDays = diffDays(lockEndDate, refDate);
  const noUseDays = diffDays(noUseEndDate, refDate);

  // 상태 판정
  let status: '해지금지' | '해지가능' | '무사용대기' | '타겟가능' = '타겟가능';
  if (lockEndDate && lockDays !== null && lockDays > 0) {
    status = '해지금지';
  } else if (noUseEndDate && noUseDays !== null && noUseDays > 0) {
    status = '무사용대기';
  } else if (card.lastUsedDate || lockEndDate) {
    status = '해지가능';
  } else {
    status = '타겟가능';
  }

  return {
    status,
    lockEndDate,
    lockDays,
    noUseEndDate,
    noUseDays,
    noBenefitEndDate,
  };
}

export function formatKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(Math.round(amount)) + '원';
}

export function getTransferKrw(item: AutoTransferItem, usdRate: number): number {
  return item.currency === 'USD' ? Math.round(item.amount * usdRate) : item.amount;
}
