import React, { useState } from 'react';
import {
  Edit3,
  Plus,
  Settings,
  Trash2,
  X,
} from 'lucide-react';
import { CardItem, IssuerRule } from '../types';
import {
  addMonthsEndOfMonth,
  addMonthsExact,
  calcCardDates,
  shortDate,
} from '../utils/dateUtils';

interface CardManagerTabProps {
  cards: CardItem[];
  issuerRules: IssuerRule[];
  refDate: string;
  onSaveCard: (card: CardItem) => void;
  onDeleteCard: (id: string) => void;
  onSaveIssuerRules: (rules: IssuerRule[]) => void;
}

export const CardManagerTab: React.FC<CardManagerTabProps> = ({
  cards,
  issuerRules,
  refDate,
  onSaveCard,
  onDeleteCard,
  onSaveIssuerRules,
}) => {
  const [filter, setFilter] = useState<'전체' | '해지금지' | '해지가능' | '무사용대기' | '타겟가능'>('전체');
  const [editingCard, setEditingCard] = useState<CardItem | null>(null);
  const [showRuleModal, setShowRuleModal] = useState(false);

  const getRuleForIssuer = (issuerName: string): IssuerRule => {
    return (
      issuerRules.find((r) => r.issuer === issuerName) || {
        issuer: issuerName,
        keepMonths: 12,
        noUseMonths: 6,
        noBenefitYears: 1,
      }
    );
  };

  const handleOpenNew = () => {
    const firstRule = issuerRules[0] || {
      issuer: '하나',
      keepMonths: 12,
      noUseMonths: 6,
      noBenefitYears: 1,
    };
    setEditingCard({
      id: `c-${Date.now()}`,
      issuer: firstRule.issuer,
      name: '',
      issueDate: '',
      benefitDate: '',
      lastUsedDate: '',
      keepMonths: firstRule.keepMonths,
      noUseMonths: firstRule.noUseMonths,
      noBenefitYears: firstRule.noBenefitYears,
      note: '',
    });
  };

  const enrichedCards = cards.map((c) => ({
    card: c,
    calc: calcCardDates(c, refDate),
  }));

  const filtered = enrichedCards.filter((item) =>
    filter === '전체' ? true : item.calc.status === filter
  );

  const statusStyle: Record<string, string> = {
    해지금지: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    해지가능: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    무사용대기: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    타겟가능: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
  };

  return (
    <div className="space-y-3">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 border border-slate-800 rounded-xl p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(['전체', '해지금지', '해지가능', '무사용대기', '타겟가능'] as const).map((st) => {
            const count =
              st === '전체'
                ? enrichedCards.length
                : enrichedCards.filter((x) => x.calc.status === st).length;
            return (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filter === st
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-950 text-slate-400 border border-slate-800'
                }`}
              >
                {st} {count}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowRuleModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-indigo-400" />
            카드사별 기준설정
          </button>
          <button
            onClick={handleOpenNew}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            카드 추가
          </button>
        </div>
      </div>

      {/* Compact One-Glance Card Rows */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800/80 overflow-hidden">
        {filtered.map(({ card, calc }) => (
          <div
            key={card.id}
            onClick={() => setEditingCard(card)}
            className="p-3 sm:px-4 hover:bg-slate-800/40 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2"
          >
            {/* Left: Issuer + Name + Status + Rule Tag */}
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                    statusStyle[calc.status]
                  }`}
                >
                  {calc.status}
                </span>
                <span className="text-sm font-extrabold text-white">
                  {card.issuer} {card.name !== card.issuer ? card.name : ''}
                </span>
                <span className="text-[11px] text-slate-400 font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                  M+{card.keepMonths} · 무사용{card.noUseMonths}M · 미수령{card.noBenefitYears}Y
                </span>
                {card.note && (
                  <span className="text-[11px] text-amber-300/90">
                    ({card.note})
                  </span>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`'${card.issuer} ${card.name}' 삭제할까요?`)) {
                    onDeleteCard(card.id);
                  }
                }}
                className="sm:hidden p-1 text-slate-500 hover:text-rose-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Right: Compact 3 Dates & Calculated Target Date */}
            <div className="flex items-center justify-between sm:justify-end gap-3 text-xs font-mono">
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                {card.issueDate && (
                  <span>
                    발급 <strong className="text-slate-200">{shortDate(card.issueDate)}</strong>
                  </span>
                )}
                {card.benefitDate && (
                  <span>
                    혜택 <strong className="text-slate-200">{shortDate(card.benefitDate)}</strong>
                  </span>
                )}
                {card.lastUsedDate && (
                  <span>
                    마지막사용{' '}
                    <strong className="text-amber-200">{shortDate(card.lastUsedDate)}</strong>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {calc.lockEndDate && (
                  <span className="px-2 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-200 font-bold text-xs">
                    해지가능 {shortDate(calc.lockEndDate)}
                    {calc.lockDays !== null && calc.lockDays > 0 && (
                      <span className="ml-1 text-rose-400">D-{calc.lockDays}</span>
                    )}
                  </span>
                )}

                {!calc.lockEndDate && calc.noUseEndDate && (
                  <span className="px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 font-bold text-xs">
                    무사용충족 {shortDate(calc.noUseEndDate)}
                    {calc.noUseDays !== null && calc.noUseDays > 0 && (
                      <span className="ml-1 text-amber-300">D-{calc.noUseDays}</span>
                    )}
                  </span>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`'${card.issuer} ${card.name}' 삭제할까요?`)) {
                      onDeleteCard(card.id);
                    }
                  }}
                  className="hidden sm:inline-flex p-1.5 text-slate-500 hover:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Card Add/Edit Simple Modal */}
      {editingCard && (
        <CardEditModal
          card={editingCard}
          issuerRules={issuerRules}
          getRuleForIssuer={getRuleForIssuer}
          onClose={() => setEditingCard(null)}
          onSave={(updated) => {
            onSaveCard(updated);
            setEditingCard(null);
          }}
        />
      )}

      {/* Per-Issuer Rules Modal */}
      {showRuleModal && (
        <IssuerRuleModal
          rules={issuerRules}
          onClose={() => setShowRuleModal(false)}
          onSave={(nextRules) => {
            onSaveIssuerRules(nextRules);
            setShowRuleModal(false);
          }}
        />
      )}
    </div>
  );
};

