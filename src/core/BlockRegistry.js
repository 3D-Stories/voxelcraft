const OPAQUE = new Uint8Array([0, 1, 1, 1, 1, 1, 0, 0, 1, 1]);

// Water is not a solid block: https://minecraft.wiki/w/Water
const SOLID = new Uint8Array([0, 1, 1, 1, 1, 1, 1, 0, 1, 1]);

const LIQUID = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 1, 0, 0]);

// Hardness: docs/01-research-blocks.md (stone 1.5, grass 0.6, dirt/sand 0.5,
// oak log 2.0, oak leaves 0.2). Liquids cannot be targeted or broken.
const HARDNESS = new Float64Array([0, 1.5, 0.6, 0.5, 0.5, 2.0, 0.2, 0, 2.0, 2.5]);

// Stone needs a pickaxe; the other starting blocks can be harvested by hand.
const HAND_HARVEST = new Uint8Array([0, 0, 1, 1, 1, 1, 1, 0, 1, 1]);

// Correct tool for speed bonuses (null = any/hand); required for drops when
// the block cannot be hand-harvested (docs/01-research-blocks.md).
const TOOL = ['', 'pickaxe', 'shovel', 'shovel', 'shovel', 'axe', '', '', 'axe', 'axe'];

export const FACE_TEXTURES = [
  null,
  { top: 'stone', bottom: 'stone', side: 'stone' },
  { top: 'grass_top', bottom: 'dirt', side: 'grass_side' },
  { top: 'dirt', bottom: 'dirt', side: 'dirt' },
  { top: 'sand', bottom: 'sand', side: 'sand' },
  { top: 'oak_log_top', bottom: 'oak_log_top', side: 'oak_log_side' },
  { top: 'oak_leaves', bottom: 'oak_leaves', side: 'oak_leaves' },
  { top: 'water', bottom: 'water', side: 'water' },
  { top: 'oak_planks', bottom: 'oak_planks', side: 'oak_planks' },
  { top: 'crafting_table_top', bottom: 'oak_planks', side: 'crafting_table_side' },
];

export const BlockRegistry = {
  AIR: 0,
  STONE: 1,
  GRASS: 2,
  DIRT: 3,
  SAND: 4,
  OAK_LOG: 5,
  OAK_LEAVES: 6,
  WATER: 7,
  OAK_PLANKS: 8,
  CRAFTING_TABLE: 9,

  isOpaque(id) {
    return !!OPAQUE[id];
  },

  isSolid(id) {
    return !!SOLID[id];
  },

  isLiquid(id) {
    return !!LIQUID[id];
  },

  getFaceTexture(id, faceIndex) {
    const spec = FACE_TEXTURES[id];
    if (!spec) return null;
    if (faceIndex === 2) return spec.top;
    if (faceIndex === 3) return spec.bottom;
    return spec.side;
  },

  getHardness(id) {
    return HARDNESS[id] ?? 0;
  },

  // 'pickaxe' | 'axe' | 'shovel' | '' for the block's preferred tool.
  getTool(id) {
    return TOOL[id] ?? '';
  },

  canHarvestByHand(id) {
    return !!HAND_HARVEST[id];
  },

  // Bare-hand break time on the ground, in seconds. Base time = hardness x 1.5
  // when hand-harvestable, x 5 otherwise (https://minecraft.wiki/w/Breaking#Mining_efficiency).
  // Airborne mining is 5x slower and is applied by BlockInteraction.
  getBreakTimeSeconds(id) {
    const hardness = HARDNESS[id] ?? 0;
    if (hardness <= 0) return 0;
    return hardness * (HAND_HARVEST[id] ? 1.5 : 5);
  },
};
