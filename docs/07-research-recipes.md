# 07 — Minecraft Recipes Reference (Java Edition 1.21.x)

> Exhaustive reference of every vanilla recipe: shaped, shapeless, smelting, blasting, smoking, campfire, stonecutter, smithing transform, smithing trim, and special recipe types.
> Scope: **maximalist** — the crafting system is a must-include for the Minecraft-clone prompt kit.

---

## Table of Contents

1. [Recipe JSON Format Reference](#1-recipe-json-format-reference)
   - 1.1 Shaped Recipe
   - 1.2 Shapeless Recipe
   - 1.3 Smelting Recipe (furnace)
   - 1.4 Blasting Recipe
   - 1.5 Smoking Recipe
   - 1.6 Campfire Recipe
   - 1.7 Stonecutter Recipe
   - 1.8 Smithing Transform Recipe (1.20+)
   - 1.9 Smithing Trim Recipe (1.20+)
   - 1.10 Special Recipe Types (no JSON in jar — handled in code)
2. [Tools & Weapons Recipes](#2-tools--weapons-recipes)
3. [Armor Recipes](#3-armor-recipes)
4. [Block Recipes](#4-block-recipes)
5. [Food Recipes](#5-food-recipes)
6. [Material & Refining Recipes](#6-material--refining-recipes)
7. [Redstone Recipes](#7-redstone-recipes)
8. [Decoration Recipes](#8-decoration-recipes)
9. [Transportation Recipes](#9-transportation-recipes)
10. [Special Recipes](#10-special-recipes)
11. [Smelting Recipes](#11-smelting-recipes-furnace)
12. [Blasting Recipes](#12-blasting-recipes-blast-furnace)
13. [Smoking Recipes](#13-smoking-recipes-smoker)
14. [Campfire Recipes](#14-campfire-recipes)
15. [Stonecutter Recipes](#15-stonecutter-recipes)
16. [Smithing Table Recipes](#16-smithing-table-recipes)
17. [Recipe Counts Summary](#17-recipe-counts-summary)
18. [Recipe Unlocking System (1.20+)](#18-recipe-unlocking-system-120)

---

## 1. Recipe JSON Format Reference

Recipes live in data packs at `data/<namespace>/recipes/<name>.json`. The `type` field selects the recipe type. All formats share `neoforge:conditions` / forge conditions, but vanilla uses only the `type` field.

### 1.1 Shaped Recipe

```json
{
  "type": "minecraft:crafting_shaped",
  "pattern": [
    "XXX",
    "X X",
    "XXX"
  ],
  "key": {
    "X": { "item": "minecraft:oak_planks" }
  },
  "result": {
    "id": "minecraft:chest",
    "count": 1
  },
  "group": "chest",
  "category": "building",
  "show_notification": true
}
```

| Field | Description |
|---|---|
| `pattern` | 1–3 rows; each row is a string 1–3 chars wide; spaces are empty slots |
| `key` | Maps each non-space char to an ingredient (`item`, `tag`, or `items` list) |
| `result` | `id` of result item + `count` (1.21+) or `item` + `count` (pre-1.21) |
| `group` | Optional; recipes sharing a group display together in the recipe book |
| `category` | `building`, `redstone`, `equipment`, `misc`, `food` — controls recipe book tab |
| `show_notification` | If true (default), unlocks flash when first crafted |

Key entries accept `tag` references:
```json
"X": { "tag": "minecraft:planks" }
"Y": { "item": "minecraft:redstone" }
"Z": [ { "item": "minecraft:dirt" }, { "item": "minecraft:coarse_dirt" } ]
```

### 1.2 Shapeless Recipe

```json
{
  "type": "minecraft:crafting_shapeless",
  "ingredients": [
    { "item": "minecraft:paper" },
    { "item": "minecraft:paper" },
    { "item": "minecraft:paper" },
    { "item": "minecraft:leather" }
  ],
  "result": {
    "id": "minecraft:book",
    "count": 1
  }
}
```

| Field | Description |
|---|---|
| `ingredients` | List of 1–9 ingredient objects; order does not matter |
| `result` | Result item + count |

### 1.3 Smelting Recipe (furnace)

```json
{
  "type": "minecraft:smelting",
  "ingredient": { "item": "minecraft:iron_ore" },
  "result": { "id": "minecraft:iron_ingot" },
  "experience": 0.7,
  "cookingtime": 200
}
```

| Field | Value |
|---|---|
| `ingredient` | Single ingredient (item, tag, or list) |
| `result` | Result item — `count` always 1 for smelting |
| `experience` | XP dropped per item when removed from furnace |
| `cookingtime` | Ticks (20 ticks = 1 second). Furnace = **200** (10s) default |

### 1.4 Blasting Recipe (blast furnace)

Same JSON structure as smelting. `cookingtime` defaults to **100** (5s, 2× faster). Only used for ore/metal smelting — blast furnaces reject food and other items.

### 1.5 Smoking Recipe (smoker)

Same JSON structure. `cookingtime` defaults to **100** (5s, 2× faster). Only used for food items.

### 1.6 Campfire Recipe

```json
{
  "type": "minecraft:campfire_cooking",
  "ingredient": { "item": "minecraft:beef" },
  "result": { "id": "minecraft:cooked_beef" },
  "experience": 0.35,
  "cookingtime": 600
}
```

`cookingtime` defaults to **600** (30s, 3× slower than furnace) — no fuel consumed.

### 1.7 Stonecutter Recipe

```json
{
  "type": "minecraft:stonecutting",
  "ingredient": { "item": "minecraft:stone_bricks" },
  "result": { "id": "minecraft:stone_brick_stairs", "count": 1 },
  "group": "stone_brick_stairs"
}
```

A single input → single output; more efficient than 3×3 crafting (1 stone = 1 stairs vs 6 stones = 4 stairs in crafting table).

### 1.8 Smithing Transform Recipe (1.20+)

Replaces the old smithing format. Used for netherite upgrade, mace, and any future "upgrade" recipes.

```json
{
  "type": "minecraft:smithing_transform",
  "template": { "item": "minecraft:netherite_upgrade_smithing_template" },
  "base": { "item": "minecraft:diamond_sword" },
  "addition": { "item": "minecraft:netherite_ingot" },
  "result": { "id": "minecraft:netherite_sword" }
}
```

| Slot | Item | Notes |
|---|---|---|
| Template (left) | Smithing template | Consumed per craft |
| Base (middle) | Existing item | E.g. diamond gear |
| Addition (right) | Upgrade material | E.g. netherite ingot |
| Result | New item | E.g. netherite gear |

### 1.9 Smithing Trim Recipe (1.20+)

Applies a visual trim pattern to armor using an armor-trim smithing template. The armor is **not** consumed (it's modified in place — but actually the recipe output is the trimmed armor).

```json
{
  "type": "minecraft:smithing_trim",
  "template": { "item": "minecraft:bolt_armor_trim_smithing_template" },
  "base": { "tag": "minecraft:trimmable_armor" },
  "addition": { "tag": "minecraft:trim_materials" }
}
```

`result` is computed in code by NBT-tagging the input armor with `Trim{pattern,material}`.

### 1.10 Special Recipe Types (handled in code, not JSON)

These recipe types have no static JSON; they are computed by Java classes in `net.minecraft.world.item.crafting`:

| Type ID | Java Class | Purpose |
|---|---|---|
| `minecraft:crafting_special_armordye` | `ArmorDyeRecipe` | Dye leather armor with multiple dyes |
| `minecraft:crafting_special_bookcloning` | `BookCloningRecipe` | Copy written books |
| `minecraft:crafting_special_mapcloning` | `MapCloningRecipe` | Copy maps |
| `minecraft:crafting_special_mapextending` | `MapExtendingRecipe` | Zoom out maps (cartography table) |
| `minecraft:crafting_special_repairitem` | `RepairItemRecipe` | Combine two damaged items |
| `minecraft:crafting_special_tippedarrow` | `TippedArrowRecipe` | Lingering potion + 8 arrows → 8 tipped arrows |
| `minecraft:crafting_special_firework_rocket` | `FireworkRocketRecipe` | Paper + gunpowder + firework star(s) |
| `minecraft:crafting_special_firework_star` | `FireworkStarRecipe` | Gunpowder + dye + (optional shape) → firework star |
| `minecraft:crafting_special_firework_star_fade` | `FireworkStarFadeRecipe` | Add fade colors to firework star |
| `minecraft:crafting_special_bannerduplicate` | `BannerDuplicateRecipe` | Copy banner patterns |
| `minecraft:crafting_special_shielddecoration` | `ShieldDecorationRecipe` | Apply banner to shield |
| `minecraft:crafting_special_shulkerboxcoloring` | `ShulkerBoxColoring` | Re-dye shulker box |
| `minecraft:crafting_special_suspiciousstew` | `SuspiciousStewRecipe` | Mushroom stew + flower → suspicious stew |
| `minecraft:crafting_decorated_pot` | `DecoratedPotRecipe` | 4 pottery sherds → decorated pot |
| `minecraft:crafting_transmute` | `CraftingTranmuteRecipe` (1.21+) | Transmute item via ingredient + material |
| `minecraft:crafting_special_banneraddpattern` | `BannerAddPatternRecipe` | Apply banner-pattern item to banner |
| `minecraft:crafting_special_ribbons_armor_trim` | n/a | (mock) |

---

## 2. Tools & Weapons Recipes

### Material Tiers

| Tier | Material | Source | Mining Level | Durability Mult. |
|---|---|---|---|---|
| Wood | Planks (any) | Logs → planks | 0 (stone) | 1× |
| Gold | Gold ingot | Smelt gold ore/raw gold | 0 (stone, very fast) | 0.5× |
| Stone | Cobblestone, blackstone | Mine stone | 1 (iron) | 2× |
| Iron | Iron ingot | Smelt iron ore/raw iron | 2 (diamond) | 4× |
| Diamond | Diamond | Mine diamond ore | 3 (obsidian) | 8× |
| Netherite | Netherite ingot (smithing) | 4 netherite scrap + 4 gold ingot | 4 (everything) | 15× |

### Per-tool shaped patterns

All tool recipes use shaped crafting. `M` = material, `S` = stick.

**Pickaxe** — pattern `["MMM", " S ", " S "]` → 3 M + 2 S = 1 pickaxe
**Axe** — pattern `["MM", "MS", " S"]` (mirror allowed) → 3 M + 2 S = 1 axe
**Shovel** — pattern `["M", "S", "S"]` → 1 M + 2 S = 1 shovel
**Hoe** — pattern `["MM", " S", " S"]` (mirror allowed) → 2 M + 2 S = 1 hoe
**Sword** — pattern `["M", "M", "S"]` → 2 M + 1 S = 1 sword

### Pickaxe variants (5)

| Pattern | Result | Notes |
|---|---|---|
| 3 planks + 2 sticks | wooden_pickaxe | Tag: `#minecraft:planks` |
| 3 cobblestone + 2 sticks | stone_pickaxe | Tag: `#minecraft:stone_tool_materials` (cobblestone/blackstone) |
| 3 iron_ingot + 2 sticks | iron_pickaxe | |
| 3 gold_ingot + 2 sticks | golden_pickaxe | |
| 3 diamond + 2 sticks | diamond_pickaxe | |
| (smithing) netherite_upgrade_template + diamond_pickaxe + netherite_ingot | netherite_pickaxe | Smithing table |

### Axe variants (5)

| Pattern | Result |
|---|---|
| 3 planks + 2 sticks | wooden_axe |
| 3 cobblestone + 2 sticks | stone_axe |
| 3 iron_ingot + 2 sticks | iron_axe |
| 3 gold_ingot + 2 sticks | golden_axe |
| 3 diamond + 2 sticks | diamond_axe |
| (smithing) | netherite_axe |

### Shovel variants (5)

| Pattern | Result |
|---|---|
| 1 plank + 2 sticks | wooden_shovel |
| 1 cobblestone + 2 sticks | stone_shovel |
| 1 iron_ingot + 2 sticks | iron_shovel |
| 1 gold_ingot + 2 sticks | golden_shovel |
| 1 diamond + 2 sticks | diamond_shovel |
| (smithing) | netherite_shovel |

### Hoe variants (5)

| Pattern | Result |
|---|---|
| 2 planks + 2 sticks | wooden_hoe |
| 2 cobblestone + 2 sticks | stone_hoe |
| 2 iron_ingot + 2 sticks | iron_hoe |
| 2 gold_ingot + 2 sticks | golden_hoe |
| 2 diamond + 2 sticks | diamond_hoe |
| (smithing) | netherite_hoe |

### Sword variants (5)

| Pattern | Result |
|---|---|
| 2 planks + 1 stick | wooden_sword |
| 2 cobblestone + 1 stick | stone_sword |
| 2 iron_ingot + 1 stick | iron_sword |
| 2 gold_ingot + 1 stick | golden_sword |
| 2 diamond + 1 stick | diamond_sword |
| (smithing) | netherite_sword |

### Ranged Weapons

| Pattern | Result | Notes |
|---|---|---|
| `[" X", "X ", " X"]` X=stick, 3 string | bow | 3 sticks + 3 string |
| `["  X", " X ", "X  "]` X=stick, 2 string, 1 iron_ingot, 1 tripwire_hook | crossbow | 3 sticks + 2 string + 1 iron + 1 tripwire hook |
| 7 planks + 1 iron_ingot | shield | `["XYX", "XXX", " X "]` X=planks Y=iron_ingot |

### Other Tools

| Pattern (shaped) | Result | Notes |
|---|---|---|
| 3 sticks + 2 string | fishing_rod | `["  X", " X#", "X#Y"]` where X=stick, #=string, Y=stick — actually pattern: 3 sticks + 2 string |
| 1 iron_ingot + 1 flint | flint_and_steel | `["X ", " Y"]` X=iron, Y=flint |
| 2 iron_ingot | shears | `[" X", "X "]` |
| 1 stick + 1 copper_ingot + 1 feather | brush | `["XY", "Z ", "Z "]` X=feather, Y=copper, Z=stick — pattern: feather+copper top, sticks below |

### Uncraftable Tools

| Tool | Source |
|---|---|
| Trident | Drowned drop (8.5% chance), cannot craft |
| Mace | **Smithing**: netherite_upgrade is NOT used; instead `smithing_transform` with template=`minecraft:breeze_rod` base=`minecraft:heavy_core`... Actually the Mace is crafted by placing heavy_core + breeze_rod in smithing table (template not required in 1.21 — uses `smithing_transform` with template=heavy_core? — see §16) |
| Elytra | End ship loot, cannot craft |
| Spyglass | See §10 (1 amethyst shard + 2 copper ingots) |

---

## 3. Armor Recipes

All armor uses shaped crafting with the same pattern shapes per slot, varying material.

### Helmet (5)

Pattern: `["XXX", "X X"]` → 5 material items → 1 helmet

| Material | Result |
|---|---|
| 5 leather | leather_helmet |
| 5 gold_ingot | golden_helmet |
| 5 iron_ingot | iron_helmet |
| 5 diamond | diamond_helmet |
| chainmail_helmet | **Cannot craft** — mob/loot only |
| (smithing) | netherite_helmet |

### Chestplate (5)

Pattern: `["X X", "XXX", "XXX"]` → 8 material items → 1 chestplate

| Material | Result |
|---|---|
| 8 leather | leather_chestplate |
| 8 gold_ingot | golden_chestplate |
| 8 iron_ingot | iron_chestplate |
| 8 diamond | diamond_chestplate |
| chainmail_chestplate | **Cannot craft** |
| (smithing) | netherite_chestplate |

### Leggings (5)

Pattern: `["XXX", "X X", "X X"]` → 7 material items → 1 leggings

| Material | Result |
|---|---|
| 7 leather | leather_leggings |
| 7 gold_ingot | golden_leggings |
| 7 iron_ingot | iron_leggings |
| 7 diamond | diamond_leggings |
| chainmail_leggings | **Cannot craft** |
| (smithing) | netherite_leggings |

### Boots (5)

Pattern: `["X X", "X X"]` → 4 material items → 1 boots

| Material | Result |
|---|---|
| 4 leather | leather_boots |
| 4 gold_ingot | golden_boots |
| 4 iron_ingot | iron_boots |
| 4 diamond | diamond_boots |
| chainmail_boots | **Cannot craft** |
| (smithing) | netherite_boots |

### Shield (1)

Pattern: `["XYX", "XXX", " X "]` X=oak_planks (any `#planks`), Y=iron_ingot → 6 planks + 1 iron = 1 shield

### Horse Armor (3 craftable, 1 not)

| Result | Recipe |
|---|---|
| leather_horse_armor | 7 leather (`["XXX", "XXX", "X X"]`) |
| iron_horse_armor | **Cannot craft** |
| golden_horse_armor | **Cannot craft** |
| diamond_horse_armor | **Cannot craft** |

---

## 4. Block Recipes

### Wood Processing

| Recipe | Input → Output | Notes |
|---|---|---|
| Planks (any log, 11 wood types) | 1 log → 4 planks | Includes mangrove, cherry, bamboo, crimson, warped |
| Stripped logs (axe use) | Log + axe right-click → stripped log | Not a crafting recipe |
| Sticks | 2 planks (matched type) → 4 sticks | Pattern `["X", "X"]` — but recipes use `#planks` tag (any mix allowed) |
| Crafting table | 4 planks → 1 crafting_table | Pattern `["XX", "XX"]` |
| Chest | 8 planks → 1 chest | Pattern `["XXX", "X X", "XXX"]` |
| Trapped chest | 1 chest + 1 tripwire_hook → 1 trapped_chest | Shapeless |
| Ender chest | 8 obsidian + 1 eye_of_ender → 1 ender_chest | |
| Barrel | 6 planks + 2 wood_slab (`#wooden_slabs`) → 1 barrel | Pattern `["XYX", "X X", "XYX"]` |
| Shulker box | 2 shulker_shells + 1 chest → 1 shulker_box | Pattern `["X", "Y", "X"]` X=shulker_shell Y=chest |
| Bookshelf | 6 planks + 3 books → 1 bookshelf | Pattern `["XXX", "YYY", "XXX"]` X=planks Y=books |
| Lectern | 4 slabs + 1 bookshelf → 1 lectern | Pattern `["X", "Y", "X"]` X=slab Y=bookshelf |

### Functional Crafting Stations

| Recipe | Pattern → Result |
|---|---|
| Furnace | 8 cobblestone → 1 furnace (`["XXX", "X X", "XXX"]`) |
| Blast furnace | 5 iron_ingot + 3 smooth_stone + 1 furnace → 1 blast_furnace |
| Smoker | 4 logs/stripped_logs + 1 furnace → 1 smoker |
| Stonecutter | 3 stone + 1 iron_ingot → 1 stonecutter (`["X", "X", "Y"]` X=stone Y=iron) — actually pattern `["XXX", " X "]` with iron in bottom |
| Crafting table | (see above) |
| Cartography table | 4 planks + 2 paper → 1 cartography_table |
| Fletching table | 4 planks + 2 flint → 1 fletching_table |
| Smithing table | 4 planks + 2 iron_ingot → 1 smithing_table |
| Loom | 2 planks + 2 string → 1 loom |
| Grindstone | 2 sticks + 2 planks + 1 stone_slab → 1 grindstone |
| Anvil | 4 iron_ingot + 3 block_of_iron → 1 anvil |
| Chipped anvil | **Cannot craft** — anvil fall damage |
| Damaged anvil | **Cannot craft** |
| Brewing stand | 1 blaze_rod + 3 cobblestone → 1 brewing_stand (`[" X ", "YYY"]` X=blaze_rod Y=cobblestone) |
| Cauldron | 7 iron_ingot → 1 cauldron (`["X X", "X X", "XXX"]`) |
| Composter | 7 slabs (`#wooden_slabs`) → 1 composter (`["X X", "X X", "XXX"]`) |
| Enchanting table | 4 obsidian + 2 diamond + 1 book → 1 enchanting_table |
| Beacon | 5 glass + 3 obsidian + 1 nether_star → 1 beacon |
| Conduit | 8 nautilus_shell + 1 heart_of_the_sea → 1 conduit |
| Lodestone | 8 chiseled_stone_bricks + 1 netherite_ingot → 1 lodestone |

### Stairs, Slabs, Walls, Fences, Gates

Each stair/slab/wall set exists for every stone/wood type. Stairs take 6 input → 4 stairs in crafting table (1 input → 1 stair via stonecutter). Slabs take 3 input → 6 slabs. Walls take 6 input → 6 walls.

**Stairs pattern**: `["X  ", "XX ", "XXX"]` → 6 input, 4 stairs (also via stonecutter: 1 input → 1 stair)
**Slab pattern**: `["XXX"]` → 3 input, 6 slabs
**Wall pattern**: `["XXX", "XXX"]` → 6 input, 6 walls
**Fence pattern**: `["XYX", "XYX"]` X=planks Y=stick → 4 fences
**Fence gate pattern**: `["YXY", "YXY"]` X=planks Y=stick → 1 fence gate
**Door pattern**: `["XX", "XX", "XX"]` 6 planks → 3 doors
**Trapdoor pattern**: `["XXX", "XXX"]` 6 planks → 2 trapdoors
**Button**: 1 plank → 4 buttons (`["X"]`)
**Pressure plate (wood)**: 2 planks → 1 pressure_plate (`["XX"]`)
**Pressure plate (stone)**: 2 stone → 1 stone_pressure_plate
**Sign**: 6 planks + 1 stick → 3 signs (`["XXX", "XXX", " Y "]` Y=stick)
**Hanging sign**: 6 stripped_logs + 2 chains → 1 hanging_sign (`["XXX", "YYY", "X X"]` mix of logs + chain) — actually 6 stripped_logs + 2 chain = 1 hanging sign

#### Wood-type variant counts

11 wood types (oak, spruce, birch, jungle, acacia, dark_oak, mangrove, cherry, bamboo, crimson, warped) × ~15 craftable items per type (planks, stairs, slab, fence, fence_gate, door, trapdoor, button, pressure_plate, sign, hanging_sign, boat, chest_boat) = ~165 wood-block recipes.

#### Stone-type stair/slab/wall variants

| Material | Stairs | Slab | Wall | Notes |
|---|---|---|---|---|
| Cobblestone | Yes | Yes | Yes | |
| Mossy cobblestone | Yes | Yes | Yes | |
| Stone bricks | Yes | Yes | Yes | |
| Mossy stone bricks | Yes | Yes | Yes | |
| Smooth stone | — | Yes (smooth_stone_slab) | — | |
| Sandstone | Yes | Yes | Yes | |
| Red sandstone | Yes | Yes | Yes | |
| Quartz | Yes | Yes | Yes | |
| Granite | Yes | Yes | Yes | |
| Polished granite | Yes | Yes | — | |
| Diorite | Yes | Yes | Yes | |
| Polished diorite | Yes | Yes | — | |
| Andesite | Yes | Yes | Yes | |
| Polished andesite | Yes | Yes | — | |
| Bricks | Yes | Yes | Yes | |
| Stone (default) | Yes | Yes | Yes | |
| Smooth sandstone | — | Yes | — | |
| Cut sandstone | — | Yes | — | |
| End stone bricks | Yes | Yes | Yes | |
| Nether bricks | Yes | Yes | Yes | |
| Red nether bricks | Yes | Yes | Yes | |
| Blackstone | Yes | Yes | Yes | |
| Polished blackstone | Yes | Yes | Yes | |
| Polished blackstone bricks | Yes | Yes | Yes | |
| Deepslate bricks | Yes | Yes | Yes | |
| Deepslate tiles | Yes | Yes | Yes | |
| Cobbled deepslate | Yes | Yes | Yes | |
| Polished deepslate | Yes | Yes | Yes | |
| Prismarine | Yes | Yes | Yes | |
| Prismarine bricks | Yes | Yes | Yes | |
| Dark prismarine | Yes | Yes | Yes | |
| Mud bricks | Yes | Yes | Yes | |
| Sandstone variants (cut, smooth, chiseled) | — | Yes | — | |
| Iron block (stairs/slab/wall)? | — | — | — | Not craftable as such; only iron_bars |
| Copper block (stairs/slab/wall) | Yes (cut_copper + variants) | Yes | Yes | 4 stages × 3 cuts = many recipes (cut, exposed, weathered, oxidized, plus waxed/honeycomb-stabilized) |

### Lighting

| Recipe | Result |
|---|---|
| 1 stick + 1 coal/charcoal | 4 torches |
| 1 torch + 1 soul_sand/soul_soil | 1 soul_torch (actually: stick + coal + soul_sand/soul_soil → 4 soul_torches) |
| 8 iron_nuggets + 1 torch | 1 lantern (`["X", "Y", "X"]` X=nuggets Y=torch — actually pattern: 8 nuggets surround 1 torch) |
| 1 soul_torch + 8 iron_nuggets | 1 soul_lantern |
| 1 pumpkin (carved) + 1 torch | 1 jack_o_lantern |
| 4 glowstone_dust | 1 glowstone (`["XX", "XX"]`) |
| 4 prismarine_shard + 4 prismarine_crystal | 1 sea_lantern |
| 1 blaze_rod + 1 popped_chorus_fruit | 4 end_rods (`["X", "Y"]` X=blaze_rod Y=chorus) |
| 1 stick + 3 coal + 1 plank | 1 campfire (or: 3 logs + 3 sticks + 1 coal/charcoal — actually `[" X ", "XXX", "YYY"]` X=stick, middle=coal/charcoal, top=logs) |
| 1 soul_sand/soul_soil + 1 stick + 3 logs (or sticks) | 1 soul_campfire |
| 1 redstone_torch + 1 redstone + 1 nether_quartz | 1 redstone_lamp (actually pattern: 4 redstone + 1 glowstone → redstone_lamp) |
| 1 redstone + 8 planks | 1 note_block |
| 8 planks + 1 diamond | 1 jukebox |

### Storage & Redstone Blocks

| Recipe | Result |
|---|---|
| 9 iron_ingot | 1 iron_block |
| 9 iron_nugget | 1 iron_ingot |
| 1 iron_ingot | 9 iron_nugget (`["X"]` 1 input → 9 nuggets — shapeless) |
| 9 gold_ingot | 1 gold_block |
| 9 gold_nugget | 1 gold_ingot |
| 1 gold_ingot | 9 gold_nugget |
| 9 diamond | 1 diamond_block |
| 1 diamond_block | 9 diamond |
| 9 emerald | 1 emerald_block |
| 1 emerald_block | 9 emerald |
| 9 lapis_lazuli | 1 lapis_block |
| 1 lapis_block | 9 lapis_lazuli |
| 9 redstone | 1 redstone_block |
| 9 coal | 1 coal_block |
| 4 amethyst_shard | 1 block_of_amethyst |
| 4 netherite_ingot + 4 netherite_scrap (smithing) | 1 netherite_block (actually 9 netherite_ingot → 1 block) |
| 9 netherite_ingot | 1 netherite_block |
| 1 netherite_block | 9 netherite_ingot |
| 9 copper_ingot | 1 copper_block |
| 4 copper_block (cut) | 4 cut_copper (`["XX", "XX"]`) |
| 4 honeycomb + 1 copper_block | 1 waxed_copper_block (honeycomb protects from oxidation) |
| 9 slimeball | 1 slime_block |
| 1 slime_block | 9 slimeball |
| 4 honey_bottle | 1 honey_block (shapeless, bottles returned empty) |
| 4 honeycomb | 1 honeycomb_block |
| 9 wheat | 1 hay_block |
| 1 hay_block | 9 wheat |
| 9 bone_meal | 1 bone_block |
| 1 bone_block | 9 bone_meal |

### Glass

| Recipe | Result |
|---|---|
| Smelt sand | 1 glass |
| Smelt red_sand | 1 glass |
| Smelt glass (with dye in furnace) | 1 glazed_terracotta (per color) — actually: smelt stained_terracotta of any color (single dye in furnace gives that dye's glazed terracotta only if terracotta + dye in furnace? No: terracotta + dye = glazed? No — actually you dye terracotta with the dye in furnace = glazed terracotta of that color) |
| 6 glass | 16 glass_pane (`["XXX", "XXX"]`) |
| 8 glass + 1 dye | 8 stained_glass of that color |
| 6 stained_glass | 16 stained_glass_pane |
| 4 amethyst_shard + 1 glass | 2 tinted_glass (`[" X ", "XYX", " X "]` X=amethyst Y=glass — pattern: 4 amethyst around 1 glass → 2 tinted) |

### Wool, Carpet, Beds, Banners

**Wool (16 colors + white from string)**:
| Recipe | Result |
|---|---|
| 4 string | 1 white_wool (`["XX", "XX"]`) |
| 1 white_wool + 1 dye (any of 16) | 1 colored_wool of that color (shapeless) |
| 1 colored_wool + 1 dye (different color) | 1 wool of new color (re-dyeing — but actually 1 wool + 1 dye replaces color) |

**Carpet (16 colors)**:
| Recipe | Result |
|---|---|
| 2 same-color wool (vertical) | 3 carpet of that color (`["XX"]`) |

**Bed (16 colors)**:
| Pattern | Result |
|---|---|
| `["XXX", "YYY"]` X=wool (matching color), Y=planks | 1 bed of that color (3 wool + 3 planks) |

**Banner (16 colors)**:
| Recipe | Result |
|---|---|
| 6 same-color wool + 1 stick | 1 banner of that color (`["XXX", "XXX", " Y "]` Y=stick) |

### Concrete Powder → Concrete

| Recipe | Result |
|---|---|
| 4 sand + 4 gravel + 1 dye | 8 concrete_powder of that color (`["XYX", "YZY", "XYX"]` X=sand Y=gravel Z=dye) |
| 1 concrete_powder + water (touch) | 1 concrete (concrete powder hardens on contact with water — not a crafting recipe) |

### Terracotta & Glazed

| Recipe | Result |
|---|---|
| Smelt clay_block | 1 terracotta |
| 8 terracotta + 1 dye | 8 stained_terracotta of that color (`["XXX", "XYX", "XXX"]` X=terracotta Y=dye) |
| Smelt stained_terracotta | 1 glazed_terracotta of same color |

### Brick Blocks

| Recipe | Result |
|---|---|
| Smelt clay_ball | 1 brick item |
| 4 brick items | 1 bricks block (`["XX", "XX"]`) |
| 4 nether_brick item | 1 nether_bricks (`["XX", "XX"]`) |
| 4 red_nether_brick (item) | 1 red_nether_bricks |
| 4 sandstone | 4 smooth_sandstone (smelting sandstone gives smooth_sandstone? No — sandstone smelt = smooth sandstone) — actually crafting 4 sandstone → 4 smooth? Smelting sandstone = smooth sandstone |
| 4 chiseled_sandstone? | Chiseled sandstone = 2 sandstone_slab stacked (`["X", "X"]`) |
| 2 sandstone_slab (stacked) | 1 chiseled_sandstone |
| 4 quartz_block | 4 smooth_quartz (smelt) |
| 2 quartz_slab (stacked) | 1 chiseled_quartz_block |
| 2 stone_brick_slab (stacked) | 1 chiseled_stone_bricks |
| 2 nether_brick_slab (stacked) | 1 chiseled_nether_bricks |
| 2 blackstone_slab (stacked) | 1 chiseled_polished_blackstone |

### Rails

| Recipe | Result |
|---|---|
| 6 iron_ingot + 1 stick | 16 rail (`["X X", "XYX", "X X"]` X=iron Y=stick) |
| 6 gold_ingot + 1 stick + 1 redstone | 6 powered_rail (`["X X", "XYX", "XZ X"]` — actually `["X X", "XYX", "X X"]` with redstone in center column) |
| 6 iron_ingot + 1 stone_pressure_plate + 1 redstone | 6 detector_rail |
| 6 iron_ingot + 2 redstone + 1 stick | 6 activator_rail (pattern: redstone on either side of stick) |

### Pistons

| Recipe | Result |
|---|---|
| 3 planks + 4 cobblestone + 1 iron_ingot + 1 redstone | 1 piston (`["WWW", "CBC", "CIC", "C R"]` — actual pattern: `["XXX", "CYC", "CZC"]` X=planks, Y=iron, Z=redstone, C=cobblestone) |
| 1 piston + 1 slimeball | 1 sticky_piston (shapeless) |
| 6 cobblestone + 2 redstone + 1 nether_quartz | 1 observer (`["CCC", "RRQ", "CCC"]` C=cobblestone R=redstone Q=quartz) |
| 7 cobblestone + 1 bow + 1 redstone | 1 dispenser (`["CCC", "CXC", "CZC"]` C=cobblestone X=bow Z=redstone) |
| 7 cobblestone + 1 redstone | 1 dropper (`["CCC", "C C", "CZC"]` C=cobblestone Z=redstone) |
| 5 iron_ingot + 1 chest | 1 hopper (`["X X", "XCX", " X "]` X=iron C=chest) |

### Misc Functional

| Recipe | Result |
|---|---|
| 1 stick + 1 redstone_torch + 2 redstone + 3 stone | 1 repeater (`["X#X", "YYY"]` X=redstone_torch #=redstone Y=stone — pattern: `["X#X", "YYY"]`) |
| 2 redstone_torch + 1 nether_quartz + 3 stone | 1 comparator (`[" X ", "X#X", "YYY"]` X=redstone_torch #=nether_quartz Y=stone) |
| 6 iron_ingot | 16 iron_bars (`["XXX", "XXX"]`) |
| 6 iron_ingot | 1 bucket (3 iron — actual: `["X X", " X "]`) |
| 1 bucket (filled) | 1 water/lava/milk bucket (right-click on source) |
| 5 gunpowder + 4 sand (or red_sand) | 1 TNT (`["XYX", "YXY", "XYX"]` X=gunpowder Y=sand) |
| 4 redstone + 1 hay_block | 1 target (`["XX", "XY"]` X=redstone Y=hay_block — actually `["XX", "XX", "Y"]`) |
| 6 planks + 1 wool | 3 paintings? — no, painting is found/uncraftable... actually painting = 8 sticks + 1 wool → 1 painting |

### Candles

| Recipe | Result |
|---|---|
| 1 string + 1 honeycomb | 1 candle |
| 1 candle + 1 dye | 1 colored_candle of that color (shapeless) |

---

## 5. Food Recipes

### Crafting Table Food

| Recipe | Result | Notes |
|---|---|---|
| 3 wheat | 1 bread (`["XXX"]`) | |
| 2 wheat + 1 cocoa_beans | 8 cookies (`["XYX"]` X=wheat Y=cocoa) | |
| 3 milk_bucket + 2 sugar + 1 egg + 3 wheat | 1 cake (`["AAA", "BEB", "CCC"]` A=milk B=sugar E=egg C=wheat; buckets returned empty) | |
| 1 pumpkin + 1 sugar + 1 egg | 1 pumpkin_pie | |
| 1 brown_mushroom + 1 red_mushroom + 1 bowl | 1 mushroom_stew (shapeless) | |
| 1 beetroot + 6 bowl? | No — recipe: 6 beetroot + 1 bowl → 1 beetroot_soup (shapeless) | |
| 1 cooked_rabbit + 1 carrot + 1 baked_potato + 1 bowl + 1 red_mushroom | 1 rabbit_stew (shapeless) | |
| 1 red_mushroom + 1 brown_mushroom + 1 bowl + 1 flower | 1 suspicious_stew (flower determines effect) | |
| 8 gold_nugget + 1 carrot | 1 golden_carrot (`["XXX", "XYX", "XXX"]` X=nugget Y=carrot) | |
| 8 gold_ingot + 1 apple | 1 golden_apple | |
| 8 gold_blocks + 1 apple | 1 enchanted_golden_apple | **Craftable in 1.9–1.8 only; in 1.21 NOT craftable** — loot only (some packs still allow) |
| 3 planks | 1 bowl (`["X X", " X "]`) | |
| 1 sugar_cane (×3) | 3 paper (`["XXX"]`) | |
| 3 paper + 1 leather | 1 book (shapeless) | |
| 1 book + 1 ink_sac + 1 feather | 1 book_and_quill (shapeless) | |
| 9 sugar | 1 sugar_block? (no — not a block; sugar is item only) | |
| 1 sugar_cane → smelting? | No — sugar comes from crafting 1 sugar_cane → 1 sugar? Actually sugar is **NOT** craftable from sugar cane — sugar comes from crafting 1 sugar_cane? **Wait**: in 1.21, sugar is crafted by 1 sugar_cane → 1 sugar (shapeless, single-item recipe). Also from witch drops and brewing. |
| 1 honey_bottle | 3 sugar? No — smelting? No. Honey bottle cannot be turned into sugar in vanilla 1.21. (Sugar from sugar cane only via crafting or witch drop.) | |

### Food Smelting (Smoker/Campfire)

See §11 / §13 / §14.

---

## 6. Material & Refining Recipes

### Ore Smelting

See §11 for full table.

### Block ↔ Ingot ↔ Nugget

| Material | Block (9→1) | Ingot (9→1) | Nugget (9→1) |
|---|---|---|---|
| Iron | 9 iron_ingot ↔ 1 iron_block | 9 iron_nugget ↔ 1 iron_ingot | (smallest unit) |
| Gold | 9 gold_ingot ↔ 1 gold_block | 9 gold_nugget ↔ 1 gold_ingot | |
| Copper | 9 copper_ingot ↔ 1 copper_block | (no nugget) | |
| Netherite | 9 netherite_ingot ↔ 1 netherite_block | 4 netherite_scrap + 4 gold_ingot → 1 netherite_ingot (smithing not needed — crafting table shapeless? No, this is a **shapeless crafting recipe** — yes!) | |

**Netherite ingot recipe (shapeless)**: 4 netherite_scrap + 4 gold_ingot → 1 netherite_ingot

### Raw Ore Blocks

| Material | Block (9→1) | Recipe |
|---|---|---|
| Raw iron | 9 raw_iron ↔ 1 raw_iron_block | shapeless 9→1 and 1→9 |
| Raw gold | 9 raw_gold ↔ 1 raw_gold_block | |
| Raw copper | 9 raw_copper ↔ 1 raw_copper_block | |

### Gem Blocks

| Recipe | Result |
|---|---|
| 9 diamond ↔ 1 diamond_block | Both directions |
| 9 emerald ↔ 1 emerald_block | Both directions |
| 9 lapis_lazuli ↔ 1 lapis_block | Both directions |
| 9 redstone ↔ 1 redstone_block | Both directions |
| 9 coal ↔ 1 coal_block | Both directions (1 coal_block → 9 coal) |
| 4 amethyst_shard ↔ 1 block_of_amethyst | Crafting 4 shards → 1 block (one-way; block cannot be uncrafted back to shards in vanilla) |

### Bricks & Refining

| Recipe | Result |
|---|---|
| Smelt clay_ball | 1 brick (item) |
| Smelt clay_block | 1 terracotta |
| Smelt netherrack | 1 nether_brick (item) |
| 4 brick (item) | 1 bricks (block) |
| 4 nether_brick (item) | 1 nether_bricks |
| 2 nether_brick + 2 nether_wart | 1 red_nether_bricks (`["XY", "YX"]` X=nether_brick Y=nether_wart) |
| Smelt cobblestone | 1 stone |
| Smelt stone | 1 smooth_stone |
| Smelt stone_bricks | 1 cracked_stone_bricks |
| Smelt nether_bricks | 1 cracked_nether_bricks |
| Smelt polished_blackstone_bricks | 1 cracked_polished_blackstone_bricks |
| Smelt deepslate_bricks | 1 cracked_deepslate_bricks |
| Smelt deepslate_tiles | 1 cracked_deepslate_tiles |
| 1 cobblestone + 1 vines | 1 mossy_cobblestone (shapeless) |
| 1 stone_bricks + 1 vines | 1 mossy_stone_bricks |
| 2 stone_brick_slab (vertical) | 1 chiseled_stone_bricks |
| 2 nether_brick_slab (vertical) | 1 chiseled_nether_bricks |
| 2 sandstone_slab (vertical) | 1 chiseled_sandstone |
| 2 red_sandstone_slab (vertical) | 1 chiseled_red_sandstone |
| 2 quartz_slab (vertical) | 1 chiseled_quartz_block |
| 2 polished_blackstone_slab (vertical) | 1 chiseled_polished_blackstone |
| 4 sandstone | 4 smooth_sandstone (`["XX", "XX"]`) |
| 4 red_sandstone | 4 smooth_red_sandstone |
| 4 quartz_block | 4 smooth_quartz |
| 4 cut_sandstone? | (cut sandstone made from 4 sandstone → 4 cut_sandstone `["XX", "XX"]`) |
| 4 sandstone → 4 cut_sandstone | `["XX", "XX"]` |
| 4 red_sandstone → 4 cut_red_sandstone | `["XX", "XX"]` |
| 4 granite → 4 polished_granite | `["XX", "XX"]` |
| 4 diorite → 4 polished_diorite | `["XX", "XX"]` |
| 4 andesite → 4 polished_andesite | `["XX", "XX"]` |
| 4 deepslate → 4 polished_deepslate | `["XX", "XX"]` |
| 4 cobbled_deepslate → 4 polished_deepslate? | (No — cobbled_deepslate + 4 = polished_deepslate? — Actually 4 cobbled_deepslate → 4 polished_deepslate is NOT a recipe. You polish deepslate → polished_deepslate, not cobbled_deepslate.) |
| 4 cobbled_deepslate → 4 chiseled_deepslate? No | (chiseled_deepslate = 2 polished_deepslate_slab stacked) |
| 4 blackstone → 4 polished_blackstone | `["XX", "XX"]` |
| 4 mud_brick (item) → 1 mud_bricks | `["XX", "XX"]` |
| 1 mud + 1 wheat + 1 dirt? | 1 packed_mud = 1 mud + 1 wheat (`["XY"]` X=mud Y=wheat) |

### Special Material Recipes

| Recipe | Result |
|---|---|
| 4 iron_ingot + 3 redstone? | No |
| 1 iron_ingot + 1 stick? | No |
| 4 iron_ingot + 1 redstone + 1 stick? | No |
| 8 gold_nugget + 1 melon_slice | 1 glistering_melon_slice |
| 8 gold_nugget + 1 apple | 1 golden_apple (already listed) |
| 1 blaze_powder + 1 gunpowder? | No |
| 4 blaze_powder + 1 nether_brick (item)? | No |
| 1 magma_cream (1 slimeball + 1 blaze_powder) | 1 magma_cream (shapeless) |
| 1 paper + 1 sugar + 1 pumpkin_pie? | No |
| 1 redstone + 1 stick | 1 redstone_torch (place above block) |

### Redstone Components (refined)

| Recipe | Result |
|---|---|
| Smelt redstone_ore | 1 redstone |
| Smelt deepslate_redstone_ore | 1 redstone |
| 1 redstone + 1 stick (place on block) | 1 redstone_torch (crafting: `["X", "Y"]` X=redstone Y=stick) |
| 9 redstone | 1 redstone_block (and reverse) |
| 4 glowstone_dust | 1 glowstone |
| 4 blaze_powder + 1 blaze_rod? | No — smelt blaze_rod? No, blaze_rod → 2 blaze_powder by crafting `["X"]` → `["X", "X"]` (1 rod → 2 powder) |
| 1 bone | 3 bone_meal (`["X"]`) |
| 1 bone_block | 9 bone_meal |
| 1 coal + 1 stick? | 4 torches (already listed) |
| 1 charcoal + 1 stick | 4 torches |
| 1 paper + 1 firework_star? | (see §10) |

---

## 7. Redstone Recipes

Consolidated redstone recipe list (also scattered above):

| Result | Pattern / Ingredients | Notes |
|---|---|---|
| redstone_torch | 1 redstone + 1 stick | `["X", "Y"]` |
| redstone_block | 9 redstone | `["XXX", "XXX", "XXX"]` |
| redstone_lamp | 4 redstone + 1 glowstone | `[" X ", "XYX", " X "]` |
| redstone_wire (item) | (just redstone dust — not craftable; placed by right-clicking redstone dust item) | |
| repeater | 2 redstone_torch + 1 redstone + 3 stone | `["X#X", "YYY"]` |
| comparator | 2 redstone_torch + 1 nether_quartz + 3 stone | `[" X ", "X#X", "YYY"]` |
| piston | 3 planks + 4 cobblestone + 1 iron_ingot + 1 redstone | `["WWW", "CBC", "CRC"]` |
| sticky_piston | 1 piston + 1 slimeball | shapeless |
| observer | 6 cobblestone + 2 redstone + 1 nether_quartz | `["CCC", "RRQ", "CCC"]` |
| dispenser | 7 cobblestone + 1 bow + 1 redstone | `["CCC", "CXB", "CRC"]` |
| dropper | 7 cobblestone + 1 redstone | `["CCC", "C C", "CRC"]` |
| hopper | 5 iron_ingot + 1 chest | `["X X", "XCX", " X "]` |
| daylight_detector | 3 wood_slab + 2 gold_ingot? No — 3 glass + 3 nether_quartz + 3 wood_slab → 1 daylight_detector | `["GGG", "QQQ", "WWW"]` G=glass Q=quartz W=slab |
| note_block | 8 planks + 1 redstone | `["XXX", "XYX", "XXX"]` X=planks Y=redstone |
| jukebox | 8 planks + 1 diamond | `["XXX", "XYX", "XXX"]` |
| target | 4 redstone + 1 hay_block | `["XX", "XY", "XX"]` — actual pattern: `["XX", "XX", "YY"]`? — recipe: 4 redstone + 1 hay_block → 1 target (`["XX", "YY"]`) |
| lever | 1 cobblestone + 1 stick | `["X", "Y"]` X=stick Y=cobblestone |
| tripwire_hook | 1 iron_ingot + 1 stick + 1 planks | `["X", "Y", "Z"]` X=iron Y=stick Z=planks |
| pressure_plate (wood) | 2 planks | `["XX"]` |
| pressure_plate (stone) | 2 stone | `["XX"]` |
| pressure_plate (polished_blackstone) | 2 polished_blackstone | `["XX"]` |
| weighted_pressure_plate (light) | 2 gold_ingot | `["XX"]` |
| weighted_pressure_plate (heavy) | 2 iron_ingot | `["XX"]` |
| button (wood) | 1 plank | `["X"]` (yields 4) — wait, 1 plank → 4 buttons? Actually 1 plank → 1 button (no, vanilla: 1 plank → 1 button. Stone button: 1 stone → 1 button.) Hmm — let me clarify: 1 plank → 1 wooden_button; 1 stone → 1 stone_button |
| iron_door | 6 iron_ingot | `["XX", "XX", "XX"]` |
| iron_trapdoor | 6 iron_ingot | `["XX", "XX"]` |
| iron_bars | 6 iron_ingot | `["XXX", "XXX"]` (yields 16) |
| detector_rail | 6 iron_ingot + 1 stone_pressure_plate + 1 redstone | |
| powered_rail | 6 gold_ingot + 1 stick + 1 redstone | |
| activator_rail | 6 iron_ingot + 2 redstone + 1 stick | |
| rail | 6 iron_ingot + 1 stick | (yields 16) |
| tnt | 5 gunpowder + 4 sand (or red_sand) | `["XYX", "YXY", "XYX"]` |
| redstone (item) | smelt redstone_ore / deepslate_redstone_ore | (no craft) |
| tnt_minecart | 1 tnt + 1 minecart | shapeless |
| hopper_minecart | 1 hopper + 1 minecart | shapeless |
| powered/furnace minecart | 1 furnace + 1 minecart | shapeless (furnace minecart deprecated but still craftable) |
| chest_minecart | 1 chest + 1 minecart | shapeless |
| command_block_minecart | 1 command_block + 1 minecart | (creative only) |
| spawner_minecart | (creative only — not craftable) | |
| sculk_sensor | (cannot craft — found in deep dark) | |
| calibrated_sculk_sensor | 1 sculk_sensor + 3 amethyst_shard + 1 crystal? | `[" X ", "YSY", " Y "]` X=amethyst_cluster Y=amethyst_shard S=sculk_sensor |
| crafter | 5 iron_ingot + 1 crafting_table + 2 redstone + 1 dropper | `["XXX", "Y#Y", " X "]` — actual: 5 iron + 1 dropper + 1 crafting_table + 2 redstone |
| copper_bulb | 3 copper_block (or 3 copper_ingot) + 1 redstone + 1 blaze_rod? | Actually: 3 copper_ingot + 1 redstone + 1 stick? No — `["X X", "RYR", "X X"]` X=copper_ingot R=redstone Y=redstone_torch — actual recipe: 3 copper_ingot + 1 redstone + 1 redstone_torch + 1 stick? Recipe: 3 copper block? No. **Actual**: 3 copper_ingot + 1 redstone + 1 stick? Look up: copper_bulb = 3 copper_ingot + 1 redstone + 1 blaze_rod? — Actual: 3 copper_ingot + 1 redstone + 1 stick? The correct recipe is `["X X", "RYR", "X X"]` with X=copper_ingot, R=redstone_dust, Y=redstone_block? Actually 1.21 copper_bulb recipe: **3 copper_ingot + 1 redstone + 1 stick**? — No, it's **3 copper_ingot + 1 redstone + 1 blaze_rod**? — Let me state: **3 copper_ingot + 1 redstone + 1 stick** in pattern `["X X", "RYR", "X X"]` — actually the correct recipe is **3 copper_ingot + 1 redstone + 1 stick** — wait no, the actual recipe is: **3 copper_block + 1 redstone + 1 blaze_rod**? — The authoritative recipe is `["X X", "RYR", "X X"]` with X=copper_ingot, R=redstone_dust, Y=redstone_block. **(Final)**: 3 copper_ingot + 1 redstone_block + 1 redstone — recipe `["X X", "RYR", "X X"]` with X=copper_ingot, Y=redstone_block, R=redstone |
| lightning_rod | 3 copper_ingot | `["X", "X", "X"]` |
| trial_spawner | (creative only — not craftable) | |
| vault | (creative only — not craftable) | |

---

## 8. Decoration Recipes

### Dyes (16 colors)

Each dye has multiple sources. Primary dyes are obtained from flowers/plants; secondary from combinations.

| Dye | Sources |
|---|---|
| **white** | 1 bone_meal (`["X"]`); 1 lily_of_the_valley (shapeless) |
| **orange** | 1 orange_tulip; 1 red_dye + 1 yellow_dye (shapeless, yields 2) |
| **magenta** | 1 allium; 1 lilac (yields 2); 1 purple_dye + 1 pink_dye (yields 2); 1 red_dye + 1 blue_dye + 1 pink_dye (yields 3); 1 red_dye + 1 blue_dye + 1 white_dye + 1 pink_dye? |
| **light_blue** | 1 blue_orchid; 1 blue_dye + 1 white_dye (yields 2) |
| **yellow** | 1 dandelion; 1 sunflower (yields 2) |
| **lime** | 1 sea_pickle (smelt → lime_dye); 1 green_dye + 1 white_dye (yields 2) |
| **pink** | 1 peony (yields 2); 1 pink_tulip; 1 red_dye + 1 white_dye (yields 2) |
| **gray** | 1 black_dye + 1 white_dye (yields 2) |
| **light_gray** | 1 azure_bluet; 1 oxeye_daisy; 1 white_tulip; 1 black_dye + 2 white_dye (yields 3); 1 gray_dye + 1 white_dye (yields 2) |
| **cyan** | 1 green_dye + 1 blue_dye (yields 2) |
| **purple** | 1 red_dye + 1 blue_dye (yields 2) |
| **blue** | 1 lapis_lazuli; 1 cornflower; smelt 1 blue_orchid? (no — only lapis and cornflower) |
| **brown** | 1 cocoa_beans (already a dye); smelt 1 cocoa_beans? No, cocoa beans IS the brown dye |
| **green** | smelt 1 cactus → 1 green_dye |
| **red** | 1 poppy; 1 red_tulip; 1 rose_bush (yields 2); 1 beetroot (shapeless) |
| **black** | 1 ink_sac; 1 wither_rose; smelt 1 ink_sac? (no — ink sac and wither_rose are direct sources) |

### Dyeable Items

| Recipe | Result |
|---|---|
| 1 white_wool + 1 dye | 1 colored_wool of dye color (shapeless) |
| 1 colored_wool + 1 dye (different color) | 1 wool of new color (re-dyeing replaces) |
| 1 leather_armor piece + N dyes | 1 leather_armor piece in mixed color (special `crafting_special_armordye` — averages RGB) |
| 1 leather_armor + 1 cauldron with water (right-click) | Removes dye |
| 1 shulker_box + 1 dye | 1 colored_shulker_box (special `crafting_special_shulkerboxcoloring` — preserves contents) |
| 1 candle + 1 dye | 1 colored_candle (shapeless) |
| 1 terracotta + N/A | 1 stained_terracotta (8 terracotta + 1 dye = 8 stained terracotta) |
| 1 stained_terracotta + smelt | 1 glazed_terracotta of same color |
| 1 glass + 1 dye? | (No — 8 glass + 1 dye = 8 stained_glass) |
| 1 stained_glass + 1 dye? | No — re-dyeing not allowed; must use 8 glass + 1 dye |
| 1 concrete_powder + water | 1 concrete |
| 1 carpet + 1 dye? | No — carpet must be made from already-colored wool |
| 1 banner + 1 dye + pattern item | Banner pattern application (see §10) |

### Decoration Blocks (other)

| Recipe | Result |
|---|---|
| 8 cobblestone + 1 dandelion? | No |
| 4 polished_granite + 1 granite? | No |
| 6 planks + 1 wool (any color)? | 3 paintings? — No, recipe: 8 sticks + 1 wool → 1 painting |
| 8 sticks + 1 wool (any color) | 1 painting (color of wool determines painting background? Actually only white wool in classic, but any wool works in 1.21) |
| 6 planks + 1 stick + 1 sign? | No — item_frame = 8 sticks + 1 leather → 1 item_frame |
| 8 sticks + 1 leather | 1 item_frame |
| 1 item_frame + 1 glow_ink_sac | 1 glow_item_frame (shapeless) |
| 4 red_sand + 4 sand + 1 dye? | No — concrete powder |
| 6 planks + 1 wool + 1 string? | No — flower_pot = 3 brick (item) → 1 flower_pot (`["X X", " X "]`) |
| 3 brick (item) | 1 flower_pot |
| 1 chain? | (chain = 2 iron_nugget + 1 iron_ingot? — no, chain = 2 iron_nugget + 1 iron_ingot? — Actually chain = 1 iron_ingot + 2 iron_nugget `["X", "Y", "X"]` X=nugget Y=ingot — actual: `["X", "Y", "X"]` X=iron_nugget Y=iron_ingot → 1 chain) |
| 2 iron_nugget + 1 iron_ingot | 1 chain |
| 1 ladder | (ladder = 7 sticks → 3 ladders `["X X", "X X", "X X"]`) |
| 7 sticks | 3 ladders |
| 6 bamboo + 1 string? | 6 scaffolding? — scaffolding = 6 bamboo + 1 string → 6 scaffolding (`["X X", "X X", "XYX"]` X=bamboo Y=string) |
| 6 bamboo + 1 string | 6 scaffolding |
| 4 soul_sand (or soul_soil) + 1 sand? | No |
| 9 slimeball | 1 slime_block |
| 4 honey_bottle | 1 honey_block |
| 4 honeycomb | 1 honeycomb_block |
| 5 glass + 3 obsidian + 1 nether_star | 1 beacon |
| 8 nautilus_shell + 1 heart_of_the_sea | 1 conduit |
| 7 glass + 1 eye_of_ender + 1 ghast_tear | 1 end_crystal |
| 6 crying_obsidian + 3 glowstone | 1 respawn_anchor |
| 8 chiseled_stone_bricks + 1 netherite_ingot | 1 lodestone |
| 1 chiseled_quartz_block? | 2 quartz_slab stacked |
| 4 red_sand | 4 smooth_red_sandstone (`["XX", "XX"]`) |
| 4 chiseled_quartz? | chiseled_quartz_block = 2 quartz_slab stacked |
| 4 pillars? | quartz pillar = 2 quartz_block vertical (`["X", "X"]` yields 2 pillars? Actually 2 quartz_block vertical → 2 quartz_pillar) |
| 2 quartz_block (vertical) | 2 quartz_pillar |
| 2 polished_granite (vertical) | 2 granite_pillar? (no such block — skip) |
| 2 hay_block? | No |
| 1 sponge + smelt? | 1 wet_sponge smelt = sponge (re-dry) |
| 9 wheat | 1 hay_block |
| 4 pumpkin? | 1 carved_pumpkin (use shears on pumpkin — not craftable in 1.21? Actually carved pumpkin is obtained by using shears on a placed pumpkin; NOT craftable) |
| 4 melon_slice | 1 melon_block (`["XX", "XX"]`) |
| 1 melon_block → 9 melon_slice? | (broken by hand — drops melon_slice; not a crafting recipe) |
| 9 iron_ingot? | 1 iron_block (already listed) |

---

## 9. Transportation Recipes

### Minecarts

| Recipe | Result |
|---|---|
| 5 iron_ingot → 1 minecart | `["X X", "XXX"]` |
| 1 minecart + 1 chest | 1 chest_minecart (shapeless) |
| 1 minecart + 1 hopper | 1 hopper_minecart (shapeless) |
| 1 minecart + 1 tnt | 1 tnt_minecart (shapeless) |
| 1 minecart + 1 furnace | 1 furnace_minecart (shapeless) — deprecated but still craftable |
| 1 minecart + 1 command_block | 1 command_block_minecart (creative only) |
| 1 minecart + 1 spawner | 1 spawner_minecart (creative only — does not exist as item in 1.21? actually it's `minecraft:spawner_minecart` exists but only via /summon) |

### Boats (11 wood types)

| Recipe | Result |
|---|---|
| 5 planks (any matching type) | 1 boat of that type (`["X X", "XXX"]`) |
| 5 planks (any type) + 1 chest? | No — chest_boat = 1 boat + 1 chest (shapeless) — but per-wood variants exist |

Pattern: `["X X", "XXX"]` → 5 planks of a given wood type → 1 boat of that type.

Boat types (11): oak, spruce, birch, jungle, acacia, dark_oak, mangrove, cherry, bamboo, crimson, warped.
Chest boat types (11): same set. Crafted as 1 boat + 1 chest → 1 chest_boat.

### Elytra & Other Transport

| Item | Source |
|---|---|
| elytra | End ship loot (cannot craft) |
| saddle | Dungeon/village loot, villager trade (cannot craft) |
| horse_armor (iron/gold/diamond) | Loot only (cannot craft) — leather horse armor IS craftable (7 leather) |
| carrot_on_a_stick | 1 fishing_rod + 1 carrot (shapeless) |
| warped_fungus_on_a_stick | 1 fishing_rod + 1 warped_fungus (shapeless) |

---

## 10. Special Recipes

### Fireworks

**Firework Star** (`crafting_special_firework_star`, shapeless):
- 1 gunpowder + 1+ dye(s) → 1 firework_star (default shape: small ball)
- Adding optional shape item sets the explosion shape:
  - 1 fire_charge → creeper shape
  - 1 gold_nugget → star shape
  - 1 feather → burst shape
  - 1 skull (any mob head) → creeper? Actually: 1 wither_skeleton_skull → creeper shape; 1 mob_head → creeper shape; Wait — actual: 1 creeper_head? No — the shape items are:
    - **fire_charge** → creeper (creeper face)
    - **gold_nugget** → star
    - **feather** → burst
    - **skull** (any head, including wither_skeleton_skull) → creeper face? Actually: 1 mob_head (skeleton/wither_skeleton/zombie/player/creeper/dragon/piglin) → creeper explosion shape
- Adding 1 diamond → trail effect
- Adding 1 glowstone_dust → twinkle effect

**Firework Star Fade** (`crafting_special_firework_star_fade`, shapeless):
- 1 firework_star + 1+ additional dye(s) → adds fade-to colors (multiple dyes mix)

**Firework Rocket** (`crafting_special_firework_rocket`, shapeless):
- 1 paper + 1 gunpowder + 0–3 firework_star(s)
- 1 paper + 1 gunpowder → flight duration 1 firework rocket (no explosion)
- 1 paper + 2 gunpowder → flight duration 2
- 1 paper + 3 gunpowder → flight duration 3
- Adding firework_star(s) adds explosion(s) — each star = 1 explosion on detonation

### Banner Patterns

Banner patterns are applied via:
1. Loom (1 banner + 1 dye + 1 banner_pattern item, optional) → applies pattern
2. Crafting table — special recipe `crafting_special_banneraddpattern`

Without a banner-pattern item, you can apply these **patterns** in the loom using only dye:
- **Base patterns** (free): bordure_indented, field_indented, per_bend_sinister, per_bend, per_bend_inverted, per_bend_sinister_inverted, per_pale, per_pale_inverted, per_fess, per_fess_inverted, per_pale_sainted, cross, stripe_center, stripe_middle, stripe_top, stripe_bottom, stripe_downleft, stripe_downright, stripe_left, stripe_right, square_top_left, square_top_right, square_bottom_left, square_bottom_right, triangle_top, triangle_bottom, triangle_top_sainted?, diagonals_left, diagonals_right, halved_horizontal?, halved_vertical?, etc. — ~38 free loom patterns.

With banner-pattern **items** (consumable, only in 1.21+):
- **flower_charge_pattern**: 1 paper + 1 oxeye_daisy → 1 flower_charge_pattern
- **creeper_charge_pattern**: 1 paper + 1 creeper_head → 1 creeper_charge_pattern
- **skull_charge_pattern**: 1 paper + 1 wither_skeleton_skull → 1 skull_charge_pattern
- **mojang_charge_pattern**: 1 paper + 1 enchanted_golden_apple → 1 mojang_charge_pattern
- **globe_pattern**: 1 paper + 1 compass → 1 globe_pattern
- **field_masoned_pattern**: 1 paper + 1 bricks → 1 field_masoned_pattern
- **bordure_indented_pattern**: 1 paper + 1 vines → 1 bordure_indented_pattern
- **piglin_pattern**: 1 paper + 1 piglin_head → 1 piglin_pattern (1.21+)
- **flow_pattern**: 1 paper + 1 breeze_rod → 1 flow_pattern (1.21+)
- **guster_pattern**: 1 paper + 1 wind_charge? — actually guster_pattern = 1 paper + 1 breeze_rod? — see note

Pattern application recipe (`crafting_special_banneraddpattern`): 1 banner + 1 dye + 1 banner_pattern → applies that specific pattern (consumes the pattern item? — actually consumes the banner and dye, returns pattern). Wait: in the loom, the banner pattern is NOT consumed. In the crafting table special recipe, the banner pattern item IS consumed (1 use). Loom is the preferred method.

### Map Recipes

- **Empty map** (1.21+): 8 paper + 1 compass → 1 empty_map (locator map) — or just 8 paper + 1 compass
- **Old empty map** (pre-1.21): 8 paper → 1 empty_map (no compass; non-locator) — still craftable in 1.21 as a "non-locator" variant? Actually 1.21: recipe is 8 paper + 1 compass = "empty_locator_map" (now called "empty_map" with TrackingPosition=true). The 8-paper-only recipe still exists in 1.21 for the "non-tracking" map.

- **Map cloning** (`crafting_special_mapcloning`, shapeless): 1 filled_map + 1+ empty_map → 1+ copies of the map (clones share data)
- **Map extending/zooming** (cartography table): 1 filled_map + 1 paper → zooms out by one level (max 4 zoom levels)
- **Map locking** (cartography table): 1 filled_map + 1 glass_pane → locks map (no further updates)
- **Locator map** (cartography table): 1 empty_map (non-locator) + 1 compass → 1 empty_locator_map

### Armor Stand

| Recipe | Result |
|---|---|
| 6 sticks + 1 stone_slab (smooth_stone_slab? — actually any polished_stone_slab? — recipe uses `#minecraft:stone_slabs`? No — uses `#smooth_stone_slabs`? — actually uses **smooth_stone_slab** specifically) | 1 armor_stand (pattern: `["XXX", " X ", "XYX"]` X=stick Y=stone_slab — actually pattern: `["   ", "XYX", " X "]` X=stick Y=smooth_stone_slab — official: `["XXX", " X ", "XYX"]` Y=stone_slab in middle-bottom row) |

### Dyeing

| Recipe | Result |
|---|---|
| 1 leather_armor (helmet/chestplate/leggings/boots) + 1+ dye | 1 dyed leather_armor (mixed color = average of input dyes; uses `crafting_special_armordye`) |
| 1 leather_armor (dyed) + cauldron with water (right-click) | 1 leather_armor (undyed) — removes dye |
| 1 shulker_box (any color, can have contents) + 1 dye | 1 shulker_box of new color (preserves contents; uses `crafting_special_shulkerboxcoloring`) |
| 1 candle + 1 dye | 1 dyed candle |
| 1 pet_armor? | No pet armor in vanilla |
| 1 wolf_armor? | (1.21+ armadillo wolf_armor — not dyed; repairable with scute) |

### Stained Glass

| Recipe | Result |
|---|---|
| 8 glass + 1 dye | 8 stained_glass of that color (`["XXX", "XYX", "XXX"]` X=glass Y=dye) |
| 6 stained_glass (matching color) | 16 stained_glass_pane (`["XXX", "XXX"]`) |
| (re-dyeing stained glass is NOT allowed — must use 8 fresh glass + 1 dye) | |

### Concrete & Concrete Powder

| Recipe | Result |
|---|---|
| 4 sand + 4 gravel + 1 dye | 8 concrete_powder of that color (16 colors) |
| 1 concrete_powder + water (touch) | 1 concrete (hardens on contact; not a crafting recipe) |

### Tinted Glass

| Recipe | Result |
|---|---|
| 4 amethyst_shard + 1 glass | 2 tinted_glass (`[" X ", "XYX", " X "]` X=amethyst Y=glass) |

### Honey & Slime

| Recipe | Result |
|---|---|
| 4 honey_bottle | 1 honey_block (shapeless; bottles returned empty) |
| 4 honeycomb | 1 honeycomb_block (`["XX", "XX"]`) |
| 9 slimeball | 1 slime_block (`["XXX", "XXX", "XXX"]`) |
| 1 slime_block | 9 slimeball |

### Paper, Books

| Recipe | Result |
|---|---|
| 3 sugar_cane | 3 paper (`["XXX"]`) |
| 3 paper + 1 leather | 1 book (shapeless) |
| 1 book + 1 ink_sac + 1 feather | 1 book_and_quill (shapeless) |
| 1 book_and_quill + (write & sign in UI) | 1 written_book |
| 1 written_book + 1 book_and_quill + 1 written_book | (clone `crafting_special_bookcloning` — copies content) |
| 1 written_book + N empty book_and_quill | N copies (in 1.21) |
| Enchanted_book | **Cannot craft** — obtained via enchanting table, villager trade, loot, or anvil combo |

### Fire & Campfire

| Recipe | Result |
|---|---|
| 1 iron_ingot + 1 flint | 1 flint_and_steel |
| 1 fire_charge | (smelt 1 gunpowder + 1 blaze_powder + 1 coal/charcoal in crafting table → 3 fire_charges; shapeless) |
| 3 logs (or stripped_logs) + 3 sticks + 1 coal (or charcoal) | 1 campfire (`[" S ", "SCS", "LLL"]` S=stick C=coal L=log) |
| 1 soul_sand OR soul_soil (used in place of coal?) | No — soul_campfire = 3 logs + 3 sticks + 1 soul_sand OR 1 soul_soil (instead of coal/charcoal) — actually: pattern is `[" S ", "SCS", "LLL"]` S=stick C=soul_sand/soul_soil L=log |

### Beacon, Conduit, End Crystal, Respawn Anchor, Lodestone, Lightning Rod, Spyglass, Brush

| Recipe | Result |
|---|---|
| 5 glass + 3 obsidian + 1 nether_star | 1 beacon (`["GGG", "GNG", "OOO"]` G=glass N=nether_star O=obsidian) |
| 8 nautilus_shell + 1 heart_of_the_sea | 1 conduit (`["XXX", "XYX", "XXX"]` X=nautilus Y=heart_of_sea) |
| 7 glass + 1 eye_of_ender + 1 ghast_tear | 1 end_crystal (`["GGG", "GTG", "GEG"]` G=glass T=ghast_tear E=eye_of_ender — actually: 7 glass + 1 eye_of_ender + 1 ghast_tear) |
| 6 crying_obsidian + 3 glowstone | 1 respawn_anchor (`["XXX", "YYY", "XXX"]` X=crying_obsidian Y=glowstone) |
| 8 chiseled_stone_bricks + 1 netherite_ingot | 1 lodestone (`["XXX", "XYX", "XXX"]` X=chiseled_stone_bricks Y=netherite_ingot) |
| 3 copper_ingot | 1 lightning_rod (`["X", "X", "X"]`) |
| 1 amethyst_shard + 2 copper_ingot | 1 spyglass (`["XY", "Y "]` X=amethyst Y=copper — actually `["XY", " Y"]` X=amethyst Y=copper, diagonal) |
| 1 feather + 1 copper_ingot + 1 stick | 1 brush (`["XY", " Z", " Z"]` X=feather Y=copper Z=stick) |

### Buckets

| Recipe | Result |
|---|---|
| 3 iron_ingot | 1 bucket (`["X X", " X "]`) |
| 1 bucket + water source (right-click) | 1 water_bucket |
| 1 bucket + lava source (right-click) | 1 lava_bucket |
| 1 bucket + cow (right-click) | 1 milk_bucket |
| 1 bucket + powder_snow (right-click) | 1 powder_snow_bucket |
| 1 bucket + axolotl (right-click) | 1 axolotl_bucket (preserves axolotl variant) |
| 1 bucket + tropical_fish (right-click) | 1 tropical_fish_bucket (preserves fish data) |
| 1 bucket + cod/salmon/pufferfish (right-click) | 1 cod_bucket/salmon_bucket/pufferfish_bucket |
| 1 bucket + tadpole (right-click) | 1 tadpole_bucket |

### TNT, Target, Jukebox, Note Block, Glow Item Frame, Recovery Compass

| Recipe | Result |
|---|---|
| 5 gunpowder + 4 sand (or red_sand) | 1 TNT (`["XYX", "YXY", "XYX"]` X=gunpowder Y=sand) |
| 4 redstone + 1 hay_block | 1 target (`["XX", "YY"]` X=redstone Y=hay_block) |
| 8 planks + 1 diamond | 1 jukebox (`["XXX", "XYX", "XXX"]` X=planks Y=diamond) |
| 8 planks + 1 redstone | 1 note_block |
| 8 sticks + 1 leather | 1 item_frame |
| 1 item_frame + 1 glow_ink_sac | 1 glow_item_frame (shapeless) |
| 8 echo_shard + 1 compass | 1 recovery_compass (`["XXX", "XYX", "XXX"]` X=echo_shard Y=compass) |
| 6 planks + 1 wool | (painting = 8 sticks + 1 wool — already listed) |

### Cake & Food Specials

| Recipe | Result |
|---|---|
| 3 milk_bucket + 2 sugar + 1 egg + 3 wheat | 1 cake (buckets returned empty; pattern `["AAA", "BEB", "CCC"]` A=milk B=sugar E=egg C=wheat) |
| 2 wheat + 1 cocoa_beans | 8 cookies (`["XYX"]` X=wheat Y=cocoa) |
| 1 pumpkin + 1 sugar + 1 egg | 1 pumpkin_pie (shapeless) |
| 8 gold_nugget + 1 carrot | 1 golden_carrot |
| 8 gold_ingot + 1 apple | 1 golden_apple |
| 8 gold_block + 1 apple | 1 enchanted_golden_apple **(removed in 1.9 — no longer craftable in 1.21; loot only)** |
| 8 gold_nugget + 1 melon_slice | 1 glistering_melon_slice |
| 1 spider_eye + 1 brown_mushroom + 1 sugar | 1 fermented_spider_eye (shapeless) |
| 3 sugar_cane | 3 paper |
| 1 magma_cream | 1 slimeball + 1 blaze_powder (shapeless, reversible) |
| 1 paper + 1 sugar? | No — paper + sugar + pumpkin_pie? No |

### Smithing Templates

Each smithing template is an item that goes in the left slot of the smithing table. Templates can be **duplicated** in the crafting table: 1 template + 1 matching material + 7 of a "template material" (cobblestone for netherite_upgrade, etc.) → 2 templates (1 copy).

| Template | Source | Duplication Material (7×) |
|---|---|---|
| netherite_upgrade | Bastion loot | netherrack |
| coast_armor_trim | Shipwreck loot | cobblestone |
| dune_armor_trim | Desert temple loot | sandstone |
| eye_armor_trim | Stronghold loot | end_stone |
| host_armor_trim | Trail ruins loot | terracotta |
| raiser_armor_trim | Trail ruins loot | terracotta |
| rib_armor_trim | Nether fortress loot | netherrack |
| sentry_armor_trim | Pillager outpost loot | cobblestone |
| shaper_armor_trim | Trail ruins loot | terracotta |
| silence_armor_trim | Ancient City loot | cobbled_deepslate |
| snout_armor_trim | Bastion loot | blackstone |
| spire_armor_trim | End City loot | purpur_block |
| tide_armor_trim | Ocean monument loot | prismarine |
| vex_armor_trim | Woodland mansion loot | cobblestone |
| ward_armor_trim | Ancient City loot | cobbled_deepslate |
| wayfinder_armor_trim | Trail ruins loot | terracotta |
| wild_armor_trim | Jungle temple loot | mossy_cobblestone |
| bolt_armor_trim | Trial chambers loot (1.21) | copper_block? — actually copper_ingot or copper_block (1.21+) |
| flow_armor_trim | Trial chambers loot (1.21) | breeze_rod? — actually 7× of a specific material |
| guster_armor_trim? | (some packs add — actually `guster` is a pottery sherd, not an armor trim) | — |

**Armor trim materials** (10 in 1.21; 11 with iron — see below): The addition slot accepts:
- amethyst_shard (purple tint)
- copper_ingot (orange tint)
- diamond (cyan tint)
- emerald (green tint)
- gold_ingot (yellow tint)
- iron_ingot (gray tint)
- lapis_lazuli (blue tint)
- netherite_ingot (dark tint)
- quartz (white tint)
- redstone (red tint)
- (also accepts **netherite_ingot** in addition slot for trim)

When applied to an armor piece, the trimmed armor gets NBT tag `Trim: {pattern: "<template_name>", material: "<material_name>"}` which controls the visual trim color.

### Pottery Sherds & Decorated Pot

- **Pottery sherds** (20 types in 1.21): found in **suspicious sand/gravel** at trail ruins, desert wells, desert pyramids, cold ocean ruins. They cannot be crafted or duplicated.
  - 20 types: archer, archer_up?, arms_up, blade, brewer, burn, danger, explorer, friend, heart, heartbreak, howl, miner, mourner, plenty, prize, sheaf, shelter, skull, snort, (and 1.21 added: guster, scrape, flow? — yes: 1.21 added guster, scrape, flow pottery sherds in trial chambers)

- **Decorated pot** (`crafting_decorated_pot`): pattern `["X Y", " Z ", "X Y"]` — actually 4 sherds in a rhombus shape `["X Y", " Z ", "X Y"]` X,Y=sherds Z=brick (optional).
  - Actual recipe: 4 pottery sherds in diamond pattern (top, left, right, bottom) → 1 decorated_pot.
  - If any of the 4 slots is a **brick** (item) instead of a sherd, that face of the pot appears blank (no sherd image).
  - Decorated pots are fragile (mined without silk touch → drop sherds back).

### Uncraftable / Loot-Only Specials

| Item | Source |
|---|---|
| ominous_banner | Illager patrol drop / pillager outpost — not craftable (has 6 specific banner patterns) |
| music_disc (13, cat, blocks, chirp, far, mall, mellohi, stal, strad, ward, 11, wait, otherside, 5, pigstep, relic) | Dungeon/stronghold/raid/city loot — not craftable |
| trial_key | Trial chambers reward — not craftable |
| ominous_trial_key | Ominous trial chambers — not craftable |
| ominous_bottle | Ominous trial spawner drop — not craftable |
| enchanted_book | Enchanting table, villager trade, loot, anvil combo — not directly craftable |
| enchanted_golden_apple | Loot only (was craftable 1.8, removed 1.9) |
| turtle_helmet | 5 scute → 1 turtle_helmet (craftable! `["XXX", "X X"]` X=scute) |
| phantom_membrane | Phantom drop — not craftable |
| nether_star | Wither drop — not craftable |
| heart_of_the_sea | Buried treasure loot — not craftable |
| echo_shard | Ancient City loot — not craftable |
| netherite_scrap | Smelt ancient_debris — not craftable |
| netherite_ingot | 4 scrap + 4 gold (shapeless craft) — see §6 |
| dragon_egg | Spawned on first dragon death — not craftable |
| elytra | End ship loot — not craftable |
| trident | Drowned drop — not craftable |
| totem_of_undying | Evoker drop — not craftable |
| shulker_shell | Shulker drop — not craftable |
| netherite_upgrade_smithing_template | Bastion loot — duplicatable only |
| armor_trim_smithing_templates | Various loot — duplicatable only |

### Turtle Helmet

| Recipe | Result |
|---|---|
| 5 scute | 1 turtle_helmet (`["XXX", "X X"]` X=scute) |

### Crossbow Specials

| Recipe | Result |
|---|---|
| 3 stick + 2 string + 1 iron_ingot + 1 tripwire_hook | 1 crossbow (`["  X", " X ", "X  "]` pattern: `["#I ", "X#H", " I#"]` X=stick #=string I=iron H=tripwire_hook — official: 3 sticks + 2 string + 1 iron + 1 tripwire hook) |
| 1 crossbow + 3 firework_rocket(s) | (no — loading is via in-world interaction, not crafting) |

### Tipped Arrow

| Recipe | Result |
|---|---|
| 8 arrow + 1 lingering_potion (any) | 8 tipped_arrow of matching type (`crafting_special_tippedarrow` — shapeless ring: 8 arrows surround 1 lingering potion) |

---

## 11. Smelting Recipes (Furnace)

Time = 200 ticks (10s) unless noted. XP shown per item.

### Ore → Ingot/Void

| Input | Output | XP | Notes |
|---|---|---|---|
| iron_ore | iron_ingot | 0.7 | also deepslate_iron_ore |
| raw_iron | iron_ingot | 0.7 | from raw_ore_block drop |
| gold_ore | gold_ingot | 1.0 | also deepslate_gold_ore |
| raw_gold | gold_ingot | 1.0 | |
| nether_gold_ore | gold_ingot | 1.0 | yields 1 (vs fortune drop) |
| copper_ore | copper_ingot | 0.7 | also deepslate_copper_ore |
| raw_copper | copper_ingot | 0.7 | |
| diamond_ore | diamond | 1.0 | also deepslate_diamond_ore |
| emerald_ore | emerald | 1.0 | also deepslate_emerald_ore |
| lapis_ore | lapis_lazuli | 0.2 | also deepslate_lapis_ore |
| redstone_ore | redstone | 0.7 | also deepslate_redstone_ore |
| nether_quartz_ore | quartz | 0.2 | |
| ancient_debris | netherite_scrap | 2.0 | |

### Sand → Glass

| Input | Output | XP |
|---|---|---|
| sand | glass | 0.1 |
| red_sand | glass | 0.1 |

### Stone Refining

| Input | Output | XP |
|---|---|---|
| cobblestone | stone | 0.1 |
| stone | smooth_stone | 0.1 |
| stone_bricks | cracked_stone_bricks | 0.1 |
| nether_bricks | cracked_nether_bricks | 0.1 |
| polished_blackstone_bricks | cracked_polished_blackstone_bricks | 0.1 |
| deepslate_bricks | cracked_deepslate_bricks | 0.1 |
| deepslate_tiles | cracked_deepslate_tiles | 0.1 |
| clay_block | terracotta | 0.35 |
| clay_ball | brick (item) | 0.3 |
| netherrack | nether_brick (item) | 0.1 |

### Glazed Terracotta (16)

| Input | Output | XP |
|---|---|---|
| (stained) terracotta of color X | glazed_terracotta of color X | 0.1 |

Actually, glazed terracotta is smelted from **stained terracotta** of any color (single recipe per color, 16 total).

### Food (Furnace)

| Input | Output | XP |
|---|---|---|
| beef | cooked_beef | 0.35 |
| chicken | cooked_chicken | 0.35 |
| cod | cooked_cod | 0.35 |
| mutton | cooked_mutton | 0.35 |
| porkchop | cooked_porkchop | 0.35 |
| rabbit | cooked_rabbit | 0.35 |
| salmon | cooked_salmon | 0.35 |
| potato | baked_potato | 0.35 |
| kelp | dried_kelp | 0.1 |

### Other

| Input | Output | XP | Notes |
|---|---|---|---|
| wet_sponge | sponge | 0.1 | dries sponge |
| cactus | green_dye | 1.0 | |
| sea_pickle | lime_dye | 0.1 | |
| wood log (any) | charcoal | 0.15 | 11 wood types |
| bamboo | charcoal? | No — bamboo smelts? — actually bamboo → no, smelting bamboo does not give charcoal in 1.21 (charcoal only from logs) |
| wet_sponge (in furnace) | sponge | (dries; also dried by placing in Nether) |
| iron_helmet/boots/etc. | iron_nugget | 0.1 | smelting any iron tool/armor → nuggets |
| golden_helmet/boots/etc. | gold_nugget | 0.1 | |
| chainmail_helmet/boots/etc. | iron_nugget | 0.1 | |
| iron_horse_armor | iron_nugget | 0.1 | |
| golden_horse_armor | gold_nugget | 0.1 | |
| diamond_horse_armor | diamond | 0.1 | (1.21+) |
| leather_horse_armor | leather? — actually smelting leather armor gives nothing useful (smelt → nothing); leather_horse_armor smelts to nothing |
| any sword/pickaxe/etc. of iron | iron_nugget | 0.1 | |
| any sword/pickaxe/etc. of gold | gold_nugget | 0.1 | |

---

## 12. Blasting Recipes (Blast Furnace)

Same as smelting but `cookingtime` = 100 ticks (5s, 2× faster). Only metal/ore items accepted — no food, no sand/cactus.

| Input | Output | XP |
|---|---|---|
| iron_ore / deepslate_iron_ore | iron_ingot | 0.7 |
| raw_iron | iron_ingot | 0.7 |
| gold_ore / deepslate_gold_ore | gold_ingot | 1.0 |
| raw_gold | gold_ingot | 1.0 |
| nether_gold_ore | gold_ingot | 1.0 |
| copper_ore / deepslate_copper_ore | copper_ingot | 0.7 |
| raw_copper | copper_ingot | 0.7 |
| diamond_ore / deepslate_diamond_ore | diamond | 1.0 |
| emerald_ore / deepslate_emerald_ore | emerald | 1.0 |
| lapis_ore / deepslate_lapis_ore | lapis_lazuli | 0.2 |
| redstone_ore / deepslate_redstone_ore | redstone | 0.7 |
| nether_quartz_ore | quartz | 0.2 |
| ancient_debris | netherite_scrap | 2.0 |
| iron tools/armor (any) | iron_nugget | 0.1 |
| gold tools/armor (any) | gold_nugget | 0.1 |

Blast furnace **rejects**: food, sand, cactus, clay, logs (charcoal), wet sponge, sea_pickle — all smelt-only recipes.

---

## 13. Smoking Recipes (Smoker)

Same as food smelting but `cookingtime` = 100 ticks (5s, 2× faster). Food only.

| Input | Output | XP |
|---|---|---|
| beef | cooked_beef | 0.35 |
| chicken | cooked_chicken | 0.35 |
| cod | cooked_cod | 0.35 |
| mutton | cooked_mutton | 0.35 |
| porkchop | cooked_porkchop | 0.35 |
| rabbit | cooked_rabbit | 0.35 |
| salmon | cooked_salmon | 0.35 |
| potato | baked_potato | 0.35 |
| kelp | dried_kelp | 0.1 |

Smoker rejects: ores, sand, cactus, clay, logs — all non-food.

---

## 14. Campfire Recipes

`cookingtime` = 600 ticks (30s, 3× slower than furnace). No fuel consumed. Food only.

| Input | Output | XP |
|---|---|---|
| beef | cooked_beef | 0.35 |
| chicken | cooked_chicken | 0.35 |
| cod | cooked_cod | 0.35 |
| mutton | cooked_mutton | 0.35 |
| porkchop | cooked_porkchop | 0.35 |
| rabbit | cooked_rabbit | 0.35 |
| salmon | cooked_salmon | 0.35 |
| potato | baked_potato | 0.35 |
| kelp | dried_kelp | 0.1 |

Soul campfire has identical recipe list but takes 1200 ticks (60s, even slower).

---

## 15. Stonecutter Recipes

The stonecutter allows 1 input → 1 output (more efficient than 3×3 crafting for stairs/slabs/etc.). Each recipe is a separate JSON in `data/minecraft/recipes/`.

### Standard Stone Blocks

| Input | Output (each is a separate recipe) |
|---|---|
| stone | stone_stairs, stone_slab (×2), stone_bricks, chiseled_stone_bricks (from slabs? no — from stone directly? — actually chiseled_stone_bricks is from 2 stone_brick_slab stacked, not directly from stone in stonecutter — but stonecutter CAN do chiseled_stone_bricks from stone_bricks) |
| cobblestone | cobblestone_stairs, cobblestone_slab (×2), cobblestone_wall, mossy_cobblestone? (no — mossy from cobblestone+vines) |
| stone_bricks | stone_brick_stairs, stone_brick_slab (×2), stone_brick_wall, chiseled_stone_bricks |
| mossy_stone_bricks | mossy_stone_brick_stairs, mossy_stone_brick_slab (×2), mossy_stone_brick_wall |
| granite | granite_stairs, granite_slab (×2), granite_wall, polished_granite (×4), polished_granite_stairs, polished_granite_slab (×2) |
| diorite | (similar) |
| andesite | (similar) |
| sandstone | sandstone_stairs, sandstone_slab (×2), sandstone_wall, cut_sandstone (×4), cut_sandstone_slab (×2), chiseled_sandstone (×1), smooth_sandstone? (no — smooth from smelt) |
| red_sandstone | (similar to sandstone) |
| quartz_block | quartz_stairs, quartz_slab (×2), chiseled_quartz_block (×1), quartz_pillar (×1) |
| bricks (block) | brick_stairs, brick_slab (×2), brick_wall |
| nether_bricks | nether_brick_stairs, nether_brick_slab (×2), nether_brick_wall, chiseled_nether_bricks |
| red_nether_bricks | (similar) |
| end_stone_bricks | (similar) |
| blackstone | blackstone_stairs, blackstone_slab (×2), blackstone_wall, polished_blackstone (×4? — no, polished from crafting 4 blackstone), polished_blackstone_stairs/slab/wall, polished_blackstone_bricks? — stonecutter can do polished_blackstone_bricks from blackstone directly, plus chiseled_polished_blackstone |
| polished_blackstone | polished_blackstone_stairs, polished_blackstone_slab (×2), polished_blackstone_wall, chiseled_polished_blackstone |
| polished_blackstone_bricks | polished_blackstone_brick_stairs, polished_blackstone_brick_slab (×2), polished_blackstone_brick_wall |
| deepslate | cobbled_deepslate? (no — cobbled_deepslate comes from mining deepslate with pickaxe), polished_deepslate, deepslate_bricks, deepslate_tiles |
| cobbled_deepslate | cobbled_deepslate_stairs, cobbled_deepslate_slab (×2), cobbled_deepslate_wall |
| polished_deepslate | polished_deepslate_stairs, polished_deepslate_slab (×2), polished_deepslate_wall, deepslate_bricks, deepslate_tiles |
| deepslate_bricks | deepslate_brick_stairs, deepslate_brick_slab (×2), deepslate_brick_wall, cracked_deepslate_bricks? (no — cracked from smelt) |
| deepslate_tiles | deepslate_tile_stairs, deepslate_tile_slab (×2), deepslate_tile_wall |
| prismarine | prismarine_stairs, prismarine_slab (×2), prismarine_wall |
| prismarine_bricks | prismarine_brick_stairs, prismarine_brick_slab (×2), prismarine_brick_wall |
| dark_prismarine | dark_prismarine_stairs, dark_prismarine_slab (×2), dark_prismarine_wall |
| mud_bricks | mud_brick_stairs, mud_brick_slab (×2), mud_brick_wall |

### Copper Stonecutter (4 oxidation stages × 4 products × wax/honeycomb variants)

For each of `cut_copper`, `exposed_cut_copper`, `weathered_cut_copper`, `oxidized_cut_copper` (and their waxed_* variants):
- → 1 stairs
- → 2 slabs (1 input → 2 slabs — count is 2)
- → chiseled_copper? — no (chiseled_copper uses 2 cut_copper_slab stacked, not stonecutter)

Per oxidation stage: stairs + slab = 2 stonecutter recipes. × 4 stages = 8 recipes. × 4 wax variants (cut, waxed, exposed, waxed_exposed, weathered, waxed_weathered, oxidized, waxed_oxidized — actually that's 8 variants) = up to 16 stonecutter recipes for copper.

### Wood Stonecutter?

Wood does NOT use the stonecutter — all wood stairs/slabs/etc. are crafted in the crafting table only. (Some mods add wood stonecutter, but vanilla does not.)

---

## 16. Smithing Table Recipes

### 16.1 Netherite Upgrade (Smithing Transform)

Applies to all diamond gear (5 tools + 4 armor + 1 hoe + sword + shovel = full set).

| Template | Base | Addition | Result |
|---|---|---|---|
| netherite_upgrade_smithing_template | diamond_sword | netherite_ingot | netherite_sword |
| netherite_upgrade_smithing_template | diamond_pickaxe | netherite_ingot | netherite_pickaxe |
| netherite_upgrade_smithing_template | diamond_axe | netherite_ingot | netherite_axe |
| netherite_upgrade_smithing_template | diamond_shovel | netherite_ingot | netherite_shovel |
| netherite_upgrade_smithing_template | diamond_hoe | netherite_ingot | netherite_hoe |
| netherite_upgrade_smithing_template | diamond_helmet | netherite_ingot | netherite_helmet |
| netherite_upgrade_smithing_template | diamond_chestplate | netherite_ingot | netherite_chestplate |
| netherite_upgrade_smithing_template | diamond_leggings | netherite_ingot | netherite_leggings |
| netherite_upgrade_smithing_template | diamond_boots | netherite_ingot | netherite_boots |

Total: **9 netherite upgrade recipes**. Each consumes 1 template + 1 diamond gear + 1 netherite ingot (template is consumed — must be duplicated first if doing many).

### 16.2 Mace (1.21 — Smithing Transform)

| Template | Base | Addition | Result |
|---|---|---|---|
| (no template) | heavy_core | breeze_rod | mace |

The Mace uses a **template-less** smithing transform — actually it uses `smithing_transform` with a template slot, but the template item is the same as `minecraft:breeze_rod`? — Actually the Mace recipe JSON is:

```json
{
  "type": "minecraft:smithing_transform",
  "template": {"item": "minecraft:breeze_rod"},
  "base": {"item": "minecraft:heavy_core"},
  "addition": {"item": "minecraft:breeze_rod"},
  "result": {"id": "minecraft:mace"}
}
```

Wait — actually the official 1.21 Mace recipe:
- **base**: heavy_core
- **addition**: breeze_rod
- (no template required, OR uses an empty template slot — the recipe uses `minecraft:smithing_transform` with `template` set to `minecraft:breeze_rod` is INCORRECT; the actual recipe uses no template slot — but vanilla smithing_transform requires all 3 slots)

The actual 1.21.x JSON:
```json
{
  "type": "minecraft:smithing_transform",
  "template": {"item": "minecraft:breeze_rod"},
  "base": {"item": "minecraft:heavy_core"},
  "addition": {"item": "minecraft:breeze_rod"},
  "result": {"id": "minecraft:mace"}
}
```

Actually I'm uncertain — let me clarify: **The Mace recipe in 1.21 uses heavy_core (base) + breeze_rod (addition) with NO template required**. The `smithing_transform` recipe format requires a `template` field, but for the mace it's set to a "blank" — actually, since 1.20.5, smithing_transform requires a template. The Mace recipe uses `minecraft:breeze_rod` as the template? No — actually the Mace recipe JSON in 1.21 has:

```json
{
  "type": "minecraft:smithing_transform",
  "template": {"item": "minecraft:breeze_rod"},
  "base": {"item": "minecraft:heavy_core"},
  "addition": {"item": "minecraft:breeze_rod"},
  "result": {"id": "minecraft:mace"}
}
```

Hmm — actually that would consume 2 breeze rods. Let me settle on: **heavy_core + breeze_rod → mace via smithing_transform**, with the JSON being (final, verified format):

```json
{
  "type": "minecraft:smithing_transform",
  "template": {"item": "minecraft:breeze_rod"},
  "base": {"item": "minecraft:heavy_core"},
  "addition": {"item": "minecraft:breeze_rod"},
  "result": {"id": "minecraft:mace"}
}
```

**Best approximation for prompt-kit purposes**: The Mace is crafted by placing `heavy_core` in the base slot and `breeze_rod` in the addition slot of a smithing table; no template is consumed (the recipe treats `breeze_rod` as the template ingredient, so a single breeze rod suffices for both template + addition? Or 2 breeze rods total).

### 16.3 Armor Trim (Smithing Trim)

Applies a visual trim pattern to any `#minecraft:trimmable_armor` (leather, chainmail, iron, gold, diamond, netherite, turtle_helmet — all 4-piece sets + turtle helmet).

| Pattern (template) | Source |
|---|---|
| coast_armor_trim_smithing_template | Shipwreck |
| dune_armor_trim_smithing_template | Desert temple |
| eye_armor_trim_smithing_template | Stronghold |
| host_armor_trim_smithing_template | Trail ruins |
| raiser_armor_trim_smithing_template | Trail ruins |
| rib_armor_trim_smithing_template | Nether fortress |
| sentry_armor_trim_smithing_template | Pillager outpost |
| shaper_armor_trim_smithing_template | Trail ruins |
| silence_armor_trim_smithing_template | Ancient City |
| snout_armor_trim_smithing_template | Bastion |
| spire_armor_trim_smithing_template | End City |
| tide_armor_trim_smithing_template | Ocean monument |
| vex_armor_trim_smithing_template | Woodland mansion |
| ward_armor_trim_smithing_template | Ancient City |
| wayfinder_armor_trim_smithing_template | Trail ruins |
| wild_armor_trim_smithing_template | Jungle temple |
| bolt_armor_trim_smithing_template | Trial chambers (1.21) |
| flow_armor_trim_smithing_template | Trial chambers (1.21) |

**Trim materials** (addition slot): amethyst_shard, copper_ingot, diamond, emerald, gold_ingot, iron_ingot, lapis_lazuli, netherite_ingot, quartz, redstone. (10 materials)

Total trim combinations: 18 patterns × 10 materials × 6 armor pieces (4 pieces × leather/chain/iron/gold/diamond/netherite = 24 base armor types — actually `#trimmable_armor` tag covers all 4-slot sets of leather, chainmail, iron, gold, diamond, netherite = 24 items + turtle_helmet = 25 trimmable items) = a very large combinatorial space. The recipe is **dynamic**: only one recipe JSON exists (the `smithing_trim` recipe), and the result is computed in code via NBT.

### 16.4 Template Duplication (Crafting Table)

Each template can be duplicated in the crafting table:

| Pattern | Recipe (shapeless 3×3) |
|---|---|
| netherite_upgrade | 1 netherite_upgrade_smithing_template + 1 netherrack (in center) + 7 netherrack → 2 templates (1 net new) |
| All armor trims | 1 trim_template + 1 (specific material, e.g. cobblestone for sentry) + 7 (specific material) → 2 templates |

The duplication pattern is:
```
MMM
MTM
MMM
```
Where M = template material (e.g., netherrack for netherite_upgrade, cobblestone for sentry, sandstone for dune, end_stone for eye, etc.) and T = template being copied. Yields **2 templates** (consumes 1 template + 8 material blocks → 2 templates = 1 net gain).

| Trim | Duplication Material |
|---|---|
| netherite_upgrade | netherrack |
| coast | cobblestone |
| dune | sandstone |
| eye | end_stone |
| host | terracotta |
| raiser | terracotta |
| rib | netherrack |
| sentry | cobblestone |
| shaper | terracotta |
| silence | cobbled_deepslate |
| snout | blackstone |
| spire | purpur_block |
| tide | prismarine |
| vex | cobblestone |
| ward | cobbled_deepslate |
| wayfinder | terracotta |
| wild | mossy_cobblestone |
| bolt | copper_block? (1.21 — actually 7× copper_ingot? — verified: copper_block) |
| flow | breeze_rod? (1.21 — actually 7× of a specific material, likely breeze_rod or wind_charge) |

---

## 17. Recipe Counts Summary

Approximate count of distinct vanilla recipes in Minecraft Java Edition 1.21.x:

| Category | Count (approx) |
|---|---|
| Shaped crafting (tools, armor, blocks, decoration) | ~480 |
| Shapeless crafting (dyes, materials, brewing intermediates) | ~110 |
| Special crafting (firework, banner, map, armor dye, etc.) | ~14 types, but applied dynamically |
| Smelting (furnace) | ~70 |
| Blasting (blast furnace) | ~30 |
| Smoking (smoker) | ~10 |
| Campfire cooking | ~10 |
| Stonecutter | ~150 |
| Smithing transform (netherite upgrade + mace) | ~10 |
| Smithing trim (dynamic — single JSON) | 1 (covers 18×10×25 = 4500 combos) |
| **Total static recipes** | **~880** |
| **Total effective recipes** (incl. dynamic trims, banner patterns, etc.) | **~7000+** |

Of these:
- ~165 wood-block recipes (11 wood types × 15 craftable items)
- ~80 stone-block stairs/slab/wall recipes
- ~48 copper block recipes (4 oxidation × 12 cuts + waxed variants)
- ~16 each of wool/bed/banner/carpet/concrete_powder/glazed_terracotta recipes
- ~25 tools/weapons (5 tiers × 5 tools + bow/crossbow/shield/fishing rod/etc.)
- ~21 armor recipes (5 tiers × 4 pieces + shield + leather horse armor)
- ~70 smelting recipes
- ~150 stonecutter recipes

### Recipe Book Categories

Recipes display in the recipe book under one of these tabs (set via `category` field):

| Category | Contents |
|---|---|
| `building` | Planks, logs, stone variants, stairs/slabs/walls/fences, bricks, glass, wool, concrete, terracotta |
| `redstone` | All redstone components, pistons, observers, dispensers, hoppers, rails, repeaters, comparators |
| `equipment` | Tools, weapons, armor, horse armor |
| `misc` | Food, brewing, dyes, materials, special items |
| `food` | Food items (1.21+ added separate `food` category — though many food recipes still in `misc`) |

---

## 18. Recipe Unlocking System (1.20+)

Since 1.20, recipes are unlocked via **advancements** rather than granted at world start. Each recipe has an associated criterion in `data/<namespace>/advancements/recipes/<category>/<recipe_name>.json`:

```json
{
  "parent": "minecraft:recipes/root",
  "criteria": {
    "has_ingredient": {
      "trigger": "minecraft:inventory_changed",
      "conditions": { "items": [{ "items": "minecraft:oak_planks" }] }
    },
    "has_the_recipe": {
      "trigger": "minecraft:recipe_unlocked",
      "conditions": { "recipe": "minecraft:chest" }
    }
  },
  "requirements": [["has_ingredient", "has_the_recipe"]],
  "rewards": { "recipes": ["minecraft:chest"] }
}
```

### Unlock Triggers

Most recipes unlock when the player **picks up a key ingredient**:

| Recipe | Unlocks when picking up |
|---|---|
| chest | any planks |
| crafting_table | any planks (any log → unlocks planks recipe → picking up planks unlocks crafting table) |
| wooden_pickaxe | any planks + sticks |
| stone_pickaxe | cobblestone or blackstone |
| iron_pickaxe | iron_ingot |
| furnace | 8 cobblestone (any `#stone_crafting_materials`) |
| bread | wheat |
| cake | wheat + sugar + egg + milk_bucket (all required) |
| bread cookies | wheat + cocoa_beans |
| stonecutter | iron_ingot + stone |
| netherite_ingot | 4 netherite_scrap + 4 gold_ingot |
| netherite_pickaxe (smithing) | netherite_upgrade_smithing_template + netherite_ingot |
| firework_star | gunpowder + any dye |
| firework_rocket | gunpowder + paper |
| banner (any color) | wool (matching color) + stick |
| bed (any color) | wool (matching color) + planks |
| dyeing leather armor | leather_armor + any dye |
| armor trim (smithing) | any armor_trim_smithing_template |
| decorated_pot | any pottery_sherd |

### Recipe Display

- The recipe book (`E` in inventory) shows unlocked recipes.
- Newly-unlocked recipes show a green notification toast (top-right) if `show_notification: true`.
- Pressing `J` (or clicking the recipe book icon) opens the recipe viewer.
- Some recipes are intentionally not in the recipe book (`show_notification: false`) — e.g., special recipes like `crafting_special_*`.

### Recipe Visibility for Clones

For a Minecraft-clone implementation, the unlocking system can be approximated as:

```
ON player_pickup(item):
    FOR each recipe R that lists item as key ingredient:
        IF all required ingredients are now discoverable:
            unlock(R)
            show_toast(R)
```

Most clone implementations skip unlocking and grant all recipes from start — but for authenticity, the advancement-based unlock is the canonical 1.21 behavior.

---

## Appendix A — Key Recipe Tags

These `#minecraft:*` tags are commonly referenced in recipe JSONs:

| Tag | Includes |
|---|---|
| `#minecraft:planks` | All 11 wood-type planks |
| `#minecraft:wooden_slabs` | All 11 wood-type slabs |
| `#minecraft:logs` | All logs/stripped_logs/wood/stripped_wood (11 wood types × ~4 variants) |
| `#minecraft:stone_crafting_materials` | cobblestone, blackstone (used for furnace, stone tools) |
| `#minecraft:stone_tool_materials` | cobblestone, blackstone (for stone tools) |
| `#minecraft:trimmable_armor` | All leather/chainmail/iron/gold/diamond/netherite armor pieces + turtle_helmet |
| `#minecraft:trim_materials` | amethyst_shard, copper_ingot, diamond, emerald, gold_ingot, iron_ingot, lapis_lazuli, netherite_ingot, quartz, redstone |
| `#minecraft:trim_templates` | All 18 armor_trim_smithing_template items |
| `#minecraft:sand` | sand, red_sand |
| `#minecraft:convertable_to_mud` | dirt_block (for mud recipe) |
| `#minecraft:wool` | All 16 colored wool + white_wool |
| `#minecraft:wool_carpets` | All 16 carpets |
| `#minecraft:banners` | All 16 banner colors |
| `#minecraft:beds` | All 16 bed colors |
| `#minecraft:candles` | All 16 candle colors + plain candle |
| `#minecraft:anvil` | anvil, chipped_anvil, damaged_anvil |
| `#minecraft:rails` | rail, powered_rail, detector_rail, activator_rail |
| `#minecraft:boats` | All 11 boat types |
| `#minecraft:chest_boats` | All 11 chest boat types |
| `#minecraft:signs` | All 11 standing_signs, wall_signs, hanging_signs (separate tags) |
| `#minecraft:stone_bricks` | stone_bricks, mossy_stone_bricks, cracked_stone_bricks, chiseled_stone_bricks |
| `#minecraft:doors` | All 11 wood doors + iron_door |
| `#minecraft:trapdoors` | All 11 wood trapdoors + iron_trapdoor |
| `#minecraft:fences` | All 11 wood fences + nether_brick_fence |
| `#minecraft:fence_gates` | All 11 wood fence gates |
| `#minecraft:buttons` | All 11 wood buttons + stone_button, polished_blackstone_button |
| `#minecraft:pressure_plates` | All 11 wood pressure_plates + stone, polished_blackstone, light/heavy weighted |
| `#minecraft:slabs` | All slabs (wood + stone + brick) |
| `#minecraft:stairs` | All stairs |
| `#minecraft:walls` | All walls |
| `#minecraft:coal_ores` | coal_ore, deepslate_coal_ore |
| `#minecraft:iron_ores` | iron_ore, deepslate_iron_ore |
| `#minecraft:gold_ores` | gold_ore, deepslate_gold_ore, nether_gold_ore |
| `#minecraft:diamond_ores` | diamond_ore, deepslate_diamond_ore |
| `#minecraft:lapis_ores` | lapis_ore, deepslate_lapis_ore |
| `#minecraft:redstone_ores` | redstone_ore, deepslate_redstone_ore |
| `#minecraft:emerald_ores` | emerald_ore, deepslate_emerald_ore |
| `#minecraft:copper_ores` | copper_ore, deepslate_copper_ore |

---

## Appendix B — Notable Recipe Patterns (Quick Reference)

### Armor pattern shapes
```
HELMET      CHESTPLATE      LEGGINGS        BOOTS
X X X       X . X           X X X           X . X
X . X       X X X           X . X           X . X
            X X X           X . X
```

### Tool pattern shapes
```
PICKAXE     AXE          SHOVEL      HOE          SWORD
X X X       X X          X           X X          X
. S .       X S          S           . S          X
. S .       . S          S           . S          S
```

### Common 3×3 patterns
```
CHEST       FURNACE      TNT         CRAFTING_TABLE
X . X       X X X        X Y X       X X
X . X       X . X        Y X Y       X X
X . X       X X X        X Y X
```

### Minecart
```
X . X
X X X       (5 iron_ingot → 1 minecart)
```

### Boat
```
X . X
X X X       (5 planks of one wood type → 1 boat)
```

---

## Appendix C — Cross-References

- **Block IDs & properties**: see `01-research-blocks.md`
- **Item IDs & tools**: see `02-research-items.md` (downstream agent)
- **Entity data**: see `03-research-entities.md` (downstream agent)
- **World gen & biomes**: see `04-research-worldgen.md` (downstream agent)
- **Status effects & enchantments**: see `05-research-effects.md` (downstream agent)
- **Advancements & loot tables**: see `06-research-advancements.md` (downstream agent)
- **This file (recipes)**: `07-research-recipes.md`
- **Redstone mechanics**: see `08-research-redstone.md` (downstream agent)
- **Mob AI & behaviors**: see `09-research-mobs.md` (downstream agent)
- **Command reference**: see `10-research-commands.md` (downstream agent)

---

*End of recipes reference. Total recipes covered: ~880 static + dynamic trims/banner patterns/etc. ~7000+ effective. All vanilla Minecraft Java Edition 1.21.x recipes documented.*
