import * as Phaser from "phaser";

export class CameraController {
  constructor(scene, player, worldWidth, worldHeight) {
    this.scene = scene;
    this.camera = scene.cameras.main;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.camera.setBounds(0, 0, worldWidth, worldHeight).startFollow(player, true, 0.09, 0.1);
    this.resizeHandler = (size) => this.resize(size.width, size.height);
    scene.scale.on(Phaser.Scale.Events.RESIZE, this.resizeHandler);
    this.resize(scene.scale.width, scene.scale.height);
  }

  resize(width, height) {
    const zoom = Phaser.Math.Clamp(height / this.worldHeight, 0.72, 2);
    this.camera.setZoom(zoom);
    const viewportWidth = width / zoom;
    const viewportHeight = height / zoom;
    this.camera.setDeadzone(Math.min(220, viewportWidth * 0.34), Math.min(110, viewportHeight * 0.18));
    this.scene.resizeBackdrop(viewportWidth, viewportHeight, width / 2, height / 2);
  }

  destroy() {
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.resizeHandler);
  }
}
