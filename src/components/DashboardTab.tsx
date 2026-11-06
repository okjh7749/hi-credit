import React from 'react';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Smartphone,
  Sparkles,
  TrendingUp,
  Wallet,
  ArrowRight,
  ShieldAlert,
  Clock,
} from 'lucide-react';
import { AppDatabase } from '../types';
import {
  diffDays,
  formatDDay,
  formatKRW,
  getMonthlyNormalizedKrw,
} from '../utils/dateUtils';

interface DashboardTabProps {
  db: AppDatabase;
  refDate: string;
  onNavigate: (tab: 'cards' | 'mvnos' | 'transfers') => void;
  onOpenMemoModal: () => void;
}

interface TimelineEvent {
  id: string;
  date: string;
  daysLeft: number;
  category: 'card-lock' | 'card-conservative' | 'card-cooldown' | 'mvno-jump' | 'sub-check';
  title: string;
  subtitle: string;
  badgeText: string;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  db,
  refDate,
  onNavigate,
  onOpenMemoModal,
}) => {
  const { cards, mvnos, transfers, settings } = db;
  const usdRate = settings.usdToKrwRate || 1400;

  const lockedCards = cards.filter((c) => c.status === 'locked');
  const cancellableCards = cards.filter((c) => c.status === 'cancellable');
  const targetCards = cards.filter((c) => c.status === 'target');
  const cooldownCards = cards.filter((c) => c.status === 'cooldown');

  const activeMvnos = mvnos.filter((m) => m.isActive);
  const activeTransfers = transfers.filter((t) => t.isActive);

  const totalMonthlyTransferKrw = activeTransfers.reduce(
    (acc, item) => acc + getMonthlyNormalizedKrw(item, usdRate),
    0
  );

  const aiSubMonthlyKrw = activeTransfers
    .filter((t) => t.category === 'AI 구독')
    .reduce((acc, item) => acc + getMonthlyNormalizedKrw(item, usdRate), 0);

  // Build unified upcoming timeline events
  const timelineEvents: TimelineEvent[] = [];

  cards.forEach((c) => {
    if (c.lockEndDatePrimary) {
      const d = diffDays(c.lockEndDatePrimary, refDate);
      if (d !== null) {
        timelineEvents.push({
          id: `tl-card-p-${c.id}`,
          date: c.lockEndDatePrimary,
          daysLeft: d,
          category: 'card-lock',
          title: `[카드 해지가능 1차] ${c.cardName}`,
          subtitle: c.clawbackRule || '혜택 유지기간 만료일',
          badgeText: '카드 해지금지 해제',
        });
      }
    }
    if (c.lockEndDateSecondary) {
      const d = diffDays(c.lockEndDateSecondary, refDate);
      if (d !== null) {
        timelineEvents.push({
          id: `tl-card-s-${c.id}`,
          date: c.lockEndDateSecondary,
          daysLeft: d,
          category: 'card-conservative',
          title: `[카드 보수적 만기] ${c.cardName}`,
          subtitle: `2차 보수적 해지가능 기준일 (${c.lockEndDateSecondary})`,
          badgeText: '보수적 해지일',
        });
      }
    }
    if (c.reTargetDate && (c.status === 'cooldown' || c.status === 'cancellable')) {
      const d = diffDays(c.reTargetDate, refDate);
      if (d !== null) {
        timelineEvents.push({
          id: `tl-card-r-${c.id}`,
          date: c.reTargetDate,
          daysLeft: d,
          category: 'card-cooldown',
          title: `[카드 무실적/재진입] ${c.cardName}`,
          subtitle: `마지막 사용일(${c.lastUsedDate || '-'}) 기준 신규타겟 가능일`,
          badgeText: '쿨타임 해제',
        });
      }
    }
  });

  activeMvnos.forEach((m) => {
    if (m.priceJumpDate) {
      const d = diffDays(m.priceJumpDate, refDate);
      if (d !== null) {
        timelineEvents.push({
          id: `tl-mvno-${m.id}`,
          date: m.priceJumpDate,
          daysLeft: d,
          category: 'mvno-jump',
          title: `[알뜰폰 요금인상 주의] ${m.provider} (${m.lineLabel})`,
          subtitle: `${formatKRW(m.currentFee)} → ${
            m.afterFee ? formatKRW(m.afterFee) : '정상요금'
          } 인상 예정 ${m.monthlyPerks ? `(${m.monthlyPerks})` : ''}`,
          badgeText: '번이/해지 타이밍',
        });
      }
    }
  });

  activeTransfers.forEach((t) => {
    if (t.nextCancelCheckDate) {
      const d = diffDays(t.nextCancelCheckDate, refDate);
      if (d !== null) {
        timelineEvents.push({
          id: `tl-sub-${t.id}`,
          date: t.nextCancelCheckDate,
          daysLeft: d,
          category: 'sub-check',
          title: `[구독 점검/해지예정] ${t.title}`,
          subtitle: `${t.paymentMethod} 결제 · ${t.memo || ''}`,
          badgeText: '구독 점검일',
        });
      }
    }
  });

  timelineEvents.sort((a, b) => a.daysLeft - b.daysLeft);

  // Payment method group breakdown
  const groupTotals: Record<string, { count: number; totalKrw: number }> = {};
  activeTransfers.forEach((t) => {
    const g = t.paymentMethod || '미지정';
    if (!groupTotals[g]) groupTotals[g] = { count: 0, totalKrw: 0 };
    groupTotals[g].count += 1;
    groupTotals[g].totalKrw += getMonthlyNormalizedKrw(t, usdRate);
  });

  return (
    <div className="space-y-6">
      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => onNavigate('cards')}
          className="text-left group bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 transition-all shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full">
              카드 해지금지 / 유지중
            </span>
            <CreditCard className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{lockedCards.length}</span>
            <span className="text-sm text-slate-400">개 유지 필수</span>
          </div>
          <p className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span>해지가능 {cancellableCards.length} · 쿨타임 {cooldownCards.length}</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
          </p>
        </button>

        <button
          onClick={() => onNavigate('cards')}
          className="text-left group bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 transition-all shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
              신규 타겟 / 해지가능
            </span>
            <Sparkles className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {targetCards.length + cancellableCards.length}
            </span>
            <span className="text-sm text-slate-400">개 카드사</span>
          </div>
          <p className="mt-2 text-xs text-slate-400 truncate">
            타겟 후보: {targetCards.map((c) => c.issuer.replace('카드', '')).join(', ') || '없음'} / 정리:{' '}
            {cancellableCards.map((c) => c.issuer.replace('카드', '')).join(', ') || '없음'}
          </p>
        </button>

        <button
          onClick={() => onNavigate('mvnos')}
          className="text-left group bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 transition-all shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full">
              알뜰폰 활성 회선
            </span>
            <Smartphone className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{activeMvnos.length}</span>
            <span className="text-sm text-slate-400">
              회선 ({formatKRW(activeMvnos.reduce((s, m) => s + m.currentFee, 0))}/월)
            </span>
          </div>
          <p className="mt-2 text-xs text-amber-300/90 truncate">
            인상 예정: {activeMvnos.filter((m) => m.priceJumpDate).length}건 (27.05 / 27.06)
          </p>
        </button>

        <button
          onClick={() => onNavigate('transfers')}
          className="text-left group bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-fuchsia-500/50 rounded-2xl p-5 transition-all shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-fuchsia-400 bg-fuchsia-500/10 px-2.5 py-1 rounded-full">
              자동이체 · AI 구독 총액
            </span>
            <Wallet className="w-5 h-5 text-fuchsia-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">
              {formatKRW(totalMonthlyTransferKrw)}
            </span>
            <span className="text-xs text-slate-400">/월</span>
          </div>
          <p className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span>
              총 {activeTransfers.length}건 (AI 구독 {formatKRW(aiSubMonthlyKrw)})
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-fuchsia-400 transition-all" />
          </p>
        </button>
      </div>

      {/* Main Two-Column Section: Upcoming Timeline & Payment Method Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Action Radar / D-Day Timeline */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-indigo-400" />
                주요 일정 &amp; 해지·번이 타이밍 레이더
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                기준일({refDate})로부터 카드 해지금지 만료일, 무실적 쿨타임, 알뜰폰 요금 인상일을 자동 추적합니다.
              </p>
            </div>
            <button
              onClick={onOpenMemoModal}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              카톡 메모 가져오기 / 내보내기
            </button>
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {timelineEvents.map((ev) => {
              const dday = formatDDay(ev.daysLeft);
              const isConservative = ev.category === 'card-conservative';
              const isMvno = ev.category === 'mvno-jump';

              let badgeColor = 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
              if (isConservative) {
                badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
              } else if (isMvno) {
                badgeColor = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
              } else if (ev.category === 'card-cooldown') {
                badgeColor = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
              }

              let ddayBadge = 'bg-slate-800 text-slate-300';
              if (dday.tone === 'urgent') ddayBadge = 'bg-rose-500/20 text-rose-300 border border-rose-500/40';
              else if (dday.tone === 'soon') ddayBadge = 'bg-amber-500/20 text-amber-300 border border-amber-500/40';
              else if (dday.tone === 'passed') ddayBadge = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';

              return (
                <div
                  key={ev.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${badgeColor}`}>
                        {ev.badgeText}
                      </span>
                      <span className="text-sm font-bold text-slate-100">{ev.title}</span>
                    </div>
                    <p className="text-xs text-slate-400">{ev.subtitle}</p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 shrink-0">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${ddayBadge}`}>
                      {dday.label}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{ev.date}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Auto-Transfer Payment Group & Monthly Billing Calendar */}
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-fuchsia-400" />
                결제수단(그룹)별 자동이체 요약
              </h3>
              <button
                onClick={() => onNavigate('transfers')}
                className="text-xs text-fuchsia-400 hover:underline"
              >
                상세관리 →
              </button>
            </div>

            <div className="space-y-3">
              {Object.entries(groupTotals).map(([groupName, info]) => (
                <div
                  key={groupName}
                  className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white uppercase">{groupName}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-fuchsia-500/15 text-fuchsia-300 font-medium">
                        {info.count}건
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      연결된 정기결제·통신비·멤버십 합계
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-extrabold text-white">
                      {formatKRW(info.totalKrw)}
                    </div>
                    <div className="text-[11px] text-slate-500">월 환산</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Monthly Billing Days Quick Bar */}
            <div className="mt-5 pt-5 border-t border-slate-800">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                매월 정기 출금일 체크
              </h4>
              <div className="space-y-2">
                {activeTransfers
                  .filter((t) => t.billingDay)
                  .sort((a, b) => (a.billingDay || 99) - (b.billingDay || 99))
                  .map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-slate-950/50 border border-slate-800/60"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                          매월 {t.billingDay}일
                        </span>
                        <span className="text-slate-200 font-medium">{t.title}</span>
                      </div>
                      <span className="text-slate-300 font-semibold">
                        {t.currency === 'USD'
                          ? `$${t.amount} (${formatKRW(t.amount * usdRate)})`
                          : formatKRW(t.amount)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Quick Card Churning Status Guide Box */}
          <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-indigo-200 flex items-center gap-2 mb-2">
              <ShieldAlert className="w-4 h-4 text-indigo-400" />
              현재 메모 기준 핵심 체크포인트
            </h3>
            <ul className="space-y-2 text-xs text-slate-300 leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">하나 제이드:</strong> 1차 해지가능일{' '}
                  <code className="text-indigo-300">2026-12-31</code> (보수적 기준{' '}
                  <code className="text-indigo-300">2027-09-30</code>)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">롯데 / 삼성 / 국민:</strong> 롯데(26.1 마지막사용) 해지가능, 삼성(26.7 마지막사용, 5년 조건 확인), 국민(26.9.15 마지막사용, 미해지)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">KT M모바일 2회선:</strong> 아이폰유심은{' '}
                  <code className="text-amber-300">27년 5월(3.5만)</code>, 이심은{' '}
                  <code className="text-amber-300">27년 6월(6만)</code> 요금 인상 전 번이 필수!
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
