// src/player/PlayerPhysics.js
// Gravity and swept-AABB collision against voxel blocks
// (docs/10-architecture.md section 6, docs/06-research-mechanics.md 1.1-1.2).
//
// Positions are resolved one axis at a time, with movement split into
// sub-steps no larger than half a block so fast falls cannot tunnel through
// the floor. Velocity is applied before gravity on each tick: that is the
// vanilla ordering and it reproduces the documented 1.2522-block jump height.

import { BlockRegistry } from '../core/BlockRegistry.js';

const GRAVITY = -32; // blocks/s^2 (docs/10-architecture.md section 6)
const TERMINAL_VELOCITY = -78; // blocks/s (same section)
const DRAG = 0.98; // per-tick vertical drag, vanilla
const TICK_SECONDS = 0.05;
const MAX_SUBSTEP = 0.25;
const EPSILON = 1e-7;

export class PlayerPhysics {
  constructor(player, world) {
    if (!player || !world) {
      throw new Error('PlayerPhysics requires a player and a world');
    }
    this.player = player;
    this.world = world;
    this.gravity = GRAVITY;
    this.terminalVelocity = TERMINAL_VELOCITY;
  }

  update(dt) {
    const player = this.player;

    // Collision with the floor during this tick re-sets this.
    player.onGround = false;
    player.inWater = this._isInWater();

    this._moveAxis('y', player.velocity.y * dt);
    this._moveAxis('x', player.velocity.x * dt);
    this._moveAxis('z', player.velocity.z * dt);

    if (player.flying) return; // creative flight: no gravity
    if (player.inWater) {
      // Buoyancy is controller-driven; just damp residual vertical motion.
      player.velocity.y *= Math.pow(0.8, dt / TICK_SECONDS);
      return;
    }

    // Gravity is applied after movement, matching vanilla's tick order.
    player.velocity.y += this.gravity * dt;
    player.velocity.y *= Math.pow(DRAG, dt / TICK_SECONDS);
    if (player.velocity.y < this.terminalVelocity) {
      player.velocity.y = this.terminalVelocity;
    }
  }

  _isInWater() {
    if (typeof this.world.getBlock !== 'function') return false;
    const player = this.player;
    const samples = [0.1, player.height * 0.5, player.eyeHeight];
    for (const dy of samples) {
      const block = this.world.getBlock(
        player.position.x,
        player.position.y + dy,
        player.position.z,
      );
      if (block && BlockRegistry.isLiquid(block.id)) return true;
    }
    return false;
  }

  // Returns true when the axis movement was stopped by a block.
  _moveAxis(axis, delta) {
    if (delta === 0) return false;
    const steps = Math.max(1, Math.ceil(Math.abs(delta) / MAX_SUBSTEP));
    const step = delta / steps;
    for (let i = 0; i < steps; i++) {
      if (this._moveAxisStep(axis, step)) return true;
    }
    return false;
  }

  _moveAxisStep(axis, delta) {
    const player = this.player;
    player.position[axis] += delta;

    const blocks = this._overlappingSolids(player.getAABB());
    if (blocks.length === 0) return false;

    if (axis === 'y') {
      if (delta < 0) {
        let floor = -Infinity;
        for (const block of blocks) floor = Math.max(floor, block.maxY);
        player.position.y = floor;
        player.onGround = true;
      } else {
        let ceiling = Infinity;
        for (const block of blocks) ceiling = Math.min(ceiling, block.minY);
        player.position.y = ceiling - player.height;
      }
      player.velocity.y = 0;
      return true;
    }

    if (delta > 0) {
      let wall = Infinity;
      for (const block of blocks) wall = Math.min(wall, axis === 'x' ? block.minX : block.minZ);
      player.position[axis] = wall - player.halfWidth;
    } else {
      let wall = -Infinity;
      for (const block of blocks) wall = Math.max(wall, axis === 'x' ? block.maxX : block.maxZ);
      player.position[axis] = wall + player.halfWidth;
    }
    player.velocity[axis] = 0;
    return true;
  }

  _overlappingSolids(aabb) {
    const blocks = [];
    const x0 = Math.floor(aabb.minX);
    const x1 = Math.floor(aabb.maxX - EPSILON);
    const y0 = Math.floor(aabb.minY);
    const y1 = Math.floor(aabb.maxY - EPSILON);
    const z0 = Math.floor(aabb.minZ);
    const z1 = Math.floor(aabb.maxZ - EPSILON);

    for (let y = y0; y <= y1; y++) {
      for (let z = z0; z <= z1; z++) {
        for (let x = x0; x <= x1; x++) {
          if (!this.world.isSolidAt(x, y, z)) continue;
          blocks.push({
            minX: x,
            minY: y,
            minZ: z,
            maxX: x + 1,
            maxY: y + 1,
            maxZ: z + 1,
          });
        }
      }
    }
    return blocks;
  }
}
