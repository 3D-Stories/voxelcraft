// src/render/HeldItem.js
// First-person view-model: the selected block as a small cube or the selected
// item/tool as a sprite, attached to the camera, with a swing animation.

import * as THREE from 'three';
import { getItem } from '../core/ItemRegistry.js';
import { FACE_TEXTURES } from '../core/BlockRegistry.js';

const SWING_SECONDS = 0.28;

function atlasGrid(texture, tileSize) {
  return {
    cols: Math.max(1, Math.round(texture.image.width / tileSize)),
    rows: Math.max(1, Math.round(texture.image.height / tileSize)),
  };
}

export class HeldItem {
  constructor(camera, textureAtlas, inventory) {
    this.camera = camera;
    this.atlas = textureAtlas;
    this.inventory = inventory;
    this.itemId = null;
    this.mesh = null;
    this.swingTime = 0;
    this._textures = new Map();

    this.group = new THREE.Group();
    this.group.position.set(0.36, -0.3, -0.6);
    camera.add(this.group);

    this.pivot = new THREE.Group();
    this.group.add(this.pivot);

    this._unsubscribe = inventory.subscribe(() => this.refresh());
    this.refresh();
  }

  refresh() {
    const id = this.inventory.selectedId;
    if (id === this.itemId) return;
    this.itemId = id;

    if (this.mesh) {
      this.pivot.remove(this.mesh);
      this.mesh.geometry.dispose();
      if (this.mesh.material.map && this.mesh.material.userData.ownTexture) {
        this.mesh.material.map.dispose();
      }
      this.mesh.material.dispose();
      this.mesh = null;
    }
    if (!id) return;
    const def = getItem(id);
    if (!def) return;

    if (def.kind === 'block') this.mesh = this._blockMesh(def.blockId);
    else this.mesh = this._spriteMesh(def.icon);
    if (this.mesh) this.pivot.add(this.mesh);
  }

  swing() {
    this.swingTime = SWING_SECONDS;
  }

  update(dt) {
    if (this.swingTime > 0) {
      this.swingTime = Math.max(0, this.swingTime - dt);
      const t = 1 - this.swingTime / SWING_SECONDS;
      const arc = Math.sin(Math.min(1, t) * Math.PI);
      this.pivot.rotation.x = -arc * 1.0;
      this.pivot.position.y = -arc * 0.12;
      this.pivot.position.z = -arc * 0.08;
      this.group.rotation.z = arc * 0.25;
    } else {
      this.pivot.rotation.x = 0;
      this.pivot.position.set(0, 0, 0);
      this.group.rotation.z = 0;
    }
  }

  dispose() {
    this._unsubscribe();
    if (this.mesh) {
      this.pivot.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
    }
    this.camera.remove(this.group);
  }

  // --- meshes ---------------------------------------------------------------

  _blockMesh(blockId) {
    const spec = FACE_TEXTURES[blockId];
    if (!spec) return null;
    const { cols, rows } = atlasGrid(this.atlas.texture, this.atlas.tileSize);
    const geometry = new THREE.BoxGeometry(0.22, 0.22, 0.22);
    const uv = geometry.attributes.uv;
    const faceTiles = [spec.side, spec.side, spec.top, spec.bottom, spec.side, spec.side];

    for (let face = 0; face < 6; face++) {
      const tile = this.atlas.getTile(faceTiles[face]);
      const u0 = tile.x / cols;
      const v0 = tile.y / rows;
      for (let i = 0; i < 4; i++) {
        const index = face * 4 + i;
        uv.setXY(index, u0 + uv.getX(index) / cols, v0 + uv.getY(index) / rows);
      }
    }
    uv.needsUpdate = true;

    const material = new THREE.MeshLambertMaterial({ map: this.atlas.texture });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.set(0.18, -0.55, 0.12);
    return mesh;
  }

  _spriteMesh(iconPath) {
    const url = `/assets/textures/${iconPath}`;
    let texture = this._textures.get(url);
    if (!texture) {
      texture = new THREE.TextureLoader().load(url);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      texture.generateMipmaps = false;
      this._textures.set(url, texture);
    }
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    material.userData.ownTexture = false;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.28), material);
    mesh.rotation.set(0.05, 0.25, 0.45);
    return mesh;
  }
}
