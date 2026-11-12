'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  createNewVault,
  VaultAccount,
  EncryptedVaultPayload,
} from '@/lib/crypto/vaultCrypto';
import {
  Check,
  Plus,
  Trash2,
  KeyRound,
  Download,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Copy,
  Users,
} from 'lucide-react';

const DICEWARE_WORDLIST = [
  'apple', 'battery', 'cable', 'desert', 'eagle', 'falcon', 'galaxy',
  'harbor', 'island', 'jungle', 'lagos', 'meteor', 'nebula', 'ocean',
  'planet', 'quantum', 'river', 'safari', 'thunder', 'voyage', 'whisper',
  'zenith', 'beacon', 'canyon', 'delta', 'ember', 'forest', 'glacier'
];

function generateDicewarePassphrase(): string {
  const words: string[] = [];
  const randomBytes = new Uint8Array(5);
  window.crypto.getRandomValues(randomBytes);
  for (let i = 0; i < 5; i++) {
    words.push(DICEWARE_WORDLIST[randomBytes[i] % DICEWARE_WORDLIST.length]);
  }
  return words.join('-');
}

export default function EnrollPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [username, setUsername] = useState('damisileayoola@gmail.com');
  const [passphrase, setPassphrase] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hashingProgress, setHashingProgress] = useState<string | null>(null);
  const [createdVault, setCreatedVault] = useState<EncryptedVaultPayload | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Default demo accounts (realistic sample TOTP secrets)
  const [accounts, setAccounts] = useState<VaultAccount[]>([
    {
      id: 'acc-1',
      service: 'Google Workspace',
      accountName: 'damisileayoola@gmail.com',
      secret: 'JBSWY3DPEHPK3PXP', // Base32 test secret
    },
    {
      id: 'acc-2',
      service: 'GitHub',
      accountName: 'Ayoola-tech2024',
      secret: 'KRUGS4ZANFZSA33V',
    },
    {
      id: 'acc-3',
      service: 'AWS Production',
      accountName: 'root-admin',
      secret: 'MZXW6YTBOI======',
    },
  ]);

  const handleGeneratePassphrase = () => {
    setPassphrase(generateDicewarePassphrase());
  };

  const handleAddAccount = () => {
    const newAcc: VaultAccount = {
      id: `acc-${Date.now()}`,
      service: 'Resend / Cloud',
      accountName: 'dev@omni.id',
      secret: 'JBSWY3DPEHPK3PXP',
    };
    setAccounts([...accounts, newAcc]);
  };

  const handleRemoveAccount = (id: string) => {
    setAccounts(accounts.filter((a) => a.id !== id));
  };

  const handleUpdateAccount = (id: string, field: keyof VaultAccount, value: string) => {
    setAccounts(
      accounts.map((acc) => (acc.id === id ? { ...acc, [field]: value } : acc))
    );
  };

  const handleFinalizeEnrollment = async () => {
    if (passphrase.trim().length < 8) {
      alert('Passphrase must be at least 8 characters long.');
      return;
    }
    setIsProcessing(true);
    setHashingProgress('Deriving key via Argon2id (64MB memory, 3 iterations)...');

    try {
      // Yield to let UI update
      await new Promise((r) => setTimeout(r, 100));

      const { vault } = await createNewVault(passphrase, accounts);
      setCreatedVault(vault);

      // Save encrypted vault to localStorage under user's handle
      if (typeof window !== 'undefined') {
        localStorage.setItem(`omni_vault_${username.toLowerCase().trim()}`, JSON.stringify(vault));
        localStorage.setItem('omni_latest_user', username.toLowerCase().trim());
      }

      setStep(4);
    } catch (err) {
      console.error('Enrollment error:', err);
      alert('Failed to construct vault: ' + String(err));
    } finally {
      setIsProcessing(false);
      setHashingProgress(null);
    }
  };

  const downloadRescueKit = () => {
    if (!createdVault) return;
    const exportData = {
      title: 'OmniID Emergency Rescue Kit',
      username,
      createdAt: createdVault.createdAt,
      instructions:
        'Keep this file safe. Any 3 Shamir shares reconstruct your Master Key without your passphrase.',
      shares: createdVault.shamirShares,
      encryptedVault: {
        version: createdVault.version,
        vaultIv: createdVault.vaultIv,
        vaultCiphertext: createdVault.vaultCiphertext,
        wrappedMasterKey: createdVault.wrappedMasterKey,
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omni-id-rescue-kit-${username.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyShare = (hex: string, index: number) => {
    navigator.clipboard.writeText(hex);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Progress Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400 mb-2">
            <KeyRound className="h-3.5 w-3.5" />
            <span>Lifeline Setup Wizard</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Enroll Emergency Recovery Lifeline</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Zero single points of failure. Protected by Argon2id and 3-of-5 Shamir Secret Sharing.
          </p>

          {/* Stepper Dots */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  step === s
                    ? 'w-8 bg-emerald-400'
                    : step > s
                    ? 'w-2 bg-emerald-600'
                    : 'w-2 bg-zinc-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* STEP 1: Handle Setup */}
        {step === 1 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-xl backdrop-blur-md">
            <h3 className="text-base font-bold text-white mb-1">Step 1: Identity Handle</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Enter your email or unique developer handle. This identifies your vault during recovery.
            </p>

            <div className="mb-6">
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Your Primary Handle or Email
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. user@gmail.com"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                disabled={!username.trim()}
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2.5 text-xs font-bold text-zinc-950 transition hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40"
              >
                <span>Continue</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Passphrase Setup */}
        {step === 2 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-xl backdrop-blur-md">
            <h3 className="text-base font-bold text-white mb-1">Step 2: Mental Master Passphrase</h3>
            <p className="text-xs text-zinc-400 mb-5">
              This passphrase wraps your Master Key using memory-hard **Argon2id**. 
              You can memorize it or use our Diceware generator.
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    High-Entropy Passphrase
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassphrase}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Generate Diceware Words</span>
                  </button>
                </div>

                <input
                  type="text"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="e.g. correct-horse-battery-staple-lagos"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-mono text-emerald-300 placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-3 text-xs text-zinc-400">
                <span className="font-semibold text-emerald-400">Security Rule:</span> Even if our servers are fully compromised, attackers cannot crack this passphrase without evaluating 64MB of memory per guess.
              </div>
            </div>

            <div className="mt-8 flex justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-xl border border-zinc-800 px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white"
              >
                Back
              </button>
              <button
                type="button"
                disabled={passphrase.trim().length < 8}
                onClick={() => setStep(3)}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2.5 text-xs font-bold text-zinc-950 transition hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40"
              >
                <span>Continue</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Add Emergency Accounts */}
        {step === 3 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Emergency Accounts to Protect</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  These secrets will be encrypted using your 256-bit AES-GCM Master Key.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddAccount}
                className="flex items-center gap-1 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-zinc-700"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Account</span>
              </button>
            </div>

            <div className="space-y-3">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3.5 flex flex-col sm:flex-row gap-3 items-center justify-between"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full">
                    <input
                      type="text"
                      value={acc.service}
                      onChange={(e) => handleUpdateAccount(acc.id, 'service', e.target.value)}
                      placeholder="Service (e.g. Google)"
                      className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-white"
                    />
                    <input
                      type="text"
                      value={acc.accountName}
                      onChange={(e) => handleUpdateAccount(acc.id, 'accountName', e.target.value)}
                      placeholder="Account (e.g. email)"
                      className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-white"
                    />
                    <input
                      type="text"
                      value={acc.secret}
                      onChange={(e) => handleUpdateAccount(acc.id, 'secret', e.target.value)}
                      placeholder="Base32 Secret"
                      className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-mono text-emerald-300 col-span-2 sm:col-span-1"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveAccount(acc.id)}
                    className="p-1.5 text-zinc-500 hover:text-red-400 transition"
                    title="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-xl border border-zinc-800 px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white"
              >
                Back
              </button>
              <button
                type="button"
                disabled={isProcessing || accounts.length === 0}
                onClick={handleFinalizeEnrollment}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2.5 text-xs font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>{hashingProgress || 'Encrypting Vault...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Lock Vault & Generate Shamir Shares</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Success & Shamir 3-of-5 Share Distribution */}
        {step === 4 && createdVault && (
          <div className="rounded-2xl border border-emerald-500/40 bg-zinc-900/60 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
            <div className="text-center mb-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto mb-3">
                <Check className="h-7 w-7 stroke-[3]" />
              </div>

              <h2 className="text-2xl font-extrabold text-white">Vault Encrypted & Anchored!</h2>
              <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                Your 256-bit Master Key has been split into **5 Shamir shares**. 
                Any 3 shares recover your accounts without needing your passphrase.
              </p>
            </div>

            {/* Shamir Shares List */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-emerald-400" />
                  Your 3-of-5 Shamir Recovery Shares:
                </span>
                <span className="text-[11px] text-zinc-500">Threshold: 3 required</span>
              </div>

              {createdVault.shamirShares.map((share) => (
                <div
                  key={share.index}
                  className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-3 text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-emerald-400">
                      Share #{share.index}: {share.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyShare(share.shareHex, share.index)}
                      className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white"
                    >
                      {copiedIndex === share.index ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span>{copiedIndex === share.index ? 'Copied' : 'Copy Share'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-500 mb-1.5">{share.description}</p>
                  <p className="font-mono text-[10px] text-zinc-300 break-all bg-zinc-900/60 p-1.5 rounded border border-zinc-800/80 select-all">
                    {share.shareHex}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 border-t border-zinc-800 pt-6">
              <button
                type="button"
                onClick={downloadRescueKit}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-5 py-2.5 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-700 hover:text-white"
              >
                <Download className="h-4 w-4" />
                <span>Download Rescue Kit (.json)</span>
              </button>

              <Link
                href="/recover"
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2.5 text-xs font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-teal-400"
              >
                <span>Test Recovery Flow</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
