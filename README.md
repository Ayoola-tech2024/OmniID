# OmniID 🛡️
> **Hardware-Independent Emergency Recovery Vault for Developers**  
> *A break-glass disaster recovery lifeline when your primary phone is dead, lost, or stolen.*

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue.svg)](https://www.typescriptlang.org/)
[![Next.js 14](https://img.shields.io/badge/Framework-Next.js%2014-black.svg)](https://nextjs.org/)
[![Argon2id](https://img.shields.io/badge/KDF-Argon2id%20(64MB%2C%203%20iter)-purple.svg)](https://en.wikipedia.org/wiki/Argon2)
[![AES-256-GCM](https://img.shields.io/badge/Security-AES--256--GCM-emerald.svg)](https://w3c.github.io/webcrypto/)
[![Shamir Secret Sharing](https://img.shields.io/badge/Recovery-Shamir%203--of--5-orange.svg)](https://en.wikipedia.org/wiki/Shamir%27s_secret_sharing)

---

> ⚠️ **DEVELOPMENT PROTOTYPE NOTICE:**  
> OmniID is an open-source security prototype exploring hardware-independent account recovery. It does **not** rely on unstable face-as-key biometrics. Vault secrets are protected exclusively by a high-entropy passphrase via **Argon2id** and **3-of-5 Shamir Secret Sharing**. Independent security audits are required before holding critical production assets.

---

## 1. The Problem: The "Dead Phone" Paradox

Modern MFA (Passkeys, Authenticator apps, push notifications) assumes your primary smartphone is **always charged, working, and in your hand**.

In reality—especially across tech ecosystems in Lagos, Nairobi, Bangalore, and for remote workers worldwide—power outages hit, batteries drop to 0%, devices are stolen, or screens break.

When you sit at a borrowed laptop or cybercafé PC to deploy code or verify an account, Google or your cloud console halts you:

<p align="center">
  <img src="public/images/infinix-lockout.png" width="700" alt="Google Prompt: Check your Infinix HOT 50i" />
</p>

> **"Check your Infinix HOT 50i. Google sent a notification to your Infinix HOT 50i. Tap 2 on your phone to verify it's you."**

If your phone is dead, you are completely locked out. You cannot push to GitHub, cannot deploy to AWS, cannot access crypto exchanges, and cannot reply to clients.

---

## 2. The Solution: Hardware-Free Disaster Recovery

OmniID is an emergency parachute, not a login replacement. When your phone is unavailable, walk up to any browser in incognito mode:

1. **Option A (Passphrase Recovery):**  
   Enter your high-entropy mental passphrase. The browser computes an **Argon2id** key derivation (64 MB memory, 3 iterations) and unwraps your 256-bit Master Key in volatile memory.

2. **Option B (3-of-5 Shamir Break-Glass Recovery):**  
   If you forgot your passphrase or cannot access your normal credentials, input any **3 out of 5** distributed Shamir shares (e.g., printed card + trusted contact share + cloud backup). The Master Key is mathematically reconstructed in-memory without a central server.

3. **Ephemeral Canvas Display:**  
   Your 6-digit TOTP codes render directly to an HTML5 `<canvas>` with randomized sub-pixel noise to foil DOM-scraping extensions. A 45-second timer auto-locks and wipes RAM (`zeroizeBuffer()`).

---

## 3. Cryptographic Architecture

```
+------------------------------------------------------------------------------------+
|                         OMNI-ID CRYPTOGRAPHIC FLOW                                 |
+------------------------------------------------------------------------------------+
|                                                                                    |
|  [ Master Vault Key (256-bit CSPRNG) ]                                             |
|        |                                                                           |
|        +---> Encrypts TOTP seeds & backup codes via AES-256-GCM                    |
|        |                                                                           |
|        +---> [ Key Path 1: Passphrase Wrapping ]                                   |
|        |     High-entropy Passphrase + 16-byte Salt -> Argon2id (64MB)             |
|        |     Wraps Master Key via AES-256-GCM                                      |
|        |                                                                           |
|        +---> [ Key Path 2: 3-of-5 Shamir's Secret Sharing ]                        |
|              Master Key is split into 5 cryptographic shares:                      |
|              - Share 1: Primary Device                                             |
|              - Share 2: Printed Emergency Paper / QR Card                          |
|              - Share 3: Trusted Contact (co-founder / family)                      |
|              - Share 4: Encrypted Offline Backup                                   |
|              - Share 5: Time-Locked Escrow                                         |
|                                                                                    |
|              * Any 3 shares reconstruct the 256-bit Master Key                     |
|                                                                                    |
+------------------------------------------------------------------------------------+
```

### Why Face-as-Key Was Removed
Earlier biometric recovery prototypes attempted to use facial landmark embeddings directly in cryptographic key derivation. In practice:
- **Biometric drift** (lighting, camera resolution, aging, facial hair) causes severe reproducibility failures over time.
- **The Twin Attack:** A 4-digit PIN combined with public helper data leaves only 13 bits of entropy—trivially guessable offline in seconds on a GPU if the database leaks.
- OmniID strictly separates **identity from key derivation**. Biometrics may serve as local device convenience (via WebAuthn / Face ID on the user's personal hardware), but **never** in master vault key derivation.

---

## 4. Threat Model & Mitigations

| Threat | Impact | OmniID Mitigation |
| :--- | :--- | :--- |
| **Database Breach** | High | Ciphertext-only storage. Master key is protected by Argon2id (64MB memory cost) or Shamir shares; no offline 4-digit brute force is possible. |
| **Borrowed Laptop Malware** | Medium | Codes are drawn to an isolated HTML5 `<canvas>` (not stored as DOM text nodes). 45-second ephemeral countdown triggers memory zeroization. |
| **Identical Twin / Family Member** | Low | Without the high-entropy passphrase or 3 Shamir shares, physical appearance grants zero access. |
| **Phone Theft / Destruction** | None | Primary design target. Recovery is completely hardware-independent via passphrase or Shamir shares. |

---

## 5. Local Setup & Development

```bash
# Clone the repository
git clone https://github.com/Ayoola-tech2024/OmniID.git
cd OmniID

# Install dependencies
npm install

# Run the development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000):
- `/enroll`: Set up your passphrase, emergency accounts, and download your 3-of-5 Shamir Rescue Card.
- `/recover`: Test emergency recovery using your passphrase or Shamir shares.

---

## 6. License
MIT © 2026 [Ayoola-tech2024](https://github.com/Ayoola-tech2024). Open-source disaster recovery protocol.
