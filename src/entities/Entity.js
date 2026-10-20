// src/entities/Entity.js
// Base voxel entity: AABB, gravity and axis-separated collision against the
// chunk world. Mobs use a 0.6x1.8-style box like the player.

import * as THREE from 'three';

const GRAVITY = -32;
const TERMINAL = -78;
const SUBSTEP = 0.25;
const EPS = 1e-7;

export class Entity {
  constructor(world, x, y, z, options = {}) {
    this.world = world;
    this.position = new THREE.Vector3(x, y, z);
    this.velocity = new THREE.Vector3();
    this.width = options.width ?? 0.6;
    this.height = options.height ?? 1.8;
    this.onGround = false;
    this.removed = false;
  }

  get halfWidth() {
    return this.width / 2;
  }

  getAABB() {
    const h = this.halfWidth;
    return {
      minX: this.position.x - h,
      minY: this.position.y,
      minZ: this.position.z - h,
      maxX: this.position.x + h,
      maxY: this.position.y + this.height,
      maxZ: this.position.z + h,
    };
  }

  // Mob physics: vertical first (sets onGround), then a step-aware horizontal
  // move, then gravity. Mobs climb one-block steps.
  applyMobPhysics(dt) {
    this.onGround = false;
    this._moveAxis('y', this.velocity.y * dt);
    this.moveHorizontal(dt);
    this.velocity.y += GRAVITY * dt;
    this.velocity.y *= Math.pow(0.98, dt / 0.05);
    if (this.velocity.y < TERMINAL) this.velocity.y = TERMINAL;
  }

  applyPhysics(dt) {
    this.onGround = false;
    this._moveAxis('y', this.velocity.y * dt);
    this._moveAxis('x', this.velocity.x * dt);
    this._moveAxis('z', this.velocity.z * dt);

    this.velocity.y += GRAVITY * dt;
    this.velocity.y *= Math.pow(0.98, dt / 0.05);
    if (this.velocity.y < TERMINAL) this.velocity.y = TERMINAL;
  }

  _moveAxis(axis, delta) {
    if (delta === 0) return false;
    const steps = Math.max(1, Math.ceil(Math.abs(delta) / SUBSTEP));
    const step = delta / steps;
    for (let i = 0; i < steps; i++) {
      if (this._moveStep(axis, step)) return true;
    }
    return false;
  }

  _moveStep(axis, delta) {
    this.position[axis] += delta;
    const blocks = this._overlappingSolids();
    if (blocks.length === 0) return false;

    if (axis === 'y') {
      if (delta < 0) {
        let floor = -Infinity;
        for (const b of blocks) floor = Math.max(floor, b.maxY);
        this.position.y = floor;
        this.onGround = true;
      } else {
        let ceiling = Infinity;
        for (const b of blocks) ceiling = Math.min(ceiling, b.minY);
        this.position.y = ceiling - this.height;
      }
      this.velocity.y = 0;
      return true;
    }

    if (delta > 0) {
      let wall = Infinity;
      for (const b of blocks) wall = Math.min(wall, axis === 'x' ? b.minX : b.minZ);
      this.position[axis] = wall - this.halfWidth;
    } else {
      let wall = -Infinity;
      for (const b of blocks) wall = Math.max(wall, axis === 'x' ? b.maxX : b.maxZ);
      this.position[axis] = wall + this.halfWidth;
    }
    this.velocity[axis] = 0;
    return true;
  }

  // Mob step-up: if a horizontal move is blocked on the ground, try again one
  // block higher so mobs can climb hills.
  moveHorizontal(dt) {
    for (const axis of ['x', 'z']) {
      const delta = this.velocity[axis] * dt;
      if (delta === 0) continue;
      if (!this._moveAxis(axis, delta) || !this.onGround) continue;
      const saved = this.position.clone();
      this.position.y += 1.0;
      if (this._overlappingSolids().length > 0) {
        this.position.copy(saved);
        continue;
      }
      const blocked = this._moveAxis(axis, delta);
      if (blocked) {
        this.position.copy(saved);
        this.velocity[axis] = 0;
      }
    }
  }

  _overlappingSolids() {
    const aabb = this.getAABB();
    const blocks = [];
    const x0 = Math.floor(aabb.minX);
    const x1 = Math.floor(aabb.maxX - EPS);
    const y0 = Math.floor(aabb.minY);
    const y1 = Math.floor(aabb.maxY - EPS);
    const z0 = Math.floor(aabb.minZ);
    const z1 = Math.floor(aabb.maxZ - EPS);
    for (let y = y0; y <= y1; y++) {
      for (let z = z0; z <= z1; z++) {
        for (let x = x0; x <= x1; x++) {
          if (!this.world.isSolidAt(x, y, z)) continue;
          blocks.push({
            minX: x, minY: y, minZ: z, maxX: x + 1, maxY: y + 1, maxZ: z + 1,
          });
        }
      }
    }
    return blocks;
  }
}
