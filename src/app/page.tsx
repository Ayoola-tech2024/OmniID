'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { KeyRound, ArrowRight, Lock, Users, EyeOff } from 'lucide-react';

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
                Two-factor prompts assume your phone is in your pocket, charged, and connected. 
                When power cuts hit in Lagos or your battery drops to zero, Google asks you to tap a prompt on a dead screen. 
                OmniID stores your authenticator seeds so you can decrypt them on any borrowed laptop without trusting the machine.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/recover"
                  className="flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-xs font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-200"
                >
                  <span>Open Emergency Vault</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>

                <Link
                  href="/enroll"
                  className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-5 py-2.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
                >
                  <KeyRound className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Create Recovery Kit</span>
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-5 pt-3 text-xs text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-zinc-400" />
                  Argon2id encryption
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-zinc-400" />
                  Shamir 3-of-5 key split
                </span>
                <span className="flex items-center gap-1.5">
                  <EyeOff className="h-3.5 w-3.5 text-zinc-400" />
                  Ephemeral memory display
                </span>
              </div>
            </div>

            {/* Right Column: Real Lockout Screenshot */}
            <div className="lg:col-span-5">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 shadow-lg">
                <div className="flex items-center justify-between pb-2 px-1 text-xs text-zinc-400 border-b border-zinc-800/80 mb-2.5">
                  <span className="font-medium text-zinc-300">The Lockout Scenario</span>
                  <span className="text-[11px] text-zinc-500">Google Prompt Verification</span>
                </div>

                <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
                  <Image
                    src="/images/infinix-lockout.png"
                    alt="Google prompt asking to verify on Infinix HOT 50i"
                    width={800}
                    height={480}
                    className="w-full h-auto object-cover opacity-95"
                    priority
                  />
                  <div className="border-t border-zinc-800 bg-zinc-900/90 p-3 text-xs text-zinc-400">
                    <p className="text-zinc-200 font-medium">When you cannot tap your phone:</p>
                    <p className="mt-1 text-[11px] leading-relaxed">
                      Click <strong className="text-zinc-300">&quot;More ways to verify&quot;</strong> on Google or GitHub, 
                      choose Authenticator code, and use OmniID on your current screen to get the 6-digit code.
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
              Architecture
            </h2>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              Designed so a server breach reveals no keys
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 mt-2 leading-relaxed">
              We do not store plain secrets or unstable facial biometric keys. 
              The vault relies on two recovery mechanisms that you control.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 flex flex-col justify-between">
              <div>
                <div className="h-8 w-8 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300 mb-3">
                  <Lock className="h-4 w-4" />
                </div>
                <h4 className="text-sm font-semibold text-white">1. Argon2id Passphrase KDF</h4>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Your master key is wrapped with a passphrase using Argon2id with 64 MB of RAM and three iterations. 
                  Offline guessing attacks require dedicated memory per attempt, making mass cracking impractical.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-800/60 text-[11px] text-zinc-500 font-mono">
                Memory-hard key derivation
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 flex flex-col justify-between">
              <div>
                <div className="h-8 w-8 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300 mb-3">
                  <Users className="h-4 w-4" />
                </div>
                <h4 className="text-sm font-semibold text-white">2. Shamir 3-of-5 Recovery</h4>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Your vault key splits into five cryptographic shares. You store one locally, print one, give one to a trusted contact, 
                  and keep an offline copy. Any three shares reconstruct the key if you forget your passphrase.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-800/60 text-[11px] text-zinc-500 font-mono">
                No single point of failure
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 flex flex-col justify-between">
              <div>
                <div className="h-8 w-8 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300 mb-3">
                  <EyeOff className="h-4 w-4" />
                </div>
                <h4 className="text-sm font-semibold text-white">3. Isolated Canvas Display</h4>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Decrypted codes render directly to an HTML5 canvas element with sub-pixel jitter instead of text nodes in the DOM. 
                  Browser extensions cannot read them, and volatile memory clears after 45 seconds.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-800/60 text-[11px] text-zinc-500 font-mono">
                Zero DOM footprint
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
              Workflow
            </h2>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              How to recover on an untrusted device
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-zinc-400">
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 p-5">
              <span className="font-mono text-zinc-500 text-sm font-semibold">01</span>
              <h4 className="text-sm font-semibold text-white mt-2 mb-1.5">Open in incognito</h4>
              <p className="leading-relaxed">
                Borrow a laptop or use a public machine. Open OmniID in an incognito window and enter your handle or upload your rescue kit.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 p-5">
              <span className="font-mono text-zinc-500 text-sm font-semibold">02</span>
              <h4 className="text-sm font-semibold text-white mt-2 mb-1.5">Supply one secret</h4>
              <p className="leading-relaxed">
                Enter your mental passphrase to run Argon2id in WebAssembly, or paste three of your five Shamir shares if you forgot the phrase.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 p-5">
              <span className="font-mono text-zinc-500 text-sm font-semibold">03</span>
              <h4 className="text-sm font-semibold text-white mt-2 mb-1.5">Copy code and exit</h4>
              <p className="leading-relaxed">
                The 6-digit TOTP code appears on the canvas. Type it into Google, then close the tab to purge memory immediately.
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
