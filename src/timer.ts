import type { ActiveTimer, Pause } from './types';

export function pausedMilliseconds(pauses: Pause[], now: number): number {
  return pauses.reduce((sum, pause) => sum + Math.max(0, (pause.until ?? now) - pause.at), 0);
}

export function activeSeconds(timer: ActiveTimer, now = Date.now()): number {
  return Math.max(0, Math.floor((now - timer.startedAt - pausedMilliseconds(timer.pauses, now)) / 1000));
}

export function isPaused(timer: ActiveTimer): boolean {
  const last = timer.pauses.at(-1);
  return Boolean(last && last.until === undefined);
}

export function localDayBounds(timestamp = Date.now()): [number, number] {
  const start = new Date(timestamp);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return [start.getTime(), end.getTime()];
}
