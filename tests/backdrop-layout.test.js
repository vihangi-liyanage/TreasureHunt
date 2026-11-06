import { describe, expect, it } from "vitest";
import { getBackdropCoverLayout } from "@/game/render/backdrop-layout";
import { CRYSTAL_CAVERN_LEVEL } from "@/game/config/crystal-cavern";

describe("gameplay backdrop layout", () => {
  it("covers a wide viewport without stretching the source aspect ratio", () => {
    const layout = getBackdropCoverLayout({
      sourceWidth: 1_774,
      sourceHeight: 887,
      viewportWidth: 1_920,
      viewportHeight: 900,
    });

    expect(layout.width).toBeGreaterThanOrEqual(1_920);
    expect(layout.height).toBeGreaterThanOrEqual(900);
    expect(layout.width / layout.height).toBeCloseTo(1_774 / 887);
    expect(layout.x).toBeLessThanOrEqual(0);
    expect(layout.y).toBeLessThanOrEqual(0);
  });

  it("uses Crystal Cavern overscan to crop its painted dark edge symmetrically", () => {
    const layout = getBackdropCoverLayout({
      sourceWidth: 1_774,
      sourceHeight: 887,
      viewportWidth: 1_920,
      viewportHeight: 900,
      overscan: CRYSTAL_CAVERN_LEVEL.art.backdropOverscan,
    });

    expect(CRYSTAL_CAVERN_LEVEL.art.backdropOverscan).toBeGreaterThan(1);
    expect(layout.width).toBeGreaterThan(1_920);
    expect(layout.x).toBeCloseTo((1_920 - layout.width) / 2);
  });

  it("rejects invalid dimensions rather than producing a blank canvas", () => {
    expect(() => getBackdropCoverLayout({ sourceWidth: 0, sourceHeight: 1, viewportWidth: 1, viewportHeight: 1 })).toThrow(TypeError);
  });
});
