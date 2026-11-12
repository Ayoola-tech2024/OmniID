'use client';

import React from 'react';
import { Lock, ShieldAlert, Users } from 'lucide-react';

interface PinPadProps {
  pin: string;
  onChange: (pin: string) => void;
  label?: string;
  isDuressMode?: boolean;
  onToggleDuress?: () => void;
}

export default function PinPad({
  pin,
  onChange,
  label = 'Enter 4-Digit Twin-Shield PIN',
  isDuressMode = false,
  onToggleDuress,
}: PinPadProps) {
  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      onChange(pin + digit);
    }
  };

  const handleBackspace = () => {
    onChange(pin.slice(0, -1));
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="w-full max-w-sm mx-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-xl">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-emerald-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">{label}</h4>
        </div>

        {onToggleDuress && (
          <button
            type="button"
            onClick={onToggleDuress}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium border transition ${
              isDuressMode
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Duress Mode displays a benign fake vault under coercion"
          >
            <ShieldAlert className="h-3 w-3" />
            <span>Duress: {isDuressMode ? 'ON' : 'OFF'}</span>
          </button>
        )}
      </div>

      {/* PIN Dots Display */}
      <div className="flex justify-center items-center gap-3 py-3">
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            className={`h-4 w-4 rounded-full border transition-all duration-200 ${
              pin.length > idx
                ? 'border-emerald-400 bg-emerald-400 shadow-md shadow-emerald-400/50 scale-110'
                : 'border-zinc-700 bg-zinc-900'
            }`}
          />
        ))}
      </div>

      {/* Numeric Keypad Grid */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigit(digit)}
            className="flex h-12 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800/80 text-lg font-semibold text-zinc-100 transition hover:bg-zinc-800 hover:border-emerald-500/40 active:scale-95"
          >
            {digit}
          </button>
        ))}
        <button
          type="button"
          onClick={handleClear}
          className="flex h-12 items-center justify-center rounded-xl bg-zinc-900/40 border border-zinc-800/50 text-xs font-medium text-zinc-400 transition hover:bg-zinc-800 active:scale-95"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => handleDigit('0')}
          className="flex h-12 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800/80 text-lg font-semibold text-zinc-100 transition hover:bg-zinc-800 hover:border-emerald-500/40 active:scale-95"
        >
          0
        </button>
        <button
          type="button"
          onClick={handleBackspace}
          className="flex h-12 items-center justify-center rounded-xl bg-zinc-900/40 border border-zinc-800/50 text-xs font-medium text-zinc-400 transition hover:bg-zinc-800 active:scale-95"
        >
          ⌫
        </button>
      </div>

      {/* Twin Shield Explainer Badge */}
      <div className="mt-4 flex items-start gap-2 rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-2.5 text-[11px] text-zinc-400">
        <Users className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
        <p>
          <strong className="text-emerald-400">Twin-Shield Protection:</strong> Even an identical twin with your exact facial features cannot decrypt this vault without this mental PIN.
        </p>
      </div>
    </div>
  );
}
