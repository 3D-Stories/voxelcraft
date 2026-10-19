# 10. Architecture Specification

> This document specifies the technical architecture for VoxelCraft, the Three.js-based Minecraft clone. The implementing AI should follow this structure unless it has a strong justification to deviate.

## 1. Module Dependency Graph

```
                        ┌───────────┐
                        │  main.js  │  (entry point)
                        └─────┬─────┘
                              │
                              ▼
                        ┌───────────┐
                        │   Game    │  (orchestrator)
                        └─────┬─────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
        ┌─────────┐     ┌─────────┐     ┌─────────┐
        │  World  │     │ Player  │     │ Renderer│
        └────┬────┘     └────┬────┘     └────┬────┘
             │               │               │
   ┌─────────┼─────────┐    │            ┌──┴──┐
   │         │         │    │            │     │
   ▼         ▼         ▼    ▼            ▼     ▼
┌──────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐
│Chunk │ │WorldGen│ │Structure│ │Player │ │ChunkMesh │
│Mgr   │ │        │ │ Mgr    │ │Physics│ │          │
└──────┘ └────────┘ └────────┘ └────────┘ └──────────┘
```

## 2. Chunk Data Structure

A `Chunk` represents a 16×16 column of blocks, 384 blocks tall (Y=-64 to 320 for Overworld).

```javascript
// src/core/Chunk.js
export const CHUNK_SIZE = 16;
export const CHUNK_HEIGHT = 384;     // Overworld
export const CHUNK_MIN_Y = -64;      // Overworld
export const SEA_LEVEL = 63;

export class Chunk {
  constructor(cx, cz, dimension) {
    this.cx = cx;                    // chunk X coordinate
    this.cz = cz;                    // chunk Z coordinate
    this.dimension = dimension;      // 'overworld' | 'nether' | 'end'
    
    // Block storage: 16*16*384 = 98,304 blocks per chunk
    // Use Uint8Array for block ID (0-255), Uint8Array for state (0-255)
    this.blockIds = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_HEIGHT);
    this.blockStates = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_HEIGHT);
    
    // Light storage: 4 bits sky + 4 bits block = 1 byte per block
    this.light = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_HEIGHT);
    
    // Mesh reference (Three.js BufferGeometry)
    this.mesh = null;
    this.meshDirty = true;
    this.lightDirty = true;
    
    // Status: 'empty' | 'generating' | 'generated' | 'meshing' | 'ready'
    this.status = 'empty';
    
    // Modification tracking for save
    this.modified = false;
  }
  
  // Index calculation: y is offset by -CHUNK_MIN_Y so it starts at 0
  getIndex(x, y, z) {
    const yo = y - CHUNK_MIN_Y;
    return (yo * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + x;
  }
  
  getBlock(x, y, z) {
    const idx = this.getIndex(x, y, z);
    return { id: this.blockIds[idx], state: this.blockStates[idx] };
  }
  
  setBlock(x, y, z, id, state = 0) {
    const idx = this.getIndex(x, y, z);
    this.blockIds[idx] = id;
    this.blockStates[idx] = state;
    this.meshDirty = true;
    this.lightDirty = true;
    this.modified = true;
    
    // Mark neighbors dirty if on edge
    if (x === 0 || x === CHUNK_SIZE - 1 || z === 0 || z === CHUNK_SIZE - 1) {
      this.markNeighborsDirty();
    }
  }
  
  getSkyLight(x, y, z) {
    return (this.light[this.getIndex(x, y, z)] >> 4) & 0x0F;
  }
  
  getBlockLight(x, y, z) {
    return this.light[this.getIndex(x, y, z)] & 0x0F;
  }
  
  setLight(x, y, z, sky, block) {
    this.light[this.getIndex(x, y, z)] = (sky << 4) | block;
  }
}
```

## 3. Greedy Meshing Algorithm

Naive meshing renders each block face as 2 triangles = 6 vertices. For a 16×16×384 chunk fully filled, that's ~3.6M vertices. **Greedy meshing** merges adjacent same-texture faces into large quads, cutting this by 80-90%.

