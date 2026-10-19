// src/player/PlayerController.js
// First-person input: WASD, jump, sneak, sprint, swimming, creative flight and
// mouse look (docs/11-features.md 5.1-5.3, docs/06-research-mechanics.md 1.1-1.3).

// Speeds: docs/11-features.md 5.2. Jump: 0.42 blocks/tick * 20 TPS
// (docs/11-features.md 5.3, docs/06-research-mechanics.md 1.2).
const WALK_SPEED = 4.317;
const SPRINT_SPEED = 5.612;
const SNEAK_SPEED = 1.3;
const JUMP_VELOCITY = 8.4;

// Creative flight: 11 b/s, sprint-fly 22 b/s, sneak-fly 2.2 b/s,
// vertical 4 b/s (docs/11-features.md 5.2, docs/06-research-mechanics.md 1.1).
const FLY_SPEED = 11.0;
const SPRINT_FLY_SPEED = 22.0;
const SNEAK_FLY_SPEED = 2.2;
const FLY_VERTICAL = 4.0;

// Swimming: 4 b/s horizontal and vertical (docs/11-features.md 5.2).
const SWIM_SPEED = 4.0;
const SWIM_VERTICAL = 3.0;
const SWIM_SINK = 0.8;

const DOUBLE_TAP_MS = 250;
const PITCH_LIMIT = Math.PI / 2 - 0.001;

export class PlayerController {
  constructor(player, domElement, options = {}) {
    if (!player || !domElement) {
      throw new Error('PlayerController requires a player and a DOM element');
    }
    this.player = player;
    this.domElement = domElement;
    this.sensitivity = options.sensitivity ?? 0.0022;
    this.onGodModeChange = null;

    this.enabled = true; // false while an overlay (inventory) is open
    this._keys = new Set();
    this._sprintLatch = false;
    this._lastForwardTap = -Infinity;
    this._lastJumpTap = -Infinity;
    this._cleanup = [];

    this._listen(document, 'keydown', (event) => this._onKeyDown(event));
    this._listen(document, 'keyup', (event) => this._onKeyUp(event));
    this._listen(document, 'mousemove', (event) => this._onMouseMove(event));
    this._listen(window, 'blur', () => this._keys.clear());
    this._listen(domElement, 'click', () => this._requestPointerLock());
    this._listen(domElement, 'contextmenu', (event) => event.preventDefault());
  }

  update() {
    if (!this.enabled) return;
    const player = this.player;
    player.sneaking = this._keys.has('ShiftLeft') || this._keys.has('ShiftRight');
    player.sprinting = !player.sneaking
      && (this._keys.has('ControlLeft') || this._keys.has('ControlRight') || this._sprintLatch);

    const forward = (this._keys.has('KeyW') ? 1 : 0) - (this._keys.has('KeyS') ? 1 : 0);
    const strafe = (this._keys.has('KeyD') ? 1 : 0) - (this._keys.has('KeyA') ? 1 : 0);

    let speed;
    if (player.flying) {
      speed = player.sprinting ? SPRINT_FLY_SPEED : player.sneaking ? SNEAK_FLY_SPEED : FLY_SPEED;
    } else if (player.inWater) {
      speed = SWIM_SPEED;
    } else {
      speed = player.sneaking ? SNEAK_SPEED : player.sprinting ? SPRINT_SPEED : WALK_SPEED;
    }

    if (forward === 0 && strafe === 0) {
      player.velocity.x = 0;
      player.velocity.z = 0;
    } else {
      const length = Math.hypot(forward, strafe);
      const sin = Math.sin(player.yaw);
      const cos = Math.cos(player.yaw);
      player.velocity.x = ((forward * -sin + strafe * cos) / length) * speed;
      player.velocity.z = ((forward * -cos + strafe * -sin) / length) * speed;
    }

    if (player.flying) {
      player.velocity.y = 0;
      if (this._keys.has('Space')) player.velocity.y = FLY_VERTICAL;
      else if (player.sneaking) player.velocity.y = -FLY_VERTICAL;
      return;
    }

    if (player.inWater) {
      if (this._keys.has('Space')) player.velocity.y = SWIM_VERTICAL;
      else if (player.sneaking) player.velocity.y = -SWIM_VERTICAL;
      else player.velocity.y = -SWIM_SINK;
      return;
    }

    if (this._keys.has('Space') && player.onGround) {
      player.velocity.y = JUMP_VELOCITY;
      player.onGround = false;
    }
  }

  destroy() {
    for (const remove of this._cleanup) remove();
    this._cleanup = [];
    this._keys.clear();
  }

  // --- input handlers -------------------------------------------------------

  _onKeyDown(event) {
    if (event.code === 'Space') event.preventDefault();
    this._keys.add(event.code);

    if (event.code === 'KeyW' && !event.repeat) {
      const now = performance.now();
      if (now - this._lastForwardTap <= DOUBLE_TAP_MS) this._sprintLatch = true;
      this._lastForwardTap = now;
    }

    if (event.code === 'KeyG' && !event.repeat) {
      const player = this.player;
      player.godMode = !player.godMode;
      if (!player.godMode) player.flying = false;
      if (this.onGodModeChange) this.onGodModeChange(player.godMode);
    }

    if (event.code === 'Space' && !event.repeat) {
      // Double-tap jump toggles creative flight (docs/11-features.md 5.1).
      const now = performance.now();
      if (this.player.godMode && now - this._lastJumpTap <= DOUBLE_TAP_MS) {
        this.player.flying = !this.player.flying;
        this.player.velocity.y = 0;
      }
      this._lastJumpTap = now;
    }
  }

  _onKeyUp(event) {
    this._keys.delete(event.code);
    if (event.code === 'KeyW') this._sprintLatch = false;
  }

  _onMouseMove(event) {
    if (document.pointerLockElement !== this.domElement) return;
    const player = this.player;
    player.yaw -= event.movementX * this.sensitivity;
    player.pitch -= event.movementY * this.sensitivity;
    player.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, player.pitch));
  }

  _requestPointerLock() {
    if (document.pointerLockElement === this.domElement) return;
    if (typeof this.domElement.requestPointerLock === 'function') {
      this.domElement.requestPointerLock();
    }
  }

  _listen(target, type, handler) {
    target.addEventListener(type, handler);
    this._cleanup.push(() => target.removeEventListener(type, handler));
  }
}
