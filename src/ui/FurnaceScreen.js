// src/ui/FurnaceScreen.js
// Furnace UI: input, fuel, output, burn/cook progress, plus the 36-slot
// inventory and a cursor stack. Opened by right-clicking a furnace block.

import { getItem, iconUrl, maxStackFor } from '../core/ItemRegistry.js';
import { SMELT_TICKS } from '../core/Furnace.js';

function itemIcon(itemId) {
  const img = document.createElement('img');
  img.alt = getItem(itemId)?.name ?? itemId;
  img.draggable = false;
  img.src = iconUrl(itemId);
  return img;
}

export class FurnaceScreen {
  constructor(furnaces, inventory, container = document.body, options = {}) {
    if (!furnaces || !inventory || !container) {
      throw new Error('FurnaceScreen requires a furnace manager, an inventory and a container');
    }
    this.furnaces = furnaces;
    this.inventory = inventory;
    this.container = container;
    this.onToggle = options.onToggle ?? null;
    this.open = false;
    this.pos = null;
    this.state = null;
    this.cursor = null;

    this._build();
    this._unsubscribe = inventory.subscribe(() => {
      if (this.open) this.render();
    });
    this._interval = null;

    this._onKeyDown = (event) => {
      if (!this.open || event.repeat) return;
      if (event.code === 'KeyE' || event.code === 'Escape') {
        event.preventDefault();
        this.close();
      }
    };
    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('mousemove', (event) => this._moveCursor(event));
  }

  openAt(pos) {
    if (this.open) this.close();
    this.state = this.furnaces.ensure(pos.x, pos.y, pos.z);
    this.pos = pos;
    this.open = true;
    this.el.classList.add('open');
    if (document.pointerLockElement) document.exitPointerLock();
    this.render();
    this._interval = setInterval(() => {
      if (this.open) this.render();
    }, 250);
    if (this.onToggle) this.onToggle(true);
  }

  close() {
    if (!this.open) return;
    this.open = false;
    this.el.classList.remove('open');
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
    this._renderCursor();
    if (this.onToggle) this.onToggle(false);
  }

  destroy() {
    this._unsubscribe();
    document.removeEventListener('keydown', this._onKeyDown);
    if (this._interval) clearInterval(this._interval);
    this.el.remove();
    this.cursorEl.remove();
  }

  render() {
    if (!this.open || !this.state) return;
    this._renderFurnace();
    this._renderInventory();
    this._renderCursor();
  }

  _renderFurnace() {
    const setSlot = (slot, imgEl, countEl) => {
      const stack = this.state[slot];
      if (stack) {
        const src = iconUrl(stack.id);
        if (imgEl.getAttribute('src') !== src) imgEl.src = src;
        imgEl.hidden = false;
        countEl.textContent = stack.count > 1 ? String(stack.count) : '';
      } else {
        imgEl.removeAttribute('src');
        imgEl.hidden = true;
        countEl.textContent = '';
      }
    };
    setSlot('input', this.inputImg, this.inputCount);
    setSlot('fuel', this.fuelImg, this.fuelCount);
    setSlot('output', this.outputImg, this.outputCount);

    const burn = this.state.burnTotal > 0 ? this.state.burnTime / this.state.burnTotal : 0;
    this.flameFill.style.height = `${Math.round(Math.max(0, Math.min(1, burn)) * 100)}%`;
    this.flameFill.style.opacity = this.state.burnTime > 0 ? '1' : '0.2';

    const cook = Math.min(1, this.state.cookTime / SMELT_TICKS);
    this.arrowFill.style.width = `${Math.round(cook * 100)}%`;
  }

