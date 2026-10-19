// src/core/Inventory.js
// 36-slot inventory: slots 0-8 are the hotbar (docs/11-features.md 6.1).
// Stacks are { id, count, damage } with tools stacking to one.

import { getItem, maxStackFor } from './ItemRegistry.js';

export const INVENTORY_SIZE = 36;
export const HOTBAR_SIZE = 9;

function clampIndex(index) {
  if (!Number.isFinite(index)) return 0;
  return Math.max(0, Math.min(INVENTORY_SIZE - 1, Math.floor(index)));
}

function copyStack(stack) {
  return stack ? { id: stack.id, count: stack.count, damage: stack.damage ?? 0 } : null;
}

export class Inventory {
  constructor(slots = [], selectedIndex = 0) {
    this._slots = new Array(INVENTORY_SIZE).fill(null);
    for (let i = 0; i < Math.min(slots.length, INVENTORY_SIZE); i++) {
      const stack = slots[i];
      if (!stack || !getItem(stack.id)) continue;
      this._slots[i] = {
        id: stack.id,
        count: Math.min(stack.count ?? 1, maxStackFor(stack.id)),
        damage: stack.damage ?? 0,
      };
    }
    this._selected = Math.max(0, Math.min(HOTBAR_SIZE - 1, Math.floor(selectedIndex) || 0));
    this._listeners = new Set();
  }

  get slots() {
    return this._slots.map(copyStack);
  }

  get hotbar() {
    return this._slots.slice(0, HOTBAR_SIZE).map(copyStack);
  }

  get selectedIndex() {
    return this._selected;
  }

  get selected() {
    return copyStack(this._slots[this._selected]);
  }

  get selectedId() {
    return this._slots[this._selected]?.id ?? null;
  }

  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  select(index) {
    const next = Math.max(0, Math.min(HOTBAR_SIZE - 1, Math.floor(index) || 0));
    if (next === this._selected) return;
    this._selected = next;
    this._notify();
  }

  cycle(delta) {
    const step = Math.trunc(delta) % HOTBAR_SIZE;
    if (step === 0) return;
    this.select((this._selected + step + HOTBAR_SIZE) % HOTBAR_SIZE);
  }

  // Adds items to existing stacks first, then empty slots. Returns leftover.
  add(itemId, count = 1) {
    if (!getItem(itemId) || count <= 0) return count;
    const maxStack = maxStackFor(itemId);
    let remaining = count;

    for (let i = 0; i < INVENTORY_SIZE && remaining > 0; i++) {
      const stack = this._slots[i];
      if (!stack || stack.id !== itemId || stack.count >= maxStack) continue;
      const take = Math.min(maxStack - stack.count, remaining);
      stack.count += take;
      remaining -= take;
    }
    for (let i = 0; i < INVENTORY_SIZE && remaining > 0; i++) {
      if (this._slots[i]) continue;
      const take = Math.min(maxStack, remaining);
      this._slots[i] = { id: itemId, count: take, damage: 0 };
      remaining -= take;
    }

    if (remaining !== count) this._notify();
    return remaining;
  }

  // Removes up to `count` of an item from anywhere; returns how many were removed.
  remove(itemId, count = 1) {
    let remaining = count;
    for (let i = 0; i < INVENTORY_SIZE && remaining > 0; i++) {
      const stack = this._slots[i];
      if (!stack || stack.id !== itemId) continue;
      const take = Math.min(stack.count, remaining);
      stack.count -= take;
      remaining -= take;
      if (stack.count === 0) this._slots[i] = null;
    }
    if (remaining !== count) this._notify();
    return count - remaining;
  }

  removeFromSlot(index, count = 1) {
    const slot = clampIndex(index);
    const stack = this._slots[slot];
    if (!stack) return 0;
    const take = Math.min(stack.count, count);
    stack.count -= take;
    if (stack.count === 0) this._slots[slot] = null;
    this._notify();
    return take;
  }

  damageFromSlot(index, amount = 1) {
    const slot = clampIndex(index);
    const stack = this._slots[slot];
    if (!stack) return;
    const def = getItem(stack.id);
    if (!def || def.kind !== 'tool') return;
    stack.damage = (stack.damage ?? 0) + amount;
    if (stack.damage >= def.durability) this._slots[slot] = null;
    this._notify();
  }

  setSlot(index, stack) {
    const slot = clampIndex(index);
    this._slots[slot] = copyStack(stack);
    this._notify();
  }

  countOf(itemId) {
    let total = 0;
    for (const stack of this._slots) {
      if (stack?.id === itemId) total += stack.count;
    }
    return total;
  }

  canAdd(itemId, count = 1) {
    if (!getItem(itemId)) return false;
    const maxStack = maxStackFor(itemId);
    let capacity = 0;
    for (const stack of this._slots) {
      if (!stack) capacity += maxStack;
      else if (stack.id === itemId && stack.count < maxStack) capacity += maxStack - stack.count;
    }
    return capacity >= count;
  }

  toJSON() {
    return { slots: this.slots, selectedIndex: this._selected };
  }

  _notify() {
    for (const listener of this._listeners) listener(this);
  }
}
