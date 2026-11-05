export class EnemySystem {
  constructor(scene, definitions, platforms) {
    this.group = scene.physics.add.group({ allowGravity: true });
    for (const definition of definitions) {
      const enemy = this.group.create(definition.x, definition.y, "jungle-objects", 0);
      enemy.setName(definition.id).setData("id", definition.id).setData("left", definition.left).setData("right", definition.right)
        .setData("speed", definition.speed).setData("direction", 1).setDisplaySize(112, 112).setSize(235, 125).setOffset(100, 245)
        .setVelocityX(definition.speed).setDepth(7).play("critter-walk");
    }
    this.platformCollider = scene.physics.add.collider(this.group, platforms);
  }

  update() {
    for (const enemy of this.group.getChildren()) {
      if (!enemy.active) continue;
      const data = enemy.data.values;
      if (enemy.x <= data.left) data.direction = 1;
      if (enemy.x >= data.right) data.direction = -1;
      enemy.setVelocityX(data.speed * data.direction).setFlipX(data.direction < 0);
    }
  }

  defeat(enemy) {
    if (!enemy.active) return null;
    const id = enemy.getData("id") || enemy.name;
    enemy.disableBody(true, true);
    return id;
  }

  destroy() {
    this.platformCollider?.destroy();
    this.platformCollider = null;
  }
}
