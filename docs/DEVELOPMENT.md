# Gas Surfer — Development

## Project layout

```
gas-surfer/
├── index.html
├── vite.config.ts
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css           # Tailwind + theme (surf, foam, storm, glass)
│   ├── config/
│   │   └── chains.ts       # EVM_CHAINS, MEMPOOL_API, COINGECKO_API_BASE
│   ├── types.ts            # Currency, GasTier, ChainGas, formatGwei, BITCOIN_CHAIN_ID, etc.
│   ├── useGasPrices.ts      # RPC gas + Bitcoin fees, useGasPrices(), CHAIN_COINGECKO_IDS
│   ├── useTokenPrices.ts    # CoinGecko prices, useTokenPrices()
│   ├── useFeeAverages.ts    # 7/30/90/180d averages from backend API
│   ├── useChartHistory.ts   # Rolling history for mini chart
│   ├── hooks/
│   │   ├── useUrlSync.ts    # readUrlParams + replaceState sync (chain, currency, lang, compare, txPreset)
│   │   └── …                # favorites, spark history, onboarding, etc.
│   ├── lib/
│   │   └── urlQuerySchema.ts # parse compare= / txPreset= (allowlisted chain IDs)
│   ├── feeHistory.ts        # FeeAverages type only (storage is backend)
│   ├── api/
│   │   └── averages.ts      # postSamples(), getAverages() for backend
│   ├── SurfReport.tsx       # Hero surf report (selected chain)
│   ├── FeaturedChainWidget.tsx
│   ├── ChainCard.tsx
│   ├── MiniChart.tsx
│   ├── CurrencySelector.tsx
│   └── FeeAveragesDisplay.tsx
├── public/
├── scripts/
│   └── screenshot.mjs      # Playwright: hero/full/mobile PNGs for README
├── tests/
│   └── smoke.spec.ts       # Playwright (title, a11y, URL compare & txPreset hydration)
├── server/                  # Backend API for fee averages
│   ├── app.js               # Express app (routes + middleware); importable for tests
│   ├── app.d.ts             # Type shim for `app.js` (tsc)
│   ├── index.js             # Listens on PORT (default 3001)
│   ├── db.js                # SQLite: one value per day per chain
│   ├── middleware.js        # Helmet, CORS, rate limiting
│   └── security.js         # Input validation (chainId allowlist, value/timestamp)
└── docs/
    └── screenshots/         # Screenshots for README (hero.png, full.png, mobile.png)
```

---

## Fee averages (backend database)

7d / 30d / 90d / 180d averages are stored in a **backend database** (SQLite). The backend stores **one value per day per chain**; the service computes averages from those daily values.

- **Server**: run `npm run server` (or `npm run dev:all` to run server + Vite together). Listens on port 3001 by default (`PORT` env).
- **Endpoints**:
  - `GET /api/health` — JSON `{ "ok": true, "service": "gas-surfer-api" }` for load balancers and smoke checks (no DB hit).
  - `POST /api/samples` — body `{ "samples": [ { "chainId", "value", "timestamp" } ] }`. First sample per (chain_id, date) is stored; later samples for the same day are ignored (no overwrite) to avoid spamming the database.
  - `GET /api/averages?chainIds=1,0,8453` — returns `{ [chainId]: { avg7d, avg30d, avg90d, avg180d } }`.
- **Database**: SQLite file at `server/gas-surfer.db` (or `GAS_SURFER_DB` env). Table `daily_fees (chain_id, date, value, updated_at)`.
- **Frontend**: When gas data updates, the app POSTs samples and GETs averages. If the server is not running, averages are empty.

### Backend security

- **Helmet** — Security headers (X-Content-Type-Options, X-Frame-Options, etc.); CSP and COEP disabled so the app can load external resources.
- **CORS** — In dev, origins `http://localhost:5173`, `http://localhost:5174`, `127.0.0.1` are allowed. In production set `ALLOWED_ORIGINS` (comma-separated) to your frontend origin(s); otherwise CORS is disabled.
- **Rate limiting** — POST `/api/samples`: 30 req/min per IP. GET `/api/averages`: 120 req/min per IP. Responses use `RateLimit-*` headers.
- **Body limit** — JSON body limited to 16 KB.
- **Input validation**:
  - **chainId** — Allowlist only (Bitcoin 0 + known EVM chain IDs). Unknown IDs are rejected.
  - **value** — Must be in `[0, 1e12]` (gwei/sat).
  - **timestamp** — Must be within last 25 hours and not in the future (small clock skew allowed).
  - **samples** — Max 20 per request. **chainIds** — Max 20 per request, no duplicates.
- **Errors** — 500 responses return a generic message; stack traces are never sent to clients.

---

## Configuration

### Chains and APIs (`src/config/chains.ts`)

- **EVM chains** — Each entry has `chainId`, `name`, `symbol`, `coinGeckoId`, `rpcUrls`. In dev, `rpcUrls` starts with `/api/rpc/<chain>` (Vite proxy) then fallbacks; in production only public RPC URLs are used.
- **Bitcoin** — Not in `EVM_CHAINS`; fetched separately via `MEMPOOL_API` (mempool.space).
- **CoinGecko** — `COINGECKO_API_BASE` is used by `useTokenPrices`; coin IDs are derived from `CHAIN_COINGECKO_IDS` in `useGasPrices.ts`.

### Adding an EVM chain

1. In `src/config/chains.ts`:
   - Add an `RPC_*` array with public RPC URLs.
   - Add an entry to `EVM_CHAINS`: `chainId`, `name`, `symbol`, `coinGeckoId`, `rpcUrls: devProxy('slug', RPC_XXX)`.
