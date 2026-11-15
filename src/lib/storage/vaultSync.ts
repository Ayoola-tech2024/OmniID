import { EncryptedVaultPayload } from '../types/vault';

const LOCAL_STORAGE_PREFIX = 'omni_id_vault_v3_';

function getApiBaseUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_VAULT_API_URL;
  return url ? url.replace(/\/+$/, '') : null;
}

export async function saveVaultEverywhere(
  handle: string,
  vault: EncryptedVaultPayload
): Promise<{ localSaved: boolean; cloudSynced: boolean }> {
  const key = handle.trim().toLowerCase();
  let localSaved = false;
  let cloudSynced = false;

  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${key}`, JSON.stringify(vault));
    localSaved = true;
  }

  const apiBase = getApiBaseUrl();
  if (apiBase) {
    try {
      const res = await fetch(`${apiBase}/vault`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: key, vault }),
      });
      cloudSynced = res.ok;
    } catch {
      cloudSynced = false;
    }
  }

  return { localSaved, cloudSynced };
}

export async function loadVaultByHandle(
  handle: string
): Promise<{ vault: EncryptedVaultPayload | null; source: 'local' | 'cloud' | 'none' }> {
  const key = handle.trim().toLowerCase();
  if (!key) {
    return { vault: null, source: 'none' };
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${key}`);
    if (raw) {
      try {
        return { vault: JSON.parse(raw) as EncryptedVaultPayload, source: 'local' };
      } catch {
        // Ignore corrupted local cache and try cloud
      }
    }
  }

  const apiBase = getApiBaseUrl();
  if (apiBase) {
    try {
      const res = await fetch(`${apiBase}/vault?handle=${encodeURIComponent(key)}`);
      if (res.ok) {
        const data = (await res.json()) as { vault?: EncryptedVaultPayload };
        if (data.vault) {
          return { vault: data.vault, source: 'cloud' };
        }
      }
    } catch {
      // Cloud lookup failed
    }
  }

  return { vault: null, source: 'none' };
}