  _renderInventory() {
    const slots = this.inventory.slots;
    for (let i = 0; i < this._slotEls.length; i++) {
      const { el, img, countEl } = this._slotEls[i];
      const stack = slots[i];
      if (stack) {
        const src = iconUrl(stack.id);
        if (img.getAttribute('src') !== src) img.src = src;
        img.hidden = false;
        countEl.textContent = stack.count > 1 ? String(stack.count) : '';
      } else {
        img.removeAttribute('src');
        img.hidden = true;
        countEl.textContent = '';
      }
      el.classList.toggle('hotbar-row', i < 9);
      el.classList.toggle('selected', i === this.inventory.selectedIndex);
    }
  }

  _renderCursor() {
    if (!this.open || !this.cursor) {
      this.cursorEl.hidden = true;
      return;
    }
    this.cursorEl.hidden = false;
    this.cursorEl.textContent = '';
    this.cursorEl.appendChild(itemIcon(this.cursor.id));
    if (this.cursor.count > 1) {
      const count = document.createElement('span');
      count.className = 'inv-count';
      count.textContent = String(this.cursor.count);
      this.cursorEl.appendChild(count);
    }
  }

  _moveCursor(event) {
    if (!this.open) return;
    this.cursorEl.style.left = `${event.clientX - 16}px`;
    this.cursorEl.style.top = `${event.clientY - 16}px`;
  }

  // --- interactions ---------------------------------------------------------

  _onFurnaceSlot(slot, event) {
    event.preventDefault();
    if (slot === 'output') {
      this._takeOutput(event);
      this.render();
      return;
    }
    const stack = this.state[slot];
    this._pickPlace(stack, (next) => { this.state[slot] = next; }, event.button === 2);
    this.render();
  }

  _takeOutput(event) {
    const stack = this.state.output;
    if (!stack) return;

    if (event.shiftKey) {
      this.inventory.add(stack.id, stack.count);
      this.state.output = null;
      return;
    }
    if (this.cursor) {
      if (this.cursor.id !== stack.id) return;
      if (this.cursor.count + stack.count > maxStackFor(stack.id)) return;
      this.cursor.count += stack.count;
    } else {
      this.cursor = { ...stack };
    }
    this.state.output = null;
  }

  _onInventorySlot(index, event) {
    event.preventDefault();
    if (event.shiftKey) {
      this._quickMove(index);
    } else {
      const stack = this.inventory.slots[index];
      this._pickPlace(stack, (next) => this.inventory.setSlot(index, next), event.button === 2);
    }
    this.render();
  }

  _pickPlace(stack, setter, right) {
    if (!this.cursor) {
      if (!stack) return;
      if (right) {
        const half = Math.ceil(stack.count / 2);
        this.cursor = { ...stack, count: half };
        setter(stack.count - half > 0 ? { ...stack, count: stack.count - half } : null);
      } else {
        this.cursor = { ...stack };
        setter(null);
      }
      return;
    }

    if (!stack) {
      if (right) {
        this.cursor.count -= 1;
        setter({ ...this.cursor, count: 1 });
        if (this.cursor.count <= 0) this.cursor = null;
      } else {
        setter({ ...this.cursor });
        this.cursor = null;
      }
      return;
    }

    if (stack.id === this.cursor.id) {
      const max = maxStackFor(stack.id);
      const move = Math.min(right ? 1 : this.cursor.count, max - stack.count);
      if (move <= 0) return;
      setter({ ...stack, count: stack.count + move });
      this.cursor.count -= move;
      if (this.cursor.count <= 0) this.cursor = null;
      return;
    }

    setter({ ...this.cursor });
    this.cursor = { ...stack };
  }

  _quickMove(index) {
    const stack = this.inventory.slots[index];
    if (!stack) return;
    const max = maxStackFor(stack.id);
    const [start, end] = index < 9 ? [9, 36] : [0, 9];
    let remaining = stack.count;

    for (let i = start; i < end && remaining > 0; i++) {
      const target = this.inventory.slots[i];
      if (!target || target.id !== stack.id || target.count >= max) continue;
      const move = Math.min(max - target.count, remaining);
      this.inventory.setSlot(i, { ...target, count: target.count + move });
      remaining -= move;
    }
    for (let i = start; i < end && remaining > 0; i++) {
      if (this.inventory.slots[i]) continue;
      this.inventory.setSlot(i, { ...stack, count: remaining });
      remaining = 0;
    }
    this.inventory.setSlot(index, remaining > 0 ? { ...stack, count: remaining } : null);
  }

