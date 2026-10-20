// src/ui/InventoryScreen.js
// 36-slot inventory + 2x2/3x3 crafting grid with a cursor stack.
// E opens the inventory; right-clicking a placed crafting table opens the 3x3
// grid. God mode swaps crafting for the creative block palette.

import { getItem, iconUrl, itemForBlock, maxStackFor } from '../core/ItemRegistry.js';
import { BlockRegistry } from '../core/BlockRegistry.js';
import { CraftingGrid } from '../core/CraftingGrid.js';

const CREATIVE_BLOCKS = [
  BlockRegistry.GRASS,
  BlockRegistry.DIRT,
  BlockRegistry.STONE,
  BlockRegistry.SAND,
  BlockRegistry.OAK_LOG,
  BlockRegistry.OAK_LEAVES,
  BlockRegistry.OAK_PLANKS,
  BlockRegistry.CRAFTING_TABLE,
  BlockRegistry.FURNACE,
  BlockRegistry.SMOOTH_STONE,
  BlockRegistry.COAL_ORE,
  BlockRegistry.IRON_ORE,
  BlockRegistry.GOLD_ORE,
  BlockRegistry.REDSTONE_ORE,
  BlockRegistry.DIAMOND_ORE,
  BlockRegistry.WATER,
];

function itemIcon(itemId) {
  const img = document.createElement('img');
  img.alt = getItem(itemId)?.name ?? itemId;
  img.draggable = false;
  img.src = iconUrl(itemId);
  return img;
}

export class InventoryScreen {
  constructor(inventory, container = document.body, options = {}) {
    if (!inventory || !container) {
      throw new Error('InventoryScreen requires an inventory and a container element');
    }
    this.inventory = inventory;
    this.container = container;
    this.player = options.player ?? null;
    this.onToggle = options.onToggle ?? null;
    this.isBlocked = options.isBlocked ?? null;
    this.open = false;
    this.station = 'inventory';
    this.grid = new CraftingGrid(2);
    this.cursor = null;

    this._build();
    this._unsubscribe = inventory.subscribe(() => {
      if (this.open) this.render();
    });

    this._onKeyDown = (event) => {
      if (event.repeat) return;
      if (event.code === 'KeyE') {
        if (this.isBlocked?.()) return;
        event.preventDefault();
        this.toggle();
      } else if (event.code === 'Escape' && this.open) {
        this.close();
      }
    };
    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('mousemove', (event) => this._moveCursor(event));
  }

  toggle() {
    if (this.open) this.close();
    else this.show('inventory');
  }

  show(station = 'inventory') {
    const size = station === 'table' ? 3 : 2;
    if (this.open && this.grid.size !== size) this._flushGrid();
    if (this.grid.size !== size) this.grid = new CraftingGrid(size);
    this.station = station;
    this.open = true;
    this.el.classList.add('open');
    if (document.pointerLockElement) document.exitPointerLock();
    this.render();
    if (this.onToggle) this.onToggle(true);
  }

  openTable() {
    this.show('table');
  }

  close() {
    if (!this.open) return;
    this._flushGrid();
    this.open = false;
    this.el.classList.remove('open');
    this._renderCursor();
    if (this.onToggle) this.onToggle(false);
  }

  destroy() {
    this._unsubscribe();
    document.removeEventListener('keydown', this._onKeyDown);
    this.el.remove();
    this.cursorEl.remove();
  }

  // --- rendering ------------------------------------------------------------

  render() {
    this.titleEl.textContent = this.station === 'table' ? 'Crafting Table' : 'Inventory';
    this._renderSlots();
    this._renderCrafting();
    this._renderCreative();
    this._renderCursor();
  }

  _renderSlots() {
    const slots = this.inventory.slots;
    for (let i = 0; i < this._slotEls.length; i++) {
      const { el, img, countEl } = this._slotEls[i];
      const stack = slots[i];
      const def = stack ? getItem(stack.id) : null;
      if (def) {
        const src = iconUrl(stack.id);
        if (img.getAttribute('src') !== src) img.src = src;
        img.hidden = false;
      } else {
        img.removeAttribute('src');
        img.hidden = true;
      }
      countEl.textContent = stack && stack.count > 1 ? String(stack.count) : '';
      el.classList.toggle('hotbar-row', i < 9);
      el.classList.toggle('selected', i === this.inventory.selectedIndex);
    }
  }

