export type SurfCondition = 'surfs-up' | 'smooth' | 'choppy' | 'storm';

export type Currency = 'usd' | 'eur' | 'gbp' | 'jpy' | 'chf' | 'cad' | 'aud';

export const CURRENCIES: { value: Currency; label: string; symbol: string }[] = [
  { value: 'usd', label: 'US Dollar', symbol: '$' },
  { value: 'eur', label: 'Euro', symbol: '€' },
  { value: 'gbp', label: 'British Pound', symbol: '£' },
  { value: 'jpy', label: 'Japanese Yen', symbol: '¥' },
  { value: 'chf', label: 'Swiss Franc', symbol: 'CHF' },
  { value: 'cad', label: 'Canadian Dollar', symbol: 'C$' },
  { value: 'aud', label: 'Australian Dollar', symbol: 'A$' },
];

export interface GasTier {
  slow: number;   // gwei
  standard: number;
  fast: number;
}

export interface ChainGas {
  chainId: number;
  name: string;
  symbol: string;
  gas: GasTier;
  condition: SurfCondition;
  updatedAt: number;
  /** Human-readable data source (e.g. RPC hostname, mempool.space) */
  dataSource?: string;
}

/** Format gwei/sat per vB for display; uses more decimals for very small L2 values */
export function formatGwei(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '0';
  if (n >= 1) return String(Math.round(n));
  if (n >= 0.1) return n.toFixed(3);
  if (n >= 0.01) return n.toFixed(4);
  if (n >= 0.001) return n.toFixed(5);
  if (n >= 0.0001) return n.toFixed(6);
  if (n > 0) return n.toFixed(8);
  return '0';
}

/** Chain id for Bitcoin (non-EVM) */
export const BITCOIN_CHAIN_ID = 0;

/** Ethereum mainnet */
export const ETHEREUM_CHAIN_ID = 1;

/** Featured chains shown first (Bitcoin, Ethereum) */
export function isFeaturedChain(chainId: number): boolean {
  return chainId === BITCOIN_CHAIN_ID || chainId === ETHEREUM_CHAIN_ID;
}

/** Gas/fee cost in native token units. EVM: 21k gas in ETH etc. Bitcoin: ~250 B tx in BTC. */
export function gasCostInToken(chainId: number, value: number, gasUnitsOrBytes = 21_000): number {
  if (chainId === BITCOIN_CHAIN_ID) {
    return (250 * value) / 1e8; // 250 vB tx, value = sat/vB
  }
  return (gasUnitsOrBytes * value * 1e9) / 1e18;
}

/** Unit label for fee display */
export function feeUnitLabel(chainId: number): string {
  return chainId === BITCOIN_CHAIN_ID ? 'sat/vB' : 'gwei';
}

/** Cost description for display (e.g. "21k gas" or "~250 B tx") */
export function costLabel(chainId: number): string {
  return chainId === BITCOIN_CHAIN_ID ? '~250 B tx' : '21k gas';
}

/** Format fiat amount for display */
export function formatFiat(value: number, currency: Currency): string {
  if (value >= 1000) return `${formatFiatSymbol(currency)}${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (value >= 1) return `${formatFiatSymbol(currency)}${value.toFixed(2)}`;
  if (value >= 0.01) return `${formatFiatSymbol(currency)}${value.toFixed(4)}`;
  return `${formatFiatSymbol(currency)}${value.toFixed(6)}`;
}

function formatFiatSymbol(currency: Currency): string {
  const c = CURRENCIES.find((x) => x.value === currency);
  if (currency === 'chf') return (c?.symbol ?? '') + ' ';
  if (currency === 'jpy') return c?.symbol ?? '';
  return (c?.symbol ?? '') + (currency === 'usd' ? '' : ' ');
}
