# Minecraft Dimensions Reference — Java Edition 1.21.x

> Scope: Complete documentation of all three dimensions in Minecraft Java Edition 1.21.x —
> **Overworld**, **The Nether**, and **The End** — for use as the canonical dimension
> reference in a Three.js-based Minecraft clone prompt kit.
>
> Target audience: Engine implementers building chunk management, portal logic, sky
> rendering, weather, time, and boss-fight systems. Numerical values are exact where
> possible; behavioral rules are normative per 1.21 vanilla.

---

## Table of Contents

1. [Dimension System Overview](#1-dimension-system-overview)
2. [Dimension Type Properties](#2-dimension-type-properties)
3. [Overworld Deep-Dive](#3-overworld-deep-dive)
4. [The Nether Deep-Dive](#4-the-nether-deep-dive)
5. [The End Deep-Dive](#5-the-end-deep-dive)
6. [Portal Mechanics Deep-Dive](#6-portal-mechanics-deep-dive)
7. [Multi-Dimension World Persistence](#7-multi-dimension-world-persistence)
8. [Three.js Implementation Notes](#8-threejs-implementation-notes)
9. [Appendix A — Dimension Type JSON Examples](#appendix-a--dimension-type-json-examples)
10. [Appendix B — Coordinate Mapping Reference](#appendix-b--coordinate-mapping-reference)

---

## 1. Dimension System Overview

Minecraft's world is composed of **three independent dimensions** (also called "world
generator dimensions" in 1.21.x). Each dimension is essentially a parallel universe with
its own terrain, biome grid, mob population, sky, lighting rules, and time. Players
travel between them using portal blocks.

### 1.1 Core Architecture

- **Separate chunk grids.** Each dimension has its own chunk grid that does not spatially
  overlap with the others. Chunk `(0,0)` in the Overworld, Nether, and End are three
  completely different physical locations.
- **Separate world seeds (derived).** A Minecraft world has a single master seed, but
  each dimension derives its own terrain/biome seed from it via a hashing scheme. This
  means the Overworld seed does **not** predict Nether terrain — they are independently
  sampled. (Datapacks can override these per-dimension with `minecraft:overworld`,
  `minecraft:nether`, `minecraft:end` noise settings.)
- **Independent time.** Each dimension tracks its own `day_time` and `sky_darkness`
  values. The End and Nether effectively ignore the day/night cycle for sky rendering,
  but internally each dimension has a clock.
- **Shared player state.** Player inventory, health, hunger, XP, potion effects, and
  advancement/recipe progression are **global** across dimensions — they persist when you
  cross a portal. Only position, rotation, and velocity are per-dimension.
- **Teleportation between dimensions.** Crossing is instantaneous from the player's
  perspective but involves a 1-second "portal cooldown" (`DimensionType` portal cooldown
  of 300 ticks = 15 seconds in 1.21; the on-screen nausea animation lasts ~2s). During
  the transition, the client unloads one dimension's chunks and loads the destination's.

### 1.2 Per-Dimension World Directories (Disk Layout)

Vanilla saves each dimension as a separate sub-folder inside the world save directory:

```
<world>/
  region/            # Overworld chunks (anvil .mca)
  entities/          # Overworld block entities
  DIM-1/
    region/          # Nether chunks
    entities/
  DIM1/
    region/          # End chunks
    entities/
  level.dat          # master world data + per-dimension derived seeds
```

Custom dimensions from datapacks go under `dimensions/<namespace>/<path>/`.

### 1.3 Why Three Dimensions?

| Dimension   | Thematic role                         | Required portals to reach               |
|-------------|---------------------------------------|-----------------------------------------|
| Overworld   | Surface world, survival starting zone | (start here)                            |
| The Nether  | Hellish underground, fast-travel hub  | Nether portal (obsidian frame)          |
| The End     | Void islands, endgame boss arena      | End portal (stronghold, with eyes)      |

The Nether doubles as a "fast-travel" mechanic via its 8:1 coordinate scale (see §4.5).

---

## 2. Dimension Type Properties

Each dimension is defined by a **Dimension Type** JSON (`data/minecraft/dimension_type/...`).
These flags govern physics, lighting, sky, and spawn rules. The full property list as of
1.21.x:

### 2.1 Property Reference

| Property                          | Type / Values                                | Description                                                                                            |
|-----------------------------------|----------------------------------------------|--------------------------------------------------------------------------------------------------------|
| `ultrawarm`                       | bool                                         | If true, water evaporates, lava flows faster, and the dimension is "hot". Nether=true.                 |
| `natural`                         | bool                                         | If true, portals can be created naturally and compasses point to world spawn. Overworld=true.          |
| `coordinate_scale`                | double (1.0 or 8.0)                          | Multiplier when converting coords across portals. Nether=8.0, others=1.0.                              |
| `has_skylight`                    | bool                                         | If true, sky light propagates from above. Overworld=true; Nether & End=false.                          |
| `has_ceiling`                     | bool                                         | If true, dimension has a bedrock ceiling at top. Nether=true.                                          |
| `min_y`                           | int (multiple of 16, ≥ -2032)                | Minimum Y of the dimension buildable area. Overworld=-64; Nether=0; End=0 (1.21).                       |
| `height`                          | int (multiple of 16, ≤ 4064)                 | Total height in blocks. Overworld=384; Nether=384 (1.18+, was 256 before); End=256.                     |
| `logical_height`                  | int (≤ height)                               | Max Y for certain player mechanics (e.g. piston push limits, mob spawning scan). Usually = height.     |
| `infiniburn`                      | block tag                                    | Blocks that burn forever (Nether `#minecraft:infiniburn_overworld`; nether/end use nether variant).    |
| `effects`                         | string (`overworld`, `the_nether`, `the_end`) | Controls sky/fog/cloud rendering and ambient sound. Custom datapack names allowed.                    |
| `ambient_light`                   | float 0.0–1.0                                | Minimum ambient light level (skylight-independent). Nether=0.1; End=0.0; Overworld=0.0.                |
| `fixed_time`                      | long (optional)                              | If set, time is pinned to this tick value (e.g. End=6000 = noon). Nether also fixed to 18000.         |
| `monster_spawn_light_level`       | int or value transformer                     | Max skylight under which monsters can spawn in darkness. Overworld=7 (with moon phase modifier).      |
| `monster_spawn_block_light_limit` | int                                          | Max block light at a spawn position for monsters. Default 0 (i.e., must be dark).                      |
| `piglin_safe`                     | bool                                         | If true, piglins don't zombify. Nether=true; others=false.                                             |
| `bed_works`                       | bool                                         | If true, beds can be slept in. Overworld=true; Nether/End=false (beds explode).                        |
| `respawn_anchor_works`            | bool                                         | If true, respawn anchors can set spawn. Nether=true; others=false (anchors explode).                   |
| `has_raids`                       | bool                                         | If true, raids can trigger (village pillager raids). Overworld=true; Nether/End=false.                 |
| `has_precipitation`               | bool                                         | If true, weather (rain/snow) happens. Overworld=true; Nether/End=false.                                |
| `temperature`                     | float (deprecated in 1.21)                   | Legacy climate modifier; superseded by biome temperature.                                              |

### 2.2 The Three Vanilla Dimension Types (1.21.x)

```
Dimension Type       min_y  height  logical  coord_scale  sky  ceil  natural  ultrawarm  bed  anchor  raids  rain  fixed_time  piglin_safe
minecraft:overworld   -64     384     384        1.0        ✓    ✗      ✓         ✗         ✓     ✗       ✓      ✓      (none)        ✗
minecraft:the_nether    0     384     384        8.0        ✗    ✓      ✗         ✓         ✗     ✓       ✗      ✗      18000         ✓
minecraft:the_end       0     256     256        1.0        ✗    ✗      ✗         ✗         ✗     ✗       ✗      ✗      6000          ✗
```

### 2.3 Effective Y Ranges (buildable space)

| Dimension | Buildable Y     | Sea / ground reference | Notes                                                                |
|-----------|-----------------|------------------------|----------------------------------------------------------------------|
| Overworld | -64 to 319      | Sea level = Y=63       | Bedrock floor at Y=-64 (3 layers, -64 to -62). Build ceiling at 319. |
| Nether    | 0 to 127        | Lava sea at Y=31       | Bedrock floor Y=0 (4 layers), bedrock ceiling Y=123–127 (4 layers).  |
| End       | 0 to 255        | No sea                 | Void below Y=0; islands float around Y=60.                           |

> Note on the Nether: Since 1.18 the **dimension height** is 384 (min_y=0), but the
> terrain is still generated within the 0–127 range with bedrock sealing off the top.
> The space above 127 is accessible if you mine through bedrock (creative only).

---

## 3. Overworld Deep-Dive

The Overworld is the default spawn dimension. It is the only dimension with a working
day/night cycle, weather, sky light, beds, and natural village/raid mechanics.

### 3.1 Dimension Properties

```
ultrawarm                = false
natural                  = true
coordinate_scale         = 1.0
has_skylight             = true
has_ceiling              = false
min_y                    = -64
height                   = 384
logical_height           = 384
infiniburn               = #minecraft:infiniburn_overworld
effects                  = overworld
ambient_light            = 0.0
fixed_time               = (none — cycles)
monster_spawn_light_level= 7 (with moon-phase modifier: 7 + phase_bonus)
monster_spawn_block_light_limit = 0
piglin_safe              = false
bed_works                = true
respawn_anchor_works     = false  (anchors explode)
has_raids                = true
has_precipitation        = true
```

**Sky colors** (vanilla `overworld` effects renderer):

- Clear day sky: `#78A7FF` (RGB 120,167,255).
- Clear night sky: `#000203`-ish (very dark blue/black).
- Rain sky: `#7A7A7A` greyish.
- Thunder sky: `#383838` darker greyish.
- Fog color blends with sky and biome fog color.

### 3.2 Terrain Generation Parameters (1.21.x)

- **Bedrock floor**: Y=-64 to -62 (3 layers of bedrock in modern terrain; older worlds
  sometimes had 5).
- **Deepslate layer**: starts at Y=0 and goes down to bedrock. Stone below Y=0 is
  replaced with deepslate, ores with their deepslate variants.
- **Stone layer**: Y=0 up to surface (minus dirt/grass cap).
- **Surface cap**: typically 3 blocks of dirt then 1 block of grass block (varies by
  biome — desert=sand, mountains=stone/gravel, badlands=terracotta).
- **Sea level**: Y=63. Water fills from Y=63 down to the ocean floor.
- **Build ceiling**: Y=319 (the world is fully playable up to this height).
- **Snow line**: Biome-temperature-dependent; typically starts around Y=90–120 in
  temperate zones (Y ≈ 95 + (temp_modifier)).

### 3.3 Day/Night Cycle

The full cycle is **20 minutes (24,000 ticks) of real time**:

| Phase        | Ticks (start–end)   | Duration     | Sky state                                |
|--------------|---------------------|--------------|------------------------------------------|
| Day          | 0 → 6000            | 10 min       | Full sun, sky blue                       |
| Sunset       | 6000 → 7000         | ~1.5 min     | Orange/pink horizon                      |
| Night        | 7000 → 18000        | ~7 min       | Moon and stars, monsters spawn           |
| Sunrise      | 18000 → 24000 (=0)  | ~1.5 min     | Orange/pink horizon                      |
| Noon         | 6000                | instant      | Sun at zenith                            |
| Midnight     | 18000               | instant      | Moon at zenith                           |

- ` setTime 0` = dawn. The sun rises in the east and travels clockwise across the sky.
- The `/time` command uses both `day_time` (cumulative ticks) and `game_time`
  (cumulative ticks since world creation — never resets).
- **Moon phases** cycle every 8 in-game days (192,000 ticks). Phases: full → waning
  gibbous → last quarter → waning crescent → new → waxing crescent → first quarter →
  waxing gibbous → full.
- **Monster spawn light level** is reduced near the full moon (more light tolerated) and
  increased near the new moon (darker tolerance is more permissive).

### 3.4 Sky Rendering (Sun, Moon, Stars)

- **Sun**: a 32×32 pixel textured quad rendered on the "sky dome" at huge distance.
  Renders only during day.
- **Moon**: 32×32 textured quad with phases. Renders only at night. The moon shows 8
  phases by sub-rect of the moon texture.
- **Stars**: 1500 random points (deterministic per-world) rendered only at night, dimmed
  by sky_light.
- **Sky tint**: tinted by biome fog color and time-of-day. A "horizon haze" gradient
  transitions from the sky color to the fog color near Y=0 of the camera.

### 3.5 Weather

- **Rain**: has_precipitation=true biomes get rain. Rain falls from Y=camera+10 down to
  ground; rendered as moving lines. Tints sky grey. Extinguishes fires. Waters farmland.
  In cold biomes (Taiga, Snowy Plains, etc.), rain falls as **snow** which accumulates
  as snow layers on solid blocks.
- **Thunderstorm**: rain + dark sky (light level reduced by 5) + lightning strikes every
  1–6 minutes within 256 blocks of each player. Lightning ignites fires, damages mobs,
  converts villagers to witches (rare), pigs to zombified piglins, and creepers to
  charged creepers.
- **Weather duration**: random 0.5–2.5 in-game days per phase (rain/no-rain). Set via
  `weather` command.
- **Snow accumulation**: snow layers stack up to 8 per block.

### 3.6 Lighting Model

Minecraft uses a **two-channel** light system: **sky light** (15 max, sky-exposed) and
**block light** (15 max, emitted by light sources). Each chunk stores a 4-bit nibble
per channel per block. Effective light at a position is:

- If `has_skylight=false` (Nether/End): `effective = max(block_light, ambient_light)`
- If `has_skylight=true` (Overworld, day): `effective = max(block_light, sky_light − sky_darkness)`
- If `has_skylight=true` (Overworld, night or storm): `sky_light` is dimmed by
  `sky_darkness` (0 in day, up to 11 at midnight or during thunderstorms).

**Light propagation**: BFS from sources, decreasing by 1 per block (transparent blocks
propagate; opaque blocks stop). Water and leaves reduce light by 2 per block instead of 1.
Ice reduces by 3. Slabs/stairs/doors are transparent. Emission light sources: torch=14,
glowstone=15, lantern=15, sea lantern=15, jack o'lantern=15, end rod=14, lava=15,
froglight=15, shroomlight=15, campfire=15, soul campfire=10, froglight=15.

### 3.7 Phantoms

- Spawn when the player has not slept in a bed for **3+ in-game days** (≥ 72,000 ticks,
  i.e. 60 real minutes).
- Spawn in groups of 1–4 above the player at Y = player.Y + 20 to 34, in the overworld
  at light level ≤ 7 (i.e. night or storms).
- Spawn check happens every 60–80 seconds once insomnia threshold is met.
- Sleeping in a bed resets the insomnia counter to 0.

### 3.8 Hardcoded Overworld Structures

| Structure       | Y range      | Generation rules                                                                                  |
|-----------------|--------------|---------------------------------------------------------------------------------------------------|
| Stronghold      | anywhere     | Ring distribution; ring 1: 3 strongholds within 1408–2688 blocks; ring 2: 6 within 4480–5760; etc. Generates stone brick rooms and the End portal room. |
| Ancient City    | Y=-52 (floor)| Generates in Deep Dark biome. Contains sculk sensors, sculk shriekers, chest loot, and the Warden spawn trigger. Grey wool/blue ice floors. |
| Trial Chambers  | Y=-20 to -40 | New in 1.21. Procedural rooms connected by corridors. Contains trial spawners and vaults. Built from tuff, copper bulbs, chiseled tuff. |
| Villages        | surface      | 6 village types (plains, desert, savanna, taiga, snowy, meadow). Generates houses, beds, job sites. |
| Ocean Monuments | Y=45 to 62   | Prismarine structure in deep ocean. Contains 3 elder guardians.                                  |
| Woodland Mansions | surface    | 50+ room templates; rare, 10k–80k blocks from spawn; illager inhabitants.                        |
| Shipwrecks      | beaches      | Wood/iron variants, buried treasure maps.                                                        |
| Ocean Ruins     | deep/cold ocean | Stone or sandstone variants.                                                                   |
| Ruined Portals  | surface/underground | Generates broken nether portal frames with crying obsidian and a loot chest.                |
| Pillager Outpost | surface     | Wood + cobblestone tower with pillagers.                                                         |
| Mineshafts      | any Y       | Wooden tunnels with rails, cave spider spawners.                                                 |
| Igloos          | snowy       | Stone brick basement with brewing stand and a villager + zombie villager pair.                   |
| Desert Pyramids | desert      | Sandstone with TNT traps and 4 loot chests.                                                      |
| Jungle Temples  | jungle      | Cobblestone with dispenser traps and 2 chests.                                                    |
| Swamp Huts      | swamp       | Cottage with a witch and a black cat.                                                             |
| Trail Ruins     | Y=-15       | Buried archeology site in taiga/snowy/jungle; gravel+bricks+suspicious gravel.                   |
| Buried Treasure | beaches     | Single chest with heart of the sea.                                                               |
| Fossils         | underground | Bone block structures in desert/swamp.                                                            |

### 3.9 Coordinate Scale vs Nether

- Overworld uses `coordinate_scale=1.0`.
- The Nether has `coordinate_scale=8.0`. This means **1 block in the Nether = 8 blocks
  in the Overworld** when computing portal links (see §4.5).
- The End uses `coordinate_scale=1.0` (1:1).

### 3.10 Other Notable Mechanics

- **Beds**: Set respawn point; skip night if all players in Overworld sleep simultaneously
  for 100 ticks. Beds in Nether/End explode with power 5 (more than TNT).
- **Clocks & compasses**: Compass needle points to world spawn in Overworld; spins
  randomly in other dimensions. Lodestone compass requires a lodestone to function
  (works in all dimensions if a lodestone is set).
- **Maps**: Render only the dimension they were crafted in; non-Overworld maps use a
  black-and-white palette (Nether) or static black (End).

---

## 4. The Nether Deep-Dive

The Nether is a vertical, ceiling-bounded hellish dimension. It is the only dimension
where water cannot exist, lava flows faster, and 1 block of horizontal movement equals
8 blocks in the Overworld (making it the principal fast-travel hub for advanced players).

### 4.1 Dimension Properties

```
ultrawarm                = true
natural                  = false
coordinate_scale         = 8.0
has_skylight             = false
has_ceiling              = true
min_y                    = 0
height                   = 384   (terrain usable Y=0..127; bedrock ceiling at 127)
logical_height           = 384
infiniburn               = #minecraft:infiniburn_nether
effects                  = the_nether
ambient_light            = 0.1
fixed_time               = 18000   (midnight; sky is always dark)
monster_spawn_light_level= 7
monster_spawn_block_light_limit = 0
piglin_safe              = true
bed_works                = false   (beds explode with power 5)
respawn_anchor_works     = true
has_raids                = false
has_precipitation        = false
```

**Sky & fog**:
- Fog color: dark red-brown, RGB ≈ `#300507` blended toward `#1B0509` at distance.
- Fog density is unusually high (render distance reduced by ~50% visually) — this is the
  signature "fog of hell" effect.
- No sun, moon, or stars render.
- Ambient particles: small grey ash particles falling slowly (the "ash" particle effect).

### 4.2 Terrain Generation

- **Netherrack** is the dominant stone (replaces overworld stone).
- **Bedrock floor**: Y=0 to Y=3 (4 layers; fully solid in vanilla).
- **Bedrock ceiling**: Y=124 to Y=127 (4 layers).
- **Lava sea**: lava fills any air block with Y ≤ 31. The lava sea is uniform at Y=31
  in low areas.
- **Terrain height**: between Y=4 and Y=123, with most "ground" around Y=30–80.
- **Caves**: large open caves, ravines, and giant caverns (often filled with lava at
  the bottom).

### 4.3 Nether Biomes (1.21.x)

| Biome              | Surface block           | Distinguishing features                                                              |
|--------------------|-------------------------|--------------------------------------------------------------------------------------|
| Nether Wastes      | Netherrack              | Default nether biome, sparse ghasts and zombified piglins.                          |
| Soul Sand Valley   | Soul Sand / Soul Soil   | Blue fog, soul fire, skeletons, ghasts, lots of fossils (1×1 bone blocks).           |
| Crimson Forest     | Crimson Nylium          | Red-themed: crimson fungi, huge fungi trees, weeping vines, piglins, hoglins.       |
| Warped Forest      | Warped Nylium           | Cyan-themed: warped fungi, twisting vines, endermen (the densest enderman farm).     |
| Basalt Deltas      | Basalt                  | Volcanic: basalt columns, magma cubes, frequent ash particles, dark fog.             |
| Barren Nether (jigsaw) | Netherrack          | Internal use; default fallback.                                                     |

### 4.4 Nether Structures

| Structure         | Generation rules                                                                                              |
|-------------------|---------------------------------------------------------------------------------------------------------------|
| Nether Fortress   | Long corridors of nether bricks; blaze spawners, wither skeleton spawns, nether wart farms. Distance ~400-800 blocks apart. |
| Bastion Remnant   | 4 variants (hoglin stables, treasure, bridge, housing). Blackstone + basalt; piglins and piglin brutes. Loot includes snout banners and (rarely) netherite. |
| Ruined Portal     | Broken obsidian frame, crying obsidian, gold blocks, loot chest. Both in Nether and Overworld.                |
| Nether Fossil     | Bone block structures in soul sand valleys.                                                                  |

### 4.5 Coordinate Mapping (8:1 Nether ↔ Overworld)

This is the single most important mechanic for long-distance travel. The rule:

```
# When traveling Overworld → Nether via a portal
nether_x = floor(overworld_x / 8)
nether_z = floor(overworld_z / 8)
nether_y = overworld_y   (Y is NOT scaled)

# When traveling Nether → Overworld
overworld_x = nether_x * 8
overworld_z = nether_z * 8
overworld_y = nether_y
```

> Example: An Overworld portal at (800, 64, 1600) maps to a Nether target of (100, 64, 200).
> Walking 1 block in the Nether equates to walking 8 blocks in the Overworld.

The portal search algorithm uses this 8:1 ratio to find (or create) a corresponding
portal in the destination dimension (full algorithm in §6.1).

### 4.6 Physics Differences (ultrawarm effects)

- **Water**: cannot be placed from a bucket — evaporates instantly with a "sizzle"
  particle effect and no block remains. Ice also evaporates.
- **Lava flow speed**: 6× faster than in Overworld (lava flows 1 block per 6 ticks in
  the Nether vs 1 block per 36 ticks in the Overworld). Lava flow distance is also
  unlimited in the Nether (vs 3 blocks in Overworld).
- **Lava ignition**: lava sets flammable blocks alight more aggressively.
- **Compasses** spin erratically (no lodestone = no signal).
- **No maps**: maps render all black.

### 4.7 Nether Mobs

| Mob                 | Spawn condition                                          | Behavior                                                                                            |
|---------------------|----------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| Zombified Piglin    | Nether Wastes, Crimson Forest                            | Neutral until provoked; attacking one aggros all within 32 blocks; deals heavy damage in groups.   |
| Piglin              | Crimson Forest                                           | Neutral unless player lacks gold armor; aggroed by opening chests/barrels in their sight; barter with gold ingots; zombify outside Nether. |
| Piglin Brute        | Bastion Remnants                                         | Always hostile; does not respect gold armor; does not barter; zombify outside Nether.              |
| Hoglin              | Crimson Forest                                           | Hostile; knockback attack; can be bred with crimson fungi; zombify outside Nether; drop raw porkchop and leather. |
| Zoglin              | Hoglins outside Nether                                   | Hostile; zombified hoglin.                                                                          |
| Ghast               | Nether Wastes, Soul Sand Valley, Basalt Deltas           | Hostile flying; shoots explosive fireballs; minimum spawn Y=30; drops ghast tear + gunpowder.      |
| Blaze               | Nether Fortresses (spawners)                             | Hostile; ranged fireball + melee; drop blaze rods; light level irrelevant (spawner-based).         |
| Magma Cube          | Nether Wastes, Basalt Deltas, near lava                  | Hostile; splits on death (large→medium→small); drops magma cream.                                  |
| Wither Skeleton     | Nether Fortresses                        | Hostile; melee withers the player (Wither II effect); drops coal, bones, and wither skeleton skull (2.5%). |
| Skeleton            | Nether Fortresses, Soul Sand Valley                      | Standard skeleton; ranged bow.                                                                     |
| Strider             | Lava seas                                                | Passive; rides on lava; can be saddled and ridden with warped fungus on a stick; drops string.     |
| Enderman            | Warped Forest, Nether Wastes                             | Neutral unless looked at; can pick up netherrack.                                                  |

### 4.8 Nether Ores

| Ore               | Y range (best)              | Notes                                                |
|-------------------|-----------------------------|------------------------------------------------------|
| Nether Quartz Ore | 10–114 (anywhere in netherrack) | Drops quartz + XP; common.                       |
| Nether Gold Ore   | 10–117                      | Drops gold nuggets; common.                          |
| Ancient Debris    | Y=15 (peak), Y=8–22         | Rare; blast-resistant (resists TNT). Drops 1 netherite scrap when smelted; the rarest ore in the game. |
| Glowstone         | Y=10–120 (ceiling clusters) | Drops glowstone dust (max 4 without Silk Touch).     |
| Blackstone        | Y=5–28 (blobs)              | Decorative, also a stone substitute.                 |
| Basalt            | Basalt Deltas               | Decorative pillar block.                             |

### 4.9 Respawn Anchor Mechanics

- Crafted from 6 crying obsidian + 3 glowstone.
- Right-click with **glowstone** to charge. Holds up to **4 charges**.
- Each charge = 1 respawn. Charge is consumed when the player dies and respawns there.
- Right-click in **Overworld or End** → anchor **explodes** with power 5 (same as a bed).
- Requires `respawn_anchor_works=true` in dimension type (Nether only in vanilla).

### 4.10 Nether Portal Mechanics (Summary — full algorithm in §6.1)

- Frame: **4 wide × 5 tall** minimum (10 obsidian), up to **23 × 23**.
- Light with flint & steel or any fire source.
- Creates `minecraft:portal` blocks inside the frame (purple animated texture).
- Stepping into the portal teleports player after 80 ticks (4 seconds) of standing in
  it (instant on creative or with `doImmediatePortalTeleport` gamerule... actually that
  gamerule doesn't exist; creative mode is 1 tick). On arrival, applies 300-tick portal
  cooldown to prevent immediate re-entry.
- Portals can be deactivated by breaking one frame block or one portal block, or by
  extinguishing with a water bucket (water is impossible in Nether, so this is only
  useful in Overworld).

---

## 5. The End Deep-Dive

The End is the endgame void dimension — a sparse archipelago of pale yellow end-stone
islands floating in an infinite void. The central island houses the Ender Dragon boss
fight. Outer islands (accessible via end gateway portals) host end cities, shulkers, and
elytra.

### 5.1 Dimension Properties

```
ultrawarm                = false
natural                  = false
coordinate_scale         = 1.0
has_skylight             = false
has_ceiling              = false
min_y                    = 0
height                   = 256
logical_height           = 256
infiniburn               = #minecraft:infiniburn_end
effects                  = the_end
ambient_light            = 0.0
fixed_time               = 6000   (noon — but no visible sun)
monster_spawn_light_level= 7
monster_spawn_block_light_limit = 0
piglin_safe              = false
bed_works                = false   (beds explode)
respawn_anchor_works     = false   (anchors explode)
has_raids                = false
has_precipitation        = false
```

**Sky & fog**:
- Sky is pure black (`#000000`) — no sun, moon, stars, or clouds.
- Fog color: also pure black at distance; blends to dark grey near islands due to the
  end-stone ambient.
- No ambient particles (silent void).

### 5.2 Terrain Generation

- **Central End Island**: a circular island ~250 blocks diameter centered at (0,0).
  Y of island surface = 0 (bedrock is at Y=0 in End; the spawn platform is at Y=50–55).
- **Exit Portal**: 5×5 horizontal bedrock frame at center, lights up after dragon is
  defeated.
- **End Fountain / Egg spawn**: dragon egg spawns on top of the bedrock fountain at the
  center of the exit portal.
- **Obsidian Pillars**: 10 pillars of varying height (Y=76 to Y=98 for tallest) arranged
  in a circle around the center. Each pillar has an end crystal on top (some caged in
  iron bars).
- **End Crystals**: heal the dragon if it flies near them; can be destroyed by the
  player (arrow or melee). When destroyed, explosion damages nearby entities.
- **Outer End Islands**: begin at radius ~1000 blocks from center. Separated from the
  central island by a 1000-block-wide void gap.
- **End gateway portals**: spawn when the dragon is defeated (10 total: 1 immediately
  after death, then 1 per dragon respawn cycle for 9 more, arranged in a circle).

### 5.3 End Structures

| Structure     | Description                                                                                       |
|---------------|---------------------------------------------------------------------------------------------------|
| Obsidian Platform | 5×5 obsidian platform at (100, 49, 0) where the player spawns on first entry. Always regenerated when entering the End. |
| Exit Portal   | 5×5 bedrock frame at (0,0). Inactive until dragon dies. Activates with a beam of light, becomes return portal to spawn. |
| End Gateway   | 1-block bedrock portal with a beam. Teleports player 1000+ blocks to outer islands.               |
| End City      | Purple-purpur-brick structure on outer islands. Contains shulkers and an end ship (sometimes).    |
| End Ship      | Floating ship structure; contains an item frame with an elytra and a dragon head.                 |
| Chorus Plant  | Plant that grows chorus fruit on the outer islands. Fruit pops on use; can be popped into chorus fruit (food) or baked into popped chorus fruit → purpur. |

### 5.4 Ender Dragon Fight Phases

The Ender Dragon (`minecraft:ender_dragon`) is a boss with a multi-phase AI. Each phase
corresponds to an internal `EnderDragonPhase` enum (12 phases total):

| #  | Phase ID              | Internal name           | Behavior                                                                                              |
|----|-----------------------|-------------------------|-------------------------------------------------------------------------------------------------------|
| 0  | HOLDING_PATTERN       | circling                | Dragon circles the island at radius 32–96, occasionally selecting another phase.                     |
| 1  | STRAFE_PLAYER         | strafing                | Dragon flies at a player and breathes dragon breath fireball.                                         |
| 2  | LANDING_APPROACH      | landing (approach)      | Descends toward the portal; transition phase to PERCHING.                                             |
| 3  | LANDING_ON_PORTAL     | landing (on portal)     | Touches down on the portal. Transitions to SITTING_FLAMING or SITTING_SCANNING.                      |
| 4  | TAKEOFF               | takeoff                 | Launches upward from the portal; transitions back to HOLDING_PATTERN.                                |
| 5  | SITTING_FLAMING       | perching (flaming)      | Sits on portal and breathes dragon-breath cloud downward for ~8 seconds, then transitions.           |
| 6  | SITTING_SCANNING      | perching (scanning)     | Sits on portal looking for players; if a player is found, transitions to SITTING_ATTACKING.          |
| 7  | SITTING_ATTACKING     | perching (attacking)    | Sits and emits a short-range attack.                                                                 |
| 8  | CHARGING_PLAYER       | charging player         | Swoops toward a specific player; deals heavy melee damage.                                           |
| 9  | DYING                 | dying                   | Death animation: ascends to Y=100+, plays death sound for ~5 seconds, then explodes.                 |
| 10 | HOVER                 | hover                   | Hovers at portal (debug/test phase; rarely used).                                                    |
| 11 | BREATH_ATTACK         | breathing attack        | Stationary breath-attack cloud emission (also visible as the SITTING_FLAMING particle).              |

#### Dragon Healing via End Crystals

- As long as end crystals on obsidian pillars are intact, the dragon periodically flies
  near them and **regenerates 1 HP per tick** (up to its max 200 HP = 100 hearts).
- Players must destroy all 10 crystals before the dragon can be killed effectively.
- Crystals destroyed by arrows or melee: explosion power 6 (similar to TNT, also damages
  dragon if close).

#### Player-Placed Crystal Respawn

- A player can **resummon the dragon** by placing 4 end crystals on the 4 sides of the
  exit portal (one per cardinal direction). Each crystal ignites; pillars regenerate
  crystals, and the dragon respawns with full HP after a short animation.
- Each respawn generates 1 additional end gateway portal (up to 20 total; vanilla caps
  at 20 gateways).

#### Death Sequence

1. Dragon ascends to Y=100+ over ~3 seconds, emitting white particles.
2. Plays a loud death sound + beam of light radiating outward.
3. Explodes into ~12,000 XP worth of XP orbs (split among players in the End).
4. Exit portal activates with a vertical beam of light.
5. Dragon Egg spawns on the bedrock fountain at the center of the exit portal.
6. A single end gateway portal opens at (X=0, Z=±1000) for transport to outer islands.

### 5.5 End Gateway Portal Mechanics

- 1-block wide bedrock portal with a 5×5 bedrock skirt.
- Renders a faint purple beam of light upward.
- Player must **throw an ender pearl** into the gateway (or fly through with elytra).
  Crouching-walking into it does not work in vanilla (the portal is 1 block and the
  player's hitbox is too tall).
- Teleports player to a fixed outer-island coordinate (usually ~1000 blocks away).
- Each end gateway has a unique destination; once used, the destination is fixed.

### 5.6 End Mobs

| Mob          | Spawn condition                | Behavior                                                                                        |
|--------------|--------------------------------|-------------------------------------------------------------------------------------------------|
| Enderman     | All End biomes; dense on outer islands | Neutral; becomes hostile if player looks at torso/head or attacks; teleports when hit by projectile; picks up blocks; drops ender pearls. |
| Shulker      | End Cities                     | Stationary; hides in shell; opens to fire homing shulker bullets; drops shulker shells (for shulker boxes). Inflicts Levitation effect on hit. |
| Ender Dragon | Central End Island             | Boss; only one per dimension until respawned. 200 HP. Drops 12,000 XP.                          |
| End Crystal  | On obsidian pillars            | Not strictly a mob but a destructible entity; heals dragon; explodes when destroyed.            |

### 5.7 End-Specific Player Behaviors

- Player spawns on a 5×5 obsidian platform at (100, 49, 0). The platform regenerates
  each time the player enters the End via the End portal.
- The platform is at Y=49; falling off the edge sends the player into the void →
  immediate death (no items recoverable unless `/gamerule keepInventory true`).
- Elytra: found in end ship's item frame. Allows gliding flight when equipped as chest
  plate. Can be boosted with fireworks (rocket flight).
- Returning to Overworld: jump into the exit portal (5×5 bedrock at center) after
  defeating the dragon → returns player to Overworld spawn point (or bed).

---

## 6. Portal Mechanics Deep-Dive

### 6.1 Nether Portal Search Algorithm

This is the canonical algorithm used when a player enters a nether portal and the
destination dimension has no matching portal link.

```text
function find_or_create_portal(dest_dim, src_x, src_z, src_y, scale_src_to_dest):
    # Step 1: scale coordinates to destination
    dest_x = floor(src_x * scale_src_to_dest)   # scale_src_to_dest = 1/8 if going OW->Nether
    dest_z = floor(src_z * scale_src_to_dest)   #                       8   if going Nether->OW
    dest_y = clamp(src_y, dest_dim.min_y, dest_dim.height - 1)

    # Step 2: search a 128-block radius in the destination for an existing portal
    search_radius = 128
    found = find_portal_block_within(dest_dim, dest_x, dest_z, search_radius)
    if found:
        return found   # use existing portal

    # Step 3: no portal found — create one
    # Search a 16-block radius for a viable portal frame location
    for r in 0..16:
        for dx in -r..r:
            for dz in -r..r:
                candidate = (dest_x + dx, dest_y, dest_z + dz)
                if is_safe_spawn(candidate) and has_room_for_frame(candidate):
                    build_portal_frame_at(candidate)
                    return candidate

    # Step 4: no viable spot — create a floating portal in the air
    build_portal_frame_at(dest_x, dest_y, dest_z)
    return (dest_x, dest_y, dest_z)
```

**Search radius**: vanilla uses 128 blocks in both dimensions, but the 8:1 ratio means
a 128-block Nether search covers 1024 blocks in the Overworld.

**Portal block creation**: when a frame is lit, the inner air blocks become
`minecraft:portal` blocks. The portal block has axis=x or axis=z state depending on
frame orientation.

**Teleportation cooldown**: after arrival, player has a 300-tick (15-second) cooldown
during which they cannot re-enter a portal. The on-screen "nausea" animation lasts 2
seconds.

**Link persistence**: once a portal link is established, it's **not** stored in NBT —
it's recomputed each time the player enters a portal. If a portal is broken and rebuilt
elsewhere, the link shifts.

### 6.2 End Portal

- Located in the **stronghold portal room** (10% chance of being pre-filled with all 12
  eyes of ender; otherwise 0–10 eyes are pre-filled, requiring the player to fill the
  remainder).
- Frame: 12 end portal frame blocks arranged in a 3×3 square with the center empty.
  Each frame block has a `eye` property (true/false) and a `facing` property (cardinal).
- **Activation**: place an eye of ender in each of the 12 frame blocks. When the 12th is
  placed, the center 3×3 becomes `minecraft:end_portal` blocks (black starfield texture).
- **Entry**: stepping into the portal teleports the player to the End dimension, on the
  obsidian platform at (100, 49, 0). Cooldown = 300 ticks.
- **Spawn**: player always faces west upon arrival; 5×5 obsidian platform is created if
  not already present.
- **Return**: there is **no return portal** in the End until the Ender Dragon is killed.
  Dying in the End returns the player to their spawn point (Overworld bed or world
  spawn).

### 6.3 End Gateway

- 1-block portal with a 5×5 bedrock skirt.
- Renders a faint purple beam of light upward.
- Player must **throw an ender pearl** into the gateway (or fly through with elytra).
  Crouching-walking into it does not work in vanilla (the portal is 1 block and the
  player's hitbox is too tall).
- Teleports player to a fixed outer-island coordinate (usually ~1000 blocks away).
- Each end gateway has a unique destination; once used, the destination is fixed.

### 6.4 Return Pathways Summary

| From            | To            | Method                                                                              |
|-----------------|---------------|-------------------------------------------------------------------------------------|
| Nether          | Overworld     | Step into any nether portal. Coordinates are scaled 8:1.                            |
| End (post-dragon) | Overworld  | Jump into the exit portal (5×5 bedrock at center of main island).                   |
| End (pre-dragon) | Overworld    | Die. Player respawns at Overworld spawn (no items recovered unless keepInventory).  |
| Any             | Spawn         | Die without a bed/anchor respawn set; respawn at world spawn.                       |

### 6.5 Portal Block Reference

| Block              | ID                  | Properties                                    |
|--------------------|---------------------|-----------------------------------------------|
| Nether Portal      | `minecraft:portal`  | `axis` ∈ {x, z}; non-solid; tickable; emits light 11 |
| End Portal         | `minecraft:end_portal` | no states; non-solid; emits light 15; indestructible (cannot be broken in survival) |
| End Gateway        | `minecraft:end_gateway` | no states; non-solid; indestructible in survival |

---

## 7. Multi-Dimension World Persistence

### 7.1 Per-Dimension State

Each dimension maintains its own:

- **Chunk grid**: 16×16 columns of full-height blocks, in regions of 32×32 chunks.
- **Loaded chunks**: only chunks near players (or forced by tickets) are loaded; render
  distance and simulation distance are configurable per server.
- **Time**: `day_time` ticks. End and Nether effectively pin their `day_time` (18000 in
  Nether, 6000 in End) — but the underlying clock still advances; the `fixed_time`
  property overrides what the renderer sees.
- **Weather**: only Overworld has weather; Nether and End have `has_precipitation=false`.
- **Difficulty**: shared per-world (not per-dimension).
- **Spawn point**: `minecraft:overworld` has a world spawn (X/Z 0..2M) plus per-player
  bed/anchor spawns per dimension.

### 7.2 Per-Player State

Per-player state is stored in `player.dat` (in 1.21 via `players/` folder):

- **Inventory / ender chest** — global, not per-dimension.
- **Health, hunger, XP, effects** — global.
- **Position (X, Y, Z) and rotation (yaw, pitch)** — **per-dimension**. Each dimension
  has its own `Pos` and `Rotation` tags in the player's NBT, keyed by dimension ID.

```text
# Player NBT structure (simplified):
Pos: [d, d, d]                  # current dimension
Rotation: [f, f]                # current dimension
Dimension: "minecraft:overworld"
# (other dimensions' last position are not stored separately by default;
#  on portal use, the destination's last position is computed live via
#  the portal search algorithm. The player remembers the *source* position
#  implicitly through the portal link.)
```

> Important nuance: vanilla Minecraft does **not** store per-dimension player positions.
> When you leave a dimension via portal, the next time you return, you arrive at
> wherever the portal search algorithm finds/creates a portal — which is roughly where
> you left off, but not exactly. Custom servers (Paper, Fabric mods) often patch this to
> remember exact positions.

### 7.3 Time Per Dimension

| Dimension | Time behavior                                                  |
|-----------|----------------------------------------------------------------|
| Overworld | Day/night cycles every 24000 ticks (20 minutes real-time).     |
| Nether    | `fixed_time=18000` (midnight). Sky always dark.                |
| End       | `fixed_time=6000` (noon). No visible sky change anyway.        |

The internal `day_time` still advances in Nether/End (for game logic), but the renderer
uses `fixed_time`.

### 7.4 Inventory Sharing

- Player inventory transfers fully across dimensions.
- Ender chest inventory is also shared (ender chest contents are stored in player.dat,
  not in the chest block).
- Health, hunger, XP, effects, advancements: all shared.
- The only things that are dimension-specific are: position, rotation, velocity,
  fall-distance counter, and the "inPortal" / portal-cooldown timers.

### 7.5 Entity Persistence Across Dimensions

- Most mobs do **not** cross dimensions. A cow in the Overworld stays in the Overworld.
- **Exception**: thrown ender pearls, dropped items, and arrows in flight — when they
  enter a portal, they teleport to the destination dimension. (This is how ender pearl
  stasis chambers work — pearls are held by chunk loading until released.)
- Entities that fall into the End's void are removed (no destination).

### 7.6 Saving & Loading

- Each dimension's chunks save independently to its own region files (`region/`,
  `DIM-1/region/`, `DIM1/region/`).
- Block entities (chests, signs, hoppers) save with their chunk.
- Entities save with their chunk (each chunk has an entity section in the .mca).
- Players save globally in `players/<uuid>.dat`.

---

## 8. Three.js Implementation Notes

Implementing three dimensions in Three.js requires careful attention to memory,
rendering, and state isolation. Below is a recommended architecture.

### 8.1 Architecture: One Scene Per Dimension

```
class DimensionManager {
  overworld: { scene: THREE.Scene, chunkManager: ChunkManager }
  nether:    { scene: THREE.Scene, chunkManager: ChunkManager }
  end:       { scene: THREE.Scene, chunkManager: ChunkManager }
  current: 'overworld' | 'nether' | 'end'
  renderer: THREE.WebGLRenderer
  camera: THREE.PerspectiveCamera
}

class ChunkManager {
  dimensionType: DimensionType
  chunks: Map<string, Chunk>     // "cx,cz" → Chunk
  seed: number                   // per-dimension derived seed
  generator: TerrainGenerator   // noise-based, biome-aware
  maxLoadedChunks: number       // e.g. 441 (21x21) for render distance 10
}
```

**Recommendation**: Use a single THREE.Scene per dimension. Each dimension has its own
sky, fog, lighting, and chunk meshes. Switch dimensions by swapping the active scene in
the render loop. This naturally isolates all per-dimension state.

### 8.2 Memory Considerations

- Only keep the **current dimension's chunks** loaded in memory. Unload chunks from
  other dimensions on dimension switch (or keep a small LRU cache of "recently visited"
  chunks if you want portal re-entry to be fast).
- Each chunk is ~16×384×16 = 98,304 blocks for Overworld (full height). At 2 bytes per
  block (block ID + state byte) = 192KB raw, plus mesh data. A 21×21 grid of loaded
  chunks ≈ 441 chunks × ~200KB = ~85MB per dimension.
- Use **instanced meshes** for repeated blocks (e.g. grass, leaves) and **greedy
  meshing** or per-block-face culling for solid blocks. Do not render hidden faces.
- Dispose of Three.js geometries and materials on chunk unload (`geometry.dispose()`,
  `material.dispose()`) — failing to do this causes GPU memory leaks.

### 8.3 Chunk Loading & Streaming

```text
on player move:
  new_chunk_x = floor(player.x / 16)
  new_chunk_z = floor(player.z / 16)
  for r in 0..render_distance:
    for each (cx, cz) within radius r of (new_chunk_x, new_chunk_z):
      if not chunks.has((cx, cz)):
        chunks.set((cx, cz), generate_chunk_async(cx, cz))
  # unload far chunks
  for (cx, cz) in chunks:
    if chebyshev_distance((cx,cz), (new_chunk_x, new_chunk_z)) > render_distance + 2:
      unload_chunk(cx, cz)
```

Use a **web worker** for terrain generation (no GL in workers; pass block arrays back via
`postMessage` with `Transferable` typed arrays).

### 8.4 Sky & Fog Per Dimension

Implement a `SkyRenderer` class that takes a `DimensionType` and renders appropriately:

- **Overworld**: sky dome with sun/moon quad that orbits based on `day_time`. Stars at
  night. Fog color lerped between day/rain/storm palettes. Cloud layer at Y=128
  (textured plane with `depthWrite=false`).
- **Nether**: pure fog color (dark red). No sun/moon/stars/clouds. Render distance
  reduced to ~50% visually via thick fog.
- **End**: pure black background. No sun/moon/stars. No clouds. Optional: render a
  distant purple-ish nebula? Vanilla does not.

Use `THREE.FogExp2` for the Nether (exponential density) and `THREE.Fog` (linear) for
Overworld/End.

### 8.5 Lighting

- Three.js doesn't natively support Minecraft's two-channel (sky+block) light model.
  Recommended approach: bake **vertex colors** (RGB or single-channel) per vertex with
  the effective light level. Set `MeshStandardMaterial.vertexColors=true` and modulate
  the material's base color via the vertex color.
- For Overworld day/night, multiply vertex color by a global "sky_darkness" uniform
  updated every tick.
- For sun direction, set a `THREE.DirectionalLight` whose position is computed from
  `day_time`:
  ```js
  const angle = (dayTime / 24000) * Math.PI * 2;
  sunLight.position.set(
    Math.cos(angle) * 100,
    Math.sin(angle) * 100,
    50
  );
  ```

### 8.6 Portal Transition

Implement a 2-second transition screen:

```text
on enter portal:
  state = PORTAL_ANIMATING_IN
  animation_t = 0
  // overlay purple portal-swirl effect on screen (full-screen quad with shader)

during animation (1s):
  animation_t += dt
  // increase swirl intensity, fade out current dimension scene
  // start loading destination dimension's chunks (async)
  // freeze player input

at animation_t >= 1.0:
  swap current scene to destination
  teleport player to destination position
  state = PORTAL_ANIMATING_OUT
  animation_t = 0

during out-animation (1s):
  fade in destination scene, fade out swirl overlay

at out-animation_t >= 1.0:
  state = PLAYING
  unfreeze input
```

While animating, hide the player's viewport of the source dimension and start streaming
destination chunks. If destination chunks aren't ready, show a loading screen until a
minimum set (e.g. 5×5 around spawn) is loaded.

### 8.7 Time & Day/Night Cycle

Implement a single global `gameTime` (ticks since world creation) and per-dimension
`dayTime`:

```js
class WorldClock {
  gameTime: number = 0;       // cumulative ticks
  dayTime: number = 0;        // Overworld day time, 0..24000

  tick(dtMs: number) {
    const ticks = dtMs / 50;   // 20 tps = 50ms/tick
    this.gameTime += ticks;
    this.dayTime = (this.dayTime + ticks) % 24000;
  }

  getSkyDarkness(dim: DimensionType): number {
    if (dim.fixedTime !== undefined) return 11; // nether darkness
    // Overworld: 0 at noon, 11 at midnight + storm bonus
    const t = this.dayTime;
    const night = (t < 6000 || t > 18000) ? ... : ...; // computed via curves
    return night;
  }
}
```

### 8.8 Ender Dragon Boss Implementation

The dragon fight is the most complex single AI in the game. Recommended approach:

```text
class EnderDragon {
  phase: DragonPhase
  phase_ticks: number
  health: number = 200.0
  crystals: EndCrystal[]      // references to pillar crystals

  tick(dt):
    phase_ticks += 1
    switch (phase):
      case HOLDING_PATTERN: fly_circle(center, radius=64); if (phase_ticks > 200) choose_next_phase()
      case STRAFE_PLAYER: fly_toward(player); if (in_range(player, 30)) breath_fireball(player)
      case LANDING_APPROACH: descend_to(Y=portal_y + 5)
      case LANDING_ON_PORTAL: snap_to_portal(); transition_to(SITTING_SCANNING)
      case SITTING_FLAMING: emit_breath_cloud(downward, 8s)
      case SITTING_SCANNING: scan_for_players(); if (found) transition_to(SITTING_ATTACKING)
      case SITTING_ATTACKING: short_range_burst()
      case TAKEOFF: ascend_to(Y=100); transition_to(HOLDING_PATTERN)
      case CHARGING_PLAYER: charge(player_position)
      case DYING: ascend_to(Y=120); emit_particles(); after(200_ticks) explode()
}

on damage(amount):
  health -= amount
  if health <= 0:
    phase = DYING
    // crystals stop healing
    // schedule death sequence

on crystal_destroyed(crystal):
  explosion(center=crystal.pos, power=6, damage_dragon=true)
  crystals.remove(crystal)

on heal_tick():
  if any crystal is alive and dragon near crystal:
    health = min(200, health + 1)
```

Dragon movement uses **waypoint navigation**: pick a target position, lerp the dragon's
position toward it with a fixed turning rate. The dragon's model is rendered as a
skeletal mesh with wing-flap animation.

### 8.9 Persistence (Saving the World)

For each dimension, serialize chunks to IndexedDB (browser) or files (Node/Electron):

```js
interface SavedChunk {
  cx: number
  cz: number
  dimension: 'overworld' | 'nether' | 'end'
  blockData: Uint8Array      // 16*384*16 bytes, or compressed
  blockEntities: object[]    // serialized tile entities
  entities: object[]         // serialized mobs
}

interface SavedWorld {
  seed: number
  gameTime: number
  dayTime: number
  spawnPoint: { x, y, z }
  players: SavedPlayer[]
}
```

Use a separate IndexedDB object store per dimension for parallel access. Compress chunk
block data with a simple RLE before storing.

### 8.10 Performance Checklist

- [ ] Per-dimension Three.Scene (no shared meshes across dimensions)
- [ ] Greedy meshing or per-face culling for chunk geometry
- [ ] Instanced meshes for plants, grass, and other high-density decoration blocks
- [ ] Vertex-color baked lighting (no real-time shadow maps for blocks)
- [ ] Web worker terrain generation with Transferable buffers
- [ ] LRU cache of loaded chunks, max ~441 per dimension
- [ ] `geometry.dispose()` + `material.dispose()` on chunk unload
- [ ] `FogExp2` for Nether, `Fog` for Overworld/End
- [ ] Sky dome rendered on a separate `THREE.Scene` with `depthWrite=false` if needed
- [ ] Portal transition: dual-buffer scene swap with overlay shader

---

## Appendix A — Dimension Type JSON Examples

### A.1 Overworld (`minecraft:overworld`)

```json
{
  "ultrawarm": false,
  "natural": true,
  "piglin_safe": false,
  "respawn_anchor_works": false,
  "bed_works": true,
  "has_raids": true,
  "has_skylight": true,
  "has_ceiling": false,
  "coordinate_scale": 1.0,
  "monster_spawn_light_level": {
    "type": "minecraft:uniform",
    "value": {
      "min_inclusive": 0,
      "max_inclusive": 7
    }
  },
  "monster_spawn_block_light_limit": 0,
  "min_y": -64,
  "height": 384,
  "logical_height": 384,
  "infiniburn": "#minecraft:infiniburn_overworld",
  "effects": "minecraft:overworld",
  "ambient_light": 0.0,
  "has_precipitation": true
}
```

### A.2 The Nether (`minecraft:the_nether`)

```json
{
  "ultrawarm": true,
  "natural": false,
  "piglin_safe": true,
  "respawn_anchor_works": true,
  "bed_works": false,
  "has_raids": false,
  "has_skylight": false,
  "has_ceiling": true,
  "coordinate_scale": 8.0,
  "monster_spawn_light_level": {
    "type": "minecraft:uniform",
    "value": { "min_inclusive": 0, "max_inclusive": 7 }
  },
  "monster_spawn_block_light_limit": 0,
  "min_y": 0,
  "height": 384,
  "logical_height": 384,
  "infiniburn": "#minecraft:infiniburn_nether",
  "effects": "minecraft:the_nether",
  "ambient_light": 0.1,
  "fixed_time": 18000,
  "has_precipitation": false
}
```

### A.3 The End (`minecraft:the_end`)

```json
{
  "ultrawarm": false,
  "natural": false,
  "piglin_safe": false,
  "respawn_anchor_works": false,
  "bed_works": false,
  "has_raids": false,
  "has_skylight": false,
  "has_ceiling": false,
  "coordinate_scale": 1.0,
  "monster_spawn_light_level": {
    "type": "minecraft:uniform",
    "value": { "min_inclusive": 0, "max_inclusive": 7 }
  },
  "monster_spawn_block_light_limit": 0,
  "min_y": 0,
  "height": 256,
  "logical_height": 256,
  "infiniburn": "#minecraft:infiniburn_end",
  "effects": "minecraft:the_end",
  "ambient_light": 0.0,
  "fixed_time": 6000,
  "has_precipitation": false
}
```

---

## Appendix B — Coordinate Mapping Reference

### B.1 Nether ↔ Overworld Portal Coordinate Map

| Overworld (X, Z) | Nether (X, Z) | Notes                                            |
|------------------|---------------|--------------------------------------------------|
| (0, 0)           | (0, 0)        | Origin maps to origin.                           |
| (8, 0)           | (1, 0)        | 1 nether block = 8 overworld blocks.             |
| (80, 0)          | (10, 0)       |                                                  |
| (800, 0)         | (100, 0)      |                                                  |
| (8000, 0)        | (1000, 0)     | Long-distance fast travel.                       |
| (1, 0)           | (0, 0)        | Fractional coords floor → 0.                     |
| (-1, 0)          | (-1, 0)       | Negative coords: floor(-1/8) = -1.               |
| (-8, 0)          | (-1, 0)       |                                                  |
| (128, 64, 128)   | (16, 64, 16)  | Y is NOT scaled.                                 |

### B.2 End Coordinates

End uses `coordinate_scale=1.0` — no scaling. End portals link 1:1 with Overworld
stronghold positions but this is irrelevant because End portals are fixed (in the
stronghold portal room) and lead to (100, 49, 0) in the End always.

### B.3 Portal Search Radii (vanilla)

| Direction       | Search radius in destination | Effective radius in source |
|-----------------|------------------------------|----------------------------|
| OW → Nether     | 128 blocks in Nether         | 1024 blocks in Overworld   |
| Nether → OW     | 128 blocks in Overworld      | 16 blocks in Nether        |
| OW → End        | N/A (fixed target)           | N/A                        |
| End → OW        | N/A (return to spawn)        | N/A                        |

---

## Appendix C — Quick Reference: Dimension Comparison Table

| Property                    | Overworld          | Nether            | End               |
|-----------------------------|--------------------|-------------------|-------------------|
| `min_y`                     | -64                | 0                 | 0                 |
| `height`                    | 384                | 384 (usable 0–127)| 256               |
| `coordinate_scale`          | 1.0                | 8.0               | 1.0               |
| `has_skylight`              | true               | false             | false             |
| `has_ceiling`               | false              | true              | false             |
| `ultrawarm`                 | false              | true              | false             |
| `natural`                   | true               | false             | false             |
| `bed_works`                 | true               | false (explodes)  | false (explodes)  |
| `respawn_anchor_works`      | false (explodes)   | true              | false (explodes)  |
| `has_raids`                 | true               | false             | false             |
| `has_precipitation`         | true               | false             | false             |
| `piglin_safe`               | false              | true              | false             |
| `fixed_time`                | (none)             | 18000 (midnight)  | 6000 (noon)       |
| `ambient_light`             | 0.0                | 0.1               | 0.0               |
| `effects`                   | overworld          | the_nether        | the_end           |
| Sky color (day)             | `#78A7FF`          | (dark red fog)    | black             |
| Fog color                   | biome-tinted       | `#1B0509` dark red| black             |
| Lava flow distance          | 3 blocks           | ∞ (until solid)   | 3 blocks          |
| Lava flow speed (ticks/blk) | 36                 | 6                 | 36                |
| Water behavior              | normal             | evaporates        | normal            |
| Compass                     | works              | spins             | spins             |
| Map                         | full color         | black/white       | black             |
| Clock                       | works              | spins             | spins             |
| Mobs (notable)              | zombies, creepers, skeletons, villagers, illagers | zombified piglins, piglins, blazes, ghasts, magma cubes, wither skeletons, hoglins, striders | endermen, shulkers, ender dragon |
| Primary structures          | villages, strongholds, ancient cities, trial chambers, ocean monuments, mansions | nether fortresses, bastion remnants, ruined portals | end cities, end ships, end gateway |
| Boss(es)                    | none (raid captain ≠ boss) | wither (summonable anywhere) | ender dragon |
| Bed behavior                | sets spawn / skips night | explodes (power 5) | explodes (power 5) |

---

## Appendix D — End Crystal & Dragon Healing Mathematics

- Dragon max health: 200 HP (100 hearts).
- Heal rate when an end crystal is intact and dragon is near it: **1 HP per tick** = 20 HP/sec.
- Crystal destruction: explosion power 6, radius ~6 blocks, also damages dragon if
  dragon is within radius.
- Dragon respawn requires 4 player-placed crystals on the 4 cardinal sides of the exit
  portal (north, south, east, west). On placement of the 4th, pillars regenerate their
  crystals and the dragon respawns.
- XP drop on death: 12,000 XP (12 levels of XP orbs worth 1000 each → ~67 levels from
  0 to player). Distributed among all players in the End.

---

## Appendix E — Nether Portal Frame Sizing

| Dimension (W × H) | Obsidian required | Notes                                            |
|--------------------|-------------------|--------------------------------------------------|
| 4 × 5 (10 interior blocks for portal? No — interior is 2×3) | 10 obsidian | Minimum size; interior is 2 wide × 3 tall.      |
| 4 × 6             | 12                | Interior 2×4.                                    |
| 5 × 5             | 14                | Interior 3×3.                                    |
| 23 × 23           | 84                | Maximum size; interior 21×21.                    |

Frame can be any rectangle with width 2–23 (interior) and height 3–23 (interior). Frame
blocks can be any solid block (vanilla is obsidian, but any block works if lit by fire
adjacent to obsidian... actually the ignition requires the frame be obsidian for vanilla
mechanics, though some blocks allow portal lighting in modded).

---

End of document. This file is intended as the canonical reference for all dimension
behavior in a Three.js Minecraft clone. Cross-reference with `01-research-blocks.md`
for block IDs and `04-research-world-generation.md` (when available) for terrain noise
parameters.
