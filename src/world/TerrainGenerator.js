// src/world/TerrainGenerator.js
// Phase 1 world generator: rolling simplex terrain with three biomes
// (plains, forest, desert) - docs/00-master-prompt.md item 9.
// Deterministic: the same seed always produces the same world.

import { createNoise2D } from 'simplex-noise';
import { CHUNK_SIZE, CHUNK_MIN_Y, CHUNK_HEIGHT, SEA_LEVEL } from '../core/Chunk.js';
import { BlockRegistry } from '../core/BlockRegistry.js';
import { mulberry32 } from '../core/Random.js';

const BROAD_SCALE = 0.0045; // hills
const DETAIL_SCALE = 0.02; // local bumps
const TEMPERATURE_SCALE = 0.0022; // biome regions
const DESERT_THRESHOLD = 0.25;
const FOREST_THRESHOLD = -0.1;

const ORE_VEINS = [
  { block: BlockRegistry.COAL_ORE, veins: 6, size: 6, minY: 10, maxY: 120 },
  { block: BlockRegistry.IRON_ORE, veins: 6, size: 4, minY: -20, maxY: 70 },
  { block: BlockRegistry.GOLD_ORE, veins: 2, size: 4, minY: -64, maxY: 32 },
  { block: BlockRegistry.REDSTONE_ORE, veins: 2, size: 4, minY: -64, maxY: 16 },
  { block: BlockRegistry.DIAMOND_ORE, veins: 1, size: 3, minY: -64, maxY: -40 },
];

const MIN_SURFACE = CHUNK_MIN_Y + 4;
const MAX_SURFACE = CHUNK_MIN_Y + CHUNK_HEIGHT - 5;

function chunkSeed(seed, cx, cz) {
  return (seed ^ Math.imul(cx, 374761393) ^ Math.imul(cz, 668265263)) >>> 0;
}

export class TerrainGenerator {
  constructor(seed = 1337, options = {}) {
    this.seed = seed >>> 0;
    const random = mulberry32(this.seed);
    this._broad = createNoise2D(random);
    this._detail = createNoise2D(random);
    this._temperature = createNoise2D(random);

    // Keep the area around the world spawn free of trees so the player never
    // starts inside a trunk.
    this.spawnX = options.spawnX ?? 8;
    this.spawnZ = options.spawnZ ?? 8;
    this.clearRadius = options.clearRadius ?? 10;
  }

  // Y of the top solid block at world (x, z).
  getHeight(x, z) {
    const broad = this._broad(x * BROAD_SCALE, z * BROAD_SCALE);
    const detail = this._detail(x * DETAIL_SCALE, z * DETAIL_SCALE);
    const height = Math.round(SEA_LEVEL + 2 + broad * 10 + detail * 3);
    return Math.max(MIN_SURFACE, Math.min(MAX_SURFACE, height));
  }

  getBiome(x, z) {
    const temperature = this._temperature(x * TEMPERATURE_SCALE, z * TEMPERATURE_SCALE);
    if (temperature > DESERT_THRESHOLD) return 'desert';
    if (temperature < FOREST_THRESHOLD) return 'forest';
    return 'plains';
  }

  generateChunk(chunk) {
    if (!chunk || typeof chunk.setBlock !== 'function') {
      throw new Error('generateChunk requires a chunk');
    }
    const baseX = chunk.cx * CHUNK_SIZE;
    const baseZ = chunk.cz * CHUNK_SIZE;

    for (let z = 0; z < CHUNK_SIZE; z++) {
      for (let x = 0; x < CHUNK_SIZE; x++) {
        const worldX = baseX + x;
        const worldZ = baseZ + z;
        const height = this.getHeight(worldX, worldZ);
        const desert = this.getBiome(worldX, worldZ) === 'desert';
        const surface = desert ? BlockRegistry.SAND : BlockRegistry.GRASS;
        const filler = desert ? BlockRegistry.SAND : BlockRegistry.DIRT;

        chunk.setBlock(x, height, z, surface);
        for (let y = height - 3; y < height; y++) {
          chunk.setBlock(x, y, z, filler);
        }
        for (let y = CHUNK_MIN_Y; y < height - 3; y++) {
          chunk.setBlock(x, y, z, BlockRegistry.STONE);
        }
      }
    }

    this._placeOres(chunk);
    this._plantTrees(chunk);
    return chunk;
  }

