'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { OmniLogo } from './OmniLogo';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-zinc-950 transition group-hover:scale-95">
            <OmniLogo className="h-5 w-5" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold tracking-tight text-white">OmniID</span>
            <span className="hidden sm:inline-block text-[11px] font-mono uppercase tracking-widest text-zinc-500">
              Break-Glass Vault
            </span>
          </div>
        </Link>

        {/* Center Nav Links (Desktop) */}
        <div className="hidden md:flex items-center gap-7 text-xs font-medium text-zinc-400">
          <a href="#security" className="transition hover:text-white">
            Security
          </a>
          <a href="#compare" className="transition hover:text-white">
            Comparison
          </a>
          <a href="#how-it-works" className="transition hover:text-white">
            How It Works
          </a>
          <a href="#waitlist" className="transition hover:text-white">
            Waitlist
          </a>
        </div>

        {/* Navigation Actions */}
        <nav className="flex items-center gap-2.5">
          <Link
            href="/enroll"
            className="hidden sm:inline-flex items-center rounded-md border border-zinc-800 bg-zinc-950 px-3.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900 hover:text-white"
          >
            Create Backup
          </Link>

          <Link
            href="/recover"
            className="inline-flex items-center gap-1 rounded-md bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200"
          >
            <span>Open Vault</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
