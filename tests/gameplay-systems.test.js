import { describe, expect, it } from "vitest";
import { CombatState, PROJECTILE_COOLDOWN_MS } from "@/game/core/combat-state";
import { canLandOnPlatform, isStompCollision } from "@/game/core/collision-rules";
import { InputState } from "@/game/core/input-state";
import { EMERALD_JUNGLE_LEVEL, EMERALD_JUNGLE_MOTION } from "@/game/config/emerald-jungle";
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
    for (const platform of EMERALD_JUNGLE_LEVEL.platforms) {
      const visual = getTerrainVisualLayout(platform);
      const paintedSurface = visual.y + (visual.surfaceY / 444) * visual.height;
      expect(paintedSurface, platform.id).toBeCloseTo(platform.top, 5);
    }
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
    const ground = EMERALD_JUNGLE_LEVEL.platforms.filter((platform) => platform.kind === "ground");
    for (let index = 0; index < ground.length - 1; index += 1) {
      const gapCenter = ((ground[index].x + ground[index].width / 2) + (ground[index + 1].x - ground[index + 1].width / 2)) / 2;
      const supported = ground.some((platform) => Math.abs(gapCenter - platform.x) <= platform.width / 2);
      expect(supported, `gap after ${ground[index].id}`).toBe(false);
    }
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
});
