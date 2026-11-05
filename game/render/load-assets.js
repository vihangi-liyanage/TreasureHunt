const GAMEPLAY_ASSET_ROOT = "/art/gameplay";

export function loadGameAssets(scene, art) {
  scene.load.image("world-panorama", `${GAMEPLAY_ASSET_ROOT}/${art.panorama}`);
  scene.load.spritesheet("hunter-atlas", `${GAMEPLAY_ASSET_ROOT}/hunter-atlas.png`, { frameWidth: 444, frameHeight: 444 });
  scene.load.spritesheet("world-objects", `${GAMEPLAY_ASSET_ROOT}/${art.objects}`, { frameWidth: art.objectFrameSize, frameHeight: art.objectFrameSize });
  scene.load.spritesheet("world-terrain", `${GAMEPLAY_ASSET_ROOT}/${art.terrain}`, { frameWidth: art.terrainFrameWidth, frameHeight: art.terrainFrameHeight });
}