```javascript
// src/render/ChunkMesher.js
export function greedyMesh(chunk, blockRegistry) {
  const positions = [];
  const normals = [];
  const uvs = [];
  const colors = [];  // for baked lighting
  const indices = [];
  
  // For each of 6 directions
  for (let face = 0; face < 6; face++) {
    const dir = FACES[face];
    
    // Iterate over slices perpendicular to face direction
    // For each slice, find runs of same-block + same-state and merge
    for (let u = 0; u < CHUNK_SIZE; u++) {
      for (let v = 0; v < CHUNK_SIZE; v++) {
        for (let d = 0; d < CHUNK_HEIGHT; d++) {
          // Skip if already merged or transparent
          // ... (full algorithm in 03-research-mechanics.md reference)
        }
      }
    }
  }
  
  return { positions, normals, uvs, colors, indices };
}
```

**Performance**: Run meshing in a Web Worker via OffscreenCanvas (if supported) or via a worker that posts `ArrayBuffer` back. Throttle to 2-3 chunks per frame to avoid hitching.

## 4. Lighting System

Two-channel lighting: **sky light** (15 = direct sky exposure) and **block light** (15 = adjacent to light source). Both decay by 1 per block traveled through transparent blocks.

### 4.1 Sky Light Propagation

```javascript
// src/render/Lighting.js (sky light pass)
export function computeSkyLight(chunk) {
  // For each (x, z) column in chunk
  for (let x = 0; x < 16; x++) {
    for (let z = 0; z < 16; z++) {
      let light = 15;  // full sky at top
      // Scan from top to bottom
      for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) {
        const block = chunk.getBlock(x, y, z);
        if (blockRegistry.isOpaque(block.id)) {
          light = 0;
        }
        chunk.setSkyLight(x, y, z, light);
      }
    }
  }
  
  // Horizontal propagation (BFS from light sources)
  bfsPropagateSkyLight(chunk);
}
```

### 4.2 Block Light Propagation

Use a BFS queue seeded with all light-emitting blocks in the chunk (torches=14, glowstone=15, etc.). Propagate outward, decrementing by 1 per block. Stop at 0 or at opaque blocks.

### 4.3 Smooth Lighting (Ambient Occlusion)

For each face vertex, sample 4 neighbors (3 in front of face, 1 corner). Average their opacity → AO value 0-1. Multiply vertex color by AO. This produces the soft "smooth lighting" effect vanilla Minecraft uses in Fancy graphics.

## 5. Texture Atlas

```javascript
// src/render/TextureAtlas.js
export class TextureAtlas {
  constructor(tileSize = 16, tilesPerRow = 16) {
    this.tileSize = tileSize;
    this.tilesPerRow = tilesPerRow;
    this.atlasSize = tileSize * tilesPerRow;  // 256x256 for 256 tiles
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.atlasSize;
    this.canvas.height = this.atlasSize;
    this.ctx = this.canvas.getContext('2d');
    this.tileMap = new Map();  // textureName -> {x, y} in atlas
  }
  
  addTexture(name, image) {
    const idx = this.tileMap.size;
    const x = (idx % this.tilesPerRow) * this.tileSize;
    const y = Math.floor(idx / this.tilesPerRow) * this.tileSize;
    this.ctx.drawImage(image, x, y, this.tileSize, this.tileSize);
    this.tileMap.set(name, { x, y, idx });
  }
  
  getUV(name) {
    const { x, y } = this.tileMap.get(name);
    return {
      u0: x / this.atlasSize,
      v0: y / this.atlasSize,
      u1: (x + this.tileSize) / this.atlasSize,
      v1: (y + this.tileSize) / this.atlasSize,
    };
  }
  
  toTexture() {
    const tex = new THREE.CanvasTexture(this.canvas);
    tex.magFilter = THREE.NearestFilter;  // pixelated
    tex.minFilter = THREE.NearestMipmapNearestFilter;  // for mipmap levels
    tex.generateMipmaps = true;
    return tex;
  }
}
```

## 6. Player Physics (AABB Collision)

```javascript
// src/player/PlayerPhysics.js
export class PlayerPhysics {
  constructor(player, world) {
    this.player = player;
    this.world = world;
    this.gravity = -32;  // blocks/sec^2
    this.terminalVelocity = -78;  // blocks/sec (matches vanilla)
  }
  
  update(dt) {
    // Apply gravity
    if (!this.player.flying) {
      this.player.velocity.y += this.gravity * dt;
      if (this.player.velocity.y < this.terminalVelocity) {
        this.player.velocity.y = this.terminalVelocity;
      }
    }
    
    // Move + collide on each axis separately (swept AABB)
    this.moveAxis('x', this.player.velocity.x * dt);
    this.moveAxis('y', this.player.velocity.y * dt);
    this.moveAxis('z', this.player.velocity.z * dt);
  }
  
  moveAxis(axis, delta) {
    // Move the player by delta on the given axis
    // Then check collisions with blocks via AABB
    // If collision, snap to block edge and zero velocity on that axis
    const aabb = this.player.getAABB();
    aabb.translate(axis, delta);
    
    // Check all blocks the AABB overlaps
    const blocks = this.world.getOverlappingBlocks(aabb);
    for (const block of blocks) {
      if (blockRegistry.isSolid(block.id)) {
        // Resolve collision (snap to nearest block face)
        // ...
      }
    }
  }
}
```

