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
  scene.anims.create({ key: "critter-walk", frames: [{ key: "jungle-objects", frame: 0 }, { key: "jungle-objects", frame: 1 }], frameRate: 5, repeat: -1 });
  scene.anims.create({ key: "coin-spin", frames: [{ key: "jungle-objects", frame: 2 }], frameRate: 1, repeat: -1 });
}

export function createGameTextures(scene) {
  createUtilityTextures(scene);
  createAnimations(scene);
}
