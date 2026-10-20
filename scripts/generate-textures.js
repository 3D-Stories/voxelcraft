import canvasPkg from 'canvas';
import { createNoise2D } from 'simplex-noise';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const { createCanvas } = canvasPkg;

const SIZE = 16;
const SEED = 0x5eedc0de;
const BLOCKS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets', 'textures', 'blocks');
const ITEMS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets', 'textures', 'items');
const UI_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets', 'textures', 'ui');

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
  water: hexToRgb('#3f6fc0'),
  planks: hexToRgb('#b08a55'),
  planksDark: hexToRgb('#6f5230'),
  handle: hexToRgb('#8a6a3f'),
  handleDark: hexToRgb('#4a3520'),
  woodHead: hexToRgb('#c9a266'),
  stoneHead: hexToRgb('#9c9c9c'),
  stoneDark: hexToRgb('#5c5c5c'),
  blade: hexToRgb('#d9d9d9'),
  bladeDark: hexToRgb('#8a8a8a'),
  smoothStone: hexToRgb('#a8a8a8'),
  charcoal: hexToRgb('#2b2b2b'),
  charcoalLight: hexToRgb('#4a4a4a'),
  apple: hexToRgb('#c62828'),
  appleLight: hexToRgb('#ef5350'),
  appleLeaf: hexToRgb('#4c8c2b'),
  heart: hexToRgb('#e53935'),
  heartEmpty: hexToRgb('#3a2a2a'),
  hunger: hexToRgb('#b5651d'),
  hungerEmpty: hexToRgb('#3a2a2a'),
  bubble: hexToRgb('#64b5f6')
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

function renderOakPlanks(ctx, noise, rng) {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const board = Math.floor(y / 4);
      let color = shade(COLORS.planks, (rng() - 0.5) * 10 + (board % 2) * 5);
      if (y % 4 === 3) color = COLORS.planksDark;
      else if ((x + board * 5) % 8 === 0) color = shade(COLORS.planksDark, 8);
      if (noise(x * 0.5, y * 0.5) > 0.4) color = shade(color, -7);
      drawPixel(ctx, x, y, color);
    }
  }
}

function renderCraftingTableTop(ctx, noise, rng) {
  renderOakPlanks(ctx, noise, rng);
  for (const line of [0, 5, 10, 15]) {
    for (let i = 0; i < SIZE; i++) {
      drawPixel(ctx, line, i, COLORS.planksDark);
      drawPixel(ctx, i, line, COLORS.planksDark);
    }
  }
}

function renderCraftingTableSide(ctx, noise, rng) {
  renderOakPlanks(ctx, noise, rng);
  for (let x = 0; x < SIZE; x++) {
    for (let y = 0; y < 3; y++) {
      drawPixel(ctx, x, y, shade(COLORS.planksDark, -4));
    }
  }
  // A simple saw + hammer motif.
  for (let i = 0; i < 7; i++) {
    drawPixel(ctx, 3 + i, 6 + i, COLORS.stoneHead);
    drawPixel(ctx, 4 + i, 6 + i, COLORS.stoneDark);
  }
  for (let i = 0; i < 4; i++) {
    drawPixel(ctx, 10, 8 + i, COLORS.handle);
    drawPixel(ctx, 11, 8 + i, COLORS.handleDark);
  }
  for (let x = 9; x <= 13; x++) {
    drawPixel(ctx, x, 7, COLORS.stoneHead);
  }
}

function renderFurnaceTop(ctx, noise, rng) {
  renderStone(ctx, noise, rng);
  for (let i = 0; i < SIZE; i++) {
    drawPixel(ctx, i, 0, COLORS.stoneDark);
    drawPixel(ctx, i, SIZE - 1, COLORS.stoneDark);
    drawPixel(ctx, 0, i, COLORS.stoneDark);
    drawPixel(ctx, SIZE - 1, i, COLORS.stoneDark);
  }
  for (let x = 4; x <= 11; x++) {
    drawPixel(ctx, x, 4, COLORS.stoneDark);
    drawPixel(ctx, x, 11, COLORS.stoneDark);
  }
  for (let y = 4; y <= 11; y++) {
    drawPixel(ctx, 4, y, COLORS.stoneDark);
    drawPixel(ctx, 11, y, COLORS.stoneDark);
  }
}

function renderFurnaceSide(ctx, noise, rng) {
  renderStone(ctx, noise, rng);
  for (let x = 3; x <= 12; x++) drawPixel(ctx, x, 7, COLORS.stoneDark);
  for (let y = 8; y <= 14; y++) {
    for (let x = 4; x <= 11; x++) {
      if (y === 14 && (x === 4 || x === 11)) continue;
      drawPixel(ctx, x, y, COLORS.stoneDark);
    }
  }
  for (let x = 5; x <= 10; x++) drawPixel(ctx, x, 9, hexToRgb('#1a1a1a'));
}

