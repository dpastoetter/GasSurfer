# Privacy and data flows (Gas Surfer)

Gas Surfer is a **static web app** that runs in your browser. This page summarizes **what leaves your device** when you use it normally.

## No accounts

There is **no login**, no wallet connection, and **no personally identifiable information** collected by the app for its core features.

## Network requests from the browser

| Destination | What is sent | Why |
|---------------|--------------|-----|
| **Public RPC hosts** (see chain settings in the app) | JSON-RPC `POST` bodies such as `eth_gasPrice`, `eth_getBlockByNumber`, `eth_maxPriorityFeePerGas` | Read-only gas / fee data for each EVM chain. The hostname that answered is shown as the data source. |
| **mempool.space** | `GET` to the recommended-fees endpoint | Bitcoin fee tiers (sat/vB). |
| **CoinGecko** | `GET` to the simple price API with a list of public coin IDs | Fiat conversion for rough costs. No API key is used for this public endpoint. |
| **Same-origin `/api/...`** (only if you use the optional backend or dev proxy) | Depends on feature: e.g. fee samples, averages, optional tick `POST` | Optional SQLite-backed server for long-window averages / ticks; not required for basic gas display. |

## What stays on your device

- **localStorage / IndexedDB** — theme, locale, favorites, alert thresholds, onboarding flag, optional gas snapshot cache, optional custom surf bands, and local fee history samples for the weekly recap.
- **Clipboard** — only when you explicitly copy a fee or JSON snapshot.

## Shareable links (address bar)

Query parameters such as `chain`, `currency`, `lang`, `compare`, and `txPreset` are **read and written only in your browser** (`history.replaceState`). They are not sent to Gas Surfer as telemetry (the default deployment has no first-party analytics). Anyone you share the URL with can see the same encoded preferences; avoid putting sensitive information in URLs in general. Invalid or unsupported values are ignored or stripped client-side (see [DEVELOPMENT.md](DEVELOPMENT.md#shareable-url-state)).

## Optional tick reporting

If enabled in your build or deployment, the app may **POST anonymized fee snapshots** to your configured API. That payload reflects **public fee numbers** already shown on screen, not wallet addresses or transactions.

## Contact

For project-specific privacy questions, use the repository’s issue tracker linked from [README.md](../README.md).
