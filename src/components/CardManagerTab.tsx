import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Edit3,
  Lock,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Unlock,
  Wand2,
  X,
} from 'lucide-react';
import { CardEventItem, CardStatus, CustomField } from '../types';
import { addMonthsToDate, diffDays, formatDDay, formatKRW } from '../utils/dateUtils';

interface CardManagerTabProps {
  cards: CardEventItem[];
  refDate: string;
  onSaveCard: (card: CardEventItem) => void;
  onDeleteCard: (id: string) => void;
}

const ISSUER_PRESETS = [
  '하나카드',
  'BC카드',
  '우리카드',
  '현대카드',
  'IBK기업카드',
  '롯데카드',
  '삼성카드',
  'KB국민카드',
  '신한카드',
  'NH농협카드',
  '토스뱅크/카드',
  '카카오뱅크',
];

const STATUS_META: Record<
  CardStatus,
  { label: string; badgeClass: string; desc: string }
> = {
  locked: {
    label: '유지필수 (해지금지)',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    desc: '혜택 수령 후 의무 유지기간(보통 12개월) 중이어서 해지 시 환수 위험이 있는 카드',
  },
  cancellable: {
    label: '해지가능 / 정리대상',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    desc: '유지기간이 끝났거나 해지 가능한 상태 (가입일/조건 확인 후 해지 또는 재타겟)',
  },
  cooldown: {
    label: '쿨타임 대기 (무실적/미해지)',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    desc: '마지막 사용일 또는 탈회일 이후 6개월/12개월 무실적 쿨타임을 채우는 중인 카드',
  },
  target: {
    label: '신규타겟 후보',
    badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    desc: '현재 신규 발급 이벤트 응모가 가능한 타겟 대기 카드사 (예: 신한, 농협)',
  },
};

