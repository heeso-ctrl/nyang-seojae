import { describe, expect, it } from 'vitest';
import { computeArtLayout } from './artLayout';

describe('computeArtLayout', () => {
  it.each([[632, 707], [632, 802], [390, 844], [390, 664]])('%dx%d 영역을 빈틈 없이 덮는다', (width, height) => {
    const layout = computeArtLayout(width, height);
    expect(layout.width).toBeGreaterThanOrEqual(width);
    expect(layout.height).toBeGreaterThanOrEqual(height);
    expect(layout.left).toBeLessThanOrEqual(0);
    expect(layout.left + layout.width).toBeGreaterThanOrEqual(width);
    expect(layout.top).toBeLessThanOrEqual(0);
    expect(layout.top + layout.height).toBeGreaterThanOrEqual(height);
  });

  it('세로 초과분은 아래에서 최대 12%, 나머지는 위에서 자른다', () => {
    const layout = computeArtLayout(632, 707);
    expect(layout.cropBottom).toBeCloseTo(layout.height * 0.12);
    expect(layout.cropTop + layout.cropBottom).toBeCloseTo(layout.height - 707);
  });

  it('가로 초과 시 62% 기준점을 중심에 최대한 둔다', () => {
    const layout = computeArtLayout(390, 844);
    expect(layout.left + layout.width * 0.62).toBeCloseTo(195);
  });
});
