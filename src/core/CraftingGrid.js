// src/core/CraftingGrid.js
// The 2x2 (inventory) or 3x3 (crafting table) crafting grid. The grid owns its
// stacks; taking a result consumes one item from every occupied cell.

import { matchRecipe } from './Recipes.js';

export class CraftingGrid {
  constructor(size = 2) {
    if (size !== 2 && size !== 3) throw new Error('CraftingGrid size must be 2 or 3');
    this.size = size;
    this.slots = new Array(size * size).fill(null);
  }

  get result() {
    return matchRecipe(this.slots, this.size);
  }

  peekResult() {
    return this.result?.output ?? null;
  }

  // Consumes one set of ingredients and returns the crafted stack (or null).
  takeResult() {
    const recipe = this.result;
    if (!recipe) return null;
    for (let i = 0; i < this.slots.length; i++) {
      const stack = this.slots[i];
      if (!stack) continue;
      stack.count -= 1;
      if (stack.count <= 0) this.slots[i] = null;
    }
    return { id: recipe.output.id, count: recipe.output.count, damage: 0 };
  }

  setSlot(index, stack) {
    if (index < 0 || index >= this.slots.length) return;
    this.slots[index] = stack ? { ...stack } : null;
  }

  clear() {
    this.slots.fill(null);
  }

  isEmpty() {
    return this.slots.every((stack) => !stack);
  }
}
