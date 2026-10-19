// src/player/Raycast.js
// Voxel DDA raycast (Amanatides & Woo) for block targeting.
// Returns the first solid block along the ray and the face normal that was
// entered, so placement can use block + normal.

import { BlockRegistry } from '../core/BlockRegistry.js';

// Block reach outside Creative mode: https://minecraft.wiki/w/Player#Interaction_range
export const BLOCK_REACH = 4.5;
export const CREATIVE_REACH = 5.0;

export function raycastVoxel(world, origin, direction, maxDistance = BLOCK_REACH, options = {}) {
  const includeLiquids = options.includeLiquids ?? false;
  const dx = direction.x;
  const dy = direction.y;
  const dz = direction.z;
  const length = Math.hypot(dx, dy, dz);
  if (length === 0 || !Number.isFinite(length)) return null;

  let x = Math.floor(origin.x);
  let y = Math.floor(origin.y);
  let z = Math.floor(origin.z);

  // Starting inside a solid block would give no meaningful face normal.
  if (BlockRegistry.isSolid(world.getBlock(x, y, z).id)) return null;

  const stepX = Math.sign(dx);
  const stepY = Math.sign(dy);
  const stepZ = Math.sign(dz);

  const tDeltaX = stepX === 0 ? Infinity : Math.abs(1 / dx);
  const tDeltaY = stepY === 0 ? Infinity : Math.abs(1 / dy);
  const tDeltaZ = stepZ === 0 ? Infinity : Math.abs(1 / dz);

  let tMaxX = stepX === 0 ? Infinity : stepX > 0 ? (x + 1 - origin.x) / dx : (origin.x - x) / -dx;
  let tMaxY = stepY === 0 ? Infinity : stepY > 0 ? (y + 1 - origin.y) / dy : (origin.y - y) / -dy;
  let tMaxZ = stepZ === 0 ? Infinity : stepZ > 0 ? (z + 1 - origin.z) / dz : (origin.z - z) / -dz;

  let normal = { x: 0, y: 0, z: 0 };
  let distance = 0;

  while (distance <= maxDistance) {
    if (tMaxX <= tMaxY && tMaxX <= tMaxZ) {
      x += stepX;
      distance = tMaxX;
      tMaxX += tDeltaX;
      normal = { x: -stepX, y: 0, z: 0 };
    } else if (tMaxY <= tMaxZ) {
      y += stepY;
      distance = tMaxY;
      tMaxY += tDeltaY;
      normal = { x: 0, y: -stepY, z: 0 };
    } else {
      z += stepZ;
      distance = tMaxZ;
      tMaxZ += tDeltaZ;
      normal = { x: 0, y: 0, z: -stepZ };
    }

    if (distance > maxDistance) break;

    const block = world.getBlock(x, y, z);
    const hittable = BlockRegistry.isSolid(block.id)
      || (includeLiquids && BlockRegistry.isLiquid(block.id));
    if (!hittable) continue;

    return { x, y, z, id: block.id, normal, distance };
  }

  return null;
}
