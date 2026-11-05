export const GUEST_PROGRESS_KEY = "treasurehunt.guest-progress.v1";

let completedWorldIds = [];
let runSequence = 0;
const progressListeners = new Set();

function snapshot() {
  return Object.freeze({ completedWorldIds: [...completedWorldIds] });
}

function publish() {
  const progress = snapshot();
  for (const listener of progressListeners) listener(progress.completedWorldIds);
  return progress;
}

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

export function clearLegacyGuestProgress(storage = globalThis.window?.localStorage) {
  try {
    storage?.removeItem(GUEST_PROGRESS_KEY);
  } catch {
    // Guest mode remains available if browser storage is blocked.
  }
}

export function startGuestAdventure(storage) {
  clearLegacyGuestProgress(storage);
  completedWorldIds = [];
  runSequence = 0;
  return publish();
}

export function readGuestProgress() {
  return snapshot();
}

export function subscribeGuestProgress(listener) {
  progressListeners.add(listener);
  listener(snapshot().completedWorldIds);
  return () => progressListeners.delete(listener);
}

export function beginGuestRun() {
  runSequence += 1;
  return runSequence;
}

export function completeGuestWorld(worlds, worldId) {
  const states = deriveWorldStates(worlds, completedWorldIds);
  const target = states.find((world) => world.id === worldId);
  if (!target?.current) return snapshot();
  completedWorldIds = normalizeCompletedWorldIds(worlds, [...completedWorldIds, worldId]);
  return publish();
}
