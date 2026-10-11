export interface HorizontalBounds {
  left: number;
  width: number;
}

export function readerTapRatio(
  clientX: number,
  documentWidth: number,
  frameBounds?: HorizontalBounds,
  viewerBounds?: HorizontalBounds,
): number {
  if (frameBounds && viewerBounds && viewerBounds.width > 0) {
    const outerX = frameBounds.left + clientX;
    return (outerX - viewerBounds.left) / viewerBounds.width;
  }
  return clientX / Math.max(1, documentWidth);
}
