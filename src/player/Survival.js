// src/player/Survival.js
// Health, air, hunger and death (docs/06-research-mechanics.md 1.2, 1.5, 1.6).
// Fall damage: max(0, floor(fallDistance - 3)) HP
// (https://minecraft.wiki/w/Damage#Fall_damage). Drowning: 2 HP/s after 10 s
// of air; starvation: 1 HP / 4 s at hunger 0.

import { getItem } from '../core/ItemRegistry.js';
import { BlockRegistry } from '../core/BlockRegistry.js';

export const MAX_HEALTH = 20;
export const MAX_HUNGER = 20;
export const MAX_AIR = 200; // 10 s (docs/06-research-mechanics.md §1.3)
export const REGEN_TICKS = 80; // 4 s
export const STARVE_TICKS = 80;
export const DROWN_TICKS = 20;

export class Survival {
  constructor(player, options = {}) {
    this.player = player;
    this.world = options.world ?? null;
    this.spawn = options.spawn ?? { x: 0, y: 64, z: 0 };
    this.onDeath = options.onDeath ?? null;
    this.onDamage = options.onDamage ?? null;

    this.maxHealth = MAX_HEALTH;
    this.maxHunger = MAX_HUNGER;
    this.maxAir = MAX_AIR;
    this.reset();
  }

  reset() {
    this.health = this.maxHealth;
    this.hunger = this.maxHunger;
    this.saturation = 5;
    this.exhaustion = 0;
    this.air = this.maxAir;
    this.fallDistance = 0;
    this.dead = false;
    this.flash = 0;
    this._wasOnGround = this.player.onGround;
    this._lastX = this.player.position.x;
    this._lastZ = this.player.position.z;
    this._regenTimer = 0;
    this._starveTimer = 0;
    this._airTimer = 0;
  }

  respawn() {
    this.reset();
    const p = this.player;
    p.position.set(this.spawn.x, this.spawn.y, this.spawn.z);
    p.velocity.set(0, 0, 0);
    p.onGround = false;
  }

  damage(amount, source = 'generic') {
    if (this.dead || this.player.godMode || amount <= 0) return;
    this.health = Math.max(0, this.health - amount);
    this.flash = Math.min(1, this.flash + 0.6);
    if (this.onDamage) this.onDamage(amount, source);
    if (this.health <= 0) this.die();
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    this.health = 0;
    if (this.onDeath) this.onDeath();
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  addExhaustion(amount) {
    this.exhaustion += amount;
  }

  eat(itemId) {
    const def = getItem(itemId);
    if (!def?.food) return false;
    if (this.hunger >= this.maxHunger && this.health >= this.maxHealth) return false;
    this.hunger = Math.min(this.maxHunger, this.hunger + def.food.hunger);
    this.saturation = Math.min(this.hunger, this.saturation + def.food.saturation);
    return true;
  }

  update(dt) {
    if (this.dead) return;
    const player = this.player;
    this.flash = Math.max(0, this.flash - dt * 2);

    if (player.godMode) {
      this.health = this.maxHealth;
      this.hunger = this.maxHunger;
      this.saturation = 5;
      this.exhaustion = 0;
      this.air = this.maxAir;
      this.fallDistance = 0;
      this._wasOnGround = player.onGround;
      this._lastX = player.position.x;
      this._lastZ = player.position.z;
      return;
    }

    // Movement and jumping cost exhaustion (docs/06 §1.6).
    const dx = player.position.x - this._lastX;
    const dz = player.position.z - this._lastZ;
    const distance = Math.hypot(dx, dz);
    this._lastX = player.position.x;
    this._lastZ = player.position.z;
    if (distance > 0) {
      this.exhaustion += distance * (player.sprinting ? 0.1 : 0.01);
    }
    if (player.velocity.y > 0 && this._wasOnGround && !player.flying) {
      this.exhaustion += player.sprinting ? 0.2 : 0.05;
    }

    // Fall damage on landing.
    if (player.onGround || player.inWater || player.flying) {
      if (
        !this._wasOnGround
        && !player.inWater
        && !player.flying
        && this.fallDistance > 0
      ) {
        const damage = Math.max(0, Math.floor(this.fallDistance - 3));
        if (damage > 0) this.damage(damage, 'fall');
      }
      this.fallDistance = 0;
    } else if (player.velocity.y < 0) {
      this.fallDistance += -player.velocity.y * dt;
    }
    this._wasOnGround = player.onGround;

    // Air / drowning.
    if (this._eyeInWater()) {
      this.air = Math.max(0, this.air - 1);
      if (this.air === 0) {
        this._airTimer += 1;
        if (this._airTimer >= DROWN_TICKS) {
          this._airTimer = 0;
          this.damage(2, 'drown');
        }
      }
    } else {
      this.air = Math.min(this.maxAir, this.air + 4);
      this._airTimer = 0;
    }

    // Hunger drain.
    while (this.exhaustion >= 4) {
      this.exhaustion -= 4;
      if (this.saturation > 0) this.saturation = Math.max(0, this.saturation - 1);
      else if (this.hunger > 0) this.hunger -= 1;
    }

    // Regeneration at high hunger.
    if (this.hunger >= 18 && this.health < this.maxHealth && this.saturation > 0) {
      this._regenTimer += 1;
      if (this._regenTimer >= REGEN_TICKS) {
        this._regenTimer = 0;
        this.heal(1);
        this.exhaustion += 6;
      }
    } else {
      this._regenTimer = 0;
    }

    // Starvation.
    if (this.hunger <= 0) {
      this._starveTimer += 1;
      if (this._starveTimer >= STARVE_TICKS) {
        this._starveTimer = 0;
        this.damage(1, 'starve');
      }
    } else {
      this._starveTimer = 0;
    }

    if (player.position.y < -70) this.damage(4, 'void');
  }

  _eyeInWater() {
    if (!this.world || typeof this.world.getBlock !== 'function') return false;
    const p = this.player;
    const block = this.world.getBlock(p.position.x, p.position.y + p.eyeHeight, p.position.z);
    return block?.id === BlockRegistry.WATER;
  }

  toJSON() {
    return {
      health: this.health,
      hunger: this.hunger,
      saturation: this.saturation,
      air: this.air,
    };
  }

  restore(data) {
    if (!data) return;
    if (Number.isFinite(data.health)) this.health = Math.max(0, Math.min(this.maxHealth, data.health));
    if (Number.isFinite(data.hunger)) this.hunger = Math.max(0, Math.min(this.maxHunger, data.hunger));
    if (Number.isFinite(data.saturation)) this.saturation = Math.max(0, data.saturation);
    if (Number.isFinite(data.air)) this.air = Math.max(0, Math.min(this.maxAir, data.air));
    if (this.health <= 0) {
      this.health = this.maxHealth;
      this.dead = false;
    }
  }
}
