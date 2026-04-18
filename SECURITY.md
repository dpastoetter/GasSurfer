# Security Policy

## Reporting a vulnerability

If you discover a security vulnerability in Gas Surfer, please report it responsibly:

- **Do not** open a public GitHub issue for security-sensitive findings.
- Email the maintainer with a clear description and steps to reproduce. You can reach the maintainer via the contact options on their [GitHub profile](https://github.com/dpastoetter).
- Allow a reasonable time for a fix before disclosing publicly.

We will acknowledge your report and, if the issue is accepted, work on a fix. We appreciate responsible disclosure.

---

## Security model of this project

- **Static frontend** — The shipped UI is a client-only bundle (`dist/`). You can host it on any static file host. An **optional** self-hosted Node + SQLite API (same repo) can back fee averages and ticks; it is not required for basic gas display (see [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)).
- **No secrets in the client** — The app uses only public endpoints (RPCs, mempool.space, CoinGecko). No API keys are required for those flows.
- **Allowlisted URLs** — External origins used for gas and prices are defined in `src/config/chains.ts` and related config; the client only connects to those targets for core features.
- **Content Security Policy** — `index.html` sets a CSP (script, style, connect, font, img) and a strict referrer policy to reduce risk when hosted as a static site.
- **User data** — Preferences, favorites, and similar state stay in the browser unless you opt into features that POST to **your** configured API. Query parameters for shareable views (`chain`, `compare`, etc.) are synchronized client-side; see [docs/PRIVACY.md](docs/PRIVACY.md).

If you depend on this app for critical decisions, consider auditing the code and the third-party services it calls (RPC providers, mempool.space, CoinGecko).
