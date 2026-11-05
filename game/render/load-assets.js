const GAMEPLAY_ASSET_ROOT = "/art/gameplay";

export function loadGameAssets(scene) {
  scene.load.image("jungle-panorama", `${GAMEPLAY_ASSET_ROOT}/emerald-jungle-panorama.png`);
  scene.load.spritesheet("hunter-atlas", `${GAMEPLAY_ASSET_ROOT}/hunter-atlas.png`, { frameWidth: 444, frameHeight: 444 });
  scene.load.spritesheet("jungle-objects", `${GAMEPLAY_ASSET_ROOT}/jungle-objects-atlas.png`, { frameWidth: 444, frameHeight: 444 });
  scene.load.spritesheet("jungle-terrain", `${GAMEPLAY_ASSET_ROOT}/jungle-terrain-atlas.png`, { frameWidth: 888, frameHeight: 444 });
}
