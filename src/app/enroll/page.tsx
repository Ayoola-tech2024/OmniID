'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import CameraFeed from '@/components/CameraFeed';
import PinPad from '@/components/PinPad';
import { createVault, VaultAccount, EncryptedVaultPayload } from '@/lib/crypto/fuzzyVault';
import { Shield, Check, Plus, Trash2, KeyRound, Download, ArrowRight, Sparkles } from 'lucide-react';

export default function EnrollPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [username, setUsername] = useState('damisileayoola@gmail.com');
  const [capturedVector, setCapturedVector] = useState<Uint8Array | null>(null);
  const [pin, setPin] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdVault, setCreatedVault] = useState<EncryptedVaultPayload | null>(null);

  // Default demo accounts (realistic sample TOTP secrets)
  const [accounts, setAccounts] = useState<VaultAccount[]>([
    {
      id: 'acc-1',
      service: 'Google',
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
      service: 'AWS Console',
      accountName: 'root-admin',
      secret: 'MZXW6YTBOI======',
    },
  ]);

  const handleVectorCaptured = (vector: Uint8Array) => {
    setCapturedVector(vector);
    setStep(2);
  };

  const handleAddAccount = () => {
    const newAcc: VaultAccount = {
      id: `acc-${Date.now()}`,
      service: 'Resend',
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
    if (!capturedVector || pin.length < 4) return;
    setIsProcessing(true);
    try {
      const vault = await createVault(capturedVector, pin, accounts);
      setCreatedVault(vault);

      // Save encrypted vault to localStorage under user's handle
      if (typeof window !== 'undefined') {
        localStorage.setItem(`omni_vault_${username.toLowerCase().trim()}`, JSON.stringify(vault));
        localStorage.setItem('omni_latest_user', username.toLowerCase().trim());
      }

      setStep(4);
    } catch (err) {
      console.error('Enrollment error:', err);
      alert('Failed to construct zero-knowledge vault: ' + String(err));
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadRescueCard = () => {
    if (!createdVault) return;
    const blob = new Blob([JSON.stringify(createdVault, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omni-id-rescue-${username.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
          <h1 className="text-3xl font-extrabold text-white">Enroll Your Biometric Lifeline</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Zero raw face data is stored. Your face vector is scrambled with BCH error-correction math.
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

        {/* STEP 1: Face Scan */}
        {step === 1 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-xl backdrop-blur-md">
            <div className="mb-4">
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

            <div className="mt-6">
              <p className="text-xs font-medium text-zinc-300 mb-3 text-center">
                Scan your face to generate biological key share ($K_1$)
              </p>
              <CameraFeed onCaptureVector={handleVectorCaptured} isProcessing={isProcessing} />
            </div>
          </div>
        )}

        {/* STEP 2: Twin-Shield PIN */}
        {step === 2 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-xl backdrop-blur-md text-center">
            <div className="max-w-sm mx-auto mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto mb-3">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Set Your 4-Digit Twin-Shield PIN</h3>
              <p className="text-xs text-zinc-400 mt-1">
                This mental factor prevents identical twins, siblings, or 3D masks from opening your vault.
              </p>
            </div>

            <PinPad pin={pin} onChange={setPin} label="Enter 4-Digit Private PIN" />

            <div className="mt-6 flex justify-between gap-3 max-w-sm mx-auto">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-xl border border-zinc-800 px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white"
              >
                Back
              </button>
              <button
                type="button"
                disabled={pin.length < 4}
                onClick={() => setStep(3)}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2 text-xs font-bold text-zinc-950 transition hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40"
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
                  These secrets will be encrypted using K = Face ⊕ PIN.
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
                <Sparkles className="h-4 w-4" />
                <span>{isProcessing ? 'Encrypting with WebCrypto...' : 'Lock Biometric Vault'}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Success & Portable Backup */}
        {step === 4 && (
          <div className="rounded-2xl border border-emerald-500/40 bg-zinc-900/60 p-8 shadow-2xl backdrop-blur-md text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto mb-4">
              <Check className="h-8 w-8 stroke-[3]" />
            </div>

            <h2 className="text-2xl font-extrabold text-white">Vault Encrypted & Anchored!</h2>
            <p className="text-xs text-zinc-400 mt-2 max-w-md mx-auto">
              Your biometric helper data and encrypted accounts are safely stored. 
              If your phone dies or gets stolen right now, you can recover access from any device.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={downloadRescueCard}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-5 py-2.5 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-700 hover:text-white"
              >
                <Download className="h-4 w-4" />
                <span>Download Rescue Card (.json)</span>
              </button>

              <Link
                href="/recover"
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2.5 text-xs font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-teal-400"
              >
                <span>Test Recovery Flow Now</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
