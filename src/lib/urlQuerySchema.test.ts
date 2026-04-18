import { describe, it, expect } from 'vitest';
import { parseCompareQueryParam, parseTxPresetQueryParam } from './urlQuerySchema';

describe('parseCompareQueryParam', () => {
  it('returns empty for null or empty', () => {
    expect(parseCompareQueryParam(null)).toEqual([]);
    expect(parseCompareQueryParam('')).toEqual([]);
  });

  it('caps at three ids', () => {
    expect(parseCompareQueryParam('1,8453,42161,10,137')).toEqual([1, 8453, 42161]);
  });
});

describe('parseTxPresetQueryParam', () => {
  it('accepts erc20 nft swap case-insensitive', () => {
    expect(parseTxPresetQueryParam('ERC20')).toBe('erc20');
    expect(parseTxPresetQueryParam('swap')).toBe('swap');
  });
});
