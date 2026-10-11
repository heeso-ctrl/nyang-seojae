import { activeSeconds, isPaused } from './timer';
import type { ActiveTimer } from './types';

export const READER_IDLE_MS = 5 * 60_000;

export interface ReaderClock {
  timer: ActiveTimer;
  lastInputAt: number;
}

export function readerInput(clock: ReaderClock, at: number): ReaderClock {
  const pauses = clock.timer.pauses.map((pause, index, all) =>
    index === all.length - 1 && pause.until === undefined ? { ...pause, until: at } : pause);
  return { timer: { ...clock.timer, pauses }, lastInputAt: at };
}

export function readerAutoPause(clock: ReaderClock, at: number): ReaderClock {
  if (isPaused(clock.timer) || at - clock.lastInputAt < READER_IDLE_MS) return clock;
  return {
    ...clock,
    timer: { ...clock.timer, pauses: [...clock.timer.pauses, { at: clock.lastInputAt }] }
  };
}

export function readerVisibility(clock: ReaderClock, hidden: boolean, at: number): ReaderClock {
  if (hidden) {
    if (isPaused(clock.timer)) return clock;
    return { ...clock, timer: { ...clock.timer, pauses: [...clock.timer.pauses, { at }] } };
  }
  return readerInput(clock, at);
}

export function finishReaderClock(clock: ReaderClock, endedAt: number): { activeSec: number; pauses: ActiveTimer['pauses']; keep: boolean } {
  const pauses = clock.timer.pauses.map((pause) => pause.until === undefined ? { ...pause, until: endedAt } : pause);
  const activeSec = activeSeconds({ ...clock.timer, pauses }, endedAt);
  return { activeSec, pauses, keep: activeSec >= 60 };
}
