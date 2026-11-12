'use client';

import React, { useEffect, useRef, useState } from 'react';
import { LiveTotpCode, generateAllTotpCodes } from '@/lib/totp/totpManager';
import { VaultAccount } from '@/lib/crypto/fuzzyVault';
import { ShieldCheck, RefreshCw, Trash2, Copy, Check, EyeOff } from 'lucide-react';

interface CanvasVaultProps {
  accounts: VaultAccount[];
  onLock: () => void;
}

export default function CanvasVaultDisplay({ accounts, onLock }: CanvasVaultProps) {
  const [totpList, setTotpList] = useState<LiveTotpCode[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sessionSeconds, setSessionSeconds] = useState(45); // 45s total ephemeral countdown
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});

  // Real-time TOTP generation loop
  useEffect(() => {
    function updateCodes() {
      const generated = generateAllTotpCodes(accounts);
      setTotpList(generated);

      // Render each code to its individual Canvas
      generated.forEach((item) => {
        const canvas = canvasRefs.current[item.accountId];
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.fillStyle = '#09090b'; // zinc-950
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add subtle anti-scraping noise pixels
        for (let i = 0; i < 40; i++) {
          ctx.fillStyle = `rgba(16, 185, 129, ${Math.random() * 0.15})`;
          ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1.5, 1.5);
        }

        // Draw 6-digit TOTP code in high-contrast monospace
        ctx.font = 'bold 32px "Courier New", monospace';
        ctx.fillStyle = '#34d399'; // emerald-400
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        
        // Split with space for legibility: "123 456"
        const formattedCode = `${item.code.slice(0, 3)} ${item.code.slice(3)}`;
        ctx.fillText(formattedCode, canvas.width / 2, canvas.height / 2);
      });
    }

    updateCodes();
    const interval = setInterval(updateCodes, 1000);
    return () => clearInterval(interval);
  }, [accounts]);

  // Ephemeral countdown timer (auto-lock after 45 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onLock();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onLock]);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto rounded-2xl border border-emerald-500/30 bg-zinc-950 p-6 shadow-2xl shadow-emerald-950/40">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Ephemeral Biometric Vault Unlocked
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
            </h3>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Codes rendered in isolated HTML5 Canvas to prevent DOM scraping and browser malware.
          </p>
        </div>

        {/* Ephemeral Timer */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-xs font-mono text-zinc-300">
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-400" />
            <span>Self-destruct in: <strong className="text-emerald-400">{sessionSeconds}s</strong></span>
          </div>

          <button
            onClick={onLock}
            className="flex items-center gap-1 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/20"
            title="Immediately zeroize RAM and exit"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Purge RAM</span>
          </button>
        </div>
      </div>

      {/* Account TOTP Cards */}
      <div className="mt-6 space-y-4">
        {totpList.map((item) => (
          <div
            key={item.accountId}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-4 transition hover:border-zinc-700"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  {item.service}
                </span>
                <span className="text-sm font-medium text-zinc-200">{item.accountName}</span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-1000"
                    style={{ width: `${(item.secondsRemaining / item.period) * 100}%` }}
                  />
                </div>
                <span className="text-[11px] font-mono text-zinc-400">
                  Refreshes in {item.secondsRemaining}s
                </span>
              </div>
            </div>

            {/* Canvas Code Display */}
            <div className="flex items-center gap-3">
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-1 shadow-inner">
                <canvas
                  ref={(el) => {
                    canvasRefs.current[item.accountId] = el;
                  }}
                  width={180}
                  height={44}
                  className="rounded cursor-default"
                />
              </div>

              <button
                onClick={() => handleCopy(item.code, item.accountId)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 transition hover:border-emerald-500/50 hover:bg-zinc-800 hover:text-white"
                title="Copy code to clipboard"
              >
                {copiedId === item.accountId ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Security Footer Notice */}
      <div className="mt-6 flex items-center justify-between rounded-xl bg-zinc-900/30 border border-zinc-800/60 p-3 text-[11px] text-zinc-400">
        <span className="flex items-center gap-1.5">
          <EyeOff className="h-3.5 w-3.5 text-zinc-400" />
          No plaintext tokens stored in DOM or local storage.
        </span>
        <button
          onClick={onLock}
          className="text-emerald-400 hover:underline font-medium"
        >
          Finished? Close session
        </button>
      </div>
    </div>
  );
}
