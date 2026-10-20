// src/ui/HUD.js
// Hotbar (icons, counts, durability), health/hunger/air, damage flash and the
// death screen. 1-9 and the mouse wheel select hotbar slots.

import { getItem, iconUrl } from '../core/ItemRegistry.js';
import { HOTBAR_SIZE } from '../core/Inventory.js';
import './styles.css';

const UI_BASE = '/assets/textures/ui';
const HEART_FULL = `${UI_BASE}/heart_full.png`;
const HEART_HALF = `${UI_BASE}/heart_half.png`;
const HEART_EMPTY = `${UI_BASE}/heart_empty.png`;
const HUNGER_FULL = `${UI_BASE}/hunger_full.png`;
const HUNGER_HALF = `${UI_BASE}/hunger_half.png`;
const HUNGER_EMPTY = `${UI_BASE}/hunger_empty.png`;
const BUBBLE = `${UI_BASE}/bubble.png`;

export class HUD {
  constructor(inventory, container = document.body, options = {}) {
    if (!inventory || !container) {
      throw new Error('HUD requires an inventory and a container element');
    }
    this.inventory = inventory;
    this.container = container;
    this.survival = options.survival ?? null;
    this.onRespawn = options.onRespawn ?? null;
    this._slots = [];
    this._vitalsKey = '';
    this._unsubscribe = null;

    this._build();
    this._unsubscribe = inventory.subscribe(() => this.render());
    this.render();
    this.setVitals();

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

  setVitals() {
    const s = this.survival;
    if (!s) return;
    const key = [
      Math.ceil(s.health),
      Math.ceil(s.hunger),
      Math.ceil(s.air),
      s.dead ? 1 : 0,
      Math.round(s.flash * 20),
    ].join('|');
    if (key === this._vitalsKey) return;
    this._vitalsKey = key;

    for (let i = 0; i < 10; i++) {
      const value = s.health - i * 2;
      this.heartEls[i].src = value >= 2 ? HEART_FULL : value === 1 ? HEART_HALF : HEART_EMPTY;
      const food = s.hunger - i * 2;
      this.hungerEls[i].src = food >= 2 ? HUNGER_FULL : food === 1 ? HUNGER_HALF : HUNGER_EMPTY;
    }

    const showAir = s.air < s.maxAir;
    this.airRow.hidden = !showAir;
    if (showAir) {
      const bubbles = Math.max(0, Math.ceil((s.air / s.maxAir) * 10));
      for (let i = 0; i < 10; i++) {
        this.airEls[i].hidden = i >= bubbles;
      }
    }

    this.flashEl.style.opacity = String(Math.min(0.85, s.flash * 0.85));
    this.deathEl.classList.toggle('open', s.dead);
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
    this.vitalsEl.remove();
    this.flashEl.remove();
    this.deathEl.remove();
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

    this.vitalsEl = document.createElement('div');
    this.vitalsEl.id = 'vitals';

    this.airRow = document.createElement('div');
    this.airRow.id = 'air-row';
    this.airRow.hidden = true;
    this.airEls = [];
    for (let i = 0; i < 10; i++) {
      const bubble = document.createElement('img');
      bubble.src = BUBBLE;
      bubble.alt = '';
      bubble.draggable = false;
      this.airRow.appendChild(bubble);
      this.airEls.push(bubble);
    }

    const statRow = document.createElement('div');
    statRow.id = 'stat-row';

    const hearts = document.createElement('div');
    hearts.id = 'hearts';
    this.heartEls = [];
    for (let i = 0; i < 10; i++) {
      const heart = document.createElement('img');
      heart.src = HEART_FULL;
      heart.alt = '';
      heart.draggable = false;
      hearts.appendChild(heart);
      this.heartEls.push(heart);
    }

    const hunger = document.createElement('div');
    hunger.id = 'hunger';
    this.hungerEls = [];
    for (let i = 0; i < 10; i++) {
      const drumstick = document.createElement('img');
      drumstick.src = HUNGER_FULL;
      drumstick.alt = '';
      drumstick.draggable = false;
      hunger.appendChild(drumstick);
      this.hungerEls.push(drumstick);
    }

    statRow.append(hearts, hunger);
    this.vitalsEl.append(this.airRow, statRow);
    this.container.appendChild(this.vitalsEl);

    this.flashEl = document.createElement('div');
    this.flashEl.id = 'damage-flash';
    this.container.appendChild(this.flashEl);

    this.deathEl = document.createElement('div');
    this.deathEl.id = 'death-screen';
    const title = document.createElement('h1');
    title.textContent = 'You died!';
    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'respawn-button';
    button.textContent = 'Respawn';
    button.addEventListener('click', () => {
      if (this.onRespawn) this.onRespawn();
    });
    this.deathEl.append(title, button);
    this.container.appendChild(this.deathEl);
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
