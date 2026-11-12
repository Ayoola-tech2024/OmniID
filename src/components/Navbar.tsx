'use client';

import React from 'react';
import Link from 'next/link';
import { KeyRound, Shield } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
      <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 transition hover:opacity-90">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700/80 text-zinc-100 shadow-sm">
            <Shield className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight text-white">OmniID</span>
            <span className="text-xs text-zinc-500 font-normal">/ emergency vault</span>
          </div>
        </Link>

        {/* Navigation Actions */}
        <nav className="flex items-center gap-3">
          <Link
            href="/enroll"
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
          >
            <KeyRound className="h-3.5 w-3.5 text-zinc-400" />
            <span>Create Recovery Kit</span>
          </Link>

          <Link
            href="/recover"
            className="flex items-center gap-1.5 rounded-lg bg-zinc-100 text-zinc-900 px-3 py-1.5 text-xs font-semibold shadow-sm transition hover:bg-white"
          >
            <span>Open Vault</span>
          </Link>

          <a
            href="https://github.com/Ayoola-tech2024/OmniID"
            target="_blank"
            rel="noreferrer"
            className="flex items-center rounded-lg border border-zinc-800 p-1.5 text-zinc-400 transition hover:border-zinc-700 hover:text-white"
            title="GitHub Repository"
          >
            <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>
        </nav>
      </div>
    </header>
  );
}
