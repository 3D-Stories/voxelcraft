import * as THREE from 'three';
import { BlockRegistry, FACE_TEXTURES } from './core/BlockRegistry.js';
import { TerrainGenerator } from './world/TerrainGenerator.js';
import { TextureAtlas } from './render/TextureAtlas.js';
import { ChunkManager } from './render/ChunkManager.js';
import { Player } from './player/Player.js';
import { PlayerPhysics } from './player/PlayerPhysics.js';
import { PlayerController } from './player/PlayerController.js';
import { CameraController } from './player/CameraController.js';
import { BlockInteraction } from './player/BlockInteraction.js';
import { BlockHighlight } from './render/BlockHighlight.js';
import { Sky } from './render/Sky.js';
import { Hotbar } from './player/Hotbar.js';
import { HUD } from './ui/HUD.js';
import { InventoryScreen } from './ui/InventoryScreen.js';
import { WorldStore } from './storage/WorldStore.js';

const RENDER_DISTANCE = 4;
const SIM_STEP = 0.05; // 20 ticks/s (docs/10-architecture.md section 1)
const DEFAULT_SEED = 1337;
const SPAWN_X = 8;
const SPAWN_Z = 8;

function readSeed() {
  const param = new URLSearchParams(window.location.search).get('seed');
  const parsed = Number.parseInt(param ?? '', 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function readStartTime() {
  const param = new URLSearchParams(window.location.search).get('time');
  const parsed = Number.parseInt(param ?? '', 10);
  if (!Number.isFinite(parsed)) return null;
  return ((parsed % 24000) + 24000) % 24000;
}

const loadingEl = document.getElementById('loading');
const progressFillEl = document.getElementById('progress-fill');
const loadingStatusEl = document.getElementById('loading-status');
const loadingErrorEl = document.getElementById('loading-error');
const appEl = document.getElementById('app');
const hintEl = document.getElementById('hint');

function setProgress(percent, status) {
  if (progressFillEl) progressFillEl.style.width = `${percent}%`;
  if (loadingStatusEl) loadingStatusEl.textContent = status;
}

function showError(message) {
  if (loadingErrorEl) {
    loadingErrorEl.textContent = message;
    loadingErrorEl.style.display = 'block';
  }
  if (loadingStatusEl) loadingStatusEl.textContent = 'Failed to start';
}

async function main() {
  console.log(`VoxelCraft v${__VERSION__} built at ${__BUILD_TIME__}`);
  setProgress(10, 'Creating world…');

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);

  setProgress(15, 'Loading save…');
  const store = new WorldStore();
  let saved = null;
  try {
    await store.open();
    saved = await store.loadWorld();
  } catch (error) {
    console.warn('Could not read the saved world', error);
  }

  const urlSeed = readSeed();
  const seed = urlSeed ?? saved?.seed ?? DEFAULT_SEED;
  const restoring = Boolean(saved && saved.seed === seed);
  // A seed requested via ?seed= that differs from the saved world is a
  // throwaway world: play it, but never overwrite the default save with it.
  const persistent = urlSeed === null || !saved || saved.seed === urlSeed;
  let savedChunks = new Map();
  if (restoring) {
    try {
      savedChunks = await store.loadChunks(seed);
    } catch (error) {
      console.warn('Could not read saved chunks', error);
    }
  }

  setProgress(30, 'Loading textures…');
  const textureNames = [
    ...new Set(FACE_TEXTURES.filter(Boolean).flatMap((spec) => Object.values(spec))),
  ];
  const textureAtlas = new TextureAtlas(textureNames);
  await textureAtlas.load();

  setProgress(50, 'Building terrain…');
  const terrain = new TerrainGenerator(seed, { spawnX: SPAWN_X, spawnZ: SPAWN_Z });
  const world = new ChunkManager(
    scene, BlockRegistry, textureAtlas, RENDER_DISTANCE, terrain,
  );
  if (restoring) {
    world.setChunkRestorer((cx, cz) => savedChunks.get(`${cx},${cz}`) ?? null);
  }
  if (persistent) {
    world.setOnChunkUnload((chunk) => {
      store.saveChunk(chunk, seed).catch((error) => console.warn('Chunk save failed', error));
    });
  }

  // Spawn on the surface of the world-spawn column.
  const spawnY = terrain.getHeight(SPAWN_X, SPAWN_Z) + 1;
  const player = new Player(SPAWN_X + 0.5, spawnY, SPAWN_Z + 0.5);
  player.onGround = true;

  if (restoring && saved.player) {
    const { x, y, z, yaw = 0, pitch = 0 } = saved.player;
    const surface = terrain.getHeight(Math.floor(x), Math.floor(z)) + 1;
    if ([x, y, z].every(Number.isFinite) && y >= surface - 0.01) {
      player.position.set(x, y, z);
      player.yaw = yaw;
      player.pitch = pitch;
      player.onGround = false;
    }
  }

  const physics = new PlayerPhysics(player, world);

  const urlTime = readStartTime();
  const savedTime = restoring && Number.isFinite(saved.skyTime) ? saved.skyTime : null;
  const sky = new Sky(scene, { seed, dayTime: urlTime ?? savedTime ?? 1000 });

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  appEl.appendChild(renderer.domElement);

  const controller = new PlayerController(player, renderer.domElement);
  const cameraController = new CameraController(camera, player);
  const highlight = new BlockHighlight(scene);
  const interaction = new BlockInteraction(player, world, renderer.domElement, { highlight });

  const hotbar = new Hotbar([
    BlockRegistry.GRASS,
    BlockRegistry.DIRT,
    BlockRegistry.STONE,
    BlockRegistry.SAND,
    BlockRegistry.OAK_LOG,
    BlockRegistry.OAK_LEAVES,
  ]);
  interaction.selectedBlock = hotbar.selectedBlock;
  hotbar.subscribe((bar) => {
    interaction.selectedBlock = bar.selectedBlock;
  });

  const hud = new HUD(hotbar, appEl);
  const inventory = new InventoryScreen(hotbar, appEl, {
    onToggle: (open) => {
      controller.enabled = !open;
      if (open) {
        player.velocity.x = 0;
        player.velocity.z = 0;
      }
    },
  });

  document.addEventListener('pointerlockchange', () => {
    if (hintEl) hintEl.style.display = document.pointerLockElement ? 'none' : 'block';
  });

  const saveNow = async () => {
    if (!persistent) return;
    const chunks = world.getModifiedChunks();
    await Promise.all(chunks.map((chunk) => store.saveChunk(chunk, seed)));
    await store.saveWorld({
      version: 1,
      seed,
      skyTime: sky.dayTime,
      player: {
        x: player.position.x,
        y: player.position.y,
        z: player.position.z,
        yaw: player.yaw,
        pitch: player.pitch,
      },
    });
  };

  const safeSave = () => {
    saveNow().catch((error) => console.warn('Save failed', error));
  };
  const autosave = setInterval(safeSave, 30000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') safeSave();
  });
  safeSave(); // create the initial save so chunk snapshots always have metadata

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  setProgress(60, 'Starting renderer…');
  window.voxelcraft = {
    scene, camera, renderer, world, terrain, seed, sky, player, physics, controller,
    interaction, highlight, hotbar, hud, inventory, store, saveNow, autosave,
  };

  let revealed = false;
  let accumulator = 0;
  let lastTime = performance.now();

  renderer.setAnimationLoop((time) => {
    const now = typeof time === 'number' ? time : performance.now();
    accumulator += Math.min((now - lastTime) / 1000, 0.25);
    lastTime = now;

    world.update(player.position.x, player.position.z);

    while (accumulator >= SIM_STEP) {
      player.beginTick();
      controller.update();
      physics.update(SIM_STEP);
      interaction.update(SIM_STEP);
      sky.update(SIM_STEP, camera);
      accumulator -= SIM_STEP;
    }

    cameraController.update(accumulator / SIM_STEP);
    renderer.render(scene, camera);

    if (!revealed) {
      const remaining = world.pendingCount;
      if (remaining === 0 && world.dirtyCount === 0) {
        revealed = true;
        setProgress(100, 'Ready');
        if (loadingEl) loadingEl.style.display = 'none';
        if (appEl) appEl.style.display = 'block';
      } else {
        const total = world.loadedCount + remaining;
        const percent = total > 0 ? 60 + Math.round((world.loadedCount / total) * 30) : 60;
        setProgress(percent, `Loading chunks… (${remaining} left)`);
      }
    }
  });
}

main().catch((error) => {
  console.error(error);
  showError(error.message);
});
