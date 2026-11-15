-- OmniID Zero-Knowledge Encrypted Vault Schema (Neon Serverless Postgres)
-- Stores ONLY the encrypted vault payload (Argon2id + AES-256-GCM ciphertext).
-- CRITICAL INVARIANT: Never store Shamir recovery shares (Shares 1-5) in this table.

CREATE TABLE IF NOT EXISTS vaults (
  handle TEXT PRIMARY KEY,
  vault_payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vaults_updated_at ON vaults (updated_at DESC);