## 7. Mob AI Architecture

```javascript
// src/entities/Mob.js
export class Mob extends LivingEntity {
  constructor(type, world) {
    super(type, world);
    this.goalSelector = new GoalSelector();
    this.targetSelector = new GoalSelector();
    this.navigation = new Navigation(this, world);
    this.sensing = new Sensing(this, world);
    this.brain = null;  // only set for "Brain" mobs (villager, piglin, allay, etc.)
    this.controller = new LookController(this);
    this.moveControl = new MoveController(this);
    this.jumpControl = new JumpController(this);
  }
  
  tick(dt) {
    super.tick(dt);
    this.sensing.tick();
    this.goalSelector.tick();
    this.targetSelector.tick();
    if (this.brain) this.brain.tick();
    this.navigation.tick();
    this.controller.tick();
    this.moveControl.tick();
    this.jumpControl.tick();
  }
}

// src/entities/MobAI.js
export class GoalSelector {
  constructor() {
    this.goals = [];  // [{priority, goal, flags}]
    this.runningGoals = new Set();
  }
  
  addGoal(priority, goal) {
    this.goals.push({ priority, goal });
    this.goals.sort((a, b) => a.priority - b.priority);
  }
  
  tick() {
    // Find highest-priority goal that can start, and stop lower-priority conflicting goals
    for (const { priority, goal } of this.goals) {
      if (goal.canUse()) {
        // Stop any running goals with conflicting flags
        for (const running of this.runningGoals) {
          if (running.flags & goal.flags) {
            running.stop();
            this.runningGoals.delete(running);
          }
        }
        goal.start();
        this.runningGoals.add(goal);
        return;
      }
    }
    
    // Tick running goals
    for (const goal of [...this.runningGoals]) {
      goal.tick();
      if (goal.canContinueToUse() === false) {
        goal.stop();
        this.runningGoals.delete(goal);
      }
    }
  }
}
```

### 7.1 Goal Examples

```javascript
// src/entities/mobs/MeleeAttackGoal.js
export class MeleeAttackGoal extends Goal {
  constructor(mob, target, speed) {
    super();
    this.mob = mob;
    this.target = target;
    this.speed = speed;
    this.flags = Flag.MOVE | Flag.LOOK;
  }
  
  canUse() {
    return this.target && this.target.isAlive() && this.mob.sensing.hasLineOfSight(this.target);
  }
  
  start() {
    this.mob.navigation.moveTo(this.target.position, this.speed);
  }
  
  tick() {
    if (this.mob.distanceTo(this.target) < 2.0) {
      this.mob.attack(this.target);
    } else {
      this.mob.navigation.moveTo(this.target.position, this.speed);
    }
  }
}
```

## 8. Pathfinding (A* over voxel grid)

