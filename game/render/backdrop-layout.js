export function getBackdropCoverLayout({
  sourceWidth,
  sourceHeight,
  viewportWidth,
  viewportHeight,
  overscan = 1,
  bleed = 2,
  centerX = viewportWidth / 2,
  centerY = viewportHeight / 2,
}) {
  if ([sourceWidth, sourceHeight, viewportWidth, viewportHeight].some((value) => !Number.isFinite(value) || value <= 0)
    || [centerX, centerY].some((value) => !Number.isFinite(value))) {
    throw new TypeError("Backdrop dimensions must be positive numbers.");
  }

  const safeOverscan = Math.max(1, Number(overscan) || 1);
  const safeBleed = Math.max(0, Number(bleed) || 0);
  const scale = Math.max(
    (viewportWidth + safeBleed * 2) / sourceWidth,
    (viewportHeight + safeBleed * 2) / sourceHeight,
  ) * safeOverscan;
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;

  return {
    width,
    height,
    x: centerX - width / 2,
    y: centerY - height / 2,
  };
}
