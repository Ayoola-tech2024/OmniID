/**
 * OmniID TOTP Manager: RFC 6238 In-Memory Engine
 * 
 * Computes live 6-digit TOTP codes for Google, GitHub, AWS, Resend, and custom services
 * without persisting keys or secret tokens.
 */
import * as OTPAuth from 'otpauth';
import { VaultAccount } from '../crypto/fuzzyVault';

export interface LiveTotpCode {
  accountId: string;
  service: string;
  accountName: string;
  code: string;
  secondsRemaining: number;
  period: number;
}

/**
 * Normalizes a base32 secret (strips spaces and hyphens).
 */
export function cleanSecret(rawSecret: string): string {
  return rawSecret.replace(/[\s-]/g, '').toUpperCase();
}

/**
 * Generates a current TOTP code and remaining seconds for a given account.
 */
export function generateTotp(account: VaultAccount): LiveTotpCode {
  const period = account.period || 30;
  const digits = account.digits || 6;
  const cleanedSecret = cleanSecret(account.secret);

  try {
    const totp = new OTPAuth.TOTP({
      issuer: account.service,
      label: account.accountName,
      algorithm: 'SHA1',
      digits: digits,
      period: period,
      secret: OTPAuth.Secret.fromBase32(cleanedSecret),
    });

    const code = totp.generate();
    const epochNow = Math.floor(Date.now() / 1000);
    const secondsRemaining = period - (epochNow % period);

    return {
      accountId: account.id,
      service: account.service,
      accountName: account.accountName,
      code,
      secondsRemaining,
      period,
    };
  } catch (err) {
    console.error(`Failed to generate TOTP for ${account.service}:`, err);
    return {
      accountId: account.id,
      service: account.service,
      accountName: account.accountName,
      code: '------',
      secondsRemaining: 0,
      period,
    };
  }
}

/**
 * Generates current codes for all unlocked vault accounts.
 */
export function generateAllTotpCodes(accounts: VaultAccount[]): LiveTotpCode[] {
  return accounts.map(generateTotp);
}
