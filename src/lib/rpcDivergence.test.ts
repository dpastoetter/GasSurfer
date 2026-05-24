import { describe, it, expect } from 'vitest';
import { feesAreDivergent } from './rpcDivergence';

describe('feesAreDivergent', () => {
  it('detects large relative spread', () => {
    expect(feesAreDivergent(10, 20)).toBe(true);
  });

  it('ignores small spread', () => {
    expect(feesAreDivergent(10, 11)).toBe(false);
  });
});
