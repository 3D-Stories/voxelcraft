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
    this.neighbors = { px: null, nx: null, pz: null, nz: null };
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
  
  markNeighborsDirty() {
    const { px, nx, pz, nz } = this.neighbors;
    if (px) { px.meshDirty = true; px.lightDirty = true; }
    if (nx) { nx.meshDirty = true; nx.lightDirty = true; }
    if (pz) { pz.meshDirty = true; pz.lightDirty = true; }
    if (nz) { nz.meshDirty = true; nz.lightDirty = true; }
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
  
  setSkyLight(x, y, z, sky) {
    const idx = this.getIndex(x, y, z);
    this.light[idx] = (this.light[idx] & 0x0F) | (sky << 4);
  }
}
