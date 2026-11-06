import { AppDatabase } from '../types';
import { INITIAL_DB } from '../initialData';

const LOCAL_STORAGE_KEY = 'hi_credit_sub_hub_db_v2';
const CLOUD_CONFIG_KEY = 'hi_credit_cloud_config_v2';

export interface CloudSyncConfig {
  gistId: string;
  githubToken?: string;
  lastCloudSyncAt?: string;
}

export const DEFAULT_CLOUD_GIST_ID = '10ac81dcf7df61f3c7957fb0e92f6375';

export function loadCloudConfig(): CloudSyncConfig {
  try {
    const raw = localStorage.getItem(CLOUD_CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return { gistId: DEFAULT_CLOUD_GIST_ID };
}

export function saveCloudConfig(cfg: CloudSyncConfig): void {
  localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(cfg));
}

export function encodeDbToHash(db: AppDatabase): string {
  return btoa(encodeURIComponent(JSON.stringify(db)));
}

export function decodeDbFromHash(encoded: string): AppDatabase | null {
  try {
    const parsed = JSON.parse(decodeURIComponent(atob(encoded))) as AppDatabase;
    if (parsed && parsed.version === 2 && Array.isArray(parsed.cards)) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

export function loadLocalDb(): AppDatabase {
  if (typeof window !== 'undefined' && window.location.hash.startsWith('#sync=')) {
    const encoded = window.location.hash.replace('#sync=', '');
    const syncedDb = decodeDbFromHash(encoded);
    if (syncedDb) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(syncedDb));
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      return syncedDb;
    }
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppDatabase;
      if (parsed && parsed.version === 2 && Array.isArray(parsed.cards)) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return INITIAL_DB;
}

export async function fetchDiskDb(): Promise<AppDatabase | null> {
  try {
    const res = await fetch('./api/storage');
    if (res.ok) {
      const data = (await res.json()) as AppDatabase;
      if (data && data.version === 2 && Array.isArray(data.cards)) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        return data;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export async function pullFromCloudGist(gistId: string, token?: string): Promise<AppDatabase | null> {
  if (!gistId.trim()) return null;
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
  if (token && token.trim()) headers.Authorization = `Bearer ${token.trim()}`;

  const res = await fetch(`https://api.github.com/gists/${gistId.trim()}`, {
    headers,
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`클라우드 조회 실패 (${res.status})`);

  const gist = await res.json();
  const fileObj =
    gist.files?.['hi-credit-db.json'] ||
    (Object.values(gist.files || {})[0] as any);
  if (!fileObj || !fileObj.content) throw new Error('클라우드 파일이 없습니다.');

  const parsed = JSON.parse(fileObj.content) as AppDatabase;
  if (parsed && parsed.version === 2 && Array.isArray(parsed.cards)) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
    return parsed;
  }
  return null;
}

export async function pushToCloudGist(
  db: AppDatabase,
  gistId: string,
  token: string
): Promise<string> {
  if (!token.trim()) throw new Error('GitHub Token을 입력해주세요.');
  const res = await fetch(
    gistId.trim()
      ? `https://api.github.com/gists/${gistId.trim()}`
      : 'https://api.github.com/gists',
    {
      method: gistId.trim() ? 'PATCH' : 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: 'Hi-Credit Galaxy App Cloud Sync Database',
        public: false,
        files: {
          'hi-credit-db.json': { content: JSON.stringify(db, null, 2) },
        },
      }),
    }
  );
  if (!res.ok) throw new Error(`업로드 실패 (${res.status})`);
  const data = await res.json();
  return data.id as string;
}

export async function saveDbEverywhere(db: AppDatabase): Promise<boolean> {
  const updated: AppDatabase = {
    ...db,
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }

  const cloudCfg = loadCloudConfig();
  if (cloudCfg.gistId && cloudCfg.githubToken) {
    pushToCloudGist(updated, cloudCfg.gistId, cloudCfg.githubToken).catch(() => {});
  }

  try {
    const res = await fetch('./api/storage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated, null, 2),
    });
    return res.ok;
  } catch {
    return false;
  }
}
