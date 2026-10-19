# Minecraft Clone Prompt Kit — 08: Structures Reference

**Edition:** Java Edition 1.21.x (Tricky Trials update)
**Scope:** MAXIMALIST — every world-generated structure, terrain feature that mimics structures, loot tables, jigsaw system, mob spawners, archaeology, stronghold mechanics, and structure block tooling.
**Use:** Reference for AI/LLM prompts generating Minecraft-clone content. Includes block IDs, loot table paths, biome requirements, dimensions, mob spawning behavior, and jigsaw mechanics.

---

## Table of Contents

1. [Structure Generation Overview](#1-structure-generation-overview)
2. [Overworld Structures](#2-overworld-structures)
3. [Nether Structures](#3-nether-structures)
4. [End Structures](#4-end-structures)
5. [Terrain Features & Mini-Features](#5-terrain-features--mini-features)
6. [Loot Table System](#6-loot-table-system)
7. [Jigsaw Block System](#7-jigsaw-block-system)
8. [Mob Spawner Reference](#8-mob-spawner-reference)
9. [Archaeology System](#9-archaeology-system)
10. [Stronghold Eye-of-Ender Mechanics](#10-stronghold-eye-of-ender-mechanics)
11. [Structure Block & Structure Void](#11-structure-block--structure-void)
12. [Per-Structure Loot Summary](#12-per-structure-loot-summary)
13. [Biome-to-Structure Quick Lookup](#13-biome-to-structure-quick-lookup)

---

## 1. Structure Generation Overview

### 1.1 How Structures Are Placed

Structures in Minecraft 1.21.x are placed during world generation by **structure features**, which are data-driven JSON files registered under the `worldgen/structure` directory. Each structure feature references:

- A **structure set** (`worldgen/structure_set`) — defines spacing, separation, and type (random spread or concentric rings).
- A **template pool** or **jigsaw configuration** for multi-piece structures.
- One or more **structure template NBT files** (`data/<namespace>/structures/*.nbt`).

The placement pipeline:

1. **Biome filter** — `biomes` field is a holder set of biome IDs (e.g., `#minecraft:has_structure/village_plains`).
2. **Terrain height check** — `terrain_matching` or `heightmap` placement adjusts vertical position.
3. **Structure start** — placed at chunk (0,0) of the structure's chunk region with deterministic seed-based RNG.
4. **Pieces generation** — jigsaw expansion or single-template placement.
5. **Terrain adaptation** — `beardify`, `beard_thin`, `beard_bounding`, `encapsulate`, `bury`, `none`.
6. **Block placement** — actual block write to chunk palette.

### 1.2 Structure Starts vs Structure Pieces

| Concept | Description |
|---|---|
| **Structure Start** | Anchor point for a single structure instance; one per chunk region. Holds reference to first piece + bounding box. |
| **Structure Piece** | A single template or jigsaw-generated room/corridor. Multi-piece structures (villages, mansions, fortresses) contain many pieces. |
| **Structure Bounding Box** | AABB of the entire start; used for collision, /locate radius, and render culling. Pieces have their own boxes. |
| **Jigsaw Piece** | A piece that has jigsaw blocks for further expansion; defines `pool`, `target`, `name`, and `joint` (roll/aligned). |

### 1.3 Terrain Adaptation Types

| Type | Used By | Effect |
|---|---|---|
| `none` | Most simple structures | No terrain modification |
| `beardify` / `beard_thin` | Villages, outposts | Carves ground under structure; thins out edges |
| `beard_bounding` | Larger jigsaw (bastion) | Bigger beard area |
| `bury` | Strongholds, ancient cities | Backfills around structure |
| `encapsulate` | Trial chambers | Surrounds with stone |

### 1.4 Structure Bounding Boxes

- Stored per piece as `BoundingBox(int x0, y0, z0, x1, y1, z1)`.
- `/structure` commands (and structure block `CORNER` mode) intersect bounding boxes for save.
- The full start's box is the union of all piece boxes.
- Used by mob spawning rules (`StructureSpawns` enum: `NONE`, `BURY`, `SURFACE`).

### 1.5 Loot Table System (Brief)

Chests reference a loot table ID like `minecraft:chests/village/village_plains_house`. Loot is rolled deterministically from the world seed + chunk position + chest position (Java's `Random` seeded with these). See §6 for full reference.

---

## 2. Overworld Structures

### 2.1 Village (5 Variants + Meadow Subset)

Villages are the most complex jigsaw structure. Each variant has its own template pool, building blocks, and villager profession distribution.

| Variant | Biome | Materials | Bed & Profession Set |
|---|---|---|---|
| **Plains** | Plains, Sunflower Plains, Meadow (subset) | Oak logs/planks, cobblestone, hay bales, gravel paths | Armorer, Butcher, Cartographer, Cleric, Farmer, Fisherman, Fletcher, Leatherworker, Librarian, Mason, Shepherd, Toolsmith, Weaponsmith |
| **Desert** | Desert | Smooth sandstone, cut sandstone, sandstone stairs, sandstone walls, terracotta | Same professions, sandstone theme |
| **Savanna** | Savanna | Acacia logs/planks, cobblestone, terracotta, orange terracotta | Same professions, acacia theme |
| **Taiga** | Taiga, Old Growth Taiga | Spruce logs/planks, cobblestone, mossy cobblestone, podzol paths, cobblestone walls | Same professions, spruce theme |
| **Snowy** | Snowy Plains | Spruce logs, packed ice, snow blocks, blue ice | Same professions, snow theme |

#### 2.1.1 Village Building Types (per variant)

All variants use these jigsaw building types (specific materials vary):

| Building | Jigsaw Pool Tag | Loot Table | Notes |
|---|---|---|---|
| Small House (1 bed) | `minecraft:village/<variant>/houses` (small) | `chests/village/village_<variant>_house` | 1 villager |
| Large House (2 beds) | same pool | same | 2 villagers |
| Weaponsmith | `minecraft:village/<variant>/houses` (weaponsmith) | `chests/village/village_weaponsmith` | Double chest, lava, furnaces |
| Armorer | `minecraft:village/<variant>/houses` (armorer) | `chests/village/village_armorer` | 2 blast furnaces |
| Butcher | `minecraft:village/<variant>/houses` (butcher) | `chests/village/village_butcher` | Smokers |
| Cartographer | `minecraft:village/<variant>/houses` (cartographer) | `chests/village/village_cartographer` | Cartography table |
| Cleric | `minecraft:village/<variant>/houses` (cleric) | `chests/village/village_cleric` | Brewing stand |
| Farmer | `minecraft:village/<variant>/houses` (farmer) | `chests/village/village_fisher` (no, this is `village_desert_house` style) | Composters, farmland |
| Fisherman | `minecraft:village/<variant>/houses` (fisherman) | `chests/village/village_fisher` | Barrel, smoker |
| Fletcher | `minecraft:village/<variant>/houses` (fletcher) | `chests/village/village_fletcher` | Fletching table |
| Leatherworker | `minecraft:village/<variant>/houses` (leatherworker) | `chests/village/village_leatherworker` | Cauldron |
| Librarian | `minecraft:village/<variant>/houses` (librarian) | `chests/village/village_librarian` | Lectern |
| Mason | `minecraft:village/<variant>/houses` (mason) | `chests/village/village_mason` | Stonecutter |
| Shepherd | `minecraft:village/<variant>/houses` (shepherd) | `chests/village/village_shepherd` | Loom |
| Toolsmith | `minecraft:village/<variant>/houses` (toolsmith) | `chests/village/village_toolsmith` | Double chest, smithing table |
| Well | `minecraft:village/<variant>/wells` (terminator) | none | Always at start point |
| Meeting Point (Bell) | `minecraft:village/<variant>/meeting_points` | none | Bell + decorative blocks; villagers gather |
| Lamp Post | `minecraft:village/<variant>/decor` | none | 1-3 lampposts per village |
| Path / Road | `minecraft:village/<variant>/streets` | none | Gravel, grass path, etc. |

#### 2.1.2 Village Generation Rules

- **Structure set:** `minecraft:villages`, spacing = 32, separation = 8, type = `random_spread`.
- **Jigsaw depth:** 6 levels of expansion from the well center.
- **Max size:** Up to ~64×64 blocks; ~20–40 pieces depending on RNG.
- **Villager count:** 1 per bed; total 5–20 villagers per village.
- **Iron golems:** spawn naturally if village has ≥10 villagers and ≥20 beds; player can also build iron golem (pumpkin + 4 iron blocks).
- **Cat population:** 1 cat per 4 beds, max 5 cats initially.
- **Zombie siege:** 10% chance per night if village has ≥10 villagers and player is present; spawns zombies regardless of light.

#### 2.1.3 Village Loot Tables

Loot table IDs follow `minecraft:chests/village/village_<variant>_<building>` pattern. Key loot tables:

| Loot Table | Chest Type | Notable Items |
|---|---|---|
| `village_plains_house` | Small chest | Bread, apple, iron ingot, emerald, wheat, seeds |
| `village_desert_house` | Small chest | Same with sandstone-related extras |
| `village_savanna_house` | Small chest | Acacia sapling, melon seeds |
| `village_taiga_house` | Small chest | Spruce sapling, fern, iron ingot |
| `village_snowy_house` | Small chest | Snowball, coal, spruce sapling |
| `village_armorer` | Small chest | Iron ingot, iron boots, bucket, helmet |
| `village_butcher` | Small chest | Coal, emerald, meat, wheat |
| `village_cartographer` | Small chest | Paper, empty map, compass, bread |
| `village_cleric` | Small chest | Redstone, lapis, gold ingot, rotten flesh |
| `village_fisher` | Small chest | Cod, salmon, fishing rod, bucket of cod |
| `village_fletcher` | Small chest | Arrows, flint, sticks, emerald, feather |
| `village_leatherworker` | Small chest | Leather, leather armor, saddle |
| `village_librarian` | Small chest | Paper, books, emerald, ink sac |
| `village_mason` | Small chest | Clay, flower pot, stone, bread |
| `village_shepherd` | Small chest | Wool (all colors), shears, wheat |
| `village_toolsmith` | Double chest | Stone/iron tools, iron ingot, diamond |
| `village_weaponsmith` | Double chest | Iron sword, axe, iron ingot, diamond, bread |

### 2.2 Desert Pyramid (Desert Temple)

| Property | Value |
|---|---|
| Biome | Desert |
| Dimensions | ~21×21 footprint, 10 blocks tall above ground + chamber below |
| Materials | Sandstone, smooth sandstone, cut sandstone, sandstone stairs, chiseled sandstone, orange/blue terracotta |
| Loot Chests | 4 chests in lower chamber |
| Loot Table | `minecraft:chests/desert_pyramid` |
| Trap | 9 TNT under floor pressure plate (stone pressure plate in center triggers) |
| Special | Suspicious sand at the entrance (1.20+, archaeology: `minecraft:chests/desert_well_archaeology` — wait, well not here; desert pyramid uses `minecraft:archaeology/desert_pyramid`) |

**Trap mechanism:** In the lower chamber, a stone pressure plate sits in the center on chiseled sandstone. Directly below: 9 TNT blocks in a 3×3. The pressure plate activates if any entity stands on it; the TNT ignites simultaneously. Players who break the pressure plate safely avoid the trap, but the loot chests are at the corners — accessing them by walking on the center floor is dangerous.

**Loot Table `chests/desert_pyramid` (per chest):**

| Item | Quantity | Chance |
|---|---|---|
| Diamond | 1–3 | 23% |
| Iron Ingot | 2–7 | 18% |
| Gold Ingot | 2–7 | 18% |
| Emerald | 1–3 | 18% |
| Bone | 4–6 | 28% |
| Saddle | 1 | 23% |
| Iron Horse Armor | 1 | 23% |
| Golden Horse Armor | 1 | 18% |
| Diamond Horse Armor | 1 | 14% |
| Book | 1–3 | 23% |
| Golden Apple | 1 | 14% |
| Enchanted Golden Apple | 1 | 2% |
| Gunpowder | 1–8 | 60% |
| String | 1–8 | 60% |
| Spider Eye | 1–3 | 60% |
| Rotten Flesh | 3–7 | 60% |
| Empty Map | 1 | 28% |

**Suspicious sand (archaeology):** Inside the pyramid, broken suspicious sand drops the `pottery_sherds/archer` or `pottery_sherds/miner` or `pottery_sherds/prize` or `pottery_sherds Arms` sherd (pool: `minecraft:archaeology/desert_pyramid`).

### 2.3 Jungle Temple

| Property | Value |
|---|---|
| Biome | Jungle, Bamboo Jungle |
| Dimensions | ~15×12 footprint, multi-floor |
| Materials | Mossy cobblestone, cobblestone, vines, redstone, sticky pistons |
| Loot Chests | 2 (chest at puzzle solution, chest at dispenser trap corridor) |
| Loot Tables | `minecraft:chests/jungle_temple` (both) |
| Trap | 2 dispensers with arrows triggered by tripwire (8 arrows each) |
| Puzzle | Lever puzzle opens hidden chest room |

**Puzzle mechanism:** Three levers on the wall. Pulling the correct combination reveals a small hidden room with a chest. The puzzle solution is wired with redstone to sticky pistons that retract a cobblestone block.

**Dispenser trap:** A corridor has a tripwire hooked to 2 dispensers. Stepping on it fires ~8 arrows per dispenser.

**Loot Table `chests/jungle_temple`:**

| Item | Quantity | Chance |
|---|---|---|
| Diamond | 1–3 | 12% |
| Iron Ingot | 1–5 | 36% |
| Gold Ingot | 2–7 | 36% |
| Bamboo | 1–3 | 30% (Bamboo Jungle only) |
| Emerald | 1–3 | 36% |
| Saddle | 1 | 12% |
| Iron Horse Armor | 1 | 12% |
| Golden Horse Armor | 1 | 6% |
| Diamond Horse Armor | 1 | 3% |
| Book | 1–3 | 18% |
| Bones | 4–8 | 60% |
| Rotten Flesh | 3–7 | 60% |
| Gunpowder | 2–5 | 60% |
| Enchanted Book | 1 | 4% |

### 2.4 Pillager Outpost

| Property | Value |
|---|---|
| Biome | Plains, Desert, Savanna, Taiga, Snowy Plains, Meadow, Cherry Grove, Mangrove Swamp, etc. (any `#pillager_outpost` biomes) |
| Dimensions | ~11×11 base, ~20 blocks tall tower + 1–4 small tents/cart structures |
| Materials | Dark oak logs, cobblestone, cobblestone walls, dark oak planks |
| Loot Chests | 1 chest at top of tower |
| Loot Table | `minecraft:chests/pillager_outpost` |
| Mobs | Pillager patrols (4+), 1 Pillager Captain (banner on back) |
| Special | Caged iron golem (sometimes), target practice logs, Allays in cage (1.19+ confirmed feature) |
| Raid trigger | Killing the captain grants `Bad Omen` → entering a village starts a raid |

**Loot Table `chests/pillager_outpost`:**

| Item | Quantity | Chance |
|---|---|---|
| Crossbow | 1 | 50% (often enchanted) |
| Wheat | 3–5 | 50% |
| Dark Oak Log | 2–3 | 50% |
| Bottle o' Enchanting | 1–3 | 50% |
| Iron Ingot | 1–3 | 30% |
| Goat Horn | 1 | 20% (only in mountain variants) |
| Carrot | 2–4 | 30% |
| Potato | 2–4 | 30% |
| String | 1–6 | 30% |
| Gunpowder | 1–3 | 30% |
| Any Music Disc (13, cat, blocks, chirp, far, mall, mellohi, stal, strad, ward, 11, wait) | 1 | 5% |
| Compass | 1 | 5% |
| Book | 1 | 5% |
| Iron Pickaxe | 1 | 5% |

**Allays:** As of 1.19+, certain pillager outposts in meadow biomes have cages containing 1–3 Allays instead of iron golems (very rare).

### 2.5 Woodland Mansion

| Property | Value |
|---|---|
| Biome | Dark Forest, Dark Forest Hills |
| Dimensions | ~30–60 blocks wide, 3 floors tall (~20 blocks high) |
| Structure set | `minecraft:mansion`, spacing 80, separation 20 |
| Materials | Dark oak logs/planks, cobblestone, dark oak stairs/slabs, carpet (varied colors) |
| Loot Chests | Multiple (1–5+), varies by room layout |
| Loot Tables | `minecraft:chests/woodland_mansion` (1-pool), `minecraft:chests/woodland_mansion` for all |
| Mobs | Vindicators (regular), Evokers (drop Totem of Undying + emeralds), Pillagers (rare) |

**Room types** (selected from many jigsaw templates; each mansion picks ~50 rooms):

| Room Type | Description | Loot |
|---|---|---|
| Storage | Chests with wood, saplings, coal | Yes |
| Bedroom | Bed, carpet, chests | Yes |
| Large Room | Open with chests | Yes |
| Altar | 2 vindicators, chest, cobblestone altar | Yes (rare: diamond chestplate) |
| Library | Bookshelves, chests with books | Yes |
| Forge | Furnaces, lava, anvils | Yes |
| Map Room | Floor maps, banners | Yes |
| Spider Room | Cobwebs, spider spawner | No |
| Chicken Room | Chickens, hay bales | No |
| Pumpkin Room | Pumpkins, carved | No |
| Tree (Birch/Spruce) | Tree growing indoors | No |
| Illager Statues | Cobblestone statue of illager head | No |
| Maze | 1×1 dark oak corridors | Yes |
| Prison | Iron bars, vindicator | Yes |
| Dining Hall | Long table, chairs, chest | Yes |
| Statue Courtyard | With vindicator | No |

**Mobs:**
- **Vindicator** — 4–10 per mansion; iron axe; closes eyes when aggro; "Johnny" nametag attacks all non-illagers.
- **Evoker** — 1–5 per mansion; summons vexes (3 at a time) and fang attacks; drops 1 Totem of Undying + 0–1 emerald.
- **Allay cages** — confirmed: 1–3 Allays can be found in caged rooms (1.19+).

**Loot Table `chests/woodland_mansion`:**

| Item | Quantity | Chance |
|---|---|---|
| Diamond Chestplate | 1 | 6.5% |
| Diamond Hoe | 1 | 6.5% |
| Diamond Leggings | 1 | 6.5% |
| Diamond Pickaxe | 1 | 6.5% |
| Diamond Sword | 1 | 6.5% |
| Diamond Axe | 1 | 6.5% |
| Lead | 1–2 | 28% |
| Chainmail Chestplate | 1 | 14% |
| Golden Apple | 1 | 7.7% |
| Enchanted Golden Apple | 1 | 1% |
| Book | 1–3 | 60% |
| Coal | 1–5 | 35% |
| Bone | 1–5 | 35% |
| Rotten Flesh | 1–5 | 35% |
| Iron Ingot | 1–3 | 35% |
| String | 1–5 | 35% |
| Arrow | 1–5 | 35% |
| Music Disc (13, cat, blocks, chirp, far, mall, mellohi, stal, strad, ward, 11, wait) | 1 | 2% |
| Vex Armor Trim Smithing Template | 1 | 7.5% (1.20+) |
| Emerald | 1 | 12% |

### 2.6 Ocean Monument

| Property | Value |
|---|---|
| Biome | Deep Ocean, Deep Cold Ocean, Deep Frozen Ocean, Deep Lukewarm Ocean |
| Dimensions | 58×58 footprint, ~25 blocks tall |
| Structure set | `minecraft:monuments`, spacing 32, separation 5 |
| Materials | Prismarine, prismarine bricks, dark prismarine, sea lanterns, sponge (wet), gold blocks |
| Loot | NO CHESTS — gold blocks in center monument |
| Mobs | 3 Elder Guardians (top center, two wings), Guardians (randomly spawned) |

**Layout:**
- Central pyramid with 4 corner wings.
- **Elder Guardian positions:** One at top of central pyramid; one in each of the two side wings' inner rooms.
- **Gold blocks:** 8 gold blocks (in a 2×2×2 cube) buried in the central room at the monument's heart — accessed by mining through prismarine from the top.
- **Sponge rooms:** Located in the wings; contain 30+ wet sponges on the ceiling — needed to clear water from the monument.
- **Sea lanterns:** provide lighting throughout.

**Mining fatigue:** All 3 Elder Guardians inflict Mining Fatigue III within 50 blocks; reduces dig speed by ~70%. To mine gold blocks efficiently, drink milk or kill all 3 elders first.

**Loot (from Elder Guardian drops):**
- Prismarine shards (0–2), raw cod (0–1), sponge (1, 25% chance on player kill), sea lantern (rare tide armor trim smithing template, 1.20+, 20% chance per elder kill), crystals (none — Guardians drop nothing else).

**Tide Armor Trim Smithing Template:** Drops from Elder Guardians (20% chance per kill). Used to add tide trim pattern to armor.

### 2.7 Ocean Ruins

| Property | Value |
|---|---|
| Biome | Ocean, Cold Ocean, Frozen Ocean, Warm Ocean, Deep Ocean variants |
| Variants | Cold (stone brick) and Warm (sandstone) variants |
| Sizes | Small (single-room ruin) and Large (multi-room ruin) |
| Materials (cold) | Stone bricks, mossy stone bricks, cracked stone bricks, gravel |
| Materials (warm) | Sandstone, cut sandstone, chiseled sandstone |
| Loot Chests | 0–1 chest per ruin (50% chance) |
| Loot Table | `minecraft:chests/underwater_ruin_big` or `minecraft:chests/underwater_ruin_small` |
| Mobs | Drowned (1–3 per ruin, 25% spawn rate) |
| Archaeology | Suspicious sand/gravel with `minecraft:archaeology/ocean_ruin_cold` or `minecraft:archaeology/ocean_ruin_warm` |

**Loot Table `chests/underwater_ruin_big`:**

| Item | Quantity | Chance |
|---|---|---|
| Coal | 1–4 | 81% |
| Stone Pickaxe | 1 | 25% (enchanted) |
| Wheat | 2–3 | 81% |
| Golden Apple | 1 | 16% |
| Enchanted Book | 1 | 16% |
| Leather Chestplate | 1 | 25% (enchanted) |
| Golden Helmet | 1 | 16% (enchanted) |
| Iron Ingot | 1–2 | 30% |
| Emerald | 1 | 25% |
| Prismarine Crystals | 1–2 | 25% |

### 2.8 Shipwreck

| Property | Value |
|---|---|
| Biome | Ocean, Beach, Frozen Ocean (beached variants) |
| Variants | Bow, Stern, Full ship (bow + stern together), each with ocean or beached variant |
| Materials | Wood (oak, spruce, jungle, dark oak, birch — random per ship), planks, fences, ladders, chests |
| Loot Chests | 1 supply chest (bow), 1 treasure chest (stern), 1 map chest (full ship only) |
| Loot Tables | `minecraft:chests/shipwreck_supply`, `minecraft:chests/shipwreck_treasure`, `minecraft:chests/shipwreck_map` |

**Loot Table `chests/shipwreck_supply`:**

| Item | Quantity | Chance |
|---|---|---|
| Paper | 1–12 | 80% |
| Potato | 2–6 | 80% |
| Wheat | 8–21 | 80% |
| Carrot | 4–8 | 80% |
| Coal | 2–8 | 60% |
| Rotten Flesh | 5–24 | 60% |
| Gunpowder | 1–5 | 60% |
| Poisonous Potato | 1–2 | 60% |
| Bamboo | 1–3 | 60% |
| Pumpkin | 1–3 | 60% |
| Empty Map | 1 | 50% |
| Suspicious Stew | 1 | 20% |
| TNT | 1–3 | 20% |
| Leather | 1–5 | 20% |
| Bone | 1–5 | 20% |
| Coal Block | 1 | 10% |
| Iron Ingot | 1–5 | 10% |
| Cookie | 1–7 | 10% |
| Music Disc | 1 | 5% |
| Cocoa Beans | 1–3 | 10% |
| Gold Ingot | 1–5 | 5% |
| Emerald | 1–5 | 5% |

**Loot Table `chests/shipwreck_treasure`:**

| Item | Quantity | Chance |
|---|---|---|
| Iron Ingot | 1–5 | 95% |
| Iron Nugget | 1–10 | 95% |
| Emerald | 1–5 | 95% |
| Lapis Lazuli | 1–10 | 95% |
| Gold Ingot | 1–5 | 80% |
| Gold Nugget | 1–10 | 80% |
| Bottle o' Enchanting | 1 | 80% |
| Diamond | 1 | 14% |
| TNT | 1–3 | 50% |
| Leather | 1–5 | 50% |
| Packed Ice | 1–3 | 50% |
| Totem of Undying | 1 | 0.5% (rare drop) |

**Loot Table `chests/shipwreck_map`:**

| Item | Quantity | Chance |
|---|---|---|
| Buried Treasure Map | 1 | 100% |
| Paper | 1–10 | 90% |
| Feather | 1–5 | 90% |
| Book | 1–5 | 90% |
| Compass | 1 | 50% |
| Map (Empty) | 1 | 50% |
| Clock | 1 | 50% |
| Navigation Chart | — | n/a |

### 2.9 Buried Treasure

| Property | Value |
|---|---|
| Biome | Beaches (beach, snowy beach, stone shore) |
| Location | Buried in sand/gravel at Y=~64, ~5 blocks underground |
| Loot Chests | 1 |
| Loot Table | `minecraft:chests/buried_treasure` |
| Special | Always contains Heart of the Sea |

**Loot Table `chests/buried_treasure`:**

| Item | Quantity | Chance |
|---|---|---|
| Heart of the Sea | 1 | 100% |
| Iron Ingot | 1–4 | 99% |
| Gold Ingot | 1–4 | 99% |
| Cooked Cod | 2–4 | 80% |
| Cooked Salmon | 2–4 | 80% |
| Potion of Water Breathing | 1 | 60% |
| TNT | 1–2 | 60% |
| Diamond | 1 | 60% |
| Prismarine Crystals | 1–4 | 50% |
| Bottle o' Enchanting | 1 | 50% |
| Emerald | 4–8 | 40% |
| Leather | 1–4 | 40% |
| Music Disc | 1 | 20% |
| Lily Pad | 1–3 | 20% |
| Trident (damaged) | 1 | 1% (rare) |

### 2.10 Igloo

| Property | Value |
|---|---|
| Biome | Snowy Plains, Snowy Taiga, Snowy Slopes |
| Dimensions | ~7×8 footprint, dome shape |
| Materials | Snow block, white carpet, ice (regular), crafting table, bed, furnace, ladder |
| Loot Chests | 0 in top; 1 in basement (50% have basement) |
| Loot Table | `minecraft:chests/igloo_chest` |
| Special | 50% have basement with villager + zombie villager + brewing stand |

**Basement layout:**
- Trapdoor in floor under carpet leads to ladder going down ~20 blocks.
- Basement has caged villager and caged zombie villager (separated by iron bars).
- Brewing stand with Splash Potion of Weakness.
- Chest with golden apple (to cure zombie villager — drop apple + splash weakness to make a cure demo).
- 2 cauldrons, 2 chests.

**Loot Table `chests/igloo_chest`:**

| Item | Quantity | Chance |
|---|---|---|
| Golden Apple | 1 | 60% |
| Coal | 1–4 | 60% |
| Stick | 1–3 | 60% |
| Stone Axe | 1 | 60% |
| Rotten Flesh | 1–3 | 60% |
| Emerald | 1 | 60% |
| Wheat | 2–4 | 60% |
| Paper | 1–3 | 60% |
| Arrow | 2–5 | 60% |
| Golden Apple | 1 | 60% (note: same as above; verify) |

### 2.11 Swamp Hut (Witch Hut)

| Property | Value |
|---|---|
| Biome | Swamp, Mangrove Swamp |
| Dimensions | 7×7 footprint, on stilts |
| Materials | Spruce planks, spruce stairs, spruce logs (stilts), oak fence, oak door |
| Loot Chests | 1 |
| Loot Table | `minecraft:chests/village/village_cartographer` (no — actually no chest loot table by default; witch drops provide loot) |
| Mobs | 1 Witch (only spawns inside hut area), 1 Black Cat |

**Special:** The witch spawn is hard-coded — the bounding box of a swamp hut guarantees witch spawns (doesn't require darkness). This is one of the few structure-based mob farm mechanics in vanilla.

**Loot:** Swamp huts do NOT contain chests. The witch inside drops (on death): redstone, glowstone, sugar, gunpowder, spider eye, glass bottle, stick, etc.

### 2.12 Mineshaft

| Property | Value |
|---|---|
| Biome | Underground everywhere except air/End/Nether; mineshafts generate based on Y level |
| Variants | Regular (wooden supports) and **Mesa** (oak wood → dark oak in badlands biomes) |
| Materials | Oak planks, oak fences, oak logs, rail, dirt floor, cave air, lava, water |
| Loot Chests | Minecart with chest (1–3 per shaft) |
| Loot Table | `minecraft:chests/abandoned_mineshaft` |
| Mobs | Cave spiders (spawner, 1 per shaft on average) |
| Special | `mineshaft_mesa` uses dark oak wood; mineshafts can intersect caves |

**Mesa mineshaft:** Badlands biome (renamed from "Mesa"). Uses dark oak wood instead of oak. Mineshafts are denser in badlands (multiplied by 3x).

**Loot Table `chests/abandoned_mineshaft`:**

| Item | Quantity | Chance |
|---|---|---|
| Lead | 1 | 28% |
| Coal | 1–4 | 35% |
| Iron Ingot | 2–8 | 35% |
| Redstone Dust | 4–9 | 35% |
| Lapis Lazuli | 4–9 | 35% |
| Gold Ingot | 1–3 | 35% |
| Diamond | 1–2 | 14% |
| Bread | 1–3 | 35% |
| Melon Seeds | 2–4 | 35% |
| Pumpkin Seeds | 2–4 | 35% |
| Beetroot Seeds | 2–4 | 35% |
| Torch | 1–16 | 65% |
| Name Tag | 1 | 35% |
| Enchanted Book | 1 | 14% |
| Music Disc (13, cat, blocks, chirp, far, mall, mellohi, stal, strad, ward, 11, wait) | 1 | 5% |
| Golden Apple | 1 | 8.5% |
| Enchanted Golden Apple | 1 | 1% |
| Rail | 4–8 | 70% |
| Iron Pickaxe (enchanted) | 1 | 5% |
| Glow Berries | 1–8 | 20% |

### 2.13 Stronghold

| Property | Value |
|---|---|
| Biome | Any overworld biome (underground) |
| Dimensions | Variable — multi-room, ~30–80 blocks across |
| Structure set | `minecraft:strongholds`, type = `concentric_rings`, distance = 32, count = 128, spread = 3 |
| Materials | Stone bricks, mossy stone bricks, cracked stone bricks, infested stone bricks, iron bars, oak doors, bookshelves, ladders, torches |
| Loot Chests | 2–3 library chests (double chests), storage rooms with chests |
| Loot Tables | `minecraft:chests/stronghold_corridor`, `minecraft:chests/stronghold_library`, `minecraft:chests/stronghold_crossing` |
| Mobs | Silverfish spawner (in portal room) |
| Special | End Portal frame with 0–12 eyes; silverfish-infested blocks; portal room is unique per stronghold |

**Rooms:**
- **Portal room** — contains silverfish spawner, lava under, end portal frame (12 blocks in 3×3 with corners missing — actually 12 blocks forming a 3×3 ring with 4 corners open). 10% chance per portal frame block to already contain an Eye of Ender; total 0–12 eyes.
- **Library** — multi-floor with bookshelves, ladders, 1–2 chests (double chests on the upper floor).
- **Corridors** — with chests (single chests).
- **Storage rooms** — empty archways and staircases.
- **Crossing rooms** — 5-way junctions.

**Loot Table `chests/stronghold_corridor`:**

| Item | Quantity | Chance |
|---|---|---|
| Ender Pearl | 1 | 24% |
| Iron Ingot | 1–5 | 35% |
| Iron Boots (enchanted) | 1 | 12% |
| Iron Helmet (enchanted) | 1 | 12% |
| Iron Leggings (enchanted) | 1 | 12% |
| Iron Chestplate (enchanted) | 1 | 12% |
| Iron Sword (enchanted) | 1 | 12% |
| Iron Pickaxe (enchanted) | 1 | 12% |
| Iron Axe (enchanted) | 1 | 12% |
| Iron Shovel (enchanted) | 1 | 12% |
| Apple | 1–3 | 60% |
| Bread | 1–3 | 60% |
| Ink Sac | 1–3 | 60% |
| Compass | 1 | 12% |
| Book | 1–3 | 12% |
| Paper | 1–3 | 60% |
| Redstone Dust | 4–9 | 12% |
| Enchanted Book | 1 | 12% |
| Gold Ingot | 1–3 | 12% |
| Music Disc | 1 | 5% |
| Diamond | 1 | 8% |
| Golden Apple | 1 | 4% |
| Coal | 3–8 | 35% |
| Eye Armor Trim Smithing Template | 1 | 25% (1.20+) |

**Loot Table `chests/stronghold_library`:**

| Item | Quantity | Chance |
|---|---|---|
| Book | 1–3 | 90% |
| Paper | 2–7 | 90% |
| Empty Map | 1 | 12% |
| Compass | 1 | 12% |
| Enchanted Book | 1 | 60% (high level enchantments) |

**Loot Table `chests/stronghold_crossing`:**

| Item | Quantity | Chance |
|---|---|---|
| Iron Ingot | 1–5 | 60% |
| Stone Button | 1 | 30% |
| Apple | 1–3 | 60% |
| Bread | 1–3 | 60% |
| Iron Boots (enchanted) | 1 | 10% |
| Iron Helmet (enchanted) | 1 | 10% |
| Iron Leggings (enchanted) | 1 | 10% |
| Iron Chestplate (enchanted) | 1 | 10% |
| Iron Sword (enchanted) | 1 | 10% |
| Iron Pickaxe (enchanted) | 1 | 10% |
| Eye Armor Trim Smithing Template | 1 | 25% (1.20+) |

### 2.14 Ruined Portal

| Property | Value |
|---|---|
| Biome | Any overworld biome + Nether |
| Variants | Overworld (regular, desert, jungle, swamp, mountain, ocean, underground) + Nether |
| Dimensions | Varies; portal frame (4×5 obsidian, sometimes damaged) |
| Materials | Crying obsidian, obsidian, lava, netherrack, stone bricks (sometimes mossy), chests |
| Loot Chests | 1 (50% chance) |
| Loot Table | `minecraft:chests/ruined_portal` |
| Special | Already partially-built nether portal frame; needs flint and steel to ignite |

**Loot Table `chests/ruined_portal`:**

| Item | Quantity | Chance |
|---|---|---|
| Obsidian | 1–2 | 46% |
| Flint | 1–4 | 40% |
| Iron Nugget | 9–18 | 40% |
| Fire Charge | 1 | 40% |
| Golden Boots (enchanted, Soul Speed) | 1 | 33% |
| Golden Axe (enchanted) | 1 | 16% |
| Golden Hoe (enchanted) | 1 | 16% |
| Golden Pickaxe (enchanted) | 1 | 16% |
| Golden Shovel (enchanted) | 1 | 16% |
| Golden Sword (enchanted) | 1 | 16% |
| Golden Helmet (enchanted, Soul Speed) | 1 | 33% |
| Golden Leggings (enchanted, Soul Speed) | 1 | 33% |
| Golden Chestplate (enchanted, Soul Speed) | 1 | 33% |
| Golden Apple | 1 | 16% |
| Enchanted Golden Apple | 1 | 2% |
| Crying Obsidian | 1–3 | 16% |
| Glowstone | 3–6 | 16% |
| Nether Quartz | 4–8 | 16% |
| Clock | 1 | 16% |
| Golden Carrot | 6–12 | 16% |
| Feather | 4–8 | 16% |
| Magma Cream | 2–4 | 16% |

### 2.15 Ancient City

| Property | Value |
|---|---|
| Biome | Deep Dark biome (Y < -30, in mountain biomes) |
| Dimensions | Variable; large multi-room structure |
| Structure set | `minecraft:ancient_cities`, spacing 96, separation 24 |
| Materials | Deepslate, deepslate tiles, deepslate bricks, soul sand, soul fire, soul lantern, candles (gray), sculk, sculk sensor, sculk shrieker, sculk catalyst |
| Loot Chests | Multiple (5–10), scattered through corridors and central chest area |
| Loot Tables | `minecraft:chests/ancient_city`, `minecraft:chests/ancient_city_ice_box` |
| Mobs | Warden (summoned via sculk shrieker); no natural spawns |
| Special | Echo shards (used to craft Recovery Compass), disc fragment 5, Silence Armor Trim smithing template, Swift Sneak enchanted books |

**Layout:**
- Large central plaza with pillars (ruined city aesthetic).
- Ice box room (with blue ice, packed ice) — has special loot chest.
- Multiple side corridors with chests.
- Large stone pillar structures marking landmarks.
- Soul sand + soul fire features (mood lighting).

**Loot Table `chests/ancient_city`:**

| Item | Quantity | Chance |
|---|---|---|
| Echo Shard | 1–3 | 30% |
| Disc Fragment (5) | 1 | 30% |
| Sculk Catalyst | 1–2 | 16% |
| Soul Lantern | 1–4 | 23% |
| Candle | 1–4 | 23% |
| Book (enchanted Swift Sneak) | 1 | 23% (Swift Sneak I-III) |
| Amethyst Shard | 1–3 | 23% |
| Bottle o' Enchanting | 1 | 23% |
| Compass | 1 | 16% |
| Book | 1–3 | 35% |
| Sculk Sensor | 1 | 16% |
| Bone | 1–5 | 35% |
| Coal | 2–6 | 35% |
| Soul Sand | 2–6 | 35% |
| Candle | 1–4 | 23% |
| Diamond Horse Armor | 1 | 6% |
| Golden Apple | 1 | 8% |
| Enchanted Golden Apple | 1 | 1% |
| Lead | 1 | 6% |
| Glass Bottle | 1 | 6% |
| Music Disc (13, cat, blocks, chirp, far, mall, mellohi, stal, strad, ward, 11, wait) | 1 | 5% |
| Silence Armor Trim Smithing Template | 1 | 1% (rare — from central chest) |

**Loot Table `chests/ancient_city_ice_box`:**

| Item | Quantity | Chance |
|---|---|---|
| Echo Shard | 1–6 | 35% |
| Snowball | 1–6 | 50% |
| Bread | 1–3 | 67% |
| Packed Ice | 1–3 | 50% |
| Blue Ice | 1 | 50% |
| Baked Potato | 1–3 | 50% |
| Suspicious Stew | 1 | 50% |
| Golden Carrot | 1–3 | 50% |

### 2.16 Trail Ruins

| Property | Value |
|---|---|
| Biome | Taiga, Snowy Taiga, Old Growth Taiga, Old Growth Birch Forest, Jungle, Bamboo Jungle, Mangrove Swamp, Cherry Grove |
| Dimensions | ~12×18 footprint, buried ruins |
| Materials | Mud brick, stone bricks, gravel, dirt, suspicious gravel |
| Loot Chests | NONE — loot is via brushing suspicious gravel |
| Mobs | None (no spawners) |
| Special | Buried archaeology structure with suspicious gravel; contains pottery sherds and smithing templates |

**Archaeology loot pools:**
- `minecraft:archaeology/trail_ruins_common` — common items (Emerald, Wheat, Coal, etc.)
- `minecraft:archaeology/trail_ruins_rare` — rare items: Wayfinder, Raiser, Shaper, Host Armor Trim smithing templates

**Common pool (`archaeology/trail_ruins_common`) items:**
- Emerald, Wheat, Wooden Hoe, Coal, Leather, Brick, Clay Ball, Bead, Blue Dye, Light Blue Dye, White Dye, Orange Dye, Dyed (any color), String, Red Dye, Pink Dye, Yellow Dye, Purple Dye, Glow Berries, Wheat Seeds, Beetroot Seeds, Bone Meal

**Rare pool (`archaeology/trail_ruins_rare`) items:**
- 20 Pottery Sherds (Angler, Archer, Arms Up, Blade, Brewer, Burn, Danger, Explorer, Friend, Heart, Heartbreak, Howl, Miner, Mourner, Plenty, Prize, Sheaf, Shelter, Skull, Snort — see §9)
- 4 Smithing Templates: Wayfinder, Raiser, Shaper, Host armor trims

### 2.17 Trial Chambers (1.21+)

| Property | Value |
|---|---|
| Biome | Underground, any biome, Y level around -40 to -20 |
| Dimensions | Large multi-chamber underground structure |
| Structure set | `minecraft:trial_chambers`, spacing 48, separation 14 |
| Materials | Tuff, tuff bricks, copper (regular, exposed, weathered), copper bulbs, copper grates, chiseled tuff |
| Loot Chests | 0 (uses trial spawners and vaults) |
| Mobs | Spawned by trial spawners: Zombie, Husk, Baby Zombie, Slime, Silverfish, Cave Spider, Skeleton, Stray, Bogged, Spider, Baby Spider; Mini-boss: Breeze (ominous only) |
| Special | Trial Spawners + Vault blocks, Ominous variants trigger stronger encounters |

**Key blocks:**
- **Trial Spawner** — mob spawner that scales with players nearby; after killing N mobs, ejects loot and goes on cooldown. Has ominous variant (with ominous bottle applied to player → harder mobs + better loot).
- **Vault Block** — locked cube; player uses Trial Key (or Ominous Trial Key) to unlock for per-player loot.
- **Copper Bulb** — light block that toggles when powered by redstone; oxidizes over time.
- **Copper Grate** — decorative transparent block.
- **Chiseled Tuff** — decorative building block.

**Trial spawner mechanics:**
- Detects players within 14-block radius.
- Spawns mobs scaled by player count: 1 mob per player, max 6 simultaneous mobs.
- Each mob kill counts toward a kill threshold (default 6 kills per player present).
- On reaching threshold, spawner ejects loot and goes on 30-minute cooldown.
- **Ominous Trial Spawner**: When player has Bad Omen (from Ominous Bottle), spawners in range become ominous — spawn stronger mobs (e.g., zombies with armor) and eject better loot (including Ominous Trial Key instead of Trial Key).

**Vault loot (`chests/trial_chambers/reward` and `chests/trial_chambers/reward_ominous`):**

| Item (Reward Common) | Quantity | Chance |
|---|---|---|
| Trial Key | 1–3 | 50% |
| Emerald | 2–4 | 30% |
| Iron Ingot | 1–4 | 30% |
| Golden Apple | 1 | 10% |
| Bread | 1–3 | 30% |
| Bone Meal | 1–6 | 20% |
| Arrow | 2–8 | 20% |
| Cake | 1 | 5% |
| Music Disc | 1 | 5% |
| Enchanted Book | 1 | 10% |
| Diamond | 1 | 5% |
| Trident | 1 | 1% |

| Item (Reward Ominous) | Quantity | Chance |
|---|---|---|
| Ominous Trial Key | 1–3 | 50% |
| Ominous Bottle | 1–3 | 30% (various effects) |
| Diamond | 1–3 | 20% |
| Enchanted Book (Breach, Density, Wind Burst) | 1 | 15% |
| Emerald | 4–8 | 30% |
| Golden Apple | 1 | 15% |
| Enchanted Golden Apple | 1 | 1% |
| Diamond Sword (enchanted) | 1 | 5% |
| Diamond Chestplate (enchanted) | 1 | 5% |
| Banner Pattern (Bordure Indented, Flow, Guster) | 1 | 10% |
| Music Disc (Precipice, Creator) | 1 | 5% |
| Heavy Core | 1 | 2% (used to craft Mace with Breeze Rod) |
| Guster Pottery Sherd | 1 | 10% |
| Flow Pottery Sherd | 1 | 10% |
| Scute Pottery Sherd | 1 | 10% |
| Blade Pottery Sherd | 1 | 10% |

### 2.18 Fossils

| Property | Value |
|---|---|
| Biome | Desert, Swamp, Mangrove Swamp underground |
| Dimensions | Varies (skull: ~5×5; ribcage: 7×3; etc.) |
| Materials | Bone block |
| Loot | None |
| Special | Pure decorative structure; each fossil is a partial skeleton |

**Fossil types:**
- Skull (4 variants)
- Spine (4 variants)
- Rib cage (2 variants)
- Limb (1 variant)

Fossils generate at Y 0–320 in deserts/swamps (any Y in 1.18+ world generation).

### 2.19 Geode (Amethyst Geode)

| Property | Value |
|---|---|
| Biome | Any overworld biome underground |
| Dimensions | ~11×11 outer shell |
| Materials | Smooth basalt (outer), calcite (middle), budding amethyst (inner), amethyst blocks, amethyst buds (small/medium/large), amethyst clusters |
| Loot | None |
| Special | Source of amethyst; budding amethyst grows amethyst buds over time |

**Geode structure:**
- 3-layer sphere: outer smooth basalt → calcite → inner budding amethyst layer.
- Inside filled with amethyst blocks.
- Some have water/lava inclusions (rare).
- Geodes below Y=30 have a 10% chance of having a chest with loot (since 1.18 — actually this was a bug; not officially intended).

### 2.20 Desert Well

| Property | Value |
|---|---|
| Biome | Desert |
| Dimensions | 5×5 footprint, 1 block deep water |
| Materials | Sandstone, sandstone slab, water, suspicious sand |
| Loot | Suspicious sand at bottom contains archaeology loot |
| Loot Table | `minecraft:archaeology/desert_well` |

**Archaeology loot (`archaeology/desert_well`):**
- 5 Pottery Sherds (Archer, Arms Up, Brewer, Danger, Skull)
- Emerald, Brick, Stick, Suspicious Stew

### 2.21 Dungeon

| Property | Value |
|---|---|
| Biome | Any overworld biome underground (Y -64 to 320) |
| Dimensions | Variable (small room, ~7×7) |
| Materials | Cobblestone, mossy cobblestone |
| Loot Chests | 1–2 chests |
| Loot Table | `minecraft:chests/simple_dungeon` |
| Mobs | 1 mob spawner in center |

**Spawner mob distribution:**
- Zombie: 50%
- Skeleton: 25%
- Spider: 25%
- Cave Spider: 5% (rare, only in specific cave types)
- Silverfish: 1% (extremely rare, in strongholds)
- (No pillager, slime, or other spawners in dungeons.)

**Loot Table `chests/simple_dungeon`:**

| Item | Quantity | Chance |
|---|---|---|
| Bone | 1–8 | 50% |
| Gunpowder | 1–8 | 50% |
| Rotten Flesh | 1–8 | 50% |
| String | 1–8 | 50% |
| Wheat | 1–4 | 35% |
| Bread | 1 | 35% |
| Name Tag | 1 | 25% |
| Saddle | 1 | 25% |
| Coal | 1–4 | 35% |
| Redstone Dust | 1–4 | 25% |
| Music Disc (13, cat, blocks, chirp, far, mall, mellohi, stal, strad, ward, 11, wait) | 1 | 5% |
| Iron Ingot | 1–4 | 25% |
| Bucket | 1 | 18% |
| Golden Apple | 1 | 18% |
| Enchanted Book | 1 | 14% |
| Melon Seeds | 2–4 | 18% |
| Beetroot Seeds | 2–4 | 18% |
| Pumpkin Seeds | 2–4 | 18% |
| Gunpowder | 1–8 | 25% |
| Iron Horse Armor | 1 | 18% |
| Golden Horse Armor | 1 | 12% |
| Diamond Horse Armor | 1 | 6% |
| Lead | 1 | 18% |

---

## 3. Nether Structures

### 3.1 Nether Fortress

| Property | Value |
|---|---|
| Biome | Any Nether biome (Hell, Soul Sand Valley, Crimson/Warped Forest, Basalt Deltas) |
| Dimensions | Large multi-piece structure, ~30–80 blocks across |
| Structure set | `minecraft:fortresses`, spacing 27, separation 4 |
| Materials | Nether bricks, nether brick fence, nether brick stairs, nether brick slab, nether wart blocks, soul sand, lava |
| Loot Chests | 2 (1 in corridor, 1 in Nether wart farm room) |
| Loot Tables | `minecraft:chests/fortress_corridor` (corridor), `minecraft:chests/fortress_crossing` (intersection), `minecraft:chests/nether_bridge` (bridge) |
| Mobs | Blaze (spawner, multiple), Wither Skeleton, Skeleton, Magma Cube, Pig (rare, occasionally spawn in fortress) |
| Special | Nether wart farm — only natural source of Nether Wart; blaze spawners for blaze rods |

**Layout:**
- Bridge structures with stairs leading up to elevated walkways.
- Two main parts: bridges (with supports) and indoor areas (rooms, corridors).
- **Blaze spawner rooms:** ~2–4 per fortress; blaze spawner in center, surrounded by nether brick stairs platforms.
- **Nether wart farm:** small room with soul sand patches growing nether wart.
- **Corridors:** 3-wide corridors with chest alcoves.

**Loot Table `chests/nether_bridge`:**

| Item | Quantity | Chance |
|---|---|---|
| Diamond | 1 | 7% |
| Iron Ingot | 1–5 | 35% |
| Gold Ingot | 1–5 | 35% |
| Nether Quartz | 4–10 | 35% |
| Nether Wart | 5–10 | 35% |
| Saddle | 1 | 35% |
| Gold Horse Armor | 1 | 25% |
| Iron Horse Armor | 1 | 25% |
| Diamond Horse Armor | 1 | 12% |
| Obsidian | 2–4 | 35% |
| Flint and Steel | 1 | 35% |
| Glowstone Dust | 5–10 | 35% |
| Magma Cream | 2–4 | 35% |
| Golden Sword | 1 | 25% |
| Golden Apple | 1 | 18% |
| Enchanted Book | 1 | 12% |
| Rib Armor Trim Smithing Template | 1 | 6% (1.20+) |

### 3.2 Bastion Remnant

| Property | Value |
|---|---|
| Biome | Nether Wastes, Crimson Forest, Warped Forest, Soul Sand Valley (NOT Basalt Deltas) |
| Dimensions | ~50×50 footprint, multi-piece |
| Structure set | `minecraft:bastion_remnant`, spacing 27, separation 4 |
| Materials | Blackstone, blackstone stairs/slabs/walls, polished blackstone, gilded blackstone, basalt, lava, gold blocks |
| Loot Chests | Multiple (4–8+ depending on variant) |
| Loot Tables | Multiple — see below |
| Mobs | Piglins (aggressive if no gold armor), Piglin Brutes (always aggressive, drop nothing), Hoglins (only in hoglin stable variant), Magma Cubes (sometimes) |
| Special | Gold blocks (used as treasure); ominous banner; magma cube spawner (in housing variant); pigs drop on player kill |

**Variants:**

| Variant | Description | Loot Table |
|---|---|---|
| **Hoglin Stables** | Multiple hoglins in pens; ramp structure | `chests/bastion_hoglin_stable` |
| **Treasure** | Central gold block pyramid, double chests | `chests/bastion_treasure` |
| **Bridge** | Long bridge structure with piglin brutes | `chests/bastion_bridge` |
| **Housing** | Residential units with beds, chests | `chests/bastion_other` (common) |

**Loot Table `chests/bastion_treasure`:**

| Item | Quantity | Chance |
|---|---|---|
| Diamond | 1–2 | 14% |
| Diamond Pickaxe | 1 | 6% |
| Diamond Sword | 1 | 6% |
| Diamond Chestplate | 1 | 6% |
| Diamond Helmet | 1 | 6% |
| Diamond Leggings | 1 | 6% |
| Diamond Boots | 1 | 6% |
| Netherite Scrap | 1 | 12% |
| Netherite Ingot | 1 | 4% |
| Gold Block | 1–2 | 33% |
| Iron Ingot | 1–6 | 33% |
| Gold Ingot | 1–10 | 33% |
| Crying Obsidian | 1–5 | 33% |
| Nether Quartz | 8–23 | 33% |
| Gilded Blackstone | 1–5 | 33% |
| Music Disc (Pigstep) | 1 | 8% |
| Snout Armor Trim Smithing Template | 1 | 8% (1.20+) |
| Ancient Debris | 1 | 6% |
| Spectral Arrow | 12–25 | 8% |
| Enchanted Book (Soul Speed) | 1 | 12% |

**Loot Table `chests/bastion_bridge`:**

| Item | Quantity | Chance |
|---|---|---|
| Crossbow (enchanted) | 1 | 50% |
| Magma Cream | 2–6 | 50% |
| Gilded Blackstone | 1 | 33% |
| Crying Obsidian | 3–8 | 33% |
| Gold Block | 1–2 | 33% |
| Iron Ingot | 1–10 | 33% |
| Gold Ingot | 1–10 | 33% |
| Snout Armor Trim Smithing Template | 1 | 12% (1.20+) |
| Spectral Arrow | 10–28 | 12% |
| Soul Speed Book | 1 | 12% |
| Music Disc (Pigstep) | 1 | 5% |
| Netherite Scrap | 1 | 12% |

**Loot Table `chests/bastion_hoglin_stable`:**

| Item | Quantity | Chance |
|---|---|---|
| Gilded Blackstone | 1–3 | 23% |
| Crying Obsidian | 1–5 | 23% |
| Raw Porkchop | 2–5 | 50% |
| Cooked Porkchop | 2–5 | 50% |
| Crimson Fungus | 2–7 | 33% |
| Crimson Roots | 2–7 | 33% |
| Soul Sand | 2–7 | 33% |
| String | 4–6 | 23% |
| Leather | 1–3 | 23% |
| Arrow | 5–17 | 23% |
| Netherite Scrap | 1 | 12% |
| Enchanted Book (Soul Speed) | 1 | 12% |

**Loot Table `chests/bastion_other`:**

| Item | Quantity | Chance |
|---|---|---|
| Crossbow (enchanted) | 1 | 50% |
| Gold Ingot | 1–6 | 50% |
| Cooked Porkchop | 1–4 | 50% |
| Crying Obsidian | 1–5 | 33% |
| Gilded Blackstone | 1 | 33% |
| Iron Ingot | 1–10 | 33% |
| Arrow | 5–17 | 23% |
| String | 4–6 | 23% |
| Leather | 1–3 | 23% |
| Magma Cream | 2–6 | 23% |
| Snout Armor Trim Smithing Template | 1 | 12% (1.20+) |
| Music Disc (Pigstep) | 1 | 5% |
| Netherite Scrap | 1 | 6% |

### 3.3 Ruined Portal (Nether Variant)

Same as §2.14 but generates in Nether biomes. Nether variants use Netherrack around portal, less crying obsidian. Loot table same: `chests/ruined_portal`.

---

## 4. End Structures

### 4.1 End City

| Property | Value |
|---|---|
| Biome | End Midlands, End Highlands (outer End islands) |
| Dimensions | Variable — single tower up to large branching structure |
| Structure set | `minecraft:end_cities`, spacing 20, separation 11 |
| Materials | End stone bricks, purpur block, purpur pillar, purpur stairs/slabs, end rod, magenta stained glass |
| Loot Chests | 1–5 (varies by complexity) |
| Loot Tables | `minecraft:chests/end_city_treasure` |
| Mobs | Shulkers (multiple, attached to walls) |
| Special | End ships can spawn attached — contain elytra |

**End City rooms:**
- Base tower with stairs
- Floors connected by purpur stairs
- Optional branches leading to additional rooms
- Roof with end rods as decoration
- ~30% chance of having an attached End Ship

**Loot Table `chests/end_city_treasure`:**

| Item | Quantity | Chance |
|---|---|---|
| Diamond | 2–7 | 22% |
| Iron Ingot | 4–8 | 22% |
| Gold Ingot | 2–6 | 22% |
| Beetroot Seeds | 1–10 | 16% |
| Diamond Horse Armor | 1 | 13% |
| Saddle | 1 | 13% |
| Enchanted Iron Pickaxe | 1 | 13% |
| Enchanted Iron Sword | 1 | 13% |
| Enchanted Iron Helmet | 1 | 13% |
| Enchanted Iron Chestplate | 1 | 13% |
| Enchanted Iron Leggings | 1 | 13% |
| Enchanted Iron Boots | 1 | 13% |
| Enchanted Diamond Pickaxe | 1 | 13% |
| Enchanted Diamond Sword | 1 | 13% |
| Enchanted Diamond Helmet | 1 | 13% |
| Enchanted Diamond Chestplate | 1 | 13% |
| Enchanted Diamond Leggings | 1 | 13% |
| Enchanted Diamond Boots | 1 | 13% |
| Emerald | 12–26 | 13% |
| Spire Armor Trim Smithing Template | 1 | 6% (1.20+) |
| Elytra | 1 | only in End Ship |

### 4.2 End Ship

| Property | Value |
|---|---|
| Biome | End Highlands (attached to End City, ~30% chance) |
| Dimensions | ~17×15 footprint, smaller ship-like structure |
| Materials | End stone bricks, purpur blocks, end rods, obsidian, ladder |
| Loot Chests | 1 (treasure chest with Elytra) |
| Loot Table | `minecraft:chests/end_city_treasure` (same) |
| Mobs | 1–3 Shulkers |
| Special | Item frame holding Elytra in back room; brewing stand with 2 Potion of Healing II; Dragon Head as decoration |

**Layout:**
- Main deck with mast (tall obsidian pillar).
- Lower hull with two rooms: brewing stand room and elytra room.
- Item frame in elytra room holds the Elytra (only natural source).
- Dragon Head on the bow.

### 4.3 End Gateway Portal

| Property | Value |
|---|---|
| Biome | End (central island and outer islands) |
| Dimensions | 1×1 portal block + 9 end stone base |
| Loot | None |
| Special | Throws player ~1000 blocks to outer End islands |

**End Gateway mechanics:**
- After defeating the Ender Dragon (first time), 1 gateway portal spawns at the central island edge.
- Killing the dragon via respawn (4 End Crystals) creates 4 more gateways (up to 20 total).
- Each gateway teleports the player to a different outer End island location.
- Gateway has cooldown: each player can only enter once per 60 seconds (purple beam effect).
- Exit gateway at destination can also be used to return.

---

## 5. Terrain Features & Mini-Features

These are technically features (not structures) but are commonly confused with structures. They do NOT use the jigsaw system or structure sets.

### 5.1 Ocean Trench

- Generated terrain feature: deep underwater ravines with steep walls.
- NOT a structure; not locatable via `/locate`.
- Often contains lava, magma blocks, and underwater glow squid.

### 5.2 Coral Reef

- Generated terrain feature in **Warm Ocean** biomes only.
- Contains: coral blocks (5 colors: tube, brain, bubble, fire, horn), coral fans (5 colors), coral (plant form), sea pickles.
- Coral dies (turns gray) if not waterlogged.

### 5.3 Iceberg

- Generated terrain feature in **Frozen Ocean** and **Deep Frozen Ocean** biomes.
- Made of: packed ice, blue ice, snow block.
- Blue ice generates in iceberg core (only natural source).

### 5.4 Forest Rock (Mossy Cobblestone Boulder)

- Generated terrain feature in **Taiga**, **Old Growth Spruce Taiga**, **Old Growth Pine Taiga**, **Snowy Taiga** biomes.
- Made of: mossy cobblestone, 1–3 blocks visible above ground.
- Size: typically 7–25 blocks.

### 5.5 Ice Patch / Blue Ice Patch

- Generated terrain feature in **Frozen Ocean** biomes.
- Made of: blue ice patches on ocean floor.
- Snowy biomes also have ice patches of packed ice.

### 5.6 Lava Lake

- Generated terrain feature: pools of lava on surface or underground.
- Above-ground lava lakes are rare; set fire to surrounding flammable blocks.
- Underground lava lakes: common at Y < 0.

### 5.7 Water Lake / Spring

- Generated terrain feature: small pools of water.
- Ponds (1–7×7 water) are common in many biomes.
- Underground water lakes are common, often in cave systems.

### 5.8 Disk (Clay/Sand/Gravel Disk)

- Generated terrain feature: small disks of clay, sand, or gravel on water shores and riverbeds.
- Common near rivers and ocean beaches.

---

## 6. Loot Table System

### 6.1 JSON Format Reference

Loot tables are JSON files in `data/<namespace>/loot_tables/`. Path structure: `data/minecraft/loot_tables/chests/<structure>.json`.

**Full loot table JSON schema:**

```json
{
  "type": "minecraft:chest",
  "pools": [
    {
      "rolls": 1.0,
      "bonus_rolls": 0.0,
      "entries": [
        {
          "type": "minecraft:item",
          "name": "minecraft:diamond",
          "weight": 5
        }
      ],
      "conditions": [
        {
          "condition": "minecraft:random_chance",
          "chance": 0.05
        }
      ]
    }
  ],
  "random_sequence": "minecraft:chests/desert_pyramid"
}
```

### 6.2 Key Fields

| Field | Description |
|---|---|
| `type` | `minecraft:chest`, `minecraft:block`, `minecraft:entity`, `minecraft:fishing`, `minecraft:gift`, `minecraft:barter`, `minecraft:command`, `minecraft:archaeology`, `minecraft:empty` |
| `pools` | Array of pools; each rolled independently |
| `rolls` | Number of rolls (per pool) — int or range `{min, max}` |
| `bonus_rolls` | Extra rolls per Luck level |
| `entries` | Array of possible entries; weighted selection |
| `entries[].type` | `item`, `tag`, `loot_table`, `empty`, `alternatives`, `group`, `sequence`, `dynamic` |
| `entries[].weight` | Probability weight |
| `entries[].quality` | Luck-modified weight |
| `conditions` | Array of conditions (e.g., `random_chance`, `entity_properties`, `killed_by_player`, `weather_check`, `time_check`, `location_check`, `entity_scores`, `tool_used`, `damage_source_properties`, `inverted`, `alternative`, `survives_explosion`, `table_bonus` (enchantment), `random_chance_with_looting`) |
| `functions` | Array of functions applied to entries (e.g., `set_count`, `set_damage`, `enchant_with_levels`, `enchant_randomly`, `set_lore`, `set_name`, `set_nbt`, `set_potion`, `furnace_smelt`, `explosion_decay`, `limit_count`, `apply_bonus` (Fortune), `looting_enchant`, `fill_player_head`, `copy_name`, `copy_nbt`, `copy_state`, `set_attributes`, `set_banner_pattern`, `set_components` (1.20.5+)) |

### 6.3 Common Loot Table IDs

**Chests:**

| ID | Used By |
|---|---|
| `chests/abandoned_mineshaft` | Mineshaft minecart chest |
| `chests/ancient_city` | Ancient City chest |
| `chests/ancient_city_ice_box` | Ancient City ice box chest |
| `chests/bastion_bridge` | Bastion Remnant (bridge variant) |
| `chests/bastion_hoglin_stable` | Bastion Remnant (hoglin stable) |
| `chests/bastion_other` | Bastion Remnant (housing/other) |
| `chests/bastion_treasure` | Bastion Remnant (treasure variant) |
| `chests/buried_treasure` | Buried Treasure chest |
| `chests/desert_pyramid` | Desert Pyramid chests (×4) |
| `chests/end_city_treasure` | End City and End Ship chests |
| `chests/igloo_chest` | Igloo basement chest |
| `chests/jungle_temple` | Jungle Temple chests (×2) |
| `chests/nether_bridge` | Nether Fortress bridge chest |
| `chests/pillager_outpost` | Pillager Outpost chest |
| `chests/ruined_portal` | Ruined Portal chest |
| `chests/shipwreck_map` | Shipwreck (full ship only) |
| `chests/shipwreck_supply` | Shipwreck bow chest |
| `chests/shipwreck_treasure` | Shipwreck stern chest |
| `chests/simple_dungeon` | Dungeon chest |
| `chests/stronghold_corridor` | Stronghold corridor chest |
| `chests/stronghold_crossing` | Stronghold crossing chest |
| `chests/stronghold_library` | Stronghold library chest |
| `chests/underwater_ruin_big` | Large Ocean Ruin chest |
| `chests/underwater_ruin_small` | Small Ocean Ruin chest |
| `chests/village/village_<variant>_house` | Village houses |
| `chests/village/village_armorer` | Village armorer |
| `chests/village/village_butcher` | Village butcher |
| `chests/village/village_cartographer` | Village cartographer |
| `chests/village/village_cleric` | Village cleric |
| `chests/village/village_fisher` | Village fisherman |
| `chests/village/village_fletcher` | Village fletcher |
| `chests/village/village_leatherworker` | Village leatherworker |
| `chests/village/village_librarian` | Village librarian |
| `chests/village/village_mason` | Village mason |
| `chests/village/village_shepherd` | Village shepherd |
| `chests/village/village_toolsmith` | Village toolsmith |
| `chests/village/village_weaponsmith` | Village weaponsmith |
| `chests/woodland_mansion` | Woodland Mansion chests |
| `chests/trial_chambers/reward` | Trial Chamber reward (common) |
| `chests/trial_chambers/reward_ominous` | Trial Chamber reward (ominous) |
| `chests/trial_chambers/supplies` | Trial Chamber supply chests |
| `chests/trial_chambers/corridor` | Trial Chamber corridor chest |
| `chests/trial_chambers/intersection` | Trial Chamber intersection chest |
| `chests/spawner_trial_chamber/key` | Loot dropped from trial spawner |
| `chests/spawner_trial_chamber/ominous_key` | Loot dropped from ominous trial spawner |
| `chests/village/village_plains_house` | Plains village house |
| `chests/village/village_desert_house` | Desert village house |
| `chests/village/village_savanna_house` | Savanna village house |
| `chests/village/village_taiga_house` | Taiga village house |
| `chests/village/village_snowy_house` | Snowy village house |

**Archaeology loot tables:**

| ID | Used By |
|---|---|
| `archaeology/desert_pyramid` | Desert Pyramid suspicious sand |
| `archaeology/desert_well` | Desert Well suspicious sand |
| `archaeology/ocean_ruin_cold` | Cold Ocean Ruin suspicious sand/gravel |
| `archaeology/ocean_ruin_warm` | Warm Ocean Ruin suspicious sand |
| `archaeology/trail_ruins_common` | Trail Ruins suspicious gravel (common) |
| `archaeology/trail_ruins_rare` | Trail Ruins suspicious gravel (rare) |

### 6.4 Luck and Bonus Rolls

- **Luck attribute** (from Potion of Luck, attribute modifiers, or `luck` effect) increases `bonus_rolls`.
- Each bonus roll is an additional roll on the pool's entries.
- `quality` field on entries modifies weight per point of luck:
  - Final weight = `weight + (quality × luck_level)`.
- Only a few loot tables use `quality` meaningfully; most use bonus_rolls.

### 6.5 Random Sequence

1.21+ loot tables include a `random_sequence` field. This is a deterministic identifier (like `minecraft:chests/desert_pyramid`) used to seed the RNG. Means the same chest at the same location always produces the same loot for the same world seed.

---

## 7. Jigsaw Block System

### 7.1 Jigsaw Block Fields

Jigsaw blocks (`minecraft:jigsaw`, oriented blocks) are placed in structure templates (.nbt files). When the world generator processes the structure, it expands from jigsaw blocks based on their configuration.

**Block fields:**

| Field | Description |
|---|---|
| `name` | The name of this jigsaw block (target of other pieces connecting to it). |
| `target` | Structure pool reference (`minecraft:village/plains/houses`); defines which templates can connect here. |
| `target_pool` (alias for `target`) | Same as above. |
| `pool` | The pool this jigsaw block draws from when expanding (e.g., `minecraft:village/plains/streets`). |
| `final_layer` | Pool to use when depth limit reached; usually `minecraft:village/plains/terminators` (terminator = a small structure like a well to cap off). |
| `joint` | `roll` (rotates randomly) or `aligned` (forces same orientation). |

### 7.2 How Pieces Connect

**Connection algorithm:**

1. Place the initial structure piece (the well/meeting point for villages).
2. For each jigsaw block in the placed piece:
   a. Look at its `target` (e.g., `minecraft:village/plains/houses`).
   b. Find all jigsaw blocks in template pool entries whose `name` matches the target's required connection name (or accept any name).
   c. Randomly pick a template (weighted by `weight` in pool).
   d. Place the template, aligning jigsaw blocks (rotation 0/90/180/270, mirror none/x).
3. Repeat for newly placed pieces, up to **depth limit**.
4. At depth limit, use `final_layer` pool (often just empty terminator pieces).

**Depth limit:**
- Villages: depth 6.
- Pillager Outposts: depth 7.
- Bastion Remnants: depth 7.
- Ancient Cities: depth 7.
- Trial Chambers: depth 5.

### 7.3 Structure Pools

Structure pools (`worldgen/template_pool`) are JSON files defining what templates can be selected and their weights. Example:

```json
{
  "name": "minecraft:village/plains/houses",
  "fallback": "minecraft:village/plains/terminators",
  "elements": [
    {
      "weight": 4,
      "element": {
        "element_type": "minecraft:single_pool_element",
        "location": "minecraft:village/plains/houses/plains_small_house_1",
        "projection": "rigid",
        "processors": "minecraft:mossify_10_percent"
      }
    },
    {
      "weight": 2,
      "element": {
        "element_type": "minecraft:single_pool_element",
        "location": "minecraft:village/plains/houses/plains_weaponsmith_1",
        "projection": "rigid",
        "processors": "minecraft:empty"
      }
    }
  ]
}
```

### 7.4 Element Types

| Element Type | Description |
|---|---|
| `minecraft:single_pool_element` | Single template (.nbt file). |
| `minecraft:list_pool_element` | List of sub-elements, placed sequentially. |
| `minecraft:feature_pool_element` | Places a configured feature (e.g., tree). |
| `minecraft:empty_pool_element` | Empty (used for terminators). |
| `minecraft:legacy_single_pool_element` | Backwards compatibility for older formats. |

### 7.5 Processors

Processors modify placed blocks (e.g., adding moss, cracks, replacing materials based on biome). Example:

- `minecraft:mossify_10_percent` — 10% of cobblestone → mossy cobblestone.
- `minecraft:crack_stonebrick` — replaces some stone bricks with cracked.
- `minecraft:sand_default` — used in desert temples for sand settling.
- `minecraft:grade_stonebrick` — random stone brick variants.
- `minecraft:brick_ageing` — for ancient structures.
- `minecraft:cobble_default` — biome-specific cobblestone replacement (moss for jungle).

### 7.6 Projection

- `rigid`: blocks placed at exact template Y.
- `terrain_matching`: blocks placed at terrain height + template offset (used for roads/paths).

---

## 8. Mob Spawner Reference

### 8.1 Standard Mob Spawner Block

Block ID: `minecraft:spawner` (formerly `minecraft:mob_spawner`).

| Property | Value |
|---|---|
| Hardness | 5.0 |
| Resistance | 5.0 |
| Tool | Pickaxe (drops nothing in survival without Silk Touch — actually since 1.17+, Silk Touch pickaxe drops the spawner with the entity data preserved) |
| Light emission | 0 (spawner itself doesn't emit; mob inside has spinning particles) |
| Tick behavior | Spawns entities from `SpawnData` NBT when player within 16 blocks (configurable) |

**NBT fields:**
- `SpawnData` — entity NBT to spawn (e.g., `{id: "minecraft:zombie"}`).
- `SpawnPotentials` — list of weighted spawn options (with `Weight`).
- `MinSpawnDelay` / `MaxSpawnDelay` — tick delay between spawns (default 200/800).
- `SpawnCount` — mobs per spawn (default 4).
- `MaxNearbyEntities` — cap on same-entity-type nearby (default 6).
- `RequiredPlayerRange` — distance for activation (default 16).
- `SpawnRange` — radius around spawner (default 4).

**Dungeon spawner distribution:**
- Zombie: 50%
- Skeleton: 25%
- Spider: 25%
- Cave Spider: 5% (rare, in specific cave systems)
- Silverfish: 1% (extremely rare, near strongholds)

### 8.2 Nether Fortress Blaze Spawner

- Located in 2–4 rooms per fortress.
- Always spawns Blaze (entity ID `minecraft:blaze`).
- Blaze spawners don't deactivate from torchlight — they always work in the dark.
- Standard spawner behavior: requires player within 16 blocks; spawns 4 blazes per cycle.

### 8.3 Trial Spawner (1.21+)

Block ID: `minecraft:trial_spawner`.

| Property | Value |
|---|---|
| Hardness | 50 (unbreakable in survival) |
| Resistance | 1200 |
| Tool | Pickaxe (Creative only) |
| Light | 0 (no emission) |
| Special | Scales with player count; per-player cooldown |

**Behavior:**
- Detects players within 14-block radius.
- For each player in range, increases max simultaneous mobs (default 1 mob per player, capped at 6).
- Spawns mobs from configured `SpawnData` (default config from trial chambers data files).
- Each mob kill increments a counter (default 6 kills per player present).
- On threshold reached: ejects loot (per player, not shared), goes on cooldown (30 min default).
- **Ominous variant**: When a player with `Bad Omen` (from Ominous Bottle) is in range, spawner enters ominous state — spawns harder mobs (with armor/effects) and ejects better loot (Ominous Trial Key instead of Trial Key).

**Differences from regular spawner:**
- Doesn't require darkness.
- Scales with player count.
- Ejects loot after completion (regular spawner doesn't).
- Cooldown instead of constant spawning.
- Visual state: idle (dim) → active (glowing, particles) → ejecting (bright) → cooldown (dim with cooldown bar).

### 8.4 Vault Block (1.21+)

Block ID: `minecraft:vault`.

| Property | Value |
|---|---|
| Hardness | 50 (unbreakable in survival) |
| Resistance | 1200 |
| Light | 0 |
| Special | Per-player loot; unlock with key |

**Behavior:**
- A locked vault shows animated keyhole.
- Players insert Trial Key (or Ominous Trial Key) by right-clicking.
- Once unlocked (per-player), ejects loot from `chests/trial_chambers/reward` (or `reward_ominous`) to that player.
- Each player can only unlock once — vault records per-player NBT data.
- Visual states: idle (closed) → unlocking (opening animation) → opened (per-player key only).

### 8.5 Other Spawners (Not Worldgen)

| Spawner | Location | Notes |
|---|---|---|
| Silverfish spawner | Stronghold portal room | Always silverfish; player proximity triggers |
| Cave Spider spawner | Abandoned Mineshaft (rare) | In spider-web alcoves |
| Magma Cube spawner | Bastion Remnant (housing variant) | Not always present |
| Blaze spawner | Nether Fortress | 2–4 per fortress |

---

## 9. Archaeology System (1.20+)

### 9.1 Suspicious Blocks

| Block | ID | Generated In |
|---|---|---|
| Suspicious Sand | `minecraft:suspicious_sand` | Desert Pyramid, Desert Well, Warm Ocean Ruin |
| Suspicious Gravel | `minecraft:suspicious_gravel` | Cold Ocean Ruin, Trail Ruins |

**Behavior:**
- Looks identical to regular sand/gravel but has subtle texture variation.
- Contains a hidden loot table reference (the block stores `loot_table` and `loot_table_seed` NBT).
- If broken by anything other than a brush, drops nothing (regular sand/gravel item NOT drop).
- If brushed by player with a brush tool, gradually reveals the loot inside.
- If broken (falls, exploded, piston-pushed), loot is lost.
- Falling: suspicious sand falls like sand (gravity-affected). When it lands, it stays as suspicious sand (doesn't lose its loot).
- Water flowing over suspicious sand destroys it (loses loot).

### 9.2 Brush Tool

- Crafted from: 1 Feather + 1 Copper Ingot + 1 Stick.
- Used by holding right-click on suspicious sand/gravel.
- Durability: 64 uses per brush.
- Brushing time: ~3 seconds per block.

### 9.3 Pottery Sherds (20 Patterns)

| Sherd | Source Structure |
|---|---|
| Archer | Desert Pyramid, Trail Ruins |
| Arms Up | Desert Well, Trail Ruins |
| Blade | Trial Chambers (1.21+) |
| Brewer | Desert Well, Cold Ocean Ruin |
| Burn | Cold Ocean Ruin |
| Danger | Cold Ocean Ruin, Jungle Temple |
| Explorer | Cold Ocean Ruin |
| Friend | Trail Ruins |
| Guster | Trial Chambers (1.21+) |
| Heart | Trail Ruins |
| Heartbreak | Trail Ruins |
| Howl | Trail Ruins |
| Miner | Desert Pyramid |
| Mourner | Cold Ocean Ruin |
| Plenty | Cold Ocean Ruin |
| Prize | Desert Pyramid, Desert Well |
| Scute | Trial Chambers (1.21+) |
| Sheaf | Trail Ruins |
| Shelter | Trail Ruins |
| Skull | Desert Well |
| Snort | Trail Ruins |

**Crafting:** 4 sherds (any pattern, in diamond shape) → 1 Decorated Pot (which displays the patterns on its 4 sides).

### 9.4 Smithing Templates (Armor Trims)

Armor trim smithing templates are obtained from various structures (some via chests, some via archaeology):

| Template | Source |
|---|---|
| Bolt | Trial Chambers |
| Coast | Shipwreck |
| Dune | Desert Temple |
| Eye | Stronghold |
| Flow | Trial Chambers (ominous reward) |
| Host | Trail Ruins (rare) |
| Raiser | Trail Ruins (rare) |
| Rib | Nether Fortress |
| Sentry | Pillager Outpost |
| Shaper | Trail Ruins (rare) |
| Silence | Ancient City (rare) |
| Snout | Bastion Remnant |
| Spire | End City |
| Tide | Elder Guardian drop |
| Vex | Woodland Mansion |
| Ward | Ancient City |
| Wayfinder | Trail Ruins (rare) |
| Wild | Jungle Temple |

### 9.5 Per-Structure Archaeology Loot

| Structure | Loot Table | Sherds | Other Notable Items |
|---|---|---|---|
| Desert Pyramid | `archaeology/desert_pyramid` | Archer, Miner, Prize, Skull (Sherd "Arms" not here — verify) | Emerald, Gunpowder, TNT, |
| Desert Well | `archaeology/desert_well` | Archer, Arms Up, Brewer, Prize, Skull | Emerald, Brick, Stick |
| Cold Ocean Ruin | `archaeology/ocean_ruin_cold` | Brewer, Burn, Danger, Explorer, Mourner, Plenty | Emerald, Iron Axe, Wheat |
| Warm Ocean Ruin | `archaeology/ocean_ruin_warm` | Angler, Archer, Blade, Broom, Brush, Doll | Iron Ingot, Emerald, |
| Trail Ruins (common) | `archaeology/trail_ruins_common` | (none) | Emerald, Wheat, Coal, Brick, Brick (item), Leather, Bead (Blue/White/Orange/Pink/Yellow/Purple/Light Blue/Red dye) |
| Trail Ruins (rare) | `archaeology/trail_ruins_rare` | All Trail Ruins sherds (8 patterns: Friend, Heart, Heartbreak, Howl, Sheaf, Shelter, Snort, Broom) | Wayfinder, Raiser, Shaper, Host Armor Trim Smithing Templates |

---

## 10. Stronghold Eye-of-Ender Mechanics

### 10.1 Eye Throwing Algorithm

When a player throws an Eye of Ender:
1. The eye flies in the direction of the nearest stronghold's center.
2. After ~12 blocks traveled, eye pauses briefly, then continues.
3. Eye has 20% chance to break (not retrievable) per throw.
4. Eye leads to the **stronghold entrance** (usually the spiral staircase or portal room — actually the eye leads to the stronghold's center point, which is usually near the portal room).
5. When eye stops descending (returns to player), it indicates you've reached the stronghold location.

### 10.2 Stronghold Generation Rings

**Pre-1.18 (1.9–1.17):**
- 3 concentric rings:
  - Ring 1: 1280–2816 blocks from spawn, 3 strongholds.
  - Ring 2: 4352–5888 blocks, 6 strongholds.
  - Ring 3: 7424–8960 blocks, 10 strongholds.
  - Ring 4: 10496–12032 blocks, 15 strongholds.
  - Ring 5: 13568–15104 blocks, 21 strongholds.
  - Ring 6: 16640–18176 blocks, 28 strongholds.
  - Ring 7: 19712–21248 blocks, 36 strongholds.
  - Ring 8: 22784–24320 blocks, 9 strongholds.
- Total: 128 strongholds per world.

**1.18+ (current):**
- Strongholds generate based on a `concentric_rings` structure set with `distance: 32, count: 128, spread: 3`.
- The first ring (closest to spawn) generates within 1408–2688 blocks. Additional rings are placed at larger distances.
- Same total: 128 strongholds per world.
- Strongholds are still generated based on a ring system; inner ring first, outer rings farther out.

### 10.3 Locating Strongholds

- `/locate structure minecraft:stronghold` finds the nearest one (Creative mode).
- Eyes of Ender always lead to the nearest unvisited stronghold.
- Once the End Portal is activated and the dragon is defeated, the player can use End Gateway Portals to explore the outer End islands.

### 10.4 Stronghold Depth

- Strongholds generate at Y range of -64 to ~50 in 1.18+ (caves & cliffs update).
- Pre-1.18: generated at Y range of ~10–40 (below surface).
- Often generate partially embedded in deepslate.

### 10.5 End Portal Frame

- 12 frame blocks arranged in a 3×3 square (with corners missing).
- Each frame block has orientation (facing inward).
- 10% chance per frame to already contain an Eye of Ender.
- Average pre-filled eyes: 1.2; range 0–12.
- To activate: place Eye of Ender on each empty frame slot.

---

## 11. Structure Block & Structure Void

### 11.1 Structure Block

Block ID: `minecraft:structure_block` (4 modes; mode stored in block state).

| Mode | Description |
|---|---|
| `SAVE` | Records the bounding box (defined by position and corner block) to a `.nbt` file in `generated/<namespace>/structures/`. |
| `LOAD` | Loads a saved structure from disk; mirrors/rotates per block state. |
| `CORNER` | Used with SAVE to define the other end of the bounding box. |
| `DATA` | Used in custom world generation (data pack) for tagging jigsaw-like data blocks. |

**Block state fields:**
- `mode`: `save`, `load`, `corner`, `data`.
- All structure blocks render as a textured cube with mode icon.

**Save GUI options:**
- Name: filename (saved to `generated/minecraft/structures/<name>.nbt`).
- Relative position: -48 to 48 on each axis.
- Size: 1–48 on each axis.
- "Include entities" checkbox.
- "Show bounding box" checkbox.

**Load GUI options:**
- Name: filename to load.
- Relative position.
- "Include entities".
- Integrity: 0–1 (1 = all blocks; 0.5 = 50% of blocks randomly placed).
- Seed: for integrity randomization.
- Rotation: 0°, 90°, 180°, 270°.
- Mirror: none, x, z.

### 11.2 Structure Void

Block ID: `minecraft:structure_void`.

- Used INSIDE structure templates to mark "don't overwrite existing blocks here."
- When structure is loaded, void blocks don't replace existing world blocks at those positions.
- Invisible in survival; only visible when held in survival hand or in spectator.
- Counterpart to air: air in a template OVERWRITES world blocks with air.

### 11.3 Structure NBT Format

Saved structures (.nbt files) contain:

```
{
  "size": [10, 5, 10],
  "entities": [...],
  "blocks": [
    {
      "pos": [0, 0, 0],
      "state": 0,
      "nbt": { // optional, only if block has block entity
        "id": "minecraft:chest",
        "Items": [...]
      }
    },
    ...
  ],
  "palette": [
    {"Name": "minecraft:stone"},
    {"Name": "minecraft:chest", "Properties": {"facing": "north", "waterlogged": "false"}},
    ...
  ],
  "DataVersion": 3465
}
```

- `palette` is indexed by `state` in each block.
- Entities are stored separately with position offsets.
- `DataVersion` ensures version compatibility (the game upgrades structures when loading older versions).

---

## 12. Per-Structure Loot Summary

Quick reference for "what to expect" when looting each structure:

| Structure | # Chests | Best Loot | Avg Loot Value (Early Game) |
|---|---|---|---|
| Village (per house) | 1 per profession house | Iron ingots, emeralds, diamond (toolsmith/weaponsmith) | Bread, emerald, paper |
| Desert Pyramid | 4 | Diamond, enchanted golden apple, diamond horse armor | Gunpowder, string, rotten flesh |
| Jungle Temple | 2 | Diamond, enchanted book | Bamboo, bones, rotten flesh |
| Pillager Outpost | 1 | Goat horn (mountain), music disc | Crossbow, wheat, dark oak logs |
| Woodland Mansion | Variable | Vex trim, enchanted golden apple, diamond tools | Lead, book, rotten flesh, music disc |
| Ocean Monument | 0 chests (gold blocks) | 8 gold blocks, tide trim (drop) | Prismarine shards, sponge |
| Ocean Ruin | 0–1 | Enchanted book, golden apple | Coal, wheat, leather |
| Shipwreck | 1–3 | Trident (rare), buried treasure map, emerald | Iron nugget, paper, coal |
| Buried Treasure | 1 | Heart of the Sea, diamond, music disc | Iron ingot, gold ingot, cooked fish |
| Igloo | 0–1 | Golden apple (in basement) | Coal, paper, stone axe |
| Swamp Hut | 0 | (No chest) | (Witch drops) |
| Mineshaft | 1–3 | Enchanted golden apple, diamond, name tag | Coal, torches, rails, bread |
| Stronghold | 2–4 | End portal (always), enchanted book, eye trim | Paper, ender pearl, iron tools |
| Ruined Portal | 0–1 | Enchanted golden apple, crying obsidian | Flint, iron nuggets, fire charges |
| Ancient City | 5–10 | Silence trim, Swift Sneak books, echo shards | Soul lanterns, candles, books |
| Trail Ruins | 0 (suspicious gravel) | Wayfinder/Raiser/Shaper/Host trims, sherds | Brick, dye, leather |
| Trial Chambers | Variable (vaults) | Heavy core, trident, diamond gear, ominous bottles | Trial keys, emeralds |
| Fossils | 0 | (Bone blocks only) | Bone blocks |
| Geode | 0 | (Amethyst only) | Amethyst shards |
| Desert Well | 0 (suspicious sand) | Sherds, emerald | Brick, sticks |
| Dungeon | 1–2 | Music disc, golden apple, name tag | Bone, gunpowder, rotten flesh |
| Nether Fortress | 1–3 | Rib trim, nether wart (only source), diamond | Iron, gold, quartz, glowstone |
| Bastion Remnant | 4–8 | Netherite scrap, Pigstep music disc, diamond gear | Gold ingots, gilded blackstone |
| End City | 1–5 | Elytra (End Ship), spire trim, diamond gear | Emeralds, diamonds, enchanted iron gear |
| End Ship | 1 | Elytra (only source), dragon head | Potions of Healing II |

---

## 13. Biome-to-Structure Quick Lookup

| Biome | Structures Present |
|---|---|
| **Plains** | Village (plains), Pillager Outpost, Ruined Portal, Buried Treasure (beach), Dungeon (underground), Mineshaft, Stronghold, Ancient City, Trial Chambers |
| **Sunflower Plains** | Village (plains subset), Ruined Portal, Dungeon |
| **Meadow** | Village (plains), Pillager Outpost (with Allay cages), Ruined Portal, Trial Chambers |
| **Cherry Grove** | Village (plains), Pillager Outpost, Ruined Portal, Trail Ruins, Trial Chambers |
| **Forest** | Ruined Portal, Dungeon, Mineshaft |
| **Flower Forest** | Ruined Portal, Dungeon |
| **Birch Forest** | Ruined Portal, Dungeon, Mineshaft, Trial Chambers |
| **Old Growth Birch Forest** | Trail Ruins, Ruined Portal, Mineshaft |
| **Dark Forest** | Woodland Mansion, Ruined Portal |
| **Old Growth Pine Taiga** | Village (taiga), Forest Rock, Ruined Portal, Mineshaft |
| **Old Growth Spruce Taiga** | Village (taiga), Forest Rock, Ruined Portal, Mineshaft |
| **Taiga** | Village (taiga), Forest Rock, Ruined Portal, Pillager Outpost, Mineshaft, Trial Chambers |
| **Snowy Taiga** | Village (taiga), Igloo, Ruined Portal, Mineshaft |
| **Snowy Plains** | Village (snowy), Igloo, Pillager Outpost, Ruined Portal, Trial Chambers |
| **Desert** | Village (desert), Desert Pyramid, Desert Well, Pillager Outpost, Ruined Portal, Fossils, Dungeon |
| **Savanna** | Village (savanna), Pillager Outpost, Ruined Portal, Mineshaft, Trial Chambers |
| **Savanna Plateau** | Village (savanna), Pillager Outpost, Ruined Portal |
| **Windswept Savanna** | Ruined Portal, Mineshaft |
| **Jungle** | Jungle Temple, Ruined Portal, Fossils, Trail Ruins, Mineshaft |
| **Bamboo Jungle** | Jungle Temple, Trail Ruins, Fossils, Mineshaft |
| **Swamp** | Swamp Hut, Ruined Portal, Fossils, Mineshaft, Trial Chambers |
| **Mangrove Swamp** | Swamp Hut, Ruined Portal, Trail Ruins, Fossils |
| **Beach** | Buried Treasure, Shipwreck (beached) |
| **Snowy Beach** | Buried Treasure, Shipwreck (beached) |
| **Stony Shore** | Buried Treasure, Ruined Portal |
| **Ocean** | Ocean Ruin, Shipwreck, Ruined Portal, Ocean Monument (in deep ocean) |
| **Deep Ocean** | Ocean Monument, Ocean Ruin, Shipwreck |
| **Warm Ocean** | Coral Reef, Ocean Ruin (warm), Shipwreck |
| **Cold Ocean** | Ocean Ruin (cold), Shipwreck |
| **Frozen Ocean** | Iceberg, Ocean Ruin (cold), Shipwreck |
| **Deep Frozen Ocean** | Iceberg, Ocean Monument |
| **River** | Ruined Portal (ocean/underground), Shipwreck (rare) |
| **Frozen River** | Ruined Portal, Igloo (snowy edge) |
| **Mountains / Windswept Hills** | Ruined Portal, Pillager Outpost (mountain variant), Mineshaft, Trial Chambers |
| **Windswept Gravelly Hills** | Ruined Portal, Mineshaft |
| **Windswept Forest** | Ruined Portal, Mineshaft, Trial Chambers |
| **Jagged Peaks** | Ruined Portal, Pillager Outpost |
| **Frozen Peaks** | Ruined Portal, Pillager Outpost, Igloo |
| **Stony Peaks** | Ruined Portal, Pillager Outpost |
| **Snowy Slopes** | Igloo, Ruined Portal, Pillager Outpost |
| **Grove** | Ruined Portal, Pillager Outpost, Mineshaft |
| **Meadow** | (see above) |
| **Cherry Grove** | (see above) |
| **Lush Caves** | (no surface structures); Mineshaft may intersect |
| **Dripstone Caves** | (no surface structures) |
| **Deep Dark** | Ancient City |
| **Nether Wastes** | Nether Fortress, Bastion Remnant, Ruined Portal |
| **Soul Sand Valley** | Nether Fortress, Bastion Remnant, Ruined Portal |
| **Crimson Forest** | Nether Fortress, Bastion Remnant, Ruined Portal |
| **Warped Forest** | Nether Fortress, Bastion Remnant, Ruined Portal |
| **Basalt Deltas** | Nether Fortress (only — Bastions do not generate here), Ruined Portal |
| **The End (central)** | End Gateway Portal (post-dragon) |
| **End Midlands** | End City (with possible End Ship) |
| **End Highlands** | End City (with possible End Ship), End Gateway Portal |
| **End Barrens** | (none — empty void) |
| **Small End Islands** | (none) |

---

## Appendix A: Structure Set IDs (1.21.x)

| Structure Set | Type | Spacing | Separation | Distance |
|---|---|---|---|---|
| `minecraft:villages` | random_spread | 32 | 8 | — |
| `minecraft:desert_pyramids` | random_spread | 32 | 8 | — |
| `minecraft:igloos` | random_spread | 32 | 8 | — |
| `minecraft:jungle_temples` | random_spread | 32 | 8 | — |
| `minecraft:swamp_huts` | random_spread | 32 | 8 | — |
| `minecraft:pillager_outposts` | random_spread | 32 | 8 | — |
| `minecraft:woodland_mansions` | random_spread | 80 | 20 | — |
| `minecraft:ocean_ruins` | random_spread | 20 | 8 | — |
| `minecraft:shipwrecks` | random_spread | 24 | 4 | — |
| `minecraft:ocean_monuments` | random_spread | 32 | 5 | — |
| `minecraft:ruined_portals` | random_spread | 40 | 15 | — |
| `minecraft:ruined_portals_nether` | random_spread | 25 | 10 | — |
| `minecraft:ancient_cities` | random_spread | 96 | 24 | — |
| `minecraft:trail_ruins` | random_spread | 48 | 8 | — |
| `minecraft:buried_treasures` | random_spread | 1 | 0 | — (every chunk chance) |
| `minecraft:mineshafts` | random_spread | 1 | 0 | — |
| `minecraft:mineshafts_mesa` | random_spread | 1 | 0 | — (3x denser) |
| `minecraft:strongholds` | concentric_rings | — | — | 32 (count=128, spread=3) |
| `minecraft:fortresses` | random_spread | 27 | 4 | — |
| `minecraft:bastion_remnants` | random_spread | 27 | 4 | — |
| `minecraft:end_cities` | random_spread | 20 | 11 | — |
| `minecraft:trial_chambers` | random_spread | 48 | 14 | — |
| `minecraft:nether_fossils` | random_spread | 2 | 1 | — |
| `minecraft:fossils` | random_spread | 64 | 2 | — (overworld, below Y=0) |

---

## Appendix B: Structure Block ID Cross-Reference

| Structure | Block ID Prefix | Notable Blocks Used |
|---|---|---|
| Village (plains) | `minecraft:oak_planks`, `minecraft:cobblestone`, `minecraft:oak_log` | `minecraft:hay_block`, `minecraft:composter`, `minecraft:bell`, `minecraft:lantern` |
| Village (desert) | `minecraft:smooth_sandstone`, `minecraft:cut_sandstone` | `minecraft:sandstone_stairs`, `minecraft:terracotta` |
| Village (savanna) | `minecraft:acacia_planks`, `minecraft:acacia_log` | `minecraft:terracotta`, `minecraft:orange_terracotta` |
| Village (taiga) | `minecraft:spruce_planks`, `minecraft:cobblestone` | `minecraft:mossy_cobblestone`, `minecraft:podzol` |
| Village (snowy) | `minecraft:spruce_planks`, `minecraft:snow_block` | `minecraft:packed_ice`, `minecraft:blue_ice` |
| Desert Pyramid | `minecraft:sandstone`, `minecraft:smooth_sandstone` | `minecraft:tnt`, `minecraft:stone_pressure_plate` |
| Jungle Temple | `minecraft:cobblestone`, `minecraft:mossy_cobblestone` | `minecraft:sticky_piston`, `minecraft:dispenser`, `minecraft:tripwire_hook` |
| Woodland Mansion | `minecraft:dark_oak_planks`, `minecraft:dark_oak_log` | `minecraft:carpet`, `minecraft:bookshelf` |
| Ocean Monument | `minecraft:prismarine`, `minecraft:sea_lantern` | `minecraft:sponge`, `minecraft:gold_block`, `minecraft:wet_sponge` |
| Ancient City | `minecraft:deepslate`, `minecraft:deepslate_tiles` | `minecraft:sculk`, `minecraft:sculk_shrieker`, `minecraft:sculk_sensor`, `minecraft:candle`, `minecraft:soul_lantern` |
| Trial Chambers | `minecraft:tuff`, `minecraft:tuff_bricks` | `minecraft:copper_bulb`, `minecraft:copper_grate`, `minecraft:trial_spawner`, `minecraft:vault` |
| Nether Fortress | `minecraft:nether_bricks`, `minecraft:nether_brick_fence` | `minecraft:soul_sand`, `minecraft:nether_wart`, `minecraft:spawner` |
| Bastion Remnant | `minecraft:blackstone`, `minecraft:polished_blackstone` | `minecraft:gilded_blackstone`, `minecraft:gold_block`, `minecraft:basalt` |
| End City | `minecraft:end_stone_bricks`, `minecraft:purpur_block` | `minecraft:purpur_pillar`, `minecraft:end_rod`, `minecraft:magenta_stained_glass` |
| Stronghold | `minecraft:stone_bricks`, `minecraft:mossy_stone_bricks` | `minecraft:infested_stone_bricks`, `minecraft:bookshelf`, `minecraft:end_portal_frame`, `minecraft:spawner` |

---

## Appendix C: Notes & Edge Cases

1. **Meadow village subset:** Meadow biomes use plains village template pool (verified in 1.21.4 data pack).
2. **Badlands Mineshaft density:** Mineshafts in badlands biomes are 3× more common (denser) than in other biomes.
3. **Stronghold infested blocks:** All stone bricks in a stronghold have a chance to be `infested_stone_bricks` (silverfish spawn on block break). Mossy and cracked variants can also be infested.
4. **End City ship rate:** ~30% of End Cities have a ship attached (varies by data pack).
5. **Trial Chamber Y range:** Generate at Y level -40 to -20 (most common at Y -30). Bedrock-rock roof above (only generate below surface).
6. **Ocean Monument Elder Guardians:** Always exactly 3 (one in each section). Killing all 3 removes Mining Fatigue debuff (until re-entering).
7. **Buried Treasure depth:** Always at Y around 60–64 in beach biomes; chest sits in sand ~5 blocks below surface.
8. **Desert Pyramid TNT:** Trap triggers if any entity stands on the center pressure plate. Breaking the plate makes it safe; breaking the chests is also safe (the loot is in the corners).
9. **Igloo basement rate:** 50% of igloos have a basement. The ladder goes down 20 blocks under the trapdoor in the floor (concealed by white carpet).
10. **Pillager Outpost Allay cage:** Only in meadow biome outposts (1.19+); very rare (~5% chance). Otherwise, caged iron golem.
11. **Bastion variants distribution:** Each variant has equal probability (25% each) when a bastion generates in a valid biome.
12. **Nether Fortress Blaze Spawners:** Always 2 blaze spawners per fortress in Java 1.21 (was variable in older versions).
13. **Ocean Ruin chest rate:** 50% of large ocean ruins have chests; 30% of small ocean ruins have chests.
14. **Trail Ruins suspicious gravel count:** Each Trail Ruin has 40–60 suspicious gravel blocks (estimated).
15. **Trial Chamber loot distribution:** Trial spawners drop loot per player who participated. Vaults unlock per player. Both systems prevent loot "stealing."
16. **Ancient City warden summon:** Triggered by Sculk Shrieker (4 activations) OR player noise in Deep Dark (4 shrieks). Warden despawns after 60 seconds without target.
17. **Stronghold portal frame pre-filled eyes:** 10% chance per frame (1.2 average). Always 0-12, but statistical range usually 0-3.

---

*End of 08-research-structures.md — Minecraft Clone Prompt Kit — Java Edition 1.21.x*
