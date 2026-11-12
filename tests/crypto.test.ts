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
  hexToBuffer,
  EFF_LARGE_WORDLIST,
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

const strongPassphrase = 'curtain-smuggler-whacky-manor-kerosene-footsore';

describe('OmniID Cryptographic Invariants & Share Separation', () => {
  test('EFF Large Wordlist has exactly 7,776 words providing 77.55 bits per 6 words', () => {
    assert.strictEqual(EFF_LARGE_WORDLIST.length, 7776);
    // Each word provides log2(7776) = 12.9248 bits
    const bitsPerWord = Math.log2(EFF_LARGE_WORDLIST.length);
    assert.ok(bitsPerWord > 12.92);
    const sixWordEntropy = bitsPerWord * 6;
    assert.ok(sixWordEntropy > 77.5);
  });

  test('zxcvbn passphrase strength evaluation strictly requires score 4 (Very Strong)', () => {
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

    // 5. Fair/medium strength (score 3) is rejected by score 4 policy
    const fair = evaluatePassphraseEntropy('p@$$w0rd123456!');
    assert.strictEqual(fair.score, 3);
    assert.strictEqual(fair.isValid, false); // Strict policy requires score 4

    // 6. 6-word EFF Diceware phrase: must pass with score 4
    const diceware = evaluatePassphraseEntropy(strongPassphrase);
    assert.strictEqual(diceware.isValid, true);
    assert.strictEqual(diceware.score, 4);

    // 7. Built-in Diceware generator produces score 4
    const generated = generateDicewarePassphrase();
    const evalGen = evaluatePassphraseEntropy(generated);
    assert.strictEqual(evalGen.isValid, true);
    assert.strictEqual(evalGen.score, 4);
  });

  test('hexToBuffer strictly validates input length and rejects odd-length or empty strings', () => {
    // Odd-length input must throw clean error, NOT RangeError: Invalid typed array length
    assert.throws(
      () => {
        hexToBuffer('abc');
      },
      /length must be an even number of characters/
    );

    // Empty input must throw clean error
    assert.throws(
      () => {
        hexToBuffer('');
      },
      /empty hex data/
    );

    // Valid hex must succeed
    const valid = hexToBuffer('deadbeef');
    assert.strictEqual(valid.length, 4);
    assert.strictEqual(valid[0], 0xde);
    assert.strictEqual(valid[1], 0xad);
    assert.strictEqual(valid[2], 0xbe);
    assert.strictEqual(valid[3], 0xef);
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

  test('CRITICAL EXPORT INVARIANT: No single export file contains >= 3 shares (non-tautological serialized inspection)', async () => {
    const { vault, shares, primaryShare } = await createNewVault(
      strongPassphrase,
      sampleAccounts,
      'alice@example.com'
    );

    // 1. Check serialized Rescue Kit JSON: must NOT contain shares 2-5 anywhere in content
    const rescueKit = generateRescueKitFile('alice@example.com', vault, primaryShare);
    const rescueKitJson = JSON.stringify(rescueKit).toLowerCase();
    for (const s of shares.slice(1)) {
      assert.ok(
        !rescueKitJson.includes(s.shareHex.toLowerCase()),
        `Rescue kit leaked share ${s.index} in serialized JSON`
      );
    }
    // Verify Share 1 is indeed the sole share present
    assert.ok(rescueKitJson.includes(shares[0].shareHex.toLowerCase()));

    // 2. Check each separate share card: each card i must NOT leak any share j !== i
    const separateCards = generateSeparateShareCards('alice@example.com', shares);
    assert.strictEqual(separateCards.length, 5);
    for (const card of separateCards) {
      const cardJson = JSON.stringify(card).toLowerCase();
      // It must contain its own share
      assert.ok(cardJson.includes(card.shareHex.toLowerCase()));
      // It must NOT contain any other share
      for (const s of shares) {
        if (s.index !== card.shareIndex) {
          assert.ok(
            !cardJson.includes(s.shareHex.toLowerCase()),
            `Card ${card.shareIndex} leaked share ${s.index}`
          );
        }
      }
    }

    // 3. Check encrypted vault ciphertext payload: contains zero shares
    const vaultJson = JSON.stringify(vault).toLowerCase();
    for (const s of shares) {
      assert.ok(
        !vaultJson.includes(s.shareHex.toLowerCase()),
        `Vault payload leaked share ${s.index}`
      );
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
