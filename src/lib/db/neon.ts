import { neon } from '@neondatabase/serverless';
import { EncryptedVaultPayload } from '../types/vault';

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL;
  if (!url) {
    throw new Error('Missing DATABASE_URL_POOLED or DATABASE_URL environment variable.');
  }
  return url;
}

/**
 * Ensures zero Shamir recovery shares are ever stored alongside the encrypted vault payload.
 */
function assertNoSharesInPayload(payload: EncryptedVaultPayload): void {
  const raw = payload as unknown as Record<string, unknown>;
  if ('shamirShares' in raw || 'shares' in raw || 'primaryRescueShare' in raw) {
    throw new Error('Security invariant violation: recovery shares must never be stored in the database.');
  }
}

export async function saveEncryptedVault(
  handle: string,
  payload: EncryptedVaultPayload
): Promise<void> {
  const normalizedHandle = handle.trim().toLowerCase();
  if (!normalizedHandle) {
    throw new Error('Handle cannot be empty.');
  }

  assertNoSharesInPayload(payload);

  const sql = neon(getDatabaseUrl());
  await sql`
    INSERT INTO vaults (handle, vault_payload, updated_at)
    VALUES (${normalizedHandle}, ${JSON.stringify(payload)}::jsonb, NOW())
    ON CONFLICT (handle)
    DO UPDATE SET
      vault_payload = EXCLUDED.vault_payload,
      updated_at = NOW()
  `;
}

export async function getEncryptedVault(
  handle: string
): Promise<EncryptedVaultPayload | null> {
  const normalizedHandle = handle.trim().toLowerCase();
  if (!normalizedHandle) {
    return null;
  }

  const sql = neon(getDatabaseUrl());
  const rows = await sql`
    SELECT vault_payload
    FROM vaults
    WHERE handle = ${normalizedHandle}
    LIMIT 1
  `;

  if (!rows || rows.length === 0) {
    return null;
  }

  return rows[0].vault_payload as EncryptedVaultPayload;
}
