// src/player/BlockInteraction.js
// Left-click mining (hardness-based, docs/06-research-mechanics.md 8.1) and
// right-click placement (docs/00-master-prompt.md 5.5).
// Break time: hardness x 1.5 if hand-harvestable, x 5 otherwise, 5x slower in
// the air, rounded up to whole ticks (https://minecraft.wiki/w/Breaking#Mining_efficiency).

import { BlockRegistry } from '../core/BlockRegistry.js';
import { raycastVoxel, BLOCK_REACH } from './Raycast.js';

const TICK_SECONDS = 0.05;

export class BlockInteraction {
  constructor(player, world, domElement, options = {}) {
    if (!player || !world || !domElement) {
      throw new Error('BlockInteraction requires a player, a world and a DOM element');
    }
    this.player = player;
    this.world = world;
    this.domElement = domElement;
    this.highlight = options.highlight ?? null;
    this.selectedBlock = options.selectedBlock ?? BlockRegistry.STONE;
    this.onBreak = options.onBreak ?? null;

    this._mining = false;
    this._ticksMined = 0;
    this._targetKey = null;
    this._cleanup = [];

    this._listen(document, 'mousedown', (event) => this._onMouseDown(event));
    this._listen(document, 'mouseup', (event) => this._onMouseUp(event));
    this._listen(window, 'blur', () => this.stopMining());
  }

  getTarget() {
    const player = this.player;
    const cosPitch = Math.cos(player.pitch);
    const direction = {
      x: -Math.sin(player.yaw) * cosPitch,
      y: Math.sin(player.pitch),
      z: -Math.cos(player.yaw) * cosPitch,
    };
    const origin = {
      x: player.position.x,
      y: player.position.y + player.eyeHeight,
      z: player.position.z,
    };
    return raycastVoxel(this.world, origin, direction, BLOCK_REACH);
  }

  update(dt) {
    const target = this.getTarget();
    if (this.highlight) this.highlight.update(target);

    if (!this._mining || !target) {
      this._ticksMined = 0;
      this._targetKey = null;
      return;
    }

    const key = `${target.x},${target.y},${target.z}`;
    if (key !== this._targetKey) {
      // Progress resets when the targeted block changes.
      this._targetKey = key;
      this._ticksMined = 0;
    }

    const breakTime = BlockRegistry.getBreakTimeSeconds(target.id);
    if (breakTime <= 0) return; // unbreakable (e.g. liquid)

    const speedModifier = this.player.onGround ? 1 : 0.2;
    // Break times are whole ticks; the epsilon absorbs binary rounding (e.g.
    // 0.2 * 1.5 = 0.30000000000000004 should still be 6 ticks, not 7).
    const requiredTicks = Math.ceil((breakTime / speedModifier) / TICK_SECONDS - 1e-6);
    this._ticksMined += dt / TICK_SECONDS;

    if (this._ticksMined < requiredTicks) return;

    if (this.world.setBlock(target.x, target.y, target.z, BlockRegistry.AIR)) {
      if (this.onBreak) this.onBreak(target);
    }
    this._ticksMined = 0;
    this._targetKey = null;
  }

  stopMining() {
    this._mining = false;
    this._ticksMined = 0;
    this._targetKey = null;
  }

  destroy() {
    this.stopMining();
    for (const remove of this._cleanup) remove();
    this._cleanup = [];
  }

  // --- internals -----------------------------------------------------------

  _onMouseDown(event) {
    if (document.pointerLockElement !== this.domElement) return;
    if (event.button === 0) {
      this._mining = true;
      this._ticksMined = 0;
      this._targetKey = null;
    } else if (event.button === 2) {
      this.placeBlock();
    }
  }

  _onMouseUp(event) {
    if (event.button === 0) this.stopMining();
  }

  placeBlock() {
    if (document.pointerLockElement !== this.domElement) return false;
    if (!this.selectedBlock) return false; // empty hotbar slot
    const target = this.getTarget();
    if (!target) return false;

    const x = target.x + target.normal.x;
    const y = target.y + target.normal.y;
    const z = target.z + target.normal.z;

    if (this.world.getBlock(x, y, z).id !== BlockRegistry.AIR) return false;
    if (this._blockIntersectsPlayer(x, y, z)) return false;
    return this.world.setBlock(x, y, z, this.selectedBlock);
  }

  _blockIntersectsPlayer(x, y, z) {
    const aabb = this.player.getAABB();
    return aabb.maxX > x && aabb.minX < x + 1
      && aabb.maxY > y && aabb.minY < y + 1
      && aabb.maxZ > z && aabb.minZ < z + 1;
  }

  _listen(target, type, handler) {
    target.addEventListener(type, handler);
    this._cleanup.push(() => target.removeEventListener(type, handler));
  }
}
