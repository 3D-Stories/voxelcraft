// src/ui/HUD.js
// Hotbar HUD: item icons, stack counts, tool durability, selection and the
// god-mode badge. 1-9 and the mouse wheel select slots.

import { getItem, iconUrl } from '../core/ItemRegistry.js';
import { HOTBAR_SIZE } from '../core/Inventory.js';
import './styles.css';

export class HUD {
  constructor(inventory, container = document.body) {
    if (!inventory || !container) {
      throw new Error('HUD requires an inventory and a container element');
    }
    this.inventory = inventory;
    this.container = container;
    this._slots = [];
    this._unsubscribe = null;

    this._build();
    this._unsubscribe = inventory.subscribe(() => this.render());
    this.render();

    this._onKeyDown = (event) => this._handleKeyDown(event);
    this._onWheel = (event) => this._handleWheel(event);
    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('wheel', this._onWheel, { passive: false });
  }

  render() {
    const slots = this.inventory.hotbar;
    const selected = this.inventory.selectedIndex;
    for (let i = 0; i < this._slots.length; i++) {
      const { el, img, countEl, durability, durabilityFill } = this._slots[i];
      const stack = slots[i];
      const def = stack ? getItem(stack.id) : null;
      const src = stack ? iconUrl(stack.id) : null;

      if (src) {
        if (img.getAttribute('src') !== src) img.src = src;
        img.hidden = false;
      } else {
        img.removeAttribute('src');
        img.hidden = true;
      }

      countEl.textContent = stack && stack.count > 1 ? String(stack.count) : '';

      if (def?.durability && stack) {
        const pct = Math.max(0, 1 - (stack.damage ?? 0) / def.durability);
        durability.hidden = false;
        durabilityFill.style.width = `${Math.round(pct * 100)}%`;
        durabilityFill.style.background = pct > 0.5 ? '#4caf50' : pct > 0.2 ? '#ffc107' : '#f44336';
      } else {
        durability.hidden = true;
      }

      el.classList.toggle('selected', i === selected);
      el.setAttribute('aria-pressed', i === selected ? 'true' : 'false');
    }
  }

  setGodMode(on) {
    this.badge.hidden = !on;
  }

  destroy() {
    if (this._unsubscribe) this._unsubscribe();
    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('wheel', this._onWheel);
    this.el.remove();
    this.badge.remove();
  }

  // --- internals -----------------------------------------------------------

  _build() {
    this.el = document.createElement('div');
    this.el.id = 'hotbar';
    this.el.setAttribute('role', 'toolbar');
    this.el.setAttribute('aria-label', 'Hotbar');

    for (let i = 0; i < HOTBAR_SIZE; i++) {
      const slot = document.createElement('button');
      slot.type = 'button';
      slot.className = 'hotbar-slot';
      slot.dataset.slot = String(i);
      slot.setAttribute('aria-label', `Hotbar slot ${i + 1}`);
      slot.addEventListener('click', () => this.inventory.select(i));

      const img = document.createElement('img');
      img.alt = '';
      img.draggable = false;
      img.hidden = true;

      const countEl = document.createElement('span');
      countEl.className = 'hotbar-count';

      const durability = document.createElement('div');
      durability.className = 'hotbar-durability';
      durability.hidden = true;
      const durabilityFill = document.createElement('div');
      durabilityFill.className = 'hotbar-durability-fill';
      durability.appendChild(durabilityFill);

      const index = document.createElement('span');
      index.className = 'hotbar-index';
      index.textContent = String(i + 1);

      slot.append(img, countEl, durability, index);
      this.el.appendChild(slot);
      this._slots.push({ el: slot, img, countEl, durability, durabilityFill });
    }

    this.container.appendChild(this.el);

    this.badge = document.createElement('div');
    this.badge.id = 'godmode-badge';
    this.badge.textContent = 'GOD MODE · double-tap Space to fly';
    this.badge.hidden = true;
    this.container.appendChild(this.badge);
  }

  _handleKeyDown(event) {
    if (event.repeat) return;
    const match = /^(?:Digit|Numpad)([1-9])$/.exec(event.code);
    if (!match) return;
    event.preventDefault();
    this.inventory.select(Number(match[1]) - 1);
  }

  _handleWheel(event) {
    if (event.deltaY === 0) return;
    event.preventDefault();
    this.inventory.cycle(event.deltaY > 0 ? 1 : -1);
  }
}
