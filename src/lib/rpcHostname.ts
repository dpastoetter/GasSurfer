/** Hostname from an RPC URL for display (no credentials). */
export function rpcHostname(rpcUrl: string): string {
  try {
    const u = new URL(rpcUrl);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return 'RPC';
  }
}
