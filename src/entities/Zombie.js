// src/entities/Zombie.js
// A boxy zombie with basic chase/attack AI (docs/03-research-mobs.md:
// 20 HP, 0.23 blocks/tick = 4.6 b/s, 3/4/6 melee damage by difficulty;
// Normal difficulty = 4). Burns away in daylight.

import * as THREE from 'three';
import { Entity } from './Entity.js';

const SPEED = 4.6;
const MAX_HEALTH = 20;
const ATTACK_DAMAGE = 4;
const ATTACK_COOLDOWN = 1.0;
const ATTACK_RANGE = 1.2;
const SIGHT = 24;

const SKIN = 0x4a7a3a;
const SHIRT = 0x2f4a8a;
const PANTS = 0x23233a;

export class Zombie extends Entity {
  constructor(world, x, y, z) {
    super(world, x, y, z, { width: 0.6, height: 1.95 });
    this.health = MAX_HEALTH;
    this.attackTimer = 0;
    this.hurtTimer = 0;
    this.walkTime = 0;
    this.sunTimer = 0;
    this.yaw = 0;

    this.mesh = this._buildMesh();
    this.syncMesh();
  }

  get isDead() {
    return this.health <= 0;
  }

  damage(amount, fromX = null, fromZ = null) {
    if (this.isDead) return;
    this.health -= amount;
    this.hurtTimer = 0.18;
    if (fromX !== null && fromZ !== null) {
      const dx = this.position.x - fromX;
      const dz = this.position.z - fromZ;
      const len = Math.hypot(dx, dz) || 1;
      this.velocity.x = (dx / len) * 3.5;
      this.velocity.z = (dz / len) * 3.5;
    }
  }

  update(dt, player, survival, isDay = false) {
    if (this.removed) return;
    this.attackTimer = Math.max(0, this.attackTimer - dt);
    this.hurtTimer = Math.max(0, this.hurtTimer - dt);

    const dx = player.position.x - this.position.x;
    const dz = player.position.z - this.position.z;
    const distance = Math.hypot(dx, dz);

    if (distance > 0.001 && distance < SIGHT && !survival.dead) {
      this.velocity.x = (dx / distance) * SPEED;
      this.velocity.z = (dz / distance) * SPEED;
      this.yaw = Math.atan2(dx, dz) + Math.PI;
      this.walkTime += dt * SPEED;
      if (distance <= ATTACK_RANGE) {
        this.velocity.x = 0;
        this.velocity.z = 0;
        if (this.attackTimer <= 0) {
          this.attackTimer = ATTACK_COOLDOWN;
          survival.damage(ATTACK_DAMAGE, 'zombie');
        }
      }
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;
      this.walkTime = 0;
    }

    // Daytime burning.
    if (isDay) {
      this.sunTimer += dt;
      if (this.sunTimer >= 1) {
        this.sunTimer = 0;
        this.damage(1);
      }
    } else {
      this.sunTimer = 0;
    }

    this.applyMobPhysics(dt);
    this.syncMesh();
  }

  syncMesh(dt = 0) {
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.yaw;

    const swing = this.walkTime > 0 ? Math.sin(this.walkTime * 6) * 0.55 : 0;
    this.legs[0].rotation.x = swing;
    this.legs[1].rotation.x = -swing;

    const hurt = this.hurtTimer > 0;
    this.materials.forEach((material) => {
      material.emissive.setHex(hurt ? 0x661111 : 0x000000);
    });
  }

  dispose() {
    if (this.mesh.parent) this.mesh.parent.remove(this.mesh);
    this.mesh.traverse((child) => {
      if (child.isMesh) child.geometry.dispose();
    });
    this.materials.forEach((material) => material.dispose());
    this.removed = true;
  }

  // --- model ---------------------------------------------------------------

  _buildMesh() {
    const group = new THREE.Group();
    this.materials = [];

    const material = (color) => {
      const m = new THREE.MeshLambertMaterial({ color });
      this.materials.push(m);
      return m;
    };

    const add = (parent, w, h, d, x, y, z, color) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material(color));
      mesh.position.set(x, y, z);
      parent.add(mesh);
      return mesh;
    };

    // Head (0.5 cube, top at 1.95) with black eyes.
    const head = new THREE.Group();
    head.position.set(0, 1.68, 0);
    add(head, 0.5, 0.5, 0.5, 0, 0, 0, SKIN);
    add(head, 0.1, 0.08, 0.02, -0.12, 0.05, 0.26, 0x101010);
    add(head, 0.1, 0.08, 0.02, 0.12, 0.05, 0.26, 0x101010);
    group.add(head);
    this.head = head;

    add(group, 0.5, 0.7, 0.28, 0, 1.22, 0, SHIRT);
    add(group, 0.5, 0.2, 0.28, 0, 0.82, 0, PANTS);

    // Arms reach forward (vanilla zombie pose).
    this.arms = [];
    for (const side of [-1, 1]) {
      const arm = new THREE.Group();
      arm.position.set(side * 0.34, 1.52, 0);
      add(arm, 0.18, 0.7, 0.18, 0, -0.35, 0, SKIN);
      arm.rotation.x = -1.25;
      group.add(arm);
      this.arms.push(arm);
    }

    this.legs = [];
    for (const side of [-1, 1]) {
      const leg = new THREE.Group();
      leg.position.set(side * 0.14, 0.78, 0);
      add(leg, 0.2, 0.78, 0.2, 0, -0.39, 0, PANTS);
      group.add(leg);
      this.legs.push(leg);
    }

    return group;
  }
}
