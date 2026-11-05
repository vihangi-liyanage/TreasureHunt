import { GAME_EVENTS } from "@/game/core/events";

const PROJECTILE_SPEED = 610;

export class ProjectileSystem {
  constructor(scene, bridge, combat, enemies, onEnemyHit) {
    this.scene = scene;
    this.bridge = bridge;
    this.combat = combat;
    this.group = scene.physics.add.group({ allowGravity: false, maxSize: 12 });
    this.enemyOverlap = scene.physics.add.overlap(this.group, enemies, (projectile, enemy) => {
      if (!projectile.active || !enemy.active) return;
      const point = { x: enemy.x, y: enemy.y };
      projectile.disableBody(true, true);
      onEnemyHit(enemy, "projectile");
      scene.createImpact(point.x, point.y);
    });
  }

  fire(player, direction, now) {
    if (!this.combat.tryShoot(now)) return false;
    const projectileY = player.body.center.y;
    const projectile = this.group.get(player.x + direction * 46, projectileY, "world-objects", 4);
    if (!projectile) return false;
    projectile.enableBody(true, player.x + direction * 46, projectileY, true, true)
      .setDisplaySize(54, 54).setSize(220, 220, true).setVelocityX(direction * PROJECTILE_SPEED).setDepth(12);
    projectile.setData("bornAt", now).setAngularVelocity(direction * 260);
    this.bridge.emit(GAME_EVENTS.PROJECTILE_FIRED, { direction });
    return true;
  }

  update(now, worldWidth) {
    for (const projectile of this.group.getChildren()) {
      if (projectile.active && (now - projectile.getData("bornAt") > 1_500 || projectile.x < 0 || projectile.x > worldWidth)) {
        projectile.disableBody(true, true);
      }
    }
  }

  destroy() {
    this.enemyOverlap?.destroy();
    this.enemyOverlap = null;
  }
}
