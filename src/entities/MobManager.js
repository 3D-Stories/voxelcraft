// src/entities/MobManager.js
// Spawns and ticks zombies at night, tests player attacks against them and
// removes dead/far mobs. One manager drives every hostile mob for now.

import { Zombie } from './Zombie.js';

const SPAWN_INTERVAL = 4; // seconds between spawn attempts
const DESPAWN_DISTANCE = 64;

function rayBox(origin, direction, aabb) {
  let tmin = 0;
  let tmax = Infinity;
  const bounds = [
    ['x', aabb.minX, aabb.maxX],
    ['y', aabb.minY, aabb.maxY],
    ['z', aabb.minZ, aabb.maxZ],
  ];
  for (const [axis, min, max] of bounds) {
    const originValue = origin[axis];
    const dir = direction[axis];
    if (Math.abs(dir) < 1e-8) {
      if (originValue < min || originValue > max) return null;
      continue;
    }
    let t1 = (min - originValue) / dir;
    let t2 = (max - originValue) / dir;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return null;
  }
  return tmin;
}

export class MobManager {
  constructor(scene, world, options = {}) {
    this.scene = scene;
    this.world = world;
    this.player = options.player;
    this.survival = options.survival;
    this.surfaceHeight = options.surfaceHeight ?? null;
    this.isNight = options.isNight ?? (() => false);
    this.maxMobs = options.maxMobs ?? 6;
    this.spawnInterval = options.spawnInterval ?? SPAWN_INTERVAL;
    this.mobs = [];
    this.spawnTimer = 0;
  }

  update(dt) {
    const isDay = !this.isNight();
    for (const mob of this.mobs) {
      mob.update(dt, this.player, this.survival, isDay);

      const dx = mob.position.x - this.player.position.x;
      const dz = mob.position.z - this.player.position.z;
      if (dx * dx + dz * dz > DESPAWN_DISTANCE * DESPAWN_DISTANCE) mob.health = 0;
      if (mob.isDead && !mob.removed) mob.dispose();
    }
    this.mobs = this.mobs.filter((mob) => !mob.removed);

    if (isDay) return;
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnInterval && this.mobs.length < this.maxMobs) {
      this.spawnTimer = 0;
      this._trySpawn();
    }
  }

  _trySpawn() {
    if (!this.surfaceHeight || !this.player) return null;
    const angle = Math.random() * Math.PI * 2;
    const distance = 16 + Math.random() * 24;
    const x = Math.floor(this.player.position.x + Math.cos(angle) * distance);
    const z = Math.floor(this.player.position.z + Math.sin(angle) * distance);
    const surface = this.surfaceHeight(x, z);
    const y = surface + 1;

    if (!this.world.isSolidAt(x, y - 1, z)) return null;
    if (this.world.isSolidAt(x, y, z) || this.world.isSolidAt(x, y + 1, z)) return null;

    const mob = new Zombie(this.world, x + 0.5, y, z + 0.5);
    this.mobs.push(mob);
    if (this.scene) this.scene.add(mob.mesh);
    return mob;
  }

  // Nearest mob hit by the crosshair ray within maxDistance.
  raycast(origin, direction, maxDistance) {
    let best = null;
    for (const mob of this.mobs) {
      const t = rayBox(origin, direction, mob.getAABB());
      if (t === null || t > maxDistance) continue;
      if (!best || t < best.distance) best = { mob, distance: t };
    }
    return best;
  }

  hit(mob, damage, fromX, fromZ) {
    mob.damage(damage, fromX, fromZ);
    if (mob.isDead && !mob.removed) mob.dispose();
    this.mobs = this.mobs.filter((m) => !m.removed);
  }

  dispose() {
    for (const mob of this.mobs) mob.dispose();
    this.mobs = [];
  }
}
