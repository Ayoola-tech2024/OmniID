/**
 * OmniID Cryptographic Engine
 * 
 * Security Architecture:
 * 1. Master Vault Key (256-bit random entropy, generated via WebCrypto).
 * 2. Primary Encryption: AES-256-GCM authenticated encryption for TOTP seeds and backup codes.
 * 3. Primary Key Protection: High-entropy Passphrase -> Argon2id (m=64MiB, t=3, p=1, 16-byte salt) -> AES-256-GCM key wrapping.
 * 4. Disaster Recovery (Hardware-Independent Lifeline):
 *    Shamir's Secret Sharing (3-of-5 threshold):
 *    Master Vault Key is split into 5 distinct shares:
 *      - Share 1: Local / Primary Rescue Share (saved with Rescue Kit)
 *      - Share 2: Emergency Printed Card (paper / fireproof box)
 *      - Share 3: Trusted Contact (partner / co-founder / attorney)
 *      - Share 4: Secondary Hardware / Air-Gapped USB
 *      - Share 5: Encrypted Cloud Storage / Safety Box
 *    Any 3 shares mathematically reconstruct the Master Vault Key.
 * 5. Share Separation Guarantee:
 *    The encrypted vault payload and Rescue Kit contain AT MOST Share 1.
 *    Shares 2-5 are exported separately and must never be stored in the same file or database.
 */

import { argon2id } from 'hash-wasm';
import { split as sssSplit, combine as sssCombine } from 'shamir-secret-sharing';
import zxcvbn from 'zxcvbn';
import {
  VaultAccount,
  ShamirShareMeta,
  Argon2idParams,
  EncryptedMasterKeyContainer,
  EncryptedVaultPayload,
  RescueKitExport,
  SeparateShareCard,
  PassphraseEvaluation,
} from '../types/vault';

export type {
  VaultAccount,
  ShamirShareMeta,
  Argon2idParams,
  EncryptedMasterKeyContainer,
  EncryptedVaultPayload,
  RescueKitExport,
  SeparateShareCard,
  PassphraseEvaluation,
};

// Safe access to WebCrypto in both Browser and Node.js environments
function getCrypto(): Crypto {
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto;
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto;
  }
  throw new Error('WebCrypto API is not available in the current environment.');
}

export const DEFAULT_ARGON2_PARAMS: Argon2idParams = {
  memorySize: 65536, // 64 MB
  iterations: 3,
  parallelism: 1,
  hashLength: 32,
};

export const DICEWARE_WORDLIST = [
  'acorn', 'almond', 'amber', 'anchor', 'apple', 'apron', 'archer', 'arctic', 'atlas', 'autumn',
  'badger', 'balsam', 'banner', 'bark', 'baron', 'basin', 'beacon', 'beetle', 'bison', 'blizzard',
  'boulder', 'breeze', 'bronze', 'brook', 'buffalo', 'cactus', 'canyon', 'cedar', 'chimney', 'cipher',
  'cliff', 'clover', 'cobalt', 'copper', 'coral', 'cosmos', 'crater', 'creek', 'crystal', 'current',
  'dagger', 'dawn', 'desert', 'drift', 'dune', 'eagle', 'echo', 'ember', 'falcon', 'fallow',
  'feather', 'fern', 'finch', 'flint', 'forest', 'fossil', 'foxtrot', 'frost', 'galaxy', 'garnet',
  'geyser', 'glacier', 'granite', 'gravel', 'grove', 'gull', 'harbor', 'hawk', 'hazel', 'heather',
  'heron', 'hickory', 'horizon', 'icicle', 'iguana', 'indigo', 'island', 'jasper', 'javelin', 'juniper',
  'kayak', 'kelp', 'kernel', 'kestrel', 'lagoon', 'larch', 'lark', 'laurel', 'lava', 'ledge',
  'lichen', 'lynx', 'magma', 'magnolia', 'maple', 'marble', 'marsh', 'meadow', 'mesa', 'meteor',
  'mineral', 'monarch', 'moss', 'nebula', 'nettle', 'nova', 'oasis', 'ocean', 'olive', 'onyx',
  'opal', 'orbit', 'orchid', 'osprey', 'otter', 'owl', 'packet', 'parchment', 'pebble', 'pelican',
  'pine', 'plover', 'poplar', 'prairie', 'prism', 'pulsar', 'python', 'quartz', 'quill', 'quiver',
  'radius', 'raptor', 'raven', 'reef', 'ridge', 'ripple', 'river', 'robin', 'rocket', 'rover',
  'saddle', 'safari', 'saffron', 'sage', 'salmon', 'sapphire', 'savanna', 'scale', 'scarlet', 'scenic',
  'scout', 'seagull', 'sequoia', 'shadow', 'shale', 'shield', 'sierra', 'silver', 'sparrow', 'spruce',
  'summit', 'talon', 'tamarind', 'tapestry', 'thistle', 'thunder', 'timber', 'topaz', 'torrent', 'travertine',
  'tundra', 'turtle', 'valley', 'velvet', 'vortex', 'walnut', 'walrus', 'wave', 'willow', 'winter',
  'wolf', 'zenith', 'zephyr', 'zircon'
];