function renderSmoothStone(ctx, noise, rng) {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      let color = shade(COLORS.smoothStone, (rng() - 0.5) * 6);
      if (x === 0 || y === 0 || x === SIZE - 1 || y === SIZE - 1) color = shade(color, -8);
      if (noise(x * 0.3, y * 0.3) > 0.5) color = shade(color, -4);
      drawPixel(ctx, x, y, color);
    }
  }
}

function charcoalIcon(ctx) {
  for (let y = 5; y <= 12; y++) {
    for (let x = 4; x <= 12; x++) {
      const edge = (x === 4 || x === 12) && (y === 5 || y === 12);
      if (edge) continue;
      px(ctx, x, y, COLORS.charcoal);
    }
  }
  for (let i = 0; i < 6; i++) {
    px(ctx, 6 + i, 7, COLORS.charcoalLight);
    px(ctx, 5 + i, 10, COLORS.charcoalLight);
  }
}

function heartMask(ctx, mode) {
  const rows = [
    '.##...##.',
    '#########',
    '#########',
    '#########',
    '.#######.',
    '..#####..',
    '...###...',
    '....#....'
  ];
  rows.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      if (cell === '.') return;
      let color = COLORS.heart;
      if (mode === 'empty') color = COLORS.heartEmpty;
      else if (mode === 'half' && x >= Math.ceil(row.length / 2)) color = COLORS.heartEmpty;
      px(ctx, 4 + x, 4 + y, color);
    });
  });
}

function hungerMask(ctx, mode) {
  const rows = [
    '..#####..',
    '.########',
    '.########',
    '..######.',
    '...###...',
    '....#....',
    '...#.....',
    '..#......'
  ];
  rows.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      if (cell === '.') return;
      let color = COLORS.hunger;
      if (mode === 'empty') color = COLORS.hungerEmpty;
      else if (mode === 'half' && x >= Math.ceil(row.length / 2)) color = COLORS.hungerEmpty;
      px(ctx, 4 + x, 4 + y, color);
    });
  });
}

function bubbleIcon(ctx) {
  const rows = [
    '..###..',
    '.#####.',
    '#######',
    '#######',
    '#######',
    '.#####.',
    '..###..'
  ];
  rows.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      if (cell === '.') return;
      const color = (x === 2 && y === 2) ? hexToRgb('#e3f2fd') : COLORS.bubble;
      px(ctx, 4 + x, 4 + y, color);
    });
  });
}

function appleIcon(ctx) {
  for (let y = 3; y <= 12; y++) {
    for (let x = 3; x <= 12; x++) {
      const dx = x - 7.5;
      const dy = y - 8;
      if (dx * dx + dy * dy > 20) continue;
      px(ctx, x, y, (x < 6 && y < 8) ? COLORS.appleLight : COLORS.apple);
    }
  }
  px(ctx, 8, 1, COLORS.handleDark);
  px(ctx, 8, 2, COLORS.handleDark);
  px(ctx, 9, 2, COLORS.appleLeaf);
  px(ctx, 10, 2, COLORS.appleLeaf);
  px(ctx, 9, 3, COLORS.appleLeaf);
}

// --- Item icons -------------------------------------------------------------

function px(ctx, x, y, color) {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
  ctx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
  ctx.fillRect(x, y, 1, 1);
}

function line(ctx, x0, y0, x1, y1, color, width = 1) {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;
  for (;;) {
    for (let ox = 0; ox < width; ox++) {
      for (let oy = 0; oy < width; oy++) px(ctx, x + ox, y + oy, color);
    }
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x += sx; }
    if (e2 <= dx) { err += dx; y += sy; }
  }
}

function handle(ctx) {
  line(ctx, 10, 13, 6, 8, COLORS.handle, 2);
  line(ctx, 11, 13, 7, 8, COLORS.handleDark, 1);
}

