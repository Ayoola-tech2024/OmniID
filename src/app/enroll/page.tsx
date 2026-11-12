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
  Download,
  ArrowRight,
  Copy,
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

  const [accounts, setAccounts] = useState<VaultAccount[]>([
    {
      id: 'acc-1',
      service: 'Google Workspace',
      accountName: 'damisileayoola@gmail.com',
      secret: 'JBSWY3DPEHPK3PXP',
    },
    {
      id: 'acc-2',
      service: 'GitHub',
      accountName: 'Ayoola-tech2024',
      secret: 'KRUGS4ZANFZSA33V',
    },
    {
      id: 'acc-3',
      service: 'AWS Console',
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
      service: 'Account',
      accountName: 'user@example.com',
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
      alert('Passphrase must be at least 8 characters.');
      return;
    }
    setIsProcessing(true);
    setHashingProgress('Running Argon2id (64MB RAM, 3 iterations)...');

    try {
      await new Promise((r) => setTimeout(r, 80));

      const { vault } = await createNewVault(passphrase, accounts);
      setCreatedVault(vault);

      if (typeof window !== 'undefined') {
        localStorage.setItem(`omni_vault_${username.toLowerCase().trim()}`, JSON.stringify(vault));
        localStorage.setItem('omni_latest_user', username.toLowerCase().trim());
      }

      setStep(4);
    } catch (err) {
      console.error('Enrollment error:', err);
      alert('Could not create vault: ' + String(err));
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-10 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 border-b border-zinc-800 pb-5">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">Create an emergency recovery kit</h1>
            <span className="text-xs text-zinc-500 font-mono">Step {step} of 4</span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Generates a passphrase-protected vault and splits your key into five shares.
          </p>
        </div>

        {/* STEP 1: Handle Setup */}
        {step === 1 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
            <h3 className="text-sm font-semibold text-white mb-1">Your identifier</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Enter your email address or username. This labels your encrypted backup.
            </p>

            <div className="mb-6">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:border-zinc-400 focus:outline-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                disabled={!username.trim()}
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-200 transition disabled:opacity-40"
              >
                <span>Continue</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Passphrase Setup */}
        {step === 2 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-white">Master passphrase</h3>
              <button
                type="button"
                onClick={handleGeneratePassphrase}
                className="text-xs text-zinc-400 hover:text-white underline"
              >
                Generate 5 random words
              </button>
            </div>
            <p className="text-xs text-zinc-400 mb-4">
              OmniID derives the key using Argon2id with 64 MB of RAM and three iterations, so offline guessing requires dedicated memory per attempt.
            </p>

            <div className="space-y-4">
              <input
                type="text"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="e.g. apple-battery-lagos-quantum-river"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm font-mono text-zinc-200 placeholder-zinc-600 focus:border-zinc-400 focus:outline-none"
              />

              <p className="text-[11px] text-zinc-500">
                Choose words you can remember if you are away from your home or desk.
              </p>
            </div>

            <div className="mt-6 flex justify-between gap-3 pt-3 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-lg border border-zinc-800 px-3.5 py-2 text-xs text-zinc-400 hover:text-white"
              >
                Back
              </button>
              <button
                type="button"
                disabled={passphrase.trim().length < 8}
                onClick={() => setStep(3)}
                className="flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-200 transition disabled:opacity-40"
              >
                <span>Continue</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Add Emergency Accounts */}
        {step === 3 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
            <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white">Accounts to protect</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Enter the base32 secret keys or recovery codes for the accounts you cannot lose.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddAccount}
                className="flex items-center gap-1 rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
              >
                <Plus className="h-3 w-3" />
                <span>Add row</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 flex flex-col sm:flex-row gap-2 items-center"
                >
                  <input
                    type="text"
                    value={acc.service}
                    onChange={(e) => handleUpdateAccount(acc.id, 'service', e.target.value)}
                    placeholder="Service (e.g. Google)"
                    className="w-full sm:w-1/3 rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-white"
                  />
                  <input
                    type="text"
                    value={acc.accountName}
                    onChange={(e) => handleUpdateAccount(acc.id, 'accountName', e.target.value)}
                    placeholder="Email or username"
                    className="w-full sm:w-1/3 rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-white"
                  />
                  <input
                    type="text"
                    value={acc.secret}
                    onChange={(e) => handleUpdateAccount(acc.id, 'secret', e.target.value)}
                    placeholder="Base32 Secret"
                    className="w-full sm:w-1/3 rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs font-mono text-zinc-300"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveAccount(acc.id)}
                    className="p-1 text-zinc-500 hover:text-red-400"
                    title="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-between gap-3 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-lg border border-zinc-800 px-3.5 py-2 text-xs text-zinc-400 hover:text-white"
              >
                Back
              </button>
              <button
                type="button"
                disabled={isProcessing || accounts.length === 0}
                onClick={handleFinalizeEnrollment}
                className="rounded-lg bg-white px-5 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-200 transition disabled:opacity-40"
              >
                {isProcessing ? (hashingProgress || 'Encrypting...') : 'Encrypt and generate shares'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Success & Shamir Shares */}
        {step === 4 && createdVault && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
            <div className="mb-5 border-b border-zinc-800 pb-4">
              <h2 className="text-base font-bold text-white">Recovery kit created</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Your key has been split into five Shamir shares. Any three shares can open the vault if you ever forget your passphrase.
              </p>
            </div>

            <div className="space-y-2.5 mb-6">
              {createdVault.shamirShares.map((share) => (
                <div
                  key={share.index}
                  className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-zinc-200">
                      Share {share.index}: {share.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyShare(share.shareHex, share.index)}
                      className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1"
                    >
                      {copiedIndex === share.index ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-500 mb-1">{share.description}</p>
                  <p className="font-mono text-[10px] text-zinc-400 break-all bg-zinc-900 p-1.5 rounded select-all">
                    {share.shareHex}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={downloadRescueKit}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs text-zinc-200 hover:bg-zinc-800 transition"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Save Rescue Kit (.json)</span>
              </button>

              <Link
                href="/recover"
                className="flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-200 transition"
              >
                <span>Test recovery flow</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
