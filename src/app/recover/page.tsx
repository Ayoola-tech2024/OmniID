'use client';

import React, { useState, useEffect } from 'react';
import CanvasVaultDisplay from '@/components/CanvasVaultDisplay';
import {
  unlockVaultWithPassphrase,
  unlockVaultWithShares,
  VaultAccount,
  EncryptedVaultPayload,
} from '@/lib/crypto/vaultCrypto';
import {
  Zap,
  AlertTriangle,
  ArrowRight,
  Upload,
  Sparkles,
  RefreshCw,
  KeyRound,
  Users,
} from 'lucide-react';

export default function RecoverPage() {
  const [username, setUsername] = useState('damisileayoola@gmail.com');
  const [stage, setStage] = useState<'identify' | 'auth' | 'unlocked'>('identify');
  const [recoveryMode, setRecoveryMode] = useState<'passphrase' | 'shamir'>('passphrase');
  const [vaultPayload, setVaultPayload] = useState<EncryptedVaultPayload | null>(null);
  const [passphrase, setPassphrase] = useState('');
  
  // 3 Shamir share inputs for break-glass recovery
  const [share1, setShare1] = useState('');
  const [share2, setShare2] = useState('');
  const [share3, setShare3] = useState('');

  const [unlockedAccounts, setUnlockedAccounts] = useState<VaultAccount[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Load latest vault from localStorage if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const latestUser = localStorage.getItem('omni_latest_user') || 'damisileayoola@gmail.com';
      setUsername(latestUser);
      const cached = localStorage.getItem(`omni_vault_${latestUser}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setVaultPayload(parsed);
          // If vault has pre-loaded shares, pre-populate for demo convenience if user wants
          if (parsed.shamirShares && parsed.shamirShares.length >= 3) {
            setShare1(parsed.shamirShares[0].shareHex);
            setShare2(parsed.shamirShares[1].shareHex);
            setShare3(parsed.shamirShares[2].shareHex);
          }
        } catch {
          // ignore parse error
        }
      }
    }
  }, []);

  const handleLookup = () => {
    setErrorMessage(null);
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`omni_vault_${username.toLowerCase().trim()}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setVaultPayload(parsed);
          if (parsed.shamirShares && parsed.shamirShares.length >= 3) {
            setShare1(parsed.shamirShares[0].shareHex);
            setShare2(parsed.shamirShares[1].shareHex);
            setShare3(parsed.shamirShares[2].shareHex);
          }
          setStage('auth');
          return;
        } catch {
          setErrorMessage('Corrupt local vault payload.');
          return;
        }
      }
    }

    setErrorMessage(
      'No local vault found for this handle. Please upload your Rescue Kit JSON or enroll first.'
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        const payload: EncryptedVaultPayload = parsed.encryptedVault || parsed;
        setVaultPayload(payload);
        if (parsed.shares && parsed.shares.length >= 3) {
          setShare1(parsed.shares[0].shareHex);
          setShare2(parsed.shares[1].shareHex);
          setShare3(parsed.shares[2].shareHex);
        }
        setStage('auth');
        setErrorMessage(null);
      } catch {
        setErrorMessage('Invalid Rescue Kit JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleUnlockWithPassphrase = async () => {
    if (!vaultPayload || !passphrase.trim()) return;
    setIsProcessing(true);
    setErrorMessage(null);
    setStatusMessage('Deriving key via Argon2id (64MB memory, 3 iterations)...');

    try {
      await new Promise((r) => setTimeout(r, 100)); // Yield to update UI
      const accounts = await unlockVaultWithPassphrase(passphrase, vaultPayload);
      setUnlockedAccounts(accounts);
      setStage('unlocked');
    } catch (err: unknown) {
      console.error('Passphrase unlock failed:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
      setStatusMessage(null);
    }
  };

  const handleUnlockWithShamir = async () => {
    if (!vaultPayload) return;
    const shares = [share1.trim(), share2.trim(), share3.trim()].filter(Boolean);
    if (shares.length < 3) {
      setErrorMessage('You must provide at least 3 valid Shamir shares.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setStatusMessage('Reconstructing 256-bit Master Key via Shamir polynomial interpolation...');

    try {
      await new Promise((r) => setTimeout(r, 100));
      const accounts = await unlockVaultWithShares(shares, vaultPayload);
      setUnlockedAccounts(accounts);
      setStage('unlocked');
    } catch (err: unknown) {
      console.error('Shamir unlock failed:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
      setStatusMessage(null);
    }
  };

  const handleLockVault = () => {
    setUnlockedAccounts(null);
    setPassphrase('');
    setStage('identify');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-12 px-4 sm:px-6">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400 mb-2">
            <Zap className="h-3.5 w-3.5 fill-current" />
            <span>Hardware-Free Recovery Engine</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Emergency Disaster Recovery</h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
            Use any borrowed computer or incognito tab to unlock your 2FA codes when your phone is dead.
          </p>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-200">Authentication Error</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* STAGE 1: Identify / Locate Vault */}
        {stage === 'identify' && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-xl backdrop-blur-md">
            <h3 className="text-base font-bold text-white mb-1">Step 1: Locate Emergency Vault</h3>
            <p className="text-xs text-zinc-400 mb-5">
              Enter your handle or upload your encrypted rescue kit JSON file.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Your Handle / Email
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="user@gmail.com"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleLookup}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-emerald-400 transition"
                  >
                    <span>Proceed</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-zinc-800" />
                <span className="flex-shrink mx-4 text-[11px] text-zinc-500 uppercase tracking-wider">
                  or upload rescue kit
                </span>
                <div className="flex-grow border-t border-zinc-800" />
              </div>

              <div>
                <label className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-950/60 p-4 cursor-pointer hover:border-zinc-700 transition">
                  <Upload className="h-6 w-6 text-zinc-400 mb-1" />
                  <span className="text-xs font-medium text-zinc-300">
                    Upload Rescue Kit (.json)
                  </span>
                  <span className="text-[10px] text-zinc-500 mt-0.5">
                    For air-gapped computers or fresh incognito sessions
                  </span>
                  <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* STAGE 2: Choose Recovery Mode */}
        {stage === 'auth' && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Step 2: Authenticate & Unlock</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Vault located for <strong className="text-emerald-400">{username}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStage('identify')}
                className="text-xs text-zinc-500 hover:text-zinc-300"
              >
                Change Handle
              </button>
            </div>

            {/* Mode Switch Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800 mb-6">
              <button
                type="button"
                onClick={() => setRecoveryMode('passphrase')}
                className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition ${
                  recoveryMode === 'passphrase'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <KeyRound className="h-3.5 w-3.5 text-emerald-400" />
                <span>Passphrase (Fast)</span>
              </button>

              <button
                type="button"
                onClick={() => setRecoveryMode('shamir')}
                className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition ${
                  recoveryMode === 'shamir'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Users className="h-3.5 w-3.5 text-teal-400" />
                <span>Shamir 3-of-5 (Break-Glass)</span>
              </button>
            </div>

            {/* MODE 1: Passphrase Recovery */}
            {recoveryMode === 'passphrase' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Enter Your Master Passphrase
                  </label>
                  <input
                    type="password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Enter your mental passphrase"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Computed via Argon2id (64MB memory, 3 iterations) directly in your browser.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={!passphrase.trim() || isProcessing}
                  onClick={handleUnlockWithPassphrase}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-xs font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>{statusMessage || 'Decrypting Vault...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Unlock with Passphrase</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* MODE 2: Shamir 3-of-5 Break-Glass Recovery */}
            {recoveryMode === 'shamir' && (
              <div className="space-y-3">
                <p className="text-xs text-zinc-400 mb-2">
                  Paste any **3 recovery shares** from your printed card, trusted contact, or offline backup:
                </p>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Share #1 (Hex)
                  </label>
                  <input
                    type="text"
                    value={share1}
                    onChange={(e) => setShare1(e.target.value)}
                    placeholder="e.g. 8f2a9c..."
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 font-mono text-xs text-emerald-300 placeholder-zinc-700"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Share #2 (Hex)
                  </label>
                  <input
                    type="text"
                    value={share2}
                    onChange={(e) => setShare2(e.target.value)}
                    placeholder="e.g. 4d7b1e..."
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 font-mono text-xs text-emerald-300 placeholder-zinc-700"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Share #3 (Hex)
                  </label>
                  <input
                    type="text"
                    value={share3}
                    onChange={(e) => setShare3(e.target.value)}
                    placeholder="e.g. 1a9f0c..."
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 font-mono text-xs text-emerald-300 placeholder-zinc-700"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    disabled={!share1 || !share2 || !share3 || isProcessing}
                    onClick={handleUnlockWithShamir}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 py-3 text-xs font-bold text-zinc-950 shadow-lg shadow-teal-500/20 transition hover:from-teal-400 hover:to-emerald-400 disabled:opacity-40"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>{statusMessage || 'Interpolating Polynomial...'}</span>
                      </>
                    ) : (
                      <>
                        <Users className="h-4 w-4" />
                        <span>Reconstruct Master Key (3-of-5)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STAGE 3: Unlocked Ephemeral Canvas Display */}
        {stage === 'unlocked' && unlockedAccounts && (
          <CanvasVaultDisplay accounts={unlockedAccounts} onLock={handleLockVault} />
        )}
      </div>
    </div>
  );
}
