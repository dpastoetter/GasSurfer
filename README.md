# Gas Surfer

**Ride the network when it's cheap.** Real-time gas and fee tracker for Bitcoin, Ethereum, and 13 EVM chains with a surf-report vibe.

**Version:** 0.1.0 · **Source:** [GitHub](https://github.com/dpastoetter/GasSurfer)

### Screenshots

| Desktop | Mobile | Full page |
|--------|--------|-----------|
| [![Hero](docs/screenshots/hero.png)](docs/screenshots/hero.png) | [![Mobile](docs/screenshots/mobile.png)](docs/screenshots/mobile.png) | [![Full](docs/screenshots/full.png)](docs/screenshots/full.png) |

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

---

## Quick start

From the **`gas-surfer`** directory:

```bash
cd gas-surfer
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) (or the port Vite prints if 5173 is in use).

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

- **EVM gas** — `eth_gasPrice` via public RPCs (multiple fallbacks per chain)
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

- **[docs/V0.1.md](docs/V0.1.md)** — Version 0.1 user guide and release notes
- **[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)** — Config, adding chains, project layout, backend API, security

---

## Pushing to GitHub

- Run `npm run build` and `npm run lint` in `gas-surfer` before pushing.
- The repo can be the `gas-surfer` folder only, or the parent folder (with root `package.json` that delegates to `gas-surfer`). Ensure `.gitignore` excludes `node_modules`, `dist`, and `server/gas-surfer.db`.
- Screenshots in `docs/screenshots/` are tracked in git. To refresh them: start the app, then `npx playwright install chromium` (once), then `npm run screenshot`. See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md#regenerating-screenshots).

---

## License

[MIT](LICENSE)
