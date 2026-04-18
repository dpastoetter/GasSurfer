# Contributing to Gas Surfer

Thanks for helping improve Gas Surfer. This document explains how to run, test, and ship changes.

## Prerequisites

- Node.js 20+ (CI uses 22)
- npm 10+

**Privacy / outbound calls:** see [docs/PRIVACY.md](docs/PRIVACY.md) for a plain-language list of third-party endpoints the browser may contact.

## Setup

```bash
cd gas-surfer
npm ci
```

## Development

- **Frontend only:** `npm run dev` — Vite on [http://localhost:5173](http://localhost:5173) by default.
- **Frontend + optional API:** `npm run dev:all` — runs the Express API on port **3001** and Vite together. Proxies under `/api/*` hit the local server (see [vite.config.ts](vite.config.ts)).

### Environment variables

| Variable | Where | Purpose |
|----------|--------|---------|
| `VITE_API_URL` | Vite / browser | Optional absolute base for the API (e.g. `https://api.example.com`). If unset, same-origin `/api/...` is used (dev proxy when server runs). |
| `PORT` | `npm run server` | API port (default `3001`). |
| `GAS_SURFER_DB` | `npm run server` | Optional path to SQLite file for the API. |
| `ALLOWED_ORIGINS` | Production API | Comma-separated CORS origins. |

### Screenshots (README)

1. Build and serve the production bundle, **or** run `npm run dev`.
2. If Playwright cannot find browsers (e.g. in some CI/sandbox setups), set:

   `export PLAYWRIGHT_BROWSERS_PATH="$HOME/.cache/ms-playwright"`

3. Run:

   ```bash
   BASE_URL=http://127.0.0.1:5173 SCREENSHOT_WAIT=15000 npm run screenshot
   ```

   Adjust `BASE_URL` to match your dev/preview URL. If Playwright gets `ECONNREFUSED` while Vite is running, start Vite with an explicit bind, e.g. `npx vite --host 127.0.0.1 --strictPort`, then use that host in `BASE_URL` (see [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md#regenerating-screenshots)).

4. Commit updated files under `docs/screenshots/` when refreshing README imagery.

## Checks before a PR

```bash
npm run lint
npm run test
npm run build
npm run test:e2e
```

- **`npm run test`** — Vitest (includes optional API contract checks against `server/app.js`).
- **`npm run test:e2e`** — Playwright against a production preview; the web server is started automatically (see [playwright.config.ts](playwright.config.ts)). Smoke tests **mock** external RPC, mempool.space, and CoinGecko so CI stays deterministic. Includes cases for **URL hydration** (`compare=`, `txPreset=`).
- **First-time Playwright:** run `npx playwright install chromium` (or `npx playwright install`) so the browser binary exists. In constrained environments, set `PLAYWRIGHT_BROWSERS_PATH` to a writable cache directory (see Screenshots above).

## Project layout (short)

- [src/App.tsx](src/App.tsx) — main shell, URL sync (`useUrlSync`), compare / tx-preset hydration, modals.
- [src/hooks/useUrlSync.ts](src/hooks/useUrlSync.ts) / [src/lib/urlQuerySchema.ts](src/lib/urlQuerySchema.ts) — shareable query string (`chain`, `currency`, `lang`, `compare`, `txPreset`).
- [src/useGasPrices.ts](src/useGasPrices.ts) — RPC + mempool fetching.
- [server/](server/) — optional Express + SQLite API (samples, averages, fee ticks, snapshot JSON).

## Pull requests

- Keep changes focused and describe **what** and **why** in the PR body.
- Ensure CI checks pass (lint, unit tests, Playwright).

## Code of conduct

Be respectful and assume good intent in reviews and issues.