2. In `vite.config.ts` (optional, for dev): add a proxy entry `'/api/rpc/slug': { target: 'https://...', changeOrigin: true, rewrite: () => '/' }`.
3. Add the chain’s CoinGecko id to the new entry; `CHAIN_COINGECKO_IDS` is built from `EVM_CHAINS` plus Bitcoin in `useGasPrices.ts`, so no change there.

### Adding a currency

1. In `src/types.ts`: add the currency to the `Currency` type and to `CURRENCIES` (value, label, symbol).
2. In `src/useTokenPrices.ts`: add the currency to `VS_CURRENCIES` so CoinGecko returns it.

---

## Shareable URL state

The app mirrors selected chain, currency, locale, compare selection, and tx-estimator preset into the query string with **`history.replaceState`** (no new browser history entries). On first load, `readUrlParams()` in [`src/hooks/useUrlSync.ts`](../src/hooks/useUrlSync.ts) parses the current `window.location.search`.

| Query param | Notes |
|-------------|--------|
| `chain` | Selected `chainId` (integer). |
| `currency` | One of the supported fiat codes. |
| `lang` | `en` \| `de` \| `es`. |
| `compare` | Comma-separated list, **max three** unique IDs. Only IDs in [`URL_QUERY_CHAIN_IDS`](../src/lib/urlQuerySchema.ts) (Bitcoin `0` + configured EVM chains) are kept; order preserved. |
| `txPreset` | `erc20` \| `nft` \| `swap` — matches Tx estimator preset gas limits in [`TX_PRESET_GAS_LIMIT`](../src/lib/urlQuerySchema.ts). |

**Hydration in [`App.tsx`](../src/App.tsx):** `compareIds` state is seeded from the URL; once `displayChains` is non-empty, the UI and `useUrlSync` use a **`compareIdsForUrl` memo** that filters to known chains (unknown IDs never appear in the synced URL). Compare dialog auto-opens when the initial URL contained at least one valid `compare` id.

**Tx estimator ([`TxEstimatorPanel.tsx`](../src/components/TxEstimatorPanel.tsx)):** When `txPreset` is set, the gas limit follows the preset until the user types in the gas field (that clears `txPreset` from state and the URL). Choosing a preset button sets both limit and URL again.

**Tests:** [`src/lib/urlQuerySchema.test.ts`](../src/lib/urlQuerySchema.test.ts), [`src/hooks/useUrlSync.test.ts`](../src/hooks/useUrlSync.test.ts); Playwright smoke loads `?compare=1,8453` and `?chain=1&txPreset=nft` in [`tests/smoke.spec.ts`](../tests/smoke.spec.ts).

---

## Dev server proxy

`vite.config.ts` proxies:
- `/api/samples` and `/api/averages` → backend (e.g. `http://localhost:3001`) when running the API server.
- `/api/rpc/<chain>` → corresponding public RPC in development to avoid CORS.

Production: deploy the API server and point the frontend at it (or use the same host with a reverse proxy). The app calls RPC URLs directly when not in dev.

---

## Surf condition thresholds

Default bands live in `src/lib/surfCondition.ts` (`getSurfCondition`). Bitcoin uses sat/vB thresholds; EVM uses gwei with lower defaults on L2. **User overrides:** the “Advanced: custom surf bands” panel (see `src/components/SurfBandsPanel.tsx`) stores optional per-chain low / mid / high values in `localStorage` under `gas-surfer-surf-bands-v1`; `useGasPrices` reads them on each refresh. Edit `surfCondition.ts` defaults to change app-wide behavior for everyone.

---

## Build and checks

```bash
npm run lint    # eslint
npm run test    # vitest (unit + src/serverApiContract.test.ts — Express app in-process)
npm run build   # tsc -b && vite build
npm run preview # serve dist/
```

**End-to-end (Playwright):** `npm run test:e2e` builds the app, serves `dist/` with `vite preview`, and runs `tests/smoke.spec.ts`. The spec **mocks** mempool.space, CoinGecko, and JSON-RPC traffic so results do not depend on public RPC health. First time (or after a Playwright upgrade), install browsers: `npx playwright install chromium`.

### Regenerating screenshots

1. Install Playwright’s Chromium once: `npx playwright install chromium`
2. Start the dev server (e.g. `npm run dev`); if Vite uses another port, set `BASE_URL` when running the script. If Playwright reports `ECONNREFUSED` while Vite is up, bind explicitly (e.g. `npx vite --host 127.0.0.1 --strictPort`) and run `BASE_URL=http://127.0.0.1:5173 npm run screenshot`.
3. In another terminal run: `npm run screenshot` (or `BASE_URL=http://localhost:5174 npm run screenshot` if the app is on 5174).

This saves `docs/screenshots/hero.png`, `full.png`, and `mobile.png` (used in the README). Optional: `SCREENSHOT_WAIT=8000` (or higher) to wait longer for live RPC data before capturing.

The script skips onboarding via `localStorage` so captures show the main dashboard. **Commit** updated PNGs when you refresh marketing screenshots.

---

## Security

- **Static frontend**: No secrets in the repo; RPC/CoinGecko endpoints are public. `index.html` sets CSP and referrer policy.
- **Backend**: See *Fee averages → Backend security* above. Set `ALLOWED_ORIGINS` in production and run behind HTTPS; use a reverse proxy (e.g. nginx) for TLS. If the API is behind a proxy, set `TRUST_PROXY=1` so rate limiting uses the client IP (`X-Forwarded-For`).
