'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  KeyRound,
  ArrowRight,
  Lock,
  Users,
  EyeOff,
  Check,
  Minus,
  ShieldCheck,
  Loader2,
  ArrowUpRight,
} from 'lucide-react';
import { OmniLogo } from '@/components/OmniLogo';
import { joinWaitlist } from '@/lib/storage/vaultSync';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export default function HomePage() {
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState<
    'idle' | 'loading' | 'success' | 'already' | 'error'
  >('idle');
  const [waitlistError, setWaitlistError] = useState<string | null>(null);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail.trim()) return;
    setWaitlistStatus('loading');
    setWaitlistError(null);

    const res = await joinWaitlist(waitlistEmail, 'landing_page');
    if (!res.ok) {
      setWaitlistStatus('error');
      setWaitlistError(res.error || 'Could not join waitlist.');
      return;
    }

    setWaitlistStatus(res.alreadyJoined ? 'already' : 'success');
    setWaitlistEmail('');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-white selection:text-zinc-950">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden border-b border-zinc-800/80 pt-14 pb-20 md:pt-24 md:pb-28">
        {/* Subtle monochrome radial highlight */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-25"
          style={{
            background:
              'radial-gradient(60% 50% at 50% 0%, rgba(255, 255, 255, 0.16) 0%, rgba(9, 9, 11, 0) 100%)',
          }}
        />

        <div className="container relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
            {/* Left Column: Core Pitch */}
            <div className="lg:col-span-7 flex flex-col items-start gap-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1 text-[11px] font-mono uppercase tracking-wider text-zinc-300">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                <span>Hardware-Free Emergency Recovery</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-bold tracking-tight text-white leading-[1.08] text-balance">
                Account recovery for when your phone is dead, stolen, or out of power.
              </h1>

              <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-xl">
                Two-factor login assumes your phone is always in your pocket, charged, and working.
                When your battery dies, your phone gets stolen, or the power goes out, Google still
                asks you to tap a prompt on a dead screen. OmniID keeps an encrypted backup of your
                6-digit login codes so you can recover on any borrowed laptop or phone—safely.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href="/recover"
                  className="inline-flex items-center gap-2 rounded-md bg-white px-5 py-3 text-xs sm:text-sm font-semibold text-zinc-950 shadow-sm transition hover:bg-zinc-200"
                >
                  <span>Recover My Accounts</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/enroll"
                  className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/80 px-5 py-3 text-xs sm:text-sm font-medium text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-900 hover:text-white"
                >
                  <KeyRound className="h-4 w-4 text-zinc-400" />
                  <span>Set Up My Backup</span>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 w-full border-t border-zinc-900 text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-white shrink-0" />
                  <span>Locked with your phrase</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-white shrink-0" />
                  <span>5-piece backup (need 3)</span>
                </div>
                <div className="flex items-center gap-2">
                  <EyeOff className="h-3.5 w-3.5 text-white shrink-0" />
                  <span>Auto-wipes after 60s</span>
                </div>
              </div>
            </div>

            {/* Right Column: Real Lockout Screenshot */}
            <div className="lg:col-span-5">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 shadow-2xl">
                <div className="flex items-center justify-between pb-2.5 px-1 text-xs text-zinc-400 border-b border-zinc-800/80 mb-3">
                  <span className="font-medium text-zinc-200">The Lockout Problem</span>
                  <span className="font-mono text-[11px] text-zinc-500">2FA Dead-End</span>
                </div>

                <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${basePath}/images/infinix-lockout.png`}
                    alt="Google prompt asking to verify on Infinix HOT 50i"
                    width={1024}
                    height={639}
                    className="w-full h-auto object-cover"
                    loading="eager"
                  />
                  <div className="border-t border-zinc-800 bg-zinc-900/90 p-3.5 text-xs text-zinc-400">
                    <p className="text-white font-semibold">When you cannot tap your phone:</p>
                    <p className="mt-1 text-[11px] leading-relaxed">
                      Click <strong className="text-zinc-200">&quot;More ways to verify&quot;</strong> on
                      Google or GitHub, choose Authenticator code, and open OmniID on whatever screen
                      you are using to get your 6-digit code.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Corporate Spec Bar */}
      <section className="border-b border-zinc-800/80 bg-zinc-950">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-800/80">
            <div className="py-6 pr-4">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
                0%
              </div>
              <div className="text-xs text-zinc-400 mt-1">
                Server access to your unencrypted keys
              </div>
            </div>
            <div className="py-6 px-0 sm:px-6">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
                3-of-5
              </div>
              <div className="text-xs text-zinc-400 mt-1">
                Split backup pieces needed to recover
              </div>
            </div>
            <div className="py-6 pr-4 lg:px-6">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
                60s
              </div>
              <div className="text-xs text-zinc-400 mt-1">
                Auto-wipe timer on borrowed laptops
              </div>
            </div>
            <div className="py-6 pl-0 sm:pl-6">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
                7,776
              </div>
              <div className="text-xs text-zinc-400 mt-1">
                Official EFF Diceware words for phrases
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Security Pillars */}
      <section id="security" className="py-20 border-b border-zinc-800/80">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 mb-2">
              Security Architecture
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Even if our database leaks, nobody can read your codes.
            </h2>
            <p className="text-sm text-zinc-400 mt-3 leading-relaxed">
              Your secrets are scrambled inside your own browser before they ever leave your device.
              We never see your password, and no single person or file can unlock your backup.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/25 p-6 flex flex-col justify-between transition hover:border-zinc-700">
              <div>
                <div className="h-10 w-10 rounded-lg bg-white text-zinc-950 flex items-center justify-center mb-4">
                  <Lock className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-white">
                  1. A Secret Phrase Only You Know
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 mt-2.5 leading-relaxed">
                  You pick (or generate) a strong 6-word passphrase. Your device turns it into a
                  heavy-duty lock that takes attackers centuries to guess—even with fast servers.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-800/80 text-[11px] text-zinc-500 font-mono">
                Argon2id (64 MiB) + AES-256-GCM
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/25 p-6 flex flex-col justify-between transition hover:border-zinc-700">
              <div>
                <div className="h-10 w-10 rounded-lg bg-white text-zinc-950 flex items-center justify-center mb-4">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-white">
                  2. Backup Key Split into 5 Pieces
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 mt-2.5 leading-relaxed">
                  What if you forget your passphrase? Your master key is split into 5 separate
                  pieces (Rescue Kit, paper printout, trusted friend, USB, safe box). Any 3 pieces
                  unlock your vault.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-800/80 text-[11px] text-zinc-500 font-mono">
                3-of-5 Shamir Secret Sharing
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/25 p-6 flex flex-col justify-between transition hover:border-zinc-700">
              <div>
                <div className="h-10 w-10 rounded-lg bg-white text-zinc-950 flex items-center justify-center mb-4">
                  <EyeOff className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-white">
                  3. Safe on a Borrowed Laptop
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 mt-2.5 leading-relaxed">
                  Your 6-digit codes are drawn as a temporary image instead of selectable webpage
                  text so browser extensions cannot scrape them—and everything wipes in 60 seconds.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-800/80 text-[11px] text-zinc-500 font-mono">
                Auto-wiping HTML5 canvas
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Comparison Table */}
      <section id="compare" className="py-20 border-b border-zinc-800/80 bg-zinc-900/15">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl mb-10">
            <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 mb-2">
              Why OmniID
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              How it compares to tools already out there
            </h2>
            <p className="text-sm text-zinc-400 mt-2.5 leading-relaxed">
              Password managers are built for daily logins. Authenticator apps are built for one
              working phone. OmniID is built specifically for the day your phone is gone.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950">
            <table className="w-full text-left border-collapse min-w-[680px]">
              <thead>
                <tr className="border-b border-zinc-800 text-xs font-mono uppercase tracking-wider text-zinc-400">
                  <th className="py-4 px-5 font-medium">Capability</th>
                  <th className="py-4 px-5 font-semibold text-white bg-zinc-900/70">OmniID</th>
                  <th className="py-4 px-5 font-medium">1Password / Bitwarden</th>
                  <th className="py-4 px-5 font-medium">Google / Apple Cloud</th>
                  <th className="py-4 px-5 font-medium">Authy / Google Auth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 text-xs sm:text-sm text-zinc-300">
                <tr>
                  <td className="py-4 px-5 font-medium text-white">
                    Works when phone is dead or stolen
                  </td>
                  <td className="py-4 px-5 bg-zinc-900/40 text-white font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <Check className="h-4 w-4 text-white" /> Yes (any browser)
                    </span>
                  </td>
                  <td className="py-4 px-5 text-zinc-400">Needs master password + 2FA</td>
                  <td className="py-4 px-5 text-zinc-400">Often loops back to dead phone</td>
                  <td className="py-4 px-5 text-zinc-500">
                    <span className="inline-flex items-center gap-1.5">
                      <Minus className="h-4 w-4" /> Tied to phone
                    </span>
                  </td>
                </tr>

                <tr>
                  <td className="py-4 px-5 font-medium text-white">
                    Recovery if you forget your password
                  </td>
                  <td className="py-4 px-5 bg-zinc-900/40 text-white font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <Check className="h-4 w-4 text-white" /> Any 3-of-5 split keys
                    </span>
                  </td>
                  <td className="py-4 px-5 text-zinc-400">1 single Emergency Kit PDF</td>
                  <td className="py-4 px-5 text-zinc-400">Wait days / SMS / support</td>
                  <td className="py-4 px-5 text-zinc-500">
                    <span className="inline-flex items-center gap-1.5">
                      <Minus className="h-4 w-4" /> Often lost forever
                    </span>
                  </td>
                </tr>

                <tr>
                  <td className="py-4 px-5 font-medium text-white">
                    No single company or file holds your keys
                  </td>
                  <td className="py-4 px-5 bg-zinc-900/40 text-white font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <Check className="h-4 w-4 text-white" /> Zero-knowledge + split
                    </span>
                  </td>
                  <td className="py-4 px-5 text-zinc-400">Single vault file</td>
                  <td className="py-4 px-5 text-zinc-500">
                    <span className="inline-flex items-center gap-1.5">
                      <Minus className="h-4 w-4" /> Cloud account controlled
                    </span>
                  </td>
                  <td className="py-4 px-5 text-zinc-400">Local or cloud-synced</td>
                </tr>

                <tr>
                  <td className="py-4 px-5 font-medium text-white">
                    Auto-wiping display for borrowed laptops
                  </td>
                  <td className="py-4 px-5 bg-zinc-900/40 text-white font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <Check className="h-4 w-4 text-white" /> Image canvas + 60s wipe
                    </span>
                  </td>
                  <td className="py-4 px-5 text-zinc-500">
                    <span className="inline-flex items-center gap-1.5">
                      <Minus className="h-4 w-4" /> Leaves session/clipboard
                    </span>
                  </td>
                  <td className="py-4 px-5 text-zinc-500">
                    <span className="inline-flex items-center gap-1.5">
                      <Minus className="h-4 w-4" /> Logs full OS/browser in
                    </span>
                  </td>
                  <td className="py-4 px-5 text-zinc-500">
                    <span className="inline-flex items-center gap-1.5">
                      <Minus className="h-4 w-4" /> Mobile app only
                    </span>
                  </td>
                </tr>

                <tr>
                  <td className="py-4 px-5 font-medium text-white">Price &amp; Open Source</td>
                  <td className="py-4 px-5 bg-zinc-900/40 text-white font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <Check className="h-4 w-4 text-white" /> Free &amp; Open Source
                    </span>
                  </td>
                  <td className="py-4 px-5 text-zinc-400">Paid / Freemium</td>
                  <td className="py-4 px-5 text-zinc-400">Closed ecosystem</td>
                  <td className="py-4 px-5 text-zinc-400">Free / Closed source</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 5. 3 Simple Steps */}
      <section id="how-it-works" className="py-20 border-b border-zinc-800/80">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 mb-2">
              3 Simple Steps
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              How to get back in when your phone is gone
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-zinc-400">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-6">
              <span className="font-mono text-white text-xs border border-zinc-800 rounded px-2 py-0.5 bg-zinc-900">
                STEP 01
              </span>
              <h3 className="text-base font-semibold text-white mt-4 mb-2">
                Find your locked vault
              </h3>
              <p className="leading-relaxed">
                Open OmniID on any phone or borrowed laptop. Type your email/handle to pull your
                encrypted backup from the cloud, or upload your Rescue Kit file.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-6">
              <span className="font-mono text-white text-xs border border-zinc-800 rounded px-2 py-0.5 bg-zinc-900">
                STEP 02
              </span>
              <h3 className="text-base font-semibold text-white mt-4 mb-2">Unlock it</h3>
              <p className="leading-relaxed">
                Type your secret 6-word passphrase—or, if you forgot it, combine any 3 of your 5
                backup key pieces (for example, Rescue Kit + printed paper + trusted contact).
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-6">
              <span className="font-mono text-white text-xs border border-zinc-800 rounded px-2 py-0.5 bg-zinc-900">
                STEP 03
              </span>
              <h3 className="text-base font-semibold text-white mt-4 mb-2">
                Type your 6-digit code
              </h3>
              <p className="leading-relaxed">
                Your live 6-digit login code appears on screen. Enter it into Google or GitHub, then
                click Lock (or close the tab) and nothing is left behind.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Waitlist Section (Connected to Neon Postgres) */}
      <section id="waitlist" className="py-20 border-b border-zinc-800/80">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/35 p-8 sm:p-12 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-5">
              <ShieldCheck className="h-3.5 w-3.5 text-white" />
              <span>Early Access Waitlist</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight text-balance">
              Coming next: 1-Tap Passkey Unlock &amp; Team Break-Glass
            </h2>
            <p className="text-sm text-zinc-400 mt-3 max-w-xl mx-auto leading-relaxed">
              Want Face ID / Fingerprint Passkey unlock on your own devices, time-locked recovery
              alerts, and shared team vaults? Join the waitlist to get early access.
            </p>

            <form
              onSubmit={handleWaitlistSubmit}
              className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 max-w-md mx-auto"
            >
              <input
                type="email"
                required
                value={waitlistEmail}
                onChange={(e) => setWaitlistEmail(e.target.value)}
                placeholder="you@company.com"
                disabled={waitlistStatus === 'loading'}
                className="flex-1 rounded-md border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-white focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={waitlistStatus === 'loading'}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-50"
              >
                {waitlistStatus === 'loading' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Joining...</span>
                  </>
                ) : (
                  <span>Join Waitlist</span>
                )}
              </button>
            </form>

            {waitlistStatus === 'success' && (
              <p className="mt-4 text-xs text-white font-medium">
                ✓ You&apos;re on the list! We&apos;ll notify you as soon as Passkey Unlock &amp; Pro
                features launch.
              </p>
            )}
            {waitlistStatus === 'already' && (
              <p className="mt-4 text-xs text-zinc-300">
                ✓ You&apos;re already on the waitlist—we&apos;ll be in touch soon.
              </p>
            )}
            {waitlistStatus === 'error' && waitlistError && (
              <p className="mt-4 text-xs text-red-400">{waitlistError}</p>
            )}

            <p className="mt-4 text-[11px] text-zinc-600 font-mono">
              Zero spam. Unsubscribe anytime. Stored in Neon Postgres.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Corporate Big-Logo Footer */}
      <footer className="bg-zinc-950 pt-16 pb-6 overflow-hidden">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-14 border-b border-zinc-800/80">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="inline-flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded bg-white text-zinc-950">
                  <OmniLogo className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold tracking-tight text-white">OmniID</span>
              </Link>
              <p className="text-xs text-zinc-500 mt-3 leading-relaxed max-w-xs">
                Hardware-free emergency 2FA recovery. Built so a dead phone never locks you out of
                your digital life.
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">
                Product
              </h3>
              <ul className="space-y-2.5 text-xs text-zinc-400">
                <li>
                  <Link href="/enroll" className="hover:text-white transition">
                    Create Backup Kit
                  </Link>
                </li>
                <li>
                  <Link href="/recover" className="hover:text-white transition">
                    Recover Accounts
                  </Link>
                </li>
                <li>
                  <a href="#compare" className="hover:text-white transition">
                    Compare Solutions
                  </a>
                </li>
                <li>
                  <a href="#waitlist" className="hover:text-white transition">
                    Early Access Waitlist
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">
                Security
              </h3>
              <ul className="space-y-2.5 text-xs text-zinc-400">
                <li>
                  <a href="#security" className="hover:text-white transition">
                    Zero-Knowledge Vault
                  </a>
                </li>
                <li>
                  <a href="#security" className="hover:text-white transition">
                    3-of-5 Key Splitting
                  </a>
                </li>
                <li>
                  <a href="#security" className="hover:text-white transition">
                    Borrowed-Laptop Mode
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">
                Open Source
              </h3>
              <ul className="space-y-2.5 text-xs text-zinc-400">
                <li>
                  <a
                    href="https://github.com/Ayoola-tech2024/OmniID"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:text-white transition"
                  >
                    <span>GitHub Repository</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/Ayoola-tech2024/OmniID/blob/main/tests/crypto.test.ts"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:text-white transition"
                  >
                    <span>Crypto Test Suite</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-6 text-[11px] text-zinc-500 font-mono">
            <p>© {new Date().getFullYear()} OmniID. Open-Source Break-Glass Recovery.</p>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              <span>CLIENT-SIDE ENCRYPTED • NEON CLOUD SYNC ACTIVE</span>
            </div>
          </div>

          {/* Big Corporate Footer Wordmark */}
          <div className="pt-4 select-none pointer-events-none flex items-center justify-center gap-3 sm:gap-5 border-t border-zinc-900">
            <OmniLogo className="w-[10vw] h-[10vw] max-w-[110px] max-h-[110px] text-zinc-800/80 shrink-0" />
            <span className="text-[17vw] sm:text-[15vw] lg:text-[165px] font-bold tracking-tighter leading-[0.85] bg-gradient-to-b from-zinc-700/70 via-zinc-800/40 to-zinc-950 bg-clip-text text-transparent">
              OmniID
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
