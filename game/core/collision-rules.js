export function isStompCollision({
  playerVelocityY,
  previousPlayerBottom,
  playerBottom,
  playerLeft,
  playerRight,
  enemyTop,
  enemyLeft,
  enemyRight,
}, { minimumVelocity = 120, topTolerance = 12, minimumHorizontalOverlap = 8 } = {}) {
  const horizontalOverlap = Math.min(playerRight, enemyRight) - Math.max(playerLeft, enemyLeft);
  return playerVelocityY > minimumVelocity
    && previousPlayerBottom <= enemyTop + topTolerance
    && playerBottom >= enemyTop - topTolerance
    && horizontalOverlap >= minimumHorizontalOverlap;
}

export function canLandOnPlatform({ playerVelocityY, previousBottom, platformTop }, tolerance = 12) {
  return playerVelocityY >= 0 && previousBottom <= platformTop + tolerance;
}

export function isBelowFallBoundary({ bodyTop, levelHeight }, margin = 90) {
  return Number.isFinite(bodyTop)
    && Number.isFinite(levelHeight)
    && bodyTop > levelHeight + margin;
}
