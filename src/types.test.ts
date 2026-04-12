import { describe, it, expect } from 'vitest';
import { formatGwei } from './types';

describe('formatGwei', () => {
  it('rounds values >= 1', () => {
    expect(formatGwei(12.4)).toBe('12');
    expect(formatGwei(1)).toBe('1');
  });

  it('uses more decimals for small positive values', () => {
    expect(formatGwei(0.5)).toBe('0.500');
    expect(formatGwei(0.05)).toBe('0.0500');
  });

  it('handles invalid input', () => {
    expect(formatGwei(NaN)).toBe('0');
    expect(formatGwei(-1)).toBe('0');
  });
});
