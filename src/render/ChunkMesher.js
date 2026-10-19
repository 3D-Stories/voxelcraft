// src/render/ChunkMesher.js
// Greedy meshing for a single chunk (docs/10-architecture.md section 3).
// Positions are chunk-local with CHUNK_MIN_Y baked into Y; place the mesh at
// (cx * CHUNK_SIZE, 0, cz * CHUNK_SIZE). UVs are tile units (du, dv); the
// renderer resolves them against the texture atlas.

import { CHUNK_SIZE, CHUNK_HEIGHT, CHUNK_MIN_Y } from '../core/Chunk.js';

// [axis, ia, ib, dir, flip]: axis is the face normal axis, ia/ib are the two
// in-plane axes, dir is the normal direction, flip reverses quad winding.
const FACES = [
  [0, 2, 1, 1, true],   // +X
  [0, 2, 1, -1, false], // -X
  [1, 0, 2, 1, true],   // +Y
  [1, 0, 2, -1, false], // -Y
  [2, 0, 1, 1, false],  // +Z
  [2, 0, 1, -1, true],  // -Z
];

const EXTENT = [CHUNK_SIZE, CHUNK_HEIGHT, CHUNK_SIZE];
const ORDER_BASE = [0, 1, 2, 3];
const ORDER_FLIP = [0, 3, 2, 1];

function packedIn(chunk, x, idxY, z) {
  const idx = chunk.getIndex(x, idxY + CHUNK_MIN_Y, z);
  return (chunk.blockIds[idx] << 8) | chunk.blockStates[idx];
}

function packedAt(chunk, x, idxY, z) {
  if (idxY < 0 || idxY >= CHUNK_HEIGHT) return 0;
  let c = chunk;
  let lx = x;
  let lz = z;
  if (x < 0 || x >= CHUNK_SIZE) {
    c = x < 0 ? chunk.neighbors.nx : chunk.neighbors.px;
    lx = x + (x < 0 ? CHUNK_SIZE : -CHUNK_SIZE);
  } else if (z < 0 || z >= CHUNK_SIZE) {
    c = z < 0 ? chunk.neighbors.nz : chunk.neighbors.pz;
    lz = z + (z < 0 ? CHUNK_SIZE : -CHUNK_SIZE);
  }
  if (!c || lx < 0 || lx >= CHUNK_SIZE || lz < 0 || lz >= CHUNK_SIZE) return 0;
  const idx = c.getIndex(lx, idxY + CHUNK_MIN_Y, lz);
  return (c.blockIds[idx] << 8) | c.blockStates[idx];
}

function emitQuad(positions, normals, uvs, colors, tiles, indices, face, plane, u, v, w, h, tile) {
  const axis = FACES[face][0];
  const ia = FACES[face][1];
  const ib = FACES[face][2];
  const dir = FACES[face][3];
  const order = FACES[face][4] ? ORDER_FLIP : ORDER_BASE;
  const base = positions.length / 3;
  const p = [0, 0, 0];
  const n = [0, 0, 0];
  n[axis] = dir;
  for (let i = 0; i < 4; i++) {
    const corner = order[i];
    const du = corner === 1 || corner === 2 ? w : 0;
    const dv = corner === 2 || corner === 3 ? h : 0;
    p[axis] = plane;
    p[ia] = u + du;
    p[ib] = v + dv;
    positions.push(p[0], p[1] + CHUNK_MIN_Y, p[2]);
    normals.push(n[0], n[1], n[2]);
    uvs.push(du, dv);
    colors.push(1, 1, 1);
    tiles.push(tile);
  }

  indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
}

export function greedyMesh(chunk, blockRegistry) {
  if (!chunk || !blockRegistry) {
    throw new Error('greedyMesh requires a chunk and a blockRegistry');
  }

  const positions = [];
  const normals = [];
  const uvs = [];
  const colors = [];
  const tiles = [];
  const indices = [];

  for (let face = 0; face < FACES.length; face++) {
    const axis = FACES[face][0];
    const ia = FACES[face][1];
    const ib = FACES[face][2];
    const dir = FACES[face][3];
    const uExtent = EXTENT[ia];
    const vExtent = EXTENT[ib];
    const dExtent = EXTENT[axis];
    const mask = new Uint16Array(uExtent * vExtent);
    const pos = [0, 0, 0];

    for (let d = 0; d < dExtent; d++) {
      let any = false;
      for (let v = 0; v < vExtent; v++) {
        for (let u = 0; u < uExtent; u++) {
          pos[axis] = d;
          pos[ia] = u;
          pos[ib] = v;
          const own = packedIn(chunk, pos[0], pos[1], pos[2]);
          pos[axis] = d + dir;
          const other = packedAt(chunk, pos[0], pos[1], pos[2]);
          const cell = v * uExtent + u;
          if (own !== 0) {
            const ownId = own >>> 8;
            const otherId = other >>> 8;
            if (!blockRegistry.isOpaque(otherId) && otherId !== ownId) {
              mask[cell] = own;
              any = true;
            } else {
              mask[cell] = 0;
            }
          } else {
            mask[cell] = 0;
          }
        }
      }
      if (!any) continue;

      for (let v = 0; v < vExtent; v++) {
        for (let u = 0; u < uExtent; ) {
          const value = mask[v * uExtent + u];
          if (value === 0) {
            u++;
            continue;
          }
          const blockId = value >>> 8;
          const tile = blockRegistry.getFaceTexture(blockId, face);
          let w = 1;
          while (u + w < uExtent && mask[v * uExtent + u + w] === value) w++;
          let h = 1;
          while (v + h < vExtent) {
            let rowOk = true;
            for (let k = 0; k < w; k++) {
              if (mask[(v + h) * uExtent + u + k] !== value) {
                rowOk = false;
                break;
              }
            }
            if (!rowOk) break;
            h++;
          }
          for (let r = 0; r < h; r++) {
            for (let k = 0; k < w; k++) {
              mask[(v + r) * uExtent + u + k] = 0;
            }
          }
          const plane = d + (dir > 0 ? 1 : 0);
          emitQuad(positions, normals, uvs, colors, tiles, indices, face, plane, u, v, w, h, tile);
          u += w;
        }
      }
    }
  }

  return { positions, normals, uvs, colors, tiles, indices };
}
