import { describe, expect, it } from "vitest";
import { CombatState, PROJECTILE_COOLDOWN_MS } from "@/game/core/combat-state";
import { canLandOnPlatform, isBelowFallBoundary, isStompCollision } from "@/game/core/collision-rules";
import { InputState } from "@/game/core/input-state";
import { EMERALD_JUNGLE_LEVEL, EMERALD_JUNGLE_MOTION } from "@/game/config/emerald-jungle";
import { SUNSET_RUINS_LEVEL } from "@/game/config/sunset-ruins";
import { CRYSTAL_CAVERN_LEVEL } from "@/game/config/crystal-cavern";
import { getTerrainVisualLayout } from "@/game/render/create-textures";

function calculateJumpMetrics({ gravity, jumpVelocity, moveSpeed }) {
  const riseTime = Math.abs(jumpVelocity) / gravity;
  return {
    apexHeight: (jumpVelocity * jumpVelocity) / (2 * gravity),
    maximumRange: moveSpeed * riseTime * 2,
  };
}

function canReachPlatform(from, to, motion) {
  const metrics = calculateJumpMetrics(motion);
  const verticalRise = Math.max(0, from.top - to.top);
  const horizontalGap = Math.max(0, to.x - to.width / 2 - (from.x + from.width / 2));
  return verticalRise <= metrics.apexHeight - 24 && horizontalGap <= metrics.maximumRange * 0.72;
}

function sourceHeightFor(visual, frameHeight) {
  return visual.crop?.height ?? frameHeight;
}

function groundSections(level) {
  return level.platforms.filter((platform) => platform.kind === "ground");
}

function gapBetween(left, right) {
  return right.x - right.width / 2 - (left.x + left.width / 2);
}

function unsupportedFallDistance(gap, motion) {
  const hunterBodyWidth = 102 * (160 / 444);
  const unsupportedDistance = Math.max(0, gap - hunterBodyWidth);
  const unsupportedSeconds = unsupportedDistance / motion.moveSpeed;
  return 0.5 * motion.gravity * unsupportedSeconds * unsupportedSeconds;
}

function expectDeliberateGroundGaps(level) {
  const ground = groundSections(level);
  for (let index = 0; index < ground.length - 1; index += 1) {
    const gap = gapBetween(ground[index], ground[index + 1]);
    const gapCenter = ground[index].x + ground[index].width / 2 + gap / 2;
    const supported = ground.some((platform) => Math.abs(gapCenter - platform.x) <= platform.width / 2);
    expect(supported, `gap after ${ground[index].id}`).toBe(false);
    expect(unsupportedFallDistance(gap, level.motion), `fall after ${ground[index].id}`).toBeGreaterThan(12);
    expect(canReachPlatform(ground[index], ground[index + 1], level.motion), `${ground[index].id} jump`).toBe(true);
  }
}

function expectTerrainAligned(level, presentation, frameHeight) {
  for (const platform of level.platforms) {
    const visual = getTerrainVisualLayout(platform, presentation, frameHeight);
    const paintedSurface = visual.y + (visual.surfaceY / sourceHeightFor(visual, frameHeight)) * visual.height;
    const paintedWalkableWidth = visual.width * (visual.surfaceWidthRatio ?? 1);
    expect(paintedSurface, platform.id).toBeCloseTo(platform.top, 5);
    expect(paintedWalkableWidth, platform.id).toBeCloseTo(platform.width, 5);
  }
}

function expectEnemyPatrolsSupported(level) {
  const ground = groundSections(level);
  for (const enemy of level.enemies) {
    for (const x of [enemy.left, enemy.x, enemy.right]) {
      const support = ground.find((platform) => x >= platform.x - platform.width / 2 && x <= platform.x + platform.width / 2);
      expect(support, `${enemy.id} patrol at x=${x}`).toBeTruthy();
    }
  }
}

describe("Emerald Jungle movement model", () => {
  it("documents a jump envelope that clears every mandatory ground gap", () => {
    const metrics = calculateJumpMetrics(EMERALD_JUNGLE_MOTION);
    expect(metrics.apexHeight).toBeGreaterThan(150);
    expect(metrics.maximumRange).toBeGreaterThan(285);
    const byId = new Map(EMERALD_JUNGLE_LEVEL.platforms.map((platform) => [platform.id, platform]));
    const route = EMERALD_JUNGLE_LEVEL.mandatoryRoute.map((id) => byId.get(id));
    for (let index = 0; index < route.length - 1; index += 1) {
      expect(canReachPlatform(route[index], route[index + 1], EMERALD_JUNGLE_MOTION), `${route[index].id} -> ${route[index + 1].id}`).toBe(true);
    }
  });

  it("aligns each painted terrain surface with its Arcade collision top", () => {
    expectTerrainAligned(EMERALD_JUNGLE_LEVEL, undefined, EMERALD_JUNGLE_LEVEL.art.terrainFrameHeight);
  });

  it("places every coin and fish over a reachable collision surface", () => {
    const collectibles = [...EMERALD_JUNGLE_LEVEL.coins, ...EMERALD_JUNGLE_LEVEL.fishPowerUps];
    for (const collectible of collectibles) {
      const supportingPlatform = EMERALD_JUNGLE_LEVEL.platforms.find((platform) =>
        Math.abs(collectible.x - platform.x) <= platform.width / 2 + 35 &&
        platform.top - collectible.y >= 35 && platform.top - collectible.y <= 175);
      expect(supportingPlatform, `${collectible.id} at ${collectible.x},${collectible.y}`).toBeTruthy();
    }
  });

  it("contains real unsupported gaps between mandatory ground bodies", () => {
    expectDeliberateGroundGaps(EMERALD_JUNGLE_LEVEL);
  });

  it("keeps every enemy patrol endpoint on visible ground", () => {
    expectEnemyPatrolsSupported(EMERALD_JUNGLE_LEVEL);
  });
});

