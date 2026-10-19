# Minecraft Clone Prompt Kit — 01: Block Reference (Java Edition, 1.21.x)

**Purpose:** This file is the authoritative block reference for an AI building a Minecraft clone. It documents every block in Minecraft Java Edition (latest 1.21.x) with the data an engine needs to replicate behaviour: identifiers, hardness, blast resistance, light emission, tool requirements, drops, transparency, flammability, and notable mechanical quirks. Use this file together with the other prompt-kit sections (items, entities, world-gen, redstone, etc.).

**Conventions**
- IDs use the modern namespaced form (`minecraft:stone`). The `minecraft:` prefix is omitted in tables for compactness.
- **Hardness** = time multiplier for mining (negative values = unbreakable like bedrock). Time in seconds ≈ hardness × 1.5 (correct tool) or hardness × 5 (wrong/no tool). `-1` = unbreakable.
- **Resistance** = blast resistance to explosions.
- **Light** = emitted light level 0–15.
- **Tool** = best tool (`pickaxe`, `axe`, `shovel`, `hoe`, `shears`, `sword`, `any`, `none`). "✓" means required to drop.
- **Transparency** = `Y` (light passes / culls neighbor faces differently), `N` (full opaque cube), `P` (partial — e.g., slabs, stairs, glass pane).
- **Flammable** = catches fire from lava/flammable neighbors.
- **Drops** = item dropped when broken. "self" = itself. "—" = nothing. Special conditions noted.
- Values marked `~` are approximate or version-dependent.

---

## Table of Contents

