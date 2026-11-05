export function calculateJumpMetrics({ gravity, jumpVelocity, moveSpeed }) {
  const riseTime = Math.abs(jumpVelocity) / gravity;
  const apexHeight = (jumpVelocity * jumpVelocity) / (2 * gravity);
  const airTime = riseTime * 2;
  return Object.freeze({ riseTime, apexHeight, airTime, maximumRange: moveSpeed * airTime });
}

export function canReachPlatform(from, to, motion, margin = 24) {
  const metrics = calculateJumpMetrics(motion);
  const verticalRise = Math.max(0, from.top - to.top);
  const fromEdge = from.x + from.width / 2;
  const toEdge = to.x - to.width / 2;
  const horizontalGap = Math.max(0, toEdge - fromEdge);
  return verticalRise <= metrics.apexHeight - margin && horizontalGap <= metrics.maximumRange * 0.72;
}