describe("Sunset Ruins level contract", () => {
  it("uses the shared movement model and keeps every mandatory gap reachable", () => {
    const byId = new Map(SUNSET_RUINS_LEVEL.platforms.map((platform) => [platform.id, platform]));
    const route = SUNSET_RUINS_LEVEL.mandatoryRoute.map((id) => byId.get(id));
    for (let index = 0; index < route.length - 1; index += 1) {
      expect(canReachPlatform(route[index], route[index + 1], SUNSET_RUINS_LEVEL.motion), `${route[index].id} -> ${route[index + 1].id}`).toBe(true);
    }
  });

  it("places its required collectibles above real collision surfaces", () => {
    for (const collectible of [...SUNSET_RUINS_LEVEL.coins, ...SUNSET_RUINS_LEVEL.fishPowerUps]) {
      const supportingPlatform = SUNSET_RUINS_LEVEL.platforms.find((platform) =>
        Math.abs(collectible.x - platform.x) <= platform.width / 2 + 35 &&
        platform.top - collectible.y >= 35 && platform.top - collectible.y <= 175);
      expect(supportingPlatform, `${collectible.id} at ${collectible.x},${collectible.y}`).toBeTruthy();
    }
  });

  it("aligns Sunset Ruins painted surfaces with Arcade collision tops", () => {
    expectTerrainAligned(
      SUNSET_RUINS_LEVEL,
      SUNSET_RUINS_LEVEL.art.terrainPresentation,
      SUNSET_RUINS_LEVEL.art.terrainFrameHeight,
    );
  });

  it("uses unsupported but jump-reachable ground gaps", () => {
    expectDeliberateGroundGaps(SUNSET_RUINS_LEVEL);
  });

  it("keeps every enemy patrol endpoint on visible ground", () => {
    expectEnemyPatrolsSupported(SUNSET_RUINS_LEVEL);
  });

  it("adds a measured difficulty increase without changing fixed combat rules", () => {
    expect(SUNSET_RUINS_LEVEL.motion.gravity).toBeGreaterThan(0);
    expect(SUNSET_RUINS_LEVEL.enemies).toHaveLength(5);
    expect(Math.max(...SUNSET_RUINS_LEVEL.enemies.map((enemy) => enemy.speed))).toBeGreaterThan(
      Math.max(...EMERALD_JUNGLE_LEVEL.enemies.map((enemy) => enemy.speed)),
    );
    expect(SUNSET_RUINS_LEVEL.fishPowerUps).toHaveLength(1);
  });
});

describe("Crystal Cavern final-level contract", () => {
  it("keeps its complete mandatory route within the shared jump envelope", () => {
    const byId = new Map(CRYSTAL_CAVERN_LEVEL.platforms.map((platform) => [platform.id, platform]));
    const route = CRYSTAL_CAVERN_LEVEL.mandatoryRoute.map((id) => byId.get(id));
    for (let index = 0; index < route.length - 1; index += 1) {
      expect(canReachPlatform(route[index], route[index + 1], CRYSTAL_CAVERN_LEVEL.motion), `${route[index].id} -> ${route[index + 1].id}`).toBe(true);
    }
  });

  it("aligns painted crystal surfaces with their real colliders", () => {
    expectTerrainAligned(
      CRYSTAL_CAVERN_LEVEL,
      CRYSTAL_CAVERN_LEVEL.art.terrainPresentation,
      CRYSTAL_CAVERN_LEVEL.art.terrainFrameHeight,
    );
  });

  it("uses unsupported but reachable gaps and grounded enemy patrols", () => {
    expectDeliberateGroundGaps(CRYSTAL_CAVERN_LEVEL);
    expectEnemyPatrolsSupported(CRYSTAL_CAVERN_LEVEL);
  });

  it("places every collectible and the final treasure over real terrain", () => {
    for (const collectible of [...CRYSTAL_CAVERN_LEVEL.coins, ...CRYSTAL_CAVERN_LEVEL.fishPowerUps]) {
      const support = CRYSTAL_CAVERN_LEVEL.platforms.find((platform) =>
        Math.abs(collectible.x - platform.x) <= platform.width / 2 + 35 &&
        platform.top - collectible.y >= 35 && platform.top - collectible.y <= 175);
      expect(support, `${collectible.id} at ${collectible.x},${collectible.y}`).toBeTruthy();
    }
    const treasureSupport = CRYSTAL_CAVERN_LEVEL.platforms.find((platform) =>
      Math.abs(CRYSTAL_CAVERN_LEVEL.goal.x - platform.x) <= platform.width / 2 &&
      CRYSTAL_CAVERN_LEVEL.goal.y < platform.top);
    expect(CRYSTAL_CAVERN_LEVEL.goal.type).toBe("treasure");
    expect(treasureSupport?.id).toBe("ground-7");
  });

  it("increases enemy pressure without changing the eight-second power rule", () => {
    expect(CRYSTAL_CAVERN_LEVEL.enemies).toHaveLength(7);
    expect(Math.max(...CRYSTAL_CAVERN_LEVEL.enemies.map((enemy) => enemy.speed))).toBeGreaterThan(
      Math.max(...SUNSET_RUINS_LEVEL.enemies.map((enemy) => enemy.speed)),
    );
    const combat = new CombatState();
    combat.activate(2_000);
    expect(combat.remainingMs(10_000)).toBe(0);
  });
});