export const CardManagerTab: React.FC<CardManagerTabProps> = ({
  cards,
  refDate,
  onSaveCard,
  onDeleteCard,
}) => {
  const [statusFilter, setStatusFilter] = useState<CardStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCard, setEditingCard] = useState<CardEventItem | null>(null);

  const filteredCards = cards.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.issuer.toLowerCase().includes(q) ||
        c.cardName.toLowerCase().includes(q) ||
        (c.memo && c.memo.toLowerCase().includes(q)) ||
        (c.clawbackRule && c.clawbackRule.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleOpenNew = (defaultStatus: CardStatus = 'locked') => {
    setEditingCard({
      id: `card-${Date.now()}`,
      issuer: '신한카드',
      cardName: '',
      status: defaultStatus,
      issueDate: refDate,
      lockEndDatePrimary: addMonthsToDate(refDate, 14, true),
      rewardReceived: true,
      clawbackRule: '혜택제공 후 12개월 해지금지',
      memo: '',
      customFields: [],
    });
  };

  const handleQuickStatusChange = (card: CardEventItem, nextStatus: CardStatus) => {
    onSaveCard({
      ...card,
      status: nextStatus,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-400" />
            카드 신규 이벤트 · 해지금지 · 쿨타임 관리
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            혜택 수령 후 12개월 해지금지 만료일(1차/2차 보수적 기준)과 마지막 사용일 기반 무실적 기간을 관리합니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleOpenNew('locked')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            신규 카드 이벤트 등록
          </button>
          <button
            onClick={() => handleOpenNew('target')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            타겟 카드사 추가
          </button>
        </div>
      </div>

      {/* Filter Pills & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            전체 ({cards.length})
          </button>
          {(['locked', 'cancellable', 'cooldown', 'target'] as CardStatus[]).map((st) => {
            const count = cards.filter((c) => c.status === st).length;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {STATUS_META[st].label} ({count})
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="카드사, 카드명, 메모 검색..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCards.map((card) => {
          const meta = STATUS_META[card.status];
          const primaryDays = diffDays(card.lockEndDatePrimary, refDate);
          const primaryDDay = formatDDay(primaryDays);
          const secondaryDays = diffDays(card.lockEndDateSecondary, refDate);
          const secondaryDDay = formatDDay(secondaryDays);
          const reTargetDays = diffDays(card.reTargetDate, refDate);
          const reTargetDDay = formatDDay(reTargetDays);

          return (
            <div
              key={card.id}
              className="bg-slate-900/95 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all shadow-lg"
            >
              <div>
                {/* Top Row: Issuer + Status Badge + Edit/Delete */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-200 border border-slate-700">
                        {card.issuer}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${meta.badgeClass}`}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-white mt-2">
                      {card.cardName}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setEditingCard(card)}
                      className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                      title="수정"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`'${card.cardName}' 항목을 삭제하시겠습니까?`)) {
                          onDeleteCard(card.id);
                        }
                      }}
                      className="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-950/80 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Key Dates Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-3">
                  {card.issueDate && (
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-indigo-400" />
                        발급일
                      </div>
                      <div className="text-xs font-mono font-bold text-slate-200 mt-0.5">
                        {card.issueDate}
                      </div>
                    </div>
                  )}

                  {card.lastUsedDate && (
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        마지막 사용일
                      </div>
                      <div className="text-xs font-mono font-bold text-amber-200 mt-0.5">
                        {card.lastUsedDate}
                      </div>
                    </div>
                  )}

                  {card.lockEndDatePrimary && (
                    <div className="p-2.5 rounded-xl bg-slate-950/90 border border-rose-500/25">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-rose-300 font-semibold flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          해지가능일 (1차)
                        </span>
                        <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                          {primaryDDay.label}
                        </span>
                      </div>
                      <div className="text-xs font-mono font-bold text-white mt-1">
                        {card.lockEndDatePrimary} 이후
                      </div>
                    </div>
                  )}

                  {card.lockEndDateSecondary && (
                    <div className="p-2.5 rounded-xl bg-slate-950/90 border border-indigo-500/25">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-indigo-300 font-semibold flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          보수적 해지일 (2차)
                        </span>
                        <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                          {secondaryDDay.label}
                        </span>
                      </div>
                      <div className="text-xs font-mono font-bold text-white mt-1">
                        {card.lockEndDateSecondary} 이후
                      </div>
                    </div>
                  )}

                  {card.reTargetDate && (
                    <div className="p-2.5 rounded-xl bg-slate-950/90 border border-emerald-500/25">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1">
                          <Unlock className="w-3 h-3" />
                          신규타겟 가능 예상일
                        </span>
                        <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                          {reTargetDDay.label}
                        </span>
                      </div>
                      <div className="text-xs font-mono font-bold text-white mt-1">
                        {card.reTargetDate}
                      </div>
                    </div>
                  )}
                </div>

                {/* Rule & Memo */}
                {card.clawbackRule && (
                  <div className="text-xs text-slate-300 bg-slate-950/50 border border-slate-800/80 rounded-lg px-3 py-2 mb-2">
                    <span className="text-slate-400 font-semibold mr-1.5">조건:</span>
                    {card.clawbackRule}
                  </div>
                )}

                {card.rewardAmount ? (
                  <div className="text-xs text-emerald-300 mb-2">
                    혜택 금액: <strong>{formatKRW(card.rewardAmount)}</strong>{' '}
                    {card.rewardReceived ? '(수령완료)' : '(수령예정)'}
                  </div>
                ) : null}

                {card.memo && (
                  <p className="text-xs text-slate-400 leading-relaxed mb-2">{card.memo}</p>
                )}

                {/* Custom Fields */}
                {card.customFields && card.customFields.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {card.customFields.map((cf, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                      >
                        <strong className="text-slate-400">{cf.key}:</strong> {cf.value}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Quick Status Switch Bar */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500">빠른 상태 전환:</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {card.status === 'locked' && (
                    <button
                      onClick={() => handleQuickStatusChange(card, 'cancellable')}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-semibold transition-colors cursor-pointer"
                    >
                      해지가능으로 변경
                    </button>
                  )}
                  {card.status === 'cancellable' && (
                    <button
                      onClick={() => handleQuickStatusChange(card, 'cooldown')}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-semibold transition-colors cursor-pointer"
                    >
                      해지완료 (쿨타임 시작)
                    </button>
                  )}
                  {card.status === 'target' && (
                    <button
                      onClick={() =>
                        setEditingCard({
                          ...card,
                          status: 'locked',
                          issueDate: refDate,
                          lockEndDatePrimary: addMonthsToDate(refDate, 14, true),
                          clawbackRule: '혜택제공 12개월 해지금지',
                        })
                      }
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 font-semibold transition-colors cursor-pointer"
                    >
                      신규 발급 이벤트 시작하기 →
                    </button>
                  )}
                  <button
                    onClick={() => setEditingCard(card)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors cursor-pointer"
                  >
                    상세 편집
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {editingCard && (
        <CardEditModal
          card={editingCard}
          onClose={() => setEditingCard(null)}
          onSave={(updated) => {
            onSaveCard(updated);
            setEditingCard(null);
          }}
        />
      )}
    </div>
  );
};

interface CardEditModalProps {
  card: CardEventItem;
  onClose: () => void;
  onSave: (card: CardEventItem) => void;
}

const CardEditModal: React.FC<CardEditModalProps> = ({ card, onClose, onSave }) => {
  const [form, setForm] = useState<CardEventItem>({
    ...card,
    customFields: card.customFields ? [...card.customFields] : [],
  });

  const handleAddCustomField = () => {
    setForm((prev) => ({
      ...prev,
      customFields: [...(prev.customFields || []), { key: '', value: '' }],
    }));
  };

  const handleUpdateCustomField = (idx: number, field: keyof CustomField, val: string) => {
    setForm((prev) => {
      const next = [...(prev.customFields || [])];
      next[idx] = { ...next[idx], [field]: val };
      return { ...prev, customFields: next };
    });
  };

  const handleRemoveCustomField = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      customFields: (prev.customFields || []).filter((_, i) => i !== idx),
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-400" />
            카드 이벤트 정보 설정
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave({
              ...form,
              cardName: form.cardName.trim() || `${form.issuer} 카드`,
              customFields: (form.customFields || []).filter((f) => f.key.trim()),
            });
          }}
          className="space-y-4 mt-4"
        >
          {/* Quick Issuer Chips */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              카드사 빠른 선택
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {ISSUER_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setForm((p) => ({ ...p, issuer: preset }))}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                    form.issuer === preset
                      ? 'bg-indigo-600 text-white border-indigo-500 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                카드사명 (직접입력 가능)
              </label>
              <input
                type="text"
                required
                value={form.issuer}
                onChange={(e) => setForm({ ...form, issuer: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                카드 상품명 / 별칭
              </label>
              <input
                type="text"
                required
                placeholder="예: 하나 제이드, 현대 현아골2"
                value={form.cardName}
                onChange={(e) => setForm({ ...form, cardName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
              />
            </div>
          </div>

          {/* Status Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              현재 관리 상태
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['locked', 'cancellable', 'cooldown', 'target'] as CardStatus[]).map((st) => (
                <button
                  type="button"
                  key={st}
                  onClick={() => setForm({ ...form, status: st })}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    form.status === st
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">{STATUS_META[st].label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Dates & Auto-Calculator */}
          <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <Wand2 className="w-4 h-4" />
                주요 날짜 &amp; 자동 계산 도우미
              </span>
              {form.issueDate && (
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        lockEndDatePrimary: addMonthsToDate(form.issueDate!, 14, true),
                      })
                    }
                    className="text-[11px] px-2 py-1 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 cursor-pointer"
                  >
                    발급월+14개월 말일(1차) 자동입력
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        lockEndDateSecondary: addMonthsToDate(form.issueDate!, 16, true),
                      })
                    }
                    className="text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                  >
                    발급월+16개월 말일(2차) 자동입력
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">발급일</label>
                <input
                  type="date"
                  value={form.issueDate || ''}
                  onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  마지막 사용일 (무실적 기준)
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="date"
                    value={form.lastUsedDate || ''}
                    onChange={(e) => setForm({ ...form, lastUsedDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                  />
                  {form.lastUsedDate && (
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          reTargetDate: addMonthsToDate(form.lastUsedDate!, 6, false),
                        })
                      }
                      className="shrink-0 px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 text-[11px] border border-emerald-500/30 cursor-pointer"
                      title="마지막 사용일 + 6개월"
                    >
                      +6개월 타겟
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs text-rose-300 font-semibold mb-1">
                  해지가능일 (1차 기준일)
                </label>
                <input
                  type="date"
                  value={form.lockEndDatePrimary || ''}
                  onChange={(e) => setForm({ ...form, lockEndDatePrimary: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-rose-500/30 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-indigo-300 font-semibold mb-1">
                  해지가능일 (2차 보수적 기준일 - 선택)
                </label>
                <input
                  type="date"
                  value={form.lockEndDateSecondary || ''}
                  onChange={(e) => setForm({ ...form, lockEndDateSecondary: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-indigo-500/30 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-emerald-300 font-semibold mb-1">
                  신규 이벤트 재타겟 가능 예상일
                </label>
                <input
                  type="date"
                  value={form.reTargetDate || ''}
                  onChange={(e) => setForm({ ...form, reTargetDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-emerald-500/30 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">혜택 금액 (원, 선택)</label>
                <input
                  type="number"
                  placeholder="예: 150000"
                  value={form.rewardAmount || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      rewardAmount: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              해지금지 조항 / 이벤트 조건 요약
            </label>
            <input
              type="text"
              placeholder="예: 혜택제공 후 12개월 해지금지 (-> 27.07.31)"
              value={form.clawbackRule || ''}
              onChange={(e) => setForm({ ...form, clawbackRule: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">상세 메모</label>
            <textarea
              rows={2}
              value={form.memo || ''}
              onChange={(e) => setForm({ ...form, memo: e.target.value })}
              placeholder="연회비, 플랫폼(네이버페이/토스/뱅크샐러드), 특이사항 등 자유 기재"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
          </div>

          {/* Custom Extensible Fields */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300">
                확장 커스텀 정보 (원하는 항목 자유 추가)
              </span>
              <button
                type="button"
                onClick={handleAddCustomField}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> 항목 추가
              </button>
            </div>
            <div className="space-y-2">
              {(form.customFields || []).map((cf, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="항목명 (예: 응모처, 연회비)"
                    value={cf.key}
                    onChange={(e) => handleUpdateCustomField(i, 'key', e.target.value)}
                    className="w-1/3 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="내용 (예: 네이버페이 14만)"
                    value={cf.value}
                    onChange={(e) => handleUpdateCustomField(i, 'value', e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomField(i)}
                    className="p-1.5 text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30"
            >
              저장하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
