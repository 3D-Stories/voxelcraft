// src/render/BreakOverlay.js
// A translucent dark cube over the block being mined, growing with progress
// until it breaks (stands in for the crack texture until we have one).

import * as THREE from 'three';

export class BreakOverlay {
  constructor(scene) {
    if (!scene) throw new Error('BreakOverlay requires a scene');
    const geometry = new THREE.BoxGeometry(1.004, 1.004, 1.004);
    const material = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.visible = false;
    this.mesh.renderOrder = 2;
    this.scene = scene;
    scene.add(this.mesh);
  }

  update(target, progress = 0) {
    if (!target || progress <= 0) {
      this.mesh.visible = false;
      return;
    }
    this.mesh.position.set(target.x + 0.5, target.y + 0.5, target.z + 0.5);
    this.mesh.material.opacity = 0.15 + Math.min(0.5, progress * 0.5);
    this.mesh.visible = true;
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
