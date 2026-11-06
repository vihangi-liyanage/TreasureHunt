export const RESUME_COUNTDOWN_STEPS = Object.freeze([3, 2, 1, "GO!"]);

export function getNextResumeStep(currentStep) {
  const index = RESUME_COUNTDOWN_STEPS.indexOf(currentStep);
  return index < 0 || index === RESUME_COUNTDOWN_STEPS.length - 1
    ? null
    : RESUME_COUNTDOWN_STEPS[index + 1];
}

export function getNextWorld(worlds, worldId) {
  const current = worlds.find((world) => world.id === worldId);
  return current?.nextWorldId
    ? worlds.find((world) => world.id === current.nextWorldId) ?? null
    : null;
}

export function shouldShowWorldIntroduction(world, requested) {
  return Boolean(requested && world?.number === 1);
}
