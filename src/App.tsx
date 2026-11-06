import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Cloud,
  CreditCard,
  Download,
  LayoutDashboard,
  Smartphone,
  Wallet,
} from 'lucide-react';
import { AutoTransferTab } from './components/AutoTransferTab';
import { CardManagerTab } from './components/CardManagerTab';
import { DashboardTab } from './components/DashboardTab';
import { MvnoManagerTab } from './components/MvnoManagerTab';
import { APK_DOWNLOAD_URL, SmartMemoModal } from './components/SmartMemoModal';
import { INITIAL_DB } from './initialData';
import {
  AppDatabase,
  AutoTransferItem,
  CardEventItem,
  MvnoEventItem,
} from './types';
import { getTodayISO } from './utils/dateUtils';
import {
  DEFAULT_CLOUD_GIST_ID,
  fetchDiskDb,
  loadCloudConfig,
  loadLocalDb,
  pullFromCloudGist,
  saveDbEverywhere,
} from './utils/storage';

type TabKey = 'dashboard' | 'cards' | 'mvnos' | 'transfers';

export function App() {
  const [db, setDb] = useState<AppDatabase>(() => loadLocalDb());
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [isMemoModalOpen, setIsMemoModalOpen] = useState(false);
  const [syncText, setSyncText] = useState<string>('클라우드 연동됨');

  useEffect(() => {
    fetchDiskDb().then((diskData) => {
      if (diskData) {
        setDb(diskData);
        setSyncText('PC·클라우드 연동됨');
      } else {
        // Running on Galaxy APK or Cloud GitHub Pages: check if Cloud Gist has newer data
        const cfg = loadCloudConfig();
        const gistId = cfg.gistId || DEFAULT_CLOUD_GIST_ID;
        if (gistId) {
          pullFromCloudGist(gistId, cfg.githubToken)
            .then((cloudDb) => {
              if (cloudDb) {
                const localTime = new Date(db.updatedAt || 0).getTime();
                const cloudTime = new Date(cloudDb.updatedAt || 0).getTime();
                if (cloudTime >= localTime) {
                  setDb(cloudDb);
                  setSyncText('클라우드 최신 동기화됨');
                }
              }
            })
            .catch(() => {});
        }
      }
    });
  }, []);

  const persistUpdate = (updater: (prev: AppDatabase) => AppDatabase) => {
    setDb((prev) => {
      const next = updater(prev);
      saveDbEverywhere(next).then(() => {
        setSyncText(
          new Date().toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
          }) + ' 저장됨'
        );
      });
      return next;
    });
  };

  const refDate =
    db.settings.referenceDateMode === 'custom' &&
    db.settings.customReferenceDate
      ? db.settings.customReferenceDate
      : getTodayISO();

  const handleSaveCard = (card: CardEventItem) => {
    persistUpdate((prev) => {
      const exists = prev.cards.some((c) => c.id === card.id);
      const nextCards = exists
        ? prev.cards.map((c) => (c.id === card.id ? card : c))
        : [card, ...prev.cards];
      return { ...prev, cards: nextCards };
    });
  };

  const handleDeleteCard = (id: string) => {
    persistUpdate((prev) => ({
      ...prev,
      cards: prev.cards.filter((c) => c.id !== id),
    }));
  };

  const handleSaveMvno = (mvno: MvnoEventItem, syncTransfer = true) => {
    persistUpdate((prev) => {
      const exists = prev.mvnos.some((m) => m.id === mvno.id);
      const nextMvnos = exists
        ? prev.mvnos.map((m) => (m.id === mvno.id ? mvno : m))
        : [mvno, ...prev.mvnos];

      let nextTransfers = [...prev.transfers];
      if (syncTransfer) {
        const linkedIdx = nextTransfers.findIndex(
          (t) => t.linkedMvnoId === mvno.id
        );
        if (linkedIdx >= 0) {
          nextTransfers[linkedIdx] = {
            ...nextTransfers[linkedIdx],
            title: `${mvno.provider} (${mvno.lineLabel})`,
            amount: mvno.currentFee,
            billingDay: mvno.billingDay,
            paymentMethod:
              mvno.paymentGroup || nextTransfers[linkedIdx].paymentMethod,
            isActive: mvno.isActive,
          };
        } else if (mvno.isActive) {
          nextTransfers.push({
            id: `sub-mvno-${mvno.id}`,
            title: `${mvno.provider} (${mvno.lineLabel})`,
            category: '통신/알뜰폰',
            amount: mvno.currentFee,
            currency: 'KRW',
            billingCycle: 'monthly',
            billingDay: mvno.billingDay,
            paymentMethod: mvno.paymentGroup || 'mgs',
            linkedMvnoId: mvno.id,
            accountInfo: `${mvno.simType}${
              mvno.phoneTail ? ` #${mvno.phoneTail}` : ''
            }`,
            isActive: true,
            memo: mvno.priceJumpDate
              ? `${mvno.priceJumpDate.slice(0, 7)} 인상 주의`
              : '',
            customFields: [],
          });
        }
      }

      return { ...prev, mvnos: nextMvnos, transfers: nextTransfers };
    });
  };

  const handleDeleteMvno = (id: string) => {
    persistUpdate((prev) => ({
      ...prev,
      mvnos: prev.mvnos.filter((m) => m.id !== id),
    }));
  };

  const handleSaveTransfer = (item: AutoTransferItem) => {
    persistUpdate((prev) => {
      const exists = prev.transfers.some((t) => t.id === item.id);
      const nextTransfers = exists
        ? prev.transfers.map((t) => (t.id === item.id ? item : t))
        : [item, ...prev.transfers];

      const groups = prev.settings.paymentGroups.includes(item.paymentMethod)
        ? prev.settings.paymentGroups
        : [...prev.settings.paymentGroups, item.paymentMethod];

      return {
        ...prev,
        transfers: nextTransfers,
        settings: { ...prev.settings, paymentGroups: groups },
      };
    });
  };

  const handleDeleteTransfer = (id: string) => {
    persistUpdate((prev) => ({
      ...prev,
      transfers: prev.transfers.filter((t) => t.id !== id),
    }));
  };

  const handleBatchMovePaymentMethod = (
    ids: string[],
    targetPaymentMethod: string
  ) => {
    persistUpdate((prev) => ({
      ...prev,
      transfers: prev.transfers.map((t) =>
        ids.includes(t.id) ? { ...t, paymentMethod: targetPaymentMethod } : t
      ),
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-20 sm:pb-6">
      {/* Top App Bar (Galaxy One UI style compact header on mobile) */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/90 pt-[env(safe-area-inset-top)]">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 py-3 flex items-center justify-between gap-2">
          {/* Brand Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-lg font-extrabold tracking-tight text-white">
                  Hi-Credit
                </h1>
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  <Cloud className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  {syncText}
                </span>
              </div>
              <p className="hidden sm:block text-xs text-slate-400">
                갤럭시 카드 풍차돌리기 · 알뜰폰 번이 · 자동이체(mgs) &amp; AI 구독 클라우드 매니저
              </p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-[11px] sm:text-xs">
              <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="hidden md:inline text-slate-400">기준일:</span>
              <input
                type="date"
                value={refDate}
                onChange={(e) => {
                  const val = e.target.value;
                  persistUpdate((prev) => ({
                    ...prev,
                    settings: {
                      ...prev.settings,
                      referenceDateMode: 'custom',
                      customReferenceDate: val,
                    },
                  }));
                }}
                className="bg-transparent text-white font-mono font-bold focus:outline-none w-[105px] sm:w-auto"
              />
            </div>

            <a
              href={APK_DOWNLOAD_URL}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition-all"
              title="갤럭시 안드로이드 APK 다운로드"
            >
              <Download className="w-3.5 h-3.5" />
              갤럭시 APK
            </a>

            <button
              onClick={() => setIsMemoModalOpen(true)}
              className="flex items-center gap-1 px-2.5 sm:px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
            >
              <Cloud className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">클라우드 / 메모</span>
            </button>
          </div>
        </div>

        {/* Desktop Navigation Tabs (Hidden on mobile where Bottom Nav is used) */}
        <div className="hidden sm:flex max-w-7xl mx-auto px-6 items-center gap-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'border-indigo-500 text-white bg-indigo-500/10 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-indigo-400" />
            통합 대시보드
          </button>

          <button
            onClick={() => setActiveTab('cards')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'cards'
                ? 'border-indigo-500 text-white bg-indigo-500/10 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-4 h-4 text-indigo-400" />
            카드 이벤트 ({db.cards.length})
          </button>

          <button
            onClick={() => setActiveTab('mvnos')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'mvnos'
                ? 'border-cyan-500 text-white bg-cyan-500/10 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4 text-cyan-400" />
            알뜰폰 회선 ({db.mvnos.filter((m) => m.isActive).length})
          </button>

          <button
            onClick={() => setActiveTab('transfers')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'transfers'
                ? 'border-fuchsia-500 text-white bg-fuchsia-500/10 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wallet className="w-4 h-4 text-fuchsia-400" />
            자동이체 · AI 구독 ({db.transfers.filter((t) => t.isActive).length})
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 py-4 sm:py-6">
        {activeTab === 'dashboard' && (
          <DashboardTab
            db={db}
            refDate={refDate}
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenMemoModal={() => setIsMemoModalOpen(true)}
          />
        )}

        {activeTab === 'cards' && (
          <CardManagerTab
            cards={db.cards}
            refDate={refDate}
            onSaveCard={handleSaveCard}
            onDeleteCard={handleDeleteCard}
          />
        )}

        {activeTab === 'mvnos' && (
          <MvnoManagerTab
            mvnos={db.mvnos}
            paymentGroups={db.settings.paymentGroups}
            refDate={refDate}
            onSaveMvno={handleSaveMvno}
            onDeleteMvno={handleDeleteMvno}
          />
        )}

        {activeTab === 'transfers' && (
          <AutoTransferTab
            transfers={db.transfers}
            paymentGroups={db.settings.paymentGroups}
            usdRate={db.settings.usdToKrwRate}
            onUpdateUsdRate={(rate) =>
              persistUpdate((prev) => ({
                ...prev,
                settings: { ...prev.settings, usdToKrwRate: rate },
              }))
            }
            onAddPaymentGroup={(group) =>
              persistUpdate((prev) => ({
                ...prev,
                settings: {
                  ...prev.settings,
                  paymentGroups: prev.settings.paymentGroups.includes(group)
                    ? prev.settings.paymentGroups
                    : [...prev.settings.paymentGroups, group],
                },
              }))
            }
            onSaveTransfer={handleSaveTransfer}
            onDeleteTransfer={handleDeleteTransfer}
            onBatchMovePaymentMethod={handleBatchMovePaymentMethod}
          />
        )}
      </main>

      {/* Galaxy One UI Mobile Bottom Navigation Bar */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5 h-16">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center gap-1 ${
              activeTab === 'dashboard' ? 'text-indigo-400' : 'text-slate-400'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-bold">홈/레이더</span>
          </button>

          <button
            onClick={() => setActiveTab('cards')}
            className={`flex flex-col items-center justify-center gap-1 ${
              activeTab === 'cards' ? 'text-indigo-400' : 'text-slate-400'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            <span className="text-[10px] font-bold">카드({db.cards.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('mvnos')}
            className={`flex flex-col items-center justify-center gap-1 ${
              activeTab === 'mvnos' ? 'text-cyan-400' : 'text-slate-400'
            }`}
          >
            <Smartphone className="w-5 h-5" />
            <span className="text-[10px] font-bold">
              알뜰폰({db.mvnos.filter((m) => m.isActive).length})
            </span>
          </button>

          <button
            onClick={() => setActiveTab('transfers')}
            className={`flex flex-col items-center justify-center gap-1 ${
              activeTab === 'transfers' ? 'text-fuchsia-400' : 'text-slate-400'
            }`}
          >
            <Wallet className="w-5 h-5" />
            <span className="text-[10px] font-bold">
              자동이체({db.transfers.filter((t) => t.isActive).length})
            </span>
          </button>

          <button
            onClick={() => setIsMemoModalOpen(true)}
            className="flex flex-col items-center justify-center gap-1 text-emerald-400"
          >
            <Cloud className="w-5 h-5" />
            <span className="text-[10px] font-bold">클라우드</span>
          </button>
        </div>
      </nav>

      {/* Smart Memo & Cloud Sync Modal */}
      {isMemoModalOpen && (
        <SmartMemoModal
          db={db}
          onClose={() => setIsMemoModalOpen(false)}
          onImportParsed={(parsed) => {
            persistUpdate((prev) => ({
              ...prev,
              cards: [...parsed.cards, ...prev.cards],
              mvnos: [...parsed.mvnos, ...prev.mvnos],
              transfers: [...parsed.transfers, ...prev.transfers],
            }));
          }}
          onRestoreFullDb={(newDb) => {
            persistUpdate(() => newDb);
          }}
          onResetToInitial={() => {
            persistUpdate(() => INITIAL_DB);
          }}
        />
      )}
    </div>
  );
}

export default App;