1. [Block Property Reference](#1-block-property-reference)
2. [Natural Blocks](#2-natural-blocks)
   - 2.1 Stone & Rock Variants
   - 2.2 Dirt, Sand, Gravel & Aggregate
   - 2.3 Ores (Overworld)
   - 2.4 Ice & Snow
   - 2.5 Other Terrain
3. [Building Blocks](#3-building-blocks)
   - 3.1 Wood Planks & Logs
   - 3.2 Stone Bricks & Polished Stone
   - 3.3 Bricks, Sandstone, Quartz
   - 3.4 Concrete & Concrete Powder
   - 3.5 Terracotta & Glazed Terracotta
   - 3.6 Wool & Carpets
   - 3.7 Glass & Stained Glass
   - 3.8 Prismsarine & Blackstone Builds
4. [Decoration Blocks](#4-decoration-blocks)
5. [Functional Blocks](#5-functional-blocks)
6. [Redstone Blocks](#6-redstone-blocks)
7. [Transport Blocks](#7-transport-blocks)
8. [Fluid Blocks](#8-fluid-blocks)
9. [Plant Blocks](#9-plant-blocks)
   - 9.1 Logs & Wood
   - 9.2 Leaves
   - 9.3 Crops
   - 9.4 Flowers & Tall Plants
   - 9.5 Mushrooms & Fungi
   - 9.6 Saplings, Bamboo, Cactus, Sugar Cane
10. [Mineral & Gem Blocks](#10-mineral--gem-blocks)
11. [Nether Blocks](#11-nether-blocks)
12. [End Blocks](#12-end-blocks)
13. [Technical Blocks](#13-technical-blocks)
14. [Block State Reference](#14-block-state-reference)
15. [Block Model Format Reference](#15-block-model-format-reference)
16. [Special Block Behaviors](#16-special-block-behaviors)

---

## 1. Block Property Reference

Every block in Minecraft is defined by a `BlockBehaviour.Properties` record. The following properties are the most important ones an engine must implement to faithfully clone Minecraft.

| Property | Type | Description |
|---|---|---|
| `material` | Material (legacy) / `MapColor` | Determines color on maps, flammability, piston behavior, liquid interaction. Replaced in 1.21 by `destructible`/`replaceable` data components but conceptually still useful. |
| `mapColor` | RGB | Color shown on maps. |
| `soundType` | SoundType | Footstep, break, place, hit, fall, step sounds. |
| `hardness` | float | Mining time multiplier. `-1.0` ⇒ unbreakable (bedrock, barrier, command block). |
| `resistance` | float | Blast resistance. `3600000` ⇒ explosion-proof (bedrock, end portal frame, etc.). |
| `lightEmission` | int 0–15 | Light this block emits. |
| `lightLevel` (blockstate predicate) | int | Conditional light (e.g., furnace lit). |
| `requiresCorrectToolForDrops` | bool | If true, drops only when mined with the correct tool tier. |
| `jumpFactor` | float | Affects jump height (honey = 0.5, slime = 0.5-ish, soul sand variable via blocktag). |
| `speedFactor` | float | Affects movement speed (soul sand via tag, honey = 0.4). |
| `friction` | float | Slipperiness. Ice = 0.98, slime = 0.8, default = 0.6. |
| `noOcclusion` | bool | Does not cull neighbor faces (glass, leaves with fancy mode). |
| `isViewBlocking` | bool | Blocks camera (used by leaves for view culling). |
| `useShapeForLightOcclusion` | bool | Light occlusion computed from voxel shape (stairs, slabs). |
| `canOcclude` | bool | Whether neighbor face culling is allowed at all. |
| `isRedstoneConductor` | bool | Conducts redstone (full opaque cubes typically true; glass/leaves false). |
| `isSignalSource` | bool | Emits redstone power. |
| `randomTicks` | bool | Receives random ticks (crops, saplings, copper oxidation). |
| `offsetType` | enum | `NONE`, `XZ` (flowers), `XYZ` (lilypad / torch). |
| `pushReaction` | enum | `NORMAL`, `DESTROY`, `BLOCK`, `PUSH_ONLY` (piston interaction). |
| `ignitedByLava` | bool | Catches fire when adjacent to lava. |
| `liquid` | bool | Is a fluid source. |
| `forceSolidOff` / `forceSolidOn` | bool | Forces `isSolidRender` for rendering. |
| `instrument` | enum | Note-block instrument (harp, basedrum, snare, hat, bass, flute, bell, guitar, xylophone, iron_xylophone, cow_bell, didgeridoo, bit, banjo, pling, zombie, skeleton, creeper, dragon, wither, piglin, custom_head). Driven by block beneath note block. |
| `replaceable` | bool | Can be replaced by another block placed in the same space (grass, snow layers, fluids, fire). |
| `colored` | bool | Dyed blocks (concrete, wool, terracotta). |

### Sound Types (vanilla)

| SoundType | Used By |
|---|---|
| `WOOD` | Planks, logs, fences |
| `GRAVEL` | Gravel, flint |
| `GRASS` | Grass block, tall grass |
| `SAND` | Sand, red sand, concrete powder |
| `STONE` | Stone, cobblestone, ores |
| `METAL` | Iron block, gold block, copper |
| `GLASS` | Glass, glass pane |
| `WOOL` | Wool, carpet |
| `LILY_PADS` | Lily pad |
| `ANCIENT_DEBRIS` | Ancient debris |
| `BASALT` | Basalt |
| `NETHER_BRICK` | Nether bricks |
| `NETHER_GOLD_ORE` | Nether gold ore |
| `NETHER_ORE` | Nether quartz ore |
| `NETHER_SPROUTS` | Nether sprouts |
| `NYLIUM` | Nylium |
| `ROOTS` | Roots |
| `SHROOMLIGHT` | Shroomlight |
| `SOUL_SAND` | Soul sand |
| `SOUL_SOIL` | Soul soil |
| `STEM` | Melon/pumpkin stem |
| `WART_BLOCK` | Netherrack wart block |
| `CORAL_BLOCK` | Coral blocks |
| `DEEPSLATE` | Deepslate variants |
| `DRIPSTONE` | Pointed dripstone |
| `NETHER_WART` | Nether wart |
| `AMETHYST` | Amethyst blocks / buds |
| `AMETHYST_CLUSTER` | Amethyst clusters |
| `BONE_BLOCK` | Bone block |
| `CALCITE` | Calcite |
| `COPPER` | Copper blocks |
| `GILDED_BLACKSTONE` | Gilded blackstone |
| `HONEY_BLOCK` | Honey block |
| `LODESTONE` | Lodestone |
| `MOSS` | Moss block |
| `MOSS_CARPET` | Moss carpet |
| `MUD` | Mud |
| `MUD_BRICKS` | Mud bricks |
| `PACKED_MUD` | Packed mud |
| `NETHERRACK` | Netherrack |
| `POWDER_SNOW` | Powder snow |
| `TUFF` | Tuff |
| `TUFF_STEP` (1.21) | Tuff stairs/slabs |
| `COPPER_BULB` (1.21) | Copper bulb |
| `COPPER_GRATE` (1.21) | Copper grate |
| `CHISELED_BOOKSHELF` | Chiseled bookshelf |
| `SPORE_BLOSSOM` | Spore blossom |
| `AZALEA` | Azalea leaves |
| `BAMBOO_WOOD` | Bamboo planks |
| `BAMBOO_SAPLING` | Bamboo sapling |
| `BIG_DRIPLEAF` | Big dripleaf |
| `SMALL_DRILEAF` | Small dripleaf |
| `CHERRY_LEAVES` / `CHERRY_WOOD` | Cherry |
| `MANGROVE_ROOTS` | Mangrove roots |
| `MUDDY_MANGROVE_ROOTS` | Muddy mangrove roots |
| `SCULK` / `SCULK_CATALYST` / `SCULK_VEIN` / `SCULK_SHRIEKER` / `SCULK_SENSOR` | Sculk family |
| `DECORATED_POT` | Decorated pot |
| `PINK_PETALS` | Pink petals |
| `SUSPICIOUS_SAND` / `SUSPICIOUS_GRAVEL` | Suspicious blocks |
| `TRIAL_SPAWNER` / `VAULT` (1.21) | Trial chambers |
| `HEAVY_CORE` (1.21) | Heavy core (mace) |
| `CRAFTER` (1.21) | Crafter |
| `BREEZE` family | Trial spawner blocks |

### Material / Map Colors (legacy groupings)

`AIR`, `STRUCTURAL_AIR`, `PORTAL`, `CARPET`, `PLANT`, `WATER_PLANT`, `VEGETABLE`, `EGG`, `DIRT`, `GRASS`, `ICE_SOLID`, `SAND`, `SPONGE`, `WOOD`, `BAMBOO_SAPLING`, `BAMBOO`, `WOOL`, `TNT`, `LEAVES`, `GLASS`, `ICE`, `CACTUS`, `STONE`, `IRON`, `SNOW_LAYER`, `SNOW_BLOCK`, `AMETHYST`, `BARRIER`, `PUFFERFISH_SPAWN_EGG`, `COPPER`, `GOLD`, `DIAMOND`, `LAPIS`, `EMERALD`, `NETHERITE`, `REDSTONE_LAMP`, `EMERALD_BLOCK`, etc. (color shows on maps and influences flammability/piston push).

### Tool Tiers (mining level & speed)

| Tier | Mining Level | Speed Mult | Used For |
|---|---|---|---|
| Wood / Gold | 0 | 2x | Stone, coal, netherrack |
| Stone | 1 | 4x | Iron, copper, lapis |
| Iron | 2 | 6x | Gold, redstone, diamond, emerald, nether quartz |
| Diamond | 3 | 8x | Obsidian, ancient debris, diamond block |
| Netherite | 4 | 9x | Ancient debris faster |
| Shears | — | 1.5x | Wool, leaves, cobwebs, vines |
| Sword | — | 1.5x | Cobwebs, bamboo |

Some blocks require *no tool* but have a faster mining tool (e.g., dirt → shovel). `requiresCorrectToolForDrops=true` blocks **only** drop with the correct tool tier or higher.

---

## 2. Natural Blocks

### 2.1 Stone & Rock Variants

| Name | ID | Hard | Resist | Light | Tool | Drops | Notes |
|---|---|---|---|---|---|---|---|
| Stone | `stone` | 1.5 | 6 | 0 | pickaxe ✓ | cobblestone | Smelts to smooth stone |
| Granite | `granite` | 1.5 | 6 | 0 | pickaxe ✓ | self | Smelts to polished granite |
| Polished Granite | `polished_granite` | 1.5 | 6 | 0 | pickaxe ✓ | self | |
| Diorite | `diorite` | 1.5 | 6 | 0 | pickaxe ✓ | self | |
| Polished Diorite | `polished_diorite` | 1.5 | 6 | 0 | pickaxe ✓ | self | |
| Andesite | `andesite` | 1.5 | 6 | 0 | pickaxe ✓ | self | |
| Polished Andesite | `polished_andesite` | 1.5 | 6 | 0 | pickaxe ✓ | self | |
| Cobblestone | `cobblestone` | 2.0 | 6 | 0 | pickaxe ✓ | self | Smelts to stone |
| Mossy Cobblestone | `mossy_cobblestone` | 2.0 | 6 | 0 | pickaxe ✓ | self | |
| Deepslate | `deepslate` | 3.0 | 6 | 0 | pickaxe ✓ | cobbled_deepslate | Found below Y=0 (1.18+) |
| Cobbled Deepslate | `cobbled_deepslate` | 3.5 | 6 | 0 | pickaxe ✓ | self | |
| Polished Deepslate | `polished_deepslate` | 3.5 | 6 | 0 | pickaxe ✓ | self | |
| Tuff | `tuff` | 1.5 | 6 | 0 | pickaxe ✓ | self | |
| Calcite | `calcite` | 0.75 | 6 | 0 | pickaxe ✓ | self | Found in amethyst geodes |
| Dripstone Block | `dripstone_block` | 1.5 | 6 | 0 | pickaxe ✓ | self | |
| Pointed Dripstone | `pointed_dripstone` | 1.5 | 3 | 0 | pickaxe ✓ | self | Falls, grows, can drip water/lava |
| Bedrock | `bedrock` | -1 | 3600000 | 0 | none | — | Unbreakable; only at world bottom/roof |
| Smooth Stone | `smooth_stone` | 2.0 | 6 | 0 | pickaxe ✓ | self | |
| Obsidian | `obsidian` | 50 | 1200 | 0 | diamond/netherite pickaxe | self | Crying variant exists |
| Crying Obsidian | `crying_obsidian` | 50 | 1200 | 0 | diamond pickaxe ✓ | self | Emits light 10, drip particles |
| Magma Block | `magma_block` | 0.5 | 0.5 | 3 | pickaxe ✓ | self | Damages mobs (fire), sets fire to flammables above in Nether |
| Basalt | `basalt` | 1.25 | 4.2 | 0 | pickaxe ✓ | self | Smelts to smooth basalt |
| Smooth Basalt | `smooth_basalt` | 1.25 | 4.2 | 0 | pickaxe ✓ | self | Geode outer shell |
| Infested Stone | `infested_stone` | 0.75 | 0.75 | 0 | pickaxe | stone + silverfish | Drops nothing on player break (spawns silverfish) |
| Infested Cobblestone | `infested_cobblestone` | 1.0 | 3.75 | 0 | pickaxe | cobblestone + silverfish | |
| Infested Deepslate | `infested_deepslate` | 1.5 | 3.75 | 0 | pickaxe | deepslate + silverfish | |
| Snow Block | `snow_block` | 0.2 | 0.2 | 0 | shovel ✓ | snowball ×4 | |
| Packed Ice | `packed_ice` | 0.5 | 0.5 | 0 | pickaxe (silk) | self (silk only) | Slippery, melts in nether |
| Blue Ice | `blue_ice` | 2.8 | 2.8 | 0 | pickaxe ✓ | self | Most slippery (0.989 friction) |
| Clay | `clay` | 0.6 | 0.6 | 0 | shovel ✓ | clay_ball ×4 | |
| Glowstone | `glowstone` | 0.3 | 0.3 | 15 | any | glowstone_dust ×4 (avg) | |

### 2.2 Dirt, Sand, Gravel & Aggregate

| Name | ID | Hard | Resist | Light | Tool | Drops | Notes |
|---|---|---|---|---|---|---|---|
| Grass Block | `grass_block` | 0.6 | 0.6 | 0 | shovel ✓ | dirt | Spreads to dirt, dies under opaque blocks |
| Dirt | `dirt` | 0.5 | 0.5 | 0 | shovel ✓ | self | |
| Coarse Dirt | `coarse_dirt` | 0.5 | 0.5 | 0 | shovel ✓ | self | Grass doesn't spread to it |
| Podzol | `podzol` | 0.5 | 0.5 | 0 | shovel ✓ | self | Doesn't revert to dirt |
| Mycelium | `mycelium` | 0.6 | 0.6 | 0 | shovel ✓ | dirt | Spreads like grass |
| Rooted Dirt | `rooted_dirt` | 0.5 | 0.5 | 0 | shovel ✓ | self | Grows hanging roots below |
| Moss Block | `moss_block` | 0.1 | 1 | 0 | hoe ✓ | self | Fertilizable, converts neighbors |
| Mud | `mud` | 0.5 | 0.5 | 0 | shovel ✓ | self | Dried by pointed dripstone; from water+bottle on dirt |
| Sand | `sand` | 0.5 | 0.5 | 0 | shovel ✓ | self | Falls (gravity) |
| Red Sand | `red_sand` | 0.5 | 0.5 | 0 | shovel ✓ | self | Falls |
| Sandstone | `sandstone` | 0.8 | 0.8 | 0 | pickaxe ✓ | self | |
| Red Sandstone | `red_sandstone` | 0.8 | 0.8 | 0 | pickaxe ✓ | self | |
| Gravel | `gravel` | 0.6 | 0.6 | 0 | shovel ✓ | self / flint (10%) | Falls; flint chance by fortune |
| Soul Sand | `soul_sand` | 0.5 | 0.5 | 0 | shovel ✓ | self | Slows movement, water bubbles up |
| Soul Soil | `soul_soil` | 0.5 | 0.5 | 0 | shovel ✓ | self | Fire on it is soul fire (blue) |

### 2.3 Ores (Overworld)

| Name | ID | Hard | Resist | Light | Tool | Drops | Notes |
|---|---|---|---|---|---|---|---|
| Coal Ore | `coal_ore` | 3.0 | 3.0 | 0 | pickaxe ✓ | coal ×1 + exp | Stone-tier required |
| Deepslate Coal Ore | `deepslate_coal_ore` | 4.5 | 4.5 | 0 | pickaxe ✓ | coal + exp | |
| Iron Ore | `iron_ore` | 3.0 | 3.0 | 0 | stone+ pickaxe ✓ | raw_iron + exp | Smelts to iron ingot |
| Deepslate Iron Ore | `deepslate_iron_ore` | 4.5 | 4.5 | 0 | pickaxe ✓ | raw_iron + exp | |
| Copper Ore | `copper_ore` | 3.0 | 3.0 | 0 | stone+ pickaxe ✓ | raw_copper ×2-5 + exp | |
| Deepslate Copper Ore | `deepslate_copper_ore` | 4.5 | 4.5 | 0 | pickaxe ✓ | raw_copper + exp | |
| Gold Ore | `gold_ore` | 3.0 | 3.0 | 0 | iron+ pickaxe ✓ | raw_gold + exp | |
| Deepslate Gold Ore | `deepslate_gold_ore` | 4.5 | 4.5 | 0 | pickaxe ✓ | raw_gold + exp | |
| Redstone Ore | `redstone_ore` | 3.0 | 3.0 | 0 (glows 9 when interacted) | iron+ pickaxe ✓ | redstone ×4-5 + exp | Glows briefly when clicked/stepped |
| Deepslate Redstone Ore | `deepslate_redstone_ore` | 4.5 | 4.5 | 0 (glows 9) | pickaxe ✓ | redstone + exp | |
| Emerald Ore | `emerald_ore` | 3.0 | 3.0 | 0 | iron+ pickaxe ✓ | emerald + exp | Rare, single-block veins |
| Deepslate Emerald Ore | `deepslate_emerald_ore` | 4.5 | 4.5 | 0 | pickaxe ✓ | emerald + exp | |
| Lapis Ore | `lapis_ore` | 3.0 | 3.0 | 0 | stone+ pickaxe ✓ | lapis_lazuli ×4-9 + exp | |
| Deepslate Lapis Ore | `deepslate_lapis_ore` | 4.5 | 4.5 | 0 | pickaxe ✓ | lapis + exp | |
| Diamond Ore | `diamond_ore` | 3.0 | 3.0 | 0 | iron+ pickaxe ✓ | diamond + exp | |
| Deepslate Diamond Ore | `deepslate_diamond_ore` | 4.5 | 4.5 | 0 | pickaxe ✓ | diamond + exp | |
| Nether Quartz Ore | `nether_quartz_ore` | 3.0 | 3.0 | 0 | pickaxe (wood ok) ✓ | quartz + exp | Nether |
| Nether Gold Ore | `nether_gold_ore` | 3.0 | 3.0 | 0 | pickaxe (wood ok) ✓ | gold_nugget ×2-6 + exp | |
| Ancient Debris | `ancient_debris` | 30 | 1200 | 0 | diamond+ pickaxe ✓ | self | Explosion resistant |

### 2.4 Ice & Snow

| Name | ID | Hard | Resist | Light | Tool | Drops | Notes |
|---|---|---|---|---|---|---|---|
| Ice | `ice` | 0.5 | 0.5 | 0 | pickaxe (silk) | self (silk only) | Friction 0.98; melts near light |
| Packed Ice | `packed_ice` | 0.5 | 0.5 | 0 | pickaxe ✓ | self | Doesn't melt |
| Blue Ice | `blue_ice` | 2.8 | 2.8 | 0 | pickaxe ✓ | self | Slipperiest |
| Frosted Ice | `frosted_ice` | 0.5 | 0.5 | 0 | any | — | Created by Frost Walker; melts |
| Snow (layer) | `snow` | 0.1 | 0.1 | 0 | shovel ✓ | snowball ×1-8 (per layer) | 1-8 layers, can stack |
| Snow Block | `snow_block` | 0.2 | 0.2 | 0 | shovel ✓ | snowball ×4 | |

### 2.5 Other Terrain

| Name | ID | Hard | Resist | Light | Tool | Drops | Notes |
|---|---|---|---|---|---|---|---|
| Moss Carpet | `moss_carpet` | 0.1 | 0.1 | 0 | hoe ✓ | self | |
| Powder Snow | `powder_snow` | 0.25 | 0.25 | 0 | shovel (bucket) | — | Entities sink/freeze; leather armor mitigates |
| Packed Powder Snow | (no block; bucket only) | — | — | — | — | — | (Powder Snow Cauldron holds it) |
| Bone Block | `bone_block` | 2.0 | 2.0 | 0 | pickaxe ✓ | self | Fossil structure |
| Glow Lichen | `glow_lichen` | 0.2 | 0.2 | 7 | shears | self | Climbs walls, fertilized with bone meal |
| Spore Blossom | `spore_blossom` | 0.2 | 0.2 | 0 | any | self | Hangs from ceiling, particles |
| Amethyst Cluster (all stages) | `amethyst_cluster` etc. | 1.5 | 1.5 | 5 | pickaxe ✓ | self (4 stages) | Stages: small, medium, large, cluster; cluster light 5 |
| Budding Amethyst | `budding_amethyst` | 1.5 | 1.5 | 0 | pickaxe (silk only) | self (silk only) | Generates amethyst buds over time |

---

## 3. Building Blocks

### 3.1 Wood Planks & Logs

Wood has 11 species in 1.21: **Oak, Spruce, Birch, Jungle, Acacia, Dark Oak, Mangrove, Cherry, Bamboo, Crimson, Warped**. (Crimson/Warped are Nether "stem" woods but use wood properties.)

Each species has a family: `log`, `wood`, `stripped_log`, `stripped_wood`, `planks`, `slab`, `stairs`, `fence`, `fence_gate`, `door`, `trapdoor`, `button`, `pressure_plate`, `sign`, `hanging_sign`, `boat` (item).

| Block | Hard | Resist | Light | Tool | Flammable | Notes |
|---|---|---|---|---|---|---|
| Log (any) | 2.0 | 2.0 | 0 | axe | Y | Bark variant for 6-sided |
| Stripped Log | 2.0 | 2.0 | 0 | axe | Y | |
| Wood | 2.0 | 2.0 | 0 | axe | Y | 6-sided bark |
| Planks | 2.0 | 3.0 | 0 | axe ✓ | Y | |
| Slab (wood) | 2.0 | 3.0 | 0 | axe | Y | |
| Stairs (wood) | 2.0 | 3.0 | 0 | axe | Y | |
| Fence | 2.0 | 3.0 | 0 | axe | Y | 1.5 block collision |
| Fence Gate | 2.0 | 3.0 | 0 | axe | Y | Redstone-able |
| Wood Door | 3.0 | 3.0 | 0 | axe | Y | Two-block tall, redstone-able |
| Wood Trapdoor | 3.0 | 3.0 | 0 | axe | Y | |
| Wood Button | 0.5 | 0.5 | 0 | axe | Y | Short pulse |
| Wood Pressure Plate | 0.5 | 0.5 | 0 | axe | Y | Detects all entities |
| Sign / Hanging Sign | 1.0 | 1.0 | 0 | axe | Y | |
| Bamboo Mosaic | 2.0 | 3.0 | 0 | axe | Y | Bamboo-specific decorative |

Cherry planks are pink; mangrove planks are red; crimson/warped planks are red/blue but **not flammable** and are immune to fire. Crimson/Warped use `stem` and `hyphae` instead of `log`/`wood` for IDs.

### 3.2 Stone Bricks & Polished Stone

Each major stone type (stone, cobblestone, sandstone, red sandstone, deepslate, blackstone, basalt, granite, diorite, andesite, prismarine, dark prismarine, prismarine bricks, end stone, nether bricks, mossy variants, quartz, purpur, mud bricks, brick) supports: full block, stairs, slab, wall. Stone also supports: smooth stone, smooth stone slab, chiseled stone bricks, cracked stone bricks, mossy stone bricks.

| Block | Hard | Resist | Notes |
|---|---|---|---|
| Stone Bricks | 1.5 | 6 | |
| Mossy Stone Bricks | 1.5 | 6 | |
| Cracked Stone Bricks | 1.5 | 6 | |
| Chiseled Stone Bricks | 1.5 | 6 | |
| Smooth Stone | 2.0 | 6 | |
| Sandstone (variants) | 0.8 | 0.8 | Cut, chiseled, smooth variants |
| Deepslate Bricks / Tiles | 3.5 | 6 | Cracked variants exist |
| Polished Granite/Diorite/Andesite | 1.5 | 6 | |

### 3.3 Bricks, Sandstone, Quartz

| Name | ID | Hard | Resist | Tool | Notes |
|---|---|---|---|---|---|
| Bricks | `bricks` | 2.0 | 6 | pickaxe | |
| Brick Stairs/Slab/Wall | `brick_*` | 2.0 | 6 | pickaxe | |
| Sandstone | `sandstone` | 0.8 | 0.8 | pickaxe | |
| Cut Sandstone | `cut_sandstone` | 0.8 | 0.8 | pickaxe | |
| Chiseled Sandstone | `chiseled_sandstone` | 0.8 | 0.8 | pickaxe | |
| Smooth Sandstone | `smooth_sandstone` | 0.8 | 0.8 | pickaxe | |
| Red Sandstone (variants) | `*_red_sandstone` | 0.8 | 0.8 | pickaxe | |
| Block of Quartz | `quartz_block` | 0.8 | 0.8 | pickaxe | |
| Smooth Quartz | `smooth_quartz` | 0.8 | 0.8 | pickaxe | |
| Quartz Bricks | `quartz_bricks` | 0.8 | 0.8 | pickaxe | |
| Quartz Pillar | `quartz_pillar` | 0.8 | 0.8 | pickaxe | |
| Chiseled Quartz Block | `chiseled_quartz_block` | 0.8 | 0.8 | pickaxe | |

### 3.4 Concrete & Concrete Powder

16 colors. Concrete powder is gravity-affected; becomes concrete when touching water.

| Block | Hard | Resist | Tool | Notes |
|---|---|---|---|---|
| Concrete (any color) | 1.8 | 1.8 | pickaxe | Solid color, not flammable |
| Concrete Powder | 0.5 | 0.5 | shovel | Falls like sand; solidifies in water |

Color IDs: `white_concrete`, `orange_concrete`, `magenta_concrete`, `light_blue_concrete`, `yellow_concrete`, `lime_concrete`, `pink_concrete`, `gray_concrete`, `light_gray_concrete`, `cyan_concrete`, `purple_concrete`, `blue_concrete`, `brown_concrete`, `green_concrete`, `red_concrete`, `black_concrete`. Same for `_concrete_powder`.

### 3.5 Terracotta & Glazed Terracotta

| Block | Hard | Resist | Tool | Notes |
|---|---|---|---|---|
| Terracotta | 1.25 | 4.2 | pickaxe | Smelted clay |
| Glazed Terracotta (16 colors) | 1.4 | 1.4 | pickaxe | Has directional pattern; smelted colored terracotta |

Glazed terracotta IDs: `white_glazed_terracotta` … `black_glazed_terracotta`. Block state `facing` (north/south/east/west) controls pattern rotation.

### 3.6 Wool & Carpets

16 colors each. Wool is flammable, sound-dampening.

| Block | Hard | Resist | Tool | Notes |
|---|---|---|---|---|
| Wool (any color) | 0.8 | 0.8 | shears/any | Flammable, instrument override (note block) |
| Carpet (any color) | 0.1 | 0.1 | any | Lies flat; can be placed on top of many blocks |

Color IDs follow same 16-color naming scheme as concrete.

### 3.7 Glass & Stained Glass

| Block | Hard | Resist | Light | Tool | Notes |
|---|---|---|---|---|---|
| Glass | 0.3 | 0.3 | 0 | any (silk) | Drops nothing without silk touch |
| Glass Pane | 0.3 | 0.3 | 0 | any (silk) | Connects to neighbors |
| Stained Glass (16) | 0.3 | 0.3 | 0 | any (silk) | Tinted variants |
| Tinted Glass | `tinted_glass` | 0.3 | 0.3 | 0 | any (silk) | Blocks light completely; amethyst-craft |

### 3.8 Prismarine, Blackstone, & Other Builds

| Name | Hard | Resist | Tool | Notes |
|---|---|---|---|---|
| Prismarine | 1.5 | 6 | pickaxe | Animated texture |
| Prismarine Bricks | 1.5 | 6 | pickaxe | |
| Dark Prismarine | 1.5 | 6 | pickaxe | |
| Blackstone | 1.5 | 6 | pickaxe | |
| Basalt (smooth/polished) | 1.25 | 4.2 | pickaxe | |
| Gilded Blackstone | `gilded_blackstone` | 1.5 | 6 | pickaxe | Drops gold nuggets (chance) |
| Mud Bricks | 1.5 | 3 | pickaxe | |
| Packed Mud | 1.5 | 3 | pickaxe | |

---

## 4. Decoration Blocks

### 4.1 Lighting

| Name | ID | Hard | Resist | Light | Tool | Notes |
|---|---|---|---|---|---|---|
| Torch | `torch` | 0 | 0 | 14 | any | Wall/floor variants |
| Soul Torch | `soul_torch` | 0 | 0 | 10 | any | Blue fire |
| Redstone Torch | `redstone_torch` | 0 | 0 | 7 (off=0) | any | Inverts redstone |
| Lantern | `lantern` | 3.5 | 3.5 | 15 | any | Hangs under blocks |
| Soul Lantern | `soul_lantern` | 3.5 | 3.5 | 10 | any | |
| Glowstone | `glowstone` | 0.3 | 0.3 | 15 | any | |
| Sea Lantern | `sea_lantern` | 0.3 | 0.3 | 15 | any | Drops 2-3 crystals |
| Shroomlight | `shroomlight` | 1.0 | 1.0 | 15 | hoe/any | |
| End Rod | `end_rod` | 0 | 0 | 14 | any | Directional |
| Jack o'Lantern | `jack_o_lantern` | 1.0 | 1.0 | 15 | axe/any | Directional face |
| Campfire | `campfire` | 2.0 | 2.0 | 15 (smoke) | axe | Cooks food, can be extinguished |
| Soul Campfire | `soul_campfire` | 2.0 | 2.0 | 10 | axe | |
| Froglight (pearlescent/verdant/ochre) | `*_froglight` | 0.3 | 0.3 | 15 | any | 3 types by frog variant |
| Crying Obsidian | `crying_obsidian` | 50 | 1200 | 10 | diamond pickaxe | |
| Redstone Lamp | `redstone_lamp` | 0.3 | 0.3 | 15 (on) | any | Powered = lit |
| Resin Clump / Block (1.21.4+) | `resin_block` etc. | 1.5 | 6 | — | pickaxe | Pale Garden |
| Creaking Heart | `creaking_heart` | 10 | 50 | 0 | axe | Tied to creaking mob; pale_oak wood |

### 4.2 Decorative Items

| Name | ID | Hard | Notes |
|---|---|---|---|
| Bookshelf | `bookshelf` | 1.5 | Boosts enchanting table (3 levels each) |
| Chiseled Bookshelf | `chiseled_bookshelf` | 1.5 | Stores books in 6 slots, comparator output |
| Lectern | `lectern` | 2.5 | Holds book, redstone output |
| Banner (16 colors) | `*_banner` | 1.0 | Two-block tall, directional |
| Item Frame | `item_frame` (entity-block hybrid) | — | Holds item, comparator on filled |
| Painting | (entity) | — | Wall-mounted |
| Flower Pot | `flower_pot` | 0 | Holds small plant |
| Armor Stand | (entity) | — | |
| Bell | `bell` | 1.0 | Rings on hit; alerts villagers |
| Soul Sand / Soul Soil | (see Natural) | 0.5 | Decorative uses |
| Skeleton Skull / Wither Skeleton Skull / Zombie Head / Player Head / Creeper Head / Piglin Head / Dragon Head | `*_skull` / `*_head` | 1.0 | Wearable, placeable, redstone-powerable |

### 4.3 Wall & Floor Decor

| Name | Hard | Notes |
|---|---|---|
| Ladder | 0.4 | Climbable |
| Vines | 0.2 | Climbs walls, flammable |
| Ladder-style: Weeping Vines, Twisting Vines | 0.2 | Nether vines (grow down/up) |
| Glow Lichen | 0.2 | Wall plant, emits light 7 |
| Scaffolding | 0 | Build helper; bottom needs support; collapsible |
| Iron Bars | 5.0 | Glass-pane style |
| Chain | 5.0 | Decorative chain |
| Lantern (see above) | 3.5 | |
| Candle (17 variants: plain + 16 colors) | 0.1 | Stackable 1-4 per block; waterloggable (plain candle exists). Light scales with count: 3, 6, 9, 12 |

---

## 5. Functional Blocks

### 5.1 Crafting & Storage

| Name | ID | Hard | Resist | Tool | Notes |
|---|---|---|---|---|---|
| Crafting Table | `crafting_table` | 2.5 | 2.5 | axe | 3x3 grid UI |
| Furnace | `furnace` | 3.5 | 3.5 | pickaxe | Smelts; light when active |
| Blast Furnace | `blast_furnace` | 3.5 | 3.5 | pickaxe | 2x metal/ore speed |
| Smoker | `smoker` | 3.5 | 3.5 | pickaxe | 2x food speed |
| Stonecutter | `stonecutter` | 3.5 | 3.5 | pickaxe | 1 stone → 1 stair/slab-equivalent |
| Loom | `loom` | 2.5 | 2.5 | axe | Banner patterns |
| Cartography Table | `cartography_table` | 2.5 | 2.5 | axe | Map zoom/clone |
| Fletching Table | `fletching_table` | 2.5 | 2.5 | axe | Fletcher villager |
| Smithing Table | `smithing_table` | 2.5 | 2.5 | axe | Upgrades gear (1.20+ trim/upgrade system) |
| Anvil | `anvil` | 5.0 | 1200 | pickaxe | Damages from falling, three damaged states |
| Chipped Anvil | `chipped_anvil` | 5.0 | 1200 | pickaxe | |
| Damaged Anvil | `damaged_anvil` | 5.0 | 1200 | pickaxe | |
| Grindstone | `grindstone` | 2.0 | 6 | pickaxe/axe | Removes enchants, repairs |
| Chest | `chest` | 2.5 | 2.5 | axe | 27-slot, doubles to 54 adjacent |
| Trapped Chest | `trapped_chest` | 2.5 | 2.5 | axe | Emits redstone by players accessing |
| Ender Chest | `ender_chest` | 22.5 | 1200 | pickaxe (silk) | Shared inventory across dimensions |
| Barrel | `barrel` | 2.5 | 2.5 | axe | Storage; opens from any side |
| Shulker Box (16 colors + plain) | `*_shulker_box` | 2.0 | 2.0 | pickaxe | Drops items inside |
| Chiseled Bookshelf | `chiseled_bookshelf` | 1.5 | 1.5 | any | 6-slot book storage |
| Decorated Pot | `decorated_pot` | 0 | 0 | any | Holds stackable items (1.20+) |
| Bundles (item, not block) | — | — | — | — | (Note: not a block) |
| Crafter | `crafter` (1.21) | 3.5 | 3.5 | pickaxe | Auto-crafts when powered |

### 5.2 Food & Agriculture Functional

| Name | ID | Hard | Tool | Notes |
|---|---|---|---|---|
| Brewing Stand | `brewing_stand` | 0.5 | pickaxe | Brews potions |
| Cauldron | `cauldron` | 2.0 | pickaxe | Holds water/lava/powder snow/dye |
| Water Cauldron | `water_cauldron` | 2.0 | pickaxe | Filled state |
| Lava Cauldron | `lava_cauldron` | 2.0 | pickaxe | Light 15 |
| Powder Snow Cauldron | `powder_snow_cauldron` | 2.0 | pickaxe | |
| Bee Nest | `bee_nest` | 0.3 | axe | Holds bees, makes honey |
| Beehive | `beehive` | 0.6 | axe | Crafted bee nest |
| Honey Block | `honey_block` | 0 | any | Sticky; reduces fall/jump; slime-like |
| Honeycomb Block | `honeycomb_block` | 0.6 | any | Decorative |
| Composter | `composter` | 0.6 | axe | Converts plant matter to bone meal |
| Farmland | `farmland` | 0.6 | any | Hydrated by water 4 blocks away |
| Hay Block | `hay_block` | 0.5 | any | Reduces fall damage 80% |

### 5.3 Utility & Information

| Name | ID | Hard | Notes |
|---|---|---|---|
| Enchanting Table | `enchanting_table` | 5.0 | 1200 resistance; emits light 7 |
| Anvil family | see above | | |
| Beacon | `beacon` | 3.0 | Resistance 15; needs pyramid of mineral blocks; light 15 |
| Conduit | `conduit` | 3.0 | Conduit power (water breathing + mining speed underwater) |
| Lodestone | `lodestone` | 3.5 | Compasses point to it |
| Jukebox | `jukebox` | 2.0 | Plays music discs |
| Note Block | `note_block` | 0.8 | Plays note; instrument depends on block below |
| Bell | `bell` | 1.0 | Rings; raider alert |
| Respawn Anchor | `respawn_anchor` | 50 | Sets spawn in nether; 4 charges; explosion if used in overworld |
| Bed (16 colors) | `*_bed` | 0.2 | Sets spawn (overworld), explodes in nether/end; two blocks long |
| Command Block (impulse/chain/repeat) | `*_command_block` | -1 | Unbreakable; runs commands |
| Structure Block | `structure_block` | -1 | Saves/loads structures |
| Structure Void | `structure_void` | 0 | Invisible to structure save |
| Jigsaw Block | `jigsaw` | -1 | Structure generation |
| Trial Spawner / Vault (1.21) | `trial_spawner` / `vault` | 50 | Unbreakable by players; spawner & reward container |
| Spawner (mob spawner) | `spawner` | 5.0 | Drops XP only; silk touch doesn't keep data (Java) |

---

## 6. Redstone Blocks

| Name | ID | Hard | Resist | Light | Notes |
|---|---|---|---|---|---|
| Redstone Dust | `redstone_wire` | 0 | 0 | 0 | Power 0-15, connects to neighbors |
| Redstone Torch | `redstone_torch` | 0 | 0 | 7 (off=0) | Constant power 15; turns off when block above powered |
| Redstone Lamp | `redstone_lamp` | 0.3 | 0.3 | 15 (on) | Lights when powered |
| Redstone Block | `redstone_block` | 5.0 | 6 | 0 | Constant power 15 source |
| Lever | `lever` | 0.5 | 0.5 | 0 | Toggle power |
| Stone Button | `stone_button` | 0.5 | 0.5 | 0 | 10-tick pulse |
| Oak Button (any wood) | `*_button` | 0.5 | 0.5 | 0 | 15-tick pulse |
| Wooden Pressure Plate | `*_pressure_plate` | 0.5 | 0.5 | 0 | All entities |
| Stone Pressure Plate | `stone_pressure_plate` | 0.5 | 0.5 | 0 | Players/mobs only |
| Light Weighted Pressure Plate (gold) | `light_weighted_pressure_plate` | 0.5 | 0.5 | 0 | Output by item count (max 15) |
| Heavy Weighted Pressure Plate (iron) | `heavy_weighted_pressure_plate` | 0.5 | 0.5 | 0 | Output by item count (slower scaling) |
| Observer | `observer` | 3.5 | 3.5 | 0 | Outputs 2-tick pulse on block update behind it |
| Repeater | `repeater` | 0 | 0 | 0 | 1-4 tick delay (right-click to set) |
| Comparator | `comparator` | 0 | 0 | 0 | Compares/subtracts; reads containers |
| Piston | `piston` | 1.5 | 1.5 | 0 | Pushes up to 12 blocks |
| Sticky Piston | `sticky_piston` | 1.5 | 1.5 | 0 | Pulls back its head block |
| Piston Head | `piston_head` | 1.5 | 1.5 | 0 | The visual extension |
| Moving Piston | `moving_piston` | -1 | — | 0 | Transient block during piston motion |
| Dispenser | `dispenser` | 3.5 | 3.5 | 0 | Uses items (arrows, water bucket, TNT, etc.) |
| Dropper | `dropper` | 3.5 | 3.5 | 0 | Drops items |
| Hopper | `hopper` | 3.2 | 3.2 | 0 | Pulls items from above, pushes into facing |
| Daylight Detector | `daylight_detector` | 0.2 | 0.2 | 0 | Power by light; invertible |
| TNT | `tnt` | 0 | 0 | 0 | Explodes when powered, hit by fire, or fired |
| Target Block | `target` | 0.5 | 0.5 | 0 | Emits redstone by hit accuracy |
| Note Block | see functional | 0.8 | | | |
| Tripwire Hook | `tripwire_hook` | 0 | 0 | 0 | Connects with string |
| Tripwire (String) | `tripwire` | 0 | 0 | 0 | Triggers hook when entity crosses |
| Lectern | see functional | | | | Redstone output by book page |
| Trapped Chest | see storage | | | | Emits signal proportional to viewers |
| Detector Rail | `detector_rail` | 0.7 | 0.7 | 0 | Power when minecart on it |
| Activator Rail | `activator_rail` | 0.7 | 0.7 | 0 | Power ejects/activates entities in cart |
| Powered Rail | `powered_rail` | 0.7 | 0.7 | 0 | Boosts minecart when powered |
| Lightning Rod | `lightning_rod` | 3 | 3 | 0 | Redirects lightning; outputs signal when struck |
| Calibrated Sculk Sensor (1.20+) | `calibrated_sculk_sensor` | 1.5 | 1.5 | 0 | Filterable vibration sensor (facing) |
| Copper Bulb (1.21) | `copper_bulb` | 3.0 | 6 | 15 (on) | Togglable light; oxidation states |
| Crafter (1.21) | `crafter` | 3.5 | 3.5 | 0 | Auto-crafts on pulse; slots can be disabled |

---

## 7. Transport Blocks

### 7.1 Rails

| Name | ID | Hard | Notes |
|---|---|---|---|
| Rail | `rail` | 0.7 | Curves; basic transport |
| Powered Rail | `powered_rail` | 0.7 | Boosts cart |
| Detector Rail | `detector_rail` | 0.7 | Power signal |
| Activator Rail | `activator_rail` | 0.7 | Activates entities in cart |

Rails auto-connect to neighbors, can curve (basic rail only) and ascend.

### 7.2 Vehicles (block placed forms)

| Block | ID | Notes |
|---|---|---|
| Minecart (item → entity) | — | Not a block |
| Boat (item) | — | |
| Saddle / Horse Armor (items) | — | |

### 7.3 Portal Blocks

| Name | ID | Hard | Notes |
|---|---|---|---|
| Nether Portal | `nether_portal` | -1 | Created by fire in obsidian frame; teleports |
| End Portal | `end_portal` | -1 | Created in stronghold; teleports to end |
| End Gateway | `end_gateway` | -1 | Teleports within end |
| End Portal Frame | `end_portal_frame` | -1 | 3600000 resistance; holds eye of ender |

---

## 8. Fluid Blocks

### 8.1 Water

| Property | Value |
|---|---|
| ID | `water` |
| Hardness | 100 (instant with bucket / sponge) |
| Resistance | 500 |
| Light | 0 |
| Flow distance | 7 blocks (level 1-8) |
| Source formation | 2 adjacent sources + bottom = new source (since 1.13) |
| Behavior | Extinguishes fire/entities, hydrates farmland, pushes entities, converts lava obsidian/stone, breaks some blocks on flow |
| Waterlogged | Many full-cube blocks (stairs, slabs, fences, walls, doors, signs, rails, redstone) can be waterlogged — fluid occupies same space |

### 8.2 Lava

| Property | Value |
|---|---|
| ID | `lava` |
| Hardness | 100 |
| Resistance | 100 |
| Light | 15 |
| Flow distance | 3 in overworld, 7 in nether |
| Flow speed | 30 ticks/level overworld; 10 ticks nether |
| Behavior | Sets entities on fire, destroys flammable blocks, creates cobblestone/stone/obsidian with water, ignites TNT, lights adjacent flammable blocks |

---

## 9. Plant Blocks

### 9.1 Logs & Wood

Already covered in §3.1. Note: bamboo has a unique `bamboo` plant block (grows tall, 1-16 segments) separate from bamboo planks. Cherry has unique leaf-particle drop. Mangrove propagule is a sapling that grows hanging roots.

### 9.2 Leaves

11 leaf types (matching woods). Properties:

| Property | Value |
|---|---|
| Hardness | 0.2 |
| Tool | hoe (instant) / shears (drops) / sword (1.5x) |
| Flammable | Yes (60 spread chance, 30 burn) |
| Transparency | Yes (fancy mode = leaves faces; fast mode = solid color) |
| Decay | When > 6 blocks from a log of same type, decays after random tick |
| Drops | Sapling (chance), sticks (chance), apples (oak/dark oak only) |

Leaf IDs: `oak_leaves`, `dark_oak_leaves`, `birch_leaves`, `spruce_leaves`, `jungle_leaves`, `acacia_leaves`, `mangrove_leaves`, `cherry_leaves`, `azalea_leaves`, `flowering_azalea_leaves`, `crimson_nylium`/`warped_nylium` are actually block-of-mass not leaves; `nether_wart_block` and `warped_wart_block` are wart blocks. Pale Oak leaves (`pale_oak_leaves`) added in 1.21.4.

### 9.3 Crops

All crops use `age` 0–7 block state and grow on random ticks (or bone meal).

| Name | ID | Grows On | Drops | Notes |
|---|---|---|---|---|
| Wheat | `wheat` | farmland | wheat item + seeds | Mature at age 7 |
| Carrots | `carrots` | farmland | 1-4 carrots | |
| Potatoes | `potatoes` | farmland | 1-4 potatoes (poisonous chance) | |
| Beetroots | `beetroots` | farmland | beetroot + seeds | Age 0-3 (not 7) |
| Melon Stem | `melon_stem` | farmland | produces melon block adjacent | |
| Pumpkin Stem | `pumpkin_stem` | farmland | produces pumpkin block adjacent | |
| Torchflower Crop | `torchflower_crop` | farmland | torchflower seeds → torchflower | 1.20 |
| Pitcher Crop | `pitcher_crop` | farmland | pitcher pod | 1.20, double-tall |
| Sweet Berry Bush | `sweet_berry_bush` | any | 1-3 berries | Age 0-3; damages mobs |
| Nether Wart | `nether_wart` | soul sand | 2-4 warts | Age 0-3 |
| Cocoa | `cocoa` | jungle log | cocoa beans | Age 0-2; faces log |
| Sugar Cane | `sugar_cane` | dirt/sand adjacent to water | self | Grows up to 3 tall |
| Cactus | `cactus` | sand/red sand | self | Damages mobs; grows up to 3 (no adjacent blocks) |
| Bamboo | `bamboo` | dirt/sand/mud/grass | self | Grows up to 16; ages 0-1 (leaves stage) |
| Kelp | `kelp` | underwater | kelp item | Grows tall, 1-26 |
| Kelp Plant | `kelp_plant` | underwater | kelp item | Stem segments |
| Seagrass | `seagrass` | underwater | self (shears) | Tall variant |
| Sea Pickle | `sea_pickle` | underwater | 1-4 per block | Light 6 underwater when 4 stacked |
| Coral / Coral Fan / Coral Wall Fan | (5 colors × 3) | solid underwater | self (silk) | Dies out of water (gray) |

### 9.4 Flowers & Tall Plants

Small flowers (1 block, `bonemeal`-able):

`dandelion` (now `dandelion`), `poppy`, `blue_orchid`, `allium`, `azure_bluet`, `red_tulip`, `orange_tulip`, `white_tulip`, `pink_tulip`, `oxeye_daisy`, `cornflower`, `lily_of_the_valley`, `wither_rose`, `torchflower`, `suspicious_stew_flowers`.

Tall flowers (2 blocks, `tall_` prefix):

`tall_grass`, `large_fern`, `tall_flowers` (sunflower, lilac, rose_bush, peony, pitcher plant).

Other small vegetation:

| Name | ID | Notes |
|---|---|---|
| Grass (short) | `short_grass` (renamed from `grass` in 1.21) | Bonemeal → double tall grass |
| Fern | `fern` | |
| Dead Bush | `dead_bush` | On sand/hardened clay |
| Vine | `vine` | Climbs walls |
| Weeping Vines | `weeping_vines` | Nether; grows down |
| Weeping Vines Plant | `weeping_vines_plant` | Stem |
| Twisting Vines | `twisting_vines` | Nether; grows up |
| Twisting Vines Plant | `twisting_vines_plant` | Stem |
| Cave Vines | `cave_vines` / `cave_vines_plant` | Glow berries; light 14 when berries present |
| Glow Lichen | `glow_lichen` | Wall-climbing, light 7 |
| Spore Blossom | `spore_blossom` | Ceiling flower |
| Azalea | `azalea` | Bush |
| Flowering Azalea | `flowering_azalea` | Bush variant |
| Big Dripleaf | `big_dripleaf` | Tilts when stepped; can be fertilized |
| Big Dripleaf Stem | `big_dripleaf_stem` | |
| Small Dripleaf | `small_dripleaf` | 2 tall, bonemeal |
| Pink Petals | `pink_petals` | 1.20; directional, stackable 1-4 |
| Lily Pad | `lily_pad` | Floats on water |
| Mangrove Propagule | `mangrove_propagule` | Sapling |
| Spore Blossom | see above | |

### 9.5 Mushrooms & Fungi

| Name | ID | Hard | Notes |
|---|---|---|---|
| Red Mushroom | `red_mushroom` | 0 | Plant on mycelium/podzol or dim light |
| Brown Mushroom | `brown_mushroom` | 0 | |
| Mushroom Block (red/brown/stem) | `*_mushroom_block`, `mushroom_stem` | 0.2 | 6-sided texture variants |
| Nether Wart Block | `nether_wart_block` | 1.0 | Decorative |
| Warped Wart Block | `warped_wart_block` | 1.0 | |
| Shroomlight | `shroomlight` | 1.0 | Light 15 |
| Crimson Fungus | `crimson_fungus` | 0 | Nether |
| Warped Fungus | `warped_fungus` | 0 | Repels endermen; used in potion of leaping |
| Nether Sprouts | `nether_sprouts` | 0 | |
| Crimson Roots | `crimson_roots` | 0 | |
| Warped Roots | `warped_roots` | 0 | |
| Weeping Vines / Twisting Vines | see 9.4 | | |

### 9.6 Saplings

| Sapling | ID | Grows Into |
|---|---|---|
| Oak Sapling | `oak_sapling` | Oak tree |
| Spruce Sapling | `spruce_sapling` | Spruce tree (4 in 2x2 = mega spruce) |
| Birch Sapling | `birch_sapling` | Birch |
| Jungle Sapling | `jungle_sapling` | Jungle (4 = mega) |
| Acacia Sapling | `acacia_sapling` | Acacia |
| Dark Oak Sapling | `dark_oak_sapling` | Dark oak (requires 2x2) |
| Cherry Sapling | `cherry_sapling` | Cherry |
| Mangrove Propagule | `mangrove_propagule` | Mangrove (grows roots) |
| Bamboo (no sapling, grows from shoot) | `bamboo` | — |
| Pale Oak Sapling | `pale_oak_sapling` (1.21.4) | Pale Oak |

All saplings: hardness 0, bonemeal-able, require light level 9+, grow on random tick after bone meal/grass spread chance.

---

## 10. Mineral & Gem Blocks

Storage blocks (9 ingots/gems → 1 block).

| Name | ID | Hard | Resist | Light | Tool | Notes |
|---|---|---|---|---|---|---|
| Block of Coal | `coal_block` | 5.0 | 6 | 0 | pickaxe ✓ | Burns 16,000 ticks (80 items) |
| Block of Iron | `iron_block` | 5.0 | 6 | 0 | stone+ pickaxe ✓ | |
| Block of Gold | `gold_block` | 3.0 | 6 | 0 | iron+ pickaxe ✓ | Piglin attraction |
| Block of Diamond | `diamond_block` | 5.0 | 6 | 0 | iron+ pickaxe ✓ | |
| Block of Emerald | `emerald_block` | 5.0 | 6 | 0 | iron+ pickaxe ✓ | |
| Block of Lapis Lazuli | `lapis_block` | 3.0 | 3.0 | 0 | stone+ pickaxe ✓ | |
| Block of Redstone | `redstone_block` | 5.0 | 6 | 0 | pickaxe ✓ | Power source |
| Block of Netherite | `netherite_block` | 50 | 1200 | 0 | diamond+ pickaxe ✓ | Explosion-proof |
| Block of Copper | `copper_block` | 3.0 | 6 | 0 | stone+ pickaxe ✓ | Oxidizes; waxed variants |
| Exposed Copper | `exposed_copper` | 3.0 | 6 | 0 | pickaxe | Oxidation stage 1 |
| Weathered Copper | `weathered_copper` | 3.0 | 6 | 0 | pickaxe | Stage 2 |
| Oxidized Copper | `oxidized_copper` | 3.0 | 6 | 0 | pickaxe | Stage 3 (final) |
| Cut Copper (and exposed/weathered/oxidized, slabs, stairs) | `cut_copper` etc. | 3.0 | 6 | 0 | pickaxe | |
| Copper Bulb | `copper_bulb` | 3.0 | 6 | 15 (on) | pickaxe | Togglable |
| Copper Grate | `copper_grate` | 3.0 | 6 | 0 | pickaxe | Transparent |
| Copper Door | `copper_door` | 3.0 | 6 | 0 | pickaxe | |
| Copper Trapdoor | `copper_trapdoor` | 3.0 | 6 | 0 | pickaxe | |
| Chiseled Copper | `chiseled_copper` | 3.0 | 6 | 0 | pickaxe | |
| Block of Raw Iron | `raw_iron_block` | 5.0 | 6 | 0 | pickaxe | |
| Block of Raw Copper | `raw_copper_block` | 5.0 | 6 | 0 | pickaxe | |
| Block of Raw Gold | `raw_gold_block` | 5.0 | 6 | 0 | pickaxe | |
| Block of Amethyst | `amethyst_block` | 1.5 | 1.5 | 0 | pickaxe | |
| Block of Quartz | `quartz_block` | 0.8 | 0.8 | 0 | pickaxe | |
| Slime Block | `slime_block` | 0 | 0 | 0 | any | Bouncy (50% bounce); sticky with piston |
| Honey Block | `honey_block` | 0 | 0 | 0 | any | Sticky; reduces fall damage; entities stick to sides |
| Hay Block | `hay_block` | 0.5 | 0.5 | 0 | any | Reduces fall 80% |
| Bone Block | `bone_block` | 2.0 | 2.0 | 0 | pickaxe | Directional pillar |
| Smooth Stone | `smooth_stone` | 2.0 | 6 | 0 | pickaxe | |
| Snow Block | `snow_block` | 0.2 | 0.2 | 0 | shovel | |
| Clay Block | `clay` | 0.6 | 0.6 | 0 | shovel | |
| Glowstone | `glowstone` | 0.3 | 0.3 | 15 | any | |
| Sea Lantern | `sea_lantern` | 0.3 | 0.3 | 15 | any | |
| Resin Block | `resin_block` (1.21.4+) | 1.5 | 6 | 0 | pickaxe | |

---

## 11. Nether Blocks

| Name | ID | Hard | Resist | Light | Tool | Notes |
|---|---|---|---|---|---|---|
| Netherrack | `netherrack` | 0.4 | 0.4 | 0 | pickaxe (wood ok) ✓ | self |
| Nether Quartz Ore | `nether_quartz_ore` | 3.0 | 3.0 | 0 | pickaxe ✓ | quartz + exp |
| Nether Gold Ore | `nether_gold_ore` | 3.0 | 3.0 | 0 | pickaxe ✓ | nuggets |
| Ancient Debris | `ancient_debris` | 30 | 1200 | 0 | diamond+ ✓ | self |
| Soul Sand | `soul_sand` | 0.5 | 0.5 | 0 | shovel | self |
| Soul Soil | `soul_soil` | 0.5 | 0.5 | 0 | shovel | self |
| Glowstone | `glowstone` | 0.3 | 0.3 | 15 | any | dust |
| Magma Block | `magma_block` | 0.5 | 0.5 | 3 | pickaxe | self |
| Basalt / Smooth Basalt | `basalt`, `smooth_basalt` | 1.25 | 4.2 | 0 | pickaxe | |
| Obsidian / Crying Obsidian | `obsidian`, `crying_obsidian` | 50 | 1200 | 0 (10 crying) | diamond pickaxe | |
| Blackstone | `blackstone` | 1.5 | 6 | 0 | pickaxe | |
| Gilded Blackstone | `gilded_blackstone` | 1.5 | 6 | 0 | pickaxe | Drops gold nuggets (10%) or self |
| Basalt Deltas: Blackstone variants | `basalt`, `blackstone`, etc. | | | | | |
| Crimson Nylium / Warped Nylium | `crimson_nylium`, `warped_nylium` | 0.4 | 0.4 | 0 | pickaxe | Spreads to netherrack |
| Nether Bricks | `nether_bricks` | 2.0 | 6 | 0 | pickaxe | |
| Red Nether Bricks | `red_nether_bricks` | 2.0 | 6 | 0 | pickaxe | |
| Chiseled Nether Bricks | `chiseled_nether_bricks` | 2.0 | 6 | 0 | pickaxe | |
| Cracked Nether Bricks | `cracked_nether_bricks` | 2.0 | 6 | 0 | pickaxe | |
| Nether Brick (stairs/slab/fence/wall) | various | 2.0 | 6 | 0 | pickaxe | |
| Nether Wart Block | `nether_wart_block` | 1.0 | 1.0 | 0 | hoe | |
| Warped Wart Block | `warped_wart_block` | 1.0 | 1.0 | 0 | hoe | |
| Shroomlight | `shroomlight` | 1.0 | 1.0 | 15 | any | |
| Crimson Stem / Hyphae (and stripped) | `crimson_stem` etc. | 2.0 | 2.0 | 0 | axe | Not flammable |
| Warped Stem / Hyphae (and stripped) | `warped_stem` etc. | 2.0 | 2.0 | 0 | axe | Not flammable |
| Crimson Planks / Slab / Stairs / Fence / etc. | various | 2.0 | 3.0 | 0 | axe | Not flammable |
| Warped Planks / etc. | various | 2.0 | 3.0 | 0 | axe | Not flammable |
| Crimson Fungus / Warped Fungus | `crimson_fungus`, `warped_fungus` | 0 | 0 | 0 | any | |
| Crimson Roots / Warped Roots | `crimson_roots`, `warped_roots` | 0 | 0 | 0 | any | |
| Nether Sprouts | `nether_sprouts` | 0 | 0 | 0 | any | |
| Weeping Vines (and plant) | `weeping_vines`, `weeping_vines_plant` | 0 | 0 | 0 | any | Grows down |
| Twisting Vines (and plant) | `twisting_vines`, `twisting_vines_plant` | 0 | 0 | 0 | any | Grows up |
| Soul Fire (block) | `soul_fire` | 0 | 0 | 10 | any | Blue fire; on soul sand/soil |
| Soul Torch / Soul Lantern / Soul Campfire | see Decoration | | | 10 | | |
| Respawn Anchor | `respawn_anchor` | 50 | 1200 | 0 (when charged) | diamond pickaxe | Glowstone charges (4) |

---

## 12. End Blocks

| Name | ID | Hard | Resist | Light | Tool | Notes |
|---|---|---|---|---|---|---|
| End Stone | `end_stone` | 3.0 | 9 | 0 | pickaxe ✓ | self; immune to ender dragon |
| End Stone Bricks | `end_stone_bricks` | 3.0 | 9 | 0 | pickaxe ✓ | |
| End Portal Frame | `end_portal_frame` | -1 | 3600000 | 1 | none | — | Holds eye of ender |
| End Portal (block) | `end_portal` | -1 | 3600000 | 15 | none | — | Teleports to end spawn |
| End Gateway (block) | `end_gateway` | -1 | 3600000 | 15 | none | — | Teleports |
| End Rod | `end_rod` | 0 | 0 | 14 | any | self; directional |
| Purpur Block | `purpur_block` | 1.5 | 6 | 0 | pickaxe ✓ | self |
| Purpur Pillar | `purpur_pillar` | 1.5 | 6 | 0 | pickaxe ✓ | Directional pillar |
| Purpur Slab / Stairs | various | 1.5 | 6 | 0 | pickaxe | |
| Chorus Plant | `chorus_plant` | 0.4 | 0.4 | 0 | any | Connects to chorus flower / end stone |
| Chorus Flower | `chorus_flower` | 0.4 | 0.4 | 0 | any | Grows chorus plant; 5 stages |
| Dragon Egg | `dragon_egg` | 3.0 | 9 | 0 | any | Falls (gravity), teleports on click |
| Bedrock | `bedrock` | -1 | 3600000 | 0 | none | End island base |
| Obsidian Platform | (uses obsidian) | 50 | 1200 | 0 | diamond pickaxe | Spawn platform |
| Blackstone (used in end cities? no — end cities use purpur/end stone) | — | — | — | — | — | |

---

## 13. Technical Blocks

These are blocks that exist in the game data but are not normally obtainable in survival.

| Name | ID | Hard | Notes |
|---|---|---|---|
| Air | `air` | 0 | Empty space marker |
| Cave Air | `cave_air` | 0 | Air in caves (different lighting behavior) |
| Void Air | `void_air` | 0 | Above world height |
| Barrier | `barrier` | -1 | Invisible, solid; visible when holding barrier |
| Light Block | `light` | -1 | Invisible light source (1-15); visible when holding |
| Structure Void | `structure_void` | 0 | Skipped by structure save/load |
| Structure Block | `structure_block` | -1 | Save/load mode |
| Jigsaw Block | `jigsaw` | -1 | Structure generation |
| Command Block (impulse/chain/repeat) | `command_block`, `chain_command_block`, `repeating_command_block` | -1 | Unbreakable |
| Repeating/Chain | see above | | |
| Piston Head (extended) | `piston_head` | 1.5 | Visual piston extension |
| Moving Piston | `moving_piston` | -1 | Transient block during motion |
| Wall (legacy) | — | — | All wall blocks now unified via block state |
| Infested Block (legacy variants) | `infested_*` | — | Now spawn silverfish on interact |
| Farmland Moisture | (block state) | — | `moisture` 0-7 |
| Snow Layers | `snow` | 0.1 | Layers 1-8 |
| Frosted Ice | `frosted_ice` | 0.5 | Frost Walker |
| Bubble Column | `bubble_column` | 0 | Push/pull entities; soul sand = up, magma = down |
| Portal block (nether/end/end_gateway) | see Transport | -1 | |
| Kelp Plant (only the topmost is `kelp`, rest are `kelp_plant`) | | | |
| Cave Vines Plant | `cave_vines_plant` | | Stem segments |
| Big Dripleaf Stem | `big_dripleaf_stem` | | |
| Twisting/Weeping Vines Plant | `*_plant` | | Stem segments |
| Attached Melon/Pumpkin Stem | `attached_melon_stem`, `attached_pumpkin_stem` | | Stem after producing fruit |
| Dead Coral / Dead Coral Fan / Dead Wall Coral Fan | `dead_*` | | Coral that died out of water |
| Potted plants | `potted_*` (60+ variants) | 0 | Flower pot + plant combined |

---

## 14. Block State Reference

Block states are stored as key-value pairs per block position. Common state keys and their values:

### 14.1 Orientation States

| State | Values | Used By |
|---|---|---|
| `facing` | `north south east west up down` | Dispenser, dropper, piston, observer, furnace, ladder, button, lever, end rod, lightning rod, glazed terracotta, jigsaw |
| `axis` | `x y z` | Logs, wood, basalt, chain, bone block, purpur pillar, quartz pillar, bamboo |
| `rotation` | 0–15 (22.5° each) | Signs, banners, standing |
| `half` | `top bottom` | Beds, doors, tall flowers, double chests |
| `shape` | multiple (e.g., `straight inner_left outer_left inner_right outer_right`) | Stairs |
| `shape` (rails) | `north_south east_west ascending_north ascending_south ascending_east ascending_west north_east north_west south_east south_west` | Rail, powered/detector/activator rails |
| `shape` (walls) | `none low tall` per side | All walls |
| `face` | `floor wall ceiling` | Button, lever, grindstone |
| `hinge` | `left right` | Door, fence gate |
| `orientation` (jigsaw) | `down_east down_west ... up_north up_south` | Jigsaw |
| `orientation` (crafter) | `down_east` etc. (full block) | Crafter |

### 14.2 Functional States

| State | Values | Used By |
|---|---|---|
| `powered` | `true false` | Button, pressure plate, lever, door, fence gate, repeater, lamp, dispenser, dropper, observer, note block, hopper, piston |
| `open` | `true false` | Door, trapdoor, fence gate |
| `lit` | `true false` | Furnace, blast furnace, smoker, redstone lamp, redstone torch, candle, end rod (always), jack o'lantern (always) |
| `extended` | `true false` | Piston |
| `triggered` | `true false` | Dispenser, dropper |
| `age` | 0-7 (crops), 0-3 (sugar cane? no — cactus/bamboo use height), 0-3 (nether wart, sweet berries, torchflower), 0-7 (saplings), 0-25 (kelp/cave vines height) | Crops, fire, saplings, bamboo, cactus, sugar cane, chorus flower (0-5), stems |
| `stage` | 0-1 | Saplings (only when bone-mealed to growing) |
| `moisture` | 0-7 | Farmland |
| `honey_level` | 0-5 | Bee nest / beehive |
| `hatch` | 0-2 | Turtle egg |
| `eggs` | 1-4 | Turtle egg |
| `bloom` | `true false` | Spore Blossom? No — chorus flower uses `age` |
| `charges` | 0-4 | Respawn anchor |
| `oxidation` (encoded as different blocks) | `none exposed weathered oxidized` | Copper family |
| `waxed` (encoded as different block IDs: `waxed_*`) | bool | Copper family |
| `level` | 0-15 | Water, lava fluid levels |
| `layers` | 1-8 | Snow |
| `candles` | 1-4 | Candle |
| `berries` | `true false` | Cave vines |
| `flower_amount` | 1-4 | Pink petals |
| `block_light` | 0-15 | Light block |
| `waterlogged` | `true false` | Many transparent/shape blocks: stairs, slabs, fences, walls, signs, rails, doors, trapdoors, levers, buttons, ladders, redstone wire, repeaters, comparators, coral fans, sea pickles, kelp, seagrass, etc. |

### 14.3 Plant States

| State | Values | Used By |
|---|---|---|
| `age` | 0-7 (wheat, carrots, potatoes, melon/pumpkin stem), 0-3 (beetroot, nether wart, sweet berries, torchflower), 0-5 (chorus flower), 0-15 (fire), 0-25 (cave vines length) | Many |
| `stage` | 0-1 | Bamboo leaves stage |
| `leaves` | `none small large` | Bamboo |
| `leaf_age` / `persistent` / `distance` | `distance` 1-7, `persistent` bool | Leaves (decay) |
| `hanging` | `true false` | Weeping/twisting vines, lantern |
| `tip` | `true false` | Pointed dripstone |
| `thickness` | `tip_merge tip frustum middle base` | Pointed dripstone |
| `tilt` | `none unstable partial full` | Big dripleaf |

### 14.4 Redstone-Specific States

| State | Used By |
|---|---|
| `north south east west` (`side up none`) | Redstone wire connections |
| `power` | 0-15 (redstone wire, weighted pressure plate) |
| `delay` | 1-4 (repeater) |
| `mode` | `compare subtract` (comparator); `save load corner data` (structure block) |
| `locked` | bool (repeater, comparator when side-powered) |
| `conditional` | bool (command block) |
| `automated` | bool (crafter slot disabled) |

### 14.5 Note Block & Instrument

Note blocks use a single `note` property 0-24 (F#3 to F#5). The instrument is determined by the block below the note block at the time of play (not a state). Map:

| Block Below | Instrument |
|---|---|
| Wood planks/logs | Bass (string bass) |
| Sand / sandstone / concrete powder | Snare drum |
| Glass / sea lantern | Hat (sticks) |
| Stone / blackstone / basalt / obsidian | Bass drum |
| Gold block | Bell |
| Clay | Flute |
| Packed ice | Chime |
| Bone block | Xylophone |
| Iron block | Iron xylophone (vibraphone) |
| Soul sand | Cow bell |
| Pumpkin | Didgeridoo |
| Emerald block | Bit (square wave) |
| Hay block | Banjo |
| Glowstone | Pling (electric piano) |
| Wool | Guitar (1.21+) |
| Any head (skeleton/zombie/creeper/player/wither/piglin/dragon) | Head sound (mob-voice) |
| Default (other) | Harp |

---

## 15. Block Model Format Reference

Vanilla Minecraft block models are JSON files in `assets/<namespace>/models/block/`. They follow a specific schema. A clone should reproduce this.

### 15.1 Model JSON Structure

```json
{
  "parent": "minecraft:block/cube",
  "textures": {
    "particle": "minecraft:block/stone",
    "down":  "minecraft:block/stone",
    "up":    "minecraft:block/stone",
    "north": "minecraft:block/stone",
    "south": "minecraft:block/stone",
    "east":  "minecraft:block/stone",
    "west":  "minecraft:block/stone"
  }
}
```

### 15.2 Parent Models (vanilla library)

| Parent | Description |
|---|---|
| `block/block` | Root; defines display transforms |
| `block/cube` | Full 6-sided cube with `down/up/north/south/east/west` textures |
| `block/cube_all` | All 6 sides same texture (`all`) |
| `block/cube_column` | Sides `side`, top/bottom `end` |
| `block/cube_column_horizontal` | Same but horizontal axis (logs) |
| `block/cube_directional` | 4-sided directional |
| `block/cube_bottom_top` | Top `top`, bottom `bottom`, sides `side` |
| `block/cube_mirrored_all` | |
| `block/cross` | Two crossed planes (flowers, saplings, crops) |
| `block/tinted_cross` | Cross with biome tint (grass, vines) |
| `block/crop` | Crop-style 4-stage cross |
| `block/thin_block` | Pressure plate, snow layer |
| `block/carpet` | Flat carpet shape |
| `block/slab` | Slab bottom; `block/slab_top` for top |
| `block/stairs` | Stairs; uses `straight, inner_left, inner_right, outer_left, outer_right` |
| `block/fence_side` / `block/fence_post` / `block/fence_inventory` | Fence |
| `block/wall_side` / `block/wall_post` / `block/wall_inventory` / `block/wall_side_tall` | Wall |
| `block/door_bottom` / `door_bottom_rh` / `door_top` / `door_top_rh` | Door |
| `block/trapdoor_bottom` / `trapdoor_top` / `trapdoor_open` | Trapdoor |
| `block/lever` / `button` / `button_pressed` / `button_inventory` | |
| `block/torch` / `wall_torch` | |
| `block/rail_flat` / `rail_raised_ne` etc. | Rails |
| `block/template_glazed_terracotta` | Directional pattern |
| `block/template_daylight_detector` | |
| `block/template_farmland` | |
| `block/template_fence_gate` / `open` / `wall` | |
| `block/template_glass_pane_noside` etc. | Glass pane connections |
| `block/template_single_face` | Single face (e.g., lily pad) |
| `block/template_orientable_trapdoor_bottom` | |
| `block/template_chorus_flower` | |
| `block/template_command_block` | |
| `block/template_cake_slice` (1-6) | Cake |
| `block/template_hopper` | |
| `block/template_piston` / `piston_head` / `piston_head_short` | |
| `block/template_custom_fence_*` (nether brick) | |

### 15.3 Elements (custom shapes)

A model may define `elements` (list of cubes). Each element:

```json
{
  "from": [0, 0, 0],
  "to": [16, 16, 16],
  "faces": {
    "down":  {"texture": "#down",  "cullface": "down",  "uv": [0,0,16,16]},
    "up":    {"texture": "#up",    "cullface": "up"},
    "north": {"texture": "#north", "cullface": "north"}
  },
  "rotation": {"origin": [8,8,8], "axis": "y", "angle": 0},
  "shade": true
}
```

- Coordinates are in pixels 0–16 (a block is 16³ voxels).
- `cullface`: tells the renderer not to draw this face if neighbor block has a full opaque face on that side. Critical for performance.
- `uv`: 4-element `[u0,v0,u1,v1]` in texture pixels (0–16). May include `uvlock` to prevent UV rotation when block rotated.
- `rotation`: per-element rotation around an axis by `angle` (must be one of -45/-22.5/0/22.5/45).
- `shade`: whether the face receives directional shading.

### 15.4 Blockstate JSON (`assets/<ns>/blockstates/<name>.json`)

Maps a block's state combination to one or more models. There are two variants: `variants` (single state combo → single model) and `multipart` (apply models when conditions match, like fences).

Variants example:
```json
{
  "variants": {
    "axis=y":      {"model": "minecraft:block/oak_log"},
    "axis=z":      {"model": "minecraft:block/oak_log_horizontal", "x": 90},
    "axis=x":      {"model": "minecraft:block/oak_log_horizontal", "x": 90, "y": 90}
  }
}
```

Multipart example (fence):
```json
{
  "multipart": [
    { "when": { "OR": [{"north": "true"},{"east": "true"},{"south": "true"},{"west": "true"}]},
      "apply": { "model": "minecraft:block/oak_fence_post" }},
    { "when": { "north": "true" },
      "apply": { "model": "minecraft:block/oak_fence_side", "uvlock": true }},
    { "when": { "east":  "true" },
      "apply": { "model": "minecraft:block/oak_fence_side", "y": 90, "uvlock": true }}
  ]
}
```

Transform keys `x`, `y`, `z` rotate the model in degrees (multiples of 90). `uvlock: true` keeps texture UVs from rotating with the model.

### 15.5 Tinting

Some blocks use grayscale textures tinted by biome color or hard-coded:

| Texture Key | Tint Source |
|---|---|
| `tintindex: 0` | Grass/foliage color (biome-dependent, computed from temperature/humidity or hardcoded) |
| `tintindex: 1` | Overlay (e.g., birch/spruce leaves specific) |
| `tintindex: 2` | (rare; spruce has fixed color) |
| `tintindex: -1` | No tint (default) |
| `tintindex: 0` on redstone wire | Power-level color (red gradient) |
| `tintindex: 0` on water (cauldron) | Water blue tint |
| `tintindex: 0` on potions / etc. | Custom color |

Birch leaves = hardcoded `#80a755`. Spruce leaves = `#619961`. Mangrove = `#5a2112`. Azalea = `#769e6b`. Other leaves use biome grass color. Pale oak leaves are tintless grey-green `#9ca39a`-ish.

---

## 16. Special Block Behaviors

A non-exhaustive catalog of non-obvious block mechanics an engine must reproduce. Failing these will make the clone feel wrong even if visuals match.

### 16.1 Gravity / Falling Blocks

Affected: `sand`, `red_sand`, `gravel`, `anvil` (and chipped/damaged), `dragon_egg`, `concrete_powder` (16 colors), `scaffolding` (conditionally, falls below Y=10 below support), `pointed_dripstone` (falls if unsupported), `snow` layer block? No (snow doesn't fall). When falling, block becomes a `FallingBlockEntity` and lands as block; concrete powder solidifies on water contact mid-fall.

### 16.2 Farmland Hydration

`farmland` has `moisture` 0–7. Hydrated if within 4 blocks (Chebyshev) horizontally and at any Y ±1 of water. Each random tick, moisture +1 if water nearby, else -1. Jumps/falling on farmland reverts to dirt (except lightweight mobs like rabbits). Crops grow faster on hydrated farmland (random tick growth chance × 2-3 depending on moisture).

### 16.3 Scaffolding

`ScaffoldingBlock` has a stability value 0-7. Placed scaffolding can extend 6 blocks horizontally from a "support" (any solid full block side). Beyond 6, it collapses when no block below. Scaffolding can be placed 6 out and another on top with new count. Players can climb by walking into it. Bottom of scaffolding without support renders differently.

### 16.4 Waterlogging

Since 1.13, blocks with `BlockState` property `waterlogged=true` can be placed inside water sources without breaking them. Waterlogged blocks render water inside their voxel shape. Flows and source-block rules treat them as fluid-bearing. Examples: stairs, slabs, fences, walls, signs, levers, buttons, ladders, rails, redstone dust, repeaters, comparators, doors, trapdoors, coral fans, sea pickles, kelp, seagrass, light blocks (no), chains, iron bars, glass panes.

### 16.5 Light Blockage & `useShapeForLightOcclusion`

- Full opaque cubes block light completely.
- Blocks with non-cuboid shapes (stairs, slabs, walls, fences) compute light occlusion from their voxel shape (`useShapeForLightOcclusion=true`). Light passing diagonally through is reduced.
- Transparent blocks (glass, leaves) let light pass but glass blocks redstone conduction (not a conductor); leaves block redstone conduction.
- `light` block emits configurable light and is itself invisible/non-occluding.

### 16.6 Piston Push Rules

- `pushReaction`: `NORMAL` (most blocks), `DESTROY` (e.g., torches, flowers, rails drop as items when pushed), `BLOCK` (bedrock, obsidian, spawners, command blocks, end portal frames, anvils, structure blocks, jigsaw, barriers, reinforced deepslate), `PUSH_ONLY` (piston head can be pushed but not pulled).
- Sticky piston pulls back only one block on contraction.
- Slime block and honey block stick to other blocks. Slime block sticks to *most* blocks (not glazed terracotta, not obsidian, not bedrock, not honey's excluded list, etc.). Honey block doesn't stick to slime and vice versa (they're mutually non-adhesive).
- A slime-honey chain can be pushed/pulled as one unit, up to 12 blocks total.

### 16.7 Skulk Family

- **Sculk Sensor**: Listens to vibrations (player footsteps, block placement, projectiles, etc.) within 8 blocks. Emits a redstone pulse proportional to signal strength. Wool blocks vibrations.
- **Sculk Catalyst**: Spreads sculk when a mob dies nearby, dropping XP. The dying mob's XP value drives sculk block growth.
- **Sculk Shrieker**: Triggers from sculk sensor signal, emits shriek sound, may summon warden if activated enough times.
- **Sculk Vein**: Carpet-like growth on blocks; grows on random tick.
- All sculk blocks give XP when mined (without silk touch).

### 16.8 Copper Oxidation

Copper (block, stairs, slab, door, trapdoor, grate, bulb, chiseled) goes through oxidation stages: `unaffected → exposed → weathered → oxidized`. Random ticks advance; low probability per tick. Adjacent copper blocks "share" oxidation state — they only advance if all 4 horizontal neighbors are at the same stage or one less. Lightning strikes reset to unaffected. Honeycomb waxing (right-click) freezes state and makes a `waxed_*` variant immune to oxidation. Axe right-click: unwaxes OR deoxidizes by one stage.

### 16.9 TNT & Explosions

- TNT ignites from: redstone power, fire, lava contact, flaming projectile,Dispenser using flint and steel on it.
- TNT fuse is 80 ticks (4 sec) after which it explodes. TNT ignited by being hit by flaming arrow has same fuse.
- Explosions have power: TNT=4, creeper=3 (charged=6), end crystal=6, bed (nether)=5, ghast fireball=1, wither skull=1, wither spawn=7, ender dragon=fireball-ish.
- Explosions destroy blocks in a sphere (power × 2 × random reduction), with `blastResistance` checked. Drops 30% normally (100% with `mobGriefing` flag and creeper leaves drops? no — drops are always subject to explosion drop chance).

### 16.10 Bamboo

- Grows on dirt/sand/mud/grass/mycelium/podzol/coarse_dirt/rooted_dirt/moss.
- Stops at height 12-16 (random; biome-independent). Bone meal can grow bamboo past normal cap with chance.
- Bamboo is harvested quickly with a sword.
- Bamboo leaves change shape with `leaves` state (`none`, `small`, `large`) based on position in the stalk.

### 16.11 Cactus

- Grows on sand/red sand. Cannot have any block adjacent on the 4 horizontal sides at the same Y level (would break the cactus).
- Damages any entity touching it (1 dmg/0.5s).
- Grows up to 3 high; bone meal adds height.

### 16.12 Sugar Cane

- Grows on dirt/sand/mud adjacent to water (max 1 block away, any Y).
- Grows up to 3 high. Bone meal on it can force it higher (in Java, sugar cane doesn't grow naturally past 3).

### 16.13 Sugar Cane / Bamboo / Cactus heights

| Plant | Natural Max | With Bone Meal |
|---|---|---|
| Sugar cane | 3 | Can exceed with bone meal |
| Cactus | 3 | Can exceed |
| Bamboo | 12-16 | Can exceed slightly |
| Kelp | 26 (max age) | Random tick growth only |

### 16.14 Seagrass / Coral Water Requirements

- Coral blocks die (turn to dead coral) when not adjacent to water.
- Coral fans and coral plants also die similarly.
- Coral fans can be placed on the side of blocks underwater (wall fan) or on the floor.

### 16.15 Campfire / Soul Campfire

- Emits smoke (normal: gray; soul: blue-gray).
- Smoke travels up 24 blocks; can be stopped by hay bale (smoke travels 24 blocks? Actually hay bale makes smoke go higher).
- Cooks food items dropped on top of campfire (4 items at a time, 30 seconds each).
- Extinguished by water or shovel right-click. Re-light by flint & steel.
- Trampling by walking over doesn't damage; placing on top damages the entity that walks over a lit campfire? Yes — campfire damages entities standing on it (1 dmg/0.5s), unless sneaking.

### 16.16 Note Block Powering & Instrument

Covered in §14.5. Key behavior: note block emits a redstone pulse (15) for 1 redstone tick when powered; the actual sound plays on the rising edge.

### 16.17 Lightning Rod

- Attracts lightning within 128 blocks (Java).
- Emits redstone signal when struck (15 for 8 game ticks).
- Oxidizes like copper (waxable, axe-cleanable).

### 16.18 Dragon Egg

- One per world, on the exit portal of end.
- Falls like sand (gravity).
- Teleports to a random adjacent location when clicked by a player (this prevents easy collection without pistons or other tricks).
- Cannot normally be mined (drops nothing; can be obtained by pistons).

### 16.19 Frosted Ice (Frost Walker)

- Created by Frost Walker enchantment when player walks over water.
- `age` 0-3. Increases randomly; melts when light level > 11 or after enough age.
- Multiple frosted ice blocks have their age checked together to avoid all melting at once.

### 16.20 Bubble Columns

- Created by soul sand (pushes entities up) or magma block (pulls entities down) underwater.
- Bubble columns extend from the source block up to the surface or to 8+ blocks.
- Items/mobs/entities affected — strong upward force can launch you into the air.

### 16.21 Crying Obsidian

- Same mining properties as obsidian but emits light 10 and drops purple particle "tears".
- Cannot be used for nether portal frames.

### 16.22 Bee Nest / Beehive

- Holds up to 3 bees.
- `honey_level` 0-5; increases as bees return with pollen (each bee adds 1, capped at 5).
- At honey_level 5, can be harvested with shears (3 honeycomb) or glass bottles (3 honey bottles).
- Angers bees if harvested without campfire smoke below.

### 16.23 Respawn Anchor

- Charges with glowstone (4 max); each charge = 1 respawn.
- Explodes in Overworld/End (like beds).
- Used only in the Nether.

### 16.24 Beds

- 16 colors; two-block long.
- Explode when used in the Nether or End.
- Sets spawn point of the player who used it (last-slept bed).
- Bounce block (reduces fall damage by 50%).

### 16.25 Honey Block & Slime Block

| Property | Honey | Slime |
|---|---|---|
| Bounce | No | Yes (50% bounce) |
| Fall damage reduction | Yes (80%) | No |
| Slows walking | Yes (slow) | No |
| Entities stick to side | Yes | No |
| Sticks to adjacent with piston | Yes | Yes |
| Sticks to honey? | Yes | No |
| Sticks to slime? | No | Yes |

### 16.26 Snow Layers

- Stackable 1-8 layers per block space.
- Each layer = 1/8 of a block in height (1 layer = 2 pixels tall? Actually 1 layer = 2px out of 16).
- Drops 1 snowball per layer.
- 3 layers reduces fall damage; entities can walk up single-layer snow without jumping.

### 16.27 Powder Snow

- Entities sink and freeze (taking damage over time).
- Leather boots/armor mitigate freezing.
- Collected in bucket.
- Cannot be mined normally — must be collected with a bucket.
- Skeletons trapped inside become stray skeletons? No, that's a different mechanic. Actually, skeletons in powder snow for 7+ seconds turn into strays (Bedrock-only behavior; Java doesn't do this).

### 16.28 Composter

- Takes plant matter as input (chance per item to add 1 to compost level 0-7).
- At level 7, bone meal drops when used again.
- Different items have different compost chances (e.g., seeds = 30%, bread = 85%, cake = 100%).

### 16.29 Lectern

- Holds a written book (or writable book) for reading.
- Multiple players can read at once.
- Outputs redstone signal based on current page number (page / total_pages × 15).

### 16.30 Beacon

- Emits beam toward sky (through transparent blocks only; beams pass through bedrock).
- Powers players within range with selected effect (speed/haste/resistance/jump/strdmg/regen).
- Requires pyramid of mineral blocks (iron/gold/diamond/emerald/netherite) below.
- Beam color tinted by stained glass blocks above.

### 16.31 Conduit

- Provides Conduit Power (water breathing + haste underwater) to nearby players in water/rain.
- Power range scales with frame size (16 frame blocks = full 96-block range).
- Frame: prismarine, dark prismarine, sea lantern, prismarine bricks arranged in a specific 5x5 open-cube shape around the conduit.

### 16.32 Mob Spawners

- Holds an entity type (silk touch doesn't preserve type in Java).
- Spawns mobs in a 4-block radius around itself.
- Player must be within 16 blocks for activation.
- Spawner has spinning entity inside; min/max spawn delay configurable.
- Minecart spawner exists as a separate entity.

### 16.33 Trial Spawner & Vault (1.21)

- Trial Spawner: Tied to a specific mob; spawns mobs in waves; becomes "ominous" if player with bad omen triggers it; after a cooldown, drops keys.
- Vault: Lockable loot container; requires a trial key to open; player-bound (each player opens once).
- Both are unbreakable in survival (resistance 1200; effectively bedrock-like for explosions but breakable in creative).

### 16.34 Crafter (1.21)

- 3x3 grid UI; slots can be toggled (right-click empty slot to disable).
- When powered by redstone, attempts to craft using current grid state.
- Ejects result toward facing direction (or to hopper).
- Slot-disabled state stored as a 9-bit pattern in block state.

### 16.35 Decorated Pot (1.20+)

- Crafted from 4 pottery sherds (or bricks for default texture).
- Each side shows a sherds's pattern.
- Holds a single stackable item type (default 1, can be increased by items).
- Breaks when destroyed, dropping sherds back.
- Hopper-friendly.

### 16.36 Suspicious Sand / Suspicious Gravel

- Contains buried loot (brush reveals items).
- Drops nothing if broken normally (drops as regular sand/gravel only via silk touch — and even then, loot is not preserved).
- Falls like sand.
- Found in desert temples, desert wells, ocean ruins, trail ruins.

### 16.37 Calibrated Sculk Sensor

- Directional (faces away from player on placement).
- Filters vibrations by frequency: emits signal when vibration frequency matches redstone input on the back face.
- Frequencies 1-15 mapped to vibration types (footstep, projectile, block place, etc.).

### 16.38 Pink Petals

- 1-4 petals per block space (stackable).
- Each petal = 1/4 of the block.
- Directional (`facing` 0-3).
- Found in cherry groves.

### 16.39 Decorative Pot Stack Behavior

Not applicable to blocks. See Decorated Pot.

### 16.40 Special Falling-Block Items

When broken and dropped as items, certain blocks render their items differently from the placed block (e.g., door renders as a tall door model in placed state but as a single door item; cake slices show varied; beds as a single-tall in inventory).

### 16.41 Wither Skeleton Skull & Wither

- Wither skeleton skull (3 of them) on soul sand or soul soil in T-shape summons the wither.
- Other skulls (zombie, skeleton, creeper, player, piglin, dragon) cannot summon wither.

### 16.42 Iron Golem / Snow Golem / Wither Build Patterns

- Iron Golem: 4 iron blocks T-shape with carved pumpkin/jack-o-lantern on top.
- Snow Golem: 2 snow blocks vertical with carved pumpkin on top.
- Wither: 4 soul sand/soul soil in T-shape + 3 wither skeleton skulls on top horizontal.

### 16.43 Bee Pollination & Crop Growth

Bees that have pollinated (visited flowers) returning to hive increase nearby crop growth stage by 1 (similar to bonemeal) on their way back.

### 16.44 Turtle Egg

- Laid on sand by turtles.
- Hatches over time (3 stages: 0, 1, 2).
- Stepping on it by player/mob breaks it.
- Only hatches at night.

### 16.45 Froglight

- Frog eats small slime/magma cube → produces froglight of corresponding color.
- 3 frog variants (warm/temperate/cold) → 3 froglight colors.

### 16.46 Dripstone & Lava/Water Drips

- Pointed dripstone can transfer fluids: water dripping through a stalactite fills cauldrons below; lava drips lava into cauldrons.
- Dripstone cluster grows downward (stalactite) and upward (stalagmite) over time when above a water source with no ceiling.
- Falling stalactites deal damage proportional to height.

### 16.47 Coral Fans & Wall Coral Fans

- Coral fans placed on top of a block = `coral_fan` (with `waterlogged`).
- Coral fans placed on a side = `coral_wall_fan` (with `facing` and `waterlogged`).
- Different block IDs but mechanically equivalent.

### 16.48 Chorus Plant Growth

- Chorus flower grows a chorus tree on end stone.
- 5 growth stages; at age 5, no longer grows.
- Each random tick, may grow upward, sideways, or branch.
- Tree shape is irregular; specific growth rules.

### 16.49 Mangrove Roots & Muddy Mangrove Roots

- Mangrove roots: transparent, waterloggable; entities can walk through (no collision).
- Muddy mangrove roots: solid full cube; mud-adjacent.

### 16.50 Big Dripleaf Tilting

- Tilts (`tilt=unstable` → `partial` → `full`) when an entity stands on it.
- While tilted `full`, entities fall through.
- Resets to `none` after 100 ticks if no entity present.
- Powered by redstone forces `tilt=full` permanently.

### 16.51 Sweet Berry Bush Damage

- Age 0: 0 damage.
- Age 1+: 1 damage per tick when entity moves through.
- Foxes are immune.

### 16.52 Powder Snow Bucket vs Powder Snow Block

- Powder snow is the block.
- Powder snow bucket holds the fluid-equivalent.
- Cannot place a powder snow block directly from the bucket into non-snow areas without source — actually you can place it from the bucket, and the placed block is identical to natural powder snow.

### 16.53 Ender Chest

- 27-slot shared inventory across dimensions, per-player.
- Silk-touch pickaxe required to keep; otherwise drops 8 obsidian.
- Affected by the `enderchest` flag in gamerules.

### 16.54 Anvil Fall Damage

- Anvil falling deals damage proportional to fall distance (capped).
- Three damaged variants (anvil, chipped, damaged) — each fall has 5% chance to damage (12% in Bedrock).

### 16.55 Bamboo & Scaffolding Interactions

- Scaffolding can be placed on top of itself for 6 blocks outward horizontally from any solid support.
- Bamboo breaks instantly with a sword (faster than with an axe).

### 16.56 Barrier & Light Block Visibility

- Barriers show their particles only when the player is holding a barrier.
- Light blocks show their texture (light bulb) only when holding a light block.

### 16.57 Conduit Frame

- Must be exactly 16-42 frame blocks of prismarine/dark_prismarine/prismarine_bricks/sea_lantern in a 5×5×5 cube with center hollow and conduit in the middle.
- Water must touch the conduit on all sides.
- Activates conduit power.

### 16.58 Tinted Glass

- Blocks light completely (15 → 0).
- Mobs cannot see through it for spawning purposes (transparent but light-blocking).
- Drops itself only with silk touch.

### 16.59 Notes on Identical Behaviors

- All 16 colors of wool/carpet/concrete/concrete_powder/terracotta/glazed_terracotta/stained_glass/glass_pane/banner/shulker_box/bed/candle share the same hardness/resistance/tool properties. They differ only in color.
- All wood variants within a species share the same hardness (2.0 for planks/logs/fences etc.). Crimson and warped wood is **not** flammable.

### 16.60 Block Updates & BUD

- Block updates trigger on: block placement/break, piston extension/retraction, observer facing block changes, redstone power changes, fluid flow changes.
- Block updates propagate to the 6 face-adjacent blocks.
- Block updates can be detected by observers (2-tick pulse) — this enables "BUD" (block update detector) circuits.
- Block updates do NOT detect crop growth, leaf decay, or oxidation stage changes (these are random tick events, not block updates). Observers DO detect oxidation stage changes (1.20+), crop growth (yes — observer updates on crop growth in 1.20+), and copper age changes.

---

## Appendix A: Block Count Reference

As of Minecraft Java 1.21.4:

| Category | Approx Count |
|---|---|
| Total unique block IDs | ~1200 |
| Total unique block state combinations | ~16,000 |
| Air variants | 3 |
| Fluid blocks | 2 (+ flowing variants internally) |
| Plant blocks | ~150 (incl. coral, crops, leaves) |
| Building/decoration | ~500 |
| Functional/utility | ~80 |
| Redstone | ~40 |
| Technical (non-survival) | ~20 |
| Species-variant families (16-color) | ~12 families × 16 = ~190 |

The block count grows ~20-60 per major version.

---

## Appendix B: Hardness Reference Table (Quick Lookup)

| Hardness | Mining Time (correct tool) | Examples |
|---|---|---|
| -1.0 | Infinite (unbreakable) | Bedrock, barrier, command block, structure block, jigsaw, end portal frame |
| 0 | Instant | Torch, redstone dust, lever, button, grass, flower, mushroom, rails |
| 0.1 | ~0.15s | Carpet, moss carpet, pink petals |
| 0.2 | ~0.3s | Leaves, snow layer, vines, glow lichen, sugar cane |
| 0.3 | ~0.45s | Glass, glowstone, sea lantern, bee nest |
| 0.5 | ~0.75s | Dirt, sand, gravel, soul sand, ice, magma, cactus, sandstone, wool |
| 0.6 | ~0.9s | Grass block, clay, mycelium, mud, snow block, beehive |
| 0.75 | ~1.1s | Infested stone, calcite |
| 0.8 | ~1.2s | Sandstone, quartz block, note block, crafting-related wood blocks (2.5 actually) |
| 1.0 | ~1.5s | Jack o'lantern, pumpkin, jack-o-lantern |
| 1.25 | ~1.9s | Basalt, terracotta |
| 1.5 | ~2.25s | Stone, ores, planks, nether bricks, stone bricks, sandstone stairs |
| 2.0 | ~3s | Cobblestone, obsidian? no (50), stone bricks, planks, fence, log |
| 2.5 | ~3.75s | Crafting table, chest, barrel, wooden tools |
| 3.0 | ~4.5s | Iron block, copper block, dispenser, dropper, furnace |
| 3.5 | ~5.25s | Stone-related ore (deepslate), brewing stand |
| 4.5 | ~6.75s | Deepslate ores |
| 5.0 | ~7.5s | Iron block, diamond block, emerald block, redstone block, beacon |
| 30 | ~45s | Ancient debris |
| 50 | ~75s | Obsidian, crying obsidian, netherite block, respawn anchor |
| 100 | Hard | Water, lava (fluid — instant via bucket/sponge) |
| 3600000 | Explosion-proof only | Bedrock, end portal frame, end portal block, end gateway, reinforced deepslate |

---

## Appendix C: Common Block Behavior Patterns for the Engine

When implementing a Minecraft clone, the following are the most common patterns to support:

1. **Block registration**: each block has a ResourceLocation ID, a `BlockBehaviour.Properties` (hardness, resistance, sound, etc.), and a `BlockState` definition listing all valid state combinations.
2. **Block state enumeration**: each block declares its states up front; the engine enumerates all valid combinations and assigns each a unique ID for storage.
3. **Light propagation**: flood-fill from light sources; opaque cubes block light; partial-shape blocks reduce by computed amount; skylight (15) propagates down through transparent blocks; block light decays by 1 per block.
4. **Random ticks**: engine picks N random block positions per chunk section per tick (default `randomTickSpeed=3`). Blocks with `randomTicks=true` receive callbacks (crops grow, copper oxidizes, leaves decay, saplings grow).
5. **Scheduled ticks**: blocks can schedule a future tick (e.g., fluid flow, redstone update, leaf decay delay, repeater delay, piston extension completion).
6. **Block updates**: triggered on place/break/redstone change/piston; propagate to neighbors; observers detect them.
7. **Neighbor shape resolution**: when a block is placed/removed, neighbors update their shape (fences, walls, glass panes, redstone wire, stairs inner-outer corners).
8. **Collision shapes**: each block returns a voxel shape for collision, selection, and (optionally) light occlusion. Different blocks may use different shapes for collision vs. selection.
9. **Drops**: each block has a loot table JSON (`data/<ns>/loot_tables/blocks/<name>.json`) defining drops with conditions (tool tier, silk touch, fortune).
10. **Tags**: blocks belong to tags (`#minecraft:logs`, `#minecraft:planks`, `#minecraft:mineable/pickaxe`, etc.) used by mining speed, flammability, piston behavior, and others.

---

End of file. For full block lists in machine-readable form, see the official Minecraft wiki block list or the report files generated by Minecraft's `/execute` data commands.
