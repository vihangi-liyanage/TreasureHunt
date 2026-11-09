const TERRAIN_FRAME_HEIGHT = 444;

export const TERRAIN_PRESENTATION = Object.freeze({
  ground: Object.freeze({
    frame: 0, height: 280, surfaceY: 168, surfaceWidthRatio: 786 / 830,
    crop: Object.freeze({ x: 30, y: 20, width: 830, height: 400 }),
  }),
  ledge: Object.freeze({
    frame: 1, height: 160, surfaceY: 101, surfaceWidthRatio: 629 / 670,
    crop: Object.freeze({ x: 115, y: 25, width: 670, height: 390 }),
  }),
  step: Object.freeze({
    frame: 2, height: 125, surfaceY: 126, surfaceWidthRatio: 430 / 530,
    crop: Object.freeze({ x: 170, y: 80, width: 530, height: 290 }),
  }),
});

export const HUNTER_PRESENTATION = Object.freeze({
  displaySize: 160,
  bodyWidth: 132,
  bodyHeight: 214,
  bodyOffsetX: 156,
  bodyOffsetY: 203,
});

export const ENEMY_PRESENTATION = Object.freeze({
  displaySize: 112,
  bodyWidth: 235,
  bodyHeight: 125,
  bodyOffsetX: 100,
  bodyOffsetY: 255,
});

export function getTerrainVisualLayout(platform, presentationByKind = TERRAIN_PRESENTATION, frameHeight = TERRAIN_FRAME_HEIGHT) {
  const kind = presentationByKind[platform.kind] ? platform.kind : "ledge";
  const presentation = presentationByKind[kind];
  const sourceHeight = presentation.crop?.height ?? frameHeight;
  return Object.freeze({
    ...presentation,
    frame: presentation.crop ? `terrain-${kind}` : presentation.frame,
    width: platform.width / (presentation.surfaceWidthRatio ?? 1),
    y: platform.top - (presentation.surfaceY / sourceHeight) * presentation.height,
  });
}

function createTerrainFrames(scene, art) {
  const texture = scene.textures.get("world-terrain");
  const presentationByKind = art.terrainPresentation ?? TERRAIN_PRESENTATION;
  for (const [kind, presentation] of Object.entries(presentationByKind)) {
    if (!presentation.crop) continue;
    const frameName = `terrain-${kind}`;
    if (texture.has(frameName)) continue;
    const sourceFrame = texture.get(presentation.frame);
    const crop = presentation.crop;
    texture.add(
      frameName,
      sourceFrame.sourceIndex,
      sourceFrame.cutX + crop.x,
      sourceFrame.cutY + crop.y,
      crop.width,
      crop.height,
    );
  }
}

function createUtilityTextures(scene) {
  if (scene.textures.exists("platform-hitbox")) return;
  const graphics = scene.add.graphics();
  graphics.fillStyle(0xffffff, 1).fillRect(0, 0, 8, 8).generateTexture("platform-hitbox", 8, 8);
  graphics.clear().fillStyle(0xffd75e, 1).fillCircle(8, 8, 7).generateTexture("gold-spark", 16, 16);
  graphics.clear().fillStyle(0xd9fff0, 0.85).fillCircle(6, 6, 5).generateTexture("mist-particle", 12, 12);
  graphics.clear().fillStyle(0x9f6a3d, 0.7).fillCircle(5, 5, 4).generateTexture("dust-particle", 10, 10);
  graphics.destroy();
}

function createAnimations(scene) {
  if (scene.anims.exists("hunter-idle")) return;
  scene.anims.create({ key: "hunter-idle", frames: [{ key: "hunter-atlas", frame: 0 }], frameRate: 1, repeat: -1 });
  scene.anims.create({ key: "hunter-run", frames: [{ key: "hunter-atlas", frame: 1 }, { key: "hunter-atlas", frame: 2 }], frameRate: 8, repeat: -1 });
  scene.anims.create({ key: "critter-walk", frames: [{ key: "world-objects", frame: 0 }, { key: "world-objects", frame: 1 }], frameRate: 5, repeat: -1 });
  scene.anims.create({ key: "coin-spin", frames: [{ key: "world-objects", frame: 2 }], frameRate: 1, repeat: -1 });
}

export function createGameTextures(scene, art) {
  createUtilityTextures(scene);
  createTerrainFrames(scene, art);
  createAnimations(scene);
}
