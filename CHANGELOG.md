# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

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

- Mini chart uses merged local + server history when available.
- Express app factory lives in `server/app.js`; `server/index.js` only listens (easier testing).
