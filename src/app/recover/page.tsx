'use client';

import React, { useState, useEffect } from 'react';
import CameraFeed from '@/components/CameraFeed';
import PinPad from '@/components/PinPad';
import CanvasVaultDisplay from '@/components/CanvasVaultDisplay';
import { unlockVault, VaultAccount, EncryptedVaultPayload } from '@/lib/crypto/fuzzyVault';
import { Zap, AlertTriangle, ArrowRight, Upload, Sparkles, RefreshCw } from 'lucide-react';

export default function RecoverPage() {
  const [username, setUsername] = useState('damisileayoola@gmail.com');
  const [stage, setStage] = useState<'identify' | 'scan' | 'pin' | 'unlocked'>('identify');
  const [vaultPayload, setVaultPayload] = useState<EncryptedVaultPayload | null>(null);
  const [capturedVector, setCapturedVector] = useState<Uint8Array | null>(null);
  const [pin, setPin] = useState('');
  const [unlockedAccounts, setUnlockedAccounts] = useState<VaultAccount[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDuressMode, setIsDuressMode] = useState(false);

  // Load vault from localStorage if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const latestUser = localStorage.getItem('omni_latest_user') || 'damisileayoola@gmail.com';
      setUsername(latestUser);
      const cached = localStorage.getItem(`omni_vault_${latestUser}`);
      if (cached) {
        try {
          setVaultPayload(JSON.parse(cached));
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
          setStage('scan');
          return;
        } catch {
          setErrorMessage('Corrupt local vault payload.');
          return;
        }
      }
    }

    // If no vault found locally, we can construct or load an emergency mock vault
    setErrorMessage(
      'No local vault found for this handle. Please upload your Emergency Rescue JSON or enroll first.'
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        setVaultPayload(parsed);
        setStage('scan');
        setErrorMessage(null);
      } catch {
        setErrorMessage('Invalid Rescue Card JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleVectorCaptured = (vector: Uint8Array) => {
    setCapturedVector(vector);
    setStage('pin');
  };

  const handleUnlock = async () => {
    if (!capturedVector || !vaultPayload || pin.length < 4) return;
    setIsProcessing(true);
    setErrorMessage(null);

    // DURESS MODE CHECK: If duress mode is enabled, display Decoy Vault
    if (isDuressMode) {
      setTimeout(() => {
        setIsProcessing(false);
        setUnlockedAccounts([
          {
            id: 'decoy-1',
            service: 'Decoy Backup',
            accountName: 'guest@demo.com',
            secret: 'JBSWY3DPEHPK3PXP',
          },
          {
            id: 'decoy-2',
            service: 'Empty Vault',
            accountName: 'decoy-user',
            secret: 'KRUGS4ZANFZSA33V',
          },
        ]);
        setStage('unlocked');
      }, 800);
      return;
    }

    try {
      const accounts = await unlockVault(capturedVector, pin, vaultPayload, 48);
      setUnlockedAccounts(accounts);
      setStage('unlocked');
    } catch (err: unknown) {
      console.error('Unlock failed:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLockVault = () => {
    setUnlockedAccounts(null);
    setCapturedVector(null);
    setPin('');
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
          <h1 className="text-3xl font-extrabold text-white">Emergency TOTP Recovery</h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
            Use any borrowed browser or incognito tab to unlock your 2FA codes without your phone.
          </p>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-200">Authentication Failed</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* STAGE 1: Identify / Load Vault */}
        {stage === 'identify' && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-xl backdrop-blur-md">
            <h3 className="text-base font-bold text-white mb-1">Step 1: Locate Your Emergency Vault</h3>
            <p className="text-xs text-zinc-400 mb-5">
              Enter your handle or load your encrypted rescue JSON file.
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
                  or upload rescue card
                </span>
                <div className="flex-grow border-t border-zinc-800" />
              </div>

              <div>
                <label className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-950/60 p-4 cursor-pointer hover:border-zinc-700 transition">
                  <Upload className="h-6 w-6 text-zinc-400 mb-1" />
                  <span className="text-xs font-medium text-zinc-300">
                    Upload Rescue Card (.json)
                  </span>
                  <span className="text-[10px] text-zinc-500 mt-0.5">
                    For air-gapped or incognito devices
                  </span>
                  <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* STAGE 2: Face Scan with Chromatic Liveness */}
        {stage === 'scan' && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Step 2: Biometric Liveness Verification</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Screen will flash colors to check 3D skin reflectance (anti-deepfake).
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

            <CameraFeed onCaptureVector={handleVectorCaptured} isProcessing={isProcessing} />
          </div>
        )}

        {/* STAGE 3: Twin-Shield PIN */}
        {stage === 'pin' && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-xl backdrop-blur-md text-center">
            <h3 className="text-lg font-bold text-white mb-1">Step 3: Twin-Shield Authorization</h3>
            <p className="text-xs text-zinc-400 mb-6 max-w-sm mx-auto">
              Enter the 4-digit PIN you memorized during enrollment to combine with your face scan.
            </p>

            <PinPad
              pin={pin}
              onChange={setPin}
              isDuressMode={isDuressMode}
              onToggleDuress={() => setIsDuressMode(!isDuressMode)}
            />

            <div className="mt-6 flex justify-between gap-3 max-w-sm mx-auto">
              <button
                type="button"
                onClick={() => setStage('scan')}
                className="rounded-xl border border-zinc-800 px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white"
              >
                Retake Face Scan
              </button>

              <button
                type="button"
                disabled={pin.length < 4 || isProcessing}
                onClick={handleUnlock}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2.5 text-xs font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Decrypting Vault...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Unlock Emergency Vault</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STAGE 4: Unlocked Ephemeral Canvas Display */}
        {stage === 'unlocked' && unlockedAccounts && (
          <CanvasVaultDisplay accounts={unlockedAccounts} onLock={handleLockVault} />
        )}
      </div>
    </div>
  );
}