  _placeOres(chunk) {
    const random = mulberry32((chunkSeed(this.seed, chunk.cx, chunk.cz) ^ 0x9e3779b9) >>> 0);
    const baseX = chunk.cx * CHUNK_SIZE;
    const baseZ = chunk.cz * CHUNK_SIZE;

    for (const vein of ORE_VEINS) {
      for (let v = 0; v < vein.veins; v++) {
        let x = Math.floor(random() * CHUNK_SIZE);
        let z = Math.floor(random() * CHUNK_SIZE);
        let y = vein.minY + Math.floor(random() * (vein.maxY - vein.minY + 1));
        for (let n = 0; n < vein.size; n++) {
          if (
            x >= 0 && x < CHUNK_SIZE && z >= 0 && z < CHUNK_SIZE
            && y > CHUNK_MIN_Y && y < CHUNK_MIN_Y + CHUNK_HEIGHT - 2
            && y < this.getHeight(baseX + x, baseZ + z) - 3
            && chunk.getBlock(x, y, z).id === BlockRegistry.STONE
          ) {
            chunk.setBlock(x, y, z, vein.block);
          }
          x += Math.floor(random() * 3) - 1;
          y += Math.floor(random() * 3) - 1;
          z += Math.floor(random() * 3) - 1;
        }
      }
    }
  }

  // Deterministic tree candidates per chunk. Canopies are kept at least two
  // blocks from the chunk edge, so a tree never straddles a chunk border.
  _treePositions(cx, cz) {
    const random = mulberry32(chunkSeed(this.seed, cx, cz));
    const count = 1 + Math.floor(random() * 3);
    const trees = [];
    for (let i = 0; i < count; i++) {
      const localX = 2 + Math.floor(random() * 12);
      const localZ = 2 + Math.floor(random() * 12);
      const worldX = cx * CHUNK_SIZE + localX;
      const worldZ = cz * CHUNK_SIZE + localZ;
      const trunkHeight = 4 + Math.floor(random() * 3);
      if (this.getBiome(worldX, worldZ) !== 'forest') continue;
      const dx = worldX - this.spawnX;
      const dz = worldZ - this.spawnZ;
      if (dx * dx + dz * dz < this.clearRadius * this.clearRadius) continue;
      trees.push({ localX, localZ, worldX, worldZ, trunkHeight });
    }
    return trees;
  }

  _plantTrees(chunk) {
    for (const tree of this._treePositions(chunk.cx, chunk.cz)) {
      this._plantTree(chunk, tree);
    }
  }

  _plantTree(chunk, tree) {
    const { localX, localZ, worldX, worldZ, trunkHeight } = tree;
    const surface = this.getHeight(worldX, worldZ);
    const top = surface + trunkHeight;

    for (let y = surface + 1; y <= top; y++) {
      chunk.setBlock(localX, y, localZ, BlockRegistry.OAK_LOG);
    }

    for (let dy = -2; dy <= 1; dy++) {
      const y = top + dy;
      const radius = dy >= 1 ? 1 : 2;
      for (let dz = -radius; dz <= radius; dz++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (dy <= 0 && dx === 0 && dz === 0) continue; // trunk column
          if (dy === 1 && dx !== 0 && dz !== 0) continue; // small cap
          if (Math.abs(dx) === 2 && Math.abs(dz) === 2) continue; // trimmed corners
          const x = localX + dx;
          const z = localZ + dz;
          if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) continue;
          if (chunk.getBlock(x, y, z).id !== BlockRegistry.AIR) continue;
          chunk.setBlock(x, y, z, BlockRegistry.OAK_LEAVES);
        }
      }
    }
  }
}
