import { RUN_RULES } from "@/game/config/worlds";

export const PROJECTILE_COOLDOWN_MS = 260;

export class CombatState {
  constructor({ durationMs = RUN_RULES.fishPowerDurationMs, cooldownMs = PROJECTILE_COOLDOWN_MS } = {}) {
    this.durationMs = durationMs;
    this.cooldownMs = cooldownMs;
    this.reset();
  }

  reset() {
    this.poweredUntil = 0;
    this.lastShotAt = -Infinity;
    this.pausedAt = null;
    this.expiryPublished = true;
  }

  activate(now) {
    this.poweredUntil = now + this.durationMs;
    this.lastShotAt = -Infinity;
    this.expiryPublished = false;
    return this.poweredUntil;
  }

  pause(now) {
    if (this.pausedAt === null) this.pausedAt = now;
  }

  resume(now) {
    if (this.pausedAt === null) return;
    if (this.poweredUntil > this.pausedAt) this.poweredUntil += now - this.pausedAt;
    this.pausedAt = null;
  }

  remainingMs(now) {
    const effectiveNow = this.pausedAt ?? now;
    return Math.max(0, this.poweredUntil - effectiveNow);
  }

  isPowered(now) {
    return this.remainingMs(now) > 0;
  }

  tryShoot(now) {
    if (!this.isPowered(now) || now - this.lastShotAt < this.cooldownMs) return false;
    this.lastShotAt = now;
    return true;
  }

  consumeExpiry(now) {
    if (this.expiryPublished || this.poweredUntil === 0 || this.remainingMs(now) > 0) return false;
    this.expiryPublished = true;
    return true;
  }
}
