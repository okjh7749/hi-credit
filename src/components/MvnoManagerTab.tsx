import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { MvnoItem } from '../types';
import { diffDays, formatKRW, shortDate } from '../utils/dateUtils';

interface MvnoManagerTabProps {
  mvnos: MvnoItem[];
  refDate: string;
  onSaveMvno: (item: MvnoItem) => void;
  onDeleteMvno: (id: string) => void;
}

export const MvnoManagerTab: React.FC<MvnoManagerTabProps> = ({
  mvnos,
  refDate,
  onSaveMvno,
  onDeleteMvno,
}) => {
  const [editing, setEditing] = useState<MvnoItem | null>(null);

  const totalCurrent = mvnos.reduce((s, m) => s + m.currentFee, 0);

  return (
    <div className="space-y-3">
      {/* Top Bar */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-3">
        <div className="text-xs text-slate-300">
          총 <strong>{mvnos.length}회선</strong> · 월 합계{' '}
          <strong className="text-cyan-300 text-sm font-extrabold">
            {formatKRW(totalCurrent)}
          </strong>
        </div>

        <button
          onClick={() =>
            setEditing({
              id: `m-${Date.now()}`,
              provider: 'kt m모바일',
              lineName: '',
              joinDate: refDate,
              currentFee: 16300,
              jumpDate: '',
              jumpFee: undefined,
              benefit: '',
            })
          }
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          회선 추가
        </button>
      </div>

      {/* Compact List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800/80 overflow-hidden">
        {mvnos.map((m) => {
          const jumpDays = diffDays(m.jumpDate, refDate);
          return (
            <div
              key={m.id}
              onClick={() => setEditing(m)}
              className="p-3 sm:px-4 hover:bg-slate-800/40 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-extrabold text-white">
                    {m.provider}
                  </span>
                  <span className="text-xs font-semibold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                    {m.lineName}
                  </span>
                  {m.benefit && (
                    <span className="text-xs text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      +{m.benefit}
                    </span>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`'${m.provider} ${m.lineName}' 삭제할까요?`)) {
                      onDeleteMvno(m.id);
                    }
                  }}
                  className="sm:hidden p-1 text-slate-500 hover:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 text-xs font-mono">
                <span className="text-slate-400">
                  가입 <strong className="text-slate-200">{shortDate(m.joinDate)}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-white font-extrabold text-sm">
                    {formatKRW(m.currentFee)}
                  </span>

                  {m.jumpDate && (
                    <span className="px-2 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
                      {m.jumpDate.slice(2, 7).replace('-', '.')}부터{' '}
                      {m.jumpFee ? `${(m.jumpFee / 10000).toFixed(1).replace('.0', '')}만` : '인상'}
                      {jumpDays !== null && jumpDays > 0 && (
                        <span className="ml-1 text-rose-300">D-{jumpDays}</span>
                      )}
                    </span>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`'${m.provider} ${m.lineName}' 삭제할까요?`)) {
                        onDeleteMvno(m.id);
                      }
                    }}
                    className="hidden sm:inline-flex p-1.5 text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border-t sm:border border-slate-700 rounded-t-2xl sm:rounded-2xl max-w-md w-full p-5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">알뜰폰 회선 설정</h3>
              <button onClick={() => setEditing(null)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSaveMvno({
                  ...editing,
                  lineName: editing.lineName.trim() || '유심',
                });
                setEditing(null);
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">통신사</label>
                  <input
                    type="text"
                    required
                    placeholder="예: kt m모바일"
                    value={editing.provider}
                    onChange={(e) => setEditing({ ...editing, provider: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    회선구분 / 뒷번호
                  </label>
                  <input
                    type="text"
                    placeholder="예: 아이폰유심, 이심, 6306"
                    value={editing.lineName}
                    onChange={(e) => setEditing({ ...editing, lineName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">가입일</label>
                  <input
                    type="date"
                    required
                    value={editing.joinDate}
                    onChange={(e) => setEditing({ ...editing, joinDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">현재 월요금 (원)</label>
                  <input
                    type="number"
                    required
                    value={editing.currentFee}
                    onChange={(e) =>
                      setEditing({ ...editing, currentFee: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs text-amber-300 mb-1">
                    요금인상 예정일 (선택)
                  </label>
                  <input
                    type="date"
                    value={editing.jumpDate || ''}
                    onChange={(e) => setEditing({ ...editing, jumpDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-amber-500/30 rounded-lg text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-amber-300 mb-1">
                    인상 후 요금 (원, 선택)
                  </label>
                  <input
                    type="number"
                    placeholder="예: 35000, 60000"
                    value={editing.jumpFee || ''}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        jumpFee: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-amber-500/30 rounded-lg text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  제공 혜택 / 스펙 (선택)
                </label>
                <input
                  type="text"
                  placeholder="예: 무제한, 밀리의서재, 쿠팡 5천원"
                  value={editing.benefit || ''}
                  onChange={(e) => setEditing({ ...editing, benefit: e.target.value })}
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
                  className="px-5 py-2 rounded-lg bg-cyan-600 text-white text-xs font-bold"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
