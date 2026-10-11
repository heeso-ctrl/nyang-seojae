import { describe, expect, it } from 'vitest';
import { readerTapRatio } from './readerTap';

describe('readerTapRatio', () => {
  it('uses the visible viewer bounds instead of the paginated document width', () => {
    expect(readerTapRatio(600, 1176, { left: 0, width: 1176 }, { left: 0, width: 632 }))
      .toBeCloseTo(600 / 632);
  });

  it('accounts for iframe and viewer offsets in outer screen coordinates', () => {
    expect(readerTapRatio(300, 1176, { left: 20, width: 1176 }, { left: 4, width: 632 }))
      .toBeCloseTo(316 / 632);
  });

  it('falls back to the iframe document width without frame bounds', () => {
    expect(readerTapRatio(600, 1176)).toBeCloseTo(600 / 1176);
  });
});
