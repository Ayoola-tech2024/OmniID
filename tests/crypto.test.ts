import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  createNewVault,
  unlockVaultWithPassphrase,
  unlockVaultWithShares,
  reconstructMasterKeyFromShares,
  evaluatePassphraseEntropy,
  generateRescueKitFile,
  generateSeparateShareCards,
  VaultAccount,
} from '../src/lib/crypto/vaultCrypto';

const sampleAccounts: VaultAccount[] = [
  {
    id: 'test-1',
    service: 'Google',
    accountName: 'test@example.com',
    secret: 'JBSWY3DPEHPK3PXP',
  },
  {
    id: 'test-2',
    service: 'GitHub',
    accountName: 'octocat',
    secret: 'KRUGS4ZANFZSA33V',
  },
];

const strongPassphrase = 'correct horse battery staple';

describe('OmniID Cryptographic Invariants & Share Separation', () => {
  test('Passphrase entropy enforcement', () => {
    // Too short
    const short = evaluatePassphraseEntropy('secret');
    assert.strictEqual(short.isValid, false);

    // 8 chars single word: weak
    const weak = evaluatePassphraseEntropy('password');
    assert.strictEqual(weak.isValid, false);

    // 4 random words (Diceware style): strong
    const diceware = evaluatePassphraseEntropy('correct horse battery staple');
    assert.strictEqual(diceware.isValid, true);
    assert.ok(diceware.estimatedBits >= 50);

    // 14+ characters: valid
    const long = evaluatePassphraseEntropy('A7#kL9$xP2!mQ8');
    assert.strictEqual(long.isValid, true);
  });

  test('Vault creation does NOT store all shares in vault payload', async () => {
    const { vault, shares, primaryShare } = await createNewVault(
      strongPassphrase,
      sampleAccounts,
      'alice@example.com'
    );

    // 1. Vault payload must not contain any shares array
    assert.strictEqual((vault as any).shamirShares, undefined);
    assert.strictEqual((vault as any).shares, undefined);

    // 2. 5 separate shares are returned
    assert.strictEqual(shares.length, 5);
    assert.strictEqual(primaryShare.index, 1);

    // 3. Rescue Kit JSON contains ONLY Share 1
    const rescueKit = generateRescueKitFile('alice@example.com', vault, primaryShare);
    assert.strictEqual(rescueKit.primaryRescueShare.index, 1);
    assert.strictEqual((rescueKit as any).shares, undefined);
    assert.ok(rescueKit.securityNotice.includes('CANNOT open your vault'));
  });

  test('Unlock with correct passphrase succeeds', async () => {
    const { vault } = await createNewVault(
      strongPassphrase,
      sampleAccounts,
      'alice@example.com'
    );

    const accounts = await unlockVaultWithPassphrase(strongPassphrase, vault);
    assert.strictEqual(accounts.length, 2);
    assert.strictEqual(accounts[0].service, 'Google');
    assert.strictEqual(accounts[1].service, 'GitHub');
  });

  test('Unlock with wrong passphrase fails', async () => {
    const { vault } = await createNewVault(
      strongPassphrase,
      sampleAccounts,
      'alice@example.com'
    );

    await assert.rejects(
      async () => {
        await unlockVaultWithPassphrase('wrong horse battery staple', vault);
      },
      /Incorrect passphrase or corrupted vault/
    );
  });

  test('CRITICAL: 2 Shamir shares FAIL to unlock vault', async () => {
    const { vault, shares } = await createNewVault(
      strongPassphrase,
      sampleAccounts,
      'alice@example.com'
    );

    // Only 2 shares provided (e.g. Share 1 and Share 2)
    const twoShares = [shares[0].shareHex, shares[1].shareHex];

    await assert.rejects(
      async () => {
        await unlockVaultWithShares(twoShares, vault);
      },
      /Threshold not reached/
    );
  });

  test('CRITICAL: Rescue Kit file alone (Share 1 only) CANNOT unlock vault', async () => {
    const { vault, primaryShare } = await createNewVault(
      strongPassphrase,
      sampleAccounts,
      'alice@example.com'
    );

    const rescueKit = generateRescueKitFile('alice@example.com', vault, primaryShare);

    // Attacker only has the rescue kit file (which has 1 share)
    const attackerShares = [rescueKit.primaryRescueShare.shareHex];

    await assert.rejects(
      async () => {
        await unlockVaultWithShares(attackerShares, rescueKit.encryptedVault);
      },
      /Threshold not reached/
    );
  });

  test('CRITICAL: Any 3 distinct Shamir shares SUCCEED to unlock vault', async () => {
    const { vault, shares } = await createNewVault(
      strongPassphrase,
      sampleAccounts,
      'alice@example.com'
    );

    // Test combinations: (1, 2, 3), (1, 3, 5), (2, 4, 5), (3, 4, 5)
    const combos = [
      [shares[0].shareHex, shares[1].shareHex, shares[2].shareHex],
      [shares[0].shareHex, shares[2].shareHex, shares[4].shareHex],
      [shares[1].shareHex, shares[3].shareHex, shares[4].shareHex],
      [shares[2].shareHex, shares[3].shareHex, shares[4].shareHex],
    ];

    for (const combo of combos) {
      const accounts = await unlockVaultWithShares(combo, vault);
      assert.strictEqual(accounts.length, 2);
      assert.strictEqual(accounts[0].accountName, 'test@example.com');
    }
  });

  test('Duplicate shares are rejected', async () => {
    const { vault, shares } = await createNewVault(
      strongPassphrase,
      sampleAccounts,
      'alice@example.com'
    );

    // Providing the same share 3 times is an invalid attempt
    const duplicateShares = [shares[0].shareHex, shares[0].shareHex, shares[0].shareHex];

    await assert.rejects(
      async () => {
        await unlockVaultWithShares(duplicateShares, vault);
      },
      /Duplicate shares detected/
    );
  });

  test('Separate share cards are generated properly for distribution', async () => {
    const { shares } = await createNewVault(
      strongPassphrase,
      sampleAccounts,
      'alice@example.com'
    );

    const cards = generateSeparateShareCards('alice@example.com', shares);
    assert.strictEqual(cards.length, 5);
    assert.strictEqual(cards[0].shareIndex, 1);
    assert.strictEqual(cards[1].shareIndex, 2);
    assert.ok(cards[1].instructions.includes('NEVER store all 5 shares together'));
  });
});
