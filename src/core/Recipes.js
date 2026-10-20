// src/core/Recipes.js
// Shaped/shapeless crafting for the 2x2 inventory grid and 3x3 crafting table
// (docs/07-research-recipes.md). Patterns use letters for ingredients and
// spaces for empty cells; a pattern may sit anywhere in a larger grid.

export const RECIPES = [
  {
    id: 'oak_planks',
    shapeless: true,
    ingredients: { oak_log: 1 },
    output: { id: 'oak_planks', count: 4 },
  },
  {
    id: 'stick',
    pattern: ['P', 'P'],
    key: { P: 'oak_planks' },
    output: { id: 'stick', count: 4 },
  },
  {
    id: 'crafting_table',
    pattern: ['PP', 'PP'],
    key: { P: 'oak_planks' },
    output: { id: 'crafting_table', count: 1 },
  },
  {
    id: 'furnace',
    pattern: ['SSS', 'S S', 'SSS'],
    key: { S: 'stone' },
    output: { id: 'furnace', count: 1 },
  },
  {
    id: 'wooden_pickaxe',
    pattern: ['PPP', ' S ', ' S '],
    key: { P: 'oak_planks', S: 'stick' },
    output: { id: 'wooden_pickaxe', count: 1 },
  },
  {
    id: 'stone_pickaxe',
    pattern: ['SSS', ' T ', ' T '],
    key: { S: 'stone', T: 'stick' },
    output: { id: 'stone_pickaxe', count: 1 },
  },
  {
    id: 'wooden_axe',
    pattern: ['PP', 'PS', ' S'],
    key: { P: 'oak_planks', S: 'stick' },
    output: { id: 'wooden_axe', count: 1 },
  },
  {
    id: 'stone_axe',
    pattern: ['SS', 'ST', ' T'],
    key: { S: 'stone', T: 'stick' },
    output: { id: 'stone_axe', count: 1 },
  },
  {
    id: 'wooden_shovel',
    pattern: ['P', 'S', 'S'],
    key: { P: 'oak_planks', S: 'stick' },
    output: { id: 'wooden_shovel', count: 1 },
  },
  {
    id: 'stone_shovel',
    pattern: ['S', 'T', 'T'],
    key: { S: 'stone', T: 'stick' },
    output: { id: 'stone_shovel', count: 1 },
  },
  {
    id: 'wooden_sword',
    pattern: ['P', 'P', 'S'],
    key: { P: 'oak_planks', S: 'stick' },
    output: { id: 'wooden_sword', count: 1 },
  },
  {
    id: 'stone_sword',
    pattern: ['S', 'S', 'T'],
    key: { S: 'stone', T: 'stick' },
    output: { id: 'stone_sword', count: 1 },
  },
  {
    id: 'iron_pickaxe',
    pattern: ['III', ' S ', ' S '],
    key: { I: 'iron_ingot', S: 'stick' },
    output: { id: 'iron_pickaxe', count: 1 },
  },
  {
    id: 'iron_axe',
    pattern: ['II', 'IS', ' S'],
    key: { I: 'iron_ingot', S: 'stick' },
    output: { id: 'iron_axe', count: 1 },
  },
  {
    id: 'iron_shovel',
    pattern: ['I', 'S', 'S'],
    key: { I: 'iron_ingot', S: 'stick' },
    output: { id: 'iron_shovel', count: 1 },
  },
  {
    id: 'iron_sword',
    pattern: ['I', 'I', 'S'],
    key: { I: 'iron_ingot', S: 'stick' },
    output: { id: 'iron_sword', count: 1 },
  },
  {
    id: 'diamond_pickaxe',
    pattern: ['DDD', ' S ', ' S '],
    key: { D: 'diamond', S: 'stick' },
    output: { id: 'diamond_pickaxe', count: 1 },
  },
  {
    id: 'diamond_axe',
    pattern: ['DD', 'DS', ' S'],
    key: { D: 'diamond', S: 'stick' },
    output: { id: 'diamond_axe', count: 1 },
  },
  {
    id: 'diamond_shovel',
    pattern: ['D', 'S', 'S'],
    key: { D: 'diamond', S: 'stick' },
    output: { id: 'diamond_shovel', count: 1 },
  },
  {
    id: 'diamond_sword',
    pattern: ['D', 'D', 'S'],
    key: { D: 'diamond', S: 'stick' },
    output: { id: 'diamond_sword', count: 1 },
  },
];

function trimRows(rows) {
  let top = 0;
  let bottom = rows.length;
  while (top < bottom && rows[top].every((cell) => cell === null)) top++;
  while (bottom > top && rows[bottom - 1].every((cell) => cell === null)) bottom--;
  if (top === bottom) return [];

  // Bounding box of every non-empty cell.
  let left = Infinity;
  let right = 0;
  for (const row of rows.slice(top, bottom)) {
    let first = 0;
    while (first < row.length && row[first] === null) first++;
    if (first < row.length) left = Math.min(left, first);
    let last = row.length - 1;
    while (last >= 0 && row[last] === null) last--;
    if (last >= 0) right = Math.max(right, last + 1);
  }
  if (left === Infinity) return [];
  return rows.slice(top, bottom).map((row) => row.slice(left, right));
}

function patternRows(recipe) {
  const width = Math.max(...recipe.pattern.map((row) => row.length));
  return recipe.pattern.map((row) => row.padEnd(width, ' '));
}

function patternGrid(recipe) {
  return patternRows(recipe).map((row) => [...row].map((char) => (
    char === ' ' ? null : recipe.key[char]
  )));
}

function sameMultiset(ids, ingredients) {
  const expected = [];
  for (const [id, count] of Object.entries(ingredients)) {
    for (let i = 0; i < count; i++) expected.push(id);
  }
  if (ids.length !== expected.length) return false;
  const a = [...ids].sort();
  const b = expected.sort();
  return a.every((id, i) => id === b[i]);
}

// slots: array of stack-or-null; size: 2 or 3. Returns the matching recipe or null.
export function matchRecipe(slots, size) {
  const rows = Array.from({ length: size }, (_, y) => (
    slots.slice(y * size, y * size + size).map((stack) => stack?.id ?? null)
  ));

  for (const recipe of RECIPES) {
    if (recipe.shapeless) {
      const ids = slots.filter(Boolean).map((stack) => stack.id);
      if (!sameMultiset(ids, recipe.ingredients)) continue;
      return recipe;
    }

    const pattern = patternGrid(recipe);
    if (pattern.length > size || (pattern[0]?.length ?? 0) > size) continue;
    const trimmed = trimRows(rows);
    const trimmedPattern = trimRows(pattern);
    if (trimmed.length !== trimmedPattern.length) continue;
    if (trimmed.length === 0) continue;
    if (trimmed[0].length !== trimmedPattern[0].length) continue;
    let match = true;
    for (let y = 0; y < trimmed.length && match; y++) {
      for (let x = 0; x < trimmed[y].length; x++) {
        if (trimmed[y][x] !== trimmedPattern[y][x]) {
          match = false;
          break;
        }
      }
    }
    if (match) return recipe;
  }
  return null;
}
