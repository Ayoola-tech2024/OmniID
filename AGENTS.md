# OmniID — Agent & QA Instructions

## Architecture
- **Frontend (Static Next.js Export):** `https://ayoola-tech2024.github.io/OmniID/` (deployed via `.github/workflows/deploy.yml` on `main`)
- **Edge API (Cloudflare Worker):** `workers/vault-api.ts` (`https://omniid-vault-api.adamsromeo163.workers.dev`)
- **Database (Neon Serverless Postgres):** `sql/schema.sql` (`vaults` and `waitlist` tables; credentials in gitignored `.env.local`)

## Required Checks Before Pushing
```bash
npm test
npm run lint
GITHUB_PAGES=true npm run build
```

## Post-Deploy `agent-browser` Smoke Gate (Remote Cloud Workspaces)
If `agent-browser` is not installed in the current workspace, install in user space (never global `/usr/local/lib`):
```bash
npm install --prefix ~/.local/agent-browser agent-browser
```

Always launch with the system Chromium binary and proxy-safe HTTPS flag:
```bash
export PATH="$HOME/.local/agent-browser/node_modules/.bin:$PATH"
export AGENT_BROWSER_EXECUTABLE_PATH=/usr/bin/chromium
export AGENT_BROWSER_IGNORE_HTTPS_ERRORS=1
```

### Standard Smoke Flow
1. Open `https://ayoola-tech2024.github.io/OmniID/` and verify `document.images` loaded (`naturalWidth > 0`) and `agent-browser errors` is empty.
2. Test `#waitlist` submission (`POST /waitlist` -> Neon `waitlist` table).
3. Open `https://ayoola-tech2024.github.io/OmniID/enroll`:
   - Enter a test handle (`qa-smoke@omni.id`).
   - Verify weak passphrase rejection (`password123456` -> Score 1) and `Generate 6 Diceware words` (Score 4).
   - Encrypt & split into 5 shares, download Rescue Kit JSON, step through Shares 1–5, and verify Step 6 (`All 5 shares separated & confirmed`) renders.
4. Open `https://ayoola-tech2024.github.io/OmniID/recover`:
   - Run `localStorage.clear()` to simulate a borrowed laptop.
   - Look up `qa-smoke@omni.id` via cloud sync (Neon via Cloudflare Worker).
   - Unlock with passphrase and verify `<canvas>` TOTP elements render.
   - Click `Lock` and verify 3-of-5 Shamir share unlock works.
5. Clean up temporary `qa-smoke@omni.id` rows from `vaults` and `waitlist` in Neon Postgres.
