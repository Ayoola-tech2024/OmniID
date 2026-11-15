'use client';

import React from 'react';
import Link from 'next/link';
import { KeyRound, ArrowRight, Lock, Users, EyeOff } from 'lucide-react';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Hero Section */}
      <section className="pt-12 pb-16 md:pt-16 md:pb-24 border-b border-zinc-800/80">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Direct Problem & Solution */}
            <div className="lg:col-span-7 flex flex-col items-start gap-5">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
                Account recovery for when your phone is dead, stolen, or out of power.
              </h1>

              <p className="text-base text-zinc-400 leading-relaxed max-w-xl">
                Two-factor login assumes your phone is always in your pocket, charged, and working. 
                When your battery dies, your phone gets stolen, or the power goes out, Google still asks you to tap a prompt on a dead screen. 
                OmniID keeps an encrypted backup of your 6-digit login codes so you can get back into your accounts from any borrowed laptop or phone—safely.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/recover"
                  className="flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-xs font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-200"
                >
                  <span>Recover My Accounts</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>

                <Link
                  href="/enroll"
                  className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-5 py-2.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
                >
                  <KeyRound className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Set Up My Backup</span>
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-5 pt-3 text-xs text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-zinc-400" />
                  Locked with your own secret phrase
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-zinc-400" />
                  5-part backup key (need any 3)
                </span>
                <span className="flex items-center gap-1.5">
                  <EyeOff className="h-3.5 w-3.5 text-zinc-400" />
                  Auto-clears after 60 seconds
                </span>
              </div>
            </div>

            {/* Right Column: Real Lockout Screenshot */}
            <div className="lg:col-span-5">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 shadow-lg">
                <div className="flex items-center justify-between pb-2 px-1 text-xs text-zinc-400 border-b border-zinc-800/80 mb-2.5">
                  <span className="font-medium text-zinc-300">The Lockout Problem</span>
                  <span className="text-[11px] text-zinc-500">Google Prompt Verification</span>
                </div>

                <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${basePath}/images/infinix-lockout.png`}
                    alt="Google prompt asking to verify on Infinix HOT 50i"
                    width={1024}
                    height={639}
                    className="w-full h-auto object-cover opacity-95"
                    loading="eager"
                  />
                  <div className="border-t border-zinc-800 bg-zinc-900/90 p-3 text-xs text-zinc-400">
                    <p className="text-zinc-200 font-medium">When you cannot tap your phone:</p>
                    <p className="mt-1 text-[11px] leading-relaxed">
                      Click <strong className="text-zinc-300">&quot;More ways to verify&quot;</strong> on Google or GitHub, 
                      choose Authenticator code, and open OmniID on whatever screen you are using to get your 6-digit code.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How the Security Model Works */}
      <section className="py-16 border-b border-zinc-800/80">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              How It Keeps You Safe
            </h2>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              Even if our database leaks, nobody can read your codes
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 mt-2 leading-relaxed">
              Your secrets are scrambled inside your browser before they ever leave your device. 
              We never see your password, and no single person or file can unlock your backup.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 flex flex-col justify-between">
              <div>
                <div className="h-8 w-8 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300 mb-3">
                  <Lock className="h-4 w-4" />
                </div>
                <h4 className="text-sm font-semibold text-white">1. A Secret Phrase Only You Know</h4>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  You pick (or generate) a strong 6-word passphrase. Your device turns it into a heavy-duty lock that takes hackers centuries to guess—even with fast computers.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-800/60 text-[11px] text-zinc-500 font-mono">
                Argon2id + AES-256-GCM
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 flex flex-col justify-between">
              <div>
                <div className="h-8 w-8 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300 mb-3">
                  <Users className="h-4 w-4" />
                </div>
                <h4 className="text-sm font-semibold text-white">2. Backup Key Split into 5 Pieces</h4>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  What if you forget your passphrase? Your master key is split into 5 separate pieces (one in your Rescue Kit, one printed, one with a trusted friend, etc.). Any 3 pieces unlock your vault.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-800/60 text-[11px] text-zinc-500 font-mono">
                3-of-5 Shamir Secret Sharing
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 flex flex-col justify-between">
              <div>
                <div className="h-8 w-8 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300 mb-3">
                  <EyeOff className="h-4 w-4" />
                </div>
                <h4 className="text-sm font-semibold text-white">3. Safe to Use on a Borrowed Laptop</h4>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Your 6-digit codes are drawn as a temporary image instead of selectable webpage text so browser extensions cannot scrape them—and everything wipes automatically after 60 seconds.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-800/60 text-[11px] text-zinc-500 font-mono">
                Auto-wiping canvas display
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recovery Steps */}
      <section className="py-16 border-b border-zinc-800/80">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl mb-10">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              3 Simple Steps
            </h2>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              How to get back in when your phone is gone
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-zinc-400">
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 p-5">
              <span className="font-mono text-zinc-500 text-sm font-semibold">01</span>
              <h4 className="text-sm font-semibold text-white mt-2 mb-1.5">Find your locked vault</h4>
              <p className="leading-relaxed">
                Open OmniID on any phone or borrowed laptop. Type your email/handle to pull your encrypted backup from the cloud, or upload your Rescue Kit file.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 p-5">
              <span className="font-mono text-zinc-500 text-sm font-semibold">02</span>
              <h4 className="text-sm font-semibold text-white mt-2 mb-1.5">Unlock it</h4>
              <p className="leading-relaxed">
                Type your secret 6-word passphrase—or, if you forgot it, combine any 3 of your 5 backup key pieces (for example, your Rescue Kit + printed paper + trusted contact).
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 p-5">
              <span className="font-mono text-zinc-500 text-sm font-semibold">03</span>
              <h4 className="text-sm font-semibold text-white mt-2 mb-1.5">Type your 6-digit code</h4>
              <p className="leading-relaxed">
                Your live 6-digit login code appears on screen. Enter it into Google or GitHub, then click Lock (or close the tab) and nothing is left behind.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-zinc-500">
        <div className="container mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>OmniID. Hardware-free emergency account recovery.</p>
          <div className="flex items-center gap-4 text-zinc-400">
            <Link href="/enroll" className="hover:text-white">Enroll</Link>
            <Link href="/recover" className="hover:text-white">Recover</Link>
            <a href="https://github.com/Ayoola-tech2024/OmniID" target="_blank" rel="noreferrer" className="hover:text-white">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
