import * as Phaser from "phaser";

export class CameraController {
  constructor(scene, player, worldWidth, worldHeight) {
    this.scene = scene;
    this.camera = scene.cameras.main;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.camera.setBounds(0, 0, worldWidth, worldHeight).startFollow(player, true, 0.09, 0.1).setDeadzone(220, 110);
    this.resizeHandler = (size) => this.resize(size.width, size.height);
    scene.scale.on(Phaser.Scale.Events.RESIZE, this.resizeHandler);
    this.resize(scene.scale.width, scene.scale.height);
  }

  resize(width, height) {
    const zoom = Phaser.Math.Clamp(height / this.worldHeight, 0.78, 1.25);
    this.camera.setZoom(zoom);
    this.scene.resizeBackdrop(width / zoom, height / zoom);
  }

  destroy() {
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.resizeHandler);
  }
}
