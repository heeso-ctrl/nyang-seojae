import { describe, expect, it } from 'vitest';
import { activeSeconds, isPaused } from './timer';

describe('타이머 시간 계산', () => {
  it('앱이 닫혀 있던 시간도 시작 시각으로 복구한다', () => {
    expect(activeSeconds({ id: 'current', bookId: 'b', startedAt: 1_000, pauses: [] }, 61_000)).toBe(60);
  });

  it('끝난 일시정지와 진행 중 일시정지를 모두 제외한다', () => {
    const timer = { id: 'current' as const, bookId: 'b', startedAt: 0, pauses: [{ at: 10_000, until: 20_000 }, { at: 40_000 }] };
    expect(activeSeconds(timer, 70_000)).toBe(30);
    expect(isPaused(timer)).toBe(true);
  });
});