const CardEditModal: React.FC<{
  card: CardItem;
  issuerRules: IssuerRule[];
  getRuleForIssuer: (issuer: string) => IssuerRule;
  onClose: () => void;
  onSave: (card: CardItem) => void;
}> = ({ card, issuerRules, getRuleForIssuer, onClose, onSave }) => {
  const [form, setForm] = useState<CardItem>({ ...card });

  const handleSelectIssuer = (issuer: string) => {
    const rule = getRuleForIssuer(issuer);
    setForm((prev) => ({
      ...prev,
      issuer,
      keepMonths: rule.keepMonths,
      noUseMonths: rule.noUseMonths,
      noBenefitYears: rule.noBenefitYears,
    }));
  };

  const previewLockEnd = form.benefitDate
    ? addMonthsEndOfMonth(form.benefitDate, form.keepMonths)
    : '';
  const previewNoUseEnd = form.lastUsedDate
    ? addMonthsExact(form.lastUsedDate, form.noUseMonths)
    : '';
  const previewNoBenefitEnd = form.benefitDate
    ? addMonthsExact(form.benefitDate, form.noBenefitYears * 12)
    : '';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-slate-900 border-t sm:border border-slate-700 rounded-t-2xl sm:rounded-2xl max-w-md w-full p-5 space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white">카드 입력 (핵심 날짜만 입력)</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave({
              ...form,
              name: form.name.trim() || form.issuer,
            });
          }}
          className="space-y-3.5"
        >
          {/* Issuer Chips */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">
              카드사 선택 (선택 시 카드사별 기본 설정 자동 적용)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {issuerRules.map((r) => (
                <button
                  type="button"
                  key={r.issuer}
                  onClick={() => handleSelectIssuer(r.issuer)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                    form.issuer === r.issuer
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  {r.issuer}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs text-slate-400 mb-1">카드사명</label>
              <input
                type="text"
                required
                value={form.issuer}
                onChange={(e) => setForm({ ...form, issuer: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">카드명 (별칭)</label>
              <input
                type="text"
                placeholder="예: 제이드, 현아골2"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
              />
            </div>
          </div>

          {/* Core 3 Dates */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="grid grid-cols-1 gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-200 w-24 shrink-0">
                  1. 발급일
                </label>
                <input
                  type="date"
                  value={form.issueDate || ''}
                  onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                  className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-bold text-rose-300 w-24 shrink-0">
                  2. 혜택수령일
                </label>
                <input
                  type="date"
                  value={form.benefitDate || ''}
                  onChange={(e) => setForm({ ...form, benefitDate: e.target.value })}
                  className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-rose-500/40 rounded-lg text-xs text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-bold text-amber-300 w-24 shrink-0">
                  3. 마지막사용일
                </label>
                <input
                  type="date"
                  value={form.lastUsedDate || ''}
                  onChange={(e) => setForm({ ...form, lastUsedDate: e.target.value })}
                  className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-amber-500/40 rounded-lg text-xs text-white font-mono"
                />
              </div>
            </div>

            {/* M+12, NoUse Months, NoBenefit Years Quick Controls */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  해지금지 (M+N)
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-rose-300">M+</span>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={form.keepMonths}
                    onChange={(e) =>
                      setForm({ ...form, keepMonths: Number(e.target.value) || 12 })
                    }
                    className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  무사용 (개월)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={form.noUseMonths}
                    onChange={(e) =>
                      setForm({ ...form, noUseMonths: Number(e.target.value) || 6 })
                    }
                    className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono text-center"
                  />
                  <span className="text-xs text-slate-400 shrink-0">개월</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  혜택미수령 (년)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={form.noBenefitYears}
                    onChange={(e) =>
                      setForm({ ...form, noBenefitYears: Number(e.target.value) || 1 })
                    }
                    className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono text-center"
                  />
                  <span className="text-xs text-slate-400 shrink-0">년</span>
                </div>
              </div>
            </div>

            {/* Live Auto-Calculated Preview */}
            {(previewLockEnd || previewNoUseEnd) && (
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1 text-xs font-mono">
                {previewLockEnd && (
                  <div className="flex justify-between text-rose-300">
                    <span>→ 해지가능일 (M+{form.keepMonths} 말일):</span>
                    <strong>{previewLockEnd}</strong>
                  </div>
                )}
                {previewNoUseEnd && (
                  <div className="flex justify-between text-emerald-300">
                    <span>→ 무사용 {form.noUseMonths}개월 충족일:</span>
                    <strong>{previewNoUseEnd}</strong>
                  </div>
                )}
                {previewNoBenefitEnd && (
                  <div className="flex justify-between text-indigo-300">
                    <span>→ 혜택미수령 {form.noBenefitYears}년 충족일:</span>
                    <strong>{previewNoBenefitEnd}</strong>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">짧은 메모 (선택)</label>
            <input
              type="text"
              placeholder="예: 보수적 27.09.30 / 미해지 등"
              value={form.note || ''}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const IssuerRuleModal: React.FC<{
  rules: IssuerRule[];
  onClose: () => void;
  onSave: (rules: IssuerRule[]) => void;
}> = ({ rules, onClose, onSave }) => {
  const [list, setList] = useState<IssuerRule[]>(rules.map((r) => ({ ...r })));
  const [newIssuer, setNewIssuer] = useState('');

  const updateRow = (idx: number, field: keyof IssuerRule, val: string | number) => {
    setList((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-slate-900 border-t sm:border border-slate-700 rounded-t-2xl sm:rounded-2xl max-w-lg w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white">카드사별 기본 기준 설정</h3>
            <p className="text-[11px] text-slate-400">
              카드사마다 해지금지(M+N), 무사용 N개월, N년 이후 혜택미수령 조건을 설정합니다.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-slate-400 px-2">
            <div className="col-span-3">카드사</div>
            <div className="col-span-3 text-center">해지금지(M+)</div>
            <div className="col-span-3 text-center">무사용(개월)</div>
            <div className="col-span-3 text-center">혜택미수령(년)</div>
          </div>

          {list.map((r, idx) => (
            <div
              key={idx}
              className="grid grid-cols-12 gap-2 items-center bg-slate-950 p-2 rounded-lg border border-slate-800 text-xs"
            >
              <div className="col-span-3 font-bold text-white truncate">{r.issuer}</div>
              <div className="col-span-3 flex items-center justify-center gap-1">
                <span className="text-[11px] text-rose-300">M+</span>
                <input
                  type="number"
                  value={r.keepMonths}
                  onChange={(e) => updateRow(idx, 'keepMonths', Number(e.target.value) || 12)}
                  className="w-12 px-1 py-1 bg-slate-900 border border-slate-700 rounded text-center text-white font-mono"
                />
              </div>
              <div className="col-span-3 flex items-center justify-center gap-1">
                <input
                  type="number"
                  value={r.noUseMonths}
                  onChange={(e) => updateRow(idx, 'noUseMonths', Number(e.target.value) || 6)}
                  className="w-12 px-1 py-1 bg-slate-900 border border-slate-700 rounded text-center text-white font-mono"
                />
                <span className="text-[11px] text-slate-400">M</span>
              </div>
              <div className="col-span-3 flex items-center justify-center gap-1">
                <input
                  type="number"
                  value={r.noBenefitYears}
                  onChange={(e) => updateRow(idx, 'noBenefitYears', Number(e.target.value) || 1)}
                  className="w-12 px-1 py-1 bg-slate-900 border border-slate-700 rounded text-center text-white font-mono"
                />
                <span className="text-[11px] text-slate-400">년</span>
              </div>
            </div>
          ))}
        </div>

        {/* Add New Issuer */}
        <div className="flex gap-2 pt-2 border-t border-slate-800">
          <input
            type="text"
            placeholder="새 카드사 추가 (예: 토스, 카카오)"
            value={newIssuer}
            onChange={(e) => setNewIssuer(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
          />
          <button
            type="button"
            onClick={() => {
              if (newIssuer.trim()) {
                setList([
                  ...list,
                  {
                    issuer: newIssuer.trim(),
                    keepMonths: 12,
                    noUseMonths: 6,
                    noBenefitYears: 1,
                  },
                ]);
                setNewIssuer('');
              }
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-bold"
          >
            + 카드사 추가
          </button>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => onSave(list)}
            className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold"
          >
            기준 저장
          </button>
        </div>
      </div>
    </div>
  );
};
