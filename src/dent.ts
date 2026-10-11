export interface CushionDent {
  cx: number;
  cy: number;
  w: number;
  h: number;
  tone: number;
  lines: number;
  lineW: number;
}

export interface DentBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

const WRINKLES = [
  ['M 50,66 Q 34,74 16,72', 'M 210,66 Q 226,74 244,72'],
  ['M 46,56 Q 26,60 8,56', 'M 214,56 Q 234,60 252,56']
] as const;

export function dentBox(dent: CushionDent): DentBox {
  const width = dent.w * 1.3;
  const height = dent.h / 0.7;
  return {
    left: dent.cx - width / 2,
    top: dent.cy - height * 0.45,
    width,
    height
  };
}

export function dentMarkup(dent: CushionDent): string {
  const value = Math.round(255 * (1 - dent.tone / 100));
  const parts = [`<ellipse cx="130" cy="45" rx="100" ry="35" fill="rgb(${value},${value},${value})"/>`];
  if (dent.lineW <= 0) return parts.join('');

  const attributes = `fill="none" stroke="#6B5040" stroke-width="${dent.lineW}" stroke-linecap="round" vector-effect="non-scaling-stroke"`;
  parts.push(`<path d="M 58,70 A 100,35 0 0 0 202,70" ${attributes}/>`);
  for (let index = 0; index < Math.min(2, Math.max(0, Math.floor(dent.lines))); index += 1) {
    parts.push(`<path d="${WRINKLES[index][0]}" ${attributes}/>`);
    parts.push(`<path d="${WRINKLES[index][1]}" ${attributes}/>`);
  }
  return parts.join('');
}
