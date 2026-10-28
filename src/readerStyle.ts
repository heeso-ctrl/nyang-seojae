import type { DisplayMode, ReaderStyle } from './types';

const WEIGHTS = [400, 500, 600, 700] as const;

export function defaultReaderStyle(mode: DisplayMode): ReaderStyle {
  return {
    fontSize: 18,
    lineHeight: 1.7,
    paragraphSpacing: 0.8,
    indent: undefined,
    margin: 32,
    fontWeight: mode === 'eink' ? 500 : 400,
    fontFamily: 'book',
  };
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function migrateReaderStyle(value: unknown, mode: DisplayMode): ReaderStyle {
  const defaults = defaultReaderStyle(mode);
  if (!value || typeof value !== 'object') return defaults;
  const source = value as Record<string, unknown>;
  const rawFontSize = numberOr(source.fontSize, defaults.fontSize);
  const fontSize = rawFontSize > 40 ? Math.round(rawFontSize * 0.18) : Math.round(rawFontSize);
  const rawWeight = numberOr(source.fontWeight, defaults.fontWeight);
  const fontWeight = WEIGHTS.includes(rawWeight as typeof WEIGHTS[number])
    ? rawWeight as ReaderStyle['fontWeight'] : defaults.fontWeight;
  const family = source.fontFamily;
  const fontFamily = family === 'serif' || family === 'sans' || family === 'book' ? family : defaults.fontFamily;
  const indent = typeof source.indent === 'number' && Number.isFinite(source.indent)
    ? Math.round(clamp(source.indent, 0, 3) * 10) / 10 : undefined;
  return {
    fontSize: clamp(fontSize, 12, 40),
    lineHeight: Math.round(clamp(numberOr(source.lineHeight, defaults.lineHeight), 1, 3) * 20) / 20,
    paragraphSpacing: Math.round(clamp(numberOr(source.paragraphSpacing, defaults.paragraphSpacing), 0, 3) * 10) / 10,
    indent,
    margin: Math.round(clamp(numberOr(source.margin, defaults.margin), 0, 80) / 2) * 2,
    fontWeight,
    fontFamily,
  };
}

export function textStrokeFor(weight: ReaderStyle['fontWeight']): number {
  return ({ 400: 0, 500: 0.2, 600: 0.35, 700: 0.5 } as const)[weight];
}
