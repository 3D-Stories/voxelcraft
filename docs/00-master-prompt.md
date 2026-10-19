# MASTER PROMPT — VoxelCraft: A Vanilla-Faithful Minecraft Clone for the Web

> **This is the prompt you feed to an AI coding agent (Claude, GPT-5, Cursor, etc.) to build the entire project.**
> Copy everything from this file (including this header) and paste it as the first user message.

---

## 0. Mission Statement

Build **VoxelCraft**, a browser-based voxel sandbox game that is as faithful as technically possible to **Minecraft Java Edition 1.21.x**, deployable on Vercel as a static site. The game must be playable immediately in any modern browser (Chrome, Firefox, Safari, Edge) without plugins, downloads, or server-side runtime — all logic runs client-side in WebAssembly-free vanilla JavaScript with Three.js for rendering.

The user has provided **9 reference research files** (in the same folder as this prompt). Read every one of them before writing any code. They contain exhaustive, verified data on every block, item, mob, biome, dimension, mechanic, recipe, structure, and setting in vanilla Minecraft. Treat them as the single source of truth — do not improvise gameplay values.

## 0.5. Source Control & Deployment Workflow (NON-NEGOTIABLE)

You have **direct access to GitHub and the Vercel MCP**. Do NOT ask the user to run CLI commands, install tools, configure the Vercel dashboard, or paste tokens. You handle the entire source-control + deploy loop yourself.

### 0.5.1 GitHub Repository (REQUIRED FIRST STEP)

Before writing any code, you MUST:

1. **Create a new GitHub repository** named `voxelcraft` (public, unless the user says otherwise). Use the GitHub MCP tools (or `gh` CLI if available) to create it under the user's account.
2. **Initialize the repo** with a `main` branch, a `.gitignore` (see `12-deployment.md` §2.5), an empty `README.md`, and a `LICENSE` (MIT).
3. **Commit early and often** — every feature milestone gets its own commit with a clear message (e.g., `feat(chunk-system): greedy meshing + render distance`, `feat(player): WASD + jump + collision`, `feat(worldgen): perlin noise terrain + 3 biomes`).
4. **Push every commit to GitHub** immediately after it builds locally. Do not accumulate local-only work — push at least once per feature, ideally after every meaningful change.
5. **Branch strategy**: work on `main` for now (single-dev project). When the project grows, switch to feature branches (`feat/<name>`) + PRs. For now, push to `main`.
6. **Tag releases**: at the end of each phase (see §11), tag a release (`v0.1.0-phase1`, `v0.2.0-phase2`, etc.) so there's a clear rollback point.

The first thing the user should see in your very first reply is the GitHub repo URL.

### 0.5.2 Vercel Deployment via MCP

You have **direct Vercel MCP access**. Do NOT ask the user to run `vercel` CLI commands or use the Vercel dashboard. Use the MCP tools to:

1. **Link the GitHub repo to Vercel** as a new project (framework = Vite, build command = `npm run build`, output dir = `dist`). This sets up automatic deploys on every push to `main`.
2. **Deploy each phase as a preview deployment** automatically (Vercel does this on every push if linked — confirm the preview URL works).
3. **After the user confirms a phase works on the preview URL**, promote that deployment to production via MCP.
4. **Read build/deploy logs via MCP** — if a build fails, read the logs, fix the error yourself, push the fix to GitHub, and re-deploy. Do NOT paste build errors back to the user expecting them to debug.
5. **Set environment variables via MCP** if needed (none required for MVP, but reserve `VITE_SERVER_URL` for future multiplayer).
6. **Attach a custom domain** if the user provides one — otherwise use the default `voxelcraft.vercel.app` (or whatever Vercel assigns).
7. **Roll back** to a previous deployment if a production push breaks something — Vercel MCP supports `vercel promote <previous-deployment-url>`.

### 0.5.3 Standard Build-Test-Deploy Loop

For every feature milestone:

```
1. Write code locally.
2. npm run build  → must succeed with 0 errors.
3. npm run preview → smoke-test in headless browser if possible.
4. git add . && git commit -m "feat(scope): description"
5. git push origin main
6. Vercel auto-deploys preview (push to main = production actually, but you can use a feature branch for previews if you prefer).
7. Read deploy logs via MCP. If failed → goto step 1.
8. Share preview URL with user. Wait for confirmation.
9. On confirmation, promote to production via MCP (or just confirm main is production).
10. Tag release: git tag v0.X.0-phaseY && git push --tags.
```

**Never** accumulate uncommitted work. **Never** deploy broken code. **Never** make the user do your deployment work.

### 0.5.4 Repo Structure on GitHub

