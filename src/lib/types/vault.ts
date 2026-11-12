/**
 * OmniID Core Vault & Recovery Data Types
 */

export interface VaultAccount {
  id: string;
  service: string; // e.g. "Google", "GitHub", "AWS", "Resend"
  accountName: string; // e.g. "user@example.com"
  secret: string; // Base32 TOTP secret key
  digits?: number;
  period?: number;
}

export interface ShamirShareMeta {
  index: number;
  label: string;
  shareHex: string;
  description: string;
}

export interface Argon2idParams {
  memorySize: number; // in KB, e.g. 65536 = 64MB
  iterations: number; // e.g. 3
  parallelism: number; // e.g. 1
  hashLength: number; // 32 bytes = 256 bits
}

export interface EncryptedMasterKeyContainer {
  salt: string; // Base64 (16 bytes random salt)
  iv: string; // Base64 (12 bytes AES-GCM IV)
  ciphertext: string; // Base64 wrapped master key
  kdfParams: Argon2idParams;
}

/**
 * Encrypted vault payload.
 * CRITICAL: This payload contains ONLY the ciphertext and wrapped key.
 * It NEVER contains all Shamir recovery shares.
 */
export interface EncryptedVaultPayload {
  version: string; // "3.1.0"
  identifier: string; // user identifier / handle
  vaultIv: string; // Base64 AES-GCM IV
  vaultCiphertext: string; // Base64 encrypted VaultAccount[]
  wrappedMasterKey: EncryptedMasterKeyContainer;
  createdAt: string;
}

/**
 * Standard Rescue Kit file format (.json).
 * Contains the encrypted vault plus AT MOST 1 recovery share (Share 1).
 * Unlocking with shares requires 2 additional separate shares from other locations.
 */
export interface RescueKitExport {
  version: string;
  title: string;
  identifier: string;
  createdAt: string;
  securityNotice: string;
  encryptedVault: EncryptedVaultPayload;
  primaryRescueShare: ShamirShareMeta; // Share 1 only
}

export interface SeparateShareCard {
  shareIndex: number;
  totalShares: number;
  threshold: number;
  identifier: string;
  label: string;
  description: string;
  shareHex: string;
  instructions: string;
}

export interface PassphraseEvaluation {
  isValid: boolean;
  score: number; // 0 to 4 from zxcvbn
  scoreLabel: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  warning: string;
  suggestion: string;
  crackTimeDisplay: string;
}
