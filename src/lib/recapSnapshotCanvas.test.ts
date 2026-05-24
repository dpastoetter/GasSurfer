import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { drawRecapSnapshot, recapBestFeeLine } from './recapSnapshotCanvas';

describe('recapSnapshotCanvas', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'HTMLCanvasElement',
      class {
        width = 0;
        height = 0;
        getContext() {
          return {
            createLinearGradient: () => ({ addColorStop: () => {} }),
            fillRect: () => {},
            fillText: () => {},
            fillStyle: '',
            font: '',
          };
        }
        toBlob(cb: (b: Blob | null) => void) {
          cb(new Blob(['x'], { type: 'image/png' }));
        }
      }
    );
    vi.stubGlobal(
      'document',
      {
        createElement: () => new HTMLCanvasElement(),
      } as unknown as Document
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns a PNG blob', async () => {
    const blob = await drawRecapSnapshot({
      samples: 100,
      bestName: 'Base',
      bestStd: 0.01,
      ethPct: 42,
      title: 'Weekly recap',
      samplesLine: '100 samples',
      bestLine: 'Base at 0.01',
      ethLine: 'ETH smooth 42%',
      disclaimer: 'Device only',
      dateRange: 'May 9 – May 16, 2026',
    });
    expect(blob).toBeInstanceOf(Blob);
    expect(blob?.type).toBe('image/png');
  });

  it('formats best fee line', () => {
    expect(recapBestFeeLine('Base', 0.0123)).toContain('Base');
  });
});
