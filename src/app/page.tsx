'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Shield,
  Zap,
  Users,
  Lock,
  CheckCircle2,
  AlertOctagon,
  EyeOff,
  KeyRound,
  FileText,
  Sparkles,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-emerald-500 selection:text-zinc-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32 border-b border-zinc-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(255,255,255,0))]" />

        <div className="container mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Value Prop */}
            <div className="lg:col-span-7 flex flex-col items-start gap-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Hardware-Independent Emergency Recovery Protocol</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
                Your phone is dead. <br />
                Google wants a tap. <br />
                <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                  OmniID gets you in anyway.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-2xl">
                When power outages hit in Lagos, batteries drop to 0%, or your phone is lost in transit, 
                you lose access to AWS, GitHub, Google, and client deployments. 
                OmniID provides a zero-hardware disaster recovery lifeline powered by **Argon2id** and **3-of-5 Shamir Secret Sharing**.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <Link
                  href="/recover"
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3.5 text-sm font-bold text-zinc-950 shadow-xl shadow-emerald-500/25 transition hover:from-emerald-400 hover:to-teal-400"
                >
                  <Zap className="h-4 w-4 fill-current" />
                  <span>Test Emergency Recovery</span>
                </Link>

                <Link
                  href="/enroll"
                  className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-6 py-3.5 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-800 hover:text-white"
                >
                  <Shield className="h-4 w-4 text-emerald-400" />
                  <span>Set Up Recovery Lifeline</span>
                </Link>
              </div>

              {/* Security Pill Badges */}
              <div className="flex flex-wrap items-center gap-6 pt-4 text-xs text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Argon2id (64MB / 3 iterations)
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-emerald-400" />
                  Shamir 3-of-5 Secret Sharing
                </span>
                <span className="flex items-center gap-1.5">
                  <EyeOff className="h-4 w-4 text-emerald-400" />
                  Anti-DOM Scraping Canvas
                </span>
              </div>
            </div>

            {/* Right Column: The Real Infinix Lockout Visual */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between pb-2 px-2 text-xs font-mono text-zinc-400 border-b border-zinc-800/80 mb-3">
                  <span className="flex items-center gap-1.5 text-red-400 font-semibold">
                    <AlertOctagon className="h-3.5 w-3.5" />
                    THE &quot;DEAD PHONE&quot; PARADOX
                  </span>
                  <span>Lagos, Nigeria</span>
                </div>

                <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
                  <Image
                    src="/images/infinix-lockout.png"
                    alt="Google prompt asking to verify on Infinix HOT 50i"
                    width={800}
                    height={480}
                    className="w-full h-auto object-cover opacity-90 transition hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />
                  <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-zinc-900/90 border border-zinc-700/60 p-2.5 text-xs text-zinc-300 backdrop-blur-md">
                    <p className="font-semibold text-white">Your Infinix phone is dead at 0% battery.</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      How do you push a hotfix to GitHub or deploy to AWS right now?
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Honest Architecture & Threat Defense Section */}
      <section className="py-20 border-b border-zinc-900 bg-zinc-950/50">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
              Cryptographic Threat Mitigation
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Why Real Cryptography Beats Gimmicks
            </h3>
            <p className="text-sm sm:text-base text-zinc-400 mt-3">
              Unstable face embeddings drift with lighting and aging, and 4-digit PINs fail offline in seconds. 
              OmniID uses provably secure, audited primitives:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4">
                  <Lock className="h-6 w-6" />
                </div>
                <h4 className="text-lg font-bold text-white">Argon2id Memory Hardening</h4>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Your Master Key is wrapped using a high-entropy passphrase passed through Argon2id 
                  (64MB memory cost, 3 iterations). Offline GPU password cracking is computationally intractable.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-800/80 text-[11px] font-mono text-emerald-400">
                Password Hashing Standard Winner
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 mb-4">
                  <Users className="h-6 w-6" />
                </div>
                <h4 className="text-lg font-bold text-white">3-of-5 Shamir Secret Sharing</h4>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  The Master Key is split across 5 independent shares: your device, printed emergency card, trusted contact, 
                  and offline backup. Any 3 shares reconstruct the vault without needing a central server.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-800/80 text-[11px] font-mono text-teal-400">
                No Single Point of Failure
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/10 p-6 flex flex-col justify-between shadow-lg shadow-emerald-950/20">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 mb-4">
                  <EyeOff className="h-6 w-6" />
                </div>
                <h4 className="text-lg font-bold text-white">Isolated Canvas + Auto-Zeroize</h4>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Decrypted TOTP codes are drawn strictly to an HTML5 canvas with sub-pixel noise. 
                  They never exist in the HTML DOM, neutralizing browser scrapers. RAM is wiped clean after 45 seconds.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-emerald-500/20 text-[11px] font-mono text-emerald-300">
                Volatile Memory Only
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How Recovery Works */}
      <section className="py-20 border-b border-zinc-900">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
              The Borrowed-Device Workflow
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              2 Ways to Recover When Disaster Strikes
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-emerald-400 mb-3">
                  <KeyRound className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Fast Path</span>
                </div>
                <h4 className="text-xl font-bold text-white">1. Mental Passphrase</h4>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Sit at any friend&apos;s computer or cybercafé PC in incognito mode. Enter your handle and mental passphrase. 
                  Argon2id unwraps your vault in volatile browser memory within seconds.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-800">
                <Link
                  href="/recover"
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  <span>Test Passphrase Recovery</span>
                  <span>&rarr;</span>
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-teal-400 mb-3">
                  <FileText className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Break-Glass Path</span>
                </div>
                <h4 className="text-xl font-bold text-white">2. Shamir 3-of-5 Rescue Shares</h4>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Forgot your passphrase? Combine any 3 of your distributed shares (e.g. printed paper card + trusted contact share + cloud share) 
                  to restore your Master Key mathematically.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-800">
                <Link
                  href="/recover"
                  className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1"
                >
                  <span>Test Shamir Break-Glass Recovery</span>
                  <span>&rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-zinc-400 border-t border-zinc-900">
        <p>OmniID © 2026. Open-Source Disaster Recovery Protocol.</p>
        <p className="mt-1 text-[11px] text-zinc-500">
          Built for developers, remote workers, and crypto users who cannot afford hardware lockouts.
        </p>
      </footer>
    </div>
  );
}
