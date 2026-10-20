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
  coal_ore: { name: 'Coal Ore', kind: 'block', blockId: 12, icon: 'blocks/coal_ore.png' },
  iron_ore: { name: 'Iron Ore', kind: 'block', blockId: 13, icon: 'blocks/iron_ore.png' },
  gold_ore: { name: 'Gold Ore', kind: 'block', blockId: 14, icon: 'blocks/gold_ore.png' },
  redstone_ore: { name: 'Redstone Ore', kind: 'block', blockId: 15, icon: 'blocks/redstone_ore.png' },
  diamond_ore: { name: 'Diamond Ore', kind: 'block', blockId: 16, icon: 'blocks/diamond_ore.png' },
  coal: { name: 'Coal', kind: 'item', icon: 'items/coal.png' },
  raw_iron: { name: 'Raw Iron', kind: 'item', icon: 'items/raw_iron.png' },
  iron_ingot: { name: 'Iron Ingot', kind: 'item', icon: 'items/iron_ingot.png' },
  raw_gold: { name: 'Raw Gold', kind: 'item', icon: 'items/raw_gold.png' },
  gold_ingot: { name: 'Gold Ingot', kind: 'item', icon: 'items/gold_ingot.png' },
  diamond: { name: 'Diamond', kind: 'item', icon: 'items/diamond.png' },
  redstone: { name: 'Redstone Dust', kind: 'item', icon: 'items/redstone.png' },
  apple: {
    name: 'Apple', kind: 'food', food: { hunger: 4, saturation: 2.4 }, icon: 'items/apple.png',
  },
  stick: { name: 'Stick', kind: 'item', icon: 'items/stick.png' },
  wooden_pickaxe: {
    name: 'Wooden Pickaxe', kind: 'tool', tool: 'pickaxe', tier: 1, speed: 2, durability: 59, attack: 2, icon: 'items/wooden_pickaxe.png',
  },
  stone_pickaxe: {
    name: 'Stone Pickaxe', kind: 'tool', tool: 'pickaxe', tier: 2, speed: 4, durability: 131, attack: 3, icon: 'items/stone_pickaxe.png',
  },
  wooden_axe: {
    name: 'Wooden Axe', kind: 'tool', tool: 'axe', tier: 1, speed: 2, durability: 59, attack: 7, icon: 'items/wooden_axe.png',
  },
  stone_axe: {
    name: 'Stone Axe', kind: 'tool', tool: 'axe', tier: 2, speed: 4, durability: 131, attack: 9, icon: 'items/stone_axe.png',
  },
  wooden_shovel: {
    name: 'Wooden Shovel', kind: 'tool', tool: 'shovel', tier: 1, speed: 2, durability: 59, attack: 2.5, icon: 'items/wooden_shovel.png',
  },
  stone_shovel: {
    name: 'Stone Shovel', kind: 'tool', tool: 'shovel', tier: 2, speed: 4, durability: 131, attack: 3.5, icon: 'items/stone_shovel.png',
  },
  wooden_sword: {
    name: 'Wooden Sword', kind: 'tool', tool: 'sword', tier: 1, speed: 1, durability: 59, attack: 4, icon: 'items/wooden_sword.png',
  },
  stone_sword: {
    name: 'Stone Sword', kind: 'tool', tool: 'sword', tier: 2, speed: 1, durability: 131, attack: 5, icon: 'items/stone_sword.png',
  },
  iron_pickaxe: {
    name: 'Iron Pickaxe', kind: 'tool', tool: 'pickaxe', tier: 3, speed: 6, durability: 250, attack: 4, icon: 'items/iron_pickaxe.png',
  },
  iron_axe: {
    name: 'Iron Axe', kind: 'tool', tool: 'axe', tier: 3, speed: 6, durability: 250, attack: 9, icon: 'items/iron_axe.png',
  },
  iron_shovel: {
    name: 'Iron Shovel', kind: 'tool', tool: 'shovel', tier: 3, speed: 6, durability: 250, attack: 4.5, icon: 'items/iron_shovel.png',
  },
  iron_sword: {
    name: 'Iron Sword', kind: 'tool', tool: 'sword', tier: 3, speed: 1, durability: 250, attack: 6, icon: 'items/iron_sword.png',
  },
  diamond_pickaxe: {
    name: 'Diamond Pickaxe', kind: 'tool', tool: 'pickaxe', tier: 4, speed: 8, durability: 1561, attack: 5, icon: 'items/diamond_pickaxe.png',
  },
  diamond_axe: {
    name: 'Diamond Axe', kind: 'tool', tool: 'axe', tier: 4, speed: 8, durability: 1561, attack: 9, icon: 'items/diamond_axe.png',
  },
  diamond_shovel: {
    name: 'Diamond Shovel', kind: 'tool', tool: 'shovel', tier: 4, speed: 8, durability: 1561, attack: 5.5, icon: 'items/diamond_shovel.png',
  },
  diamond_sword: {
    name: 'Diamond Sword', kind: 'tool', tool: 'sword', tier: 4, speed: 1, durability: 1561, attack: 7, icon: 'items/diamond_sword.png',
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
  12: 'coal',
  13: 'raw_iron',
  14: 'raw_gold',
  15: 'redstone',
  16: 'diamond',
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
