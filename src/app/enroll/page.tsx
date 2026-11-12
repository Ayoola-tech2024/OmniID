'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  createNewVault,
  generateRescueKitFile,
  generateSeparateShareCards,
  evaluatePassphraseEntropy,
  VaultAccount,
  EncryptedVaultPayload,
  ShamirShareMeta,
} from '@/lib/crypto/vaultCrypto';
import {
  ArrowRight,
  Plus,
  Trash2,
  Copy,
  Check,
  Download,
  FileText,
  AlertCircle,
} from 'lucide-react';

export default function EnrollPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [username, setUsername] = useState('user@example.com');
  const [passphrase, setPassphrase] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hashingProgress, setHashingProgress] = useState<string | null>(null);
  const [createdVault, setCreatedVault] = useState<EncryptedVaultPayload | null>(null);
  const [createdShares, setCreatedShares] = useState<ShamirShareMeta[]>([]);
  const [primaryShare, setPrimaryShare] = useState<ShamirShareMeta | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const [accounts, setAccounts] = useState<VaultAccount[]>([
    {
      id: 'acc-1',
      service: 'Google Workspace',
      accountName: 'user@example.com',
      secret: 'JBSWY3DPEHPK3PXP',
    },
    {
      id: 'acc-2',
      service: 'GitHub',
      accountName: 'my-github-handle',
      secret: 'KRUGS4ZANFZSA33V',
    },
    {
      id: 'acc-3',
      service: 'AWS Console',
      accountName: 'dev-admin',
      secret: 'MZXW633PN5XW6MZX',
    },
  ]);

  const passphraseEntropy = evaluatePassphraseEntropy(passphrase);

  const handleGeneratePassphrase = () => {
    const wordList = [
      'apple', 'battery', 'lagos', 'quantum', 'river',
      'harbor', 'timber', 'summit', 'falcon', 'nebula',
      'copper', 'meadow', 'orbit', 'breeze', 'granite',
      'canyon', 'beacon', 'shield', 'atlas', 'cipher',
    ];
    const picked: string[] = [];
    const array = new Uint32Array(5);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < 5; i++) {
      picked.push(wordList[array[i] % wordList.length]);
    }
    setPassphrase(picked.join('-'));
  };

  const handleAddAccount = () => {
    const newId = `acc-${Date.now()}`;
    setAccounts([
      ...accounts,
      {
        id: newId,
        service: 'New Account',
        accountName: username || 'user@example.com',
        secret: 'JBSWY3DPEHPK3PXP',
      },
    ]);
  };

  const handleUpdateAccount = (id: string, field: keyof VaultAccount, value: string) => {
    setAccounts(
      accounts.map((acc) => (acc.id === id ? { ...acc, [field]: value } : acc))
    );
  };

  const handleRemoveAccount = (id: string) => {
    setAccounts(accounts.filter((acc) => acc.id !== id));
  };

  const handleFinalizeEnrollment = async () => {
    if (accounts.length === 0) {
      alert('Add at least one account to encrypt in your vault.');
      return;
    }
    if (!passphraseEntropy.isValid) {
      alert(passphraseEntropy.feedback);
      return;
    }

    setIsProcessing(true);
    setHashingProgress('Running Argon2id (64MB RAM, 3 iterations) and generating Shamir shares...');

    try {
      await new Promise((r) => setTimeout(r, 80));

      const { vault, shares, primaryShare: pShare } = await createNewVault(
        passphrase,
        accounts,
        username
      );

      setCreatedVault(vault);
      setCreatedShares(shares);
      setPrimaryShare(pShare);

      if (typeof window !== 'undefined') {
        // CRITICAL SECURITY INVARIANT:
        // Save encrypted vault + ONLY Share 1 (primary device share).
        // NEVER store shares 2, 3, 4, 5 in localStorage!
        const localRecord = {
          vault,
          localShare: pShare,
        };
        localStorage.setItem(`omni_vault_${username.toLowerCase().trim()}`, JSON.stringify(localRecord));
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
    if (!createdVault || !primaryShare) return;
    const exportData = generateRescueKitFile(username, createdVault, primaryShare);

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

  const downloadIndividualShare = (share: ShamirShareMeta) => {
    const content =
      `============================================================\n` +
      `OMNIID EMERGENCY RECOVERY SHARE (${share.index} of 5)\n` +
      `============================================================\n\n` +
      `Identifier:   ${username}\n` +
      `Share Label:  ${share.label}\n` +
      `Description:  ${share.description}\n\n` +
      `CRITICAL INSTRUCTIONS:\n` +
      `1. This share alone CANNOT decrypt your vault.\n` +
      `2. Any 3 of the 5 shares reconstruct your Master Key without a passphrase.\n` +
      `3. Store this file in a SEPARATE location from your other shares and Rescue Kit.\n\n` +
      `RECOVERY SHARE HEX:\n` +
      `${share.shareHex}\n\n` +
      `============================================================\n`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omni-id-share-${share.index}-${share.label.toLowerCase().replace(/[^a-z0-9]/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAllOffsiteShares = () => {
    if (createdShares.length === 0) return;
    const cards = generateSeparateShareCards(username, createdShares);

    const fullBundle =
      `============================================================\n` +
      `OMNIID DISTRIBUTED RECOVERY SHARES BUNDLE (SHARES 2 TO 5)\n` +
      `============================================================\n\n` +
      `SECURITY INVARIANT:\n` +
      `You must SEPARATE these shares immediately.\n` +
      `Store each share in a different place (printed paper card, trusted contact, USB, cloud).\n` +
      `Threshold: Any 3 shares reconstruct your master key.\n\n` +
      cards
        .slice(1) // Shares 2 to 5
        .map(
          (c) =>
            `------------------------------------------------------------\n` +
            `SHARE ${c.shareIndex} OF 5: ${c.label}\n` +
            `Destination: ${c.description}\n` +
            `Share Hex:\n${c.shareHex}\n`
        )
        .join('\n') +
      `\n============================================================\n`;

    const blob = new Blob([fullBundle], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omni-id-offsite-shares-2-to-5-${username.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
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
            Generates an Argon2id encrypted vault and splits your key into five distinct Shamir shares.
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
              OmniID derives your key using Argon2id (64 MB RAM, 3 iterations) so brute-force attempts require dedicated memory per guess.
            </p>

            <div className="space-y-3">
              <input
                type="text"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="e.g. apple-battery-lagos-quantum-river"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm font-mono text-zinc-200 placeholder-zinc-600 focus:border-zinc-400 focus:outline-none"
              />

              {/* Entropy / Strength Indicator */}
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-zinc-400">Entropy Strength:</span>
                  <span
                    className={`font-semibold ${
                      passphraseEntropy.isValid ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    ~{passphraseEntropy.estimatedBits} bits ({passphraseEntropy.wordCount} words, {passphraseEntropy.charCount} chars)
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  {passphraseEntropy.feedback}
                </p>
              </div>
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
                disabled={!passphraseEntropy.isValid}
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
                  Enter the base32 secret keys or recovery codes for the accounts you cannot afford to lose.
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
                {isProcessing ? (hashingProgress || 'Encrypting...') : 'Encrypt and split into 5 shares'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Success & Share Distribution */}
        {step === 4 && createdVault && (
          <div className="space-y-6">
            {/* Security Guarantee Notice */}
            <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-5 text-xs text-emerald-200">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-emerald-100 text-sm">
                    Vault encrypted & 3-of-5 Shamir shares created
                  </h4>
                  <p className="mt-1 leading-relaxed text-emerald-200/90">
                    Your Master Key has been split into five separate shares. Any 3 shares reconstruct your key without your passphrase.
                    To preserve security, <strong>never store all 5 shares in the same file or place</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Rescue Kit JSON (Share 1) */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">1. Download Rescue Kit (.json)</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Contains your encrypted vault + <strong>Share 1 only</strong>. This file alone cannot open your vault.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={downloadRescueKit}
                  className="flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-200 transition shrink-0"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Rescue Kit</span>
                </button>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-[11px] font-mono text-zinc-400">
                <span className="text-zinc-500">Includes: </span>
                <span>Encrypted Ciphertext (AES-256-GCM) + Argon2id Wrapped Key + Share 1 (Local)</span>
              </div>
            </div>

            {/* Offsite Shares (Shares 2 to 5) */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">2. Distribute Separate Offsite Shares</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Store each share in a separate location. You will need any 2 of these to combine with Share 1.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={downloadAllOffsiteShares}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-xs text-zinc-200 hover:bg-zinc-700 transition shrink-0"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Download All Offsite Shares (.txt)</span>
                </button>
              </div>

              {/* Individual Shares 1 to 5 */}
              <div className="space-y-3">
                {createdShares.map((share) => (
                  <div
                    key={share.index}
                    className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">
                          Share {share.index}: {share.label}
                        </span>
                        {share.index === 1 && (
                          <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400 font-mono">
                            In Rescue Kit
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => downloadIndividualShare(share)}
                          className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 border border-zinc-800 rounded px-2 py-0.5"
                          title="Download individual share card"
                        >
                          <Download className="h-3 w-3" />
                          <span>Card</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyShare(share.shareHex, share.index)}
                          className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 border border-zinc-800 rounded px-2 py-0.5"
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
                    </div>

                    <p className="text-[11px] text-zinc-500 mb-1.5">{share.description}</p>
                    <p className="font-mono text-[10px] text-zinc-400 break-all bg-zinc-900 p-1.5 rounded select-all">
                      {share.shareHex}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Test Recovery Flow Navigation */}
            <div className="flex justify-end pt-2">
              <Link
                href="/recover"
                className="flex items-center gap-1.5 rounded-lg bg-white px-5 py-2.5 text-xs font-semibold text-zinc-900 hover:bg-zinc-200 transition"
              >
                <span>Proceed to recovery test</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
