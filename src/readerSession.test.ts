import { describe, expect, it } from 'vitest';
import { finishReaderClock, readerAutoPause, readerInput, readerVisibility, type ReaderClock } from './readerSession';

function clock(): ReaderClock {
  return { timer: { id: 'current', bookId: 'book', startedAt: 0, pauses: [] }, lastInputAt: 0 };
}

describe('뷰어 자동 독서 시간', () => {
  it('연속 입력은 일시정지를 만들지 않는다', () => {
    const next = readerInput(readerInput(clock(), 60_000), 120_000);
    expect(next.timer.pauses).toEqual([]);
    expect(next.lastInputAt).toBe(120_000);
  });

  it('5분 공백은 마지막 입력부터 멈추고 다음 입력에서 재개한다', () => {
    const reading = readerInput(clock(), 120_000);
    const paused = readerAutoPause(reading, 420_000);
    expect(paused.timer.pauses).toEqual([{ at: 120_000 }]);
    expect(readerInput(paused, 500_000).timer.pauses).toEqual([{ at: 120_000, until: 500_000 }]);
  });

  it('백그라운드 동안만 일시정지한다', () => {
    const hidden = readerVisibility(clock(), true, 30_000);
    const visible = readerVisibility(hidden, false, 90_000);
    expect(visible.timer.pauses).toEqual([{ at: 30_000, until: 90_000 }]);
  });

  it('60초 미만 세션은 버린다', () => {
    expect(finishReaderClock(clock(), 59_999).keep).toBe(false);
    expect(finishReaderClock(clock(), 60_000)).toMatchObject({ keep: true, activeSec: 60 });
  });
});
