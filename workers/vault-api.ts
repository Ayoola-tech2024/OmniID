/**
 * Standalone Edge API handler for OmniID Encrypted Vault Sync (backed by Neon Serverless Postgres).
 * Deployable to Cloudflare Workers (or any Web-standard Fetch runtime) with `DATABASE_URL` as a secret.
 *
 * Security Invariant:
 * - Only stores/returns the encrypted vault ciphertext (`EncryptedVaultPayload`).
 * - Rejects any payload containing Shamir recovery shares.
 */

import { neon } from '@neondatabase/serverless';

export interface Env {
  DATABASE_URL: string;
  ALLOWED_ORIGIN?: string;
}

function corsHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const allowedOrigin = env.ALLOWED_ORIGIN || 'https://ayoola-tech2024.github.io';
    const requestOrigin = request.headers.get('Origin') || '';
    const origin =
      requestOrigin === 'http://localhost:3000' || requestOrigin === allowedOrigin
        ? requestOrigin
        : allowedOrigin;

    const headers = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    const url = new URL(request.url);
    const sql = neon(env.DATABASE_URL);

    if (request.method === 'GET' && url.pathname === '/vault') {
      const handle = (url.searchParams.get('handle') || '').trim().toLowerCase();
      if (!handle) {
        return new Response(JSON.stringify({ error: 'Missing handle parameter.' }), {
          status: 400,
          headers,
        });
      }

      const rows = await sql`
        SELECT vault_payload
        FROM vaults
        WHERE handle = ${handle}
        LIMIT 1
      `;

      if (!rows || rows.length === 0) {
        return new Response(JSON.stringify({ error: 'Vault not found.' }), {
          status: 404,
          headers,
        });
      }

      return new Response(JSON.stringify({ vault: rows[0].vault_payload }), {
        status: 200,
        headers,
      });
    }

    if (request.method === 'POST' && url.pathname === '/vault') {
      const body = (await request.json()) as {
        handle?: string;
        vault?: Record<string, unknown>;
      };

      const handle = (body.handle || '').trim().toLowerCase();
      const vault = body.vault;

      if (!handle || !vault || typeof vault !== 'object') {
        return new Response(JSON.stringify({ error: 'Invalid request body.' }), {
          status: 400,
          headers,
        });
      }

      if ('shamirShares' in vault || 'shares' in vault || 'primaryRescueShare' in vault) {
        return new Response(
          JSON.stringify({ error: 'Security violation: recovery shares cannot be synced.' }),
          { status: 400, headers }
        );
      }

      await sql`
        INSERT INTO vaults (handle, vault_payload, updated_at)
        VALUES (${handle}, ${JSON.stringify(vault)}::jsonb, NOW())
        ON CONFLICT (handle)
        DO UPDATE SET
          vault_payload = EXCLUDED.vault_payload,
          updated_at = NOW()
      `;

      return new Response(JSON.stringify({ ok: true, handle }), {
        status: 200,
        headers,
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers,
    });
  },
};
