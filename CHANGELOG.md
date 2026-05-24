# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- **Field-leading pack:** Send Window Score + calendar reminder; Best chain for action ranking; Learn methodology + RPC divergence flag; webhook alerts; `/embed` and `/badge/{chainId}` routes; `GET /api/status` on optional API; [docs/INTEGRATIONS.md](docs/INTEGRATIONS.md).
- **Balanced usefulness v2:** actionable **cheaper-chain callout** (switch chain or dismiss for the week); weekly recap **PNG share/download**; PWA **icons**, install prompt, and manifest **Kiosk** shortcut (`/?widget=1&chain=1`).
- **Balanced engagement pack:** `?widget=1` kiosk layout; compare dialog **Copy link**; condition-transition toast on the selected chain; Ethereum **tide table** from local fee samples; weekly recap nudge dot when recap data is ready (all client-only).
- **Shareable URLs:** `compare=` (up to three allowlisted chain IDs) and `txPreset=` (`erc20` \| `nft` \| `swap`) in the query string; hydration on load; `history.replaceState` sync from [`useUrlSync`](src/hooks/useUrlSync.ts). Parsers and allowlist in [`urlQuerySchema`](src/lib/urlQuerySchema.ts). Playwright smoke coverage for compare dialog and estimator gas limit.
- Documentation: README **URL parameters** table; [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) **Shareable URL state**; CONTRIBUTING screenshot troubleshooting; refreshed [docs/screenshots/](docs/screenshots/) (hero / full / mobile).
- RPC transparency: `fetchMeta` (attempt count + winning host) on `ChainGas`, detail drawer highlights, DataFreshness hints.
- `GET /api/ticks/recent` for optional server-side fee history; mini chart blends recent ticks when the API returns data.
- Offline UX: last successful gas snapshot saved in `localStorage`; when offline, the UI can show that snapshot with a clear banner.
- Fee alerts: optional browser notifications when surf **conditions** improve or worsen (separate from below-threshold alerts).
- Contributor docs: `CONTRIBUTING.md`, issue/PR templates, Dependabot for npm.
- **Trust & clarity:** Learn drawer sections for “Standard”, EIP-1559 vs legacy fees, Bitcoin tier mapping, and L1/L2 bridge context; footer bridge disclaimer; clearer stale-vs-offline copy; link from the surf report to Learn.
- **Privacy:** [docs/PRIVACY.md](docs/PRIVACY.md) — what leaves the browser (RPCs, mempool.space, CoinGecko, optional API); linked from README and CONTRIBUTING.
- **`GET /api/health`** on the optional Express API (`server/app.js`) for deployment probes.
- **API contract tests** (`src/serverApiContract.test.ts`) for health, averages validation, and ticks/recent.
- **Playwright smoke tests** route mocks for mempool, CoinGecko, and JSON-RPC so CI does not depend on live public endpoints.
- **SEO / sharing:** `WebApplication` JSON-LD and dedicated `og-card.svg` (absolute `og:image` / `twitter:image` for gassurfer.app).
- **Power users:** optional per-chain surf band overrides (`localStorage`), jittered gas/token refresh intervals, and optional RPC round-trip time on EVM updates (chain detail).

### Changed

- **Vitest** dev dependency updated to **4.x** (from 3.x); `tsconfig.app.json` includes `"node"` in `compilerOptions.types` so `tsc -b` resolves `node:http` in API contract tests after the lockfile refresh; `.github/dependabot.yml` no longer references a missing `dependencies` label.
- Mini chart uses merged local + server history when available.
- Express app factory lives in `server/app.js`; `server/index.js` only listens (easier testing).