  _renderCrafting() {
    const creative = Boolean(this.player?.godMode);
    this.craftArea.hidden = creative;
    if (creative) return;

    const size = this.grid.size;
    this.craftGridEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    this.craftGridEl.textContent = '';
    for (let i = 0; i < size * size; i++) {
      const slot = document.createElement('div');
      slot.className = 'craft-slot';
      const stack = this.grid.slots[i];
      if (stack) {
        slot.appendChild(itemIcon(stack.id));
        if (stack.count > 1) {
          const count = document.createElement('span');
          count.className = 'inv-count';
          count.textContent = String(stack.count);
          slot.appendChild(count);
        }
      }
      slot.addEventListener('mousedown', (event) => this._onCraftSlot(i, event));
      this.craftGridEl.appendChild(slot);
    }

    const output = this.grid.peekResult();
    this.resultEl.textContent = '';
    this.resultEl.classList.toggle('filled', Boolean(output));
    if (output) {
      this.resultEl.appendChild(itemIcon(output.id));
      const count = document.createElement('span');
      count.className = 'inv-count';
      count.textContent = String(output.count);
      this.resultEl.appendChild(count);
    }
    this.resultEl.onmousedown = (event) => this._onResult(event);
  }

  _renderCreative() {
    const creative = Boolean(this.player?.godMode);
    this.creativeEl.hidden = !creative;
    if (!creative) return;
    this.creativeEl.textContent = '';
    for (const blockId of CREATIVE_BLOCKS) {
      const itemId = itemForBlock(blockId);
      if (!itemId) continue;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'inventory-item';
      button.setAttribute('aria-label', getItem(itemId)?.name ?? itemId);
      button.appendChild(itemIcon(itemId));
      button.addEventListener('click', () => {
        this.inventory.setSlot(this.inventory.selectedIndex, { id: itemId, count: 64 });
      });
      this.creativeEl.appendChild(button);
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

  _onCraftSlot(index, event) {
    event.preventDefault();
    const stack = this.grid.slots[index];
    this._pickPlace(stack, (next) => this.grid.setSlot(index, next), event.button === 2);
    this.render();
  }

  _onResult(event) {
    event.preventDefault();
    const output = this.grid.peekResult();
    if (!output) return;

    if (event.shiftKey) {
      let guard = 0;
      while (this.grid.peekResult() && this.inventory.canAdd(output.id, output.count) && guard++ < 64) {
        const crafted = this.grid.takeResult();
        this.inventory.add(crafted.id, crafted.count);
      }
      this.render();
      return;
    }

    if (this.cursor) {
      if (this.cursor.id !== output.id) return;
      if (this.cursor.count + output.count > maxStackFor(output.id)) return;
    }
    const crafted = this.grid.takeResult();
    if (!crafted) return;
    if (this.cursor) this.cursor.count += crafted.count;
    else this.cursor = crafted;
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

  _flushGrid() {
    for (let i = 0; i < this.grid.slots.length; i++) {
      const stack = this.grid.slots[i];
      if (!stack) continue;
      const leftover = this.inventory.add(stack.id, stack.count);
      this.grid.setSlot(i, leftover > 0 ? { ...stack, count: leftover } : null);
    }
    if (this.cursor) {
      this.cursor.count = this.inventory.add(this.cursor.id, this.cursor.count);
      if (this.cursor.count <= 0) this.cursor = null;
    }
  }

  // --- DOM ------------------------------------------------------------------

  _build() {
    this.el = document.createElement('div');
    this.el.id = 'inventory';

    const panel = document.createElement('div');
    panel.className = 'inventory-panel';

    this.titleEl = document.createElement('h2');

    this.craftArea = document.createElement('div');
    this.craftArea.className = 'craft-area';
    this.craftGridEl = document.createElement('div');
    this.craftGridEl.className = 'craft-grid';
    const arrow = document.createElement('div');
    arrow.className = 'craft-arrow';
    arrow.textContent = '→';
    this.resultEl = document.createElement('div');
    this.resultEl.className = 'craft-result';
    this.craftArea.append(this.craftGridEl, arrow, this.resultEl);

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

    this.creativeEl = document.createElement('div');
    this.creativeEl.className = 'creative-grid';

    const note = document.createElement('p');
    note.className = 'inventory-note';
    note.textContent = 'Left-click pick up / place · right-click split or place one · shift-click move stacks · E to close';

    panel.append(this.titleEl, this.craftArea, this.slotsEl, this.creativeEl, note);
    this.el.appendChild(panel);
    this.el.addEventListener('contextmenu', (event) => event.preventDefault());
    this.container.appendChild(this.el);

    this.cursorEl = document.createElement('div');
    this.cursorEl.className = 'cursor-stack';
    this.cursorEl.hidden = true;
    this.container.appendChild(this.cursorEl);

    this.render();
  }
}