```javascript
// src/entities/PathFinder.js
export class PathFinder {
  constructor(world, mob) {
    this.world = world;
    this.mob = mob;
    this.maxNodes = 200;  // path length cap
  }
  
  findPath(start, target) {
    const openSet = new MinHeap();
    const closedSet = new Set();
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();
    
    const startKey = this.key(start);
    gScore.set(startKey, 0);
    fScore.set(startKey, this.heuristic(start, target));
    openSet.push({ node: start, f: fScore.get(startKey) });
    
    while (!openSet.isEmpty() && closedSet.size < this.maxNodes) {
      const current = openSet.pop().node;
      const currentKey = this.key(current);
      
      if (this.equals(current, target)) {
        return this.reconstructPath(cameFrom, current);
      }
      
      closedSet.add(currentKey);
      
      for (const neighbor of this.getNeighbors(current)) {
        const neighborKey = this.key(neighbor);
        if (closedSet.has(neighborKey)) continue;
        if (!this.isWalkable(neighbor)) continue;
        
        const tentativeG = gScore.get(currentKey) + this.cost(current, neighbor);
        if (!gScore.has(neighborKey) || tentativeG < gScore.get(neighborKey)) {
          cameFrom.set(neighborKey, current);
          gScore.set(neighborKey, tentativeG);
          fScore.set(neighborKey, tentativeG + this.heuristic(neighbor, target));
          openSet.push({ node: neighbor, f: fScore.get(neighborKey) });
        }
      }
    }
    
    return null;  // no path found
  }
  
  getNeighbors(node) {
    // 4 horizontal neighbors + jump-up + drop-down
    return [
      { x: node.x + 1, y: node.y, z: node.z },
      { x: node.x - 1, y: node.y, z: node.z },
      { x: node.x, y: node.y, z: node.z + 1 },
      { x: node.x, y: node.y, z: node.z - 1 },
      // Step up if blocked horizontally but walkable above
      { x: node.x + 1, y: node.y + 1, z: node.z },
      // ... etc
    ];
  }
  
  isWalkable(node) {
    const feet = this.world.getBlock(node.x, node.y, node.z);
    const head = this.world.getBlock(node.x, node.y + 1, node.z);
    const ground = this.world.getBlock(node.x, node.y - 1, node.z);
    return !blockRegistry.isSolid(feet.id) &&
           !blockRegistry.isSolid(head.id) &&
           blockRegistry.isSolid(ground.id);
  }
}
```

## 9. World Generation Pipeline

10-stage chunk generation (matches vanilla 1.18+ pipeline):

```javascript
// src/worldgen/WorldGenerator.js
export class WorldGenerator {
  async generateChunk(cx, cz, dimension) {
    const chunk = new Chunk(cx, cz, dimension);
    
    // Stage 1: Noise — basic terrain heightmap
    this.generateNoise(chunk);
    
    // Stage 2: Biome — sample 3D biome at each (x, y, z)
    this.assignBiomes(chunk);
    
    // Stage 3: Surface — replace top blocks based on biome
    this.decorateSurface(chunk);
    
    // Stage 4: Carving — caves and ravines
    this.carveTerrain(chunk);
    
    // Stage 5: Features — trees, ores, flowers, cactus
    await this.placeFeatures(chunk);
    
    // Stage 6: Structures — villages, dungeons, etc.
    this.placeStructures(chunk);
    
    // Stage 7: Initial lighting
    this.computeSkyLight(chunk);
    this.computeBlockLight(chunk);
    
    // Stage 8: Mob spawn initial (for spawners)
    this.initializeSpawners(chunk);
    
    // Stage 9: Decoration — grass, snow, mushrooms
    this.finalDecoration(chunk);
    
    // Stage 10: Finalize
    chunk.status = 'generated';
    chunk.meshDirty = true;
    
    return chunk;
  }
}
```

## 10. Texture Generation Reference

Color palette for the procedural texture generator (top 50 blocks):

| Block | Top color | Side color | Noise variation |
|---|---|---|---|
| Grass (top) | #7FB238 | — | low (10%) |
| Dirt | #8B6240 | #8B6240 | medium (20%) |
| Stone | #888888 | #888888 | low (8%) |
| Cobblestone | #7A7A7A | #7A7A7A | high (30%) |
| Oak Log (top) | #B5A071 | #6E5431 | rings pattern |
| Oak Log (side) | #6E5431 | #6E5431 | vertical bark lines |
| Oak Planks | #B5905A | #B5905A | horizontal grain |
| Oak Leaves | #4A6B2A | #4A6B2A | medium (15%), alpha-broken |
| Sand | #E6D9A5 | #E6D9A5 | low (5%) |
| Water | #3F6FC0 | #3F6FC0 | none, animated |
| Bedrock | #444444 | #444444 | high (40%) |
| Coal Ore | #888888 + black spots | same | high |
| Iron Ore | #888888 + tan spots | same | high |
| Gold Ore | #888888 + yellow spots | same | high |
| Diamond Ore | #888888 + cyan spots | same | high |
| Glowstone | #A88245 | #A88245 | spots of #FFD080 |
| Glass | transparent + #DDDDDD border | same | none |
| Brick | #8E4F2E + mortar | same | brick pattern |
| Sandstone (top) | #E6D9A5 | #E0CEA4 | smooth |
| Sandstone (side) | — | #E0CEA4 + horizontal lines | medium |
| Snow | #F4F4F4 | #F4F4F4 | very low |
| Ice | #9AC0E8 | #9AC0E8 | none, semi-transparent |
| Cactus (top) | #5B7E3F | #5B7E3F | smooth |
| Cactus (side) | — | #5B7E3F | ribbed pattern |
| Pumpkin (top) | #C2702A | #C2702A | stem |
| Pumpkin (side) | — | #C2702A | ridged vertical |
| Netherrack | #6E2E2E | #6E2E2E | high (30%) |
| Soul Sand | #4A3F35 | #4A3F35 | medium, face impressions |
| Glowstone | #9A7A4A | #9A7A4A | spots of #FFD080 |
| Obsidian | #14121F | #14121F | purple specks |
| End Stone | #DBD8A5 | #DBD8A5 | low |

