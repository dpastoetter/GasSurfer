/**
 * External API and chain configuration.
 * All URLs are allowlisted for safe use in production (static website).
 */

const RPC_ETH = [
  'https://eth.llamarpc.com',
  'https://rpc.ankr.com/eth',
  'https://cloudflare-eth.com',
  'https://ethereum.publicnode.com',
  'https://1rpc.io/eth',
];
const RPC_BASE = ['https://mainnet.base.org', 'https://base.llamarpc.com'];
const RPC_ARB = ['https://arb1.arbitrum.io/rpc', 'https://arbitrum.llamarpc.com'];
const RPC_POLY = [
  'https://polygon.drpc.org',
  'https://polygon.publicnode.com',
  'https://polygon.llamarpc.com',
  'https://rpc.ankr.com/polygon',
  'https://1rpc.io/matic',
];
const RPC_OP = ['https://mainnet.optimism.io', 'https://optimism.llamarpc.com'];
const RPC_BSC = ['https://bsc-dataseed.binance.org', 'https://bsc.llamarpc.com'];
const RPC_AVAX = ['https://api.avax.network/ext/bc/C/rpc', 'https://avax.llamarpc.com'];
const RPC_FTM = [
  'https://fantom-rpc.publicnode.com',
  'https://rpc.ankr.com/fantom',
  'https://fantom.llamarpc.com',
  'https://rpc.ftm.tools',
];
const RPC_LINEA = ['https://rpc.linea.build', 'https://linea.llamarpc.com'];
const RPC_GNOSIS = ['https://rpc.gnosischain.com', 'https://gnosis.llamarpc.com'];
const RPC_ZKSYNC = ['https://zksync.drpc.org', 'https://mainnet.era.zksync.io'];
const RPC_MANTLE = ['https://rpc.mantle.xyz', 'https://mantle.llamarpc.com'];
const RPC_CELO = ['https://celo.llamarpc.com', 'https://rpc.ankr.com/celo'];

const isDev = import.meta.env.DEV;

const devProxy = (path: string, fallbacks: readonly string[]): string[] =>
  isDev ? [`/api/rpc/${path}`, ...fallbacks] : [...fallbacks];

export const EVM_CHAINS = [
  { chainId: 1, name: 'Ethereum', symbol: 'ETH', coinGeckoId: 'ethereum', rpcUrls: devProxy('eth', RPC_ETH) },
  { chainId: 8453, name: 'Base', symbol: 'ETH', coinGeckoId: 'ethereum', rpcUrls: devProxy('base', RPC_BASE) },
  { chainId: 42161, name: 'Arbitrum One', symbol: 'ETH', coinGeckoId: 'ethereum', rpcUrls: devProxy('arbitrum', RPC_ARB) },
  { chainId: 10, name: 'Optimism', symbol: 'ETH', coinGeckoId: 'ethereum', rpcUrls: devProxy('optimism', RPC_OP) },
  { chainId: 137, name: 'Polygon', symbol: 'MATIC', coinGeckoId: 'matic-network', rpcUrls: devProxy('polygon', RPC_POLY) },
  { chainId: 56, name: 'BNB Smart Chain', symbol: 'BNB', coinGeckoId: 'binancecoin', rpcUrls: devProxy('bsc', RPC_BSC) },
  { chainId: 43114, name: 'Avalanche C-Chain', symbol: 'AVAX', coinGeckoId: 'avalanche-2', rpcUrls: devProxy('avax', RPC_AVAX) },
  { chainId: 250, name: 'Fantom', symbol: 'FTM', coinGeckoId: 'fantom', rpcUrls: devProxy('fantom', RPC_FTM) },
  { chainId: 59144, name: 'Linea', symbol: 'ETH', coinGeckoId: 'ethereum', rpcUrls: devProxy('linea', RPC_LINEA) },
  { chainId: 100, name: 'Gnosis', symbol: 'xDAI', coinGeckoId: 'xdai', rpcUrls: devProxy('gnosis', RPC_GNOSIS) },
  { chainId: 324, name: 'zkSync Era', symbol: 'ETH', coinGeckoId: 'ethereum', rpcUrls: devProxy('zksync', RPC_ZKSYNC) },
  { chainId: 5000, name: 'Mantle', symbol: 'MNT', coinGeckoId: 'mantle', rpcUrls: devProxy('mantle', RPC_MANTLE) },
  { chainId: 42220, name: 'Celo', symbol: 'CELO', coinGeckoId: 'celo', rpcUrls: devProxy('celo', RPC_CELO) },
] as const;

/** Mempool.space API for Bitcoin fee recommendations (sat/vB). */
export const MEMPOOL_API = 'https://mempool.space/api/v1/fees/recommended';

/** CoinGecko API base (no key required for simple/price). */
export const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3/simple/price';
