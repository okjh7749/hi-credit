import React, { useState } from 'react';
import {
  ArrowRightLeft,
  Bot,
  Calendar,
  CheckSquare,
  CreditCard,
  DollarSign,
  Edit3,
  FolderPlus,
  Plus,
  Sparkles,
  Square,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';
import { AI_AND_SUB_PRESETS, AiPreset } from '../initialData';
import {
  AutoTransferItem,
  BillingCycle,
  CurrencyCode,
  CustomField,
  SubCategory,
} from '../types';
import {
  formatAmountWithCurrency,
  formatKRW,
  getMonthlyNormalizedKrw,
} from '../utils/dateUtils';

interface AutoTransferTabProps {
  transfers: AutoTransferItem[];
  paymentGroups: string[];
  usdRate: number;
  onUpdateUsdRate: (rate: number) => void;
  onAddPaymentGroup: (group: string) => void;
  onSaveTransfer: (item: AutoTransferItem) => void;
  onDeleteTransfer: (id: string) => void;
  onBatchMovePaymentMethod: (ids: string[], targetPaymentMethod: string) => void;
}

const CATEGORIES: SubCategory[] = [
  'AI 구독',
  '통신/알뜰폰',
  '멤버십/쇼핑',
  'OTT/콘텐츠',
  '클라우드/SW',
  '공과금/보험',
  '기타',
];

const CATEGORY_BADGE: Record<SubCategory, string> = {
  'AI 구독': 'bg-violet-500/20 text-violet-300 border-violet-500/40',
  '통신/알뜰폰': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  '멤버십/쇼핑': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  'OTT/콘텐츠': 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  '클라우드/SW': 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  '공과금/보험': 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  기타: 'bg-slate-800 text-slate-300 border-slate-700',
};

export const AutoTransferTab: React.FC<AutoTransferTabProps> = ({
  transfers,
  paymentGroups,
  usdRate,
  onUpdateUsdRate,
  onAddPaymentGroup,
  onSaveTransfer,
  onDeleteTransfer,
  onBatchMovePaymentMethod,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<SubCategory | 'all'>('all');
  const [editingItem, setEditingItem] = useState<AutoTransferItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [targetMoveGroup, setTargetMoveGroup] = useState<string>(paymentGroups[0] || 'mgs');
  const [newGroupInput, setNewGroupInput] = useState('');

  // Discover all payment methods in use + configured groups
  const allGroups = Array.from(
    new Set([...paymentGroups, ...transfers.map((t) => t.paymentMethod).filter(Boolean)])
  );

  const filteredTransfers = transfers.filter((t) => {
    if (selectedGroup !== 'all' && t.paymentMethod !== selectedGroup) return false;
    if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
    return true;
  });

  const activeFiltered = filteredTransfers.filter((t) => t.isActive);
  const filteredMonthlyTotalKrw = activeFiltered.reduce(
    (sum, item) => sum + getMonthlyNormalizedKrw(item, usdRate),
    0
  );

  const handleOpenNew = (preset?: AiPreset) => {
    setEditingItem({
      id: `sub-${Date.now()}`,
      title: preset ? preset.title : '',
      category: preset ? preset.category : 'AI 구독',
      amount: preset ? preset.amount : 20,
      currency: preset ? preset.currency : 'KRW',
      billingCycle: preset ? preset.billingCycle : 'monthly',
      billingDay: undefined,
      paymentMethod: selectedGroup !== 'all' ? selectedGroup : paymentGroups[0] || 'mgs',
      isActive: true,
      memo: preset ? preset.memo : '',
      customFields: [],
    });
  };

  const toggleSelectId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllFiltered = () => {
    if (selectedIds.length === filteredTransfers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTransfers.map((t) => t.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & USD Exchange Rate Control */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-fuchsia-400" />
            자동이체 · AI 구독 · 정기결제 통합 허브
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            결제수단(mgs, 카드별) 그룹 정리, 통신비/멤버십 출금일, 달러($) 결제 AI 구독료까지 한곳에서 확장성 있게 관리합니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* USD Exchange Rate Adjuster */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">적용 환율($1):</span>
            <input
              type="number"
              value={usdRate}
              onChange={(e) => onUpdateUsdRate(Number(e.target.value) || 1400)}
              className="w-16 px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-white font-mono text-right"
            />
            <span className="text-slate-400">원</span>
          </div>

          <button
            onClick={() => handleOpenNew()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-bold shadow-lg shadow-fuchsia-600/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            자동이체 / AI 구독 추가
          </button>
        </div>
      </div>

      {/* Quick AI & Popular Subscription Presets Bar */}
      <div className="bg-gradient-to-r from-violet-950/50 via-slate-900 to-slate-900 border border-violet-500/30 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold text-violet-300 flex items-center gap-1.5">
            <Bot className="w-4 h-4 text-violet-400" />
            AI 요금제 &amp; 주요 구독 원클릭 프리셋 (클릭 시 바로 입력창 오픈)
          </span>
          <span className="text-[11px] text-slate-400">
            외화($) 자동 원화 환산 지원
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {AI_AND_SUB_PRESETS.map((preset) => (
            <button
              key={preset.title}
              onClick={() => handleOpenNew(preset)}
              className="group flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/90 hover:bg-violet-600/20 border border-slate-800 hover:border-violet-500/50 text-xs transition-all cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-violet-400 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-slate-200 group-hover:text-white">
                {preset.title}
              </span>
              <span className="text-[11px] font-mono text-violet-300 bg-violet-500/10 px-1.5 py-0.2 rounded">
                {preset.currency === 'USD'
                  ? `$${preset.amount}`
                  : formatKRW(preset.amount)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Payment Method Group Tabs (e.g. mgs, cards) + Add New Group */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-fuchsia-400" />
              결제수단 / 그룹별 보기:
            </span>
            <button
              onClick={() => setSelectedGroup('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedGroup === 'all'
                  ? 'bg-fuchsia-600 text-white shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              전체 ({transfers.length})
            </button>
            {allGroups.map((g) => {
              const count = transfers.filter((t) => t.paymentMethod === g).length;
              return (
                <button
                  key={g}
                  onClick={() => setSelectedGroup(g)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedGroup === g
                      ? 'bg-fuchsia-600 text-white shadow'
                      : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
                  }`}
                >
                  {g} ({count})
                </button>
              );
            })}
          </div>

          {/* Add Custom Payment Group */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newGroupInput.trim()) {
                onAddPaymentGroup(newGroupInput.trim());
                setSelectedGroup(newGroupInput.trim());
                setNewGroupInput('');
              }
            }}
            className="flex items-center gap-1.5"
          >
            <input
              type="text"
              placeholder="새 결제카드/그룹명 추가..."
              value={newGroupInput}
              onChange={(e) => setNewGroupInput(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white w-40"
            />
            <button
              type="submit"
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5 text-fuchsia-400" />
              그룹추가
            </button>
          </form>
        </div>

        {/* Category Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              카테고리 전체
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-300">
            현재 필터 월 합계:{' '}
            <strong className="text-fuchsia-300 font-extrabold text-sm">
              {formatKRW(filteredMonthlyTotalKrw)}
            </strong>
          </div>
        </div>
      </div>

      {/* Batch Payment Method Switcher Bar (When items are checked) */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-indigo-950/70 border border-indigo-500/40 animate-fadeIn">
          <div className="flex items-center gap-2 text-xs text-indigo-200">
            <ArrowRightLeft className="w-4 h-4 text-indigo-400" />
            <span>
              선택된 <strong>{selectedIds.length}개</strong> 자동이체 항목의 결제수단(카드)을 일괄 변경:
            </span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={targetMoveGroup}
              onChange={(e) => setTargetMoveGroup(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-indigo-500/40 rounded-lg text-xs text-white"
            >
              {allGroups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                onBatchMovePaymentMethod(selectedIds, targetMoveGroup);
                setSelectedIds([]);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
            >
              일괄 이동 적용
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs cursor-pointer"
            >
              선택해제
            </button>
          </div>
        </div>
      )}

      {/* Transfers List Table / Cards */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <button
            onClick={toggleSelectAllFiltered}
            className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer"
          >
            {selectedIds.length === filteredTransfers.length &&
            filteredTransfers.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-indigo-400" />
            ) : (
              <Square className="w-4 h-4 text-slate-500" />
            )}
            <span>전체 선택 (카드 교체 시 일괄 이동용)</span>
          </button>
          <span className="text-xs text-slate-400">
            총 {filteredTransfers.length}건
          </span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {filteredTransfers.map((item) => {
            const formatted = formatAmountWithCurrency(
              item.amount,
              item.currency,
              usdRate
            );
            const isChecked = selectedIds.includes(item.id);

            return (
              <div
                key={item.id}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors ${
                  !item.isActive ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleSelectId(item.id)}
                    className="mt-1 text-slate-400 hover:text-indigo-400 cursor-pointer"
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-indigo-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30 uppercase">
                        {item.paymentMethod}
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                          CATEGORY_BADGE[item.category] || CATEGORY_BADGE['기타']
                        }`}
                      >
                        {item.category}
                      </span>
                      {item.billingDay && (
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          매월 {item.billingDay}일
                        </span>
                      )}
                      {item.billingCycle === 'yearly' && (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          연간결제
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-white">{item.title}</h4>

                    {item.accountInfo && (
                      <p className="text-xs text-cyan-300/90">{item.accountInfo}</p>
                    )}
                    {item.memo && (
                      <p className="text-xs text-slate-400">{item.memo}</p>
                    )}

                    {item.customFields && item.customFields.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.customFields.map((cf, i) => (
                          <span
                            key={i}
                            className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                          >
                            <strong className="text-slate-400">{cf.key}:</strong> {cf.value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 pl-7 sm:pl-0">
                  <div className="text-right">
                    <div className="text-base font-extrabold text-white">
                      {formatted.primary}
                      <span className="text-xs font-normal text-slate-400">
                        /{item.billingCycle === 'yearly' ? '년' : '월'}
                      </span>
                    </div>
                    {formatted.secondary && (
                      <div className="text-xs text-emerald-300 font-medium">
                        {formatted.secondary}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setEditingItem(item)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> 수정
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`'${item.title}' 자동이체 항목을 삭제하시겠습니까?`)) {
                          onDeleteTransfer(item.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {editingItem && (
        <AutoTransferEditModal
          item={editingItem}
          paymentGroups={allGroups}
          usdRate={usdRate}
          onClose={() => setEditingItem(null)}
          onSave={(updated) => {
            onSaveTransfer(updated);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
};

interface AutoTransferEditModalProps {
  item: AutoTransferItem;
  paymentGroups: string[];
  usdRate: number;
  onClose: () => void;
  onSave: (item: AutoTransferItem) => void;
}

const AutoTransferEditModal: React.FC<AutoTransferEditModalProps> = ({
  item,
  paymentGroups,
  usdRate,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState<AutoTransferItem>({
    ...item,
    customFields: item.customFields ? [...item.customFields] : [],
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

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-fuchsia-400" />
            자동이체 · 정기구독 상세 설정
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
              title: form.title.trim() || '정기결제 항목',
              paymentMethod: form.paymentMethod.trim() || 'mgs',
              customFields: (form.customFields || []).filter((f) => f.key.trim()),
            });
          }}
          className="space-y-4 mt-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                항목명 (서비스/통신사명)
              </label>
              <input
                type="text"
                required
                placeholder="예: ChatGPT Plus, 네이버 멤버쉽, m모바일"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                카테고리
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value as SubCategory })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount & Currency & Cycle */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">통화 단위</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['KRW', 'USD'] as CurrencyCode[]).map((cur) => (
                    <button
                      type="button"
                      key={cur}
                      onClick={() => setForm({ ...form, currency: cur })}
                      className={`py-2 rounded-lg text-xs font-bold border cursor-pointer ${
                        form.currency === cur
                          ? 'bg-fuchsia-600/20 border-fuchsia-500 text-fuchsia-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      {cur === 'KRW' ? '₩ 원화(KRW)' : '$ 달러(USD)'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  결제 금액 ({form.currency === 'USD' ? '$' : '원'})
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white font-mono"
                />
                {form.currency === 'USD' && (
                  <p className="text-[11px] text-emerald-400 mt-1">
                    환산 약 {formatKRW(form.amount * usdRate)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">결제 주기</label>
                <select
                  value={form.billingCycle}
                  onChange={(e) =>
                    setForm({ ...form, billingCycle: e.target.value as BillingCycle })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                >
                  <option value="monthly">매월 (월간)</option>
                  <option value="yearly">매년 (연간)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Payment Method & Billing Day */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-fuchsia-300 mb-1">
                결제수단 / 자동이체 그룹 (예: mgs, 카드명)
              </label>
              <input
                type="text"
                list="transfer-payment-groups"
                required
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-fuchsia-500/40 rounded-xl text-xs text-white"
              />
              <datalist id="transfer-payment-groups">
                {paymentGroups.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                매월 결제일 (1~31일, 선택)
              </label>
              <input
                type="number"
                min={1}
                max={31}
                placeholder="예: 11, 15, 25"
                value={form.billingDay || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    billingDay: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-300 mb-1">
                연결 계정 / 회선 정보 (선택)
              </label>
              <input
                type="text"
                placeholder="예: 구글계정, 아이폰유심 등"
                value={form.accountInfo || ''}
                onChange={(e) => setForm({ ...form, accountInfo: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">
                해지/갱신 점검 알림일 (선택)
              </label>
              <input
                type="date"
                value={form.nextCancelCheckDate || ''}
                onChange={(e) =>
                  setForm({ ...form, nextCancelCheckDate: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-300 mb-1">메모</label>
            <textarea
              rows={2}
              value={form.memo || ''}
              onChange={(e) => setForm({ ...form, memo: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
          </div>

          {/* Custom Extensible Fields */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300">
                확장 커스텀 정보 (예: 파티원, 프로모션 코드 등)
              </span>
              <button
                type="button"
                onClick={handleAddCustomField}
                className="text-xs text-fuchsia-400 hover:text-fuchsia-300 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> 항목 추가
              </button>
            </div>
            <div className="space-y-2">
              {(form.customFields || []).map((cf, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="항목명"
                    value={cf.key}
                    onChange={(e) => handleUpdateCustomField(idx, 'key', e.target.value)}
                    className="w-1/3 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="값"
                    value={cf.value}
                    onChange={(e) => handleUpdateCustomField(idx, 'value', e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-bold shadow-lg shadow-fuchsia-600/30"
            >
              저장하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
