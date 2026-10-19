// src/player/Hotbar.js
// Nine-slot hotbar state (docs/11-features.md 6.1). UI lives in src/ui/HUD.js;
// keeping the model pure makes selection and slot rules testable in Node.

export const HOTBAR_SIZE = 9;

function clampIndex(index) {
  if (!Number.isFinite(index)) return 0;
  return Math.max(0, Math.min(HOTBAR_SIZE - 1, Math.floor(index)));
}

export class Hotbar {
  constructor(slots = [], selectedIndex = 0) {
    this._slots = new Array(HOTBAR_SIZE).fill(null);
    for (let i = 0; i < Math.min(slots.length, HOTBAR_SIZE); i++) {
      this._slots[i] = slots[i] ?? null;
    }
    this._selectedIndex = clampIndex(selectedIndex);
    this._listeners = new Set();
  }

  get slots() {
    return this._slots.slice();
  }

  get selectedIndex() {
    return this._selectedIndex;
  }

  get selectedBlock() {
    return this._slots[this._selectedIndex];
  }

  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  select(index) {
    const next = clampIndex(index);
    if (next === this._selectedIndex) return;
    this._selectedIndex = next;
    this._notify();
  }

  cycle(delta) {
    const step = Math.trunc(delta) % HOTBAR_SIZE;
    if (step === 0) return;
    this.select((this._selectedIndex + step + HOTBAR_SIZE) % HOTBAR_SIZE);
  }

  setSlot(index, blockId) {
    const slot = clampIndex(index);
    const value = blockId ?? null;
    if (this._slots[slot] === value) return;
    this._slots[slot] = value;
    this._notify();
  }

  _notify() {
    for (const listener of this._listeners) listener(this);
  }
}
