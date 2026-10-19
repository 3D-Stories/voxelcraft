// src/render/ChunkMesh.js
// Turns one chunk into a THREE.Mesh (docs/10-architecture.md section 3).
// Greedy quads span many blocks, so UVs are kept in block units; a small
// material patch repeats the atlas tile instead of stretching it. Chunk-local
// positions mean the mesh is simply placed at (cx * CHUNK_SIZE, 0, cz * CHUNK_SIZE).

import * as THREE from 'three';
import { CHUNK_SIZE } from '../core/Chunk.js';
import { greedyMesh } from './ChunkMesher.js';

function atlasGrid(textureAtlas) {
  const texture = textureAtlas.texture;
  const tileSize = textureAtlas.tileSize;
  return {
    cols: Math.max(1, Math.round(texture.image.width / tileSize)),
    rows: Math.max(1, Math.round(texture.image.height / tileSize)),
  };
}

export function createChunkMaterial(textureAtlas) {
  const { cols, rows } = atlasGrid(textureAtlas);
  const material = new THREE.MeshLambertMaterial({
    map: textureAtlas.texture,
    vertexColors: true,
  });
  material.userData.atlasGrid = { cols, rows };

  // MeshLambertMaterial has no per-tile UV repeat; inject it while keeping the
  // standard lighting pipeline. vMapUv is in block units, fract() wraps it
  // inside one tile and uTileSpan scales/offsets into the atlas cell.
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTileSpan = { value: new THREE.Vector2(1 / cols, 1 / rows) };
    shader.vertexShader =
      'attribute vec2 aTileOffset;\nvarying vec2 vTileOffset;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <uv_vertex>',
      '#include <uv_vertex>\n  vTileOffset = aTileOffset;',
    );
    shader.fragmentShader =
      'varying vec2 vTileOffset;\nuniform vec2 uTileSpan;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      [
        '#ifdef USE_MAP',
        '  vec2 tileUv = vTileOffset + fract( vMapUv ) * uTileSpan;',
        '  vec4 sampledDiffuseColor = texture2D( map, tileUv );',
        '  diffuseColor *= sampledDiffuseColor;',
        '#endif',
      ].join('\n'),
    );
  };
  material.customProgramCacheKey = () => 'voxelcraft-chunk-atlas';
  return material;
}

export function buildChunkMesh(chunk, blockRegistry, textureAtlas, material = null) {
  if (!chunk || !blockRegistry || !textureAtlas) {
    throw new Error('buildChunkMesh requires a chunk, a blockRegistry and a textureAtlas');
  }

  const data = greedyMesh(chunk, blockRegistry);
  if (data.indices.length === 0) return null;

  const { cols, rows } = atlasGrid(textureAtlas);
  const tileOffsets = new Float32Array(data.uvs.length);
  for (let i = 0; i < data.tiles.length; i++) {
    const tile = textureAtlas.getTile(data.tiles[i]);
    const offset = i * 2;
    tileOffsets[offset] = tile.x / cols;
    tileOffsets[offset + 1] = tile.y / rows;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(data.positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(data.normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(data.uvs, 2));
  geometry.setAttribute('aTileOffset', new THREE.BufferAttribute(tileOffsets, 2));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(data.colors, 3));
  geometry.setIndex(data.indices);
  geometry.computeBoundingSphere();

  const mesh = new THREE.Mesh(geometry, material ?? createChunkMaterial(textureAtlas));
  mesh.position.set(chunk.cx * CHUNK_SIZE, 0, chunk.cz * CHUNK_SIZE);
  mesh.name = `chunk_${chunk.cx}_${chunk.cz}`;
  mesh.userData.chunk = chunk;
  return mesh;
}
