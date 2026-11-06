import React, { useState } from 'react';
import {
  Check,
  Cloud,
  CloudDownload,
  CloudUpload,
  Copy,
  Download,
  Link2,
  RotateCcw,
  Smartphone,
  Upload,
  X,
} from 'lucide-react';
import { AppDatabase } from '../types';
import { calcCardDates, shortDate } from '../utils/dateUtils';
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
  refDate: string;
  pwaPrompt: any;
  onTriggerPwaInstall: () => void;
  onClose: () => void;
  onRestoreFullDb: (newDb: AppDatabase) => void;
  onResetToInitial: () => void;
}

// Same-origin direct APK path on GitHub Pages (avoids GitHub Release S3 redirect blocks in mobile browsers)
export const APK_DIRECT_URL = 'https://okjh7749.github.io/hi-credit/hi-credit.apk';
export const CLOUD_WEB_URL = 'https://okjh7749.github.io/hi-credit/';

export const SmartMemoModal: React.FC<SmartMemoModalProps> = ({
  db,
  refDate,
  pwaPrompt,
  onTriggerPwaInstall,
  onClose,
  onRestoreFullDb,
  onResetToInitial,
}) => {
  const [tab, setTab] = useState<'cloud' | 'kakao' | 'backup'>('cloud');
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
    db.cards.forEach((c) => {
      const calc = calcCardDates(c, refDate);
      if (calc.lockEndDate) {
        lines.push(
          `${c.issuer} ${c.name} ${shortDate(c.issueDate)} 발급 (혜택제공 M+${
            c.keepMonths
          } 해지금지 -> ${shortDate(calc.lockEndDate)})`
        );
      } else if (c.lastUsedDate) {
        lines.push(
          `${c.issuer} ${calc.status} ${shortDate(c.lastUsedDate)} 마지막사용 (무사용 ${
            c.noUseMonths
          }M -> ${shortDate(calc.noUseEndDate)})`
        );
      } else {
        lines.push(`${c.issuer}`);
      }
    });

    lines.push('\n자동이체정리');
    const grouped: Record<string, typeof db.transfers> = {};
    db.transfers.forEach((t) => {
      const g = t.category || '기타';
      if (!grouped[g]) grouped[g] = [];
      grouped[g].push(t);
    });
    Object.entries(grouped).forEach(([cat, list]) => {
      lines.push(cat);
      list.forEach((t, i) => {
        const dayStr = t.billingDay ? ` /${t.billingDay}일` : '';
        lines.push(`${i + 1}. ${t.title} ${t.amount}${dayStr}`);
      });
    });

    lines.push('');
    db.mvnos.forEach((m) => {
      lines.push(
        `${m.provider} ${shortDate(m.joinDate)} 가입 ${m.lineName}\n${
          m.currentFee
        }${
          m.jumpDate
            ? `\n${m.jumpDate.slice(2, 7).replace('-', '년 ')}월 ${
                m.jumpFee ? m.jumpFee / 10000 + '만' : ''
              }`
            : ''
        }${m.benefit ? ` + ${m.benefit}` : ''}\n`
      );
    });

    return lines.join('\n').trim();
  };

  const summaryText = generateKakaoSummary();

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
      setCloudStatus('클라우드에서 불러오는 중...');
      saveCloudConfig({ gistId, githubToken });
      const pulled = await pullFromCloudGist(gistId, githubToken);
      if (pulled) {
        onRestoreFullDb(pulled);
        setCloudStatus('✅ 클라우드 데이터 동기화 완료!');
      } else {
        setCloudStatus('⚠️ 클라우드에 v2 포맷 데이터가 아직 없습니다.');
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
      setCloudStatus('클라우드에 저장 중...');
      const newGistId = await pushToCloudGist(db, gistId, githubToken);
      setGistId(newGistId);
      saveCloudConfig({
        gistId: newGistId,
        githubToken,
        lastCloudSyncAt: new Date().toISOString(),
      });
      setCloudStatus('✅ 클라우드 저장 완료!');
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
        if (parsed && Array.isArray(parsed.cards)) {
          onRestoreFullDb(parsed);
          onClose();
        }
      } catch {
        alert('올바른 JSON 파일이 아닙니다.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-slate-900 border-t sm:border border-slate-700 rounded-t-2xl sm:rounded-2xl max-w-lg w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Cloud className="w-4 h-4 text-indigo-400" />
            갤럭시 앱 설치 &amp; 클라우드 동기화
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-1.5">
          <button
            onClick={() => setTab('cloud')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
              tab === 'cloud'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-950 text-slate-400 border border-slate-800'
            }`}
          >
            앱 설치 / 클라우드
          </button>
          <button
            onClick={() => setTab('kakao')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
              tab === 'kakao'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-950 text-slate-400 border border-slate-800'
            }`}
          >
            카톡 텍스트 복사
          </button>
          <button
            onClick={() => setTab('backup')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
              tab === 'backup'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-950 text-slate-400 border border-slate-800'
            }`}
          >
            백업 / 초기화
          </button>
        </div>

        {tab === 'cloud' && (
          <div className="space-y-3">
            {/* Galaxy App Install Box */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-indigo-500/40 space-y-2.5">
              <div className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4" />
                갤럭시 스마트폰 앱 설치 (2가지 방법)
              </div>

              {pwaPrompt && (
                <button
                  onClick={onTriggerPwaInstall}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  방법 1 (추천): 보안차단 없이 갤럭시 홈 화면에 앱 즉시 설치
                </button>
              )}

              <a
                href={APK_DIRECT_URL}
                download="hi-credit.apk"
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                정식 서명 APK 직접 다운로드 (hi-credit.apk)
              </a>

              <div className="text-[11px] text-slate-400 leading-relaxed bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                💡 <strong>갤럭시에서 다운로드가 안 될 때:</strong> 카카오톡 내부 브라우저에서는 APK 다운로드가 차단될 수 있습니다. 우측 하단 <strong>[⋮] → [다른 브라우저로 열기(삼성인터넷/크롬)]</strong>를 누른 뒤 다운로드하거나 <strong>[홈 화면에 추가]</strong>를 누르면 바로 앱으로 설치됩니다!
              </div>
            </div>

            {/* Cloud Sync */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="text-xs font-bold text-white">
                클라우드 데이터 동기화
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  disabled={cloudLoading}
                  onClick={handleCloudPull}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-cyan-600/20 border border-cyan-500/40 text-cyan-200 text-xs font-bold cursor-pointer"
                >
                  <CloudDownload className="w-4 h-4" />
                  클라우드 불러오기
                </button>
                <button
                  disabled={cloudLoading}
                  onClick={handleCloudPush}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-fuchsia-600/20 border border-fuchsia-500/40 text-fuchsia-200 text-xs font-bold cursor-pointer"
                >
                  <CloudUpload className="w-4 h-4" />
                  클라우드 저장하기
                </button>
              </div>

              <button
                onClick={handleCopySyncLink}
                className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {syncLinkCopied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Link2 className="w-3.5 h-3.5 text-cyan-400" />
                )}
                {syncLinkCopied
                  ? '데이터 포함 링크 복사됨!'
                  : '현재 데이터 포함 클라우드 링크 복사 (카톡 전송용)'}
              </button>

              {cloudStatus && (
                <div className="text-xs text-amber-300 font-medium">
                  {cloudStatus}
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 space-y-2">
                <input
                  type="text"
                  placeholder="Gist ID"
                  value={gistId}
                  onChange={(e) => setGistId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-[11px] text-slate-300 font-mono"
                />
                <input
                  type="password"
                  placeholder="갤럭시에서 직접 클라우드 업로드 시 GitHub Token 1회 입력"
                  value={githubToken}
                  onChange={(e) => {
                    setGithubToken(e.target.value);
                    saveCloudConfig({ gistId, githubToken: e.target.value });
                  }}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-[11px] text-slate-300 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {tab === 'kakao' && (
          <div className="space-y-3">
            <textarea
              readOnly
              rows={11}
              value={summaryText}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono"
            />
            <button
              onClick={() => handleCopy(summaryText)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? '복사 완료!' : '카카오톡 메모 형식으로 전체 복사'}
            </button>
          </div>
        )}

        {tab === 'backup' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownloadJson}
                className="flex items-center justify-center gap-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 cursor-pointer"
              >
                <Download className="w-4 h-4 text-indigo-400" />
                JSON 백업 저장
              </button>
              <label className="flex items-center justify-center gap-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 cursor-pointer">
                <Upload className="w-4 h-4 text-emerald-400" />
                JSON 복원
                <input
                  type="file"
                  accept=".json"
                  onChange={handleUploadJson}
                  className="hidden"
                />
              </label>
            </div>

            <button
              onClick={() => {
                if (window.confirm('초기 메모 데이터로 리셋할까요?')) {
                  onResetToInitial();
                  onClose();
                }
              }}
              className="w-full py-2.5 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              초기 데이터로 리셋
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
