// src/render/Sky.js
// Day/night cycle, sun/moon, stars, sky color, fog and the two scene lights
// (docs/05-research-dimensions.md 3.3-3.4, docs/11-features.md).
// A full cycle is 24,000 ticks = 20 real minutes at 20 TPS.

import * as THREE from 'three';
import { mulberry32 } from '../core/Random.js';

const DAY_TICKS = 24000;
const TICKS_PER_SECOND = 20;
const SKY_RADIUS = 400;
const STAR_COUNT = 1500;

// Clear day sky: #78A7FF (docs/05-research-dimensions.md 3.1).
const DAY_COLOR = new THREE.Color(0x78a7ff);
const NIGHT_COLOR = new THREE.Color(0x000203);
const SUNSET_COLOR = new THREE.Color(0xff7733);
const MOONLIGHT_COLOR = new THREE.Color(0x9db4ff);

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function buildStars(seed) {
  const random = mulberry32(seed);
  const positions = new Float32Array(STAR_COUNT * 3);
  for (let i = 0; i < STAR_COUNT; i++) {
    const theta = random() * Math.PI * 2;
    const u = random() * 2 - 1;
    const r = Math.sqrt(1 - u * u);
    positions[i * 3] = Math.cos(theta) * r * SKY_RADIUS;
    positions[i * 3 + 1] = u * SKY_RADIUS;
    positions[i * 3 + 2] = Math.sin(theta) * r * SKY_RADIUS;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 1.4,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    fog: false,
  });
  return new THREE.Points(geometry, material);
}

export class Sky {
  constructor(scene, options = {}) {
    if (!scene) throw new Error('Sky requires a scene');
    this.scene = scene;
    this.dayTime = options.dayTime ?? 0;
    this.seed = options.seed ?? 1337;

    scene.background = new THREE.Color(DAY_COLOR.getHex());
    scene.fog = new THREE.Fog(DAY_COLOR.getHex(), 60, 120);

    this.ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.sunLight = new THREE.DirectionalLight(0xffffff, 2);
    scene.add(this.ambient, this.sunLight);

    this._group = new THREE.Group();
    scene.add(this._group);

    this._sun = new THREE.Sprite(new THREE.SpriteMaterial({
      color: 0xfff6c8, fog: false, depthWrite: false, transparent: true,
    }));
    this._sun.scale.set(30, 30, 1);

    this._moon = new THREE.Sprite(new THREE.SpriteMaterial({
      color: 0xdfe6ff, fog: false, depthWrite: false, transparent: true,
    }));
    this._moon.scale.set(20, 20, 1);

    this._stars = buildStars(this.seed);
    this._group.add(this._sun, this._moon, this._stars);

    this._skyColor = new THREE.Color();
    this._lightColor = new THREE.Color();
    this._sunDir = new THREE.Vector3();
    this._moonDir = new THREE.Vector3();

    this.update(0, null);
  }

  get isNight() {
    return this._sunDir.y < -0.05;
  }

  update(dt = 0, camera = null) {
    this.dayTime = (this.dayTime + dt * TICKS_PER_SECOND) % DAY_TICKS;

    const angle = (this.dayTime / DAY_TICKS) * Math.PI * 2;
    const sunDir = this._sunDir.set(Math.cos(angle), Math.sin(angle), 0.2).normalize();
    const moonDir = this._moonDir.copy(sunDir).multiplyScalar(-1);

    const day = smoothstep(-0.12, 0.22, sunDir.y);
    const twilight = clamp(1 - Math.abs(sunDir.y) / 0.3, 0, 1);

    this._skyColor.copy(NIGHT_COLOR).lerp(DAY_COLOR, day);
    this._skyColor.lerp(SUNSET_COLOR, twilight * 0.55);
    this.scene.background.copy(this._skyColor);
    if (this.scene.fog) this.scene.fog.color.copy(this._skyColor);

    this.ambient.intensity = 0.15 + 0.45 * day;

    const useSun = day > 0.02;
    this.sunLight.position.copy(useSun ? sunDir : moonDir).multiplyScalar(100);
    this.sunLight.intensity = useSun ? 2.0 * day : 0.15 * (1 - day);
    this._lightColor.setRGB(1, 1, 1).lerp(SUNSET_COLOR, twilight * 0.5);
    this.sunLight.color.copy(this._lightColor);

    this._sun.position.copy(sunDir).multiplyScalar(SKY_RADIUS);
    this._moon.position.copy(moonDir).multiplyScalar(SKY_RADIUS);
    this._sun.visible = sunDir.y > -0.2;
    this._moon.visible = moonDir.y > -0.2;

    this._stars.material.opacity = 0.9 * (1 - day);
    this._stars.visible = day < 0.98;

    if (camera) this._group.position.copy(camera.position);
  }

  dispose() {
    this.scene.remove(this._group, this.ambient, this.sunLight);
    this._sun.material.dispose();
    this._moon.material.dispose();
    this._stars.geometry.dispose();
    this._stars.material.dispose();
    this.scene.fog = null;
  }
}
