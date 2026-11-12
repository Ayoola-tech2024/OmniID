'use client';

import React, { useEffect, useRef, useState } from 'react';
import { LiveTotpCode, generateAllTotpCodes } from '@/lib/totp/totpManager';
import { VaultAccount } from '@/lib/crypto/vaultCrypto';
import { ShieldCheck, Copy, Check, Lock, X } from 'lucide-react';

interface CanvasVaultProps {
  accounts: VaultAccount[];
  onLock: () => void;
}

export default function CanvasVaultDisplay({ accounts, onLock }: CanvasVaultProps) {
  const [totpList, setTotpList] = useState<LiveTotpCode[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sessionSeconds, setSessionSeconds] = useState(45);
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
        ctx.fillStyle = '#090a0f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add subtle sub-pixel jitter
        for (let i = 0; i < 25; i++) {
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.08})`;
          ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
        }

        // Draw 6-digit TOTP code in clean monospace
        ctx.font = '600 28px "JetBrains Mono", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';

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
    <div className="w-full max-w-xl mx-auto rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-zinc-300" />
            <h3 className="text-sm font-semibold text-white">Emergency Authenticator Vault</h3>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Codes render to an isolated canvas. Memory clears when closed.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs font-mono text-zinc-400">
            Locks in <strong className="text-zinc-200">{sessionSeconds}s</strong>
          </div>

          <button
            onClick={onLock}
            className="flex items-center gap-1 rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
            title="Wipe memory immediately"
          >
            <X className="h-3.5 w-3.5" />
            <span>Lock</span>
          </button>
        </div>
      </div>

      {/* Account TOTP Cards */}
      <div className="mt-5 space-y-3">
        {totpList.map((item) => (
          <div
            key={item.accountId}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3.5"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-white">{item.service}</span>
                <span className="text-xs text-zinc-500">({item.accountName})</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-20 h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-400 transition-all duration-1000"
                    style={{ width: `${(item.secondsRemaining / item.period) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-zinc-500">
                  {item.secondsRemaining}s
                </span>
              </div>
            </div>

            {/* Canvas Code Display */}
            <div className="flex items-center gap-2">
              <div className="rounded border border-zinc-800 bg-zinc-950 p-1">
                <canvas
                  ref={(el) => {
                    canvasRefs.current[item.accountId] = el;
                  }}
                  width={150}
                  height={38}
                  className="rounded cursor-default"
                />
              </div>

              <button
                onClick={() => handleCopy(item.code, item.accountId)}
                className="flex h-9 w-9 items-center justify-center rounded border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
                title="Copy code"
              >
                {copiedId === item.accountId ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
        <span className="flex items-center gap-1.5">
          <Lock className="h-3 w-3 text-zinc-400" />
          No text stored in DOM
        </span>
        <button onClick={onLock} className="text-zinc-400 hover:text-white underline">
          Done with verification
        </button>
      </div>
    </div>
  );
}
