// src/player/BlockInteraction.js
// Left-click mining and right-click placement. Mining uses the held tool for
// speed and harvest rules (docs/06-research-mechanics.md 8.1), drops items and
// wears tools down; placement consumes the held block stack.

import { BlockRegistry } from '../core/BlockRegistry.js';
import { breakTicks, canHarvest } from '../core/Mining.js';
import { dropForBlock, getItem } from '../core/ItemRegistry.js';
import { raycastVoxel, BLOCK_REACH, CREATIVE_REACH } from './Raycast.js';

export class BlockInteraction {
  constructor(player, world, domElement, options = {}) {
    if (!player || !world || !domElement) {
      throw new Error('BlockInteraction requires a player, a world and a DOM element');
    }
    this.player = player;
    this.world = world;
    this.domElement = domElement;
    this.inventory = options.inventory ?? null;
    this.highlight = options.highlight ?? null;
    this.onBreak = options.onBreak ?? null;
    this.onUseBlock = options.onUseBlock ?? null;

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
    const reach = player.godMode ? CREATIVE_REACH : BLOCK_REACH;
    // Creative mode can target liquids (so placed water can be removed).
    return raycastVoxel(this.world, origin, direction, reach, {
      includeLiquids: player.godMode,
    });
  }

  update(dt) {
    const target = this.getTarget();
    if (this.highlight) this.highlight.update(target);

    // Creative/god mode breaks the targeted block instantly, without drops.
    if (this.player.godMode) {
      if (this._mining && target) {
        this._breakBlock(target, { instant: true });
        this._targetKey = null;
      }
      return;
    }

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

    const heldId = this.inventory?.selectedId ?? null;
    const requiredTicks = breakTicks(target.id, heldId, this.player.onGround);
    if (requiredTicks <= 0) return; // unbreakable (e.g. liquid)

    this._ticksMined += dt / 0.05;
    if (this._ticksMined < requiredTicks) return;

    this._breakBlock(target);
    this._ticksMined = 0;
    this._targetKey = null;
  }

  _breakBlock(target, { instant = false } = {}) {
    if (!this.world.setBlock(target.x, target.y, target.z, BlockRegistry.AIR)) return false;

    const heldId = this.inventory?.selectedId ?? null;
    if (!instant) {
      if (canHarvest(target.id, heldId)) {
        const drop = dropForBlock(target.id);
        if (drop) this.inventory?.add(drop, 1);
      }
      const held = heldId ? getItem(heldId) : null;
      if (held?.kind === 'tool' && this.inventory) {
        this.inventory.damageFromSlot(this.inventory.selectedIndex, 1);
      }
    }

    if (this.onBreak) this.onBreak(target);
    return true;
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
      if (!this.player.sneaking) {
        const target = this.getTarget();
        const usable = target
          && (target.id === BlockRegistry.CRAFTING_TABLE || target.id === BlockRegistry.FURNACE);
        if (usable && this.onUseBlock) {
          this.onUseBlock(target);
          return;
        }
      }
      this.placeBlock();
    }
  }

  _onMouseUp(event) {
    if (event.button === 0) this.stopMining();
  }

  placeBlock() {
    if (document.pointerLockElement !== this.domElement) return false;
    const stack = this.inventory?.selected ?? null;
    if (!stack) return false;
    const held = getItem(stack.id);
    if (!held || held.kind !== 'block') return false;

    const target = this.getTarget();
    if (!target) return false;

    const x = target.x + target.normal.x;
    const y = target.y + target.normal.y;
    const z = target.z + target.normal.z;

    if (this.world.getBlock(x, y, z).id !== BlockRegistry.AIR) return false;
    // Liquids may be placed at the player's own feet; solids may not.
    if (
      BlockRegistry.isSolid(held.blockId)
      && this._blockIntersectsPlayer(x, y, z)
    ) return false;

    if (!this.world.setBlock(x, y, z, held.blockId)) return false;
    if (!this.player.godMode && this.inventory) {
      this.inventory.removeFromSlot(this.inventory.selectedIndex, 1);
    }
    return true;
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
