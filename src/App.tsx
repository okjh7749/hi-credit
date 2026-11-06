import React, { useEffect, useState } from 'react';
import {
  Cloud,
  CreditCard,
  Download,
  LayoutGrid,
  Smartphone,
  Wallet,
} from 'lucide-react';
import { AutoTransferTab } from './components/AutoTransferTab';
import { CardManagerTab } from './components/CardManagerTab';
import { DashboardTab } from './components/DashboardTab';
import { MvnoManagerTab } from './components/MvnoManagerTab';
import { APK_DIRECT_URL, SmartMemoModal } from './components/SmartMemoModal';
import { INITIAL_DB } from './initialData';
import {
  AppDatabase,
  AutoTransferItem,
  CardItem,
  IssuerRule,
  MvnoItem,
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
  const [refDate, setRefDate] = useState<string>(() => getTodayISO());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pwaPrompt, setPwaPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setPwaPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    fetchDiskDb().then((diskData) => {
      if (diskData) {
        setDb(diskData);
      } else {
        const cfg = loadCloudConfig();
        const gistId = cfg.gistId || DEFAULT_CLOUD_GIST_ID;
        if (gistId) {
          pullFromCloudGist(gistId, cfg.githubToken)
            .then((cloudDb) => {
              if (cloudDb) setDb(cloudDb);
            })
            .catch(() => {});
        }
      }
    });
  }, []);

  const persistUpdate = (updater: (prev: AppDatabase) => AppDatabase) => {
    setDb((prev) => {
      const next = updater(prev);
      saveDbEverywhere(next);
      return next;
    });
  };

  const handleSaveCard = (card: CardItem) => {
    persistUpdate((prev) => {
      const exists = prev.cards.some((c) => c.id === card.id);
      return {
        ...prev,
        cards: exists
          ? prev.cards.map((c) => (c.id === card.id ? card : c))
          : [...prev.cards, card],
      };
    });
  };

  const handleDeleteCard = (id: string) => {
    persistUpdate((prev) => ({
      ...prev,
      cards: prev.cards.filter((c) => c.id !== id),
    }));
  };

  const handleSaveIssuerRules = (issuerRules: IssuerRule[]) => {
    persistUpdate((prev) => ({
      ...prev,
      issuerRules,
    }));
  };

  const handleSaveMvno = (item: MvnoItem) => {
    persistUpdate((prev) => {
      const exists = prev.mvnos.some((m) => m.id === item.id);
      return {
        ...prev,
        mvnos: exists
          ? prev.mvnos.map((m) => (m.id === item.id ? item : m))
          : [...prev.mvnos, item],
      };
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
      return {
        ...prev,
        transfers: exists
          ? prev.transfers.map((t) => (t.id === item.id ? item : t))
          : [...prev.transfers, item],
      };
    });
  };

  const handleDeleteTransfer = (id: string) => {
    persistUpdate((prev) => ({
      ...prev,
      transfers: prev.transfers.filter((t) => t.id !== id),
    }));
  };

  const handleSaveCategories = (transferCategories: string[]) => {
    persistUpdate((prev) => ({
      ...prev,
      transferCategories,
    }));
  };

  const handleTriggerPwaInstall = async () => {
    if (!pwaPrompt) return;
    pwaPrompt.prompt();
    await pwaPrompt.userChoice;
    setPwaPrompt(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-20 sm:pb-6">
      {/* Compact Header */}
      <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur border-b border-slate-800 pt-[env(safe-area-inset-top)]">
        <div className="max-w-5xl mx-auto px-3.5 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-sm sm:text-base font-extrabold text-white">
              Hi-Credit
            </h1>
          </div>

          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={refDate}
              onChange={(e) => setRefDate(e.target.value)}
              className="px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-slate-200 font-mono"
              title="기준일 변경"
            />

            <a
              href={APK_DIRECT_URL}
              download="hi-credit.apk"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold"
            >
              <Download className="w-3 h-3" />
              APK 설치
            </a>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-[11px] font-bold cursor-pointer"
            >
              <Cloud className="w-3.5 h-3.5 text-cyan-400" />
              동기화
            </button>
          </div>
        </div>

        {/* Desktop Top Tabs */}
        <div className="hidden sm:flex max-w-5xl mx-auto px-3.5 gap-1">
          {(
            [
              ['dashboard', '전체 한눈에'],
              ['cards', `카드 (${db.cards.length})`],
              ['mvnos', `알뜰폰 (${db.mvnos.length})`],
              ['transfers', `자동이체 (${db.transfers.length})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 text-xs font-bold border-b-2 cursor-pointer ${
                activeTab === key
                  ? 'border-indigo-500 text-white bg-indigo-500/10 rounded-t-lg'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3.5 py-3.5">
        {activeTab === 'dashboard' && (
          <DashboardTab
            db={db}
            refDate={refDate}
            onNavigate={(t) => setActiveTab(t)}
          />
        )}

        {activeTab === 'cards' && (
          <CardManagerTab
            cards={db.cards}
            issuerRules={db.issuerRules}
            refDate={refDate}
            onSaveCard={handleSaveCard}
            onDeleteCard={handleDeleteCard}
            onSaveIssuerRules={handleSaveIssuerRules}
          />
        )}

        {activeTab === 'mvnos' && (
          <MvnoManagerTab
            mvnos={db.mvnos}
            refDate={refDate}
            onSaveMvno={handleSaveMvno}
            onDeleteMvno={handleDeleteMvno}
          />
        )}

        {activeTab === 'transfers' && (
          <AutoTransferTab
            transfers={db.transfers}
            categories={db.transferCategories}
            usdRate={db.usdRate}
            onSaveTransfer={handleSaveTransfer}
            onDeleteTransfer={handleDeleteTransfer}
            onSaveCategories={handleSaveCategories}
          />
        )}
      </main>

      {/* Galaxy Mobile Bottom Tab Bar */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 backdrop-blur border-t border-slate-800 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5 h-14">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center gap-0.5 ${
              activeTab === 'dashboard' ? 'text-indigo-400' : 'text-slate-400'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="text-[10px] font-bold">한눈에</span>
          </button>

          <button
            onClick={() => setActiveTab('cards')}
            className={`flex flex-col items-center justify-center gap-0.5 ${
              activeTab === 'cards' ? 'text-indigo-400' : 'text-slate-400'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span className="text-[10px] font-bold">카드</span>
          </button>

          <button
            onClick={() => setActiveTab('mvnos')}
            className={`flex flex-col items-center justify-center gap-0.5 ${
              activeTab === 'mvnos' ? 'text-cyan-400' : 'text-slate-400'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span className="text-[10px] font-bold">알뜰폰</span>
          </button>

          <button
            onClick={() => setActiveTab('transfers')}
            className={`flex flex-col items-center justify-center gap-0.5 ${
              activeTab === 'transfers' ? 'text-fuchsia-400' : 'text-slate-400'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span className="text-[10px] font-bold">자동이체</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 text-emerald-400"
          >
            <Cloud className="w-4 h-4" />
            <span className="text-[10px] font-bold">설치/동기화</span>
          </button>
        </div>
      </nav>

      {isModalOpen && (
        <SmartMemoModal
          db={db}
          refDate={refDate}
          pwaPrompt={pwaPrompt}
          onTriggerPwaInstall={handleTriggerPwaInstall}
          onClose={() => setIsModalOpen(false)}
          onRestoreFullDb={(newDb) => persistUpdate(() => newDb)}
          onResetToInitial={() => persistUpdate(() => INITIAL_DB)}
        />
      )}
    </div>
  );
}

export default App;
