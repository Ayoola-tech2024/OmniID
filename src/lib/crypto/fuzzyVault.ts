/**
 * OmniID Cryptographic Engine: Fuzzy Commitment Scheme & 2-of-2 Twin Defense
 * 
 * 1. Converts continuous face feature embeddings into quantized binary representations.
 * 2. Implements Fuzzy Commitment Scheme (Helper Data W = b ⊕ C).
 * 3. Incorporates the "Twin-Shield" Salt PIN (Factor 2) so identical twins cannot unlock the vault.
 * 4. Master Key Derivation: K = SHA-256(Secret ⊕ PBKDF2(PIN)).
 * 5. AES-256-GCM Vault Encryption/Decryption using Web Crypto API.
 */

export interface VaultAccount {
  id: string;
  service: string; // e.g. "Google", "GitHub", "AWS", "Resend"
  accountName: string; // e.g. "damisileayoola@gmail.com"
  secret: string; // Base32 TOTP secret key
  digits?: number;
  period?: number;
}

export interface EncryptedVaultPayload {
  version: string;
  salt: string; // Base64 salt for PBKDF2
  iv: string; // Base64 IV for AES-GCM
  ciphertext: string; // Base64 encrypted JSON of VaultAccount[]
  helperData: string; // Base64 encoded Helper Data W (b ⊕ C)
  codewordHash: string; // SHA-256 hash of Secret S for verification
}

/**
 * Quantizes a normalized float vector (e.g. 128D/512D facial landmarks) into a binary bitstring.
 */
export function quantizeVector(vector: number[], threshold: number = 0): Uint8Array {
  const byteCount = Math.ceil(vector.length / 8);
  const binary = new Uint8Array(byteCount);

  for (let i = 0; i < vector.length; i++) {
    if (vector[i] > threshold) {
      const byteIdx = Math.floor(i / 8);
      const bitIdx = i % 8;
      binary[byteIdx] |= 1 << bitIdx;
    }
  }
  return binary;
}

/**
 * Calculates Hamming distance between two binary arrays.
 */
export function calculateHammingDistance(a: Uint8Array, b: Uint8Array): number {
  let distance = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    let diff = a[i] ^ b[i];
    while (diff > 0) {
      distance += diff & 1;
      diff >>= 1;
    }
  }
  return distance;
}

/**
 * Derives the PIN Key share using WebCrypto PBKDF2 with 100,000 iterations.
 */
export async function derivePinKey(pin: string, salt: Uint8Array): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(pin) as unknown as BufferSource,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  return new Uint8Array(derivedBits);
}

/**
 * Computes SHA-256 digest of an array.
 */
export async function sha256(data: Uint8Array): Promise<string> {
  const hashBuffer = await window.crypto.subtle.digest(
    'SHA-256',
    data as unknown as BufferSource
  );
  return bufferToBase64(new Uint8Array(hashBuffer));
}

/**
 * Creates an Encrypted Vault:
 * Generates Secret S, computes Helper Data W = b ⊕ C,
 * and encrypts accounts using K = SHA256(S ⊕ PBKDF2(PIN)).
 */
export async function createVault(
  biometricVector: Uint8Array,
  pin: string,
  accounts: VaultAccount[]
): Promise<EncryptedVaultPayload> {
  // 1. Generate random 256-bit secret S
  const secretS = new Uint8Array(32);
  window.crypto.getRandomValues(secretS);

  // 2. Expand secret S to match biometric vector length (Repeat/Padded codeword C)
  const codewordC = expandToCodeword(secretS, biometricVector.length);

  // 3. Helper Data W = b ⊕ C
  const helperData = new Uint8Array(biometricVector.length);
  for (let i = 0; i < biometricVector.length; i++) {
    helperData[i] = biometricVector[i] ^ codewordC[i];
  }

  // 4. Derive PIN Key Share (Factor 2 - Twin Defense)
  const salt = new Uint8Array(16);
  window.crypto.getRandomValues(salt);
  const pinKey = await derivePinKey(pin, salt);

  // 5. Master Vault Key = SHA-256(Secret S ⊕ PinKey)
  const combinedSecret = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    combinedSecret[i] = secretS[i] ^ pinKey[i];
  }
  const masterKeyBuffer = await window.crypto.subtle.digest(
    'SHA-256',
    combinedSecret as unknown as BufferSource
  );

  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    masterKeyBuffer as unknown as BufferSource,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  // 6. Encrypt accounts JSON with AES-256-GCM
  const iv = new Uint8Array(12);
  window.crypto.getRandomValues(iv);
  const encodedPayload = new TextEncoder().encode(JSON.stringify(accounts));

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    cryptoKey,
    encodedPayload as unknown as BufferSource
  );

  return {
    version: '2.0.0',
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
    ciphertext: bufferToBase64(new Uint8Array(encryptedBuffer)),
    helperData: bufferToBase64(helperData),
    codewordHash: await sha256(secretS),
  };
}

