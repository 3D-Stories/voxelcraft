import canvasPkg from 'canvas';
import { createNoise2D } from 'simplex-noise';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const { createCanvas } = canvasPkg;

const SIZE = 16;
const SEED = 0x5eedc0de;
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets', 'textures', 'blocks');

function hexToRgb(hex) {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
}

function mulberry32(seed) {
  let state = seed >>> 0;
  return function random() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp8(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function shade(rgb, amount) {
  return [clamp8(rgb[0] + amount), clamp8(rgb[1] + amount), clamp8(rgb[2] + amount)];
}

function mix(a, b, t) {
  return [
    clamp8(a[0] + (b[0] - a[0]) * t),
    clamp8(a[1] + (b[1] - a[1]) * t),
    clamp8(a[2] + (b[2] - a[2]) * t)
  ];
}

function drawPixel(ctx, x, y, rgb) {
  ctx.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
  ctx.fillRect(x, y, 1, 1);
}

const COLORS = {
  grassTop: hexToRgb('#7fb238'),
  grassPatch: hexToRgb('#b8c24a'),
  dirt: hexToRgb('#8b6240'),
  stone: hexToRgb('#888888'),
  logTop: hexToRgb('#b5a071'),
  logSide: hexToRgb('#6e5431'),
  leaves: hexToRgb('#4a6b2a'),
  sand: hexToRgb('#e6d9a5'),
  water: hexToRgb('#3f6fc0')
};

function renderGrassTop(ctx, noise, rng) {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const patch = noise(x * 0.28, y * 0.28);
      let color = shade(COLORS.grassTop, (rng() - 0.5) * 24);
      if (patch > 0.15) {
        color = mix(color, COLORS.grassPatch, Math.min(1, (patch - 0.15) * 1.6));
      }
      drawPixel(ctx, x, y, color);
    }
  }
}

function renderDirt(ctx, noise, rng) {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const n = noise(x * 0.35, y * 0.35);
      let color = shade(COLORS.dirt, (rng() - 0.5) * 30);
      if (n > 0.3) color = shade(color, -14);
      if (n < -0.35) color = shade(color, 10);
      if (rng() < 0.07) color = shade(color, -26);
      drawPixel(ctx, x, y, color);
    }
  }
}

function renderGrassSide(ctx, noise, rng) {
  renderDirt(ctx, noise, rng);
  for (let x = 0; x < SIZE; x++) {
    const height = 3 + Math.round(Math.max(0, noise(x * 0.55, 4.2)) * 3.2);
    for (let y = 0; y < height; y++) {
      drawPixel(ctx, x, y, shade(COLORS.grassTop, (rng() - 0.5) * 22 - y * 2));
    }
    if (height < 5 && rng() < 0.3) {
      drawPixel(ctx, x, height, shade(COLORS.grassTop, -18));
    }
  }
}

function renderStone(ctx, noise, rng) {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const n = noise(x * 0.4, y * 0.4);
      let color = shade(COLORS.stone, (rng() - 0.5) * 16);
      if (n > 0.3) color = shade(color, -13);
      if (n < -0.4) color = shade(color, 9);
      if (rng() < 0.05) color = shade(color, -22);
      drawPixel(ctx, x, y, color);
    }
  }
}

function renderOakLogTop(ctx, noise, rng) {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const edge = x === 0 || y === 0 || x === SIZE - 1 || y === SIZE - 1;
      let color;
      if (edge) {
        color = shade(COLORS.logSide, (rng() - 0.5) * 20);
      } else {
        const dx = x - 7.5;
        const dy = y - 7.5;
        const dist = Math.sqrt(dx * dx + dy * dy);
        color = shade(COLORS.logTop, (rng() - 0.5) * 14);
        if (Math.sin(dist * 2.1) > 0.35) {
          color = shade(COLORS.logSide, (rng() - 0.5) * 12 + 8);
        }
      }
      drawPixel(ctx, x, y, color);
    }
  }
}

function renderOakLogSide(ctx, noise, rng) {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const streak = noise(x * 0.65, y * 0.07);
      let color = shade(COLORS.logSide, (rng() - 0.5) * 18);
      if (streak > 0.25) color = shade(color, 13);
      if (streak < -0.3) color = shade(color, -15);
      drawPixel(ctx, x, y, color);
    }
  }
}

function renderOakLeaves(ctx, noise, rng) {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const hole = noise(x * 0.5, y * 0.5);
      if (hole < -0.42 || rng() < 0.05) continue;
      let color = shade(COLORS.leaves, (rng() - 0.5) * 26);
      if (hole > 0.35) color = shade(color, 14);
      if (hole < -0.2) color = shade(color, -16);
      drawPixel(ctx, x, y, color);
    }
  }
}

function renderSand(ctx, noise, rng) {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      let color = shade(COLORS.sand, (rng() - 0.5) * 12);
      if (rng() < 0.05) color = shade(color, -10);
      drawPixel(ctx, x, y, color);
    }
  }
}

function renderWater(ctx) {
  const [r, g, b] = COLORS.water;
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(0, 0, SIZE, SIZE);
}

const TEXTURES = [
  { name: 'grass_top', render: renderGrassTop },
  { name: 'grass_side', render: renderGrassSide },
  { name: 'dirt', render: renderDirt },
  { name: 'stone', render: renderStone },
  { name: 'oak_log_top', render: renderOakLogTop },
  { name: 'oak_log_side', render: renderOakLogSide },
  { name: 'oak_leaves', render: renderOakLeaves },
  { name: 'sand', render: renderSand },
  { name: 'water', render: renderWater }
];

mkdirSync(OUT_DIR, { recursive: true });

TEXTURES.forEach((texture, index) => {
  const rng = mulberry32(SEED + index * 0x9e3779b9);
  const noise = createNoise2D(mulberry32(SEED ^ ((index + 1) * 0x85ebca6b)));
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  texture.render(ctx, noise, rng);
  writeFileSync(join(OUT_DIR, `${texture.name}.png`), canvas.toBuffer('image/png'));
  console.log(`wrote ${texture.name}.png`);
});
