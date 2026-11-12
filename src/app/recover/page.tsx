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
  CheckCircle2,
} from 'lucide-react';

export default function RecoverPage() {
  const [username, setUsername] = useState('');
  const [stage, setStage] = useState<'identify' | 'auth' | 'unlocked'>('identify');
  const [recoveryMode, setRecoveryMode] = useState<'passphrase' | 'shamir'>('passphrase');
  const [vaultPayload, setVaultPayload] = useState<EncryptedVaultPayload | null>(null);
  const [passphrase, setPassphrase] = useState('');

  // 3 distinct Shamir share slots
  const [share1, setShare1] = useState('');
  const [share2, setShare2] = useState('');
  const [share3, setShare3] = useState('');

  const [share1Source, setShare1Source] = useState<string | null>(null);
  const [unlockedAccounts, setUnlockedAccounts] = useState<VaultAccount[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const latestUser = localStorage.getItem('omni_latest_user') || '';
      setUsername(latestUser);
      if (latestUser) {
        const cached = localStorage.getItem(`omni_vault_${latestUser}`);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            const payload: EncryptedVaultPayload = parsed.vault || parsed.encryptedVault || parsed;
            setVaultPayload(payload);
            if (parsed.localShare) {
              setShare1(parsed.localShare.shareHex);
              setShare1Source('Local Primary Share (Device)');
            } else if (parsed.primaryRescueShare) {
              setShare1(parsed.primaryRescueShare.shareHex);
              setShare1Source('Rescue Kit Share 1');
            }
          } catch {
            // ignore
          }
        }
      }
    }
  }, []);

  const handleLookup = () => {
    setErrorMessage(null);
    setInfoMessage(null);
    if (!username.trim()) {
      setErrorMessage('Please enter your email or username handle.');
      return;
    }

    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`omni_vault_${username.toLowerCase().trim()}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const payload: EncryptedVaultPayload = parsed.vault || parsed.encryptedVault || parsed;
          setVaultPayload(payload);

          // Populate at most Share 1
          if (parsed.localShare) {
            setShare1(parsed.localShare.shareHex);
            setShare1Source('Local Primary Share (Device)');
          } else if (parsed.primaryRescueShare) {
            setShare1(parsed.primaryRescueShare.shareHex);
            setShare1Source('Rescue Kit Share 1');
          } else {
            setShare1('');
            setShare1Source(null);
          }

          // Slots 2 and 3 remain empty for independent verification
          setShare2('');
          setShare3('');

          setStage('auth');
          return;
        } catch {
          setErrorMessage('Corrupt local vault payload.');
          return;
        }
      }
    }

    setErrorMessage(
      'No local vault found for this identifier. If you are on an untrusted device, upload your Rescue Kit JSON file below.'
    );
  };

  const [isPastingJson, setIsPastingJson] = useState(false);
  const [pastedJson, setPastedJson] = useState('');

  const parseAndLoadPayload = (jsonText: string) => {
    try {
      const parsed = JSON.parse(jsonText.trim());
      const payload: EncryptedVaultPayload = parsed.encryptedVault || parsed;

      if (!payload.vaultCiphertext || !payload.wrappedMasterKey) {
        throw new Error('Missing encrypted vault data.');
      }

      setVaultPayload(payload);

      // Populate ONLY Share 1
      if (parsed.primaryRescueShare) {
        setShare1(parsed.primaryRescueShare.shareHex);
        setShare1Source('Rescue Kit (Share 1 of 5)');
      } else if (parsed.shares && parsed.shares.length > 0) {
        setShare1(parsed.shares[0].shareHex || parsed.shares[0]);
        setShare1Source('Rescue Kit (Share 1)');
      } else {
        setShare1('');
        setShare1Source(null);
      }

      setShare2('');
      setShare3('');

      if (parsed.identifier) {
        setUsername(parsed.identifier);
      }

      setStage('auth');
      setErrorMessage(null);
      setInfoMessage(
        'Rescue Kit loaded successfully. Share 1 of 5 is populated. To unlock without your passphrase, provide 2 additional separate Shamir shares from your printed card or trusted contact.'
      );
    } catch (err) {
      setErrorMessage('Invalid Rescue Kit JSON: ' + String(err));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      parseAndLoadPayload(evt.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handlePastedJsonSubmit = () => {
    if (!pastedJson.trim()) {
      setErrorMessage('Please paste your Rescue Kit JSON text.');
      return;
    }
    parseAndLoadPayload(pastedJson);
  };

  const handleUnlockWithPassphrase = async () => {
    if (!vaultPayload || !passphrase.trim()) return;
    setIsProcessing(true);
    setErrorMessage(null);
    setStatusMessage('Computing Argon2id (64MB RAM, 3 iterations)...');

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
    const inputShares = [share1.trim(), share2.trim(), share3.trim()].filter(Boolean);

    if (inputShares.length < 3) {
      setErrorMessage('Threshold not reached: At least 3 distinct Shamir recovery shares are required.');
      return;
    }

    // Check for duplicates
    const unique = new Set(inputShares.map((s) => s.toLowerCase()));
    if (unique.size < 3) {
      setErrorMessage('Duplicate shares detected. You must provide 3 distinct shares from different locations.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setStatusMessage('Reconstructing 256-bit Master Key from 3 shares...');

    try {
      await new Promise((r) => setTimeout(r, 80));
      const accounts = await unlockVaultWithShares(inputShares, vaultPayload);
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
            Decrypt your two-factor codes using your passphrase or any three Shamir recovery shares.
          </p>
        </div>

        {/* Info Notification */}
        {infoMessage && (
          <div className="mb-6 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3.5 text-xs text-zinc-300 flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-white">Rescue Kit Verified</p>
              <p className="mt-0.5 text-zinc-400 leading-relaxed">{infoMessage}</p>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-6 rounded-lg border border-red-900/60 bg-red-950/30 p-3 text-xs text-red-300 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-200">Action Required</p>
              <p className="mt-0.5 text-red-300/90">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* STAGE 1: Identify / Locate Vault */}
        {stage === 'identify' && (
          <div className="space-y-5">
            {/* Option A: Local Cache Lookup */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5">
              <h3 className="text-sm font-semibold text-white mb-1">
                Option A: Local Device Cache
              </h3>
              <p className="text-xs text-zinc-400 mb-3">
                If you are on the computer where you originally enrolled, enter your identifier to find your locally cached vault.
              </p>

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
            </div>

            {/* Option B: Borrowed Laptop / Untrusted Machine */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-white">
                  Option B: Borrowed Machine / Incognito
                </h3>
                <button
                  type="button"
                  onClick={() => setIsPastingJson(!isPastingJson)}
                  className="text-xs text-zinc-400 hover:text-white underline"
                >
                  {isPastingJson ? 'Upload file instead' : 'Or paste JSON text'}
                </button>
              </div>
              <p className="text-xs text-zinc-400 mb-4">
                Because OmniID is serverless, borrowed machines require your Rescue Kit (which contains your encrypted vault + Share 1).
              </p>

              {!isPastingJson ? (
                <div>
                  <label className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-800 bg-zinc-900/40 p-4 cursor-pointer hover:border-zinc-700 transition">
                    <Upload className="h-5 w-5 text-zinc-400 mb-1" />
                    <span className="text-xs font-medium text-zinc-300">
                      Upload Rescue Kit JSON File
                    </span>
                    <span className="text-[10px] text-zinc-500 mt-0.5">
                      omni-id-rescue-kit.json (contains ciphertext + Share 1)
                    </span>
                    <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    rows={4}
                    value={pastedJson}
                    onChange={(e) => setPastedJson(e.target.value)}
                    placeholder='Paste the contents of your omni-id-rescue-kit.json here...'
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-xs font-mono text-zinc-300 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handlePastedJsonSubmit}
                    className="rounded-lg bg-white px-4 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-zinc-200 transition"
                  >
                    Load Pasted JSON
                  </button>
                </div>
              )}
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
                  Vault loaded for <span className="text-zinc-200 font-medium">{username || 'User'}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStage('identify')}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Change vault
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
                    placeholder="Enter your master passphrase"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:border-zinc-400 focus:outline-none font-mono"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Computed client-side via Argon2id (64MB memory, 3 iterations).
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
              <div className="space-y-4">
                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-400">
                  <p className="text-zinc-200 font-medium">3-of-5 Threshold Recovery</p>
                  <p className="mt-1 text-[11px] leading-relaxed">
                    Provide 3 distinct shares from different locations to reconstruct the 256-bit Master Key. The Rescue Kit file alone provides at most Share 1.
                  </p>
                </div>

                {/* Share 1 Slot */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-zinc-400 font-medium">
                      Share 1 (Rescue Kit / Primary Share)
                    </label>
                    {share1Source && (
                      <span className="text-[10px] text-emerald-400 font-mono">
                        ✓ {share1Source}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={share1}
                    onChange={(e) => {
                      setShare1(e.target.value);
                      setShare1Source(null);
                    }}
                    placeholder="Paste Share 1 hex"
                    className="w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-1.5 font-mono text-xs text-zinc-300 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
                  />
                </div>

                {/* Share 2 Slot */}
                <div>
                  <label className="block text-xs text-zinc-400 font-medium mb-1">
                    Share 2 (e.g. Printed Emergency Paper Card)
                  </label>
                  <input
                    type="text"
                    value={share2}
                    onChange={(e) => setShare2(e.target.value)}
                    placeholder="Paste Share 2 hex from physical card"
                    className="w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-1.5 font-mono text-xs text-zinc-300 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
                  />
                </div>

                {/* Share 3 Slot */}
                <div>
                  <label className="block text-xs text-zinc-400 font-medium mb-1">
                    Share 3 (e.g. Trusted Contact, USB, or Secondary Backup)
                  </label>
                  <input
                    type="text"
                    value={share3}
                    onChange={(e) => setShare3(e.target.value)}
                    placeholder="Paste Share 3 hex from contact or offline copy"
                    className="w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-1.5 font-mono text-xs text-zinc-300 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    disabled={!share1.trim() || !share2.trim() || !share3.trim() || isProcessing}
                    onClick={handleUnlockWithShamir}
                    className="w-full rounded-lg bg-white py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-200 transition disabled:opacity-40"
                  >
                    {isProcessing ? (statusMessage || 'Reconstructing key...') : 'Reconstruct 256-bit Key and Unlock'}
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