(See research file `01-research-blocks.md` for the full list of 800+ blocks with their properties.)

## 11. Memory Management

- **Chunk pooling**: maintain a free-list of `Chunk` objects; reuse instead of allocating.
- **Mesh pooling**: when a chunk unloads, recycle its `BufferGeometry` instead of disposing.
- **Texture streaming**: load atlas once at startup; never unload.
- **Entity pooling**: dead mobs return to pool; new mobs reuse.
- **GC pressure**: avoid creating objects in tick loops. Use `Vector3` reuse, `ArrayBuffer` pooling for worker messages.

## 12. Performance Budget (per frame @ 60 FPS = 16ms)

| Subsystem | Budget (ms) |
|---|---|
| Render (Three.js draw calls) | 6 |
| Player physics | 0.5 |
| Mob AI (60 mobs @ 0.1ms each, throttled) | 2 |
| Chunk meshing (1-2 chunks/frame) | 2 |
| Particle system | 0.5 |
| UI updates | 0.5 |
| Misc / Input / Audio | 0.5 |
| **Total** | **12 ms** (leaves 4ms slack) |

If a frame exceeds 16ms, throttle: skip mob AI ticks, defer chunk meshing, reduce particle count.

## 13. Web Worker Strategy

Offload heavy computation to workers:
- **Chunk generation worker**: runs the 10-stage pipeline. Posts `Chunk` (ArrayBuffer) back.
- **Chunk meshing worker**: runs greedy meshing. Posts `BufferGeometry` data back.
- **Pathfinding worker**: runs A* for mobs. Posts paths back.
- **Main thread**: only does rendering + input + UI.

Use `OffscreenCanvas` for the renderer if supported (Chrome, Edge) — allows renderer in worker too.

## 14. Build Configuration (Vite)

```javascript
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    outDir: 'dist',
    assetsInlineLimit: 4096,  // inline assets < 4KB
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three'],
          'game': ['./src/main.js'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['three', 'simplex-noise', 'idb'],
  },
  server: {
    port: 3000,
    open: true,
  },
});
```

## 15. Compatibility & Browser Support

- **Chrome/Edge 110+**: full support (WebGL2, OffscreenCanvas, Web Workers, IndexedDB v3).
- **Firefox 110+**: full support.
- **Safari 16.0+**: mostly supported. May need fallbacks for OffscreenCanvas (use main-thread meshing).
- **Mobile Safari 16+**: basic support; performance may be limited.

**Feature detection**: use `OffscreenCanvas` if available, else main thread. Use `WebGL2` if available, else WebGL1 fallback (or show "unsupported" message).

## 16. Error Handling

- All `await` calls wrapped in try/catch with user-facing error toast.
- WebGL context loss: pause game, show "Graphics context lost" dialog, attempt recovery.
- IndexedDB quota exceeded: show warning, prompt user to delete old worlds.
- Worker crash: log + restart worker; affected chunks re-mesh.

## 17. Logging

```javascript
// src/utils/Logger.js
export const Logger = {
  info: (...args) => console.log('[INFO]', ...args),
  warn: (...args) => console.warn('[WARN]', ...args),
  error: (...args) => { console.error('[ERROR]', ...args); /* also send to error overlay */ },
  debug: (...args) => { if (DEBUG) console.log('[DEBUG]', ...args); },
};
```

## 18. File Size Targets

| Asset | Target (gzipped) |
|---|---|
| Three.js | ~150 KB |
| Game code | ~200 KB |
| Procedural textures (atlas) | ~300 KB |
| Block/item data (JSON) | ~150 KB |
| Sound effects (subset) | ~500 KB |
| Music (one track, looping) | ~2 MB |
| **Total initial load** | **~3 MB** |

Music + additional sounds stream lazily on first play.
