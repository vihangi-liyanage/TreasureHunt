import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { getBackdropCoverLayout } from "@/game/render/backdrop-layout";
import { CRYSTAL_CAVERN_LEVEL } from "@/game/config/crystal-cavern";

describe("gameplay backdrop layout", () => {
  it("lets the full-viewport parent position a resized canvas without Phaser margins", () => {
    const gameFactory = readFileSync(new URL("../game/create-game.js", import.meta.url), "utf8");
    const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

    expect(gameFactory).toContain("mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.NO_CENTER");
    expect(gameFactory).not.toContain("autoCenter:Phaser.Scale.CENTER_BOTH");
    expect(styles).toContain(".phaser-stage { position: absolute; inset: 0;");
    expect(styles).toContain(".phaser-stage canvas { width: 100% !important; height: 100% !important;");
  });

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
    expect(layout.x).toBeLessThanOrEqual(-1.99);
    expect(layout.y).toBeLessThanOrEqual(-1.99);
  });

  it.each([
    [1_280, 720],
    [1_600, 900],
    [932, 430],
    [390, 844],
  ])("covers responsive viewport %ix%i without exposed bands", (viewportWidth, viewportHeight) => {
    const layout = getBackdropCoverLayout({
      sourceWidth: 3_072,
      sourceHeight: 1_024,
      viewportWidth,
      viewportHeight,
    });

    expect(layout.width).toBeGreaterThanOrEqual(viewportWidth);
    expect(layout.height).toBeGreaterThanOrEqual(viewportHeight);
    expect(layout.x).toBeLessThanOrEqual(0);
    expect(layout.y).toBeLessThanOrEqual(0);
    expect(layout.width / layout.height).toBeCloseTo(3);
  });

  it("aligns a fixed backdrop to the camera transform origin when zoom is below one", () => {
    const cameraWidth = 1_280;
    const cameraHeight = 640;
    const zoom = cameraHeight / 720;
    const layout = getBackdropCoverLayout({
      sourceWidth: 2_172,
      sourceHeight: 724,
      viewportWidth: cameraWidth / zoom,
      viewportHeight: cameraHeight / zoom,
      centerX: cameraWidth / 2,
      centerY: cameraHeight / 2,
    });
    const renderedTop = cameraHeight / 2 + (layout.y - cameraHeight / 2) * zoom;
    const renderedBottom = cameraHeight / 2 + (layout.y + layout.height - cameraHeight / 2) * zoom;

    expect(renderedTop).toBeLessThanOrEqual(0);
    expect(renderedBottom).toBeGreaterThanOrEqual(cameraHeight);
    expect(layout.width / layout.height).toBeCloseTo(2_172 / 724);
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
