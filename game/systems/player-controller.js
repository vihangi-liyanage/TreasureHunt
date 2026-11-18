import * as Phaser from "phaser";
import { GAME_COMMANDS } from "@/game/core/events";
import { InputState } from "@/game/core/input-state";

export class PlayerController {
  constructor(scene, player, bridge, motion) {
    this.scene = scene;
    this.player = player;
    this.motion = motion;
    this.inputState = new InputState();
    this.facing = 1;
    this.lastGroundedAt = -Infinity;
    this.jumpQueuedAt = -Infinity;
    this.wasGrounded = false;
    this.animationLockedUntil = 0;
    this.keys = scene.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT, right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      a: Phaser.Input.Keyboard.KeyCodes.A, d: Phaser.Input.Keyboard.KeyCodes.D,
      up: Phaser.Input.Keyboard.KeyCodes.UP, space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      shoot: Phaser.Input.Keyboard.KeyCodes.F,
    });
    this.unsubscribe = bridge.on(GAME_COMMANDS.INPUT, ({ control, pressed, pointerId = "bridge" }) => {
      this.inputState.set(control, Boolean(pressed), pointerId);
    });
    this.releaseAll = bridge.on(GAME_COMMANDS.INPUT_RELEASE_ALL, () => this.inputState.reset());
  }

  update(now) {
    const body = this.player.body;
    const grounded = body.blocked.down || body.touching.down;
    if (grounded) this.lastGroundedAt = now;
    const left = this.keys.left.isDown || this.keys.a.isDown || this.inputState.isDown("left");
    const right = this.keys.right.isDown || this.keys.d.isDown || this.inputState.isDown("right");
    const keyboardJump = Phaser.Input.Keyboard.JustDown(this.keys.up) || Phaser.Input.Keyboard.JustDown(this.keys.space);
    if (keyboardJump || this.inputState.consumePress("jump")) this.jumpQueuedAt = now;
    const canUseCoyote = now - this.lastGroundedAt <= this.motion.coyoteTimeMs;
    const hasBufferedJump = now - this.jumpQueuedAt <= this.motion.jumpBufferMs;

    if (left === right) {
      this.player.setAccelerationX(0).setDragX(grounded ? this.motion.groundDrag : 180);
    } else {
      this.facing = left ? -1 : 1;
      this.player.setAccelerationX(this.facing * (grounded ? this.motion.groundAcceleration : this.motion.airAcceleration)).setDragX(0).setFlipX(this.facing < 0);
    }
    this.player.setMaxVelocity(this.motion.moveSpeed, 980);
    let jumped = false;
    if (hasBufferedJump && canUseCoyote) {
      this.player.setVelocityY(-this.motion.jumpVelocity);
      jumped = true;
      this.jumpQueuedAt = -Infinity;
      this.lastGroundedAt = -Infinity;
    }

    const shoot = Phaser.Input.Keyboard.JustDown(this.keys.shoot) || this.inputState.consumePress("shoot");
    this.updateAnimation(grounded, now);
    const landed = grounded && !this.wasGrounded;
    this.wasGrounded = grounded;
    return { shoot, jumped, landed, facing: this.facing };
  }

  updateAnimation(grounded, now) {
    if (now < this.animationLockedUntil) return;
    const velocity = this.player.body.velocity;
    if (!grounded) this.player.anims.stop().setFrame(velocity.y < 0 ? 3 : 4);
    else if (Math.abs(velocity.x) > 35) this.player.play("hunter-run", true);
    else this.player.play("hunter-idle", true);
  }

  showDamage(now) {
    this.animationLockedUntil = now + 260;
    this.player.anims.stop().setFrame(5);
  }

  showShoot(now) {
    this.animationLockedUntil = now + 180;
    this.player.anims.stop().setFrame(6);
  }

  destroy() {
    this.unsubscribe?.();
    this.releaseAll?.();
    this.inputState.reset();
  }
}