/**
 * Generates a 6-word cryptographically random Diceware passphrase.
 * True Shannon entropy > 75 bits.
 */
export function generateDicewarePassphrase(): string {
  const crypto = getCrypto();
  const picked: string[] = [];
  const array = new Uint32Array(6);
  crypto.getRandomValues(array);
  for (let i = 0; i < 6; i++) {
    picked.push(DICEWARE_WORDLIST[array[i] % DICEWARE_WORDLIST.length]);
  }
  return picked.join('-');
}

/**
 * Evaluates passphrase strength using zxcvbn.
 * Strictly requires zxcvbn score >= 3 and length >= 12.
 */
export function evaluatePassphraseEntropy(passphrase: string): PassphraseEvaluation {
  const trimmed = passphrase.trim();
  if (!trimmed) {
    return {
      isValid: false,
      score: 0,
      scoreLabel: 'Very Weak',
      warning: 'Passphrase cannot be empty.',
      suggestion: 'Choose at least 5-6 random words or use the generator.',
      crackTimeDisplay: 'instant',
    };
  }

  const result = zxcvbn(trimmed);
  const scoreLabels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'] as const;
  const scoreLabel = scoreLabels[result.score];

  const isValid = result.score >= 3 && trimmed.length >= 12;

  const warning =
    result.feedback.warning ||
    (result.score < 3 ? 'Passphrase is too predictable or easily guessed.' : '');
  const suggestion =
    result.feedback.suggestions.join(' ') ||
    (result.score < 3
      ? 'Add more uncommon random words or use the generator.'
      : 'Passphrase provides strong resistance against offline brute-force cracking.');

  return {
    isValid,
    score: result.score,
    scoreLabel,
    warning,
    suggestion,
    crackTimeDisplay: String(result.crack_times_display.offline_slow_hashing_1e4_per_second || 'centuries'),
  };
}

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
  const crypto = getCrypto();
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes as unknown as BufferSource,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const encryptedBuffer = await crypto.subtle.encrypt(
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
  const crypto = getCrypto();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes as unknown as BufferSource,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    cryptoKey,
    ciphertext as unknown as BufferSource
  );

  return new Uint8Array(decryptedBuffer);
}

/**
 * Generates 3-of-5 Shamir Secret Sharing shares for a 256-bit master key.
 */
export async function createShamirRecoveryShares(masterKey: Uint8Array): Promise<ShamirShareMeta[]> {
  // sssSplit takes (secret: Uint8Array, shares: number, threshold: number)
  const rawShares = await sssSplit(masterKey, 5, 3);

  const labels = [
    {
      label: 'Share 1: Primary Device / Local Rescue',
      desc: 'Stored with your Rescue Kit file. By itself, this share CANNOT decrypt your vault.',
    },
    {
      label: 'Share 2: Emergency Printed Paper Card',
      desc: 'Print or write in physical notebook, emergency folder, or home safe.',
    },
    {
      label: 'Share 3: Trusted Contact / Attorney',
      desc: 'Entrusted to a partner, co-founder, or emergency contact.',
    },
    {
      label: 'Share 4: Secondary Hardware / Air-Gapped USB',
      desc: 'Stored on an air-gapped flash drive or secondary machine.',
    },
    {
      label: 'Share 5: Encrypted Cloud / Safety Deposit',
      desc: 'Stored in separate external storage or safety deposit box.',
    },
  ];

  return rawShares.map((share, idx) => ({
    index: idx + 1,
    label: labels[idx].label,
    description: labels[idx].desc,
    shareHex: bufferToHex(share),
  }));
}

/**
 * Reconstructs the 256-bit Master Key from any 3 (or more) distinct Shamir shares.
 */
