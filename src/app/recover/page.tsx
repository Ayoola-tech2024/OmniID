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
  AlertTriangle,
  Upload,
  KeyRound,
  Users,
} from 'lucide-react';

export default function RecoverPage() {
  const [username, setUsername] = useState('');
  const [stage, setStage] = useState<'identify' | 'auth' | 'unlocked'>('identify');
  const [recoveryMode, setRecoveryMode] = useState<'passphrase' | 'shamir'>('passphrase');
  const [vaultPayload, setVaultPayload] = useState<EncryptedVaultPayload | null>(null);
  const [passphrase, setPassphrase] = useState('');

  const [share1, setShare1] = useState('');
  const [share2, setShare2] = useState('');
  const [share3, setShare3] = useState('');

  const [unlockedAccounts, setUnlockedAccounts] = useState<VaultAccount[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const latestUser = localStorage.getItem('omni_latest_user') || '';
      setUsername(latestUser);
      const cached = localStorage.getItem(`omni_vault_${latestUser}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setVaultPayload(parsed);
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
      'No local vault found for this identifier. Upload your Rescue Kit JSON file below.'
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
    setStatusMessage('Computing Argon2id (64MB memory, 3 iterations)...');

    try {
      await new Promise((r) => setTimeout(r, 80));
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
      setErrorMessage('Provide at least 3 valid Shamir shares.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setStatusMessage('Reconstructing master key from 3 shares...');

    try {
      await new Promise((r) => setTimeout(r, 80));
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-10 px-4 sm:px-6">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="mb-8 border-b border-zinc-800 pb-5">
          <h1 className="text-xl font-bold text-white">Open emergency vault</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Decrypt your two-factor codes using your passphrase or three Shamir shares.
          </p>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-6 rounded-lg border border-red-900/60 bg-red-950/30 p-3 text-xs text-red-300 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-200">Could not open vault</p>
              <p className="mt-0.5 text-red-300/90">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* STAGE 1: Identify / Locate Vault */}
        {stage === 'identify' && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
            <h3 className="text-sm font-semibold text-white mb-1">Locate your vault</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Enter your handle or upload your encrypted rescue kit file.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Identifier
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:border-zinc-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleLookup}
                    className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-200 transition shrink-0"
                  >
                    Find vault
                  </button>
                </div>
              </div>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-zinc-800" />
                <span className="flex-shrink mx-3 text-[11px] text-zinc-500 font-mono">
                  OR
                </span>
                <div className="flex-grow border-t border-zinc-800" />
              </div>

              <div>
                <label className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-800 bg-zinc-900/40 p-4 cursor-pointer hover:border-zinc-700 transition">
                  <Upload className="h-5 w-5 text-zinc-400 mb-1" />
                  <span className="text-xs font-medium text-zinc-300">
                    Upload Rescue Kit JSON
                  </span>
                  <span className="text-[10px] text-zinc-500 mt-0.5">
                    For incognito tabs or borrowed laptops
                  </span>
                  <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* STAGE 2: Choose Recovery Mode */}
        {stage === 'auth' && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
            <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white">Unlock vault</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Vault found for <span className="text-zinc-200 font-medium">{username}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStage('identify')}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Change handle
              </button>
            </div>

            {/* Mode Switch Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-950 rounded-lg border border-zinc-800 mb-5">
              <button
                type="button"
                onClick={() => setRecoveryMode('passphrase')}
                className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded transition ${
                  recoveryMode === 'passphrase'
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>Passphrase</span>
              </button>

              <button
                type="button"
                onClick={() => setRecoveryMode('shamir')}
                className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded transition ${
                  recoveryMode === 'shamir'
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                <span>3 of 5 Shares</span>
              </button>
            </div>

            {/* MODE 1: Passphrase Recovery */}
            {recoveryMode === 'passphrase' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">
                    Passphrase
                  </label>
                  <input
                    type="password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Enter your passphrase"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:border-zinc-400 focus:outline-none font-mono"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Evaluated locally via Argon2id (64MB memory).
                  </p>
                </div>

                <button
                  type="button"
                  disabled={!passphrase.trim() || isProcessing}
                  onClick={handleUnlockWithPassphrase}
                  className="w-full rounded-lg bg-white py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-200 transition disabled:opacity-40"
                >
                  {isProcessing ? (statusMessage || 'Decrypting...') : 'Unlock vault'}
                </button>
              </div>
            )}

            {/* MODE 2: Shamir 3-of-5 Break-Glass Recovery */}
            {recoveryMode === 'shamir' && (
              <div className="space-y-3">
                <p className="text-xs text-zinc-400 mb-2">
                  Paste three recovery shares from your card, contact, or backup:
                </p>

                <div>
                  <input
                    type="text"
                    value={share1}
                    onChange={(e) => setShare1(e.target.value)}
                    placeholder="Share 1 (hex)"
                    className="w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-1.5 font-mono text-xs text-zinc-300 placeholder-zinc-600"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    value={share2}
                    onChange={(e) => setShare2(e.target.value)}
                    placeholder="Share 2 (hex)"
                    className="w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-1.5 font-mono text-xs text-zinc-300 placeholder-zinc-600"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    value={share3}
                    onChange={(e) => setShare3(e.target.value)}
                    placeholder="Share 3 (hex)"
                    className="w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-1.5 font-mono text-xs text-zinc-300 placeholder-zinc-600"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    disabled={!share1 || !share2 || !share3 || isProcessing}
                    onClick={handleUnlockWithShamir}
                    className="w-full rounded-lg bg-white py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-200 transition disabled:opacity-40"
                  >
                    {isProcessing ? (statusMessage || 'Reconstructing...') : 'Reconstruct and unlock'}
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
