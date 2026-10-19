// src/ui/HUD.js
// Hotbar HUD (docs/00-master-prompt.md file tree, docs/11-features.md 6.1).
// Slots render the block's side texture; 1-9 and the mouse wheel select slots.

import { FACE_TEXTURES } from '../core/BlockRegistry.js';
import { HOTBAR_SIZE } from '../player/Hotbar.js';
import './styles.css';

const TEXTURE_BASE = '/assets/textures/blocks';

function iconSource(blockId) {
  const spec = FACE_TEXTURES[blockId];
  return spec ? `${TEXTURE_BASE}/${spec.side}.png` : null;
}

export class HUD {
  constructor(hotbar, container = document.body) {
    if (!hotbar || !container) {
      throw new Error('HUD requires a hotbar and a container element');
    }
    this.hotbar = hotbar;
    this.container = container;
    this._slots = [];
    this._unsubscribe = null;

    this._build();
    this._unsubscribe = hotbar.subscribe(() => this.render());
    this.render();

    this._onKeyDown = (event) => this._handleKeyDown(event);
    this._onWheel = (event) => this._handleWheel(event);
    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('wheel', this._onWheel, { passive: false });
  }

  render() {
    const slots = this.hotbar.slots;
    const selected = this.hotbar.selectedIndex;
    for (let i = 0; i < this._slots.length; i++) {
      const { el, img } = this._slots[i];
      const src = iconSource(slots[i]);
      if (src) {
        if (img.getAttribute('src') !== src) img.src = src;
        img.hidden = false;
      } else {
        img.removeAttribute('src');
        img.hidden = true;
      }
      el.classList.toggle('selected', i === selected);
      el.setAttribute('aria-pressed', i === selected ? 'true' : 'false');
    }
  }

  destroy() {
    if (this._unsubscribe) this._unsubscribe();
    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('wheel', this._onWheel);
    this.el.remove();
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
      slot.addEventListener('click', () => this.hotbar.select(i));

      const img = document.createElement('img');
      img.alt = '';
      img.draggable = false;
      img.hidden = true;

      const index = document.createElement('span');
      index.className = 'hotbar-index';
      index.textContent = String(i + 1);

      slot.append(img, index);
      this.el.appendChild(slot);
      this._slots.push({ el: slot, img });
    }

    this.container.appendChild(this.el);
  }

  _handleKeyDown(event) {
    if (event.repeat) return;
    const match = /^(?:Digit|Numpad)([1-9])$/.exec(event.code);
    if (!match) return;
    event.preventDefault();
    this.hotbar.select(Number(match[1]) - 1);
  }

  _handleWheel(event) {
    if (event.deltaY === 0) return;
    event.preventDefault();
    this.hotbar.cycle(event.deltaY > 0 ? 1 : -1);
  }
}
