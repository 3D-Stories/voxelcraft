// src/player/Player.js
// Player state: feet-centred position, velocity, hitbox and view angles.
// Values from docs/06-research-mechanics.md 1.1 and docs/11-features.md 5.2.

import * as THREE from 'three';

export const PLAYER_WIDTH = 0.6;
export const PLAYER_HEIGHT = 1.8;
export const PLAYER_EYE_HEIGHT = 1.62;

export class Player {
  constructor(x = 0, y = 0, z = 0) {
    this.position = new THREE.Vector3(x, y, z); // feet centre; y is the sole of the hitbox
    this.previousPosition = this.position.clone();
    this.velocity = new THREE.Vector3();

    this.width = PLAYER_WIDTH;
    this.height = PLAYER_HEIGHT;
    this.eyeHeight = PLAYER_EYE_HEIGHT;

    this.yaw = 0; // radians, 0 looks down -Z
    this.pitch = 0;

    this.onGround = false;
    this.inWater = false;
    this.sneaking = false;
    this.sprinting = false;
    this.godMode = false;
    this.flying = false;
  }

  get halfWidth() {
    return this.width / 2;
  }

  getAABB() {
    const h = this.halfWidth;
    return {
      minX: this.position.x - h,
      minY: this.position.y,
      minZ: this.position.z - h,
      maxX: this.position.x + h,
      maxY: this.position.y + this.height,
      maxZ: this.position.z + h,
    };
  }

  // Called once per simulation tick, before the physics step, so the renderer
  // can interpolate between the last two ticks.
  beginTick() {
    this.previousPosition.copy(this.position);
  }

  getEyePosition(alpha = 1) {
    return new THREE.Vector3(
      this.previousPosition.x + (this.position.x - this.previousPosition.x) * alpha,
      this.previousPosition.y + (this.position.y - this.previousPosition.y) * alpha + this.eyeHeight,
      this.previousPosition.z + (this.position.z - this.previousPosition.z) * alpha,
    );
  }

  // Direction the camera is facing, on the horizontal plane.
  getForward() {
    return new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
  }
}
