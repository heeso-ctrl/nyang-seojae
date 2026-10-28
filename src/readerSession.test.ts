import { describe, expect, it } from 'vitest';
import { finishReaderClock, homeTimerPose, leaveReader, pauseReaderForBackground, readerAutoPause, readerInput, readerVisibility, resumeTimer, shouldAskAfterHidden, type ReaderClock } from './readerSession';

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
    expect(paused.timer.pauses).toEqual([{ at: 120_000, reason: 'idle' }]);
    expect(readerInput(paused, 500_000).timer.pauses).toEqual([{ at: 120_000, until: 500_000, reason: 'idle' }]);
  });

  it('뷰어 밖과 백그라운드 사유를 마지막 입력 시각부터 이어서 바꾼다', () => {
    const outside = leaveReader(readerInput(clock(), 30_000));
    expect(outside.timer.pauses).toEqual([{ at: 30_000, reason: 'outside-reader' }]);
    const hidden = readerVisibility(outside, true);
    expect(hidden.timer.pauses).toEqual([{ at: 30_000, reason: 'background' }]);
    expect(readerVisibility(hidden, false)).toEqual(hidden);
  });

  it('사용자 일시정지는 백그라운드 사유로 덮지 않는다', () => {
    const timer = { ...clock().timer, mode: 'reader-auto' as const, pauses: [{ at: 10_000, reason: 'user' as const }] };
    expect(pauseReaderForBackground(timer, 20_000)).toEqual(timer);
  });

  it('이어 읽기는 열린 일시정지를 닫고 홈 자세는 사유를 따른다', () => {
    const outside = { ...clock().timer, mode: 'reader-auto' as const, pauses: [{ at: 10_000, reason: 'outside-reader' as const }] };
    const background = { ...outside, pauses: [{ at: 10_000, reason: 'background' as const }] };
    expect(homeTimerPose(outside)).toBe('reading');
    expect(homeTimerPose(background)).toBe('resting');
    expect(resumeTimer(background, 20_000).pauses[0].until).toBe(20_000);
  });

  it('직접 타이머는 2시간 이상 가려졌을 때만 확인한다', () => {
    expect(shouldAskAfterHidden(clock().timer, 0, 30 * 60_000)).toBe(false);
    expect(shouldAskAfterHidden(clock().timer, 0, 2 * 60 * 60_000)).toBe(true);
    expect(shouldAskAfterHidden(clock().timer, 0, 130 * 60_000)).toBe(true);
  });

  it('사용자 일시정지 중인 직접 타이머는 2시간 확인 대상이 아니다', () => {
    const paused = { ...clock().timer, mode: 'timer' as const, pauses: [{ at: 10_000, reason: 'user' as const }] };
    expect(shouldAskAfterHidden(paused, 0, 130 * 60_000)).toBe(false);
  });

  it('60초 미만은 reader-auto만 버리고 직접 타이머는 저장한다', () => {
    expect(finishReaderClock(clock(), 30_000)).toMatchObject({ keep: true, activeSec: 30 });
    expect(finishReaderClock({ ...clock(), timer: { ...clock().timer, mode: 'timer' } }, 30_000).keep).toBe(true);
    expect(finishReaderClock({ ...clock(), timer: { ...clock().timer, mode: 'reader-auto' } }, 30_000).keep).toBe(false);
    expect(finishReaderClock({ ...clock(), timer: { ...clock().timer, mode: 'reader-auto' } }, 60_000)).toMatchObject({ keep: true, activeSec: 60 });
  });

  it('뷰어 밖 시간은 빼고 두 독서 구간의 활성 시간만 합친다', () => {
    const timer = {
      id: 'current' as const, bookId: 'book', startedAt: 0, mode: 'reader-auto' as const,
      pauses: [
        { at: 180_000, until: 780_000, reason: 'outside-reader' as const },
        { at: 900_000, reason: 'outside-reader' as const },
      ]
    };
    expect(finishReaderClock({ timer, lastInputAt: 900_000 }, 1_200_000)).toMatchObject({ activeSec: 300, keep: true });
  });
});
