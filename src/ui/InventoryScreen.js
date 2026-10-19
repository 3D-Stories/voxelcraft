// src/ui/InventoryScreen.js
// Survival inventory + recipe-list crafting. E opens the inventory (planks,
// sticks, crafting table); right-clicking a placed crafting table opens the
// table recipes (tools). God mode swaps recipes for the creative block palette.

import { getItem, iconUrl, itemForBlock } from '../core/ItemRegistry.js';
import { BlockRegistry } from '../core/BlockRegistry.js';
import { recipesFor, canCraft, craft } from '../core/Recipes.js';

const CREATIVE_BLOCKS = [
  BlockRegistry.GRASS,
  BlockRegistry.DIRT,
  BlockRegistry.STONE,
  BlockRegistry.SAND,
  BlockRegistry.OAK_LOG,
  BlockRegistry.OAK_LEAVES,
  BlockRegistry.OAK_PLANKS,
  BlockRegistry.CRAFTING_TABLE,
  BlockRegistry.WATER,
];

function itemButton(itemId) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'inventory-item';
  const def = getItem(itemId);
  button.setAttribute('aria-label', def?.name ?? itemId);
  const img = document.createElement('img');
  img.alt = def?.name ?? itemId;
  img.draggable = false;
  img.src = iconUrl(itemId);
  button.appendChild(img);
  return button;
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
    this.open = false;
    this.station = 'inventory';

    this._build();
    this._unsubscribe = inventory.subscribe(() => {
      if (this.open) this.render();
    });

    this._onKeyDown = (event) => {
      if (event.repeat) return;
      if (event.code === 'KeyE') {
        event.preventDefault();
        this.toggle();
      } else if (event.code === 'Escape' && this.open) {
        this.close();
      }
    };
    document.addEventListener('keydown', this._onKeyDown);
  }

  toggle() {
    if (this.open) this.close();
    else this.show('inventory');
  }

  show(station = 'inventory') {
    this.station = station;
    this.open = true;
    this.stationLabel = station;
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
    this.open = false;
    this.el.classList.remove('open');
    if (this.onToggle) this.onToggle(false);
  }

  destroy() {
    this._unsubscribe();
    document.removeEventListener('keydown', this._onKeyDown);
    this.el.remove();
  }

  // --- rendering ------------------------------------------------------------

  render() {
    this.titleEl.textContent = this.station === 'table' ? 'Crafting Table' : 'Inventory';
    this._renderSlots();
    this._renderRecipes();
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

  _renderRecipes() {
    const recipesEl = this.recipesEl;
    recipesEl.textContent = '';

    const list = document.createElement('div');
    list.className = 'recipe-list';

    if (this.player?.godMode) {
      // Creative: fill the selected slot with any placeable block.
      this.sectionTitleEl.textContent = 'Creative blocks';
      const grid = document.createElement('div');
      grid.className = 'creative-grid';
      for (const blockId of CREATIVE_BLOCKS) {
        const itemId = itemForBlock(blockId);
        if (!itemId) continue;
        const button = itemButton(itemId);
        button.addEventListener('click', () => {
          this.inventory.setSlot(this.inventory.selectedIndex, { id: itemId, count: 64 });
        });
        grid.appendChild(button);
      }
      list.appendChild(grid);
    } else {
      this.sectionTitleEl.textContent = this.station === 'table' ? 'Tools' : 'Crafting';
      for (const recipe of recipesFor(this.station)) {
        const row = document.createElement('div');
        row.className = 'recipe';

        const output = itemButton(recipe.output.id);
        output.classList.add('recipe-output');

        const info = document.createElement('div');
        info.className = 'recipe-info';
        const name = document.createElement('strong');
        const def = getItem(recipe.output.id);
        name.textContent = `${def?.name ?? recipe.output.id}${recipe.output.count > 1 ? ` ×${recipe.output.count}` : ''}`;

        const ingredients = document.createElement('div');
        ingredients.className = 'recipe-ingredients';
        for (const [itemId, count] of Object.entries(recipe.ingredients)) {
          const chip = document.createElement('span');
          chip.className = 'recipe-ingredient';
          const img = document.createElement('img');
          img.src = iconUrl(itemId);
          img.alt = getItem(itemId)?.name ?? itemId;
          chip.append(img, document.createTextNode(`×${count}`));
          ingredients.appendChild(chip);
        }

        info.append(name, ingredients);
        row.append(output, info);

        const craftButton = document.createElement('button');
        craftButton.type = 'button';
        craftButton.className = 'recipe-craft';
        craftButton.textContent = 'Craft';
        craftButton.disabled = !canCraft(this.inventory, recipe);
        craftButton.addEventListener('click', () => {
          if (craft(this.inventory, recipe)) this.render();
        });
        row.appendChild(craftButton);

        list.appendChild(row);
      }
    }

    recipesEl.appendChild(list);
  }

  // --- DOM ------------------------------------------------------------------

  _build() {
    this.el = document.createElement('div');
    this.el.id = 'inventory';

    const panel = document.createElement('div');
    panel.className = 'inventory-panel';

    this.titleEl = document.createElement('h2');
    this.stationLabel = 'inventory';

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
      if (i < 9) {
        slot.addEventListener('click', () => this.inventory.select(i));
      }
      this.slotsEl.appendChild(slot);
      this._slotEls.push({ el: slot, img, countEl });
    }

    this.sectionTitleEl = document.createElement('h3');
    this.recipesEl = document.createElement('div');

    const note = document.createElement('p');
    note.className = 'inventory-note';
    note.textContent = 'Click Craft to make an item · click a hotbar slot to select it · E to close';

    panel.append(this.titleEl, this.slotsEl, this.sectionTitleEl, this.recipesEl, note);
    this.el.appendChild(panel);
    this.container.appendChild(this.el);
    this.render();
  }
}
