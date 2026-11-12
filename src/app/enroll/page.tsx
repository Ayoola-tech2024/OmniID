'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  createNewVault,
  generateRescueKitFile,
  generateDicewarePassphrase,
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
  ShieldCheck,
  CheckCircle2,
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

  // Stepper for distributing shares 1 through 5 one by one
  const [distributionStep, setDistributionStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [hasDownloadedRescueKit, setHasDownloadedRescueKit] = useState(false);
  const [confirmedShare1, setConfirmedShare1] = useState(false);
  const [confirmedShare2, setConfirmedShare2] = useState(false);
  const [confirmedShare3, setConfirmedShare3] = useState(false);
  const [confirmedShare4, setConfirmedShare4] = useState(false);
  const [confirmedShare5, setConfirmedShare5] = useState(false);

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
    const generated = generateDicewarePassphrase();
    setPassphrase(generated);
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
      alert(passphraseEntropy.warning || passphraseEntropy.suggestion);
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
      setDistributionStep(1);
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
    setHasDownloadedRescueKit(true);
  };

  const downloadIndividualShare = (share: ShamirShareMeta) => {
    const content =
      `============================================================\n` +
      `OMNIID EMERGENCY RECOVERY SHARE (${share.index} of 5)\n` +
      `============================================================\n\n` +
      `Identifier:   ${username}\n` +
      `Share Label:  ${share.label}\n` +
      `Description:  ${share.description}\n\n` +
      `CRITICAL SECURITY INSTRUCTIONS:\n` +
      `1. This single share CANNOT decrypt your vault.\n` +
      `2. Any 3 of the 5 shares reconstruct your Master Key without your passphrase.\n` +
      `3. Store this file in a SEPARATE physical or digital location from your other shares.\n` +
      `4. NEVER store multiple shares in the same folder or computer.\n\n` +
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
                className="text-xs text-zinc-300 hover:text-white underline font-medium"
              >
                Generate 6 Diceware words
              </button>
            </div>
            <p className="text-xs text-zinc-400 mb-4">
              OmniID derives your key using Argon2id (64 MB RAM, 3 iterations). Enter a strong passphrase or generate 6 random words.
            </p>

            <div className="space-y-3">
              <input
                type="text"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="e.g. boulder-glacier-falcon-meadow-timber-summit"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm font-mono text-zinc-200 placeholder-zinc-600 focus:border-zinc-400 focus:outline-none"
              />

              {/* Realistic zxcvbn Strength Indicator */}
              {passphrase.trim().length > 0 && (
                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3.5 text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-zinc-400">Passphrase Strength:</span>
                    <span
                      className={`font-semibold ${
                        passphraseEntropy.score >= 3 ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {passphraseEntropy.scoreLabel} (Score {passphraseEntropy.score}/4)
                    </span>
                  </div>

                  {/* 4-bar strength meter */}
                  <div className="grid grid-cols-4 gap-1.5 mb-2">
                    {[1, 2, 3, 4].map((bar) => (
                      <div
                        key={bar}
                        className={`h-1.5 rounded-full ${
                          bar <= passphraseEntropy.score
                            ? passphraseEntropy.score >= 3
                              ? 'bg-emerald-500'
                              : 'bg-amber-500'
                            : 'bg-zinc-800'
                        }`}
                      />
                    ))}
                  </div>

                  {passphraseEntropy.warning && (
                    <p className="text-[11px] text-amber-300 font-medium mb-1">
                      ⚠️ {passphraseEntropy.warning}
                    </p>
                  )}
                  <p className="text-[11px] text-zinc-400">
                    {passphraseEntropy.suggestion}
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-1 font-mono">
                    Estimated offline brute-force time: {passphraseEntropy.crackTimeDisplay}
                  </p>
                </div>
              )}
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

        {/* STEP 4: Forced One-by-One Share Distribution Stepper */}
        {step === 4 && createdVault && createdShares.length === 5 && (
          <div className="space-y-6">
            {/* Top Stepper Indicator */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <span className="text-xs text-zinc-500 font-mono">
                  Distribution Step {distributionStep} of 5
                </span>
                <h2 className="text-base font-bold text-white mt-0.5">
                  Distribute your recovery shares separately
                </h2>
              </div>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div
                    key={s}
                    className={`h-2 w-5 rounded-full transition ${
                      s < distributionStep
                        ? 'bg-emerald-500'
                        : s === distributionStep
                        ? 'bg-white'
                        : 'bg-zinc-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* DISTRIBUTION 1: Rescue Kit JSON (Vault + Share 1) */}
            {distributionStep === 1 && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-zinc-800 p-2 text-zinc-300">
                    <Download className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Share 1: Primary Rescue Kit (.json)
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      Download your encrypted Rescue Kit. It contains your encrypted vault and <strong>Share 1 of 5 only</strong>. By itself, this file cannot unlock your vault.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={downloadRescueKit}
                    className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-200 transition"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Rescue Kit JSON</span>
                  </button>
                </div>

                <div className="pt-3 border-t border-zinc-800/80">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                    <input
                      type="checkbox"
                      checked={confirmedShare1}
                      onChange={(e) => setConfirmedShare1(e.target.checked)}
                      className="rounded border-zinc-700 bg-zinc-900 text-white focus:ring-0"
                    />
                    <span>I have downloaded and stored my Rescue Kit file on this device.</span>
                  </label>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    disabled={!hasDownloadedRescueKit || !confirmedShare1}
                    onClick={() => setDistributionStep(2)}
                    className="flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-200 transition disabled:opacity-40"
                  >
                    <span>Continue to Share 2</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* DISTRIBUTION 2: Share 2 (Paper Card) */}
            {distributionStep === 2 && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Share 2: Emergency Printed Paper Card
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Write down this share by hand in a notebook, or download the printable card file and store it physically away from your computer.
                  </p>
                </div>

                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-zinc-400 font-mono">Share 2 of 5</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => downloadIndividualShare(createdShares[1])}
                        className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 border border-zinc-800 rounded px-2 py-0.5"
                      >
                        <Download className="h-3 w-3" />
                        <span>Download Card</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyShare(createdShares[1].shareHex, 2)}
                        className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 border border-zinc-800 rounded px-2 py-0.5"
                      >
                        {copiedIndex === 2 ? (
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
                  <p className="font-mono text-[10px] text-zinc-300 break-all select-all bg-zinc-900 p-2 rounded">
                    {createdShares[1].shareHex}
                  </p>
                </div>

                <div className="pt-2 border-t border-zinc-800/80">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                    <input
                      type="checkbox"
                      checked={confirmedShare2}
                      onChange={(e) => setConfirmedShare2(e.target.checked)}
                      className="rounded border-zinc-700 bg-zinc-900 text-white focus:ring-0"
                    />
                    <span>I have written down or saved Share 2 in a separate physical location.</span>
                  </label>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    disabled={!confirmedShare2}
                    onClick={() => setDistributionStep(3)}
                    className="flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-200 transition disabled:opacity-40"
                  >
                    <span>Continue to Share 3</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* DISTRIBUTION 3: Share 3 (Trusted Contact) */}
            {distributionStep === 3 && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Share 3: Trusted Contact / Attorney
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Give or send this share to your emergency contact (spouse, co-founder, partner, or legal representative). They cannot open your vault with this share alone.
                  </p>
                </div>

                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-zinc-400 font-mono">Share 3 of 5</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => downloadIndividualShare(createdShares[2])}
                        className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 border border-zinc-800 rounded px-2 py-0.5"
                      >
                        <Download className="h-3 w-3" />
                        <span>Download Card</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyShare(createdShares[2].shareHex, 3)}
                        className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 border border-zinc-800 rounded px-2 py-0.5"
                      >
                        {copiedIndex === 3 ? (
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
                  <p className="font-mono text-[10px] text-zinc-300 break-all select-all bg-zinc-900 p-2 rounded">
                    {createdShares[2].shareHex}
                  </p>
                </div>

                <div className="pt-2 border-t border-zinc-800/80">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                    <input
                      type="checkbox"
                      checked={confirmedShare3}
                      onChange={(e) => setConfirmedShare3(e.target.checked)}
                      className="rounded border-zinc-700 bg-zinc-900 text-white focus:ring-0"
                    />
                    <span>I have delivered or saved Share 3 for my trusted contact.</span>
                  </label>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    disabled={!confirmedShare3}
                    onClick={() => setDistributionStep(4)}
                    className="flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-200 transition disabled:opacity-40"
                  >
                    <span>Continue to Share 4</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* DISTRIBUTION 4: Share 4 (Air-Gapped USB) */}
            {distributionStep === 4 && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Share 4: Secondary Hardware / Air-Gapped USB
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Save this share on an offline flash drive or secondary computer that is not connected to this machine.
                  </p>
                </div>

                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-zinc-400 font-mono">Share 4 of 5</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => downloadIndividualShare(createdShares[3])}
                        className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 border border-zinc-800 rounded px-2 py-0.5"
                      >
                        <Download className="h-3 w-3" />
                        <span>Download Card</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyShare(createdShares[3].shareHex, 4)}
                        className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 border border-zinc-800 rounded px-2 py-0.5"
                      >
                        {copiedIndex === 4 ? (
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
                  <p className="font-mono text-[10px] text-zinc-300 break-all select-all bg-zinc-900 p-2 rounded">
                    {createdShares[3].shareHex}
                  </p>
                </div>

                <div className="pt-2 border-t border-zinc-800/80">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                    <input
                      type="checkbox"
                      checked={confirmedShare4}
                      onChange={(e) => setConfirmedShare4(e.target.checked)}
                      className="rounded border-zinc-700 bg-zinc-900 text-white focus:ring-0"
                    />
                    <span>I have saved Share 4 on an offline hardware drive or secondary device.</span>
                  </label>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    disabled={!confirmedShare4}
                    onClick={() => setDistributionStep(5)}
                    className="flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-200 transition disabled:opacity-40"
                  >
                    <span>Continue to Share 5</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* DISTRIBUTION 5: Share 5 (Offsite Cloud / Safe) */}
            {distributionStep === 5 && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Share 5: Offsite Cloud / Safety Deposit Box
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Store this final share in a separate encrypted cloud account, cold email archive, or safety deposit box.
                  </p>
                </div>

                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-zinc-400 font-mono">Share 5 of 5</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => downloadIndividualShare(createdShares[4])}
                        className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 border border-zinc-800 rounded px-2 py-0.5"
                      >
                        <Download className="h-3 w-3" />
                        <span>Download Card</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyShare(createdShares[4].shareHex, 5)}
                        className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 border border-zinc-800 rounded px-2 py-0.5"
                      >
                        {copiedIndex === 5 ? (
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
                  <p className="font-mono text-[10px] text-zinc-300 break-all select-all bg-zinc-900 p-2 rounded">
                    {createdShares[4].shareHex}
                  </p>
                </div>

                <div className="pt-2 border-t border-zinc-800/80">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                    <input
                      type="checkbox"
                      checked={confirmedShare5}
                      onChange={(e) => setConfirmedShare5(e.target.checked)}
                      className="rounded border-zinc-700 bg-zinc-900 text-white focus:ring-0"
                    />
                    <span>I have stored Share 5 in a separate offsite storage location.</span>
                  </label>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    disabled={!confirmedShare5}
                    onClick={() => setDistributionStep(6)}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 transition disabled:opacity-40"
                  >
                    <span>Complete Distribution</span>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* DISTRIBUTION 6: Complete & Test Recovery */}
            {distributionStep === 6 && (
              <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/20 p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-6 w-6 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-base font-bold text-white">
                      All 5 shares separated & confirmed
                    </h3>
                    <p className="text-xs text-emerald-200/90 mt-1 leading-relaxed">
                      Your vault is protected by genuine 3-of-5 Shamir Secret Sharing. No single file, person, or device holds enough shares to open your vault.
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-xs text-zinc-400 space-y-2">
                  <p className="text-white font-medium">To recover your accounts if locked out:</p>
                  <ul className="list-disc list-inside space-y-1 text-zinc-400">
                    <li>Option 1: Enter your master passphrase (runs Argon2id locally).</li>
                    <li>Option 2: Gather any 3 of your 5 distributed shares (e.g. Rescue Kit Share 1 + Printed Card Share 2 + Contact Share 3).</li>
                  </ul>
                </div>

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
        )}
      </div>
    </div>
  );
}
