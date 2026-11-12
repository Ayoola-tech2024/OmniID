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
  Cpu,
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
                <span>Hardware-Free Biometric Disaster Recovery</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
                Your phone is dead. <br />
                Google wants a tap. <br />
                <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                  OmniID gets you in anyway.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-2xl">
                When power cuts hit in Lagos, batteries drop to 0%, or your phone gets snatched in transit, 
                you lose access to AWS, GitHub, Google, and your clients. 
                OmniID anchors your emergency 2FA codes directly to your face + mental PIN—zero apps, zero hardware, zero raw biometric storage.
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
                  <span>Enroll Free Lifeline Vault</span>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-6 pt-4 text-xs text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  100% Client-Side WebCrypto
                </span>
                <span className="flex items-center gap-1.5">
                  <EyeOff className="h-4 w-4 text-emerald-400" />
                  Zero Raw Face Storage
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-emerald-400" />
                  Twin-Shield Protected
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
                    <p className="font-semibold text-white">Your Infinix is dead at 0% battery.</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      How do you push code to GitHub or deploy to AWS right now?
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Twin Parity Defense Section */}
      <section className="py-20 border-b border-zinc-900 bg-zinc-950/50">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
              Cryptographic Threat Mitigation
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              &quot;What about identical twins?&quot;
            </h3>
            <p className="text-sm sm:text-base text-zinc-400 mt-3">
              Apple Face ID admits identical twins share near-identical bone structure. 
              Here is how OmniID mathematically neutralizes twin impersonation:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4">
                  <Cpu className="h-6 w-6" />
                </div>
                <h4 className="text-lg font-bold text-white">Factor 1: Face Vector</h4>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Webcam extracts 512-bit geometric feature embeddings. In a Fuzzy Commitment Scheme, 
                  this recovers the biological key share $K_1$. It replaces carrying physical hardware.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-800/80 text-[11px] font-mono text-emerald-400">
                Shared between twins
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 mb-4">
                  <Lock className="h-6 w-6" />
                </div>
                <h4 className="text-lg font-bold text-white">Factor 2: Twin-Shield PIN</h4>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  A memorized 4-digit PIN is salted via Argon2id into key share $K_2$. 
                  Your identical twin can match your face, but without this mental secret, the vault cannot unlock.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-800/80 text-[11px] font-mono text-teal-400">
                Private to your brain
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/10 p-6 flex flex-col justify-between shadow-lg shadow-emerald-950/20">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 mb-4">
                  <Shield className="h-6 w-6" />
                </div>
                <h4 className="text-lg font-bold text-white">Reconstruction: K = K1 ⊕ K2</h4>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  The AES-256-GCM vault key only forms in volatile RAM when both shares align. 
                  A twin entering a wrong PIN produces pure mathematical noise.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-emerald-500/20 text-[11px] font-mono text-emerald-300">
                Zero-Knowledge Defense
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Tier Pricing Model */}
      <section className="py-20 border-b border-zinc-900">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
              Transparent Developer Pricing
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Built for survival, priced for developers
            </h3>
            <p className="text-sm text-zinc-400 mt-3">
              Start free today. Upgrade for unlimited accounts or drop our Recovery SDK into your own startup.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Lifeline */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Tier 1: Lifeline
                </span>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">$0</span>
                  <span className="text-xs text-zinc-400">/ forever</span>
                </div>
                <p className="text-xs text-zinc-400 mt-3">
                  Essential disaster recovery for individual developers and remote workers.
                </p>

                <ul className="mt-6 space-y-3 text-xs text-zinc-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>3 Critical TOTP Accounts (Google, GitHub, AWS)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Active Chromatic Anti-Spoofing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Twin-Shield PIN Protection</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>1 Emergency Recovery Session / month</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/enroll"
                className="mt-8 block text-center rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 text-xs font-semibold text-white transition hover:bg-zinc-700"
              >
                Enroll Free
              </Link>
            </div>

            {/* Pro Dev - Highlighted */}
            <div className="relative rounded-2xl border-2 border-emerald-500 bg-zinc-900/80 p-8 flex flex-col justify-between shadow-2xl shadow-emerald-500/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-0.5 text-[10px] font-bold text-zinc-950 uppercase tracking-wider">
                Most Popular for Devs
              </div>

              <div>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  Tier 2: Pro Dev
                </span>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">$39</span>
                  <span className="text-xs text-zinc-400">Lifetime Deal (or $4/mo)</span>
                </div>
                <p className="text-xs text-zinc-400 mt-3">
                  Pay once via card or crypto (USDT/SOL). Never get locked out of your career again.
                </p>

                <ul className="mt-6 space-y-3 text-xs text-zinc-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold text-white">Unlimited TOTP & Backup Codes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold text-white">Duress Decoy Vault Mode</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Encrypted SSH Keys & Env Variables</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Unlimited Emergency Recoveries</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/enroll"
                className="mt-8 block text-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-2.5 text-xs font-bold text-zinc-950 shadow-lg shadow-emerald-500/25 transition hover:from-emerald-400 hover:to-teal-400"
              >
                Claim $39 Lifetime Pass
              </Link>
            </div>

            {/* B2B Recovery SDK */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Tier 3: Recovery SDK
                </span>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">$0.04</span>
                  <span className="text-xs text-zinc-400">/ active recovery</span>
                </div>
                <p className="text-xs text-zinc-400 mt-3">
                  For crypto exchanges, fintechs, and freelancer platforms to cut account-reset support costs.
                </p>

                <ul className="mt-6 space-y-3 text-xs text-zinc-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Drop-in React Component (`npm i @omni-id/react`)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>First 1,000 Recoveries Free</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Webhook Audit Trail & Alerts</span>
                  </li>
                </ul>
              </div>

              <a
                href="https://github.com/Ayoola-tech2024/OmniID"
                target="_blank"
                rel="noreferrer"
                className="mt-8 block text-center rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 text-xs font-semibold text-white transition hover:bg-zinc-700"
              >
                View SDK Docs
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-zinc-400 border-t border-zinc-900">
        <p>OmniID © 2026. Universal Hardware-Independent Biometric Recovery Protocol.</p>
        <p className="mt-1 text-[11px] text-zinc-400">
          Built in Lagos, Nigeria for developers, crypto traders, and remote workers globally.
        </p>
      </footer>
    </div>
  );
}
