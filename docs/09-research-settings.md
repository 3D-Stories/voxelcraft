# Minecraft Clone Prompt Kit — 09. Settings & Options Reference

> **Purpose:** A comprehensive, maximalist reference of every configurable setting in Minecraft Java Edition (1.21.x) Options menu, gamerules, world-creation parameters, and pause-menu actions. Written for an AI/engineer building a Three.js Minecraft clone that mirrors the vanilla settings surface as closely as possible.
>
> **Scope:** Video · Performance · Controls · Audio · Language · Chat · Accessibility · Skin · Server/Network · Telemetry · Resource Packs · World Creation · Pause Menu · Gamerules · Three.js implementation notes.
>
> **Conventions:**
> - All default values are pulled from vanilla Minecraft Java 1.21.4 (`options.txt` defaults).
> - "Performance Impact" column: `★★★` = heavy, `★★` = moderate, `★` = light, `—` = none.
> - Settings that change appearance only are tagged `[Visual]`; settings that change runtime behavior are tagged `[Behavioral]`.

---

## Table of Contents

1. [Settings Storage (`options.txt`)](#1-settings-storage-optionstxt)
2. [Video Settings](#2-video-settings)
3. [Performance Deep-Dive](#3-performance-deep-dive)
4. [Controls Settings](#4-controls-settings)
5. [Audio / Music Settings](#5-audio--music-settings)
6. [Language Settings](#6-language-settings)
7. [Chat Settings](#7-chat-settings)
8. [Accessibility Settings](#8-accessibility-settings)
9. [Skin Settings](#9-skin-settings)
10. [Server / Network Settings](#10-server--network-settings)
11. [Telemetry / Data Collection](#11-telemetry--data-collection)
12. [Resource Packs](#12-resource-packs)
13. [World Creation Settings](#13-world-creation-settings)
14. [In-Game Options (Pause Menu)](#14-in-game-options-pause-menu)
15. [Gamerules](#15-gamerules)
16. [Three.js Implementation Notes](#16-threejs-implementation-notes)
17. [Appendix A — Default `options.txt` Snapshot](#appendix-a--default-optionstxt-snapshot)
18. [Appendix B — Default Keybindings (1.21.x)](#appendix-b--default-keybindings-121x)

---

## 1. Settings Storage (`options.txt`)

Vanilla Minecraft stores client-side settings in a flat text file at `.minecraft/options.txt`. The file is line-delimited `key:value` pairs (colon separator, not `=`). Booleans are lowercase `true`/`false`. Numbers are bare. Enums are stored as integers (e.g., `graphicsMode:1`) or strings (`renderDistance:12`).

### 1.1 File Location

| OS | Path |
|---|---|
| Windows | `%APPDATA%\.minecraft\options.txt` |
| macOS | `~/Library/Application Support/minecraft/options.txt` |
| Linux | `~/.minecraft/options.txt` |
| **Three.js equivalent** | `localStorage["mc_options_v1"]` (single JSON blob) |

### 1.2 Notable Quirks

- `options.txt` is rewritten on every change — there is no batching.
- Some keys (e.g., `renderDistance`) write the integer value directly; others (e.g., `graphicsMode`) use a 0-indexed enum.
- Per-world settings (gamerules, difficulty, locked difficulty) live in `<save>/level.dat` under NBT path `Data/GameRules` and `Data/Difficulty`/`Data/DifficultyLocked`.
- Server list lives in `.minecraft/servers.dat` (NBT).
- Hotbar saves (creative) live in `.minecraft/hotbar.nbt`.
- The launcher stores launcher-only options (JVM args, memory, native fullscreen) in `launcher_profiles.json` separately.

### 1.3 Storage Implementation Pattern (Three.js)

```ts
// Settings service (browser localStorage)
const SETTINGS_KEY = "mc_options_v1";

interface MinecraftOptions {
  // Video
  graphicsMode: 0 | 1 | 2;            // fast / fancy / fabulous
  renderDistance: number;              // 2..32 chunks
  ao: 0 | 1 | 2;                       // smooth lighting off/min/max
  framerateLimit: number;              // 10..260 or 260 for "Unlimited" (VSync handled separately)
  enableVsync: boolean;
  bobView: boolean;
  guiScale: 0 | 1 | 2 | 3 | 4;         // 0 = auto
  attackIndicator: 0 | 1 | 2;          // off / crosshair / hotbar
  gamma: number;                       // 0.0..1.0 (Moody=0, Bright=1)
  renderClouds: "false" | "fast" | "true";
  fullscreen: boolean;
  particles: 0 | 1 | 2;                // minimal / decreased / all
  mipmapLevels: number;                // 0..4
  entityShadows: 0 | 1 | 2;            // off / non-attacker / all (since 1.21.5 simplified to bool on some UIs)
  // ... see sections below
}

function loadOptions(): MinecraftOptions {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}") }; }
  catch { return structuredClone(DEFAULTS); }
}

function saveOptions(opts: MinecraftOptions) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(opts));
}
```

---

## 2. Video Settings

The Video Settings screen is the most performance-sensitive panel in Minecraft. Every option here can be toggled at runtime; only `renderDistance` requires a chunk reload (handled automatically).

### 2.1 Master Video Settings Table

| Setting | options.txt key | Type | Default | Range | Description | Performance Impact |
|---|---|---|---|---|---|---|
| Graphics | `graphicsMode` | enum (0/1/2) | `1` (Fancy) | Fast(0) / Fancy(1) / Fabulous(2) | Toggles transparency, leaves rendering, water quality, rain/snow visuals, ice transparency. Fabulous adds a separate transparency render pass. | `★★★` |
| Render Distance | `renderDistance` | int | `12` | 2–32 chunks | Number of chunks in each direction from the player that are loaded and rendered. | `★★★` (most impactful) |
| Smooth Lighting | `ao` | enum (0/1/2) | `2` (MAX) | OFF(0) / MINIMUM(1) / MAXIMUM(2) | Ambient occlusion per-vertex (MAX) vs per-face (MIN) vs off. | `★★` |
| Max Framerate | `framerateLimit` | int | `120` | 10–260, 260 = Unlimited | Cap on FPS. Lower saves battery/CPU. | `★` |
| VSync | `enableVsync` | bool | `false` | true/false | Sync to display refresh rate (eliminates tearing). When ON, framerate cap ignored. | `★` |
| View Bobbing | `bobView` | bool | `true` | true/false | Camera sway while walking. | `—` |
| GUI Scale | `guiScale` | enum (0–4) | `0` (Auto) | Auto(0) / 1 / 2 / 3 / 4 | Multiplier for HUD and menus; Auto picks the largest that fits. | `—` |
| Attack Indicator | `attackIndicator` | enum (0/1/2) | `1` (Crosshair) | OFF(0) / CROSSHAIR(1) / HOTBAR(2) | Shows charge progress of attack cooldown. | `—` |
| Brightness | `gamma` | float | `0.5` | 0.0 (Moody) – 1.0 (Bright) | Affects ambient light multiplier on block faces. Does NOT affect actual light levels. | `—` |
| Clouds | `renderClouds` | string | `"true"` | "false" / "fast" / "true" | Off / 2D flat planes / volumetric 3D clouds. | `★` |
| Fullscreen | `fullscreen` | bool | `false` | true/false | Exclusive fullscreen (or borderless depending on launcher). | `★` |
| Particles | `particles` | enum (0/1/2) | `2` (All) | Minimal(0) / Decreased(1) / All(2) | Caps particle spawn counts. Minimal breaks some gameplay (e.g., bonemeal growth visibility). | `★` |
| Mipmap Levels | `mipmapLevels` | int | `4` | 0–4 | Number of LOD mips generated for block/item textures. Higher = smoother at distance but more VRAM. | `★` |
| Entity Shadows | `entityShadows` | bool | `true` | true/false | Renders circular shadow blob under entities. | `★` |
| Volumetric Clouds | `renderClouds` (Fabulous only) | bool | `true` | true/false | When Graphics=Fabulous, clouds are 3D volumetric. Otherwise flat planes. | `★★` |
| Biome Blend | `biomeBlendRadius` | int | `2` | 0–15 | Radius (in blocks) for biome color interpolation. Higher = smoother grass/water transitions. | `★★` |
| Entity Distance | `entityDistanceScaling` | float | `1.0` | 0.5–5.0 (UI shows 50%–500%) | Multiplier for entity render distance. At 100% an entity ~70 blocks away is rendered. | `★` |
| FOV | `fov` | int | `70` | 30–110 | Horizontal field of view in degrees. | `—` |
| FOV Effect | `fovEffectScale` | float | `1.0` | 0.0–1.0 | How much FOV widens when sprinting/flying/aiming-bow. | `—` |
| Show FPS Overlay | (F3 hotkey) | hotkey | — | — | Press F3 to show debug screen with FPS, coordinates, biome, light level, chunk cache stats. | `—` |
| Hide GUI | (F1 hotkey) | hotkey | — | — | Toggles all HUD rendering. | `—` |
| Hide Hand | (F1 second press) | hotkey | — | — | After HUD hidden, F1 again also hides the first-person hand. | `—` |
| Native Fullscreen (launcher) | launcher setting | bool | platform default | true/false | macOS exclusive; uses native fullscreen vs borderless. | `—` |
| Darkness Effect Strength | `darknessEffectScale` | float | `1.0` | 0.0–1.0 | Intensity of the Darkness mob effect (Warden). 0 = disabled pulse. | `—` |
| Distortion Effect Strength | `distortionEffectScale` | float | `1.0` | 0.0–1.0 | Intensity of Nausea effect wobble. | `—` |
| Panorama Scroll Speed | `panoramaSpeed` | float | `1.0` | 0.05–10.0 | Speed of rotating background panorama on title screen. | `—` |
| Menu Background Blurriness | `menuBackgroundBlurriness` | int | `5` | 0–10 | Blur radius for background panorama on menus. | `—` |
| Third Person Camera | (F5 hotkey) | toggle | — | Front/Back/First | Cycles first → third-back → third-front → first. | `—` |
| Chunk Border Debug | (F3+G hotkey) | toggle | — | — | Draws red wireframe around chunk boundaries. | `★` |

### 2.2 Graphics Modes (Fast / Fancy / Fabulous)

| Mode | Index | Behavior Differences |
|---|---|---|
| **Fast** | 0 | Leaves: solid (no transparency, no leaf decay particle alpha). Water: opaque, no underwater fog. Ice: opaque. Rain/Snow: not rendered. Grass: no biome tint animation. Clouds: 2D flat. |
| **Fancy** | 1 | Leaves: alpha-tested (transparent gaps). Water: transparent. Ice: transparent. Rain/Snow: rendered with proper depth. Clouds: 2D flat with fancy shading. |
| **Fabulous** | 2 | All of Fancy + Volumetric 3D clouds (rendered through a separate transparency render target), transparent water with proper depth sorting, beacon beam through clouds, stained glass blends correctly. Requires WebGL2 + EXT_color_buffer_float (or WebGL2 default support). |

### 2.3 Brightness (Gamma) — Subtleties

`gamma` is multiplied into the final vertex color after light calculation. Vanilla formula (simplified):

```glsl
float shade = lightLevel / 15.0;          // 0..1 from block light + sky light
shade = mix(shade, 1.0, gamma * 0.5);     // gamma lifts shadows
finalColor = texture.rgb * shade;
```

At `gamma=1.0` ("Bright"), even pitch-black blocks render at ~50% brightness — useful for caving without torches. At `gamma=0.0` ("Moody"), only fully-lit blocks reach full brightness. Note: gamma does **not** affect hostile mob spawn rules (those use real light level ≤ 7).

### 2.4 GUI Scale Calculation

```ts
function computeGuiScale(scalePref: number, windowW: number, windowH: number): number {
  const GUI_BASE = 320; // vanilla scaled GUI tile is 320x240 designed at scale=2
  let scale = 1;
  while (scale < scalePref && (windowW / (scale + 1)) >= 320 && (windowH / (scale + 1)) >= 240) scale++;
  if (scalePref === 0) { // Auto: pick largest that fits
    scale = 1;
    while ((windowW / (scale + 1)) >= 320 && (windowH / (scale + 1)) >= 240) scale++;
  } else scale = scalePref;
  return scale;
}
```

GUI is rendered at `windowW / scale` × `windowH / scale` virtual pixels.

### 2.5 FOV Effect Scaling

When the player sprints, flies, or draws a bow, vanilla widens FOV by up to +15°. The `fovEffectScale` setting multiplies this delta. At `0.0`, no FOV change (good for motion-sensitive players). At `1.0`, full vanilla effect.

---

## 3. Performance Deep-Dive

Because the user wants "high-end with downgrade options", this section explains each perf-sensitive system and provides recommended presets per device tier.

### 3.1 Render Distance Internals

- One chunk = 16×16 columns × 384 blocks tall (since 1.18: Y=-64 to Y=320). For a clone targeting 1.17 height (256 blocks), substitute as needed.
- At render distance `R`, vanilla loads chunks in a square spiral out to a "lazy radius" of `R + 1` (for smoother transitions). The visible square is `(2R + 1)²` chunks.
- Render distance vs. loaded chunks table:

| Render Distance | Visible Chunks | Loaded Chunks (incl. lazy +1) | Approx. Block Count (384h) |
|---|---|---|---|
| 2 | 25 | 49 | 6.0M |
| 4 | 81 | 121 | 14.9M |
| 6 | 169 | 225 | 27.7M |
| 8 | 289 | 361 | 44.4M |
| 12 | 625 | 729 | 89.8M |
| 16 | 1089 | 1225 | 151.0M |
| 20 | 1681 | 1849 | 227.9M |
| 24 | 2401 | 2601 | 320.6M |
| 32 | 4225 | 4489 | 553.4M |

A render distance of 32 = **65×65 chunks = 4225 visible chunks**, containing ~553 million blocks. Most clones should cap at 24–28 for sanity.

### 3.2 Chunk Management Strategy

1. **Chunk load queue** — process N chunks per frame (vanilla: ~1 chunk/tick on main thread, more on async workers). Each chunk requires: terrain gen → feature placement → lighting → mesh build → upload.
2. **Chunk unload** — chunks outside `R + 2` are queued for unload. Vanilla keeps them in memory 60s before saving to disk.
3. **Frustum culling** — each chunk's bounding box is tested against the camera frustum before mesh submission.
4. **Occlusion culling** — vanilla uses a hierarchical-Z buffer (since 1.17) to skip chunks fully occluded by terrain.
5. **Chunk meshing** — greedy meshing per-block-state reduces quad count by 5–10×. Required for decent perf at RD>16.

### 3.3 Fast vs. Fancy — Why It Matters

| Feature | Fast | Fancy |
|---|---|---|
| Leaves | Render as solid blocks (no gaps) | Alpha-tested with cutout texture |
| Water | Opaque blue | Transparent, animated UVs |
| Ice | Opaque white | Transparent |
| Rain/Snow | Hidden | Particle sheets |
| Grass/Fern | No color animation | Animated biome tint |
| Iron Bars / Glass Panes | Full faces | Connected thin faces |
| Clouds | Flat 2D | Flat 2D with shading |
| Beacon Beam | Solid color | Animated translucent |

Fancy is **~30–50% more expensive** than Fast on integrated GPUs, mainly due to alpha-test overdraw on leaves and transparent water sorting.

### 3.4 Mipmap Levels

Each mipmap level halves texture resolution. Level 4 = original / 16. Without mipmaps, distant chunks shimmer (aliasing). With too many mipmaps, distant textures blur and lose detail.

- WebGL: use `gl.generateMipmap(gl.TEXTURE_2D)` after uploading texture, or pre-generate via canvas downsampling.
- Anisotropic filtering (`EXT_texture_filter_anisotropic`) further sharpens mip samples viewed at grazing angles — set to 4× or 8× if available.

### 3.5 Smooth Lighting (Ambient Occlusion)

| Mode | Algorithm | Cost |
|---|---|---|
| OFF | No face darkening; flat-shaded blocks | Cheapest |
| MINIMUM | Per-face AO: each face gets a single shade based on adjacent blocks | ~5% perf hit |
| MAXIMUM | Per-vertex AO: each of 4 vertices interpolated separately; smooth gradient | ~15–20% perf hit |

Vanilla computes AO at mesh-build time using the 3 neighbors of each vertex. Stored per-vertex in the mesh VBO.

### 3.6 Particle Culling

- `Minimal`: most particles suppressed entirely; rain splashes, hit particles, and ambient effects disabled. **Warning:** breaks some gameplay cues (e.g., bone meal growth burst, ender eye break).
- `Decreased`: particles spawn at 25% rate, with a hard cap of ~200 active particles per world.
- `All`: vanilla rates, hard cap ~4000 active particles.

### 3.7 Entity Distance Scaling

Formula: `renderDist = baseEntityDist * entityDistanceScaling` where `baseEntityDist` is per-entity-type (e.g., item frames = 96 blocks, hostile mobs = 70, item drops = 48).

- 50% — close mobs vanish at ~35 blocks. Noticeable pop-in.
- 100% — vanilla feel.
- 200% — entities visible from afar (good for long render distances).
- 500% — renders essentially everything in frustum; very expensive with many mobs.

### 3.8 Recommended Device-Tier Presets

| Tier | Hardware | RD | Graphics | Particles | Smooth Lighting | Mipmap | Entity Dist | Clouds | VSync |
|---|---|---|---|---|---|---|---|---|---|
| **Low** | 4GB RAM, Intel UHD | 6 | Fast | Minimal | OFF | 1 | 70% | OFF | ON |
| **Mid** | 8GB, GTX 1050 | 12 | Fancy | Decreased | MIN | 2 | 100% | Fast | OFF |
| **High** | 16GB+, RTX 3060 | 24 | Fabulous | All | MAX | 4 | 200% | Fancy | OFF |
| **Ultra** | 32GB, RTX 4080 | 32 | Fabulous | All | MAX | 4 | 500% | Volumetric | OFF |

### 3.9 Other Perf Considerations

- **VBO batching**: vanilla groups all chunk meshes into one VBO per chunk (one draw call per chunk per material). Greedy meshing reduces vertex count.
- **Instanced rendering**: trees, flowers, grass — Three.js `InstancedMesh` recommended.
- **Frustum cull per-mesh**: Three.js does this automatically per-object; ensure each chunk is its own `Mesh` so the engine can cull.
- **Texture atlas**: all block textures packed into a single atlas (vanilla uses 16×16 per tile, atlas dimensions 256×256 or larger). Avoids texture-bind thrash.
- **Lighting**: per-vertex light level baked into chunk mesh (15-level sky + 15-level block, max taken). No real-time lighting needed for blocks.

---

## 4. Controls Settings

### 4.1 Mouse Settings

| Setting | key | Default | Range | Notes |
|---|---|---|---|---|
| Mouse Sensitivity | `mouseSensitivity` | `0.5` | 0.0–1.0 (UI shows 0–200%) | Linear-ish; effective degrees-per-pixel = `sens × 0.5` |
| Mouse Invert | `invertYMouse` | `false` | bool | Inverts Y axis |
| Touchscreen Mode | `touchscreen` | `false` | bool | Enables on-screen hotbar interactions |
| Mouse Wheel Sensitivity | `mouseWheelSensitivity` | `1.0` | 1.0–10.0 | For hotbar scrolling speed |
| Discrete Mouse Wheel | `discrete_mouse_scroll` | `false` | bool | Whether wheel scrolls one slot per notch |
| Raw Mouse Input | `rawMouseInput` | `true` | bool | Bypasses OS mouse acceleration |

### 4.2 Movement Behavior Toggles

| Setting | key | Default | Notes |
|---|---|---|---|
| Auto Jump | `autoJump` | `false` | Player auto-jumps 1-block ledges when sprinting |
| Sneak Mode | `sneakMode` | `0` (Hold) | Hold(0) / Toggle(1) |
| Sprint Mode | `sprintMode` | `0` (Hold) | Hold(0) / Toggle(1) |
| Sneak Slowdown (touch) | n/a | — | Only on touchscreen UIs |

### 4.3 Keybinding Categories

Vanilla groups keybindings under these headers in the Controls → Keys screen:

1. **Movement** — WASD, jump, sneak, sprint
2. **Gameplay** — attack, use, pick block, drop, swap hands, inventory, chat
3. **Inventory** — hotbar 1-9, open inventory, item details
4. **Multiplayer** — open social, send feedback, player reporting
5. **Creative** — pick block, save toolbar, load toolbar
6. **Miscellaneous** — screenshot, pause, toggle perspective, toggle HUD, debug screen, advancements, smooth camera, full screen, spectate

### 4.4 Full Default Keybindings (Java 1.21.x)

| Action | Default Key | Category | Notes |
|---|---|---|---|
| Move Forward | W | Movement | |
| Move Left | A | Movement | |
| Move Backward | S | Movement | |
| Move Right | D | Movement | |
| Jump | Space | Movement | |
| Sneak | Left Shift | Movement | |
| Sprint | Left Ctrl | Movement | Double-tap W also works |
| Swim Up / Fly Up | Space | Movement | When in water or flying |
| Swim Down / Fly Down | Left Shift | Movement | |
| Attack/Destroy | Mouse Button 1 (Left) | Gameplay | Hold to break |
| Use Item/Place Block | Mouse Button 2 (Right) | Gameplay | |
| Pick Block | Mouse Button 3 (Middle) | Creative | In creative, copies block |
| Drop Selected Item | Q | Gameplay | |
| Inventory | E | Gameplay | |
| Swap Items in Hands | F | Gameplay | |
| Hotbar Slot 1 | 1 | Inventory | |
| Hotbar Slot 2 | 2 | Inventory | |
| Hotbar Slot 3 | 3 | Inventory | |
| Hotbar Slot 4 | 4 | Inventory | |
| Hotbar Slot 5 | 5 | Inventory | |
| Hotbar Slot 6 | 6 | Inventory | |
| Hotbar Slot 7 | 7 | Inventory | |
| Hotbar Slot 8 | 8 | Inventory | |
| Hotbar Slot 9 | 9 | Inventory | |
| Open Chat | T | Gameplay | Also `/` opens chat with `/` prefilled |
| Open Command | / | Gameplay | |
| Screenshot | F2 | Misc | Saved to `screenshots/` |
| Toggle Perspective | F5 | Misc | Cycles 1st → 3rd back → 3rd front |
| Toggle HUD | F1 | Misc | |
| Debug Screen | F3 | Misc | Press with other keys for sub-features |
| Pause (singleplayer) | Esc | Misc | |
| Advancements | L | Misc | |
| Save Hotbar (Creative) | C | Creative | Saves current hotbar to file slot |
| Load Hotbar (Creative) | X | Creative | Restores from slot (1-9 prompts) |
| Spectator Teleport | (none default) | Misc | Press number keys in spectator to TP to player |
| Smooth Camera | (none default) | Misc | Cinematic-style camera |
| Fullscreen Toggle | F11 | Misc | |
| Open Social Menu | P | Multiplayer | |
| Push To Talk | (none) | Multiplayer | Voice chat (only with mod) |

### 4.5 F3 Debug Sub-Shortcuts

| Shortcut | Action |
|---|---|
| F3+A | Reload chunks |
| F3+B | Show entity hitboxes |
| F3+C | Copy location/teleport command (hold 6s to crash with stack trace) |
| F3+D | Clear chat |
| F3+G | Show chunk borders |
| F3+H | Show advanced item tooltips (item ID, durability, NBT) |
| F3+I | Copy block/entity data to clipboard |
| F3+N | Cycle gamemode (spectator ↔ last) — requires cheats |
| F3+P | Pause on lost focus toggle |
| F3+Q | Show all F3 shortcuts in chat |
| F3+T | Reload resources (textures, sounds, resource packs) |

---

## 5. Audio / Music Settings

All values stored as floats 0.0–1.0 in `options.txt`. UI shows 0–100%.

| Setting | key | Default | Description |
|---|---|---|---|
| Master Volume | `soundCategoryMaster` | `1.0` | Final mix multiplier |
| Music | `soundCategoryMusic` | `1.0` | Background music tracks |
| Ambient/Environment | `soundCategoryAmbient` | `1.0` | Cave drips, water flow, wind |
| Jukebox/Note Block | `soundCategoryRecord` | `1.0` | Music discs, note blocks |
| Weather | `soundCategoryWeather` | `1.0` | Rain, thunder |
| Blocks | `soundCategoryBlock` | `1.0` | Block placement, breaking, redstone ticks |
| Hostile Creatures | `soundCategoryHostile` | `1.0` | Monster sounds |
| Friendly Creatures | `soundCategoryNeutral` | `1.0` | Animals, villagers |
| Players | `soundCategoryPlayer` | `1.0` | Footsteps, hurt, attack |
| Records (voice/speech) | `soundCategoryVoice` | `1.0` | Voice (rarely used without mods) |
| Device Selector | (system) | OS default | Audio output device dropdown |
| Show Subtitles | `showSubtitles` | `false` | Toggles subtitle overlay for sounds |

### 5.1 Sound Event Format (Three.js)

Vanilla sounds are JSON-driven:

```json
{
  "block.stone.break": {
    "category": "block",
    "sounds": [
      "dig/stone1",
      "dig/stone2",
      "dig/stone3",
      "dig/stone4"
    ]
  }
}
```

Pick a random variant on play; apply `pitch` and `volume` multipliers from context (e.g., falling blocks pitch-shift). Categorize each event so the volume sliders above apply.

### 5.2 Subtitle System

When `showSubtitles` is true, every played sound emits a subtitle line `[Source] Event`. Lines stack from bottom-up and fade after 3 seconds. Direction is indicated by arrow prefix (`<` left, `>` right, `^`/`v` for vertical).

---

## 6. Language Settings

| Setting | key | Default | Notes |
|---|---|---|---|
| Selected Language | `lang` | `en_us` | Lowercase ISO code + region |
| Force Unicode Font | `forceUnicodeFont` | `false` | Renders text using Unicode font instead of ASCII bitmap |
| Right-to-Left | (auto) | false | Hebrew/Arabic auto-enable |

### 6.1 Supported Languages (Subset, 1.21 ships 65+)

| Code | Language |
|---|---|
| `en_us` | English (US) — default |
| `en_gb` | English (UK) |
| `en_ca` | English (Canada) |
| `zh_cn` | 简体中文 (Simplified Chinese) |
| `zh_tw` | 繁體中文 (Traditional Chinese) |
| `ja_jp` | 日本語 |
| `ko_kr` | 한국어 |
| `de_de` | Deutsch |
| `fr_fr` | Français |
| `es_es` | Español (España) |
| `es_mx` | Español (México) |
| `it_it` | Italiano |
| `pt_br` | Português (Brasil) |
| `pt_pt` | Português (Portugal) |
| `ru_ru` | Русский |
| `pl_pl` | Polski |
| `nl_nl` | Nederlands |
| `sv_se` | Svenska |
| `da_dk` | Dansk |
| `fi_fi` | Suomi |
| `no_no` | Norsk |
| `cs_cz` | Čeština |
| `tr_tr` | Türkçe |
| `ar_sa` | العربية (RTL) |
| `he_il` | עברית (RTL) |
| `hi_in` | हिन्दी |
| `th_th` | ไทย |
| `vi_vn` | Tiếng Việt |
| `uk_ua` | Українська |
| `id_id` | Bahasa Indonesia |
| `ms_my` | Bahasa Melayu |
| `el_gr` | Ελληνικά |

### 6.2 Language File Format

Vanilla stores translations in `assets/minecraft/lang/<code>.json` as flat key→string:

```json
{
  "options.video": "Video Settings...",
  "options.renderDistance": "Render Distance",
  "options.renderDistance.tiny": "2-4 chunks",
  "multiplayer.status.ping": "%sms"
}
```

For a clone, ship `en_us.json` as default; add others incrementally. Translation keys should be stable across versions.

---

## 7. Chat Settings

| Setting | key | Default | Range | Notes |
|---|---|---|---|---|
| Chat Visibility | `chatVisibility` | `0` (Full) | Full(0)/Commands Only(1)/Hidden(2) | Hides chat but server messages still arrive |
| Chat Colors | `chatColors` | `true` | bool | Strip §-color codes if off |
| Chat Links | `chatLinks` | `true` | bool | Make URLs clickable |
| Chat Link Prompt | `chatLinksPrompt` | `true` | bool | Show warning before opening external URL |
| Reduced Motion | `reducedDebugInfo` partially / `reducedMotion` (1.20+) | `false` | bool | Disables parallax/smooth camera shake |
| Chat Opacity | `chatOpacity` | `1.0` | 0.0–1.0 | Background opacity behind chat text |
| Text Opacity | `textOpacity` | `1.0` | 0.0–1.0 | Foreground text opacity |
| Line Spacing | `chatLineSpacing` | `0.0` | 0.0–1.0 | Extra px between chat lines |
| Command Suggestions | `commandSuggestions` | `true` | bool | Auto-complete popup when typing `/` |
| Only Show Server Chat | `onlyShowSecureChat` | `false` | bool | Filter messages without cryptographic signature |
| Chat Delay | `chatDelay` | `0.0` | 0.0–6.0 sec | Delay before incoming messages appear |
| Narrator | `narrator` | `0` | Off(0)/System(1)/Chat(2)/All(3) | Text-to-speech for system/chat messages |
| Toast Notification Time | (system) | — | — | How long achievement/connection toasts stay on screen |

### 7.1 Chat Visibility Modes

- **Full** — every message rendered in the chat HUD (bottom-left, fading after 10s, scrollback ~100 lines).
- **System Only** — only server/system messages; player chat hidden.
- **Hidden** — no chat rendering at all; messages still logged to `logs/latest.log`.

### 7.2 Secure Chat (1.19.1+)

Vanilla signs player chat with a cryptographic key from the player's Microsoft account. The chat HUD shows a colored icon: green = verified, yellow = modified, red = unverified. For a single-player clone, this entire subsystem can be omitted; document the omission clearly.

---

## 8. Accessibility Settings

Introduced in 1.18+, this menu consolidates motion-sensitivity and disability-relevant toggles.

| Setting | key | Default | Range | Description |
|---|---|---|---|---|
| Text Background | `textBackground` | `0` (Everywhere) | Everywhere(0)/Chat Only(1) | Where the chat bg rect renders |
| Text Background Opacity | `textBackgroundOpacity` | `0.5` | 0.0–1.0 | Opacity of chat background |
| Chat Delay | `chatDelay` | `0.0` | 0.0–6.0s | Delay incoming chat messages |
| Toast Notification Time | (in chat menu) | `1.0` | 0.0–10.0 | How long toast notifications (advancements, etc.) stay on screen |
| Auto Jump | `autoJump` | `false` | bool | Auto-jumps 1-block ledges |
| Sneak Toggle | `sneakMode` | `0` | Hold(0)/Toggle(1) | Toggle sneak instead of hold |
| Sprint Toggle | `sprintMode` | `0` | Hold(0)/Toggle(1) | Toggle sprint instead of hold |
| Distortion Effect Strength | `distortionEffectScale` | `1.0` | 0.0–1.0 | Nausea effect intensity (camera wobble) |
| Darkness Effect Strength | `darknessEffectScale` | `1.0` | 0.0–1.0 | Darkness effect pulse intensity |
| FOV Effect Scale | `fovEffectScale` | `1.0` | 0.0–1.0 | Sprint/fly FOV widening |
| Monochrome Logos | `monochromeLogo` | `false` | bool | Title screen logos in grayscale |
| Hide Light Opacity | `hideLightOpacity` | `false` | bool (1.21+) | Hides preview of light opacity in F3 |
| Panorama Scroll Speed | `panoramaSpeed` | `1.0` | 0.05–10.0 | Title screen panorama rotation speed |
| High Contrast | `highContrast` | `false` | bool | Boosts HUD colors for visibility |
| Narrator | `narrator` | `0` | Off(0)/System(1)/Chat(2)/All(3) | TTS narration |
| Notification Time | `notificationDisplayTime` | `1.0` | 0.0–10.0 | Multiplier for toast duration |
| Glowing Entities (colorblind) | (gamerule-ish) | — | — | Spectator outlines always visible |

### 8.1 Reduced Motion Pattern

When player sets `distortionEffectScale=0`, `fovEffectScale=0`, `panoramaSpeed=0.05`, `bobView=false`, the game becomes essentially static — this is the "reduced motion" preset for vestibular sensitivity.

---

## 9. Skin Settings

| Setting | Default | Notes |
|---|---|---|
| Skin Selection | Steve (default) | Can pick from uploaded skins, or Steve/Alex default |
| Player Model | Classic (4px arms) | Classic (Steve, 4px wide arms) vs Slim (Alex, 3px wide arms) |
| Cape | Server-side | Selected cape shown on player back |

### 9.1 Skin Layers (Toggle Each)

| Layer | Default ON | Notes |
|---|---|---|
| Hat (head overlay) | ON | Second 8×8×8 cube on head |
| Jacket (body overlay) | ON | Second 8×12×4 cuboid on torso |
| Left Sleeve | ON | Second 4×12×4 on left arm |
| Right Sleeve | ON | Second 4×12×4 on right arm |
| Left Pants Leg | ON | Second 4×12×4 on left leg |
| Right Pants Leg | ON | Second 4×12×4 on right leg |
| Cape | ON (if equipped) | 10×16 cape plane |

### 9.2 Skin Texture Format (64×64 PNG)

| Region | Pixels | Body Part |
|---|---|---|
| 0,0 to 64,32 | top half | Head + body + arms + legs (outer layers) |
| 0,32 to 64,64 | bottom half | Inner layers (hat, jacket, sleeves, pants) + cape area |

UV layout in vanilla:
- Head: top (8,0,8,8), bottom (16,0,8,8), right (0,8,8,8), front (8,8,8,8), left (16,8,8,8), back (24,8,8,8)
- Body: top (20,16,8,4), bottom (28,16,8,4), right (16,20,4,12), front (20,20,8,12), left (28,20,4,12), back (32,20,8,12)
- Arms (Classic 4px wide): top (44,16,4,4), front (48,20,4,12), etc.
- Arms (Slim 3px wide): top (44,16,3,4), front (48,20,3,12), etc.

---

## 10. Server / Network Settings

Less relevant for a single-player clone, but documented for parity.

| Setting | Default | Notes |
|---|---|---|
| Server Resource Packs | `Prompt` | Prompt / Always / Never — whether to download server-offered resource packs |
| Chat Throttling | `0.5` (server-side) | Server enforces 1 msg/0.5s per player |
| Server-side Lag Compensation | (server impl) | Vanilla MC has minimal lag comp; combat is server-authoritative |
| View Distance (server) | `10` | Server-set cap; client render distance capped by this |
| Simulation Distance (server) | `10` | Distance at which entities tick and crops grow |
| Network Compression Threshold | `256` bytes | Packets >256 bytes compressed with zlib |
| Enable Query | `false` | UDP query protocol for server browsers |
| Enable RCON | `false` | Remote console admin |

---

## 11. Telemetry / Data Collection

Vanilla sends anonymous telemetry to Mojang. A clone should make this **opt-in only**.

| Level | ID | What's Sent |
|---|---|---|
| **Minimal** | `0` | Game version, session count, OS arch |
| **Minimal + Performance** | `1` | Above + avg FPS, frame timings, render distance |
| **All** | `2` | Above + world load times, crash counts, feature usage |

Server pings also send a small identifier to the server list when refreshing. Disable when privacy-conscious.

### 11.1 Telemetry Implementation Pattern

```ts
// Default: minimal, opt-in via prompt
type TelemetryLevel = 0 | 1 | 2;
let telemetryLevel: TelemetryLevel = 0; // minimal by default

function sendTelemetry(event: TelemetryEvent) {
  if (event.minLevel > telemetryLevel) return;
  navigator.sendBeacon("/telemetry", JSON.stringify(event));
}
```

---

## 12. Resource Packs

### 12.1 Built-in Default Pack

Vanilla ships `Programmer Art` (legacy textures) as a toggle-able resource pack alongside the default 1.21 textures. A clone should ship the same: a default pack + optional "legacy" pack.

### 12.2 Pack Format

| Pack format ID | Minecraft Version |
|---|---|
| 22 | 1.19.4 |
| 18 | 1.20.x |
| 34 | 1.21–1.21.1 |
| 42 | 1.21.2–1.21.3 |
| 46 | 1.21.4 |
| 55 | 1.21.5–1.21.6 |
| 64+ | 1.21.7+ |

### 12.3 `pack.mcmeta` Schema

```json
{
  "pack": {
    "pack_format": 46,
    "description": "My Resource Pack",
    "supported_formats": [34, 46]
  }
}
```

### 12.4 Folder Structure

```
my_pack.zip
├── pack.mcmeta
├── pack.png                          (thumbnail, 64×64)
└── assets/
    └── minecraft/
        ├── textures/
        │   ├── block/                (stone.png, dirt.png, ...)
        │   ├── item/                 (sword.png, ...)
        │   ├── entity/               (pig.png, etc.)
        │   ├── gui/                  (inventory_bg.png, widgets.png, hearts.png, etc.)
        │   ├── environment/          (clouds.png, rain.png, snow.png, sun.png, moon.png)
        │   ├── particle/             (generic_0.png, etc.)
        │   └── mob_effect/           (speed.png, etc.)
        ├── sounds/                   (dig/stone1.ogg, etc.)
        ├── lang/                     (en_us.json, zh_cn.json, ...)
        ├── models/
        │   ├── block/                (stone.json, leaves.json, etc.)
        │   ├── item/
        │   └── entity/
        ├── blockstates/              (stone.json, furnace.json, etc.)
        ├── shaders/                  (post/reload.json, etc.)
        ├── atlases/                  (1.20+ atlas definitions)
        └── font/                     (default.json, ascii.png, etc.)
```

### 12.5 Atlas System (1.20+)

Instead of every texture being a separate file loaded into one auto-generated atlas, vanilla 1.20+ uses explicit atlas definitions:

```json
// assets/minecraft/atlases/blocks.json
{
  "sources": [
    { "type": "single", "resource": "minecraft:block/stone" },
    { "type": "directory", "source": "block", "prefix": "block/" }
  ]
}
```

For a Three.js clone, recommend: pre-bake all block textures into a single 1024×1024 or 2048×2048 atlas at build time, expose UV offsets per block ID.

---

## 13. World Creation Settings

The "Create World" screen exposes the following options.

### 13.1 Basic Options

| Field | Default | Notes |
|---|---|---|
| World Name | `New World` | Free text |
| Game Mode | Survival | Survival / Creative / Adventure / Spectator |
| Difficulty | Normal | Peaceful / Easy / Normal / Hard |
| Allow Cheats | OFF | Enables commands (`/gamemode`, `/give`, `/tp`, etc.) |
| Hardcore | OFF | Locks difficulty to Hard; death = spectator; world deletes on death (optional prompt) |

### 13.2 World Type

| World Type | Code | Notes |
|---|---|---|
| Default | `minecraft:normal` | Standard 1.21 terrain |
| Large Biomes | `minecraft:large_biomes` | Same terrain, biomes 16× larger |
| Amplified | `minecraft:amplified` | Vertical exaggeration; very mountainous |
| Single Biome | `minecraft:single_biome` | Whole world is one biome (set via `biome` field) |
| Superflat | `minecraft:flat` | Flat world with customizable layers |
| Debug Mode | `minecraft:debug_all_block_states` | Every block state shown in grid (creative use only) |

### 13.3 More World Options

| Field | Default | Notes |
|---|---|---|
| World Seed | Random | Blank = random; can be text or numeric (text hashed to long) |
| Generate Structures | ON | Villages, strongholds, monuments, etc. |
| Bonus Chest | OFF | Spawns a chest with starting items near spawn |
| World Generation Customization | — | (1.18+ simplified; presets only) |
| Superflat Layer Specification | `3;minecraft:bedrock,2*minecraft:dirt,minecraft:grass_block;1;village` | Format: `biome_version;layer_list;biome_id;structures` |
| Data Pack Selection | — | Choose data packs at world creation |
| World Save Directory Name | `<world_name>` sanitized | Alphanumeric + underscore; cannot conflict with existing |

### 13.4 Game Mode Definitions

| Mode | Player Damage | Hunger | Can Break Blocks | Can Fly | Can Use `/give` |
|---|---|---|---|---|---|
| Survival | Yes | Yes | Yes (with tools) | No | Only with cheats |
| Creative | No | No (always full) | Yes (instant) | Yes | Yes |
| Adventure | Yes | Yes | No (only with `CanDestroy` tag) | No | Only with cheats |
| Spectator | No | No | No | Yes (no clip through blocks) | No (only `/tp`) |

### 13.5 Difficulty Differences

| Aspect | Peaceful | Easy | Normal | Hard |
|---|---|---|---|---|
| Hostile mob spawn | No | Yes | Yes | Yes |
| Hunger drain | No | Slow | Medium | Fast |
| Starvation damage | No | Halves health | To 1 HP | Death |
| Zombie breaks doors | No | No | Yes (Hardwood only) | Yes (any wood) |
| Zombie reinforcements | No | No | Yes | Yes |
| Mob damage multiplier | 0× | 0.5× | 1× | 1.5× |
| Wither spawn | No | Yes | Yes | Yes |
| Pillager patrols | No | Yes | Yes | Yes |

---

## 14. In-Game Options (Pause Menu)

Pressing `Esc` opens the pause menu (in single-player, time freezes).

### 14.1 Pause Menu Items

| Item | Action |
|---|---|
| Back to Game | Resumes |
| Achievements / Advancements | Opens advancement tree |
| Statistics | Opens player stats (blocks broken, distance walked, mobs killed, etc.) |
| Player Reporting | (Multiplayer only) Report chat to server/mods |
| Open to LAN | Hosts single-player world on LAN; allows others to join |
| Options | Opens Options screen |
| Save and Quit to Title | Saves world and returns to title |

### 14.2 Open to LAN Settings

When opening a single-player world to LAN, the player chooses:

| Setting | Default | Notes |
|---|---|---|
| Game Mode | Current | Survival/Creative/Adventure; spectators allowed always |
| Allow Cheats | Current (cheats setting) | If ON, all joining players get op |
| Port | Random 4-digit (49152–65535) | Default random in dynamic range |
| MOTD | "<Player>'s Local Game" | Server browser name |

### 14.3 In-Game Commands (cheats enabled)

The most-used commands available via `/`:

| Command | Effect |
|---|---|
| `/gamemode survival\|creative\|adventure\|spectator` | Switch player mode |
| `/difficulty peaceful\|easy\|normal\|hard` | Switch difficulty (single-player) |
| `/time set day\|night\|<value>` | Set world time |
| `/time add <value>` | Advance time |
| `/gamerule <rule> <value>` | Modify gamerule (see Section 15) |
| `/weather clear\|rain\|thunder` | Set weather |
| `/tp <player> <x> <y> <z>` | Teleport |
| `/give <player> <item> <count>` | Spawn items |
| `/summon <entity> <x> <y> <z>` | Spawn entity |
| `/kill @e[type=!player]` | Kill all non-player entities |
| `/setblock <x> <y> <z> <block>` | Place block |
| `/fill <x1> <y1> <z1> <x2> <y2> <z2> <block>` | Fill cuboid |
| `/clone <x1> <y1> <z1> <x2> <y2> <z2> <x> <y> <z>` | Copy region |
| `/effect give <player> <effect> <duration> <amplifier>` | Apply status effect |
| `/seed` | Print world seed |
| `/locate structure <type>` | Locate nearest structure |
| `/spawnpoint <player> <x> <y> <z>` | Set spawn |
| `/xp <amount> <player>` | Give XP |

---

## 15. Gamerules

Gamerules are per-world toggles stored in `level.dat` under `Data/GameRules/<RuleName>`. They affect gameplay on both single-player and multiplayer.

### 15.1 Boolean Gamerules

| Rule | Default | Description |
|---|---|---|
| `announceAdvancements` | `true` | Broadcast advancement to chat |
| `commandBlockOutput` | `true` | Command block output to chat |
| `disableElytraMovementCheck` | `false` | Skip elytra speed check |
| `disableRaids` | `false` | Disable raids |
| `doDaylightCycle` | `true` | Day/night cycle advances |
| `doEntityDrops` | `true` | Non-mob entities drop items (minecarts, boats, items) |
| `doFireTick` | `true` | Fire spreads & burns blocks |
| `doImmediateRespawn` | `false` | Skip death screen |
| `doInsomnia` | `true` | Phantoms spawn when player sleepless |
| `doLimitedCrafting` | `false` | Player can only craft unlocked recipes |
| `doMobLoot` | `true` | Mobs drop loot on death |
| `doMobSpawning` | `true` | Natural mob spawning |
| `doPatrolSpawning` | `true` | Pillager patrols spawn |
| `doTileDrops` | `true` | Blocks drop items when broken |
| `doTraderSpawning` | `true` | Wandering traders spawn |
| `doWardenSpawning` | `true` | Wardens can emerge |
| `doWeatherCycle` | `true` | Weather changes |
| `drowningDamage` | `true` | Players take drowning damage |
| `fallDamage` | `true` | Players take fall damage |
| `fireDamage` | `true` | Players take fire/lava damage |
| `forgiveDeadPlayers` | `true` | Neutral mobs calm when their target dies |
| `freezeDamage` | `true` | Powder snow damages entities |
| `keepInventory` | `false` | Items retained on death |
| `logAdminCommands` | `true` | Log admin commands to server log |
| `mobGriefing` | `true` | Mobs modify blocks (creeper explosions, enderman pick-up) |
| `naturalRegeneration` | `true` | Players regen HP when hunger ≥ 18 |
| `reducedDebugInfo` | `false` | F3 shows less info |
| `sendCommandFeedback` | `true` | Show command execution messages |
| `showDeathMessage` | `true` | Show death message in chat |
| `spectatorsGenerateChunks` | `true` | Spectators force-load chunks |
| `universalAnger` | `false` | Neutral mobs aggro all players |
| `doImmediateRespawn` | `false` | Skip death screen |
| `showTags` | `true` | Show item NBT in tooltip (deprecated 1.20.5+) |

### 15.2 Integer Gamerules

| Rule | Default | Range | Description |
|---|---|---|---|
| `maxEntityCramming` | `24` | 0+ | Entities in 1 block before cramming damage |
| `randomTickSpeed` | `3` | 0–1024 | Blocks per subchunk per tick for random ticks (crops, leaf decay, etc.) |
| `spawnRadius` | `10` | 0–128 | Blocks from world spawn a player can spawn |
| `maxCommandChainLength` | `65536` | 0+ | Max chained command blocks per tick |
| `maxCommandForkCount` | `65536` | 0+ | Max forked commands (1.20+) |

### 15.3 Per-World Storage (Three.js)

```ts
// world.dat equivalent — JSON for our purposes
interface WorldData {
  worldName: string;
  seed: string;
  gameMode: GameMode;
  difficulty: Difficulty;
  difficultyLocked: boolean;
  hardcore: boolean;
  cheatsAllowed: boolean;
  gamerules: Record<string, boolean | number>;
  spawnPoint: { x: number; y: number; z: number };
  time: number;          // ticks 0-24000
  dayTime: number;       // same as time unless paused
  weather: "clear" | "rain" | "thunder";
  weatherTime: number;   // ticks remaining in current weather
  stats: PlayerStats;
  advancements: Record<string, AdvancementState>;
  player: PlayerState;   // inventory, health, hunger, pos, etc.
}
```

---

## 16. Three.js Implementation Notes

### 16.1 Settings UI Structure

Recommended tab layout matching vanilla:

```
Options
├── Video Settings...
│   ├── Graphics Quality (Fast/Fancy/Fabulous)
│   ├── Render Distance slider (2-32)
│   ├── Smooth Lighting dropdown (OFF/MIN/MAX)
│   ├── Max Framerate slider
│   ├── VSync toggle
│   ├── View Bobbing toggle
│   ├── GUI Scale dropdown
│   ├── Attack Indicator dropdown
│   ├── Brightness slider (Moody-Bright)
│   ├── Clouds dropdown (OFF/Fast/Fancy)
│   ├── Fullscreen toggle
│   ├── Particles dropdown (Minimal/Decreased/All)
│   ├── Mipmap Levels slider (0-4)
│   ├── Entity Shadows toggle
│   ├── Volumetric Clouds toggle
│   ├── Biome Blend slider (0-15)
│   ├── Entity Distance slider (50-500%)
│   ├── FOV slider (30-110)
│   ├── FOV Effect slider (0-100%)
│   └── [Show debug info / Done]
├── Controls...
│   ├── Mouse Settings (sensitivity, invert, raw input, etc.)
│   ├── Key Bindings (table per category)
│   └── Auto Jump, Sneak/Sprint Mode toggles
├── Music & Sounds...
│   ├── Master Volume
│   ├── Music Volume
│   ├── 10 sub-category sliders
│   ├── Audio Device dropdown
│   └── Show Subtitles toggle
├── Language...
│   └── Language list (searchable), Force Unicode toggle
├── Chat Settings...
│   └── (see Section 7)
├── Accessibility Settings...
│   └── (see Section 8)
├── Skin Customization...
│   └── Layer toggles + Model dropdown
├── Resource Packs...
│   └── Drag-and-drop pack list
└── Server Options... (multiplayer)
```

### 16.2 Default Settings (mirror vanilla 1.21.4 exactly)

```ts
const DEFAULT_OPTIONS: MinecraftOptions = {
  // Video
  graphicsMode: 1,           // Fancy
  renderDistance: 12,
  ao: 2,                     // MAX smooth lighting
  framerateLimit: 120,
  enableVsync: false,
  bobView: true,
  guiScale: 0,               // Auto
  attackIndicator: 1,        // Crosshair
  gamma: 0.5,
  renderClouds: "true",      // Fancy
  fullscreen: false,
  particles: 2,              // All
  mipmapLevels: 4,
  entityShadows: true,
  biomeBlendRadius: 2,
  entityDistanceScaling: 1.0,
  fov: 70,
  fovEffectScale: 1.0,
  darknessEffectScale: 1.0,
  distortionEffectScale: 1.0,
  panoramaSpeed: 1.0,
  menuBackgroundBlurriness: 5,

  // Mouse / Controls
  mouseSensitivity: 0.5,
  invertYMouse: false,
  touchscreen: false,
  rawMouseInput: true,
  mouseWheelSensitivity: 1.0,
  discrete_mouse_scroll: false,
  autoJump: false,
  sneakMode: 0,              // Hold
  sprintMode: 0,             // Hold

  // Audio (all 1.0)
  soundCategoryMaster: 1.0,
  soundCategoryMusic: 1.0,
  soundCategoryAmbient: 1.0,
  soundCategoryRecord: 1.0,
  soundCategoryWeather: 1.0,
  soundCategoryBlock: 1.0,
  soundCategoryHostile: 1.0,
  soundCategoryNeutral: 1.0,
  soundCategoryPlayer: 1.0,
  soundCategoryVoice: 1.0,
  showSubtitles: false,

  // Language
  lang: "en_us",
  forceUnicodeFont: false,

  // Chat
  chatVisibility: 0,         // Full
  chatColors: true,
  chatLinks: true,
  chatLinksPrompt: true,
  chatOpacity: 1.0,
  textOpacity: 1.0,
  chatLineSpacing: 0.0,
  commandSuggestions: true,
  onlyShowSecureChat: false,
  chatDelay: 0.0,
  narrator: 0,               // Off

  // Accessibility
  textBackground: 0,
  textBackgroundOpacity: 0.5,
  monochromeLogo: false,
  hideLightOpacity: false,
  highContrast: false,
  notificationDisplayTime: 1.0,

  // Skin (layers all on)
  modelSlim: false,
  showHat: true,
  showJacket: true,
  showLeftSleeve: true,
  showRightSleeve: true,
  showLeftPants: true,
  showRightPants: true,
  showCape: true,

  // Telemetry
  telemetryLevel: 0,         // Minimal
};
```

### 16.3 Hot-Swap Rules

| Setting | Hot-Swap Behavior |
|---|---|
| Render Distance | Trigger chunk unload + reload cycle (queue new chunks, dequeue out-of-range) |
| Graphics Mode | Re-mesh all loaded chunks (Fast ↔ Fancy changes leaf meshing) |
| Smooth Lighting | Re-mesh all loaded chunks (changes per-vertex color data) |
| Mipmap Levels | Re-upload all textures with new mip chain |
| Clouds | Toggle cloud mesh only |
| Particles | Cap on spawn rate; existing particles persist |
| Entity Distance | Affects future entity cull checks |
| Gamma / Brightness | Pass as uniform; no re-mesh |
| FOV | Update camera immediately |
| GUI Scale | Re-layout HUD immediately |
| Resource Pack | Full asset reload (textures, sounds, models) |

### 16.4 Per-World vs. Global Storage

| Stored where? | Examples |
|---|---|
| Global (localStorage) | All `options.txt`-style settings |
| Per-world save | GameMode, Difficulty, Gamerules, World Seed, Spawn Point, Time, Weather, Player Inventory, Advancements |
| Per-session (memory only) | F3 debug state, F1 hide HUD state, F5 perspective state, hotbar number last selected |

### 16.5 Recommended Approach for Settings UI in Three.js

1. Use a separate DOM overlay (`<div id="options-overlay">`) for menus, not in-world HUD. Three.js renders the world; HTML/CSS renders menus. Vanilla uses a custom immediate-mode GUI; for our clone, HTML is faster to build and more accessible.
2. Persist settings to `localStorage` on every change (debounced 250ms).
3. Use a settings event bus:

```ts
class SettingsEvents {
  private bus = new EventTarget();
  on(key: keyof MinecraftOptions, cb: (v: any) => void) {
    this.bus.addEventListener(`settings:${key}`, (e: any) => cb(e.detail));
  }
  emit(key: keyof MinecraftOptions, value: any) {
    this.bus.dispatchEvent(new CustomEvent(`settings:${key}`, { detail: value }));
  }
}
```

4. Sub-systems subscribe: `ChunkManager` listens to `renderDistance` and `graphicsMode`; `Renderer` listens to `gamma`, `fov`, `vsync`; `AudioSystem` listens to all `soundCategory_*`; etc.
5. Settings screen reads/writes through a single `SettingsService` that handles persistence and dispatch.

### 16.6 World Save Format (Simplified)

```ts
interface WorldSave {
  version: number;             // save format version
  levelName: string;
  worldName: string;
  seed: string;
  generator: "minecraft:normal" | "minecraft:flat" | "minecraft:large_biomes" | "minecraft:amplified" | "minecraft:single_biome";
  generatorOptions?: any;      // for superflat layer spec, single biome choice, etc.
  gameMode: number;            // 0..3
  difficulty: number;          // 0..3
  difficultyLocked: boolean;
  hardcore: boolean;
  cheatsAllowed: boolean;
  gamerules: Record<string, boolean | number>;
  spawnX: number; spawnY: number; spawnZ: number;
  time: number;                // 0..24000
  day: number;                 // total days elapsed
  weather: "clear" | "rain" | "thunder";
  weatherTime: number;
  player: {
    pos: [number, number, number];
    rot: [number, number];
    dimension: "overworld" | "nether" | "end";
    health: number;
    hunger: number;
    saturation: number;
    exhaustion: number;
    xp: number;
    xpLevel: number;
    inventory: ItemStack[];
    enderChest: ItemStack[];
    effects: { id: string; duration: number; amplifier: number; ambient: boolean }[];
  };
  chunks: Map<string, ChunkData>; // keyed "x,z"
  stats: Record<string, number>;
  advancements: Record<string, { done: boolean; progress: Record<string, number> }>;
}
```

For browser, serialize as `IndexedDB` blob keyed by world UUID; chunk data can be stored per-chunk for partial loading.

---

## Appendix A — Default `options.txt` Snapshot

Below is a faithful reconstruction of the default `options.txt` Minecraft 1.21.4 writes on first launch. Format is `key:value` (colon separator; booleans lowercase; integers bare; strings quoted only if they contain special chars).

> **Note:** Vanilla `options.txt` is rewritten on every change and accumulates keys across versions. Below is the subset relevant to a clone. Keys prefixed `key_` are keybindings stored inline (one line per bind). All audio categories use the `soundCategory_<name>` prefix and store floats 0.0–1.0. Skin layers use the `modelPart_<part>` prefix.

### A.1 Default `options.txt` (vanilla 1.21.x)

The following is the realistic vanilla defaults a clone should match:

```
version:3420
autoJump:false
operatorItemsTab:false
mouseSensitivity:0.5
mouseWheelSensitivity:1.0
discrete_mouse_scroll:false
invertYMouse:false
rawMouseInput:true
touchscreen:false
fov:0.8765432
fovEffectScale:1.0
screenEffectScale:1.0
distortionEffectScale:1.0
darknessEffectScale:1.0
renderDistance:12
simulationDistance:10
entityDistanceScaling:1.0
gamma:0.5
renderClouds:"true"
graphicsMode:1
ao:2
biomeBlendRadius:2
renderEntityShadows:true
defaultFont:0
forceUnicodeFont:false
framerateLimit:120
enableVsync:false
bobView:true
guiScale:0
particles:2
mipmapLevels:4
chatVisibility:0
chatOpacity:1.0
chatLineSpacing:0.0
textOpacity:1.0
textBackground:0
textBackgroundOpacity:0.5
narrator:0
showSubtitles:false
soundCategory_master:1.0
soundCategory_music:1.0
soundCategory_record:1.0
soundCategory_weather:1.0
soundCategory_block:1.0
soundCategory_hostile:1.0
soundCategory_neutral:1.0
soundCategory_player:1.0
soundCategory_ambient:1.0
soundCategory_voice:1.0
modelPart_cape:true
modelPart_jacket:true
modelPart_left_sleeve:true
modelPart_right_sleeve:true
modelPart_left_pants_leg:true
modelPart_right_pants_leg:true
modelPart_hat:true
mainHand:right
attackIndicator:1
chatColors:true
chatLinks:true
chatLinksPrompt:true
showBackgroundOverlay:true
highContrast:false
panoramaSpeed:1.0
menuBackgroundBlurriness:5
hideLightOpacity:false
syncChunkWrites:true
useNativeLauncherFullscreen:true
fullscreen:false
lang:en_us
snooperDisabled:true
skipMultiplayerWarning:false
hideBundleTutorial:false
autoSuggestions:true
heldItemTooltips:true
advancedItemTooltips:false
pauseOnLostFocus:true
```

---

## Appendix B — Default Keybindings (1.21.x)

Comprehensive table for reference.

### B.1 Movement

| Action | Default Key | Identifier |
|---|---|---|
| Forward | W | `key.forward` |
| Backward | S | `key.back` |
| Strafe Left | A | `key.left` |
| Strafe Right | D | `key.right` |
| Jump | Space | `key.jump` |
| Sneak | Left Shift | `key.sneak` |
| Sprint | Left Ctrl | `key.sprint` |

### B.2 Gameplay

| Action | Default Key | Identifier |
|---|---|---|
| Attack | LMB | `key.attack` |
| Use Item | RMB | `key.use` |
| Pick Block | MMB | `key.pickItem` |
| Drop Item | Q | `key.drop` |
| Open Inventory | E | `key.inventory` |
| Swap Off-Hand | F | `key.swapOffhand` |
| Open Chat | T | `key.chat` |
| Open Command | / | `key.command` |
| Command UI | (none) | `key.commandUI` (1.21+) |
| Toggle Narrator | B | `key.toggleNarrator` |
| Player List | Tab | `key.playerlist` |
| Social Menu | P | `key.socialInteractions` |
| Screenshot | F2 | `key.screenshot` |
| Advancements | L | `key.advancements` |
| Toggle Perspective | F5 | `key.togglePerspective` |
| Toggle HUD | F1 | `key.togglePerspective`* (F1 has no internal binding — hardcoded) |
| Debug Screen | F3 | `key.loadToolbarActivator`* (F3 hardcoded) |
| Smooth Camera | (none) | `key.smoothCamera` |
| Fullscreen | F11 | `key.fullscreen` |
| Spectator Outlines | (none) | `key.spectatorOutlines` |

### B.3 Hotbar

| Action | Default Key | Identifier |
|---|---|---|
| Hotbar 1 | 1 | `key.hotbar.1` |
| Hotbar 2 | 2 | `key.hotbar.2` |
| Hotbar 3 | 3 | `key.hotbar.3` |
| Hotbar 4 | 4 | `key.hotbar.4` |
| Hotbar 5 | 5 | `key.hotbar.5` |
| Hotbar 6 | 6 | `key.hotbar.6` |
| Hotbar 7 | 7 | `key.hotbar.7` |
| Hotbar 8 | 8 | `key.hotbar.8` |
| Hotbar 9 | 9 | `key.hotbar.9` |

### B.4 Creative

| Action | Default Key | Identifier |
|---|---|---|
| Save Hotbar | C | `key.saveToolbarActivator` |
| Load Hotbar | X | `key.loadToolbarActivator` |

### B.5 Notes on Hardcoded Keys

- **F1** (Hide HUD) — not in `options.txt`; hardcoded.
- **F3** (Debug Screen) — not in `options.txt`; hardcoded. All F3+`X` combos are hardcoded.
- **F4** — Used for spotlight/render menu in some debug contexts (1.21+).
- **Esc** — Pause menu; hardcoded.
- **Tab** — Player list (multiplayer); rebindable.

### B.6 Mouse Buttons

| Identifier | Default |
|---|---|
| `key.attack` | `key.mouse.left` |
| `key.use` | `key.mouse.right` |
| `key.pickItem` | `key.mouse.middle` |

Vanilla also supports `key.mouse.4` and `key.mouse.5` (side buttons) for rebindings; on Linux/macOS these may or may not be detected depending on driver.

---

## End of Document

This reference covers every option screen, gamerule, and world-creation parameter in Minecraft Java 1.21.x. Downstream prompt-kit sections (engine design, rendering pipeline, save format) can reference this file for exact default values and option names.

**Next actions for the AI building the clone:**
1. Implement `SettingsService` with `localStorage` persistence (Section 16.5).
2. Build the Options UI with the tab layout in Section 16.1.
3. Wire each sub-system to the settings event bus (Section 16.5).
4. Implement world-save gamerules (Section 15) per-world.
5. Default every setting to the values in Appendix A.1 to match vanilla feel.