  // --- DOM ------------------------------------------------------------------

  _build() {
    this.el = document.createElement('div');
    this.el.id = 'furnace-screen';
    this.el.className = 'inventory-panel-wrap';

    const panel = document.createElement('div');
    panel.className = 'inventory-panel';

    const title = document.createElement('h2');
    title.textContent = 'Furnace';

    const area = document.createElement('div');
    area.className = 'furnace-area';

    const inputSlot = document.createElement('div');
    inputSlot.className = 'craft-slot';
    inputSlot.dataset.slot = 'input';
    this.inputImg = document.createElement('img');
    this.inputImg.hidden = true;
    this.inputCount = document.createElement('span');
    this.inputCount.className = 'inv-count';
    inputSlot.append(this.inputImg, this.inputCount);
    inputSlot.addEventListener('mousedown', (event) => this._onFurnaceSlot('input', event));

    const flame = document.createElement('div');
    flame.className = 'furnace-flame';
    this.flameFill = document.createElement('div');
    this.flameFill.className = 'furnace-flame-fill';
    flame.appendChild(this.flameFill);

    const fuelSlot = document.createElement('div');
    fuelSlot.className = 'craft-slot';
    fuelSlot.dataset.slot = 'fuel';
    this.fuelImg = document.createElement('img');
    this.fuelImg.hidden = true;
    this.fuelCount = document.createElement('span');
    this.fuelCount.className = 'inv-count';
    fuelSlot.append(this.fuelImg, this.fuelCount);
    fuelSlot.addEventListener('mousedown', (event) => this._onFurnaceSlot('fuel', event));

    const column = document.createElement('div');
    column.className = 'furnace-column';
    column.append(inputSlot, flame, fuelSlot);

    const arrow = document.createElement('div');
    arrow.className = 'furnace-arrow';
    this.arrowFill = document.createElement('div');
    this.arrowFill.className = 'furnace-arrow-fill';
    arrow.appendChild(this.arrowFill);

    const outputSlot = document.createElement('div');
    outputSlot.className = 'craft-result filled';
    outputSlot.dataset.slot = 'output';
    this.outputImg = document.createElement('img');
    this.outputImg.hidden = true;
    this.outputCount = document.createElement('span');
    this.outputCount.className = 'inv-count';
    outputSlot.append(this.outputImg, this.outputCount);
    outputSlot.addEventListener('mousedown', (event) => this._onFurnaceSlot('output', event));

    area.append(column, arrow, outputSlot);

    this.slotsEl = document.createElement('div');
    this.slotsEl.className = 'inventory-grid';
    this._slotEls = [];
    for (let i = 0; i < this.inventory.slots.length; i++) {
      const slot = document.createElement('div');
      slot.className = 'inv-slot';
      const img = document.createElement('img');
      img.alt = '';
      img.draggable = false;
      img.hidden = true;
      const countEl = document.createElement('span');
      countEl.className = 'inv-count';
      slot.append(img, countEl);
      slot.addEventListener('mousedown', (event) => this._onInventorySlot(i, event));
      this.slotsEl.appendChild(slot);
      this._slotEls.push({ el: slot, img, countEl });
    }

    const note = document.createElement('p');
    note.className = 'inventory-note';
    note.textContent = 'Fuel burns while there is something to smelt · E or Esc to close';

    panel.append(title, area, this.slotsEl, note);
    this.el.appendChild(panel);
    this.el.addEventListener('contextmenu', (event) => event.preventDefault());
    this.container.appendChild(this.el);

    this.cursorEl = document.createElement('div');
    this.cursorEl.className = 'cursor-stack';
    this.cursorEl.hidden = true;
    this.container.appendChild(this.cursorEl);
  }
}