The GitHub repo `voxelcraft` should mirror the local project structure from §3 below. The 12 reference + spec files from THIS prompt kit should live in a `docs/` folder in the repo (so they're versioned alongside the code, and future contributors can read them):

```
voxelcraft/
├── README.md
├── LICENSE
├── .gitignore
├── package.json
├── vite.config.js
├── vercel.json
├── index.html
├── docs/                          ← copy all 12 prompt-kit files here
│   ├── 00-master-prompt.md
│   ├── 01-research-blocks.md
│   ├── 02-research-items.md
│   ├── ... (all research files)
│   ├── 10-architecture.md
│   ├── 11-features.md
│   └── 12-deployment.md
├── public/
│   ├── assets/
│   │   ├── textures/
│   │   ├── sounds/
│   │   └── shaders/
│   └── data/
└── src/
    └── (the actual game code, per §3 below)
```

Commit the `docs/` folder in your very first commit so the spec is always available in the repo.

### 0.5.5 Verify Gameplay Facts Against the Official Minecraft Wiki

The 9 research files in this kit (`01-research-blocks.md` through `09-research-settings.md`) are comprehensive but may have small inaccuracies or miss edge cases. When in doubt about a specific gameplay fact, **search the official Minecraft Wiki to verify**:

- **Primary source**: https://minecraft.wiki/ (the new community wiki, post-Fandom migration)
- **Backup source**: https://minecraft.fandom.com/wiki/ (legacy, still has some pages not yet migrated)

Use the wiki-search / web-fetch tools available in your environment to look up specific pages. Examples of when to consult the wiki:

- **Block hardness values** that don't match what's in `01-research-blocks.md` — verify the exact float value.
- **Mob drop rates** — e.g., "what's the exact chance of a wither skeleton skull drop with Looting III?" → look up the page.
- **Recipe details** — e.g., "does the smithing table netherite upgrade preserve enchantments?" → confirm on the wiki.
- **Redstone quirks** — e.g., "what blocks can a piston NOT push?" → check the "Piston" page's "Things pistons cannot push" section.
- **Mob AI specifics** — e.g., "at what distance does a zombie detect a player?" → check the "Zombie" page.
- **Enchantment conflicts** — e.g., "can Sharpness and Smite coexist on the same sword?" → check the "Enchanting" page.
- **Biome parameters** — e.g., "what's the exact temperature threshold for snow vs rain?" → check the "Biome" page.

**Rule of thumb**: if you're about to hardcode a number into the game (HP, damage, drop chance, light level, speed, durability, fuel ticks, etc.) and you're not 100% sure of the value, **look it up on the wiki first**. The 5 seconds spent verifying is worth avoiding a gameplay bug that ships to production.

When you look something up:
1. Cite the wiki page URL in a code comment next to the value (e.g., `// src: https://minecraft.wiki/wiki/Zombie#Drops`).
2. If the wiki disagrees with the research file, **trust the wiki** (it's more up-to-date) and note the discrepancy in your reply to the user.
3. If both the wiki and the research file are ambiguous (e.g., "Java Edition vs Bedrock Edition differ"), default to **Java Edition** values (since this is a Java Edition clone).

**Do NOT scrape or redistribute wiki content** — only use it to look up specific values for implementation. The wiki is licensed under CC BY-NC-SA 3.0; facts themselves are not copyrightable but text is.

## 1. Reference Files (READ ALL FIRST)

Before writing a single line of code, you MUST read these files in full:

| File | Contents |
|---|---|
| `01-research-blocks.md` | All ~800 blocks with hardness, light, drops, properties, block states, model format, special behaviors |
| `02-research-items.md` | All ~1,580 items: tools, weapons, armor, food, materials, redstone, potions, enchantments, effects, fuel values |
| `03-research-mobs.md` | All mobs with HP, damage, AI behavior, goals, pathfinding, breeding, drops, sounds, special mechanics |
| `04-research-biomes.md` | All ~60 biomes, multi-noise generation algorithm, structure placement, mob spawn rules, seed system pseudocode |
| `05-research-dimensions.md` | Overworld, Nether, End: dimension properties, portal mechanics, Ender Dragon fight phases |
| `06-research-mechanics.md` | Player movement, hunger, combat, redstone, enchanting, brewing, crafting, mining, light, weather, time, tick system, gamerules, commands, status effects |
| `07-research-recipes.md` | All ~880 crafting/smelting/blasting/smoking/campfire/stonecutter/smithing recipes with JSON format |
| `08-research-structures.md` | All structures: villages, fortresses, end cities, ancient cities, trial chambers, loot tables, jigsaw system, archaeology |
| `09-research-settings.md` | Every vanilla options menu setting (video, controls, audio, language, chat, accessibility, skin, world creation, gamerules) |
| `10-architecture.md` | Recommended project architecture, file structure, modules, performance strategy (READ THIS) |
| `11-features.md` | Detailed feature specifications with acceptance criteria (READ THIS) |
| `12-deployment.md` | Vercel deployment guide with vercel.json config (READ THIS) |

Do not summarize or skim. Each file is dense and contains values you will need to look up while implementing (e.g., "how much hunger does cooked beef restore?" → look it up in `02-research-items.md`).

## 2. Tech Stack (NON-NEGOTIABLE)

- **Engine**: Three.js `^0.160` (latest stable, ESM via CDN or bundler)
- **Language**: Vanilla JavaScript (ES2022+, modules). **No TypeScript, no React, no Vue, no Svelte.** Pure JS modules.
- **Bundler**: **Vite 5** (dev server + production build). Output is a static SPA.
- **Physics**: Custom AABB collision (do NOT use cannon.js / rapier — voxel collision is simpler and faster custom-built)
- **Audio**: Web Audio API directly (no Howler.js — keep dependencies minimal)
- **Storage**: IndexedDB (via `idb` library, ~3KB gzipped) for world saves; `localStorage` for game settings
- **Noise**: `simplex-noise` npm package (or custom implementation — see `04-research-biomes.md` for the exact algorithm)
- **Pathfinding**: Custom A* over voxel grid (see mob AI section in `03-research-mobs.md`)
- **No backend**: 100% client-side. No Vercel Serverless Functions for game logic. Static hosting only.

**Forbidden dependencies**: React, Vue, Svelte, Angular, jQuery, lodash (write utility functions inline), cannon.js, ammo.js, physx, Babylon.js, PlayCanvas.

**Why these constraints**: Three.js + Vanilla JS produces the smallest bundle (~500KB-1MB gzipped with textures), the fastest cold-start, and the simplest Vercel deployment (static export, no edge functions needed). Framework overhead would cost 100-300ms on first paint — unacceptable for a game.

## 3. Project Structure

Use this exact directory layout. Create empty placeholder files where indicated.

```
voxelcraft/
├── index.html                      # Entry point — loads main.js as module
├── package.json                    # Vite + Three.js + idb + simplex-noise
├── vite.config.js                  # Vite config (see 12-deployment.md)
├── vercel.json                     # Vercel deployment config (see 12-deployment.md)
├── .gitignore                      # node_modules, dist, .DS_Store
├── README.md                       # Project overview, run instructions
│
├── public/
│   ├── assets/
│   │   ├── textures/               # All 16x16 PNG textures (generated — see §10)
│   │   │   ├── blocks/             # stone.png, dirt.png, etc.
│   │   │   ├── items/              # items as 2D sprites for inventory
│   │   │   ├── gui/                # inventory bg, hotbar, hearts, hunger bar
│   │   │   ├── entities/           # mob textures
│   │   │   └── environment/        # sun.png, moon.png, sky colors
│   │   ├── sounds/                 # All .ogg sound files
│   │   │   ├── blocks/             # dig, place, step sounds
│   │   │   ├── mobs/               # per-mob ambient/hurt/death
│   │   │   ├── music/              # C418-style ambient tracks (royalty-free)
│   │   │   └── ambient/            # weather, portal, dim-specific ambience
│   │   └── shaders/                # Custom GLSL (water, foliage, sky)
│   │
│   └── data/                       # Game data (JSON, loaded at runtime)
│       ├── blocks.json             # Block registry (id, name, properties)
│       ├── items.json              # Item registry
│       ├── recipes/                # Crafting recipes (one JSON per category)
│       │   ├── crafting_shaped.json
│       │   ├── crafting_shapeless.json
│       │   ├── smelting.json
│       │   ├── blasting.json
│       │   ├── smoking.json
│       │   ├── stonecutting.json
│       │   └── smithing.json
│       ├── loot_tables/            # Per-chest loot tables
│       ├── mobs.json               # Mob definitions (hp, dmg, ai, drops)
│       ├── biomes.json             # Biome definitions (noise params, mobs, structures)
│       ├── dimensions.json         # Dimension type properties
│       ├── structures/             # Structure NBT-like JSON templates
│       ├── advancements.json       # ~110 advancements
│       ├── tags/                   # Block/item/fluid tags
│       └── lang/                   # en_us.json, etc.
│
└── src/
    ├── main.js                     # Entry point — bootstraps Game
    │
    ├── core/                       # Engine core
    │   ├── Game.js                 # Main game loop, state machine
    │   ├── World.js                # World manager (chunks, dimensions)
    │   ├── Chunk.js                # 16x16x384 chunk data structure
    │   ├── ChunkManager.js         # Load/unload chunks around player
    │   ├── BlockRegistry.js        # Block ID ↔ state lookup
    │   ├── ItemRegistry.js         # Item ID lookup
    │   ├── RecipeRegistry.js       # Recipe matching
    │   ├── EventBus.js             # Pub/sub for decoupled systems
    │   ├── Scheduler.js            # Tick scheduler (20 TPS game tick)
    │   ├── Random.js               # Seeded PRNG (Java LCG compatible)
    │   └── Storage.js              # IndexedDB wrapper for world saves
    │
    ├── worldgen/                   # World generation pipeline
    │   ├── WorldGenerator.js       # Orchestrates the 10-stage chunk pipeline
    │   ├── NoiseGenerator.js       # Perlin/Simplex + Multi-Noise climate
    │   ├── BiomeProvider.js        # 3D biome lookup at (x, y, z)
    │   ├── TerrainCarver.js        # Cave/ravine carvers
    │   ├── SurfaceDecorator.js     # Top block / filler placement
    │   ├── OreDecorator.js         # Ore vein placement
    │   ├── StructureManager.js     # Structure placement + jigsaw
    │   ├── FeaturePlacer.js        # Trees, flowers, grass, cactus
    │   ├── NetherGenerator.js      # Nether terrain + biomes
    │   ├── EndGenerator.js         # End islands + dragon arena
    │   └── Seed.js                 # Seed parsing + dimension seed derivation
    │
    ├── render/                     # Three.js rendering
    │   ├── Renderer.js             # WebGLRenderer setup, fog, postprocess
    │   ├── Camera.js               # First/third person camera, F5 toggle
    │   ├── Scene.js                # Scene graph per dimension
    │   ├── ChunkMesh.js            # Greedy meshed chunk geometry
    │   ├── ChunkMesher.js          # Greedy meshing algorithm
    │   ├── BlockModel.js           # Block model JSON → mesh faces
    │   ├── TextureAtlas.js         # Texture atlas builder (16x16 tiles)
    │   ├── Sky.js                  # Sun, moon, stars, sky color, fog
    │   ├── Clouds.js               # Volumetric 2D-cloud layer
    │   ├── WeatherRenderer.js      # Rain/snow particles
    │   ├── EntityRenderer.js       # Mob model rendering (head, body, limbs)
    │   ├── ParticleSystem.js       # Block break, hit, ambient particles
    │   ├── Lighting.js             # Day/night sun + block light (vertex-baked)
    │   ├── ShaderMaterial.js       # Water shader, foliage waving, sky shader
    │   └── FrustumCuller.js        # Chunk frustum + occlusion culling
    │
    ├── player/                     # Player controller
    │   ├── Player.js               # Player entity: position, velocity, AABB
    │   ├── PlayerController.js     # WASD, jump, sneak, sprint, fly, swim
    │   ├── PlayerPhysics.js        # AABB collision against blocks, gravity
    │   ├── CameraController.js     # First-person + 3rd-person, F5 cycle
    │   ├── Inventory.js            # 36 slots + 9 hotbar + 4 armor + 1 offhand
    │   ├── InventoryRenderer.js    # Inventory UI, hotbar, hearts, hunger
    │   ├── CraftingUI.js           # 2x2 + 3x3 crafting grid
    │   ├── SurvivalManager.js     # Health, hunger, air, XP, effects
    │   ├── CreativeManager.js      # Creative inventory, instant mine, fly
    │   ├── GamemodeManager.js      # Switch between Survival/Creative/Adventure/Spectator
    │   └── EffectManager.js        # Status effect application + ticking
    │
    ├── entities/                   # Mob & entity system
    │   ├── Entity.js               # Base entity class
    │   ├── LivingEntity.js         # Has health, can take damage
    │   ├── Mob.js                  # Base mob class with AI hooks
    │   ├── MobAI.js                # Goals system + Brain system
    │   ├── PathFinder.js           # A* voxel pathfinding
    │   ├── MobSpawner.js           # Natural mob spawning per chunk
    │   ├── mobs/                   # One file per mob
    │   │   ├── Zombie.js
    │   │   ├── Skeleton.js
    │   │   ├── Creeper.js
    │   │   ├── Spider.js
    │   │   ├── Enderman.js
    │   │   ├── Villager.js
    │   │   ├── Piglin.js
    │   │   ├── Blaze.js
    │   │   ├── Ghast.js
    │   │   ├── Wither.js
    │   │   ├── EnderDragon.js     # Multi-phase boss AI
    │   │   ├── Cow.js, Pig.js, Sheep.js, Chicken.js, ...  (all 60+ mobs)
    │   │   └── ...
    │   └── projectiles/            # Arrows, fireballs, wind charges, etc.
    │       ├── Arrow.js
    │       ├── Fireball.js
    │       └── WindCharge.js
    │
    ├── blocks/                     # Block behavior scripts
    │   ├── BlockBehavior.js        # Base class
    │   ├── FallingBlock.js         # Sand, gravel, anvil, concrete powder
    │   ├── LiquidBlock.js          # Water, lava flow
    │   ├── RedstoneSystem.js       # Power propagation, tick scheduler
    │   ├── PistonBlock.js          # Push/pull mechanics
    │   ├── DoorBlock.js            # Door, trapdoor, fence gate
    │   ├── CropBlock.js            # Wheat, carrots, potatoes, beetroots growth
    │   ├── SaplingBlock.js         # Tree growth
    │   ├── FurnaceBlock.js         # Smelting tick
    │   ├── BrewingStandBlock.js    # Brewing tick
    │   ├── NoteBlock.js            # Plays sounds
    │   ├── ChestBlock.js           # Inventory storage
    │   ├── SignBlock.js            # Text rendering
    │   ├── BedBlock.js             # Sleep + set spawn + explosion in nether
    │   ├── PortalBlock.js          # Nether portal, end portal, end gateway
    │   ├── TntBlock.js             # Ignition + explosion
    │   ├── AnvilBlock.js           # Fall damage + anvil UI
    │   └── ...                     # One file per behavior family
    │
    ├── ui/                         # DOM/CSS user interface
    │   ├── UIManager.js            # Coordinates all UI screens
    │   ├── MainMenu.js             # Title screen with splash text
    │   ├── WorldSelect.js          # Create world / load world / delete world
    │   ├── WorldCreate.js          # World creation form (see §8)
    │   ├── PauseMenu.js            # Esc menu
    │   ├── OptionsScreen.js        # Options menu (see §9)
    │   ├── Chat.js                 # Chat & command input (T key)
    │   ├── DebugOverlay.js         # F3 screen with FPS, coords, biome
    │   ├── HUD.js                  # Hotbar, hearts, hunger, XP bar, effects
    │   ├── Toast.js                # Advancement unlocks, recipe unlocks
    │   ├── DeathScreen.js          # "You died" + respawn button
    │   ├── InventoryScreen.js      # Player inventory
    │   ├── ContainerScreen.js      # Chest, furnace, anvil, etc.
    │   ├── CreativeInventory.js    # Tabbed creative inventory
    │   ├── CraftingTableScreen.js  # 3x3 crafting
    │   ├── EnchantingScreen.js     # Enchanting table UI
    │   ├── AnvilScreen.js          # Anvil UI
    │   ├── BrewingScreen.js        # Brewing stand UI
    │   ├── VillagerTradeScreen.js  # Trade UI
    │   ├── HorseInventory.js       # Horse + llama + chest
    │   ├── BookEditScreen.js       # Book & quill
    │   ├── SignEditScreen.js       # Sign editing
    │   └── styles.css              # Pixelated UI styles
    │
    ├── input/                      # Input handling
    │   ├── InputManager.js         # Keyboard, mouse, pointer lock
    │   ├── KeyBindings.js          # Default + remappable keys
    │   └── TouchControls.js        # Mobile touch (optional, basic)
    │
    ├── audio/                      # Web Audio API
    │   ├── AudioManager.js         # Master mixer, 10 channel categories
    │   ├── MusicPlayer.js          # Ambient music with crossfade
    │   ├── SoundRegistry.js        # Sound event → file mapping
    │   └── Listener.js             # Positional audio for mob sounds
    │
    ├── network/                    # (Stub — single-player only for now)
    │   └── LocalServer.js          # In-process "server" abstraction
    │
    ├── commands/                   # Slash commands
    │   ├── CommandManager.js       # Parses /commands
    │   ├── GamemodeCommand.js
    │   ├── TimeCommand.js
    │   ├── WeatherCommand.js
    │   ├── GiveCommand.js
    │   ├── SummonCommand.js
    │   ├── TeleportCommand.js
    │   ├── EffectCommand.js
    │   ├── EnchantCommand.js
    │   ├── GameruleCommand.js
    │   └── ...                     # ~20 commands total
    │
    └── utils/                      # Pure utility functions
        ├── MathUtils.js            # clamp, lerp, round, etc.
        ├── Vector3.js              # Thin wrapper (or use THREE.Vector3)
        ├── Direction.js            # Enum: DOWN, UP, NORTH, SOUTH, WEST, EAST
        ├── NBT.js                  # NBT tag reader/writer (for saves)
        ├── JSONLoader.js           # Async JSON fetcher
        ├── EventBus.js
        └── Logger.js
```

## 4. Core Architecture Decisions

### 4.1 Game Loop (60 FPS render, 20 TPS simulation)

Run TWO loops:
- **Render loop**: `requestAnimationFrame`, decoupled from sim. Runs at display refresh rate (60-144Hz). Interpolates entity positions for smoothness.
- **Sim loop**: Fixed 50ms tick (20 TPS) using a time accumulator. Handles: player physics, mob AI, redstone ticks, block updates, mob spawning, crop growth, weather.

```javascript
// Pseudocode for main loop
let lastTime = performance.now();
let simAccumulator = 0;
const SIM_TICK_MS = 50;

function frame(now) {
  const delta = now - lastTime;
  lastTime = now;
  simAccumulator += delta;
  
  while (simAccumulator >= SIM_TICK_MS) {
    simUpdate(SIM_TICK_MS / 1000); // 0.05 sec
    simAccumulator -= SIM_TICK_MS;
  }
  
  const alpha = simAccumulator / SIM_TICK_MS; // interpolation factor
  render(alpha);
  requestAnimationFrame(frame);
}
```

### 4.2 Chunk System

- **Chunk size**: 16×16 columns, height 384 blocks (Y=-64 to 320) for Overworld. Nether: 16×256 (Y=0 to 255, but only Y=0-127 generated). End: 16×256.
- **Storage**: Each chunk = `Uint8Array(16*16*384)` for block IDs + `Uint8Array` for block state variants + per-block light arrays (sky + block light, 4 bits each → packed `Uint8Array`).
- **Greedy meshing**: Merge adjacent same-texture faces into single quads. Cuts triangle count by 80-90% vs naive approach. See `10-architecture.md` §greedy-meshing for algorithm.
- **Chunk mesh rebuild**: Only when a block in the chunk changes. Throttled to 1-2 per frame.
- **Async meshing**: Run mesher in a Web Worker to avoid frame drops. (Use OffscreenCanvas if available.)

### 4.3 Render Distance & Chunk Loading

- Default render distance: 12 chunks (configurable 2-32 via Options menu).
- Chunk load order: spiral outward from player, prioritized by distance + frustum.
- Unload chunks beyond render distance + 2 (safety margin), saving their data to IndexedDB if modified.
- Keep at most `2*RD + 1` squared chunks loaded. At RD=32, that's 4,225 chunks = ~70MB.

### 4.4 Lighting (Vertex-baked, NOT realtime)

Vanilla Minecraft uses **vertex-baked ambient occlusion + sky light**. Do the same:
- Each chunk has a light array: 4 bits sky light + 4 bits block light per voxel.
- When meshing, sample light at each face vertex (averaging neighbors for smooth lighting).
- Recompute light on chunk edit (BFS from light sources).
- "Fancy" graphics = per-vertex AO; "Fast" graphics = per-face flat shading.

### 4.5 Texture Atlas

- Combine all 16×16 textures into one large atlas (e.g., 2048×2048 = 128×128 tiles).
- Generate at load time from individual PNGs.
- Use `THREE.MeshLambertMaterial` with atlas UV mapping.
- Mipmap levels: configurable 0-4 (Option menu).

### 4.6 Mob AI

Implement both the **Goals system** (for older mobs like zombies, skeletons) and the **Brain system** (for villagers, piglins, allays — see `03-research-mobs.md` §2 for full spec).

Each mob has:
- A `GoalSelector` with prioritized goals (e.g., Zombie: 1=MeleeAttack, 2=MoveToTarget, 3=Wander, 4=LookAtPlayer)
- A `Navigation` component (A* on voxel grid; ground/water/fly variants)
- A `Sensing` component (line-of-sight checks)
- A `Brain` (optional, for newer mobs) with memories, sensors, activities

Run mob AI at 20 TPS, but limit pathfinding to ~5 mobs per tick (round-robin) to avoid frame drops.

### 4.7 Redstone

Implement as a separate `RedstoneSystem` that runs on its own tick (10 TPS = every 100ms, 2 game ticks per redstone tick). Maintain a queue of "dirty" redstone positions; on each redstone tick, BFS-update power levels from these sources. See `06-research-mechanics.md` §4 for the full algorithm including quasi-connectivity (Java Edition quirk).

### 4.8 Save Format

World saves stored in IndexedDB under database `voxelcraft-worlds`. Schema:
- `worlds` object store: `{ id, name, seed, gamemode, difficulty, gamerules, created, lastPlayed, spawnPoint, time, weather }`
- `chunks` object store: `{ key: "worldId:dim:x:z", data: Uint8Array, modified: bool }`
- `player` object store: `{ worldId, position, rotation, health, hunger, inventory, effects, xp, ... }`
- `structures` object store (optional): cached structure placements

Save on: chunk unload, every 30 seconds, world quit, player sleep.

## 5. Mandatory Features (Acceptance Criteria)

The game is **NOT complete** until ALL of the following work end-to-end. Treat each as a hard acceptance criterion.

### 5.1 World Creation (see `11-features.md` §1 for full spec)

- [ ] World creation screen with: name, game mode (Survival/Creative/Adventure/Spectator), difficulty (Peaceful/Easy/Normal/Hard/Hardcore), world type (Default/Large Biomes/Amplified/Single Biome/Superflat), seed input (text + Random button), Generate Structures toggle, Bonus Chest toggle, Allow Cheats toggle.
- [ ] Seed parsing: accepts any string (hash to 64-bit int) or numeric seed. World generation must be **deterministic** from the seed — same seed = identical world.
- [ ] Random seed button generates a random 64-bit integer.

### 5.2 Game Modes & Difficulty (CRITICAL — user explicitly requested)

- [ ] **Survival**: health, hunger, mining fatigue, mobs hostile, fall damage, drowning, items dropped on death.
- [ ] **Creative**: infinite resources, instant block break, flying (double-jump to toggle), no damage, no hunger.
- [ ] **Adventure**: cannot break blocks without correct tool (for map makers).
- [ ] **Spectator**: invisible, can fly through blocks, cannot interact.
- [ ] **Hardcore**: locked to Hard difficulty, death = world becomes spectator-only (no deletion in single-player web context — but lock to spectator).
- [ ] **Peaceful**: no hostile mob spawning, hunger doesn't deplete past 0 saturation, regen fast.
- [ ] **Easy**: hostile mobs spawn but deal reduced damage; zombie doesn't break doors; spider poison disabled; hunger stops at 5 HP.
- [ ] **Normal**: standard.
- [ ] **Hard**: max damage; zombies break doors; hunger can kill; wither effect; raids harder.
- [ ] `/gamemode` and `/difficulty` commands work to switch mid-game.

### 5.3 Camera Modes (CRITICAL — user explicitly requested)

- [ ] **First-person**: camera at player eye height (~1.62 blocks). Player model invisible.
- [ ] **Third-person back** (F5 once): camera behind player, player model visible.
- [ ] **Third-person front** (F5 twice): camera in front of player, looking back at player face.
- [ ] **F5 cycle**: First → Third-back → Third-front → First.
- [ ] Camera collision: in third-person, camera pulls in if it hits a block (don't clip through walls).
- [ ] Smooth camera interpolation between modes (50ms).

### 5.4 Movement & Physics

- [ ] WASD movement, Space=jump, Shift=sneak, Ctrl=sprint (default; remappable).
- [ ] Walking 4.3 b/s, sprinting 5.6 b/s, sneaking 1.3 b/s.
- [ ] Sprint-jump covers 4 blocks horizontally.
- [ ] Creative flying: double-tap Space to toggle; Space=up, Shift=down; 11 b/s normal, 22 b/s sprint.
- [ ] Sneak prevents walking off ledges (1 block edge hold).
- [ ] Fall damage: 4 HP per block past 3 blocks (reduced by feather falling, blocks if landed in water/cobweb/sweet berry/hay bale/slime block).
- [ ] Swimming: slower movement, oxygen bar (10 sec, then 2 HP/sec drowning damage).
- [ ] Elytra: glides when falling, firework boost.
- [ ] Lava: 4 HP/tick contact damage, sets on fire, slows movement.
- [ ] Collision: AABB vs voxel grid, no clipping, no falling through floor at high speed.
- [ ] Step-up: walk up 0.6 block height (slabs) without jumping.

### 5.5 Block Interaction

- [ ] Left-click: break block (with mining time based on tool + hardness; instant in Creative).
- [ ] Right-click: use/place block (use item in hand; place if block item).
- [ ] Middle-click: pick block (copies targeted block to hotbar in Creative).
- [ ] Sneak + right-click: place block on a container without opening it.
- [ ] Block break particles + sound.
- [ ] Block place sound.
- [ ] Tool affects break speed (see `06-research-mechanics.md` §9 for formula).
- [ ] Fortune/Silk Touch enchantments affect drops.

### 5.6 Inventory & Crafting (see `11-features.md` §6)

- [ ] 36 inventory slots + 9 hotbar + 4 armor + 1 offhand.
- [ ] Press E to open inventory (2x2 crafting visible).
- [ ] Press E on crafting table for 3x3 grid.
- [ ] Recipe matching: shaped + shapeless recipes from `07-research-recipes.md`.
- [ ] Recipe unlocking (1.20+): recipes unlock as you collect ingredients; show toast.
- [ ] Item dragging: click-drag to distribute, shift-click to move stacks.
- [ ] Number keys 1-9 select hotbar slot.
- [ ] F key swaps main/offhand.
- [ ] Q drops item.
- [ ] Creative inventory: tabbed by category, infinite items, no inventory limit screen (scrollable).

### 5.7 Mobs (CRITICAL — user explicitly requested they walk and behave)

Implement ALL of these mob categories with proper AI:
- [ ] **Passive**: cow, pig, sheep, chicken, mooshroom, rabbit, horse, donkey, mule, llama, cat, ocelot, parrot, panda, fox, bee, turtle, axolotl, frog, goat, sniffer, allay, armadillo, camel, strider, glow squid, squid, bat, cod, salmon, pufferfish, tropical fish, dolphin, villager (all 13 professions), wandering trader, snow golem, iron golem.
- [ ] **Neutral**: wolf, spider (passive in light), enderman, piglin, piglin brute, hoglin, zombified piglin, polar bear, llama, dolphin, bee, iron golem, panda (aggressive variant).
- [ ] **Hostile (overworld)**: zombie, husk, drowned, skeleton, stray, bogged, creeper, spider (hostile in dark), cave spider, witch, slime, silverfish, enderman (when provoked), phantom, ravager, pillager, vindicator, evoker, vex.
- [ ] **Hostile (nether)**: ghast, blaze, magma cube, wither skeleton, zombified piglin, piglin brute, hoglin, zoglin.
- [ ] **Hostile (end)**: enderman, shulker, ender dragon (boss), endermite.
- [ ] **Bosses**: ender dragon (full multi-phase fight, see `05-research-dimensions.md`), wither (summon + fight).
- [ ] **Tamable**: wolf (bones), cat (fish), parrot (seeds), horse/donkey/mule (ride + break), llama, fox (sweet berries), allay (give item).
- [ ] All mobs have: ambient sounds, hurt sound, death sound, step sound, idle animation (walking, head bobbing).
- [ ] Mobs pathfind toward targets (A*), avoid hazards (lava, cactus, falls >3 blocks).
- [ ] Mobs spawn naturally based on biome + light level + difficulty + mob cap.

### 5.8 Dimensions (CRITICAL — user explicitly requested Nether; End also required)

- [ ] **Overworld**: Y=-64 to 320, sea level 63, day/night cycle 20 min, weather (rain/snow/thunder), all biomes from `04-research-biomes.md`.
- [ ] **Nether**: build nether portal (4x5 obsidian + flint & steel). 8:1 coordinate scale. Lava sea at Y=31. Nether mobs. Beds explode. Respawn anchor works.
- [ ] **End**: enter via End portal (stronghold). Central island + dragon fight. Outer islands with end cities + elytra. End gateway portals.
- [ ] Portal teleportation has 1-second transition (portal texture, sound).
- [ ] Each dimension persists independently. Player inventory shared across dimensions.

### 5.9 Redstone (USER SELECTED — must work)

- [ ] Redstone dust: power 0-15, propagates with decay, climbs 1 block vertically.
- [ ] Redstone torch, repeater (1-4 tick delay), comparator (compare + subtract mode).
- [ ] Power sources: lever, button (wood/stone), pressure plates (wood/stone/light/heavy), tripwire, daylight sensor, observer, sculk sensor, target block, detector rail, note block.
- [ ] Pistons: push up to 12 blocks, sticky pulls back, quasi-connectivity (Java quirk).
- [ ] Dispenser/dropper: dispenser uses items (shoots arrows, places water, etc.), dropper drops items.
- [ ] Hopper: transfers items 4/sec, sucks up items above.
- [ ] Logic gates: implementable (AND, OR, NOT, XOR, T-flip-flop, clock).
- [ ] Note block: plays different notes based on note value + instrument based on block below.

### 5.10 Enchanting (USER SELECTED)

- [ ] Enchanting table: requires 15 bookshelves within 2 blocks. Offers 3 enchantments at level 1/4/7.../30 based on player level + seed.
- [ ] Anvil: combine items, repair, rename, costs XP, "Too Expensive" cap at 39 levels.
- [ ] All 35+ enchantments from `02-research-items.md` §11.
- [ ] Treasure enchantments (Mending, Frost Walker, Soul Speed, Swift Sneak) only from loot/trade/fishing.
- [ ] Villager librarian trades enchanted books by tier.

### 5.11 Brewing (USER SELECTED)

- [ ] Brewing stand: 3 bottle slots + 1 ingredient + blaze powder fuel.
- [ ] 20-sec brew time per ingredient.
- [ ] Full recipe tree from `06-research-mechanics.md` §7.
- [ ] Splash potions (gunpowder) + lingering potions (dragon's breath on splash).
- [ ] All potion effects from `02-research-items.md` §12.

### 5.12 Crafting Stations

- [ ] Crafting table (3x3).
- [ ] Furnace (smelting, 200 ticks).
- [ ] Blast furnace (blasting, 100 ticks, ores only).
- [ ] Smoker (smoking, 100 ticks, food only).
- [ ] Campfire + soul campfire (600/1200 ticks, food only, no fuel).
- [ ] Stonecutter (1 input → multiple outputs).
- [ ] Smithing table (netherite upgrade + armor trims).
- [ ] Loom (banner patterns).
- [ ] Cartography table (map zoom/copy/lock/locator).
- [ ] Anvil (3 tiers: anvil, chipped, damaged).
- [ ] Grindstone (disenchant + repair).
- [ ] Brewing stand.
- [ ] Enchanting table.

### 5.13 Sound & Music (USER SELECTED)

- [ ] Master volume + 9 sub-channels (Music, Ambient, Blocks, Hostile, Friendly, Players, Records, Weather, Jukebox).
- [ ] Block dig/place/step sounds (per block material).
- [ ] Mob ambient/hurt/death sounds.
- [ ] Ambient music (royalty-free C418-style — find CC0/CC-BY tracks).
- [ ] Music discs (12 vanilla discs + 1.21 additions).
- [ ] Positional audio for mob sounds (closer = louder, panned by direction).
- [ ] Subtitles for sounds (accessibility).
- [ ] Weather sounds (rain, thunder).

### 5.14 Save/Load (USER SELECTED)

- [ ] World list on main menu: shows name, seed, gamemode, last played, delete button.
- [ ] Auto-save every 30 sec.
- [ ] Save on chunk unload.
- [ ] Save on world quit.
- [ ] Player position, inventory, health, effects, XP saved.
- [ ] World time, weather, gamerules saved.
- [ ] Resume from exactly where you left off.
- [ ] IndexedDB storage (no backend).

### 5.15 Options Menu (CRITICAL — user explicitly requested same as vanilla)

Implement ALL settings from `09-research-settings.md`:
- [ ] Video settings (render distance, graphics, smooth lighting, max framerate, vsync, FOV, etc.).
- [ ] Controls (all keybindings remappable).
- [ ] Audio (10 channel sliders).
- [ ] Language (at least en_us + 5 others).
- [ ] Chat settings.
- [ ] Accessibility settings.
- [ ] Skin customization (layer toggles, slim/classic model).
- [ ] Resource pack support (load custom resource packs from URL).
- [ ] All settings persist in localStorage.

### 5.16 Commands

Implement at least these commands (only if cheats enabled, or always in Creative):
- [ ] `/gamemode <mode>` — switch gamemode
- [ ] `/difficulty <peaceful|easy|normal|hard>` — switch difficulty
- [ ] `/time set <day|night|noon|midnight|<number>>` — set world time
- [ ] `/time add <number>` — advance time
- [ ] `/weather <clear|rain|thunder> [<duration>]` — set weather
- [ ] `/give <player> <item> [<count>]` — give items (player = @s in single-player)
- [ ] `/summon <entity> [<x> <y> <z>]` — spawn mob
- [ ] `/tp <player> <x> <y> <z>` or `/tp <x> <y> <z>` — teleport
- [ ] `/effect <player> <effect> <duration> <amplifier>` — apply effect
- [ ] `/enchant <player> <enchant> <level>` — enchant held item
- [ ] `/gamerule <rule> <value>` — set gamerule
- [ ] `/kill <player>` — kill entity
- [ ] `/seed` — show world seed
- [ ] `/setblock <x> <y> <z> <block>` — place block
- [ ] `/fill <x1> <y1> <z1> <x2> <y2> <z2> <block>` — fill area
- [ ] `/clone <x1> <y1> <z1> <x2> <y2> <z2> <x> <y> <z>` — copy region
- [ ] `/particle <type> <x> <y> <z>` — spawn particles
- [ ] `/playsound <sound> <source> <player>` — play sound
- [ ] `/title <player> title <text>` — show title
- [ ] `/tellraw <player> <json>` — formatted chat message

### 5.17 Advancements & Statistics

- [ ] ~110 advancements from vanilla (in `data/advancements.json`).
- [ ] Advancement toast on unlock.
- [ ] Advancements screen (L key).
- [ ] Statistics tracking (blocks mined, items crafted, distance traveled, mobs killed, etc.).

### 5.18 Debug Overlay (F3)

- [ ] FPS, chunk count, entity count, render distance.
- [ ] XYZ position, facing direction, biome name, light level.
- [ ] Memory usage, allocated vs used.
- [ ] Show hitbox (F3+B).
- [ ] Chunk boundaries (F3+G).
- [ ] Slow motion (F3+Esc simulation, no vanilla key).

### 5.19 Other Vanilla Mechanics

- [ ] Day/night cycle (20 min).
- [ ] Weather (rain, snow in cold biomes, thunder + lightning).
- [ ] Lightning transforms: charged creeper, pig→zombified piglin, villager→witch.
- [ ] Sleep (skip night, skip weather, set spawn).
- [ ] Phantom spawning at 3+ days without sleep.
- [ ] Ender pearl teleportation (2 HP damage).
- [ ] Eye of ender leads to stronghold.
- [ ] Bed explosion in Nether/End.
- [ ] Death: drop items, drop XP, respawn at spawn/bed.
- [ ] Armor stand.
- [ ] Item frames + glow item frames.
- [ ] Banners (all 16 colors, all patterns).
- [ ] Fireworks (custom colors, shapes, flight duration).
- [ ] Maps (zoom, copy, lock, locator).
- [ ] Fishing rod with loot table (fish, treasure, junk).
- [ ] Lead (leash mobs).
- [ ] Saddles (ride horse/camel/pig/strider).
- [ ] Trading with villagers (13 professions, 5 tiers).
- [ ] Piglin bartering (60-item table).
- [ ] Allay item collection.
- [ ] Warden sculk sensing system (deep dark).
- [ ] Trial chambers + trial spawners + vaults (1.21).
- [ ] Archaeology (1.20+): suspicious sand/gravel + brush.
- [ ] Armor trims (1.20+).
- [ ] Pottery sherds + decorated pots.

## 6. Texture Generation Strategy

**Critical decision**: We cannot legally redistribute Mojang's texture files. Generate procedurally-pixelated textures that match the vanilla palette + patterns. Use the following approach:

### Option A: Hand-paint SVG → PNG (RECOMMENDED)
Write a Node.js script (`scripts/generate-textures.js`) that uses Canvas API to procedurally draw each 16×16 texture pixel-by-pixel. For each block:
1. Determine its dominant colors (top, sides, noise variation).
2. Apply a Perlin-noise overlay for texture variation.
3. Save as 16×16 PNG in `public/assets/textures/blocks/`.

Examples:
- `grass_top.png`: green base with subtle Perlin noise, slightly yellower in patches.
- `stone.png`: gray base with darker specks.
- `dirt.png`: brown base with darker specks.
- `oak_log_top.png`: rings pattern (concentric circles).
- `oak_log_side.png`: vertical bark lines.

See `10-architecture.md` §texture-generation for the full color reference table per block.

### Option B: Allow user-supplied resource pack
Add an option in the Options menu to load a custom resource pack (ZIP file URL). This lets users plug in their own textures (including legally-purchased vanilla ones). Document this in README.

**Implement BOTH options** — Option A as the default (so the game works out-of-the-box), Option B for power users.

## 7. Performance Targets

| Device tier | Render distance | Graphics | Particles | Smooth light | Target FPS |
|---|---|---|---|---|---|
| Ultra (RTX 4080+) | 32 | Fabulous | All | MAX | 120+ |
| High-end (RTX 3060) | 24 | Fabulous | All | MAX | 60-120 |
| Mid-range (GTX 1050) | 12 | Fancy | Decreased | MIN | 60 |
| Low-end (integrated) | 6 | Fast | Minimal | OFF | 30-60 |

Auto-detect tier on first load based on `navigator.hardwareConcurrency`, `navigator.deviceMemory`, GPU vendor (via WebGL `UNMASKED_RENDERER_WEBGL`), and a 1-second benchmark. Set defaults accordingly. User can override via Options.

## 8. World Creation Form Fields

When user clicks "Create World", show a form with these fields (matching vanilla 1.21):

| Field | Type | Default | Options |
|---|---|---|---|
| World name | text | "New World" | any |
| Game mode | dropdown | Survival | Survival / Creative / Adventure / Spectator |
| Difficulty | dropdown | Normal | Peaceful / Easy / Normal / Hard / Hardcore |
| World type | dropdown | Default | Default / Large Biomes / Amplified / Single Biome / Superflat |
| World seed | text | (empty=random) | any string or integer |
| (Random seed button) | button | — | generates random 64-bit int |
| Generate structures | checkbox | ON | ON/OFF |
| Bonus chest | checkbox | OFF | ON/OFF |
| Allow cheats | checkbox | OFF | ON/OFF |
| Hardcore toggle | checkbox | OFF | ON (locks difficulty to Hard + Hardcore mode) |

If Superflat selected, show a "Customize" button that lets user set 4-8 block layers (default: grass/dirt/dirt/dirt/bedrock = 4 layers).

If Single Biome selected, show a biome dropdown (plains, desert, mountains, ocean, etc.).

## 9. Options Menu Structure (Tabbed)

Options screen has these tabs (matching vanilla 1.21):

1. **Video** — all video settings from `09-research-settings.md` §3
2. **Controls** — keybindings (collapsible categories)
3. **Audio & Music** — 10 channel sliders
4. **Language** — language selector
5. **Chat** — chat settings
6. **Accessibility** — accessibility settings
7. **Skin** — skin layers + model
8. **Resource Packs** — load/manage packs
9. **Telemetry** — telemetry settings (stub for now)

Plus a "Back to Game" button. Changes apply immediately (except render distance, which requires chunk reload).

## 10. Deployment Target

- **Source control**: GitHub repo `voxelcraft` (created via GitHub MCP per §0.5.1).
- **Platform**: Vercel static hosting (no server runtime), linked to the GitHub repo so every push to `main` auto-deploys.
- **Plan**: **Vercel Hobby (free tier)** — see `12-deployment.md` §16 for the full constraints table. Key limits the AI must respect:
  - 100 GB bandwidth/month (~33,000 visitors at 3MB load).
  - 6,000 build minutes/month (~30-60 sec per build).
  - 1 concurrent build (don't push 2 commits in rapid succession — wait for the first build to finish).
  - **Non-commercial use only** — do NOT add ads, payment integrations, or monetization without flagging to the user that they'd need to upgrade to Pro ($20/month).
  - Custom domains work on production only (1 domain), not on preview deploys.
- **Deploy method**: Vercel MCP — do NOT use `vercel` CLI or the Vercel dashboard (per §0.5.2).
- **Build**: `npm run build` → outputs `dist/` folder.
- **Config**: `vercel.json` (see `12-deployment.md` for exact contents).
- **URL structure**: SPA — all routes serve `index.html`.
- **Caching**: long-term cache for hashed assets (`/_assets/*`), short cache for `index.html`.
- **Size budget**: gzipped bundle < 2MB (textures are the bulk). This keeps bandwidth usage low on the free tier.
- **First Contentful Paint < 2 sec** on a broadband connection.
- **Preview deploys**: every push to a feature branch (or every commit before promotion) gets a preview URL. Test on the preview URL before promoting to production.
- **Production**: promote via `vercel promote <deployment-url>` MCP call after user confirms preview works.
- **Monitoring**: AI checks Vercel MCP `get_project` for usage stats (bandwidth, build minutes) and warns the user if usage crosses 80% of any free-tier limit.

## 11. Implementation Order (Suggested Roadmap)

Build in this order to ship a playable MVP early, then layer on features:

### Phase 1 — Vertical Slice MVP (2-3 weeks)
1. **Create GitHub repo** `voxelcraft` via GitHub MCP (per §0.5.1). Copy all 12 prompt-kit files into `docs/`. Commit `chore: initial commit with prompt-kit docs`. Push to `main`.
2. **Link repo to Vercel** via Vercel MCP (per §0.5.2). Confirm the auto-deploy hook fires (the first deploy will fail because there's no code yet — that's expected).
3. Project scaffold (Vite + Three.js + folder structure). Commit `chore: scaffold vite + three.js project`. Push — Vercel should deploy successfully now.
4. Procedural texture generator (basic blocks only: grass, dirt, stone, wood, leaves, sand, water). Commit `feat(textures): procedural 16x16 texture generator for basic blocks`. Push.
5. Chunk system + greedy mesher + render distance. Commit `feat(chunk-system): greedy meshing + render distance`. Push.
6. Player controller (first-person, WASD, gravity, collision). Commit `feat(player): WASD + jump + gravity + AABB collision`. Push.
7. Block break/place (single block type initially). Commit `feat(blocks): break + place with mining time`. Push.
8. Hotbar UI + simple inventory. Commit `feat(ui): hotbar + simple inventory`. Push.
9. World generation: Perlin noise terrain, 3 biomes (plains, forest, desert). Commit `feat(worldgen): perlin terrain + 3 biomes`. Push.
10. Day/night cycle + sky. Commit `feat(sky): day/night cycle + sun/moon`. Push.
11. Save/load world to IndexedDB. Commit `feat(storage): IndexedDB world save/load`. Push.
12. **Confirm preview deploy works**, then promote to production. Tag `v0.1.0-phase1`. Push tag.

### Phase 2 — Core Survival (3-4 weeks)
11. Full block registry (~100 most common blocks).
12. Crafting system + recipes.
13. Furnace + smelting.
14. Inventory drag-drop UI.
15. Health + hunger + air.
16. Mobs: zombie, skeleton, creeper, spider, cow, pig, sheep, chicken.
17. Mob AI + pathfinding.
18. Combat (melee + bow).
19. Difficulty modes.
20. Sleep + beds.

### Phase 3 — Depth (4-5 weeks)
21. All biomes + multi-noise generation.
22. All overworld structures (village, dungeon, mineshaft, stronghold, etc.).
23. All mobs (60+).
24. Villager trading.
25. Enchanting + anvil.
26. Brewing.
27. Redstone (full system).
28. Ores + mining tiers.
29. All armor + tools (wood→netherite).
30. Nether dimension + portal + nether mobs + nether structures.

### Phase 4 — End Game (3-4 weeks)
31. End dimension + dragon fight.
32. Elytra + flight.
33. All advancements.
34. Commands.
35. Trial chambers (1.21).
36. Archaeology (1.20+).
37. Armor trims (1.20+).
38. Sound + music (full coverage).
39. Options menu (all settings).
40. Performance optimization + device-tier auto-detect.

### Phase 5 — Polish (2-3 weeks)
41. Third-person camera + player model.
42. Resource pack support.
43. Multi-language.
44. Accessibility features.
45. Debug overlay (F3).
46. Statistics tracking.
47. Final performance tuning.
48. Documentation + README.

## 12. Definition of Done

The project is complete when ALL of these are true:

- [ ] User can create a world with custom seed, gamemode, difficulty, world type.
- [ ] World generates deterministically from seed (same seed = same world).
- [ ] All 4 gamemodes work correctly (Survival, Creative, Adventure, Spectator).
- [ ] All 5 difficulty levels work (Peaceful, Easy, Normal, Hard, Hardcore).
- [ ] Player can switch between first-person and third-person camera (F5).
- [ ] Player can walk, jump, sneak, sprint, swim, fly (in Creative), glide (with elytra).
- [ ] Player can break/place all ~800 blocks.
- [ ] Crafting works for all ~880 recipes.
- [ ] All 60+ mobs spawn, walk, attack, breed, and behave correctly.
- [ ] Nether dimension accessible via portal.
- [ ] End dimension accessible via stronghold portal; Ender Dragon fight works.
- [ ] Redstone circuits work (dust, repeater, comparator, piston, hopper, dispenser).
- [ ] Enchanting works (table + anvil + all 35+ enchantments).
- [ ] Brewing works (all potions).
- [ ] Sound + music plays for all events.
- [ ] World saves to IndexedDB; can be loaded later.
- [ ] Options menu has all vanilla settings.
- [ ] Commands work (gamemode, time, weather, give, summon, tp, etc.).
- [ ] Game runs at 60+ FPS on a mid-range laptop at render distance 12.
- [ ] Game deploys to Vercel as a static site.
- [ ] **GitHub repo** `voxelcraft` exists and contains the full commit history with clear `feat:`/`fix:`/`chore:` commit messages.
- [ ] **Vercel project** is linked to the GitHub repo — every push to `main` auto-deploys.
- [ ] **Production URL** (e.g., `voxelcraft.vercel.app`) serves the latest stable release.
- [ ] **Release tags** exist for each completed phase (`v0.1.0-phase1`, `v0.2.0-phase2`, etc.).
- [ ] Code is documented; README explains how to run locally and deploy.

## 13. Constraints & Notes

- **No copyrighted assets**: do NOT include Mojang's textures, sounds, or music. Generate procedurally or use CC0/CC-BY alternatives.
- **Single-player only**: no multiplayer networking. (Stubs OK for future.)
- **No server backend**: 100% client-side. No Vercel Serverless Functions for game logic.
- **Browser support**: latest Chrome, Firefox, Safari, Edge. No IE.
- **Mobile**: basic touch support is nice-to-have, not required. Desktop-first.
- **Bundle size**: target < 2MB gzipped (excluding textures, which load async).
- **Memory**: stay under 2GB RAM at render distance 12. Stay under 4GB at render distance 32.
- **WebGL2 required**: WebGL1 fallback is nice-to-have, not required.

## 14. First Message to Send

When you (the AI agent) receive this prompt, your first reply MUST include, in this order:

1. A confirmation that you've read all 12 reference files (list them by name).
2. **The URL of the GitHub repo you just created** (`https://github.com/<user>/voxelcraft`) — created via GitHub MCP per §0.5.1, with the 12 prompt-kit files committed to `docs/`.
3. Confirmation that the repo is linked to Vercel via MCP (per §0.5.2) and that the auto-deploy hook is active.
4. A proposed Phase 1 task breakdown (which files you'll create first, in what order, with the commit message for each).
5. Any clarifying questions before starting implementation.

**DO NOT start writing game code until I confirm your plan.** You may, however, create the GitHub repo and link it to Vercel as the very first action — that's expected and required before any code work begins.

---

**END OF MASTER PROMPT**
