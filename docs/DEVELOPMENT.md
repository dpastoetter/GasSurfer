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
│   ├── useFeeAverages.ts    # 7/30/90/180d averages from feeHistory
│   ├── useChartHistory.ts   # Rolling history for mini chart
│   ├── feeHistory.ts        # localStorage read/write for fee samples
│   ├── SurfReport.tsx       # Hero surf report (selected chain)
│   ├── FeaturedChainWidget.tsx
│   ├── ChainCard.tsx
│   ├── MiniChart.tsx
│   ├── CurrencySelector.tsx
│   └── FeeAveragesDisplay.tsx
├── public/
└── docs/
```

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

`vite.config.ts` proxies `/api/rpc/<chain>` to the corresponding public RPC in development to avoid CORS. Production build does not use the proxy; the app calls the same RPC URLs directly (from `EVM_CHAINS` when `import.meta.env.DEV` is false).

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

---

## Security (static site)

- No secrets in the repo; all endpoints are public.
- `index.html` sets a Content-Security-Policy (script, style, connect, font, img, etc.) and referrer policy so the app is safe to host as a static website.
