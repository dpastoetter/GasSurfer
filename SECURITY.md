# Security Policy

## Reporting a vulnerability

If you discover a security vulnerability in Gas Surfer, please report it responsibly:

- **Do not** open a public GitHub issue for security-sensitive findings.
- Email the maintainer with a clear description and steps to reproduce. You can reach the maintainer via the contact options on their [GitHub profile](https://github.com/dpastoetter).
- Allow a reasonable time for a fix before disclosing publicly.

We will acknowledge your report and, if the issue is accepted, work on a fix. We appreciate responsible disclosure.

---

## Security model of this project

- **Static site** — Gas Surfer is a client-only web app. There is no backend; the built `dist/` is static HTML, CSS, and JavaScript.
- **No secrets** — The repository and the deployed app use only public endpoints (RPCs, mempool.space, CoinGecko). No API keys or credentials are required or stored.
- **Allowlisted URLs** — All external URLs are defined in `src/config/chains.ts`; the app only connects to those origins.
- **Content Security Policy** — `index.html` sets a CSP (script, style, connect, font, img) and a strict referrer policy to reduce risk when hosted as a static site.
- **User data** — Fee averages are stored only in the browser (`localStorage`); nothing is sent to our servers (we have none).

If you depend on this app for critical decisions, consider auditing the code and the third-party services it calls (RPC providers, mempool.space, CoinGecko).
