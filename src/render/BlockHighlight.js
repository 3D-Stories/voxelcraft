// src/render/BlockHighlight.js
// Wireframe cube around the block under the crosshair (vanilla outline).

import * as THREE from 'three';

const SIZE = 1.002; // slightly larger than the block to avoid z-fighting

export class BlockHighlight {
  constructor(scene) {
    if (!scene) throw new Error('BlockHighlight requires a scene');
    const box = new THREE.BoxGeometry(SIZE, SIZE, SIZE);
    const geometry = new THREE.EdgesGeometry(box);
    box.dispose();
    const material = new THREE.LineBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.4,
    });
    this.mesh = new THREE.LineSegments(geometry, material);
    this.mesh.visible = false;
    this.mesh.renderOrder = 1;
    this.scene = scene;
    scene.add(this.mesh);
  }

  update(target) {
    if (!target) {
      this.mesh.visible = false;
      return;
    }
    this.mesh.position.set(target.x + 0.5, target.y + 0.5, target.z + 0.5);
    this.mesh.visible = true;
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
