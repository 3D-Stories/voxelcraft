// src/core/Furnace.js
// Furnace block entities: fuel, smelting progress and output
// (docs/06-research-mechanics.md, docs/02-research-items.md §14:
// 200 ticks per item, fuel values in burn ticks).

import { maxStackFor } from './ItemRegistry.js';

export const SMELT_TICKS = 200;

export const SMELTING = [
  { input: 'oak_log', output: 'charcoal', count: 1 },
  { input: 'stone', output: 'smooth_stone', count: 1 },
  { input: 'raw_iron', output: 'iron_ingot', count: 1 },
  { input: 'raw_gold', output: 'gold_ingot', count: 1 },
];

export const FUELS = {
  charcoal: 1600, // docs/02: 80 s
  oak_log: 300,
  oak_planks: 200,
  crafting_table: 300,
  stick: 100,
  wooden_pickaxe: 200,
  wooden_axe: 200,
  wooden_shovel: 200,
  wooden_sword: 200,
};

export function fuelTicks(itemId) {
  return FUELS[itemId] ?? 0;
}

export function smeltingFor(itemId) {
  return SMELTING.find((recipe) => recipe.input === itemId) ?? null;
}

function copyStack(stack) {
  return stack ? { id: stack.id, count: stack.count, damage: stack.damage ?? 0 } : null;
}

export class FurnaceState {
  constructor(data = {}) {
    this.input = copyStack(data.input);
    this.fuel = copyStack(data.fuel);
    this.output = copyStack(data.output);
    this.burnTime = data.burnTime ?? 0;
    this.burnTotal = data.burnTotal ?? 0;
    this.cookTime = data.cookTime ?? 0;
  }

  get recipe() {
    return this.input ? smeltingFor(this.input.id) : null;
  }

  get canSmelt() {
    const recipe = this.recipe;
    if (!recipe) return false;
    if (!this.output) return true;
    return this.output.id === recipe.output
      && this.output.count + recipe.count <= maxStackFor(recipe.output);
  }

  get isBurning() {
    return this.burnTime > 0;
  }

  tick(ticks = 1) {
    let changed = false;

    if (this.burnTime <= 0 && this.canSmelt && this.fuel && fuelTicks(this.fuel.id) > 0) {
      this.burnTotal = fuelTicks(this.fuel.id);
      this.burnTime = this.burnTotal;
      this.fuel.count -= 1;
      if (this.fuel.count <= 0) this.fuel = null;
      changed = true;
    }

    if (this.burnTime > 0) {
      this.burnTime = Math.max(0, this.burnTime - ticks);
      changed = true;
      if (this.canSmelt) {
        this.cookTime += ticks;
        if (this.cookTime >= SMELT_TICKS) {
          const recipe = this.recipe;
          if (!this.output) this.output = { id: recipe.output, count: recipe.count, damage: 0 };
          else this.output.count += recipe.count;
          this.input.count -= 1;
          if (this.input.count <= 0) this.input = null;
          this.cookTime = 0;
        }
      } else {
        this.cookTime = 0;
      }
    } else {
      this.cookTime = 0;
    }

    return changed;
  }

  toJSON() {
    return {
      input: copyStack(this.input),
      fuel: copyStack(this.fuel),
      output: copyStack(this.output),
      burnTime: this.burnTime,
      burnTotal: this.burnTotal,
      cookTime: this.cookTime,
    };
  }
}

export class FurnaceManager {
  constructor() {
    this.furnaces = new Map();
  }

  key(x, y, z) {
    return `${x},${y},${z}`;
  }

  has(x, y, z) {
    return this.furnaces.has(this.key(x, y, z));
  }

  get(x, y, z) {
    return this.furnaces.get(this.key(x, y, z)) ?? null;
  }

  ensure(x, y, z) {
    const key = this.key(x, y, z);
    let state = this.furnaces.get(key);
    if (!state) {
      state = new FurnaceState();
      this.furnaces.set(key, state);
    }
    return state;
  }

  tick(ticks = 1) {
    let changed = false;
    for (const state of this.furnaces.values()) {
      if (state.tick(ticks)) changed = true;
    }
    return changed;
  }

  // Moves a removed furnace's contents into the inventory.
  spill(x, y, z, inventory) {
    const key = this.key(x, y, z);
    const state = this.furnaces.get(key);
    if (!state) return false;
    for (const slot of ['input', 'fuel', 'output']) {
      const stack = state[slot];
      if (stack && inventory) inventory.add(stack.id, stack.count);
    }
    this.furnaces.delete(key);
    return true;
  }

  toJSON() {
    const data = {};
    for (const [key, state] of this.furnaces) data[key] = state.toJSON();
    return data;
  }

  restore(data) {
    if (!data || typeof data !== 'object') return;
    for (const [key, value] of Object.entries(data)) {
      this.furnaces.set(key, new FurnaceState(value));
    }
  }
}
