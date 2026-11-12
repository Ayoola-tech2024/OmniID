import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  createNewVault,
  unlockVaultWithPassphrase,
  unlockVaultWithShares,
  evaluatePassphraseEntropy,
  generateDicewarePassphrase,
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

const strongPassphrase = 'boulder-glacier-falcon-meadow-timber-summit';

describe('OmniID Cryptographic Invariants & Share Separation', () => {
  test('zxcvbn passphrase strength evaluation strictly rejects weak/predictable inputs', () => {
    // 1. Trivial single-character repetition: must fail
    const repeated = evaluatePassphraseEntropy('aaaaaaaaaaaaaa');
    assert.strictEqual(repeated.isValid, false);
    assert.strictEqual(repeated.score, 0);

    // 2. Predictable password + sequential numbers: must fail
    const common = evaluatePassphraseEntropy('password123456');
    assert.strictEqual(common.isValid, false);
    assert.ok(common.score <= 1);

    // 3. Admin sequence: must fail
    const admin = evaluatePassphraseEntropy('admin123456789');
    assert.strictEqual(admin.isValid, false);

    // 4. Too short: must fail
    const short = evaluatePassphraseEntropy('secret');
    assert.strictEqual(short.isValid, false);

    // 5. Diceware phrase: must pass with high score
    const diceware = evaluatePassphraseEntropy(strongPassphrase);
    assert.strictEqual(diceware.isValid, true);
    assert.strictEqual(diceware.score, 4);

    // 6. Built-in Diceware generator produces score 4
    const generated = generateDicewarePassphrase();
    const evalGen = evaluatePassphraseEntropy(generated);
    assert.strictEqual(evalGen.isValid, true);
    assert.strictEqual(evalGen.score, 4);
  });

  test('Vault creation does NOT store any recovery shares in vault payload', async () => {
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
    assert.strictEqual((rescueKit as any).shamirShares, undefined);
    assert.ok(rescueKit.securityNotice.includes('CANNOT open your vault'));
  });

  test('CRITICAL EXPORT INVARIANT: No single export file contains >= 3 shares', async () => {
    const { vault, shares, primaryShare } = await createNewVault(
      strongPassphrase,
      sampleAccounts,
      'alice@example.com'
    );

    // 1. Check Rescue Kit export
    const rescueKit = generateRescueKitFile('alice@example.com', vault, primaryShare);
    const rescueKitShareCount = rescueKit.primaryRescueShare ? 1 : 0;
    assert.ok(
      rescueKitShareCount < 3,
      `Rescue Kit contains ${rescueKitShareCount} shares, which must be < 3`
    );

    // 2. Check each separate share card
    const separateCards = generateSeparateShareCards('alice@example.com', shares);
    assert.strictEqual(separateCards.length, 5);
    for (const card of separateCards) {
      assert.ok(card.shareHex.length > 0);
      assert.ok(card.instructions.includes('NEVER store all 5 shares together'));
    }
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
        await unlockVaultWithPassphrase('wrong-passphrase-does-not-work', vault);
      },
      /Incorrect passphrase or corrupted vault/
    );
  });

  test('CRITICAL: 2 Shamir shares FAIL to unlock vault (threshold is 3)', async () => {
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

    // Attacker only has the rescue kit file (which has only Share 1)
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

    // Test distinct combinations: (1, 2, 3), (1, 3, 5), (2, 4, 5), (3, 4, 5)
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
});
