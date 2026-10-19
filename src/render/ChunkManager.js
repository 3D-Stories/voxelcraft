// src/render/ChunkManager.js
// Keeps a circular render distance of chunks loaded around the player
// (docs/10-architecture.md section 3). Chunk generation and meshing are
// budgeted per frame so the main thread stays responsive; heavy work moves to
// workers in a later phase.

import { Chunk, CHUNK_SIZE, CHUNK_HEIGHT, CHUNK_MIN_Y, SEA_LEVEL } from '../core/Chunk.js';
import { buildChunkMesh, createChunkMaterial } from './ChunkMesh.js';

const LOAD_BUDGET = 2; // chunks generated per update()
const MESH_BUDGET = 2; // chunk meshes rebuilt per update()

const NEIGHBORS = [
  { key: 'px', opposite: 'nx', dx: 1, dz: 0 },
  { key: 'nx', opposite: 'px', dx: -1, dz: 0 },
  { key: 'pz', opposite: 'nz', dx: 0, dz: 1 },
  { key: 'nz', opposite: 'pz', dx: 0, dz: -1 },
];

function chunkKey(cx, cz) {
  return `${cx},${cz}`;
}

export class ChunkManager {
  constructor(scene, blockRegistry, textureAtlas, renderDistance = 4, generator = null) {
    if (!scene || !blockRegistry || !textureAtlas) {
      throw new Error('ChunkManager requires a scene, a blockRegistry and a textureAtlas');
    }
    this._scene = scene;
    this._registry = blockRegistry;
    this._textureAtlas = textureAtlas;
    this._renderDistance = Math.max(1, Math.floor(renderDistance));
    this._generator = generator;
    this._material = createChunkMaterial(textureAtlas);
    this._chunks = new Map(); // `${cx},${cz}` -> { chunk, mesh }
    this._queue = [];
    this._centerKey = null;
    this._restoreChunk = null;
    this._onChunkUnload = null;
  }

  // Called with (cx, cz) right after generation; returns a saved snapshot
  // ({ blockIds, blockStates }) or null.
  setChunkRestorer(restore) {
    this._restoreChunk = restore;
  }

  // Called with the chunk before it leaves memory, so edits can be persisted.
  setOnChunkUnload(handler) {
    this._onChunkUnload = handler;
  }

  getModifiedChunks() {
    const chunks = [];
    for (const record of this._chunks.values()) {
      if (record.chunk.modified) chunks.push(record.chunk);
    }
    return chunks;
  }

  get renderDistance() {
    return this._renderDistance;
  }

  get material() {
    return this._material;
  }

  get loadedCount() {
    return this._chunks.size;
  }

  get pendingCount() {
    return this._queue.length;
  }

  getChunk(cx, cz) {
    const record = this._chunks.get(chunkKey(cx, cz));
    return record ? record.chunk : null;
  }

  get dirtyCount() {
    let count = 0;
    for (const record of this._chunks.values()) {
      if (record.chunk.meshDirty) count++;
    }
    return count;
  }

  // World-space lookup for physics and gameplay. Unloaded chunks and the space
  // beyond the build height read as air.
  getBlock(x, y, z) {
    const bx = Math.floor(x);
    const by = Math.floor(y);
    const bz = Math.floor(z);
    if (by < CHUNK_MIN_Y || by >= CHUNK_MIN_Y + CHUNK_HEIGHT) {
      return { id: this._registry.AIR, state: 0 };
    }
    const cx = Math.floor(bx / CHUNK_SIZE);
    const cz = Math.floor(bz / CHUNK_SIZE);
    const record = this._chunks.get(chunkKey(cx, cz));
    if (!record) return { id: this._registry.AIR, state: 0 };
    return record.chunk.getBlock(bx - cx * CHUNK_SIZE, by, bz - cz * CHUNK_SIZE);
  }

  isSolidAt(x, y, z) {
    return this._registry.isSolid(this.getBlock(x, y, z).id);
  }

  // Edits only apply inside loaded chunks; returns false when the target chunk
  // is not resident. The owning chunk marks itself and its neighbours dirty,
  // so the next update() re-meshes them.
  setBlock(x, y, z, id, state = 0) {
    const bx = Math.floor(x);
    const by = Math.floor(y);
    const bz = Math.floor(z);
    if (by < CHUNK_MIN_Y || by >= CHUNK_MIN_Y + CHUNK_HEIGHT) return false;
    const cx = Math.floor(bx / CHUNK_SIZE);
    const cz = Math.floor(bz / CHUNK_SIZE);
    const record = this._chunks.get(chunkKey(cx, cz));
    if (!record) return false;
    record.chunk.setBlock(bx - cx * CHUNK_SIZE, by, bz - cz * CHUNK_SIZE, id, state);
    return true;
  }

