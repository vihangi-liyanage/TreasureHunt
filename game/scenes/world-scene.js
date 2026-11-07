import * as Phaser from "phaser";
import { GAME_COMMANDS, GAME_EVENTS } from "@/game/core/events";
import { CombatState } from "@/game/core/combat-state";
import { canLandOnPlatform, isBelowFallBoundary, isStompCollision } from "@/game/core/collision-rules";
import { RunState, shouldAdvanceRun } from "@/game/core/run-state";
import { RUN_RULES } from "@/game/config/worlds";
import { loadGameAssets } from "@/game/render/load-assets";
import { createGameTextures, getTerrainVisualLayout, HUNTER_PRESENTATION } from "@/game/render/create-textures";
import { getBackdropCoverLayout } from "@/game/render/backdrop-layout";
import { CameraController } from "@/game/systems/camera-controller";
import { PlayerController } from "@/game/systems/player-controller";
import { EnemySystem } from "@/game/systems/enemy-system";
import { ProjectileSystem } from "@/game/systems/projectile-system";

export class WorldScene extends Phaser.Scene {
  constructor() { super("WorldScene"); }

  init({ world, level, bridge }) {
    this.worldConfig = world;
    this.level = level;
    this.bridge = bridge;
    this.commandCleanups = [];
    this.effectObjects = new Set();
    this.isPaused = false;
    this.reducedMotion = Boolean(globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
    this.safePosition = { ...level.playerStart };
  }

  preload() {
    this.assetLoadFailed = false;
    this.load.once(Phaser.Loader.Events.FILE_LOAD_ERROR, (file) => {
      this.assetLoadFailed = true;
      this.bridge.emit(GAME_EVENTS.LOAD_FAILED, { assetKey: file.key });
    });
    loadGameAssets(this, this.level.art);
  }

  create() {
    if (this.assetLoadFailed) return;
    createGameTextures(this, this.level.art);
    this.run = new RunState({ lives: RUN_RULES.startingLives, timerSeconds: this.worldConfig.timerSeconds });
    this.combat = new CombatState();
    this.runClockMs = 0;
    this.timerAccumulatorMs = 0;
    this.physics.world.setBounds(0, 0, this.level.width, this.level.height + 220);
    this.createBackdrop();
    this.createLevelGeometry();
    this.createPlayer();
    this.createCollectibles();
    this.createEnemies();
    this.createGoal();
    this.registerCollisions();
    this.registerCommands();
    this.cameraController = new CameraController(this, this.player, this.level.width, this.level.height);
    this.cameras.main.fadeIn(450, 8, 35, 28);
    this.bridge.emit(GAME_EVENTS.READY, { worldId: this.worldConfig.id });
    this.publishState();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
  }

  createBackdrop() {
    this.backdrop = this.add.image(0, 0, "world-panorama").setOrigin(0).setScrollFactor(0).setDepth(-100);
    this.backdropShade = this.add.rectangle(0, 0, 10, 10, this.level.art.shade, 0.12).setOrigin(0).setScrollFactor(0).setDepth(-90);
    this.foregroundRuins = [];
    for (let x = 780; x < this.level.width; x += 1_050) {
      const ruin = this.add.image(x, 435 + (x % 170), "world-terrain", 3).setDisplaySize(260, 260)
        .setAlpha(0.32).setTint(this.level.art.foregroundTint).setScrollFactor(0.45).setDepth(-10);
      this.foregroundRuins.push(ruin);
    }
  }

  resizeBackdrop(width, height) {
    const source = this.textures.get("world-panorama").getSourceImage();
    const layout = getBackdropCoverLayout({
      sourceWidth: source.width,
      sourceHeight: source.height,
      viewportWidth: width,
      viewportHeight: height,
      overscan: this.level.art.backdropOverscan,
    });
    this.backdrop.setDisplaySize(layout.width, layout.height).setPosition(layout.x, layout.y);
    this.backdropShade.setDisplaySize(width, height);
  }

  createLevelGeometry() {
    this.platforms = this.physics.add.staticGroup();
    for (const definition of this.level.platforms) {
      const hitbox = this.platforms.create(definition.x, definition.top + 14, "platform-hitbox")
        .setDisplaySize(definition.width, 28).setVisible(false).refreshBody().setData("platformId", definition.id);
      hitbox.body.checkCollision.down = false;
      hitbox.body.checkCollision.left = false;
      hitbox.body.checkCollision.right = false;
      const visual = getTerrainVisualLayout(definition, this.level.art.terrainPresentation, this.level.art.terrainFrameHeight);
      this.add.image(definition.x, visual.y, "world-terrain", visual.frame)
        .setDisplaySize(visual.width, visual.height).setOrigin(0.5, 0).setDepth(2);
    }
    this.hazards = this.physics.add.staticGroup();
    for (const definition of this.level.hazards) {
      const hazard = this.hazards.create(definition.x, definition.top + 18, "platform-hitbox")
        .setDisplaySize(definition.width * 0.72, 34).setVisible(false).refreshBody();
      hazard.setData("cause", "thorns");
      this.add.image(definition.x, definition.top - 28, "world-objects", 5)
        .setDisplaySize(definition.width + 65, 120).setDepth(5);
    }
  }

  createPlayer() {
    this.player = this.physics.add.sprite(this.level.playerStart.x, this.level.playerStart.y, "hunter-atlas", 0)
      .setDisplaySize(HUNTER_PRESENTATION.displaySize, HUNTER_PRESENTATION.displaySize).setDepth(10)
      .setCollideWorldBounds(false).setDragX(this.level.motion.groundDrag);
    this.player.setSize(HUNTER_PRESENTATION.bodyWidth, HUNTER_PRESENTATION.bodyHeight)
      .setOffset(HUNTER_PRESENTATION.bodyOffsetX, HUNTER_PRESENTATION.bodyOffsetY);
    this.player.body.setAllowGravity(true);
    this.playerController = new PlayerController(this, this.player, this.bridge, this.level.motion);
  }

  createCollectibles() {
    this.coins = this.physics.add.group({ allowGravity: false, immovable: true });
    for (const definition of this.level.coins) {
      const frameSize = this.level.art.objectFrameSize;
      const coin = this.coins.create(definition.x, definition.y, "world-objects", 2)
        .setData("coinId", definition.id).setDisplaySize(64, 64)
        .setCircle(frameSize * 0.28, frameSize * 0.23, frameSize * 0.23).setDepth(8);
      this.tweens.add({ targets: coin, y: definition.y - 9, scaleX: 0.08, duration: 720, yoyo: true, repeat: -1, ease: "Sine.inOut" });
    }
    this.fishPowerUps = this.physics.add.group({ allowGravity: false, immovable: true });
    for (const definition of this.level.fishPowerUps) {
      const frameSize = this.level.art.objectFrameSize;
      const fish = this.fishPowerUps.create(definition.x, definition.y, "world-objects", 3)
        .setData("powerId", definition.id).setDisplaySize(78, 78)
        .setCircle(frameSize * 0.28, frameSize * 0.22, frameSize * 0.22).setDepth(9);
      this.tweens.add({ targets: fish, y: definition.y - 12, angle: 5, duration: 900, yoyo: true, repeat: -1, ease: "Sine.inOut" });
    }
  }

  createEnemies() {
    this.enemySystem = new EnemySystem(this, this.level.enemies, this.platforms, this.level.art.enemyPresentation);
    this.projectileSystem = new ProjectileSystem(this, this.bridge, this.combat, this.enemySystem.group, (enemy, cause) => this.defeatEnemy(enemy, cause));
  }

  createGoal() {
    const { x, y, type } = this.level.goal;
    const isTreasure = type === "treasure";
    this.goal = this.physics.add.staticImage(x, y, "platform-hitbox")
      .setDisplaySize(isTreasure ? 110 : 76, 135).setVisible(false).refreshBody();
    this.goalArt = this.add.image(x, y - 32, "world-objects", 6)
      .setDisplaySize(isTreasure ? 205 : 190, isTreasure ? 205 : 190).setDepth(4);
    const glowColor = isTreasure ? 0x8dfcff : 0xffd76a;
    const glow = this.trackEffect(this.add.circle(x, y - 42, isTreasure ? 78 : 68, glowColor, 0.18)
      .setBlendMode(Phaser.BlendModes.ADD).setDepth(3));
    this.trackEffect(this.add.rectangle(x, y - 88, isTreasure ? 84 : 58, 230, glowColor, 0.055)
      .setBlendMode(Phaser.BlendModes.ADD).setDepth(1));
    if (!this.reducedMotion) {
      this.tweens.add({ targets: [this.goalArt, glow], y: "-=8", alpha: { from: 0.72, to: 1 }, duration: 900, yoyo: true, repeat: -1, ease: "Sine.inOut" });
      for (let index = 0; index < 7; index += 1) {
        const mote = this.trackEffect(this.add.circle(x - 55 + index * 18, y - 20 - (index % 3) * 24, 3 + (index % 2), glowColor, 0.42)
          .setBlendMode(Phaser.BlendModes.ADD).setDepth(5));
        this.tweens.add({ targets: mote, y: mote.y - 34, alpha: { from: 0.15, to: 0.72 }, duration: 1_050 + index * 70, delay: index * 90, yoyo: true, repeat: -1, ease: "Sine.inOut" });
      }
    }
    this.add.text(x, y - 145, isTreasure ? "LEGENDARY TREASURE" : "COMPASS SHRINE", {
      fontFamily: "Georgia, serif", fontSize: "18px", fontStyle: "bold", color: "#fff2b5", stroke: "#123b2d", strokeThickness: 6,
    }).setOrigin(0.5).setDepth(6);
  }

  registerCollisions() {
    this.platformCollider = this.physics.add.collider(
      this.player,
      this.platforms,
      undefined,
      (player, platform) => canLandOnPlatform({
        playerVelocityY: player.body.velocity.y,
        previousBottom: player.body.prev.y + player.body.height,
        platformTop: platform.body.top,
      }),
    );
    this.physics.add.overlap(this.player, this.coins, (_player, coin) => this.collectCoin(coin));
    this.physics.add.overlap(this.player, this.fishPowerUps, (_player, fish) => this.collectFish(fish));
    this.physics.add.overlap(this.player, this.hazards, () => this.damagePlayer("hazard"));
    this.physics.add.overlap(this.player, this.enemySystem.group, (_player, enemy) => this.touchEnemy(enemy));
    this.physics.add.overlap(this.player, this.goal, () => this.completeWorld());
  }

  registerCommands() {
    this.commandCleanups.push(
      this.bridge.on(GAME_COMMANDS.PAUSE, () => this.setPaused(true)),
      this.bridge.on(GAME_COMMANDS.RESUME, () => this.setPaused(false)),
      this.bridge.on(GAME_COMMANDS.RESTART, () => {
        if (this.isPaused) this.physics.resume();
        this.scene.restart({ world: this.worldConfig, level: this.level, bridge: this.bridge });
      }),
    );
    this.escapeHandler = () => { if (!this.isPaused) this.setPaused(true); };
    this.input.keyboard.on("keydown-ESC", this.escapeHandler);
  }

  update(_time, delta) {
    if (!shouldAdvanceRun({ paused: this.isPaused, status: this.run.status })) return;
    const activeDelta = Math.min(delta, 100);
    this.runClockMs += activeDelta;
    this.timerAccumulatorMs += activeDelta;
    while (this.timerAccumulatorMs >= 1_000 && this.run.status === "playing") {
      this.timerAccumulatorMs -= 1_000;
      this.tickTimer();
    }
    const actions = this.playerController.update(this.runClockMs);
    if (actions.landed) this.createDust(this.player.x, this.player.body.bottom);
    if (actions.shoot && this.projectileSystem.fire(this.player, actions.facing, this.runClockMs)) this.playerController.showShoot(this.runClockMs);
    this.enemySystem.update();
    this.projectileSystem.update(this.runClockMs, this.level.width);
    this.player.x = Phaser.Math.Clamp(this.player.x, 25, this.level.width - 25);
    if (isBelowFallBoundary({ bodyTop: this.player.body.top, levelHeight: this.level.height })) this.damagePlayer("fall");
    if (this.combat.consumeExpiry(this.runClockMs)) {
      this.bridge.emit(GAME_EVENTS.POWER_EXPIRED, { worldId: this.worldConfig.id });
      this.publishState();
    } else if (this.combat.isPowered(this.runClockMs)) this.publishPowerState(this.runClockMs);
  }

  tickTimer() {
    if (!this.run.tick()) return;
    this.publishState();
    if (this.run.status === "game-over") this.finishRun("timer");
  }

  collectCoin(coin) {
    const id = coin.getData("coinId");
    if (!this.run.collectCoin(id)) return;
    this.createImpact(coin.x, coin.y);
    coin.disableBody(true, true);
    this.bridge.emit(GAME_EVENTS.COIN_COLLECTED, { id, score: this.run.score, coins: this.run.coins });
    this.publishState();
  }

  collectFish(fish) {
    if (!fish.active) return;
    const id = fish.getData("powerId");
    fish.disableBody(true, true);
    this.combat.activate(this.runClockMs);
    this.createImpact(fish.x, fish.y, 0x5fffe1);
    this.bridge.emit(GAME_EVENTS.FISH_COLLECTED, { id });
    this.bridge.emit(GAME_EVENTS.POWER_STARTED, { durationMs: RUN_RULES.fishPowerDurationMs });
    this.publishState();
  }

  touchEnemy(enemy) {
    if (!enemy.active || this.run.status !== "playing") return;
    const stomped = isStompCollision({ playerVelocityY: this.player.body.velocity.y, playerBottom: this.player.body.bottom, enemyCenterY: enemy.body.center.y });
    if (stomped) {
      this.defeatEnemy(enemy, "stomp");
      this.player.setVelocityY(-390);
      return;
    }
    this.damagePlayer("enemy");
  }

  defeatEnemy(enemy, cause) {
    const id = this.enemySystem.defeat(enemy);
    if (!id || !this.run.stompEnemy(id)) return;
    this.cameras.main.shake(90, 0.0025);
    const eventName = cause === "stomp" ? GAME_EVENTS.ENEMY_STOMPED : GAME_EVENTS.ENEMY_DEFEATED;
    this.bridge.emit(eventName, { id, cause, score: this.run.score });
    this.publishState();
  }

  damagePlayer(cause) {
    if (this.run.status !== "playing") return;
    const damaged = this.run.damage(this.runClockMs);
    if (!damaged && cause !== "fall") return;
    this.cameras.main.shake(180, 0.008);
    this.playerController.showDamage(this.runClockMs);
    this.player.setTint(0xff9a82).setVelocity(0, -260);
    this.time.delayedCall(260, () => this.player?.active && this.player.clearTint());
    this.bridge.emit(GAME_EVENTS.PLAYER_DAMAGED, { cause, lives: this.run.lives });
    this.publishState();
    if (this.run.status === "game-over") { this.finishRun("lives"); return; }
    this.player.body.reset(this.safePosition.x, this.safePosition.y);
    this.player.body.setAllowGravity(true);
  }

  completeWorld() {
    if (!this.run.complete()) return;
    this.physics.pause();
    this.player.anims.stop().setFrame(7);
    this.createGoalCelebration(this.level.goal.type === "treasure");
    if (!this.reducedMotion) this.cameras.main.flash(600, 255, 225, 116);
    const result = { ...this.run.snapshot(), worldId: this.worldConfig.id, completion: this.worldConfig.completion };
    this.publishState();
    this.bridge.emit(GAME_EVENTS.WORLD_COMPLETED, result);
  }

  finishRun(reason) {
    this.physics.pause();
    this.publishState();
    this.bridge.emit(GAME_EVENTS.RUN_ENDED, { ...this.run.snapshot(), reason });
  }

  setPaused(paused) {
    if (this.run.status !== "playing" || this.isPaused === paused) return;
    this.isPaused = paused;
    if (paused) { this.physics.pause(); this.combat.pause(this.runClockMs); }
    else { this.physics.resume(); this.combat.resume(this.runClockMs); }
    this.bridge.emit(GAME_COMMANDS.INPUT_RELEASE_ALL);
    this.publishState();
  }

  publishPowerState(time) {
    const remaining = this.combat.remainingMs(time);
    const roundedSeconds = Math.ceil(remaining / 250) / 4;
    if (roundedSeconds !== this.lastPublishedPowerSeconds) {
      this.lastPublishedPowerSeconds = roundedSeconds;
      this.publishState();
    }
  }

  publishState() {
    const remaining = this.combat?.remainingMs(this.runClockMs) ?? 0;
    this.bridge.emit(GAME_EVENTS.STATE_CHANGED, {
      ...this.run.snapshot(), paused: this.isPaused, worldId: this.worldConfig.id, worldName: this.worldConfig.name,
      powerRemainingMs: remaining, powered: remaining > 0,
    });
  }

  createImpact(x, y, color = 0xffd75e) {
    const burst = this.add.circle(x, y, 10, color, 0.9).setDepth(20);
    this.tweens.add({ targets: burst, scale: 4, alpha: 0, duration: 280, onComplete: () => burst.destroy() });
    for (let index = 0; index < 7; index += 1) {
      const spark = this.add.image(x, y, "gold-spark").setTint(color).setScale(0.45).setDepth(20);
      const angle = (Math.PI * 2 * index) / 7;
      this.tweens.add({ targets: spark, x: x + Math.cos(angle) * 55, y: y + Math.sin(angle) * 55, alpha: 0, scale: 0.05, duration: 340, onComplete: () => spark.destroy() });
    }
  }

  createDust(x, y) {
    for (let index = 0; index < 4; index += 1) {
      const dust = this.add.image(x + (index - 2) * 8, y, "dust-particle").setDepth(9);
      this.tweens.add({ targets: dust, x: dust.x + (index - 1.5) * 18, y: y - 18, alpha: 0, duration: 260, onComplete: () => dust.destroy() });
    }
  }

  trackEffect(object) {
    this.effectObjects.add(object);
    return object;
  }

  destroyEffect(object) {
    if (!object) return;
    this.effectObjects.delete(object);
    this.tweens.killTweensOf(object);
    if (object.active) object.destroy();
  }

  createGoalCelebration(isTreasure) {
    const { x, y } = this.level.goal;
    const primary = isTreasure ? 0x8dfcff : 0xffd45c;
    const light = this.trackEffect(this.add.circle(x, y - 48, isTreasure ? 96 : 82, primary, 0.32)
      .setBlendMode(Phaser.BlendModes.ADD).setDepth(18));
    if (this.reducedMotion) return;

    this.tweens.add({
      targets: light, scale: isTreasure ? 3.6 : 2.8, alpha: 0, duration: isTreasure ? 1_450 : 1_050, ease: "Cubic.out",
      onComplete: () => this.destroyEffect(light),
    });
    const particleCount = isTreasure ? 34 : 22;
    const petalColors = isTreasure ? [0x8dfcff, 0xc4a2ff, 0xffdd78, 0xff8fc9] : [0xffd45c, 0xfff0aa, 0xff8fa8, 0xffb45f];
    for (let index = 0; index < particleCount; index += 1) {
      const angle = (Math.PI * 2 * index) / particleCount;
      const distance = 95 + (index % 6) * 24;
      const petal = this.trackEffect(this.add.ellipse(x, y - 55, 11 + (index % 3) * 2, 5 + (index % 2) * 2, petalColors[index % petalColors.length], 0.92)
        .setAngle(index * 29).setDepth(21));
      this.tweens.add({
        targets: petal,
        x: x + Math.cos(angle) * distance,
        y: y - 85 + Math.sin(angle) * distance * 0.72 + (index % 4) * 18,
        angle: petal.angle + 220 + index * 9,
        alpha: 0,
        duration: 850 + (index % 7) * 95,
        delay: (index % 5) * 35,
        ease: "Cubic.out",
        onComplete: () => this.destroyEffect(petal),
      });
      if (index % 2 === 0) {
        const sparkle = this.trackEffect(this.add.image(x, y - 55, "gold-spark").setTint(primary).setScale(0.55).setDepth(22));
        this.tweens.add({
          targets: sparkle,
          x: x + Math.cos(angle + 0.2) * distance * 1.15,
          y: y - 70 + Math.sin(angle + 0.2) * distance,
          scale: 0.05,
          alpha: 0,
          duration: 650 + (index % 6) * 80,
          onComplete: () => this.destroyEffect(sparkle),
        });
      }
    }
  }

  cleanup() {
    this.playerController?.destroy();
    this.projectileSystem?.destroy();
    this.enemySystem?.destroy();
    this.cameraController?.destroy();
    this.platformCollider?.destroy();
    for (const cleanup of this.commandCleanups) cleanup();
    this.input.keyboard.off("keydown-ESC", this.escapeHandler);
    for (const object of [...this.effectObjects]) this.destroyEffect(object);
  }
}
