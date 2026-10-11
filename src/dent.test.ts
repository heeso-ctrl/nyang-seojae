import { describe, expect, it } from 'vitest';
import { dentBox, dentMarkup, type CushionDent } from './dent';

const base: CushionDent = { cx: 67.5, cy: 67.25, w: 29.24, h: 5.07, tone: 10, lines: 1, lineW: 1.5 };

function pathCount(markup: string): number {
  return markup.match(/<path /g)?.length ?? 0;
}

describe('dentBox', () => {
  it('그림 상자 % 좌표로 눌림 자국 사각형을 계산한다', () => {
    const box = dentBox(base);
    expect(box.width).toBeCloseTo(38.012);
    expect(box.height).toBeCloseTo(7.242857);
    expect(box.left).toBeCloseTo(48.494);
    expect(box.top).toBeCloseTo(63.990714);
  });
});

describe('dentMarkup', () => {
  it('tone 10을 회색 채움으로 바꾼다', () => {
    expect(dentMarkup(base)).toContain('fill="rgb(230,230,230)"');
  });

  it.each([[0, 1], [1, 3], [2, 5]])('lines %i이면 path가 %i개다', (lines, expected) => {
    expect(pathCount(dentMarkup({ ...base, lines }))).toBe(expected);
  });

  it('lineW가 0이면 선을 그리지 않는다', () => {
    expect(pathCount(dentMarkup({ ...base, lineW: 0 }))).toBe(0);
  });
});
