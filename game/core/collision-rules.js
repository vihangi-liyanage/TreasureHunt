export function isStompCollision({ playerVelocityY, playerBottom, enemyCenterY }, margin = 16) {
  return playerVelocityY > 120 && playerBottom < enemyCenterY + margin;
}

export function canLandOnPlatform({ playerVelocityY, previousBottom, platformTop }, tolerance = 12) {
  return playerVelocityY >= 0 && previousBottom <= platformTop + tolerance;
}
