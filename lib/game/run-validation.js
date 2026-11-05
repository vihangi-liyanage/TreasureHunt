export function parseWorldCompletion(value) {
  const world = Number(value?.world);
  const coins = Number(value?.coins ?? 0);
  if (!Number.isInteger(world) || world < 1 || world > 3) return null;
  if (!Number.isInteger(coins) || coins < 0 || coins > 1_000_000) return null;
  return { world, coins };
}

export function parseRunResult(value) {
  const score = Number(value?.score);
  const coins = Number(value?.coins);
  const worldReached = Number(value?.worldReached);
  const durationSeconds = Number(value?.durationSeconds);
  if (!Number.isInteger(score) || score < 0 || score > 100_000_000) return null;
  if (!Number.isInteger(coins) || coins < 0 || coins > 1_000_000) return null;
  if (!Number.isInteger(worldReached) || worldReached < 1 || worldReached > 3) return null;
  if (!Number.isInteger(durationSeconds) || durationSeconds < 1 || durationSeconds > 86_400) return null;
  if (typeof value?.completed !== "boolean") return null;
  if (value.completed && worldReached !== 3) return null;
  return { score, coins, worldReached, durationSeconds, completed: value.completed };
}
