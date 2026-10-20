// src/core/Mining.js
// Break-time and harvest rules for blocks and held tools
// (docs/06-research-mechanics.md 8.1, docs/01-research-blocks.md).

import { BlockRegistry } from './BlockRegistry.js';
import { getItem } from './ItemRegistry.js';

export const TICK_SECONDS = 0.05;

export function heldTool(heldItemId) {
  const def = getItem(heldItemId);
  return def && def.kind === 'tool' ? def : null;
}

export function canHarvest(blockId, heldItemId = null) {
  if (BlockRegistry.canHarvestByHand(blockId)) return true;
  const tool = heldTool(heldItemId);
  const required = BlockRegistry.getTool(blockId);
  if (!tool || !required || tool.tool !== required) return false;
  return (tool.tier ?? 0) >= BlockRegistry.getRequiredTier(blockId);
}

// Bare-hand-equivalent time on the ground, in seconds.
export function breakTimeSeconds(blockId, heldItemId = null) {
  const hardness = BlockRegistry.getHardness(blockId);
  if (hardness <= 0) return 0;
  const tool = heldTool(heldItemId);
  const required = BlockRegistry.getTool(blockId);
  const correct = Boolean(
    tool
    && required
    && tool.tool === required
    && (tool.tier ?? 0) >= BlockRegistry.getRequiredTier(blockId),
  );
  const speed = correct ? tool.speed : 1;
  const factor = canHarvest(blockId, heldItemId) ? 1.5 : 5;
  return (hardness * factor) / speed;
}

// Whole ticks to break; airborne mining is 5x slower (docs/06 8.1).
export function breakTicks(blockId, heldItemId = null, onGround = true) {
  const seconds = breakTimeSeconds(blockId, heldItemId);
  if (seconds <= 0) return 0;
  const speedModifier = onGround ? 1 : 0.2;
  return Math.ceil(seconds / speedModifier / TICK_SECONDS - 1e-6);
}
