const GAMEPLAY_ASSET_ROOT = "/art/gameplay";

export function loadGameAssets(scene, art, preparedUrls = {}) {
  const source = (file) => preparedUrls[`${GAMEPLAY_ASSET_ROOT}/${file}`] ?? `${GAMEPLAY_ASSET_ROOT}/${file}`;
  scene.load.image("world-panorama", source(art.panorama));
  scene.load.spritesheet("hunter-atlas", source("hunter-atlas.png"), { frameWidth: 444, frameHeight: 444 });
  scene.load.spritesheet("world-objects", source(art.objects), { frameWidth: art.objectFrameSize, frameHeight: art.objectFrameSize });
  scene.load.spritesheet("world-terrain", source(art.terrain), { frameWidth: art.terrainFrameWidth, frameHeight: art.terrainFrameHeight });
}
