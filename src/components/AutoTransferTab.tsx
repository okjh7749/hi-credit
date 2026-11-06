import React, { useState } from 'react';
import { FolderPlus, Plus, Trash2, X } from 'lucide-react';
import { AutoTransferItem } from '../types';
import { formatKRW, getTransferKrw } from '../utils/dateUtils';

interface AutoTransferTabProps {
  transfers: AutoTransferItem[];
  categories: string[];
  usdRate: number;
  onSaveTransfer: (item: AutoTransferItem) => void;
  onDeleteTransfer: (id: string) => void;
  onSaveCategories: (cats: string[]) => void;
}

export const AutoTransferTab: React.FC<AutoTransferTabProps> = ({
  transfers,
  categories,
  usdRate,
  onSaveTransfer,
  onDeleteTransfer,
  onSaveCategories,
}) => {
  const [selectedCat, setSelectedCat] = useState<string>('전체');
  const [editing, setEditing] = useState<AutoTransferItem | null>(null);
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');

  const allCategories = Array.from(
    new Set([...categories, ...transfers.map((t) => t.category).filter(Boolean)])
  );

  const visibleTransfers =
    selectedCat === '전체'
      ? transfers
      : transfers.filter((t) => t.category === selectedCat);

  const totalKrw = visibleTransfers.reduce(
    (sum, t) => sum + getTransferKrw(t, usdRate),
    0
  );

  // Group by category for clean display
  const grouped: Record<string, AutoTransferItem[]> = {};
  visibleTransfers.forEach((t) => {
    const c = t.category || '미분류';
    if (!grouped[c]) grouped[c] = [];
    grouped[c].push(t);
  });

  return (
    <div className="space-y-3">
      {/* Top Category Bar & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 border border-slate-800 rounded-xl p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedCat('전체')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
              selectedCat === '전체'
                ? 'bg-fuchsia-600 text-white'
                : 'bg-slate-950 text-slate-400 border border-slate-800'
            }`}
          >
            전체 ({transfers.length})
          </button>
          {allCategories.map((cat) => {
            const cnt = transfers.filter((t) => t.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  selectedCat === cat
                    ? 'bg-fuchsia-600 text-white'
                    : 'bg-slate-950 text-slate-300 border border-slate-800'
                }`}
              >
                {cat} ({cnt})
              </button>
            );
          })}
          <button
            onClick={() => setShowCatModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5 text-fuchsia-400" />
            카테고리 관리
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs text-slate-300">
            합계{' '}
            <strong className="text-fuchsia-300 text-sm font-extrabold">
              {formatKRW(totalKrw)}
            </strong>
          </span>
          <button
            onClick={() =>
              setEditing({
                id: `t-${Date.now()}`,
                category:
                  selectedCat !== '전체'
                    ? selectedCat
                    : allCategories[0] || 'mgs',
                title: '',
                amount: 0,
                currency: 'KRW',
                billingDay: undefined,
                memo: '',
              })
            }
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-bold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            항목 추가
          </button>
        </div>
      </div>

      {/* Category Grouped Compact Lists */}
      <div className="space-y-3">
        {Object.entries(grouped).map(([catName, list]) => {
          const subTotal = list.reduce(
            (s, x) => s + getTransferKrw(x, usdRate),
            0
          );
          return (
            <div
              key={catName}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
            >
              <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-extrabold text-fuchsia-300 uppercase">
                  {catName} ({list.length})
                </span>
                <span className="text-xs font-mono font-bold text-slate-300">
                  소계 {formatKRW(subTotal)}
                </span>
              </div>

              <div className="divide-y divide-slate-800/80">
                {list.map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() => setEditing(item)}
                    className="p-3 sm:px-4 hover:bg-slate-800/40 transition-colors cursor-pointer flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-mono text-slate-500">
                        {idx + 1}.
                      </span>
                      <span className="text-sm font-bold text-white truncate">
                        {item.title}
                      </span>
                      {item.billingDay && (
                        <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700 shrink-0">
                          {item.billingDay}일
                        </span>
                      )}
                      {item.memo && (
                        <span className="text-xs text-slate-400 truncate">
                          ({item.memo})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 font-mono">
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-white">
                          {item.currency === 'USD'
                            ? `$${item.amount}`
                            : formatKRW(item.amount)}
                        </span>
                        {item.currency === 'USD' && (
                          <span className="text-[11px] text-slate-400 ml-1">
                            ({formatKRW(item.amount * usdRate)})
                          </span>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`'${item.title}' 삭제할까요?`)) {
                            onDeleteTransfer(item.id);
                          }
                        }}
                        className="p-1 text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit AutoTransfer Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border-t sm:border border-slate-700 rounded-t-2xl sm:rounded-2xl max-w-md w-full p-5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">자동이체 항목 설정</h3>
              <button onClick={() => setEditing(null)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const cat = editing.category.trim() || '기타';
                if (!allCategories.includes(cat)) {
                  onSaveCategories([...allCategories, cat]);
                }
                onSaveTransfer({
                  ...editing,
                  category: cat,
                  title: editing.title.trim() || '자동이체',
                });
                setEditing(null);
              }}
              className="space-y-3"
            >
              {/* Category Select or Direct Input */}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  카테고리 선택 (또는 아래에 새 카테고리 직접 입력)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {allCategories.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setEditing({ ...editing, category: c })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                        editing.category === c
                          ? 'bg-fuchsia-600 text-white border-fuchsia-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  required
                  placeholder="카테고리명 (예: mgs, 통신비, 멤버십, AI 등)"
                  value={editing.category}
                  onChange={(e) =>
                    setEditing({ ...editing, category: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">항목명</label>
                <input
                  type="text"
                  required
                  placeholder="예: 네이버 멤버쉽, 쿠팡 멤버쉽, m모바일"
                  value={editing.title}
                  onChange={(e) =>
                    setEditing({ ...editing, title: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">통화</label>
                  <select
                    value={editing.currency}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        currency: e.target.value as 'KRW' | 'USD',
                      })
                    }
                    className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  >
                    <option value="KRW">원(₩)</option>
                    <option value="USD">달러($)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">금액</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editing.amount || ''}
                    onChange={(e) =>
                      setEditing({ ...editing, amount: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    결제일 (일)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    placeholder="예: 25"
                    value={editing.billingDay || ''}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        billingDay: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  메모 (선택)
                </label>
                <input
                  type="text"
                  placeholder="간단 메모"
                  value={editing.memo || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, memo: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-fuchsia-600 text-white text-xs font-bold"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border-t sm:border border-slate-700 rounded-t-2xl sm:rounded-2xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">자동이체 카테고리 관리</h3>
              <button
                onClick={() => setShowCatModal(false)}
                className="text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {allCategories.map((c) => (
                <div
                  key={c}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white font-bold"
                >
                  <span>{c}</span>
                  <button
                    onClick={() =>
                      onSaveCategories(allCategories.filter((x) => x !== c))
                    }
                    className="text-slate-500 hover:text-rose-400"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (
                  newCatInput.trim() &&
                  !allCategories.includes(newCatInput.trim())
                ) {
                  onSaveCategories([...allCategories, newCatInput.trim()]);
                  setNewCatInput('');
                }
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                placeholder="새 카테고리 이름..."
                value={newCatInput}
                onChange={(e) => setNewCatInput(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-fuchsia-600 text-white text-xs font-bold"
              >
                추가
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
