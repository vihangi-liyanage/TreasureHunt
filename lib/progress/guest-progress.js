export const GUEST_PROGRESS_KEY = "treasurehunt.guest-progress.v1";

export function normalizeCompletedWorldIds(worlds, completedWorldIds = []) {
  const requested = new Set(Array.isArray(completedWorldIds) ? completedWorldIds : []);
  const completed = [];
  for (const world of worlds) {
    if (!requested.has(world.id)) break;
    completed.push(world.id);
  }
  return completed;
}

export function deriveWorldStates(worlds, completedWorldIds = []) {
  const completed = normalizeCompletedWorldIds(worlds, completedWorldIds);
  const currentIndex = Math.min(completed.length, worlds.length - 1);
  const allCompleted = completed.length === worlds.length;

  return worlds.map((world, index) => ({
    ...world,
    completed: completed.includes(world.id),
    current: !allCompleted && index === currentIndex,
    unlocked: index <= currentIndex || allCompleted,
    locked: index > currentIndex && !allCompleted,
  }));
}

export function getJourneyProgress(worlds, completedWorldIds = []) {
  const completedCount = normalizeCompletedWorldIds(worlds, completedWorldIds).length;
  if (worlds.length < 2) return 100;
  return Math.min(100, (completedCount / (worlds.length - 1)) * 100);
}

export function readGuestProgress(storage = window.localStorage) {
  try {
    const saved = JSON.parse(storage.getItem(GUEST_PROGRESS_KEY) || "{}");
    return { completedWorldIds: Array.isArray(saved.completedWorldIds) ? saved.completedWorldIds : [] };
  } catch {
    return { completedWorldIds: [] };
  }
}

export function saveGuestProgress(completedWorldIds, storage = window.localStorage) {
  storage.setItem(GUEST_PROGRESS_KEY, JSON.stringify({ version: 1, completedWorldIds }));
}

export function completeGuestWorld(worlds, worldId, storage = window.localStorage) {
  const progress = readGuestProgress(storage);
  const states = deriveWorldStates(worlds, progress.completedWorldIds);
  const target = states.find((world) => world.id === worldId);
  if (!target?.current) return progress;
  const completedWorldIds = normalizeCompletedWorldIds(worlds, [...progress.completedWorldIds, worldId]);
  saveGuestProgress(completedWorldIds, storage);
  return { completedWorldIds };
}
