// src/ui/InventoryScreen.js
// Simple block palette for the Phase 1 slice: E toggles it, clicking a block
// puts it in the selected hotbar slot (docs/11-features.md 6.1-6.2).

import { BlockRegistry, FACE_TEXTURES } from '../core/BlockRegistry.js';

const TEXTURE_BASE = '/assets/textures/blocks';

const PALETTE = [
  BlockRegistry.GRASS,
  BlockRegistry.DIRT,
  BlockRegistry.STONE,
  BlockRegistry.SAND,
  BlockRegistry.OAK_LOG,
  BlockRegistry.OAK_LEAVES,
  BlockRegistry.WATER,
];

function labelFor(blockId) {
  const spec = FACE_TEXTURES[blockId];
  if (!spec) return `block ${blockId}`;
  return spec.side.replace(/_side$/, '').replace(/_/g, ' ');
}

export class InventoryScreen {
  constructor(hotbar, container = document.body, options = {}) {
    if (!hotbar || !container) {
      throw new Error('InventoryScreen requires a hotbar and a container element');
    }
    this.hotbar = hotbar;
    this.container = container;
    this.onToggle = options.onToggle ?? null;
    this.open = false;

    this._build();
    this._unsubscribe = hotbar.subscribe(() => this._renderTitle());

    this._onKeyDown = (event) => {
      if (event.code !== 'KeyE' || event.repeat) return;
      event.preventDefault();
      this.toggle();
    };
    document.addEventListener('keydown', this._onKeyDown);
  }

  toggle() {
    if (this.open) this.close();
    else this.show();
  }

  show() {
    if (this.open) return;
    this.open = true;
    this.el.classList.add('open');
    this._renderTitle();
    if (document.pointerLockElement) document.exitPointerLock();
    if (this.onToggle) this.onToggle(true);
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

  // --- internals -----------------------------------------------------------

  _build() {
    this.el = document.createElement('div');
    this.el.id = 'inventory';

    const panel = document.createElement('div');
    panel.className = 'inventory-panel';

    this.titleEl = document.createElement('h2');

    const grid = document.createElement('div');
    grid.className = 'inventory-grid';

    for (const blockId of PALETTE) {
      const spec = FACE_TEXTURES[blockId];
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'inventory-item';
      button.setAttribute('aria-label', `Put ${labelFor(blockId)} in the selected slot`);

      const img = document.createElement('img');
      img.alt = labelFor(blockId);
      img.draggable = false;
      img.src = `${TEXTURE_BASE}/${spec.side}.png`;

      button.addEventListener('click', () => {
        this.hotbar.setSlot(this.hotbar.selectedIndex, blockId);
      });

      button.appendChild(img);
      grid.appendChild(button);
    }

    const note = document.createElement('p');
    note.className = 'inventory-note';
    note.textContent = 'Click a block to put it in the selected slot · E to close';

    panel.append(this.titleEl, grid, note);
    this.el.appendChild(panel);
    this.container.appendChild(this.el);
  }

  _renderTitle() {
    this.titleEl.textContent = `Blocks — slot ${this.hotbar.selectedIndex + 1}`;
  }
}
