// src/core/ItemRegistry.js
// Items the Phase 2 slice knows about: block items, sticks and two tool tiers.
// Tool durability: docs/02-research-items.md (wood 59, stone 131).

export const ITEMS = {
  stone: { name: 'Stone', kind: 'block', blockId: 1, icon: 'blocks/stone.png' },
  grass_block: { name: 'Grass Block', kind: 'block', blockId: 2, icon: 'blocks/grass_side.png' },
  dirt: { name: 'Dirt', kind: 'block', blockId: 3, icon: 'blocks/dirt.png' },
  sand: { name: 'Sand', kind: 'block', blockId: 4, icon: 'blocks/sand.png' },
  oak_log: { name: 'Oak Log', kind: 'block', blockId: 5, icon: 'blocks/oak_log_side.png' },
  oak_leaves: { name: 'Oak Leaves', kind: 'block', blockId: 6, icon: 'blocks/oak_leaves.png' },
  water: { name: 'Water', kind: 'block', blockId: 7, icon: 'blocks/water.png' },
  oak_planks: { name: 'Oak Planks', kind: 'block', blockId: 8, icon: 'blocks/oak_planks.png' },
  crafting_table: {
    name: 'Crafting Table', kind: 'block', blockId: 9, icon: 'blocks/crafting_table_side.png',
  },
  furnace: { name: 'Furnace', kind: 'block', blockId: 10, icon: 'blocks/furnace_side.png' },
  smooth_stone: { name: 'Smooth Stone', kind: 'block', blockId: 11, icon: 'blocks/smooth_stone.png' },
  charcoal: { name: 'Charcoal', kind: 'item', icon: 'items/charcoal.png' },
  stick: { name: 'Stick', kind: 'item', icon: 'items/stick.png' },
  wooden_pickaxe: {
    name: 'Wooden Pickaxe', kind: 'tool', tool: 'pickaxe', speed: 2, durability: 59, icon: 'items/wooden_pickaxe.png',
  },
  stone_pickaxe: {
    name: 'Stone Pickaxe', kind: 'tool', tool: 'pickaxe', speed: 4, durability: 131, icon: 'items/stone_pickaxe.png',
  },
  wooden_axe: {
    name: 'Wooden Axe', kind: 'tool', tool: 'axe', speed: 2, durability: 59, icon: 'items/wooden_axe.png',
  },
  stone_axe: {
    name: 'Stone Axe', kind: 'tool', tool: 'axe', speed: 4, durability: 131, icon: 'items/stone_axe.png',
  },
  wooden_shovel: {
    name: 'Wooden Shovel', kind: 'tool', tool: 'shovel', speed: 2, durability: 59, icon: 'items/wooden_shovel.png',
  },
  stone_shovel: {
    name: 'Stone Shovel', kind: 'tool', tool: 'shovel', speed: 4, durability: 131, icon: 'items/stone_shovel.png',
  },
  wooden_sword: {
    name: 'Wooden Sword', kind: 'tool', tool: 'sword', speed: 1, durability: 59, icon: 'items/wooden_sword.png',
  },
  stone_sword: {
    name: 'Stone Sword', kind: 'tool', tool: 'sword', speed: 1, durability: 131, icon: 'items/stone_sword.png',
  },
};

// What a broken block drops. Grass turns into dirt, water drops nothing.
const BLOCK_DROPS = {
  1: 'stone',
  2: 'dirt',
  3: 'dirt',
  4: 'sand',
  5: 'oak_log',
  6: 'oak_leaves',
  8: 'oak_planks',
  9: 'crafting_table',
  10: 'furnace',
  11: 'smooth_stone',
};

export function getItem(id) {
  return ITEMS[id] ?? null;
}

export function dropForBlock(blockId) {
  return BLOCK_DROPS[blockId] ?? null;
}

export function itemForBlock(blockId) {
  for (const [id, def] of Object.entries(ITEMS)) {
    if (def.kind === 'block' && def.blockId === blockId) return id;
  }
  return null;
}

export function blockIdForItem(itemId) {
  const def = ITEMS[itemId];
  return def?.kind === 'block' ? def.blockId : null;
}

export function maxStackFor(itemId) {
  const def = ITEMS[itemId];
  if (!def) return 0;
  return def.kind === 'tool' ? 1 : 64;
}

export function iconUrl(itemId) {
  const def = ITEMS[itemId];
  return def ? `/assets/textures/${def.icon}` : null;
}
