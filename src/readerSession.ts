import { activeSeconds, isPaused } from './timer';
import type { ActiveTimer, Pause } from './types';

export const READER_IDLE_MS = 5 * 60_000;

export interface ReaderClock {
  timer: ActiveTimer;
  lastInputAt: number;
}

export function openPause(timer: ActiveTimer): Pause | undefined {
  const last = timer.pauses.at(-1);
  return last?.until === undefined ? last : undefined;
}

export function resumeTimer(timer: ActiveTimer, at: number): ActiveTimer {
  const pauses = timer.pauses.map((pause, index, all) =>
    index === all.length - 1 && pause.until === undefined ? { ...pause, until: at } : pause);
  return { ...timer, pauses };
}

export function readerInput(clock: ReaderClock, at: number): ReaderClock {
  return { timer: resumeTimer(clock.timer, at), lastInputAt: at };
}

export function readerAutoPause(clock: ReaderClock, at: number): ReaderClock {
  if (isPaused(clock.timer) || at - clock.lastInputAt < READER_IDLE_MS) return clock;
  return {
    ...clock,
    timer: { ...clock.timer, pauses: [...clock.timer.pauses, { at: clock.lastInputAt, reason: 'idle' }] }
  };
}

export function leaveReader(clock: ReaderClock): ReaderClock {
  if (isPaused(clock.timer)) return clock;
  return {
    ...clock,
    timer: { ...clock.timer, pauses: [...clock.timer.pauses, { at: clock.lastInputAt, reason: 'outside-reader' }] }
  };
}

export function pauseReaderForBackground(timer: ActiveTimer, at: number): ActiveTimer {
  const last = openPause(timer);
  if (last?.reason === 'user' || last?.reason === 'background') return timer;
  if (last) {
    return {
      ...timer,
      pauses: timer.pauses.map((pause, index) => index === timer.pauses.length - 1
        ? { ...pause, reason: 'background' } : pause)
    };
  }
  return { ...timer, pauses: [...timer.pauses, { at, reason: 'background' }] };
}

export function readerVisibility(clock: ReaderClock, hidden: boolean): ReaderClock {
  if (!hidden) return clock;
  return { ...clock, timer: pauseReaderForBackground(clock.timer, clock.lastInputAt) };
}

export function homeTimerPose(timer: ActiveTimer): 'reading' | 'resting' {
  const pause = openPause(timer);
  if (!pause) return 'reading';
  if (timer.mode === 'reader-auto' && (pause.reason === 'outside-reader' || pause.reason === 'idle')) return 'reading';
  return 'resting';
}

export function shouldAskAfterHidden(timer: ActiveTimer, hiddenAt: number, visibleAt: number): boolean {
  return timer.mode !== 'reader-auto'
    && openPause(timer)?.reason !== 'user'
    && visibleAt - hiddenAt >= 2 * 60 * 60_000;
}

export function finishReaderClock(clock: ReaderClock, endedAt: number): { activeSec: number; pauses: ActiveTimer['pauses']; keep: boolean } {
  const pauses = clock.timer.pauses.map((pause) => pause.until === undefined ? { ...pause, until: endedAt } : pause);
  const activeSec = activeSeconds({ ...clock.timer, pauses }, endedAt);
  return { activeSec, pauses, keep: clock.timer.mode !== 'reader-auto' || activeSec >= 60 };
}