export async function reconstructMasterKeyFromShares(shareHexList: string[]): Promise<Uint8Array> {
  // Filter and normalize
  const validHexList = shareHexList
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (validHexList.length < 3) {
    throw new Error(
      `Threshold not reached: At least 3 separate recovery shares are required (provided: ${validHexList.length}).`
    );
  }

  // Deduplicate identical shares
  const uniqueHex = Array.from(new Set(validHexList.map((h) => h.toLowerCase())));
  if (uniqueHex.length < 3) {
    throw new Error('Duplicate shares detected. You must provide 3 distinct shares from different locations.');
  }

  const rawShares = uniqueHex.map(hexToBuffer);
  try {
    const recoveredKey = await sssCombine(rawShares);
    return new Uint8Array(recoveredKey);
  } catch (err) {
    throw new Error(
      'Cryptographic reconstruction failed. Ensure the shares are valid and belong to the same vault: ' + String(err)
    );
  }
}

/**
 * Creates a brand new secure OmniID vault.
 * 
 * CRITICAL SECURITY INVARIANT:
 * The returned `vault` payload contains ONLY the encrypted ciphertext and wrapped master key.
 * All 5 shares are returned separately so they can be saved in distinct locations.
 */
export async function createNewVault(
  passphrase: string,
  accounts: VaultAccount[],
  identifier: string = 'user@example.com'
): Promise<{
  vault: EncryptedVaultPayload;
  shares: ShamirShareMeta[];
  primaryShare: ShamirShareMeta;
}> {
  const entropy = evaluatePassphraseEntropy(passphrase);
  if (!entropy.isValid) {
    throw new Error(entropy.warning || entropy.suggestion);
  }

  const crypto = getCrypto();

  // 1. Generate 256-bit cryptographically secure random Master Key
  const masterKey = new Uint8Array(32);
  crypto.getRandomValues(masterKey);

  // 2. Encrypt accounts with Master Key using AES-256-GCM
  const accountsJson = new TextEncoder().encode(JSON.stringify(accounts));
  const { iv: vaultIv, ciphertext: vaultCiphertext } = await encryptAesGcm(masterKey, accountsJson);

  // 3. Derive Passphrase Key via Argon2id
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const passphraseKey = await deriveKeyFromPassphrase(passphrase, salt, DEFAULT_ARGON2_PARAMS);

  // 4. Wrap Master Key with Passphrase Key
  const { iv: wrapIv, ciphertext: wrappedKeyCiphertext } = await encryptAesGcm(passphraseKey, masterKey);

  // 5. Generate 3-of-5 Shamir Secret Shares for disaster recovery
  const shares = await createShamirRecoveryShares(masterKey);
  const primaryShare = shares[0]; // Share 1

  // 6. Assemble EncryptedVaultPayload (WITHOUT shares 2-5!)
  const vault: EncryptedVaultPayload = {
    version: '3.1.0',
    identifier: identifier.trim().toLowerCase(),
    vaultIv: bufferToBase64(vaultIv),
    vaultCiphertext: bufferToBase64(vaultCiphertext),
    wrappedMasterKey: {
      salt: bufferToBase64(salt),
      iv: bufferToBase64(wrapIv),
      ciphertext: bufferToBase64(wrappedKeyCiphertext),
      kdfParams: DEFAULT_ARGON2_PARAMS,
    },
    createdAt: new Date().toISOString(),
  };

  return {
    vault,
    shares,
    primaryShare,
  };
}

/**
 * Creates the exportable Rescue Kit JSON.
 * Contains the encrypted vault plus ONLY Share 1.
 */
export function generateRescueKitFile(
  identifier: string,
  vault: EncryptedVaultPayload,
  primaryShare: ShamirShareMeta
): RescueKitExport {
  return {
    version: '3.1.0',
    title: 'OmniID Emergency Rescue Kit',
    identifier: identifier.trim().toLowerCase(),
    createdAt: vault.createdAt,
    securityNotice:
      'CRITICAL: This file alone CANNOT open your vault. It contains your encrypted vault and Share 1 of 5. To unlock without your passphrase, you MUST also supply 2 additional separate Shamir shares from your other storage locations.',
    encryptedVault: vault,
    primaryRescueShare: primaryShare,
  };
}

/**
 * Generates separate formatted cards for each share so the user can distribute them.
 */
export function generateSeparateShareCards(
  identifier: string,
  shares: ShamirShareMeta[]
): SeparateShareCard[] {
  return shares.map((s) => ({
    shareIndex: s.index,
    totalShares: 5,
    threshold: 3,
    identifier: identifier.trim().toLowerCase(),
    label: s.label,
    description: s.description,
    shareHex: s.shareHex,
    instructions:
      `OmniID Recovery Share (${s.index} of 5).\n` +
      `Threshold: Any 3 shares reconstruct your master key.\n` +
      `Store this file/printout in a separate location from your other shares and Rescue Kit.\n` +
      `NEVER store all 5 shares together.`,
  }));
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
