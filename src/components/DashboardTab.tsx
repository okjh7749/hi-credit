import React from 'react';
import { CreditCard, Smartphone, Wallet } from 'lucide-react';
import { AppDatabase } from '../types';
import {
  calcCardDates,
  diffDays,
  formatKRW,
  getTransferKrw,
  shortDate,
} from '../utils/dateUtils';

interface DashboardTabProps {
  db: AppDatabase;
  refDate: string;
  onNavigate: (tab: 'cards' | 'mvnos' | 'transfers') => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  db,
  refDate,
  onNavigate,
}) => {
  const { cards, mvnos, transfers, usdRate } = db;

  const totalMvno = mvnos.reduce((s, m) => s + m.currentFee, 0);
  const totalTransfer = transfers.reduce(
    (s, t) => s + getTransferKrw(t, usdRate),
    0
  );

  const statusColor: Record<string, string> = {
    해지금지: 'text-rose-300 bg-rose-500/15 border-rose-500/30',
    해지가능: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
    무사용대기: 'text-amber-300 bg-amber-500/15 border-amber-500/30',
    타겟가능: 'text-indigo-300 bg-indigo-500/15 border-indigo-500/30',
  };

  // Group transfers by category
  const transferGroups: Record<string, typeof transfers> = {};
  transfers.forEach((t) => {
    const c = t.category || '기타';
    if (!transferGroups[c]) transferGroups[c] = [];
    transferGroups[c].push(t);
  });

  return (
    <div className="space-y-4">
      {/* 1. 카드 한눈에 */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div
          onClick={() => onNavigate('cards')}
          className="px-3.5 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between cursor-pointer"
        >
          <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-indigo-400" />
            카드 현황 ({cards.length})
          </span>
          <span className="text-[11px] text-indigo-400 font-bold">
            관리 / 추가 →
          </span>
        </div>

        <div className="divide-y divide-slate-800/70 text-xs">
          {cards.map((c) => {
            const calc = calcCardDates(c, refDate);
            return (
              <div
                key={c.id}
                onClick={() => onNavigate('cards')}
                className="px-3.5 py-2 flex items-center justify-between gap-2 hover:bg-slate-800/40 cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                      statusColor[calc.status]
                    }`}
                  >
                    {calc.status}
                  </span>
                  <span className="font-bold text-white truncate">
                    {c.issuer} {c.name !== c.issuer ? c.name : ''}
                  </span>
                  {c.note && (
                    <span className="text-[11px] text-slate-400 truncate hidden sm:inline">
                      ({c.note})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                  {c.issueDate && (
                    <span className="text-slate-400">
                      발급 <span className="text-slate-200">{shortDate(c.issueDate)}</span>
                    </span>
                  )}
                  {c.lastUsedDate && (
                    <span className="text-slate-400">
                      사용 <span className="text-amber-200">{shortDate(c.lastUsedDate)}</span>
                    </span>
                  )}
                  {calc.lockEndDate && (
                    <span className="text-rose-300 font-bold">
                      → {shortDate(calc.lockEndDate)} 해지가능
                    </span>
                  )}
                  {!calc.lockEndDate && calc.noUseEndDate && (
                    <span className="text-emerald-300 font-bold">
                      → {shortDate(calc.noUseEndDate)} 무사용충족
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. 알뜰폰 & 자동이체 2열 배치 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 알뜰폰 한눈에 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div
            onClick={() => onNavigate('mvnos')}
            className="px-3.5 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between cursor-pointer"
          >
            <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              알뜰폰 ({mvnos.length}회선 · 월 {formatKRW(totalMvno)})
            </span>
            <span className="text-[11px] text-cyan-400 font-bold">관리 →</span>
          </div>

          <div className="divide-y divide-slate-800/70 text-xs">
            {mvnos.map((m) => {
              const jumpDays = diffDays(m.jumpDate, refDate);
              return (
                <div
                  key={m.id}
                  onClick={() => onNavigate('mvnos')}
                  className="px-3.5 py-2.5 flex items-center justify-between gap-2 hover:bg-slate-800/40 cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white">{m.provider}</span>
                      <span className="text-cyan-300 font-semibold">
                        {m.lineName}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        ({shortDate(m.joinDate)})
                      </span>
                    </div>
                    {m.benefit && (
                      <div className="text-[11px] text-indigo-300 mt-0.5">
                        혜택: {m.benefit}
                      </div>
                    )}
                  </div>

                  <div className="text-right font-mono shrink-0">
                    <div className="font-extrabold text-white">
                      {formatKRW(m.currentFee)}
                    </div>
                    {m.jumpDate && (
                      <div className="text-[11px] text-amber-300 font-bold">
                        {m.jumpDate.slice(2, 7).replace('-', '.')} →{' '}
                        {m.jumpFee ? formatKRW(m.jumpFee) : '인상'}
                        {jumpDays !== null && jumpDays > 0
                          ? ` (D-${jumpDays})`
                          : ''}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 자동이체 한눈에 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div
            onClick={() => onNavigate('transfers')}
            className="px-3.5 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between cursor-pointer"
          >
            <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-fuchsia-400" />
              자동이체 ({transfers.length}건 · 월 {formatKRW(totalTransfer)})
            </span>
            <span className="text-[11px] text-fuchsia-400 font-bold">
              카테고리/관리 →
            </span>
          </div>

          <div className="divide-y divide-slate-800/70 text-xs">
            {Object.entries(transferGroups).map(([cat, list]) => (
              <div key={cat} className="p-3 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-fuchsia-300">
                  <span>[{cat}]</span>
                  <span className="font-mono">
                    {formatKRW(
                      list.reduce((s, x) => s + getTransferKrw(x, usdRate), 0)
                    )}
                  </span>
                </div>
                {list.map((t, idx) => (
                  <div
                    key={t.id}
                    onClick={() => onNavigate('transfers')}
                    className="flex items-center justify-between text-xs pl-1 cursor-pointer hover:text-white"
                  >
                    <span className="text-slate-200">
                      {idx + 1}. {t.title}{' '}
                      {t.billingDay && (
                        <span className="text-indigo-300 font-mono text-[11px]">
                          /{t.billingDay}일
                        </span>
                      )}
                    </span>
                    <span className="font-mono font-bold text-slate-200">
                      {t.currency === 'USD'
                        ? `$${t.amount}`
                        : formatKRW(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
