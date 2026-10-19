// src/core/Recipes.js
// Recipe-list crafting (docs/07-research-recipes.md). Tools need a crafting
// table; planks, sticks and the table itself can be made in the inventory.

export const RECIPES = [
  {
    id: 'oak_planks',
    station: 'inventory',
    output: { id: 'oak_planks', count: 4 },
    ingredients: { oak_log: 1 },
  },
  {
    id: 'stick',
    station: 'inventory',
    output: { id: 'stick', count: 4 },
    ingredients: { oak_planks: 2 },
  },
  {
    id: 'crafting_table',
    station: 'inventory',
    output: { id: 'crafting_table', count: 1 },
    ingredients: { oak_planks: 4 },
  },
  {
    id: 'wooden_pickaxe',
    station: 'table',
    output: { id: 'wooden_pickaxe', count: 1 },
    ingredients: { oak_planks: 3, stick: 2 },
  },
  {
    id: 'stone_pickaxe',
    station: 'table',
    output: { id: 'stone_pickaxe', count: 1 },
    ingredients: { stone: 3, stick: 2 },
  },
  {
    id: 'wooden_axe',
    station: 'table',
    output: { id: 'wooden_axe', count: 1 },
    ingredients: { oak_planks: 3, stick: 2 },
  },
  {
    id: 'stone_axe',
    station: 'table',
    output: { id: 'stone_axe', count: 1 },
    ingredients: { stone: 3, stick: 2 },
  },
  {
    id: 'wooden_shovel',
    station: 'table',
    output: { id: 'wooden_shovel', count: 1 },
    ingredients: { oak_planks: 1, stick: 2 },
  },
  {
    id: 'stone_shovel',
    station: 'table',
    output: { id: 'stone_shovel', count: 1 },
    ingredients: { stone: 1, stick: 2 },
  },
  {
    id: 'wooden_sword',
    station: 'table',
    output: { id: 'wooden_sword', count: 1 },
    ingredients: { oak_planks: 2, stick: 1 },
  },
  {
    id: 'stone_sword',
    station: 'table',
    output: { id: 'stone_sword', count: 1 },
    ingredients: { stone: 2, stick: 1 },
  },
];

export function recipesFor(station) {
  return RECIPES.filter((recipe) => recipe.station === station);
}

export function canCraft(inventory, recipe) {
  return Object.entries(recipe.ingredients).every(
    ([itemId, count]) => inventory.countOf(itemId) >= count,
  );
}

export function craft(inventory, recipe) {
  if (!canCraft(inventory, recipe)) return false;
  if (!inventory.canAdd(recipe.output.id, recipe.output.count)) return false;
  inventory.add(recipe.output.id, recipe.output.count);
  for (const [itemId, count] of Object.entries(recipe.ingredients)) {
    inventory.remove(itemId, count);
  }
  return true;
}
