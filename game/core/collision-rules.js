export function isStompCollision({ playerVelocityY, playerBottom, enemyCenterY }, margin = 16) {
  return playerVelocityY > 120 && playerBottom < enemyCenterY + margin;
}
