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
      compareIds: [],
      txPreset: null,
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
      compareIds: [],
      txPreset: null,
    });
  });

  it('parses compare= comma chain ids (max 3, allowlisted)', () => {
    vi.stubGlobal('window', {
      location: { search: '?compare=1,8453,42161' },
    });
    expect(readUrlParams().compareIds).toEqual([1, 8453, 42161]);
  });

  it('drops unknown and duplicate chain ids in compare', () => {
    vi.stubGlobal('window', {
      location: { search: '?compare=1,99999,1,8453' },
    });
    expect(readUrlParams().compareIds).toEqual([1, 8453]);
  });

  it('parses txPreset for estimator', () => {
    vi.stubGlobal('window', {
      location: { search: '?txPreset=nft' },
    });
    expect(readUrlParams().txPreset).toBe('nft');
  });

  it('rejects invalid txPreset', () => {
    vi.stubGlobal('window', {
      location: { search: '?txPreset=mint' },
    });
    expect(readUrlParams().txPreset).toBe(null);
  });
});
