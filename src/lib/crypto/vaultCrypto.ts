/**
 * OmniID Cryptographic Engine (Production Grade)
 * 
 * Cryptographic Architecture:
 * 1. Master Vault Key (256-bit random entropy, generated via WebCrypto).
 * 2. Primary Encryption: AES-256-GCM authenticated encryption for TOTP seeds and backup codes.
 * 3. Primary Key Protection: High-entropy Passphrase -> Argon2id (m=64MiB, t=3, p=1, 16-byte salt) -> AES-256-GCM key wrapping.
 * 4. Disaster Recovery (Hardware-Independent Lifeline):
 *    Shamir's Secret Sharing (3-of-5 threshold):
 *    Master Vault Key is split into 5 shares:
 *      - Share 1: Primary Device / Local
 *      - Share 2: Printed Emergency Rescue Card / QR
 *      - Share 3: Trusted Contact / Co-founder
 *      - Share 4: Cloud Backup (Encrypted)
 *      - Share 5: Server Escrow (Time-locked recovery)
 *    Any 3 shares mathematically reconstruct the Master Vault Key.
 * 5. Memory Security: zeroizeBuffer() wipes volatile RAM on lock/self-destruct.
 * 
 * Note: Biometrics are strictly excluded from master key derivation.
 */

import { argon2id } from 'hash-wasm';
import { split as sssSplit, combine as sssCombine } from 'shamir-secret-sharing';

export interface VaultAccount {
  id: string;
  service: string; // e.g. "Google", "GitHub", "AWS", "Resend"
  accountName: string; // e.g. "damisileayoola@gmail.com"
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
  salt: string; // Base64
  iv: string; // Base64
  ciphertext: string; // Base64 wrapped master key
  kdfParams: Argon2idParams;
}

export interface EncryptedVaultPayload {
  version: string; // "3.0.0"
  vaultIv: string; // Base64
  vaultCiphertext: string; // Base64 encrypted VaultAccount[]
  wrappedMasterKey: EncryptedMasterKeyContainer;
  shamirShares: ShamirShareMeta[]; // Exportable 3-of-5 recovery shares
  createdAt: string;
}

export const DEFAULT_ARGON2_PARAMS: Argon2idParams = {
  memorySize: 65536, // 64 MB
  iterations: 3,
  parallelism: 1,
  hashLength: 32,
};

/**
 * Derives a 256-bit encryption key from a user passphrase using Argon2id (WebAssembly).
 */
export async function deriveKeyFromPassphrase(
  passphrase: string,
  salt: Uint8Array,
  params: Argon2idParams = DEFAULT_ARGON2_PARAMS
): Promise<Uint8Array> {
  const derivedKey = await argon2id({
    password: passphrase,
    salt,
    parallelism: params.parallelism,
    iterations: params.iterations,
    memorySize: params.memorySize,
    hashLength: params.hashLength,
    outputType: 'binary',
  });
  return new Uint8Array(derivedKey);
}

/**
 * Encrypts arbitrary bytes using AES-256-GCM.
 */
export async function encryptAesGcm(
  keyBytes: Uint8Array,
  plaintext: Uint8Array
): Promise<{ iv: Uint8Array; ciphertext: Uint8Array }> {
  const iv = new Uint8Array(12);
  window.crypto.getRandomValues(iv);

  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    keyBytes as unknown as BufferSource,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    cryptoKey,
    plaintext as unknown as BufferSource
  );

  return {
    iv,
    ciphertext: new Uint8Array(encryptedBuffer),
  };
}

/**
 * Decrypts AES-256-GCM ciphertext.
 */
export async function decryptAesGcm(
  keyBytes: Uint8Array,
  iv: Uint8Array,
  ciphertext: Uint8Array
): Promise<Uint8Array> {
  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    keyBytes as unknown as BufferSource,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    cryptoKey,
    ciphertext as unknown as BufferSource
  );

  return new Uint8Array(decryptedBuffer);
}

/**
 * Generates 3-of-5 Shamir Secret Sharing shares for a 256-bit key.
 */
export async function createShamirRecoveryShares(masterKey: Uint8Array): Promise<ShamirShareMeta[]> {
  // sssSplit takes (secret: Uint8Array, shares: number, threshold: number)
  const rawShares = await sssSplit(masterKey, 5, 3);
  
  const labels = [
    { label: 'Primary Device Share', desc: 'Saved in primary browser/device secure storage' },
    { label: 'Emergency Printed Card', desc: 'Print or write in your physical fireproof vault / notebook' },
    { label: 'Trusted Contact Share', desc: 'Give to your spouse, trusted co-founder, or legal contact' },
    { label: 'Secondary Hardware / Offline Backup', desc: 'Stored on an air-gapped USB or secondary laptop' },
    { label: 'Time-Locked Escrow Share', desc: 'Held in escrow with 48h emergency cancellation delay' },
  ];

  return rawShares.map((share, idx) => ({
    index: idx + 1,
    label: labels[idx].label,
    description: labels[idx].desc,
    shareHex: bufferToHex(share),
  }));
}

/**
 * Reconstructs the 256-bit Master Key from any 3 (or more) Shamir shares.
 */
