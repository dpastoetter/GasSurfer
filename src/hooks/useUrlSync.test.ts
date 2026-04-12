import { describe, it, expect, afterEach, vi } from 'vitest';
import { readUrlParams } from './useUrlSync';

describe('readUrlParams', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('parses chain, currency, and lang', () => {
    vi.stubGlobal('window', {
      location: { search: '?chain=137&lang=es&currency=eur' },
    });
    expect(readUrlParams()).toEqual({
      chainId: 137,
      currency: 'eur',
      lang: 'es',
    });
  });

  it('returns nulls for invalid chain and unknown lang', () => {
    vi.stubGlobal('window', {
      location: { search: '?chain=xx&lang=fr' },
    });
    expect(readUrlParams()).toEqual({
      chainId: null,
      currency: null,
      lang: null,
    });
  });
});
