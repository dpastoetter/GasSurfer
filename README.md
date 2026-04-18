# Gas Surfer

**Ride the network when it's cheap.** Real-time gas and fee tracker for Bitcoin, Ethereum, and 13 EVM chains with a surf-report vibe.

**Version:** 0.1.0 · **Source:** [GitHub](https://github.com/dpastoetter/GasSurfer)

### Screenshots

_Regenerated April 2026 with `npm run screenshot` (dev server running; see [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md#regenerating-screenshots) and [Pushing to GitHub](#pushing-to-github))._

| Desktop hero (1280×800) | Mobile (390×844) | Full page |
|------------------------|------------------|-----------|
| [![Gas Surfer desktop: surf report, featured chains, toolbar, learn/compare controls](docs/screenshots/hero.png)](docs/screenshots/hero.png) | [![Gas Surfer mobile layout with controls](docs/screenshots/mobile.png)](docs/screenshots/mobile.png) | [![Gas Surfer full-page scroll](docs/screenshots/full.png)](docs/screenshots/full.png) |

---

## Features

- **Bitcoin & Ethereum** — Featured widgets with Slow / Standard / Fast (sat/vB for Bitcoin, gwei for EVM)
- **13 EVM chains** — Base, Arbitrum, Optimism, Polygon, BSC, Avalanche, Fantom, Linea, Gnosis, zkSync Era, Mantle, Celo
- **Multi-currency** — USD, EUR, GBP, JPY, CHF, CAD, AUD with live conversion (pill selector)
- **Surf conditions** — "Surf's up", "Smooth", "Choppy", or "Storm" from current fees
- **Fee averages** — 7 / 30 / 90 / 180-day averages (optional backend DB or in-browser; see below)
- **Trend vs 7d** — Current fee compared to 7-day average (↓/↑ %)
- **Best deal** — Highlights the chain with the lowest standard-tx cost in your currency
- **Mini chart** — Recent fee trend for the selected chain (with 7d avg reference line)
- **Dark / light mode** — Toggle with persistence (localStorage)
- **Skeleton loading** — Layout placeholders while gas data loads
- **Copy fee** — One-click copy of the current chain’s standard fee
- **Auto-refresh** — Gas ~12s, prices ~1 min. No API keys required for the frontend.
- **Favorites & compare** — Star chains (pinned order), compare up to three side-by-side with freshness/source hints; **shareable URLs** keep `compare=` (and related query params) in sync via `replaceState` ([URL parameters](#url-parameters-shareable-links))
- **Learn & tour** — Learn drawer (gwei / L2 / Bitcoin) and optional first-visit onboarding
- **Tx estimator** — Rough fee for preset gas limits on the selected EVM chain (+ fiat); optional **`txPreset=`** in the URL opens with matching gas (see [URL parameters](#url-parameters-shareable-links))
- **Card sparklines** — Tiny recent standard-fee trends on chain cards
- **Share & recap** — PNG snapshot (share or download) and a local-only weekly recap (IndexedDB samples)
- **Trust cues** — Per-chain data age and RPC / mempool source label

**Privacy / data inventory:** [docs/PRIVACY.md](docs/PRIVACY.md) (what leaves the browser: RPCs, mempool.space, CoinGecko, optional API).

---

## Quick start

From the **`gas-surfer`** directory:

```bash
cd gas-surfer
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) (or the port Vite prints if 5173 is in use).

### URL parameters (shareable links)

The address bar stays in sync with core UI state (no extra history entries). Useful for bookmarks or sharing a specific view.

| Parameter   | Example | Meaning |
|------------|---------|---------|
| `chain`    | `chain=1` | Selected chain ID (e.g. `1` Ethereum, `0` Bitcoin, `8453` Base). |
| `currency` | `currency=eur` | Fiat display: `usd`, `eur`, `gbp`, `jpy`, `chf`, `cad`, `aud`. |
| `lang`     | `lang=de` | UI language: `en`, `de`, `es`. |
| `compare`  | `compare=1,8453` | Up to **three** allowlisted chain IDs for the compare dialog (invalid or unknown IDs are ignored once data loads). |
| `txPreset` | `txPreset=nft` | Tx estimator preset: `erc20`, `nft`, or `swap` (gas limit); cleared when the user edits the gas field manually. |

Implementation: [`src/hooks/useUrlSync.ts`](src/hooks/useUrlSync.ts), [`src/lib/urlQuerySchema.ts`](src/lib/urlQuerySchema.ts). Details for contributors: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md#shareable-url-state).

**Optional — fee averages from a backend (SQLite):**

```bash
npm run dev:all   # runs API on :3001 + Vite on :5173
```

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for the API and database.

---

## Build & deploy

```bash
npm run build
npm run preview   # local preview of production build
```

Deploy the `dist/` folder to any static host (Vercel, Netlify, GitHub Pages, etc.). The app works without a backend; RPC and CoinGecko are called from the client. For 7d/30d/90d/180d averages from a **database**, run and deploy the optional API (see [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)).

---

## Tech stack

| Layer        | Choice                    |
|-------------|---------------------------|
| Build       | Vite 7                    |
| UI          | React 19 + TypeScript     |
| Styles      | Tailwind CSS v4           |
| Data        | Public RPCs, CoinGecko, mempool.space |
| Backend (optional) | Node, Express, SQLite (sql.js) |

---

## Data sources

- **EVM gas** — Public RPCs with fallbacks per chain; EIP-1559 chains use effective base + priority when the node exposes it, otherwise `eth_gasPrice`
- **Bitcoin fees** — [mempool.space](https://mempool.space) recommended fees (sat/vB)
- **Prices** — [CoinGecko](https://www.coingecko.com/en/api) simple/price (no key)

All URLs are allowlisted in `src/config/chains.ts` for safe use as a static website.

---

## Security

- **Reporting vulnerabilities** — See [SECURITY.md](SECURITY.md) for how to report security issues and for a short description of this project’s security model.
- **Frontend:** static site, no API keys; all endpoints are public and allowlisted; CSP and referrer policy are set in `index.html`.
- **Backend (optional):** see [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for rate limiting, CORS, input validation, and deployment notes.

---

## Documentation

- **[CONTRIBUTING.md](CONTRIBUTING.md)** — Local setup, env vars, tests, screenshots, PR checklist
- **[docs/PRIVACY.md](docs/PRIVACY.md)** — Outbound requests and what stays on the device
- **[docs/V0.1.md](docs/V0.1.md)** — Version 0.1 user guide and release notes
- **[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)** — Config, adding chains, project layout, backend API, security
- **[CHANGELOG.md](CHANGELOG.md)** — Notable changes

### Tests

From `gas-surfer`: `npm run lint`, `npm run test`, `npm run build`, then `npm run test:e2e` (install browsers once with `npx playwright install chromium`). Details are in [CONTRIBUTING.md](CONTRIBUTING.md#checks-before-a-pr).

---

## Pushing to GitHub

- Run `npm run lint`, `npm run test`, `npm run build`, and (when possible) `npm run test:e2e` in `gas-surfer` before pushing.
- The repo can be the `gas-surfer` folder only, or the parent folder (with root `package.json` that delegates to `gas-surfer`). Ensure `.gitignore` excludes `node_modules`, `dist`, and `server/gas-surfer.db`.
- Screenshots in `docs/screenshots/` are tracked in git. To refresh them: install Chromium once (`npx playwright install chromium`), start the dev server, then `npm run screenshot` (set `BASE_URL` / `SCREENSHOT_WAIT` if needed). On some hosts Playwright needs Vite bound to IPv4 — see [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md#regenerating-screenshots).

---

## License

[MIT](LICENSE)