export async function reconstructMasterKeyFromShares(shareHexList: string[]): Promise<Uint8Array> {
  if (shareHexList.length < 3) {
    throw new Error('At least 3 valid recovery shares are required to reconstruct the vault key.');
  }

  const rawShares = shareHexList.map(hexToBuffer);
  const recoveredKey = await sssCombine(rawShares);
  return new Uint8Array(recoveredKey);
}

/**
 * Creates a brand new secure OmniID vault.
 */
export async function createNewVault(
  passphrase: string,
  accounts: VaultAccount[]
): Promise<{ vault: EncryptedVaultPayload; masterKey: Uint8Array }> {
  if (passphrase.trim().length < 8) {
    throw new Error('Passphrase must be at least 8 characters long (recommend 5+ random words).');
  }

  // 1. Generate 256-bit cryptographically secure random Master Key
  const masterKey = new Uint8Array(32);
  window.crypto.getRandomValues(masterKey);

  // 2. Encrypt accounts with Master Key using AES-256-GCM
  const accountsJson = new TextEncoder().encode(JSON.stringify(accounts));
  const { iv: vaultIv, ciphertext: vaultCiphertext } = await encryptAesGcm(masterKey, accountsJson);

  // 3. Derive Passphrase Key via Argon2id
  const salt = new Uint8Array(16);
  window.crypto.getRandomValues(salt);
  const passphraseKey = await deriveKeyFromPassphrase(passphrase, salt, DEFAULT_ARGON2_PARAMS);

  // 4. Wrap (encrypt) Master Key with Passphrase Key
  const { iv: wrapIv, ciphertext: wrappedKeyCiphertext } = await encryptAesGcm(passphraseKey, masterKey);

  // 5. Generate 3-of-5 Shamir Secret Shares for disaster recovery
  const shamirShares = await createShamirRecoveryShares(masterKey);

  const vaultPayload: EncryptedVaultPayload = {
    version: '3.0.0',
    vaultIv: bufferToBase64(vaultIv),
    vaultCiphertext: bufferToBase64(vaultCiphertext),
    wrappedMasterKey: {
      salt: bufferToBase64(salt),
      iv: bufferToBase64(wrapIv),
      ciphertext: bufferToBase64(wrappedKeyCiphertext),
      kdfParams: DEFAULT_ARGON2_PARAMS,
    },
    shamirShares,
    createdAt: new Date().toISOString(),
  };

  return { vault: vaultPayload, masterKey };
}

/**
 * Unlocks the vault using the user's Passphrase (Argon2id + AES-256-GCM).
 */
export async function unlockVaultWithPassphrase(
  passphrase: string,
  vault: EncryptedVaultPayload
): Promise<VaultAccount[]> {
  const salt = base64ToBuffer(vault.wrappedMasterKey.salt);
  const wrapIv = base64ToBuffer(vault.wrappedMasterKey.iv);
  const wrappedKeyCiphertext = base64ToBuffer(vault.wrappedMasterKey.ciphertext);
  const vaultIv = base64ToBuffer(vault.vaultIv);
  const vaultCiphertext = base64ToBuffer(vault.vaultCiphertext);

  // 1. Re-derive Passphrase Key via Argon2id
  const passphraseKey = await deriveKeyFromPassphrase(
    passphrase,
    salt,
    vault.wrappedMasterKey.kdfParams
  );

  // 2. Unwrap Master Key
  let masterKey: Uint8Array;
  try {
    masterKey = await decryptAesGcm(passphraseKey, wrapIv, wrappedKeyCiphertext);
  } catch {
    throw new Error('Incorrect passphrase or corrupted vault.');
  }

  // 3. Decrypt Vault Accounts
  try {
    const accountsBytes = await decryptAesGcm(masterKey, vaultIv, vaultCiphertext);
    const jsonStr = new TextDecoder().decode(accountsBytes);
    return JSON.parse(jsonStr) as VaultAccount[];
  } finally {
    // Zeroize memory
    zeroizeBuffer(masterKey);
    zeroizeBuffer(passphraseKey);
  }
}

/**
 * Unlocks the vault using any 3 Shamir shares (Hardware-Free Emergency Recovery).
 */
export async function unlockVaultWithShares(
  shareHexList: string[],
  vault: EncryptedVaultPayload
): Promise<VaultAccount[]> {
  // 1. Reconstruct Master Key from Shamir shares
  const masterKey = await reconstructMasterKeyFromShares(shareHexList);

  const vaultIv = base64ToBuffer(vault.vaultIv);
  const vaultCiphertext = base64ToBuffer(vault.vaultCiphertext);

  try {
    const accountsBytes = await decryptAesGcm(masterKey, vaultIv, vaultCiphertext);
    const jsonStr = new TextDecoder().decode(accountsBytes);
    return JSON.parse(jsonStr) as VaultAccount[];
  } catch {
    throw new Error('Failed to decrypt vault with provided recovery shares.');
  } finally {
    zeroizeBuffer(masterKey);
  }
}

/**
 * Memory zeroization helper.
 */
export function zeroizeBuffer(buffer: Uint8Array): void {
  buffer.fill(0);
}

// Byte conversion helpers
export function bufferToBase64(buf: Uint8Array): string {
  let binary = '';
  const len = buf.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buf[i]);
  }
  return btoa(binary);
}

export function base64ToBuffer(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function bufferToHex(buf: Uint8Array): string {
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToBuffer(hex: string): Uint8Array {
  const clean = hex.replace(/[^0-9a-fA-F]/g, '');
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
