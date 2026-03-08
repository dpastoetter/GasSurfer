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
│   └── screenshot.mjs      # Playwright script for README screenshots
├── server/                  # Backend API for fee averages
│   ├── index.js             # Express: POST /api/samples, GET /api/averages
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

## Dev server proxy

`vite.config.ts` proxies:
- `/api/samples` and `/api/averages` → backend (e.g. `http://localhost:3001`) when running the API server.
- `/api/rpc/<chain>` → corresponding public RPC in development to avoid CORS.

Production: deploy the API server and point the frontend at it (or use the same host with a reverse proxy). The app calls RPC URLs directly when not in dev.

---

## Surf condition thresholds

In `useGasPrices.ts`, `getCondition(standardFee, chainId)` maps the standard fee to a condition. Bitcoin uses sat/vB bands (e.g. 5 / 15 / 50). EVM chains use gwei bands; L2s use lower bands than L1. Adjust the numeric thresholds in `getCondition` to tune “Surf’s up” vs “Storm”.

---

## Build and checks

```bash
npm run build   # tsc -b && vite build
npm run preview # serve dist/
npm run lint    # eslint
```

### Regenerating screenshots

1. Install Playwright’s Chromium once: `npx playwright install chromium`
2. Start the dev server (e.g. `npm run dev`); if Vite uses another port, set `BASE_URL` when running the script.
3. In another terminal run: `npm run screenshot` (or `BASE_URL=http://localhost:5174 npm run screenshot` if the app is on 5174).

This saves `docs/screenshots/hero.png`, `full.png`, and `mobile.png` (used in the README). Optional: `SCREENSHOT_WAIT=8000` to wait longer for data before capturing.

---

## Security

- **Static frontend**: No secrets in the repo; RPC/CoinGecko endpoints are public. `index.html` sets CSP and referrer policy.
- **Backend**: See *Fee averages → Backend security* above. Set `ALLOWED_ORIGINS` in production and run behind HTTPS; use a reverse proxy (e.g. nginx) for TLS. If the API is behind a proxy, set `TRUST_PROXY=1` so rate limiting uses the client IP (`X-Forwarded-For`).