describe("multi-source input state", () => {
  it("keeps simultaneous movement and jump pointers independent", () => {
    const input = new InputState();
    input.set("right", true, "touch-1");
    input.set("jump", true, "touch-2");
    expect(input.isDown("right")).toBe(true);
    expect(input.consumePress("jump")).toBe(true);
    input.set("jump", false, "touch-2");
    expect(input.isDown("right")).toBe(true);
    input.releaseSource("touch-1");
    expect(input.isDown("right")).toBe(false);
  });

  it("does not release a control while a second pointer still holds it", () => {
    const input = new InputState();
    input.set("left", true, "touch-1");
    input.set("left", true, "touch-2");
    input.set("left", false, "touch-1");
    expect(input.isDown("left")).toBe(true);
  });
});

describe("fish power-up combat rules", () => {
  it("lasts exactly eight active seconds and publishes expiry once", () => {
    const combat = new CombatState();
    combat.activate(1_000);
    expect(combat.remainingMs(8_999)).toBe(1);
    expect(combat.isPowered(9_000)).toBe(false);
    expect(combat.consumeExpiry(9_000)).toBe(true);
    expect(combat.consumeExpiry(9_001)).toBe(false);
  });

  it("freezes the remaining duration while paused", () => {
    const combat = new CombatState();
    combat.activate(0);
    combat.pause(3_000);
    expect(combat.remainingMs(12_000)).toBe(5_000);
    combat.resume(12_000);
    expect(combat.remainingMs(16_999)).toBe(1);
    expect(combat.remainingMs(17_000)).toBe(0);
  });

  it("resets to eight seconds on another pickup and rate-limits shots", () => {
    const combat = new CombatState();
    combat.activate(0);
    combat.activate(5_000);
    expect(combat.remainingMs(5_000)).toBe(8_000);
    expect(combat.tryShoot(5_000)).toBe(true);
    expect(combat.tryShoot(5_000 + PROJECTILE_COOLDOWN_MS - 1)).toBe(false);
    expect(combat.tryShoot(5_000 + PROJECTILE_COOLDOWN_MS)).toBe(true);
  });
});

describe("enemy collision rules", () => {
  it("accepts a descending top hit and rejects side contact", () => {
    expect(isStompCollision({ playerVelocityY: 260, playerBottom: 500, enemyCenterY: 510 })).toBe(true);
    expect(isStompCollision({ playerVelocityY: 0, playerBottom: 500, enemyCenterY: 510 })).toBe(false);
    expect(isStompCollision({ playerVelocityY: 260, playerBottom: 545, enemyCenterY: 510 })).toBe(false);
  });
});

describe("one-way platform collision rules", () => {
  it("lands only while descending from above the platform surface", () => {
    expect(canLandOnPlatform({ playerVelocityY: 300, previousBottom: 495, platformTop: 500 })).toBe(true);
    expect(canLandOnPlatform({ playerVelocityY: 0, previousBottom: 500, platformTop: 500 })).toBe(true);
    expect(canLandOnPlatform({ playerVelocityY: -300, previousBottom: 495, platformTop: 500 })).toBe(false);
    expect(canLandOnPlatform({ playerVelocityY: 300, previousBottom: 530, platformTop: 500 })).toBe(false);
  });

  it("detects a fall only after the body crosses the level boundary", () => {
    expect(isBelowFallBoundary({ bodyTop: 810, levelHeight: 720 })).toBe(false);
    expect(isBelowFallBoundary({ bodyTop: 811, levelHeight: 720 })).toBe(true);
    expect(isBelowFallBoundary({ bodyTop: Number.NaN, levelHeight: 720 })).toBe(false);
  });
});