function toolIcon(ctx, type, headColor, edgeColor) {
  handle(ctx);
  if (type === 'pickaxe') {
    line(ctx, 3, 6, 7, 3, headColor, 2);
    line(ctx, 7, 3, 12, 5, headColor, 2);
    line(ctx, 3, 6, 11, 5, edgeColor, 1);
    px(ctx, 2, 7, edgeColor);
    px(ctx, 12, 5, edgeColor);
  } else if (type === 'axe') {
    for (let y = 3; y <= 7; y++) {
      for (let x = 3; x <= 8; x++) {
        if ((x === 3 && y > 4) || (y === 7 && x < 5)) continue;
        px(ctx, x, y, headColor);
      }
    }
    line(ctx, 3, 4, 7, 3, edgeColor, 1);
    line(ctx, 8, 4, 8, 7, edgeColor, 1);
  } else if (type === 'shovel') {
    for (let y = 2; y <= 5; y++) {
      for (let x = 9; x <= 13; x++) {
        if ((x === 9 || x === 13) && (y === 2 || y === 5)) continue;
        px(ctx, x, y, headColor);
      }
    }
    line(ctx, 10, 2, 13, 2, edgeColor, 1);
    line(ctx, 13, 2, 13, 5, edgeColor, 1);
  } else if (type === 'sword') {
    line(ctx, 4, 13, 12, 3, COLORS.blade, 2);
    line(ctx, 4, 13, 11, 3, edgeColor, 1);
    line(ctx, 3, 12, 7, 14, COLORS.handle, 2);
    line(ctx, 2, 11, 6, 13, COLORS.handleDark, 1);
    line(ctx, 12, 2, 13, 3, COLORS.blade, 1);
  }
}

function stickIcon(ctx) {
  line(ctx, 5, 13, 10, 4, COLORS.handle, 2);
  line(ctx, 6, 13, 11, 4, COLORS.handleDark, 1);
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
  { name: 'water', render: renderWater },
  { name: 'oak_planks', render: renderOakPlanks },
  { name: 'crafting_table_top', render: renderCraftingTableTop },
  { name: 'crafting_table_side', render: renderCraftingTableSide },
  { name: 'furnace_top', render: renderFurnaceTop },
  { name: 'furnace_side', render: renderFurnaceSide },
  { name: 'smooth_stone', render: renderSmoothStone }
];

const ITEM_TEXTURES = [
  { name: 'stick', render: stickIcon },
  { name: 'charcoal', render: charcoalIcon },
  { name: 'apple', render: appleIcon },
  { name: 'wooden_pickaxe', render: (ctx) => toolIcon(ctx, 'pickaxe', COLORS.woodHead, COLORS.handleDark) },
  { name: 'stone_pickaxe', render: (ctx) => toolIcon(ctx, 'pickaxe', COLORS.stoneHead, COLORS.stoneDark) },
  { name: 'wooden_axe', render: (ctx) => toolIcon(ctx, 'axe', COLORS.woodHead, COLORS.handleDark) },
  { name: 'stone_axe', render: (ctx) => toolIcon(ctx, 'axe', COLORS.stoneHead, COLORS.stoneDark) },
  { name: 'wooden_shovel', render: (ctx) => toolIcon(ctx, 'shovel', COLORS.woodHead, COLORS.handleDark) },
  { name: 'stone_shovel', render: (ctx) => toolIcon(ctx, 'shovel', COLORS.stoneHead, COLORS.stoneDark) },
  { name: 'wooden_sword', render: (ctx) => toolIcon(ctx, 'sword', COLORS.woodHead, COLORS.handleDark) },
  { name: 'stone_sword', render: (ctx) => toolIcon(ctx, 'sword', COLORS.stoneHead, COLORS.stoneDark) }
];

const UI_TEXTURES = [
  { name: 'heart_full', render: (ctx) => heartMask(ctx, 'full') },
  { name: 'heart_half', render: (ctx) => heartMask(ctx, 'half') },
  { name: 'heart_empty', render: (ctx) => heartMask(ctx, 'empty') },
  { name: 'hunger_full', render: (ctx) => hungerMask(ctx, 'full') },
  { name: 'hunger_half', render: (ctx) => hungerMask(ctx, 'half') },
  { name: 'hunger_empty', render: (ctx) => hungerMask(ctx, 'empty') },
  { name: 'bubble', render: bubbleIcon }
];

mkdirSync(BLOCKS_DIR, { recursive: true });
mkdirSync(ITEMS_DIR, { recursive: true });
mkdirSync(UI_DIR, { recursive: true });

TEXTURES.forEach((texture, index) => {
  const rng = mulberry32(SEED + index * 0x9e3779b9);
  const noise = createNoise2D(mulberry32(SEED ^ ((index + 1) * 0x85ebca6b)));
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  texture.render(ctx, noise, rng);
  writeFileSync(join(BLOCKS_DIR, `${texture.name}.png`), canvas.toBuffer('image/png'));
  console.log(`wrote blocks/${texture.name}.png`);
});

ITEM_TEXTURES.forEach((texture, index) => {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  texture.render(ctx);
  writeFileSync(join(ITEMS_DIR, `${texture.name}.png`), canvas.toBuffer('image/png'));
  console.log(`wrote items/${texture.name}.png`);
});

UI_TEXTURES.forEach((texture) => {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  texture.render(ctx);
  writeFileSync(join(UI_DIR, `${texture.name}.png`), canvas.toBuffer('image/png'));
  console.log(`wrote ui/${texture.name}.png`);
});
