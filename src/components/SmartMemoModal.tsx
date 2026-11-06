import React, { useState } from 'react';
import {
  Check,
  Cloud,
  CloudDownload,
  CloudUpload,
  Copy,
  Download,
  FileText,
  Link2,
  RotateCcw,
  Smartphone,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { RAW_KAKAO_MEMO } from '../initialData';
import { AppDatabase } from '../types';
import { parseFreeformMemo } from '../utils/memoParser';
import {
  DEFAULT_CLOUD_GIST_ID,
  encodeDbToHash,
  loadCloudConfig,
  pullFromCloudGist,
  pushToCloudGist,
  saveCloudConfig,
} from '../utils/storage';

interface SmartMemoModalProps {
  db: AppDatabase;
  onClose: () => void;
  onImportParsed: (parsed: ReturnType<typeof parseFreeformMemo>) => void;
  onRestoreFullDb: (newDb: AppDatabase) => void;
  onResetToInitial: () => void;
}

export const APK_DOWNLOAD_URL =
  'https://github.com/okjh7749/hi-credit/releases/latest/download/hi-credit-galaxy.apk';
export const CLOUD_WEB_URL = 'https://okjh7749.github.io/hi-credit/';

export const SmartMemoModal: React.FC<SmartMemoModalProps> = ({
  db,
  onClose,
  onImportParsed,
  onRestoreFullDb,
  onResetToInitial,
}) => {
  const [activeMode, setActiveMode] = useState<
    'cloud' | 'export-text' | 'import-memo' | 'backup'
  >('cloud');
  const [memoInput, setMemoInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [syncLinkCopied, setSyncLinkCopied] = useState(false);

  const initialCloud = loadCloudConfig();
  const [gistId, setGistId] = useState(
    initialCloud.gistId || DEFAULT_CLOUD_GIST_ID
  );
  const [githubToken, setGithubToken] = useState(
    initialCloud.githubToken || ''
  );
  const [cloudStatus, setCloudStatus] = useState<string>('');
  const [cloudLoading, setCloudLoading] = useState(false);

  const generateKakaoSummary = (): string => {
    const lines: string[] = [];
    lines.push('[카드 신규이벤트 / 해지금지 정리]');
    db.cards.forEach((c) => {
      if (c.status === 'target') {
        lines.push(`- [타겟대기] ${c.issuer} (${c.cardName})`);
      } else if (c.status === 'locked') {
        const lockStr = c.lockEndDateSecondary
          ? `해지금지 -> ${c.lockEndDatePrimary} or ${c.lockEndDateSecondary}`
          : `해지금지 -> ${c.lockEndDatePrimary || '미정'}`;
        lines.push(`- ${c.cardName} (${c.issueDate || '-'} 발급 / ${lockStr})`);
      } else {
        lines.push(
          `- ${c.cardName} [${
            c.status === 'cancellable' ? '해지가능' : '쿨타임'
          }] 마지막사용: ${c.lastUsedDate || '-'} ${
            c.clawbackRule ? `(${c.clawbackRule})` : ''
          }`
        );
      }
    });

    lines.push('\n[자동이체 / AI 구독 정리]');
    const grouped: Record<string, typeof db.transfers> = {};
    db.transfers
      .filter((t) => t.isActive)
      .forEach((t) => {
        const g = t.paymentMethod || '기타';
        if (!grouped[g]) grouped[g] = [];
        grouped[g].push(t);
      });

    Object.entries(grouped).forEach(([group, list]) => {
      lines.push(`${group}`);
      list.forEach((t, idx) => {
        const amtStr =
          t.currency === 'USD'
            ? `$${t.amount}`
            : `${t.amount.toLocaleString()}원`;
        const dayStr = t.billingDay ? ` / ${t.billingDay}일` : '';
        lines.push(`${idx + 1}. ${t.title} ${amtStr}${dayStr}`);
      });
    });

    lines.push('\n[알뜰폰 회선 정리]');
    db.mvnos
      .filter((m) => m.isActive)
      .forEach((m) => {
        lines.push(
          `- ${m.provider} (${m.lineLabel} / ${m.simType}${
            m.phoneTail ? ` / ${m.phoneTail}` : ''
          }) ${m.joinDate} 가입 | 월 ${m.currentFee.toLocaleString()}원${
            m.priceJumpDate
              ? ` -> ${m.priceJumpDate.slice(0, 7)}부터 ${(
                  m.afterFee || 0
                ).toLocaleString()}원`
              : ''
          }${m.monthlyPerks ? ` + ${m.monthlyPerks}` : ''}`
        );
      });

    return lines.join('\n');
  };

  const summaryText = generateKakaoSummary();
  const previewParsed = memoInput.trim() ? parseFreeformMemo(memoInput) : null;

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopySyncLink = async () => {
    const hash = encodeDbToHash(db);
    const url = `${CLOUD_WEB_URL}#sync=${hash}`;
    await navigator.clipboard.writeText(url);
    setSyncLinkCopied(true);
    setTimeout(() => setSyncLinkCopied(false), 2500);
  };

  const handleCloudPull = async () => {
    try {
      setCloudLoading(true);
      setCloudStatus('클라우드에서 데이터를 불러오는 중...');
      saveCloudConfig({ gistId, githubToken });
      const pulled = await pullFromCloudGist(gistId, githubToken);
      if (pulled) {
        onRestoreFullDb(pulled);
        setCloudStatus('✅ 클라우드 데이터 동기화(불러오기) 완료!');
      }
    } catch (e: any) {
      setCloudStatus(`❌ ${e?.message || '불러오기 실패'}`);
    } finally {
      setCloudLoading(false);
    }
  };

  const handleCloudPush = async () => {
    try {
      setCloudLoading(true);
      setCloudStatus('클라우드에 업로드 중...');
      const newGistId = await pushToCloudGist(db, gistId, githubToken);
      setGistId(newGistId);
      saveCloudConfig({
        gistId: newGistId,
        githubToken,
        lastCloudSyncAt: new Date().toISOString(),
      });
      setCloudStatus('✅ 클라우드에 최신 데이터 저장 완료!');
    } catch (e: any) {
      setCloudStatus(`❌ ${e?.message || '업로드 실패'}`);
    } finally {
      setCloudLoading(false);
    }
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(db, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hi-credit-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUploadJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as AppDatabase;
        if (
          parsed &&
          Array.isArray(parsed.cards) &&
          Array.isArray(parsed.mvnos)
        ) {
          onRestoreFullDb(parsed);
          onClose();
        } else {
          alert('올바른 백업 JSON 파일 형식이 아닙니다.');
        }
      } catch {
        alert('JSON 파일을 읽는 중 오류가 발생했습니다.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border-t sm:border border-slate-700 rounded-t-3xl sm:rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Cloud className="w-5 h-5 text-indigo-400" />
            갤럭시 앱 · 클라우드 동기화 · 카톡 메모
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex flex-wrap gap-1.5 mt-4 mb-4">
          <button
            onClick={() => setActiveMode('cloud')}
            className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer ${
              activeMode === 'cloud'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-950 text-slate-400 border border-slate-800'
            }`}
          >
            ☁️ 클라우드 &amp; 갤럭시 APK
          </button>
          <button
            onClick={() => setActiveMode('export-text')}
            className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer ${
              activeMode === 'export-text'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-950 text-slate-400 border border-slate-800'
            }`}
          >
            📋 카톡 텍스트 내보내기
          </button>
          <button
            onClick={() => setActiveMode('import-memo')}
            className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer ${
              activeMode === 'import-memo'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-950 text-slate-400 border border-slate-800'
            }`}
          >
            ✨ 메모 자동인식
          </button>
          <button
            onClick={() => setActiveMode('backup')}
            className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer ${
              activeMode === 'backup'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-950 text-slate-400 border border-slate-800'
            }`}
          >
            💾 파일 백업/초기화
          </button>
        </div>

        {activeMode === 'cloud' && (
          <div className="space-y-4">
            {/* Galaxy APK & Cloud Web Links */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-950 border border-indigo-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-indigo-300 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-indigo-400" />
                  갤럭시 스마트폰 설치 &amp; 클라우드 접속
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                  Android APK + PWA 지원
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <a
                  href={APK_DOWNLOAD_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
                >
                  <Download className="w-4 h-4" />
                  갤럭시 APK 다운로드 (.apk)
                </a>

                <button
                  onClick={handleCopySyncLink}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  {syncLinkCopied ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Link2 className="w-4 h-4 text-cyan-400" />
                  )}
                  {syncLinkCopied
                    ? '동기화 링크 복사 완료!'
                    : '현재 데이터 포함 클라우드 링크 복사'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                • 클라우드 웹 주소:{' '}
                <a
                  href={CLOUD_WEB_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-300 underline font-mono"
                >
                  {CLOUD_WEB_URL}
                </a>
                <br />• 갤럭시에서 위 APK를 설치하거나, 삼성인터넷/크롬에서 클라우드 웹 주소 접속 후 <strong>[홈 화면에 추가]</strong>를 누르면 네이티브 앱처럼 작동합니다.
              </p>
            </div>

            {/* Cloud Gist Sync Box */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Cloud className="w-4 h-4 text-cyan-400" />
                  클라우드 DB 실시간 동기화 (GitHub Gist Cloud)
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  disabled={cloudLoading}
                  onClick={handleCloudPull}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-200 text-xs font-bold cursor-pointer"
                >
                  <CloudDownload className="w-4 h-4 text-cyan-400" />
                  클라우드에서 최신 데이터 불러오기
                </button>

                <button
                  disabled={cloudLoading}
                  onClick={handleCloudPush}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-fuchsia-600/20 hover:bg-fuchsia-600/30 border border-fuchsia-500/40 text-fuchsia-200 text-xs font-bold cursor-pointer"
                >
                  <CloudUpload className="w-4 h-4 text-fuchsia-400" />
                  클라우드로 현재 데이터 업로드
                </button>
              </div>

              {cloudStatus && (
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-amber-300 font-medium">
                  {cloudStatus}
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    클라우드 Gist ID (불러오기는 토큰 없이 즉시 가능)
                  </label>
                  <input
                    type="text"
                    value={gistId}
                    onChange={(e) => setGistId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    클라우드 업로드용 GitHub Token (선택 - 갤럭시에서 직접 업로드 시 1회 입력, 기기에만 안전 저장)
                  </label>
                  <input
                    type="password"
                    placeholder="ghp_... 또는 gho_... (입력 시 자동 클라우드 저장 활성화)"
                    value={githubToken}
                    onChange={(e) => {
                      setGithubToken(e.target.value);
                      saveCloudConfig({ gistId, githubToken: e.target.value });
                    }}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeMode === 'export-text' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">
              현재 등록된 카드·알뜰폰·자동이체 내역을 카카오톡 나와의 채팅에 붙여넣기 좋은 텍스트로 자동 생성합니다.
            </p>
            <textarea
              readOnly
              rows={11}
              value={summaryText}
              className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono leading-relaxed"
            />
            <div className="flex justify-end">
              <button
                onClick={() => handleCopy(summaryText)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied ? '클립보드에 복사됨!' : '요약 텍스트 전체 복사'}
              </button>
            </div>
          </div>
        )}

        {activeMode === 'import-memo' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">
                카카오톡 메모 형식의 텍스트를 붙여넣으면 카드/알뜰폰/자동이체 항목을 자동 추출합니다.
              </p>
              <button
                type="button"
                onClick={() => setMemoInput(RAW_KAKAO_MEMO)}
                className="text-xs text-indigo-400 hover:underline cursor-pointer"
              >
                예시(원본 메모) 불러오기
              </button>
            </div>
            <textarea
              rows={7}
              value={memoInput}
              onChange={(e) => setMemoInput(e.target.value)}
              placeholder={`예시:\n하나 제이드 25.8.7 발급 (혜택제공 12개월 해지금지 -> 26.12.31)\n자동이체정리\nmgs\n2. 네이버 멤버쉽 4500 /25일`}
              className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
            />

            {previewParsed && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-2 text-xs">
                <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  인식된 항목 미리보기: 카드 {previewParsed.cards.length}건 · 알뜰폰{' '}
                  {previewParsed.mvnos.length}건 · 자동이체{' '}
                  {previewParsed.transfers.length}건
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      onImportParsed(previewParsed);
                      onClose();
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                  >
                    인식된 항목 추가하기
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeMode === 'backup' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleDownloadJson}
                className="flex items-center justify-center gap-2 p-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 cursor-pointer"
              >
                <Download className="w-4 h-4 text-indigo-400" />
                JSON 파일로 전체 백업 다운로드
              </button>

              <label className="flex items-center justify-center gap-2 p-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 cursor-pointer">
                <Upload className="w-4 h-4 text-emerald-400" />
                JSON 백업 파일 불러오기(복원)
                <input
                  type="file"
                  accept=".json"
                  onChange={handleUploadJson}
                  className="hidden"
                />
              </label>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300">
                  최초 첨부된 카카오톡 원본 메모
                </span>
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        '모든 데이터를 최초 카카오톡 메모 기준 초기 상태로 되돌리시겠습니까?'
                      )
                    ) {
                      onResetToInitial();
                      onClose();
                    }
                  }}
                  className="flex items-center gap-1 text-xs text-rose-400 hover:underline cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  초기 데이터로 리셋
                </button>
              </div>
              <pre className="text-[11px] text-slate-400 font-mono whitespace-pre-wrap bg-slate-900 p-3 rounded-lg border border-slate-800 max-h-40 overflow-y-auto">
                {RAW_KAKAO_MEMO}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