  update(playerX, playerZ) {
    const pcx = Math.floor(playerX / CHUNK_SIZE);
    const pcz = Math.floor(playerZ / CHUNK_SIZE);
    const stats = { center: { cx: pcx, cz: pcz }, loaded: 0, meshed: 0, unloaded: 0, pending: 0 };

    if (this._centerKey !== chunkKey(pcx, pcz)) {
      this._centerKey = chunkKey(pcx, pcz);
      stats.unloaded = this._unloadOutside(pcx, pcz);
      this._queue = this._missingChunks(pcx, pcz);
    }

    for (let i = 0; i < LOAD_BUDGET && this._queue.length > 0; i++) {
      const { cx, cz } = this._queue.shift();
      if (!this._chunks.has(chunkKey(cx, cz))) {
        this._loadChunk(cx, cz);
        stats.loaded++;
      }
    }

    const dirty = [];
    for (const record of this._chunks.values()) {
      if (record.chunk.meshDirty) {
        const dx = record.chunk.cx - pcx;
        const dz = record.chunk.cz - pcz;
        dirty.push({ record, distance: dx * dx + dz * dz });
      }
    }
    dirty.sort((a, b) => a.distance - b.distance);
    for (let i = 0; i < MESH_BUDGET && i < dirty.length; i++) {
      this._rebuildMesh(dirty[i].record);
      stats.meshed++;
    }

    stats.pending = this._queue.length;
    stats.dirty = Math.max(0, dirty.length - Math.min(MESH_BUDGET, dirty.length));
    return stats;
  }

  dispose() {
    for (const key of [...this._chunks.keys()]) {
      const [cx, cz] = key.split(',').map(Number);
      this._unloadChunk(cx, cz);
    }
    this._queue = [];
    this._centerKey = null;
    this._material.dispose();
  }

  // --- internals -----------------------------------------------------------

  _missingChunks(pcx, pcz) {
    const radius = this._renderDistance;
    const missing = [];
    for (let dz = -radius; dz <= radius; dz++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dz * dz > radius * radius) continue;
        const cx = pcx + dx;
        const cz = pcz + dz;
        if (this._chunks.has(chunkKey(cx, cz))) continue;
        missing.push({ cx, cz, distance: dx * dx + dz * dz });
      }
    }
    missing.sort((a, b) => a.distance - b.distance);
    return missing;
  }

  _loadChunk(cx, cz) {
    const chunk = new Chunk(cx, cz, 'overworld');
    chunk.status = 'generating';
    this._generateTerrain(chunk);
    chunk.modified = false; // generation is not a player edit

    if (this._restoreChunk) {
      const snapshot = this._restoreChunk(cx, cz);
      if (snapshot) {
        chunk.blockIds.set(snapshot.blockIds);
        chunk.blockStates.set(snapshot.blockStates);
        chunk.modified = true;
      }
    }

    chunk.status = 'generated';
    chunk.meshDirty = true;

    const record = { chunk, mesh: null };
    this._chunks.set(chunkKey(cx, cz), record);
    this._linkNeighbors(chunk);
    return record;
  }

  _generateTerrain(chunk) {
    if (this._generator) {
      this._generator.generateChunk(chunk);
      return;
    }
    this._generateFlatTerrain(chunk);
  }

  // Flat fallback used when no generator is supplied (unit tests).
  _generateFlatTerrain(chunk) {
    const { GRASS, DIRT, STONE } = this._registry;
    const dirtBottom = SEA_LEVEL - 3;
    for (let z = 0; z < CHUNK_SIZE; z++) {
      for (let x = 0; x < CHUNK_SIZE; x++) {
        chunk.setBlock(x, SEA_LEVEL, z, GRASS);
        for (let y = dirtBottom; y < SEA_LEVEL; y++) {
          chunk.setBlock(x, y, z, DIRT);
        }
        for (let y = CHUNK_MIN_Y; y < dirtBottom; y++) {
          chunk.setBlock(x, y, z, STONE);
        }
      }
    }
  }

  _linkNeighbors(chunk) {
    for (const { key, opposite, dx, dz } of NEIGHBORS) {
      const neighbor = this._chunks.get(chunkKey(chunk.cx + dx, chunk.cz + dz));
      if (!neighbor) continue;
      chunk.neighbors[key] = neighbor.chunk;
      neighbor.chunk.neighbors[opposite] = chunk;
      // The neighbor's border faces may now be culled.
      neighbor.chunk.meshDirty = true;
    }
  }

  _unloadOutside(pcx, pcz) {
    const radius = this._renderDistance;
    let unloaded = 0;
    for (const [key, record] of [...this._chunks]) {
      const { cx, cz } = record.chunk;
      const dx = cx - pcx;
      const dz = cz - pcz;
      if (dx * dx + dz * dz <= radius * radius) continue;
      this._chunks.delete(key);
      this._unloadRecord(record);
      unloaded++;
    }
    return unloaded;
  }

  _unloadChunk(cx, cz) {
    const key = chunkKey(cx, cz);
    const record = this._chunks.get(key);
    if (!record) return false;
    this._chunks.delete(key);
    this._unloadRecord(record);
    return true;
  }

  _unloadRecord(record) {
    const { chunk, mesh } = record;
    if (chunk.modified && this._onChunkUnload) this._onChunkUnload(chunk);
    if (mesh) {
      this._scene.remove(mesh);
      mesh.geometry.dispose();
      chunk.mesh = null;
    }
    for (const { key, opposite } of NEIGHBORS) {
      const neighbor = chunk.neighbors[key];
      if (!neighbor) continue;
      neighbor.neighbors[opposite] = null;
      neighbor.meshDirty = true;
    }
  }

  _rebuildMesh(record) {
    const { chunk } = record;
    if (record.mesh) {
      this._scene.remove(record.mesh);
      record.mesh.geometry.dispose();
      record.mesh = null;
      chunk.mesh = null;
    }
    const mesh = buildChunkMesh(chunk, this._registry, this._textureAtlas, this._material);
    if (mesh) {
      this._scene.add(mesh);
      record.mesh = mesh;
      chunk.mesh = mesh;
    }
    chunk.meshDirty = false;
    chunk.status = 'ready';
  }
}
