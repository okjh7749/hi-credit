import { AppDatabase } from '../types';
import { INITIAL_DB } from '../initialData';

const LOCAL_STORAGE_KEY = 'hi_credit_sub_hub_db_v1';
const CLOUD_CONFIG_KEY = 'hi_credit_cloud_config_v1';

export interface CloudSyncConfig {
  gistId: string;
  githubToken?: string;
  lastCloudSyncAt?: string;
}

export const DEFAULT_CLOUD_GIST_ID = '10ac81dcf7df61f3c7957fb0e92f6375';

export function loadCloudConfig(): CloudSyncConfig {
  try {
    const raw = localStorage.getItem(CLOUD_CONFIG_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return { gistId: DEFAULT_CLOUD_GIST_ID };
}

export function saveCloudConfig(cfg: CloudSyncConfig): void {
  localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(cfg));
}

export function encodeDbToHash(db: AppDatabase): string {
  const json = JSON.stringify(db);
  return btoa(encodeURIComponent(json));
}

export function decodeDbFromHash(encoded: string): AppDatabase | null {
  try {
    const json = decodeURIComponent(atob(encoded));
    const parsed = JSON.parse(json) as AppDatabase;
    if (parsed && Array.isArray(parsed.cards) && Array.isArray(parsed.mvnos)) {
      return parsed;
    }
  } catch (e) {
    console.warn('Failed to decode sync hash', e);
  }
  return null;
}

export function loadLocalDb(): AppDatabase {
  // Check if URL has #sync=... first
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
      if (parsed && Array.isArray(parsed.cards) && Array.isArray(parsed.mvnos)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse localStorage DB, using INITIAL_DB', e);
  }
  return INITIAL_DB;
}

export async function fetchDiskDb(): Promise<AppDatabase | null> {
  try {
    const res = await fetch('./api/storage');
    if (res.ok) {
      const data = (await res.json()) as AppDatabase;
      if (data && Array.isArray(data.cards)) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        return data;
      }
    }
  } catch {
    // Ignore when running on Galaxy APK or GitHub Pages
  }
  return null;
}

export async function pullFromCloudGist(gistId: string, token?: string): Promise<AppDatabase | null> {
  if (!gistId.trim()) return null;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
  };
  if (token && token.trim()) {
    headers.Authorization = `Bearer ${token.trim()}`;
  }
  const res = await fetch(`https://api.github.com/gists/${gistId.trim()}`, {
    headers,
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`클라우드 조회 실패 (${res.status})`);
  }
  const gist = await res.json();
  const fileObj =
    gist.files?.['hi-credit-db.json'] ||
    gist.files?.['storage.json'] ||
    Object.values(gist.files || {})[0] as any;
  if (!fileObj || !fileObj.content) {
    throw new Error('클라우드 Gist에 데이터 파일이 없습니다.');
  }
  const parsed = JSON.parse(fileObj.content) as AppDatabase;
  if (parsed && Array.isArray(parsed.cards)) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
    return parsed;
  }
  throw new Error('데이터 포맷이 올바르지 않습니다.');
}

export async function pushToCloudGist(
  db: AppDatabase,
  gistId: string,
  token: string
): Promise<string> {
  if (!token.trim()) {
    throw new Error('클라우드 저장 권한(GitHub Token)을 입력해주세요.');
  }
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token.trim()}`,
    'Content-Type': 'application/json',
  };

  const payload = {
    description: 'Hi-Credit Galaxy App Cloud Sync Database',
    public: false,
    files: {
      'hi-credit-db.json': {
        content: JSON.stringify(db, null, 2),
      },
    },
  };

  const url = gistId.trim()
    ? `https://api.github.com/gists/${gistId.trim()}`
    : 'https://api.github.com/gists';
  const method = gistId.trim() ? 'PATCH' : 'POST';

  const res = await fetch(url, {
    method,
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`클라우드 업로드 실패 (${res.status})`);
  }
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
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }

  // Try syncing to Cloud Gist if token + gistId are configured on device
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
