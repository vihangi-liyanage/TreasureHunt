export const COIN_SCORE = 100;
export const ENEMY_SCORE = 250;
export const GEM_SCORE = 200;
export const DAMAGE_INVULNERABILITY_MS = 1_200;

export function shouldAdvanceRun({ paused, status }) {
  return !paused && status === "playing";
}

export class RunState {
  constructor({ lives, timerSeconds, maxRevives = 1 }) {
    this.startingLives = lives;
    this.startingTimer = timerSeconds;
    this.maxRevives = maxRevives;
    this.reset();
  }
  reset() {
    this.score = 0; this.coins = 0; this.gems = 0; this.fishPowerUps = 0; this.lives = this.startingLives;
    this.timeLeft = this.startingTimer; this.status = "playing"; this.invulnerableUntil = 0; this.revivesUsed = 0;
    this.collectedCoins = new Set(); this.collectedGems = new Set(); this.collectedFish = new Set(); this.stompedEnemies = new Set();
  }
  collectCoin(id) {
    if (this.status !== "playing" || this.collectedCoins.has(id)) return false;
    this.collectedCoins.add(id); this.coins += 1; this.score += COIN_SCORE; return true;
  }
  collectGem(id) {
    if (this.status !== "playing" || this.collectedGems.has(id)) return false;
    this.collectedGems.add(id); this.gems += 1; this.score += GEM_SCORE; return true;
  }
  collectFish(id) {
    if (this.status !== "playing" || this.collectedFish.has(id)) return false;
    this.collectedFish.add(id); this.fishPowerUps += 1; return true;
  }
  stompEnemy(id) {
    if (this.status !== "playing" || this.stompedEnemies.has(id)) return false;
    this.stompedEnemies.add(id); this.score += ENEMY_SCORE; return true;
  }
  damage(now) {
    if (this.status !== "playing" || now < this.invulnerableUntil) return false;
    this.lives -= 1; this.invulnerableUntil = now + DAMAGE_INVULNERABILITY_MS;
    if (this.lives <= 0) this.status = "game-over";
    return true;
  }
  revive(now) {
    if (this.status !== "game-over" || this.lives > 0 || this.revivesUsed >= this.maxRevives) return false;
    this.lives = 1; this.revivesUsed += 1; this.status = "playing";
    this.invulnerableUntil = now + DAMAGE_INVULNERABILITY_MS;
    return true;
  }
  tick() {
    if (this.status !== "playing") return false;
    this.timeLeft = Math.max(0, this.timeLeft - 1);
    if (this.timeLeft === 0) this.status = "game-over";
    return true;
  }
  complete() {
    if (this.status !== "playing") return false;
    this.status = "completed"; this.score += this.timeLeft * 10; return true;
  }
  snapshot() {
    return Object.freeze({ score: this.score, coins: this.coins, gems: this.gems, fishPowerUps: this.fishPowerUps, lives: this.lives, timeLeft: this.timeLeft, status: this.status, revivesUsed: this.revivesUsed });
  }
}
