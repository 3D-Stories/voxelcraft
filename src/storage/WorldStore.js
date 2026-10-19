// src/storage/WorldStore.js
// IndexedDB persistence (docs/10-architecture.md, docs/11-features.md 7).
// Database: voxelcraft-worlds; stores: "world" (metadata) and "chunks"
// (compressed block snapshots for chunks the player edited).
// Chunk snapshots are deflated with pako before they reach IndexedDB.

import { openDB } from 'idb';
import { deflate, inflate } from 'pako';
import { CHUNK_SIZE, CHUNK_HEIGHT } from '../core/Chunk.js';

export const DB_NAME = 'voxelcraft-worlds';
const DB_VERSION = 1;
const WORLD_KEY = 'default';
const CHUNK_LENGTH = CHUNK_SIZE * CHUNK_SIZE * CHUNK_HEIGHT;

export function packChunk(chunk) {
  const raw = new Uint8Array(CHUNK_LENGTH * 2);
  raw.set(chunk.blockIds, 0);
  raw.set(chunk.blockStates, CHUNK_LENGTH);
  return deflate(raw);
}

export function unpackChunk(data) {
  const raw = inflate(data);
  if (raw.length !== CHUNK_LENGTH * 2) {
    throw new Error(`Corrupt chunk snapshot: ${raw.length} bytes`);
  }
  return {
    blockIds: raw.slice(0, CHUNK_LENGTH),
    blockStates: raw.slice(CHUNK_LENGTH),
  };
}

export class WorldStore {
  constructor(dbName = DB_NAME) {
    this.dbName = dbName;
    this._db = null;
  }

  async open() {
    if (this._db) return this._db;
    this._db = await openDB(this.dbName, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('world')) db.createObjectStore('world');
        if (!db.objectStoreNames.contains('chunks')) db.createObjectStore('chunks');
      },
    });
    return this._db;
  }

  async loadWorld() {
    const db = await this.open();
    return (await db.get('world', WORLD_KEY)) ?? null;
  }

  async saveWorld(meta) {
    const db = await this.open();
    await db.put('world', { ...meta, savedAt: Date.now() }, WORLD_KEY);
  }

  // Snapshots are stored per seed so switching worlds cannot mix in edits
  // from another seed at the same chunk coordinates.
  async loadChunks(seed) {
    const db = await this.open();
    const records = await db.getAll('chunks');
    const chunks = new Map();
    for (const record of records) {
      if (record.seed !== seed) continue;
      try {
        chunks.set(`${record.cx},${record.cz}`, unpackChunk(record.data));
      } catch (error) {
        console.warn(`Skipping corrupt chunk ${record.cx},${record.cz}`, error);
      }
    }
    return chunks;
  }

  async saveChunk(chunk, seed) {
    const db = await this.open();
    const key = `${seed}:${chunk.cx},${chunk.cz}`;
    await db.put('chunks', { seed, cx: chunk.cx, cz: chunk.cz, data: packChunk(chunk) }, key);
  }

  async clear() {
    const db = await this.open();
    await db.clear('world');
    await db.clear('chunks');
  }

  async close() {
    if (this._db) {
      this._db.close();
      this._db = null;
    }
  }
}
