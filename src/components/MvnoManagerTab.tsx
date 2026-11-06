import React, { useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CreditCard,
  Edit3,
  Gift,
  Plus,
  RefreshCw,
  Signal,
  Smartphone,
  Trash2,
  TrendingUp,
  Wand2,
  X,
} from 'lucide-react';
import { CustomField, MvnoEventItem, NetworkCarrier, SimType } from '../types';
import { addMonthsToDate, diffDays, formatDDay, formatKRW } from '../utils/dateUtils';

interface MvnoManagerTabProps {
  mvnos: MvnoEventItem[];
  paymentGroups: string[];
  refDate: string;
  onSaveMvno: (mvno: MvnoEventItem, syncTransfer?: boolean) => void;
  onDeleteMvno: (id: string) => void;
}

const MVNO_PROVIDERS = [
  'KT M모바일',
  'LG 티플러스 (tplus)',
  'LG 유모바일',
  'SK 세븐모바일',
  'KT 스카이라이프',
  'KB 리브모바일',
  '헬로모바일',
  '프리티',
  '모빙',
  '이야기모바일',
];

export const MvnoManagerTab: React.FC<MvnoManagerTabProps> = ({
  mvnos,
  paymentGroups,
  refDate,
  onSaveMvno,
  onDeleteMvno,
}) => {
  const [editingMvno, setEditingMvno] = useState<MvnoEventItem | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const visibleMvnos = mvnos.filter((m) => (showInactive ? true : m.isActive));
  const totalCurrentFee = mvnos
    .filter((m) => m.isActive)
    .reduce((acc, m) => acc + m.currentFee, 0);
  const totalAfterFee = mvnos
    .filter((m) => m.isActive)
    .reduce((acc, m) => acc + (m.afterFee || m.currentFee), 0);

  const handleOpenNew = () => {
    setEditingMvno({
      id: `mvno-${Date.now()}`,
      provider: 'KT M모바일',
      network: 'KT망',
      lineLabel: '',
      phoneTail: '',
      simType: 'USIM',
      joinDate: refDate,
      minKeepDate: addMonthsToDate(refDate, 3, false),
      currentFee: 16300,
      afterFee: 35000,
      priceJumpDate: addMonthsToDate(refDate, 7, false).slice(0, 8) + '01',
      billingDay: 11,
      paymentGroup: paymentGroups[0] || 'mgs',
      dataSpec: '',
      monthlyPerks: '',
      isActive: true,
      memo: '',
      customFields: [],
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Summary Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-cyan-400" />
            알뜰폰(MVNO) 신규개통 · 프로모션 인상일 · 제휴혜택 관리
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            회선별 유심/이심 구분, 할인 종료 후 인상 요금(번이 타이밍), 매월 제공 혜택(밀리의서재, 쿠팡 등)을 관리합니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <span className="text-slate-400 mr-2">현재 월 총 요금:</span>
            <strong className="text-cyan-300 font-extrabold text-sm">
              {formatKRW(totalCurrentFee)}
            </strong>
            {totalAfterFee > totalCurrentFee && (
              <span className="text-rose-400 ml-2 text-[11px]">
                (할인종료 시 {formatKRW(totalAfterFee)})
              </span>
            )}
          </div>

          <button
            onClick={handleOpenNew}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            신규 알뜰폰 회선 추가
          </button>
        </div>
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">
          총 <strong>{visibleMvnos.length}</strong>개 회선 표시 중
        </span>
        <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded border-slate-700 bg-slate-900 text-cyan-500"
          />
          해지/번이 완료된 이전 회선도 보기
        </label>
      </div>

      {/* MVNO Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {visibleMvnos.map((mvno) => {
          const jumpDays = diffDays(mvno.priceJumpDate, refDate);
          const jumpDDay = formatDDay(jumpDays);
          const minKeepDays = diffDays(mvno.minKeepDate, refDate);
          const minKeepDDay = formatDDay(minKeepDays);
          const priceDiff =
            mvno.afterFee && mvno.afterFee > mvno.currentFee
              ? mvno.afterFee - mvno.currentFee
              : 0;

          const netColor =
            mvno.network === 'KT망'
              ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
              : mvno.network === 'LGU+망'
              ? 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30'
              : 'bg-amber-500/15 text-amber-300 border-amber-500/30';

          return (
            <div
              key={mvno.id}
              className={`bg-slate-900/95 border rounded-2xl p-5 flex flex-col justify-between transition-all shadow-lg ${
                mvno.isActive
                  ? 'border-slate-800 hover:border-cyan-500/40'
                  : 'border-slate-800/50 opacity-60'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${netColor}`}>
                        {mvno.network}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                          mvno.simType === 'eSIM'
                            ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {mvno.simType}
                      </span>
                      {mvno.phoneTail && (
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-emerald-300 border border-slate-700">
                          #{mvno.phoneTail}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-extrabold text-white mt-2">
                      {mvno.provider} · {mvno.lineLabel}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingMvno(mvno)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                      title="수정"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`'${mvno.provider} ${mvno.lineLabel}' 회선을 삭제하시겠습니까?`)) {
                          onDeleteMvno(mvno.id);
                        }
                      }}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 cursor-pointer"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Pricing Highlight Box */}
                <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 my-3">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-[11px] text-slate-400">현재 프로모션 월 요금</div>
                      <div className="text-xl font-extrabold text-white mt-0.5">
                        {formatKRW(mvno.currentFee)}
                        <span className="text-xs font-normal text-slate-400"> /월</span>
                      </div>
                    </div>

                    {mvno.afterFee ? (
                      <div className="text-right">
                        <div className="text-[11px] text-amber-300 flex items-center justify-end gap-1">
                          <TrendingUp className="w-3 h-3" />
                          인상 후 요금
                        </div>
                        <div className="text-sm font-bold text-rose-300 mt-0.5">
                          {formatKRW(mvno.afterFee)}
                          {priceDiff > 0 && (
                            <span className="text-[11px] text-rose-400 block">
                              (+{formatKRW(priceDiff)} 인상)
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-right">
                        <span className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          평생할인 / 변동없음
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Jump Date Alert */}
                  {mvno.priceJumpDate && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-xs text-amber-300 font-semibold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        요금 인상(번이 권장): {mvno.priceJumpDate.slice(0, 7)}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                        {jumpDDay.label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Dates & Perks */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                      개통(가입)일:
                    </span>
                    <span className="font-mono font-bold">{mvno.joinDate}</span>
                  </div>

                  {mvno.minKeepDate && (
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">의무유지(3개월) 기준:</span>
                      <span className="font-mono">
                        {mvno.minKeepDate}{' '}
                        <span className="text-[11px] text-slate-400">({minKeepDDay.label})</span>
                      </span>
                    </div>
                  )}

                  {mvno.dataSpec && (
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Signal className="w-3.5 h-3.5 text-indigo-400" />
                        데이터/요금제 스펙:
                      </span>
                      <span className="font-semibold text-indigo-200">{mvno.dataSpec}</span>
                    </div>
                  )}

                  {mvno.monthlyPerks && (
                    <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between">
                      <span className="text-indigo-300 font-semibold flex items-center gap-1.5">
                        <Gift className="w-3.5 h-3.5" />
                        제휴/매월 혜택
                      </span>
                      <span className="font-bold text-white">{mvno.monthlyPerks}</span>
                    </div>
                  )}

                  {mvno.paymentGroup && (
                    <div className="flex items-center justify-between text-slate-300 pt-1">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-fuchsia-400" />
                        자동이체 결제그룹:
                      </span>
                      <span className="px-2 py-0.5 rounded bg-fuchsia-500/15 text-fuchsia-300 font-bold uppercase">
                        {mvno.paymentGroup} {mvno.billingDay ? `(${mvno.billingDay}일)` : ''}
                      </span>
                    </div>
                  )}

                  {mvno.memo && (
                    <p className="text-xs text-slate-400 pt-1 leading-relaxed">{mvno.memo}</p>
                  )}

                  {mvno.customFields && mvno.customFields.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {mvno.customFields.map((cf, i) => (
                        <span
                          key={i}
                          className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300"
                        >
                          {cf.key}: {cf.value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => onSaveMvno({ ...mvno, isActive: !mvno.isActive }, false)}
                  className="text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {mvno.isActive ? '번이/해지 완료 처리' : '다시 활성 회선으로 복구'}
                </button>
                <button
                  onClick={() => setEditingMvno(mvno)}
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 cursor-pointer"
                >
                  조건/혜택 수정 →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {editingMvno && (
        <MvnoEditModal
          mvno={editingMvno}
          paymentGroups={paymentGroups}
          onClose={() => setEditingMvno(null)}
          onSave={(updated, syncTransfer) => {
            onSaveMvno(updated, syncTransfer);
            setEditingMvno(null);
          }}
        />
      )}
    </div>
  );
};

interface MvnoEditModalProps {
  mvno: MvnoEventItem;
  paymentGroups: string[];
  onClose: () => void;
  onSave: (mvno: MvnoEventItem, syncTransfer: boolean) => void;
}

const MvnoEditModal: React.FC<MvnoEditModalProps> = ({
  mvno,
  paymentGroups,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState<MvnoEventItem>({
    ...mvno,
    customFields: mvno.customFields ? [...mvno.customFields] : [],
  });
  const [syncToTransfer, setSyncToTransfer] = useState(true);

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
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-cyan-400" />
            알뜰폰(MVNO) 회선 이벤트 설정
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
            onSave(
              {
                ...form,
                lineLabel: form.lineLabel.trim() || `${form.simType} 회선`,
                customFields: (form.customFields || []).filter((f) => f.key.trim()),
              },
              syncToTransfer
            );
          }}
          className="space-y-4 mt-4"
        >
          {/* Quick Provider Chips */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              알뜰폰 통신사 빠른 선택
            </label>
            <div className="flex flex-wrap gap-1.5">
              {MVNO_PROVIDERS.map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => {
                    const net: NetworkCarrier = p.startsWith('KT')
                      ? 'KT망'
                      : p.startsWith('LG')
                      ? 'LGU+망'
                      : p.startsWith('SK')
                      ? 'SKT망'
                      : form.network;
                    setForm((prev) => ({ ...prev, provider: p, network: net }));
                  }}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                    form.provider === p
                      ? 'bg-cyan-600 text-white border-cyan-500 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-300 mb-1">통신사명</label>
              <input
                type="text"
                required
                value={form.provider}
                onChange={(e) => setForm({ ...form, provider: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">통신망 (MNO)</label>
              <select
                value={form.network}
                onChange={(e) =>
                  setForm({ ...form, network: e.target.value as NetworkCarrier })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              >
                <option value="KT망">KT망</option>
                <option value="LGU+망">LGU+망</option>
                <option value="SKT망">SKT망</option>
                <option value="기타">기타</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">유심 종류</label>
              <div className="grid grid-cols-2 gap-2">
                {(['USIM', 'eSIM'] as SimType[]).map((st) => (
                  <button
                    type="button"
                    key={st}
                    onClick={() => setForm({ ...form, simType: st })}
                    className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                      form.simType === st
                        ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-300 mb-1">
                회선 별칭 / 사용 기기
              </label>
              <input
                type="text"
                placeholder="예: 아이폰 유심, 이심 회선, 서브폰"
                value={form.lineLabel}
                onChange={(e) => setForm({ ...form, lineLabel: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">
                전화번호 뒷 4자리 (선택)
              </label>
              <input
                type="text"
                maxLength={4}
                placeholder="예: 6306"
                value={form.phoneTail || ''}
                onChange={(e) => setForm({ ...form, phoneTail: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
              />
            </div>
          </div>

          {/* Pricing & Jump Date */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <Wand2 className="w-4 h-4" />
                요금 &amp; 프로모션 종료(인상) 일정
              </span>
              {form.joinDate && (
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        priceJumpDate:
                          addMonthsToDate(form.joinDate, 7, false).slice(0, 8) + '01',
                      })
                    }
                    className="text-[11px] px-2 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 cursor-pointer"
                  >
                    +7개월 초 요금인상일 자동입력
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        minKeepDate: addMonthsToDate(form.joinDate, 3, false),
                      })
                    }
                    className="text-[11px] px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 cursor-pointer"
                  >
                    개통+3개월 의무유지일 입력
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">현재 월 요금 (원)</label>
                <input
                  type="number"
                  required
                  value={form.currentFee}
                  onChange={(e) => setForm({ ...form, currentFee: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-amber-300 font-semibold mb-1">
                  할인종료 후 인상 요금 (원)
                </label>
                <input
                  type="number"
                  placeholder="예: 35000, 60000"
                  value={form.afterFee || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      afterFee: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-amber-500/30 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-amber-300 font-semibold mb-1">
                  요금 인상 예정일 (번이 타이밍)
                </label>
                <input
                  type="date"
                  value={form.priceJumpDate || ''}
                  onChange={(e) => setForm({ ...form, priceJumpDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-amber-500/30 rounded-lg text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">가입/개통일</label>
                <input
                  type="date"
                  required
                  value={form.joinDate}
                  onChange={(e) => setForm({ ...form, joinDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  의무유지 / 사은품 수령 기준일 (선택)
                </label>
                <input
                  type="date"
                  value={form.minKeepDate || ''}
                  onChange={(e) => setForm({ ...form, minKeepDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-300 mb-1">
                매월 제휴 혜택 / 사은품 (예: 밀리의서재, 쿠팡 5천원)
              </label>
              <input
                type="text"
                placeholder="예: 밀리의서재 무료, 매월 쿠팡 5천원"
                value={form.monthlyPerks || ''}
                onChange={(e) => setForm({ ...form, monthlyPerks: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">
                데이터/통화 스펙 (예: 무제한, 11GB+일2GB)
              </label>
              <input
                type="text"
                placeholder="예: 무제한, 7GB+1Mbps"
                value={form.dataSpec || ''}
                onChange={(e) => setForm({ ...form, dataSpec: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-300 mb-1">
                연결 결제수단/그룹 (예: mgs)
              </label>
              <input
                type="text"
                list="mvno-payment-groups"
                value={form.paymentGroup || ''}
                onChange={(e) => setForm({ ...form, paymentGroup: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
              <datalist id="mvno-payment-groups">
                {paymentGroups.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">
                매월 자동이체 출금일 (일)
              </label>
              <input
                type="number"
                min={1}
                max={31}
                placeholder="예: 11"
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

          <div>
            <label className="block text-xs text-slate-300 mb-1">상세 메모</label>
            <textarea
              rows={2}
              value={form.memo || ''}
              onChange={(e) => setForm({ ...form, memo: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
          </div>

          {/* Custom Fields */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300">확장 커스텀 정보</span>
              <button
                type="button"
                onClick={handleAddCustomField}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
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

          {/* Sync Checkbox */}
          <label className="flex items-center gap-2 p-3 rounded-xl bg-fuchsia-950/30 border border-fuchsia-500/30 text-xs text-fuchsia-200 cursor-pointer">
            <input
              type="checkbox"
              checked={syncToTransfer}
              onChange={(e) => setSyncToTransfer(e.target.checked)}
              className="rounded border-fuchsia-500"
            />
            <RefreshCw className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />
            <span>
              저장 시 <strong>자동이체·고정지출 탭</strong>의 연결 항목 요금 및 결제수단 정보도 함께 자동 동기화하기
            </span>
          </label>

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
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30"
            >
              저장하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
