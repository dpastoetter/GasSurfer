/** Block / network explorers (home URL) for chain detail links. */
export const CHAIN_EXPLORER_URL: Record<number, string> = {
  0: 'https://mempool.space',
  1: 'https://etherscan.io',
  137: 'https://polygonscan.com',
  56: 'https://bscscan.com',
  8453: 'https://basescan.org',
  42161: 'https://arbiscan.io',
  10: 'https://optimistic.etherscan.io',
  43114: 'https://snowtrace.io',
  250: 'https://ftmscan.com',
  59144: 'https://lineascan.build',
  100: 'https://gnosisscan.io',
  324: 'https://explorer.zksync.io',
  5000: 'https://explorer.mantle.xyz',
  42220: 'https://celoscan.io',
};

export function explorerUrlForChain(chainId: number): string | null {
  return CHAIN_EXPLORER_URL[chainId] ?? null;
}
