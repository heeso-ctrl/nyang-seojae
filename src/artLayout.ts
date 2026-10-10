export interface ArtLayout {
  width: number;
  height: number;
  left: number;
  top: number;
  cropTop: number;
  cropBottom: number;
}

const ART_WIDTH = 2;
const ART_HEIGHT = 3;
const HORIZONTAL_FOCUS = 0.62;
const MAX_BOTTOM_CROP = 0.12;

export function computeArtLayout(viewWidth: number, viewHeight: number): ArtLayout {
  const width = Math.max(0, viewWidth);
  const height = Math.max(0, viewHeight);
  if (width === 0 || height === 0) return { width: 0, height: 0, left: 0, top: 0, cropTop: 0, cropBottom: 0 };

  const scale = Math.max(width / ART_WIDTH, height / ART_HEIGHT);
  const artWidth = ART_WIDTH * scale;
  const artHeight = ART_HEIGHT * scale;
  const horizontalOverflow = Math.max(0, artWidth - width);
  const idealLeft = width / 2 - artWidth * HORIZONTAL_FOCUS;
  const left = Math.min(0, Math.max(-horizontalOverflow, idealLeft));

  const verticalOverflow = Math.max(0, artHeight - height);
  const cropBottom = Math.min(verticalOverflow, artHeight * MAX_BOTTOM_CROP);
  const cropTop = verticalOverflow - cropBottom;

  return { width: artWidth, height: artHeight, left, top: -cropTop, cropTop, cropBottom };
}