/**
 * Recovers and Decrypts the Vault:
 * Recovers Secret S using noisy biometric scan b' and Helper Data W,
 * verifies Hamming tolerance, combines with PIN Key, and decrypts AES-256-GCM.
 */
export async function unlockVault(
  noisyBiometricVector: Uint8Array,
  pin: string,
  vault: EncryptedVaultPayload,
  maxAllowedHammingDistance: number = 32
): Promise<VaultAccount[]> {
  const helperData = base64ToBuffer(vault.helperData);
  const salt = base64ToBuffer(vault.salt);
  const iv = base64ToBuffer(vault.iv);
  const ciphertext = base64ToBuffer(vault.ciphertext);

  // 1. Calculate noisy codeword C' = W ⊕ b'
  const noisyCodeword = new Uint8Array(helperData.length);
  for (let i = 0; i < helperData.length; i++) {
    noisyCodeword[i] = helperData[i] ^ noisyBiometricVector[i];
  }

  // 2. Decode Secret S from codeword using majority voting / block repetition decoding
  const candidateSecretS = contractFromCodeword(noisyCodeword, 32);

  // 3. Re-encode candidate to measure reconstructed distance
  const reencodedCodeword = expandToCodeword(candidateSecretS, helperData.length);
  const reconstructedB = new Uint8Array(helperData.length);
  for (let i = 0; i < helperData.length; i++) {
    reconstructedB[i] = helperData[i] ^ reencodedCodeword[i];
  }

  const distance = calculateHammingDistance(reconstructedB, noisyBiometricVector);
  if (distance > maxAllowedHammingDistance) {
    throw new Error(`Biometric distance (${distance}) exceeds security threshold (${maxAllowedHammingDistance}). Face match rejected.`);
  }

  // 4. Derive PIN Key Share (Factor 2 - Twin Defense)
  const pinKey = await derivePinKey(pin, salt);

  // 5. Master Vault Key = SHA-256(Secret S ⊕ PinKey)
  const combinedSecret = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    combinedSecret[i] = candidateSecretS[i] ^ pinKey[i];
  }
  const masterKeyBuffer = await window.crypto.subtle.digest(
    'SHA-256',
    combinedSecret as unknown as BufferSource
  );

  // 6. Decrypt with AES-GCM
  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    masterKeyBuffer as unknown as BufferSource,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      cryptoKey,
      ciphertext as unknown as BufferSource
    );
    const decoded = new TextDecoder().decode(decryptedBuffer);
    return JSON.parse(decoded) as VaultAccount[];
  } catch {
    throw new Error('Decryption failed! Either the PIN is incorrect or an unauthorized face was detected.');
  }
}

/**
 * Zeroizes sensitive memory arrays in RAM.
 */
export function zeroizeBuffer(buffer: Uint8Array): void {
  buffer.fill(0);
}

// Helpers
function expandToCodeword(secret: Uint8Array, targetLen: number): Uint8Array {
  const out = new Uint8Array(targetLen);
  for (let i = 0; i < targetLen; i++) {
    out[i] = secret[i % secret.length];
  }
  return out;
}

function contractFromCodeword(codeword: Uint8Array, secretLen: number): Uint8Array {
  const secret = new Uint8Array(secretLen);
  const repeats = Math.floor(codeword.length / secretLen);
  
  for (let i = 0; i < secretLen; i++) {
    // Majority bit voting across repeat blocks
    let byteVal = 0;
    for (let bit = 0; bit < 8; bit++) {
      let ones = 0;
      for (let r = 0; r < repeats; r++) {
        const byte = codeword[r * secretLen + i];
        if ((byte >> bit) & 1) ones++;
      }
      if (ones > repeats / 2) {
        byteVal |= 1 << bit;
      }
    }
    secret[i] = byteVal;
  }
  return secret;
}

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
