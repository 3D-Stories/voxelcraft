# Minecraft Java Edition 1.21.x — Items Reference (Prompt Kit)

**Scope:** Every item in Minecraft Java Edition (1.21.x) for an AI building a Minecraft clone.
**Purpose:** Dense, table-driven reference. Real data values where possible.
**Companion files:** `01-research-blocks.md` (blocks), `03-research-entities.md` (entities, planned), `04-research-recipes.md` (recipes, planned).

---

## Table of Contents

1. [Item Property Reference](#1-item-property-reference)
2. [Item Categories Overview](#2-item-categories-overview)
3. [Tools & Weapons](#3-tools--weapons)
   - 3.1 [Tool Material Tier Matrix](#31-tool-material-tier-matrix)
   - 3.2 [Pickaxes](#32-pickaxes)
   - 3.3 [Axes](#33-axes)
   - 3.4 [Shovels](#34-shovels)
   - 3.5 [Hoes](#35-hoes)
   - 3.6 [Swords](#36-swords)
   - 3.7 [Ranged & Special Weapons](#37-ranged--special-weapons)
4. [Armor](#4-armor)
   - 4.1 [Armor Material Matrix](#41-armor-material-matrix)
   - 4.2 [Helmets](#42-helmets)
   - 4.3 [Chestplates](#43-chestplates)
   - 4.4 [Leggings](#44-leggings)
   - 4.5 [Boots](#45-boots)
   - 4.6 [Horse Armor](#46-horse-armor)
5. [Food & Drink](#5-food--drink)
   - 5.1 [Raw & Cooked Meats](#51-raw--cooked-meats)
   - 5.2 [Fish](#52-fish)
   - 5.3 [Crops & Plant Food](#53-crops--plant-food)
   - 5.4 [Prepared Foods & Soups](#54-prepared-foods--soups)
   - 5.5 [Special Food (Golden Apple, Chorus, Honey)](#55-special-food-golden-apple-chorus-honey)
   - 5.6 [Suspicious Stew Variants](#56-suspicious-stew-variants)
   - 5.7 [Potions](#57-potions)
   - 5.8 [Tipped Arrows](#58-tipped-arrows)
6. [Materials](#6-materials)
   - 6.1 [Ores, Ingots, Nuggets, Gems, Dusts](#61-ores-ingots-nuggets-gems-dusts)
   - 6.2 [Mob Drops](#62-mob-drops)
   - 6.3 [Plant Materials](#63-plant-materials)
   - 6.4 [Compound & Rare Materials](#64-compound--rare-materials)
7. [Redstone Items](#7-redstone-items)
8. [Transportation](#8-transportation)
9. [Miscellaneous](#9-miscellaneous)
10. [Spawn Eggs](#10-spawn-eggs)
11. [Enchantments](#11-enchantments)
12. [Status Effects](#12-status-effects)
13. [Durability & Tool Tier Comparison Matrix](#13-durability--tool-tier-comparison-matrix)
14. [Fuel Values Table](#14-fuel-values-table)
15. [Food Nutrition & Saturation Comparison](#15-food-nutrition--saturation-comparison)
16. [Stacking Rules, NBT Data & Special Behaviors](#16-stacking-rules-nbt-data--special-behaviors)

---

## 1. Item Property Reference

Items in Minecraft carry components (data components since 1.20.5, replacing old NBT). Each item type has a default set of properties.

| Property | Type | Description |
|----------|------|-------------|
| `id` | ResourceLocation | e.g. `minecraft:diamond_sword` |
| `max_stack_size` | int (1..64) | Default 64; tools/armor/buckets = 1; ender pearls/snowballs = 16 |
| `max_damage` | int | Max durability for damageable items (0 = not damageable) |
| `enchantability` | int | Higher = better enchantment rolls (gold 22, wood 15, etc.) |
| `rarity` | enum | `common` (white), `uncommon` (yellow), `rare` (aqua), `epic` (light purple) |
| `use_duration` | int (ticks) | Time to consume food (32 = 1.6s), draw bow (72000 = instant release) |
| `use_animation` | enum | `none`, `eat`, `drink`, `block`, `bow`, `spear`, `crossbow`, `brush`, `toot_horn` |
| `food` | component | `nutrition`, `saturation`, `can_always_eat`, `effects` |
| `fuel` | int (ticks via `fuel` tag) | Burn time in furnace (200 ticks = 1 item) |
| `custom_data` | NBT | Arbitrary custom data preserved on stack |
| `damage` | int (0..max) | Current damage for tools/armor |
| `enchantments` | map | Enchantment ID → level |
| `enchantment_glint_override` | bool | Force glint on/off |
| `repair_cost` | int | Anvil cost incrementer |
| `intangible_projectile` | bool | Cannot be picked up |
| `fire_resistant` | bool | Item survives lava (netherite items) |
| `creative_slot_lock` | bool | Locked in creative hotbar |
| `lore` | list<Text> | Tooltip lore lines |
| `custom_name` | Text | Renamed via anvil |
| `item_name` | Text | Default display name |
| `hide_additional_tooltip` | bool | Hides durability/enchant/etc. |
| `hide_tooltip` | bool | Hides entire tooltip |
| `damage_resistant` | tag | Damage types item ignores |
| `ominous_bottle_amplifier` | int | Bad Omen level for ominous bottles |
| `pottery_pattern` | ResourceLocation | Pattern for pottery sherds |
| `trim` | component | Armor trim material + pattern |
| `jukebox_playable` | ResourceLocation | Music disc song |

### Stack Size Categories

| Stack Size | Examples |
|-----------|----------|
| 1 | All tools, armor, weapons, buckets, mushroom stew, suspicious stew, honey bottle, potions, written books, banners, minecarts, boats, ender pearls... actually ender pearls = 16 |
| 16 | End pearls, snowballs, eggs, signs (16), banners, beds, boats, minecarts, doors (16), beds (16), buckets? (16)... see table below |
| 64 (default) | All blocks, ingots, gems, dusts, mob drops, plant materials, food (most), arrows, bone meal |

Items that stack to 16: `ender_pearl`, `snowball`, `egg`, `sign` (all 12 wood + bamboo, oak..cherry, mangrove, bamboo, crimson, warped = 16 types), `hanging_sign`, `bed` (16 colors), `boat` (6 wood + bamboo + 6 chest boats), `minecart` variants (6 types), `bucket` (water/lava/milk/powder snow = 1 each — empty bucket stacks to 16), `banner` (32 patterns × 16 colors, stack to 16), `door` (all wood + iron doors stack to 16), `armor_stand`, `saddle`, `decorated_pot` (16), `end_crystal` (64), `experience_bottle` (64).

Items that stack to 1: all tools, weapons, armor, fishing rod, shears, flint and steel, shield, bow, crossbow, trident, mace, brush, carrot-on-a-stick, warped-fungus-on-a-stick, potion bottles (incl. splash/lingering), honey bottle, mushroom stew, beetroot soup, rabbit stew, suspicious stew, written book, enchanting book? (16), writable book (1), map (1), filled map (1), goat horn, music disc (1), banner pattern? (1), pottery sherd (64), smithing template (1), ominous bottle (1).

### Enchantability by Tier

| Tier | Enchantability |
|------|----------------|
| Golden | 22 |
| Wooden | 15 |
| Netherite | 15 |
| Diamond | 10 |
| Iron | 14 |
| Stone | 5 |
| Chainmail (armor) | 12 |
| Leather (armor) | 15 |
| Turtle shell | 9 |
| Book | 1 |

### Rarity Color Coding

| Rarity | Color | Examples |
|--------|-------|----------|
| Common | white | Most items |
| Uncommon | yellow | Enchanted Book (treasure), Music Discs (some), Nether Star, Netherite Scrap, Bottle o' Enchanting, Emerald, Diamond, Elytra, Heart of the Sea, End Crystal, Wither Skeleton Skull, Beacon, Conduit, End Portal Frame, Banner Pattern, Dragon Egg, Ender Dragon Spawn Egg |
| Rare | aqua | Beacon, Chain (block), Cobweb, Diamond Horse Armor, Gold Apple (regular), Enchanted Golden Apple, Nether Star, Totem of Undying, Wither Skeleton Skull, Music Discs, Elytra, Heart of the Sea, Dragon Breath |
| Epic | light purple | Enchanted Golden Apple, Nether Star, Beacon, Elytra (no — uncommon), Totem of Undying, Wither Skeleton Skull, Music Disc "Pigstep", "otherside", "5", "Relic", End Crystal, Command Block, Barrier, Jigsaw Block, Structure Block, Dragon Egg, Wither Skull |

(Note: many sources conflict on exact rarity. 1.21 defines rarities via `minecraft:rarity` component; see Appendix for full list.)

---

## 2. Item Categories Overview

| Category | Count (approx) | Examples |
|----------|----------------|----------|
| Tools (pickaxe/axe/shovel/hoe/sword) | 30 | 5 tools × 6 materials |
| Ranged/Special Weapons | 10 | bow, crossbow, trident, mace, shield, fishing rod, flint and steel, shears, brush, carrot-on-a-stick |
| Armor (4 pieces × 6 materials) | 24 + horse armor 4 | leather, gold, chain, iron, diamond, netherite |
| Food & Drink | ~50 | meats, fish, crops, prepared, special |
| Potions (incl. variants) | ~80 | base, splash, lingering, tipped arrows |
| Materials (drops/ores) | ~80 | ingots, gems, mob drops, plant materials |
| Redstone | ~40 | dust, repeater, comparator, pistons, hoppers, etc. |
| Transportation | ~15 | minecarts (6), boats (12), elytra |
| Decoration/Misc | ~200 | dyes (16), banners (16), spawn eggs (~80), music discs (16), pottery sherds (~20), smithing templates (~17), armor trims |
| **Total items (1.21.x)** | **~1580** | |

---

## 3. Tools & Weapons

### 3.1 Tool Material Tier Matrix

Each tool tier has `tier` component containing: `level` (mining level), `speed` (mining speed multiplier), `durability` (uses before breaking), and `enchantment_value`.

| Material | ID | Mining Level | Mining Speed | Durability | Enchantability | Attack Damage Bonus | Repair Item |
|----------|----|--------------|--------------|------------|----------------|---------------------|-------------|
| Wood | `wood` | 0 | 2.0 | 59 | 15 | 0 | planks |
| Gold | `gold` | 0 | 12.0 | 32 | 22 | 0 | gold ingot |
| Stone | `stone` | 1 | 4.0 | 131 | 5 | 1 | cobblestone (or blackstone) |
| Iron | `iron` | 2 | 6.0 | 250 | 14 | 2 | iron ingot |
| Diamond | `diamond` | 3 | 8.0 | 1561 | 10 | 3 | diamond |
| Netherite | `netherite` | 4 | 9.0 | 2031 | 15 | 4 | netherite ingot |

**Mining level gates:**
- Level 0: stone, coal ore, netherrack, dirt, sand, etc.
- Level 1: iron ore, copper ore, lapis ore (technically level 1+)
- Level 2: gold ore, redstone ore, diamond ore, emerald ore, deepslate variants
- Level 3: ancient debris (requires diamond pickaxe)
- Level 4: obsidian technically only needs level 3, but netherite is highest tier
- NeedsDiamond: obsidian, crying obsidian, respawn anchor, netherite block, ancient debris

### 3.2 Pickaxes

| Item ID | Durability | Mining Speed | Attack Damage | Attack Speed | DPS |
|---------|-----------|--------------|---------------|--------------|-----|
| `wooden_pickaxe` | 59 | 2.0 | 2 | 1.2 | 2.4 |
| `golden_pickaxe` | 32 | 12.0 | 2 | 1.2 | 2.4 |
| `stone_pickaxe` | 131 | 4.0 | 3 | 1.2 | 3.6 |
| `iron_pickaxe` | 250 | 6.0 | 4 | 1.2 | 4.8 |
| `diamond_pickaxe` | 1561 | 8.0 | 5 | 1.2 | 6.0 |
| `netherite_pickaxe` | 2031 | 9.0 | 6 | 1.2 | 7.2 |

### 3.3 Axes

| Item ID | Durability | Mining Speed | Attack Damage | Attack Speed | DPS | Notes |
|---------|-----------|--------------|---------------|--------------|-----|-------|
| `wooden_axe` | 59 | 2.0 | 7 | 0.8 | 5.6 | Disables shields for 5s (Java) |
| `golden_axe` | 32 | 12.0 | 7 | 1.0 | 7.0 | |
| `stone_axe` | 131 | 4.0 | 9 | 0.9 | 8.1 | |
| `iron_axe` | 250 | 6.0 | 9 | 1.0 | 9.0 | |
| `diamond_axe` | 1561 | 8.0 | 9 | 1.0 | 9.0 | |
| `netherite_axe` | 2031 | 9.0 | 10 | 1.0 | 10.0 | |

### 3.4 Shovels

| Item ID | Durability | Mining Speed | Attack Damage | Attack Speed | DPS |
|---------|-----------|--------------|---------------|--------------|-----|
| `wooden_shovel` | 59 | 2.0 | 2 | 1.0 | 2.0 |
| `golden_shovel` | 32 | 12.0 | 2 | 1.0 | 2.0 |
| `stone_shovel` | 131 | 4.0 | 3 | 1.0 | 3.0 |
| `iron_shovel` | 250 | 6.0 | 4 | 1.0 | 4.0 |
| `diamond_shovel` | 1561 | 8.0 | 5 | 1.0 | 5.0 |
| `netherite_shovel` | 2031 | 9.0 | 6 | 1.0 | 6.0 |

### 3.5 Hoes

| Item ID | Durability | Mining Speed | Attack Damage | Attack Speed | DPS |
|---------|-----------|--------------|---------------|--------------|-----|
| `wooden_hoe` | 59 | 1.0 | 1 | 1.0 | 1.0 |
| `golden_hoe` | 32 | 1.0 | 1 | 1.0 | 1.0 |
| `stone_hoe` | 131 | 2.0 | 1 | 2.0 | 2.0 |
| `iron_hoe` | 250 | 3.0 | 1 | 3.0 | 3.0 |
| `diamond_hoe` | 1561 | 4.0 | 1 | 4.0 | 4.0 |
| `netherite_hoe` | 2031 | 4.0 | 1 | 4.0 | 4.0 |

### 3.6 Swords

| Item ID | Durability | Attack Damage | Attack Speed | DPS | Crit Damage |
|---------|-----------|---------------|--------------|-----|-------------|
| `wooden_sword` | 59 | 4 | 1.6 | 6.4 | 6 |
| `golden_sword` | 32 | 4 | 1.6 | 6.4 | 6 |
| `stone_sword` | 131 | 5 | 1.6 | 8.0 | 7.5 |
| `iron_sword` | 250 | 6 | 1.6 | 9.6 | 9 |
| `diamond_sword` | 1561 | 7 | 1.6 | 11.2 | 10.5 |
| `netherite_sword` | 2031 | 8 | 1.6 | 12.8 | 12 |

**Sweep attack:** With `sweeping_edge` enchant, swords deal AoE damage to nearby mobs in 90° arc.

### 3.7 Ranged & Special Weapons

| Item ID | Durability | Damage | Notes |
|---------|-----------|--------|-------|
| `bow` | 384 | 6–11 (scales w/ draw time, +0–4 from power ench) | Uses arrows; enchant: Power, Punch, Flame, Infinity, Unbreaking, Mending, Curse of Vanishing |
| `crossbow` | 326 | 6–11 (projectile), 9 (firework) | Holds enchant: Quick Charge I–III, Multishot, Piercing I–IV, Unbreaking, Mending, Curse of Vanishing, Flame? No |
| `trident` | 250 | 8 melee, 8 ranged (2.0× crit on throw) | Loyalty, Channeling, Riptide, Impaling, Unbreaking, Mending, Curse of Vanishing |
| `mace` (1.21) | 500 | 5 + 0.5/4 + 1.5/4.5 ... + 25 max (Density V + 1.5 blocks/fall = up to 40+) | Enchant: Density I–V, Breach I–IV, Wind Burst I–III, Fire Aspect, Smite, Bane of Arthropods, Unbreaking, Mending, Curse of Vanishing |
| `shield` | 336 | 0 | Blocks 100% frontal damage; enchant: Unbreaking I–III, Mending, Curse of Vanishing |
| `fishing_rod` | 64 (cast) / 384 (carrot on stick)? | 0 | Enchant: Luck of the Sea, Lure, Unbreaking, Mending, Curse of Vanishing |
| `flint_and_steel` | 65 | 0 | Sets fire; uses durability |
| `shears` | 238 | 0 | Shears sheep, breaks wool/leaves/web fast; enchant: Silk Touch implicit, Unbreaking, Mending, Curse of Vanishing |
| `brush` | 64 | 0 | Excavates suspicious sand/gravel; enchant: Unbreaking, Mending, Curse of Vanishing |
| `carrot_on_a_stick` | 7 (some say 25) | 0 | Used to control saddled pig |
| `warped_fungus_on_a_stick` | 100 | 0 | Controls strider |
| `firework_rocket` | n/a | 5–7 (per firework star, ×3 for crossbow) | Used for elytra flight boost; crossbow ammo |
| `snowball` | n/a | 0 (1.9+ Java; Bedrock: 3 to blazes) | Throwable |
| `ender_pearl` | n/a | 0 + 5 fall damage | Teleports thrower, takes 5 damage on land |
| `egg` | n/a | 0 | Throwable, spawns chick 12.5% |
| `wind_charge` (1.21) | n/a | ~1 | Knocks back entities, breaks decorated pots, leaves |
| `ominous_bottle` (1.21) | n/a | 0 | Drinkable; gives Bad Omen level 1–5 |
| `trial_key` (1.21) | n/a | n/a | Opens reward vaults (common) |
| `ominous_trial_key` (1.21) | n/a | n/a | Opens ominous vaults (rare) |
| `totem_of_undying` | n/a | 0 | Held in off-hand; revives on lethal hit |
| `spyglass` | n/a | 0 | Zoom view |
| `goat_horn` | n/a | 0 | Sounds instrument; 8 variants |

**Mace damage formula (1.21):** Base 5 melee damage. Per block fallen (above 1.5 blocks), add 3 damage per block. Density enchant adds 0.5 × level per block fallen. Breach reduces target's armor effectiveness by 15% × level. Wind Burst launches player & target upward on hit.

---

## 4. Armor

### 4.1 Armor Material Matrix

| Material | Durability Multiplier | Enchantability | Toughness | Knockback Resistance | Repair Item |
|----------|----------------------|----------------|-----------|----------------------|-------------|
| Leather | 5 | 15 | 0 | 0 | leather |
| Gold | 7 | 25 | 0 | 0 | gold ingot |
| Chainmail | 15 | 12 | 0 | 0 | iron ingot |
| Iron | 15 | 9 | 0 | 0 | iron ingot |
| Turtle (helmet only) | 25 | 9 | 0 | 0 | scute |
| Diamond | 33 | 10 | 2 | 0 | diamond |
| Netherite | 37 | 15 | 3 | 0.1 | netherite ingot |

Armor durability multiplier × base durability per slot:
- Helmet base: 11
- Chestplate base: 16
- Leggings base: 15
- Boots base: 13

### 4.2 Helmets

| Item ID | Defense Points | Durability | Toughness | Notes |
|---------|----------------|------------|-----------|-------|
| `leather_helmet` | 1 | 55 | 0 | Dyable |
| `golden_helmet` | 2 | 77 | 0 | |
| `chainmail_helmet` | 2 | 165 | 0 | Cannot craft |
| `iron_helmet` | 2 | 165 | 0 | |
| `turtle_helmet` | 2 | 275 | 0 | Drops from turtles; gives 10s Water Breathing when worn w/ full set broken? No — only when entering water after wearing. Actually: gives 10s Water Breathing when you surface from water while wearing it. |
| `diamond_helmet` | 3 | 363 | 2 | |
| `netherite_helmet` | 3 | 407 | 3 | Fire resistant; KB resist 0.1 |

### 4.3 Chestplates

| Item ID | Defense Points | Durability | Toughness |
|---------|----------------|------------|-----------|
| `leather_chestplate` | 3 | 80 | 0 |
| `golden_chestplate` | 5 | 112 | 0 |
| `chainmail_chestplate` | 5 | 240 | 0 |
| `iron_chestplate` | 6 | 240 | 0 |
| `diamond_chestplate` | 8 | 528 | 2 |
| `netherite_chestplate` | 8 | 592 | 3 |

### 4.4 Leggings

| Item ID | Defense Points | Durability | Toughness |
|---------|----------------|------------|-----------|
| `leather_leggings` | 2 | 75 | 0 |
| `golden_leggings` | 3 | 105 | 0 |
| `chainmail_leggings` | 4 | 225 | 0 |
| `iron_leggings` | 5 | 225 | 0 |
| `diamond_leggings` | 6 | 495 | 2 |
| `netherite_leggings` | 6 | 555 | 3 |

### 4.5 Boots

| Item ID | Defense Points | Durability | Toughness |
|---------|----------------|------------|-----------|
| `leather_boots` | 1 | 65 | 0 |
| `golden_boots` | 1 | 91 | 0 |
| `chainmail_boots` | 1 | 195 | 0 |
| `iron_boots` | 2 | 195 | 0 |
| `diamond_boots` | 3 | 429 | 2 |
| `netherite_boots` | 3 | 481 | 3 |

**Total set defense points:** Leather 7, Gold 11, Chainmail 12, Iron 15, Diamond 20, Netherite 20.

### 4.6 Horse Armor

| Item ID | Defense | Durability | Source |
|---------|---------|------------|--------|
| `leather_horse_armor` | 3 ( protection: 3-5?) | n/a | Crafted from 7 leather; dyable |
| `iron_horse_armor` | 5 (protection 5) | n/a | Dungeon loot |
| `golden_horse_armor` | 7 (protection 7) | n/a | Dungeon loot |
| `diamond_horse_armor` | 11 (protection 11) | n/a | Dungeon loot |

Horse armor has no durability (cannot break). Cannot be enchanted in survival.

### Wolf Armor (1.21)
| Item ID | Durability | Notes |
|---------|------------|-------|
| `wolf_armor` | 64 | Crafted from 6 armadillo scutes; repairable with scute; can be dyed |

---

## 5. Food & Drink

### Food Property Schema
Each food has: `nutrition` (hunger restored), `saturation_modifier` (saturation = nutrition × 2 × modifier), `use_duration` (ticks, default 32 = 1.6s), `can_always_eat` (golden apple, etc.), `effects` (status effect chance).

**Total saturation formula:** `saturation_added = nutrition × saturation_modifier × 2`

### 5.1 Raw & Cooked Meats

| Item ID | Hunger | Saturation | Use Time | Effects |
|---------|--------|------------|----------|---------|
| `beef` | 3 | 1.8 | 32 | — |
| `cooked_beef` | 8 | 12.8 | 32 | — |
| `porkchop` | 3 | 1.8 | 32 | — |
| `cooked_porkchop` | 8 | 12.8 | 32 | — |
| `mutton` | 2 | 1.2 | 32 | — |
| `cooked_mutton` | 6 | 9.6 | 32 | — |
| `chicken` | 2 | 1.2 | 32 | 30% Hunger 30s |
| `cooked_chicken` | 6 | 7.2 | 32 | — |
| `rabbit` | 3 | 1.8 | 32 | — |
| `cooked_rabbit` | 5 | 6 | 32 | — |
| `rotten_flesh` | 4 | 0.8 | 32 | 80% Hunger 30s |
| `spider_eye` | 2 | 3.2 | 32 | Poison 4s (no chance, always) |

### 5.2 Fish

| Item ID | Hunger | Saturation | Effects |
|---------|--------|------------|---------|
| `cod` | 2 | 0.4 | — |
| `cooked_cod` | 5 | 6 | — |
| `salmon` | 2 | 0.4 | — |
| `cooked_salmon` | 6 | 9.6 | — |
| `tropical_fish` | 1 | 0.2 | — |
| `pufferfish` | 1 | 0.2 | Nausea 15s, Hunger 15s, Poison 60s |
| `clownfish` (now tropical fish) | 1 | 0.2 | — |

### 5.3 Crops & Plant Food

| Item ID | Hunger | Saturation | Notes |
|---------|--------|------------|-------|
| `apple` | 4 | 2.4 | Drops from oak/dark oak leaves (0.5%) |
| `melon_slice` | 2 | 1.2 | From melon block |
| `sweet_berries` | 2 | 0.4 | Grows on sweet berry bush; 3 stages |
| `glow_berries` | 2 | 0.4 | From cave vines; gives light |
| `carrot` | 3 | 3.6 | Crops |
| `golden_carrot` | 6 | 14.4 | Best saturation food |
| `potato` | 1 | 0.6 | Crops |
| `baked_potato` | 5 | 6 | Smelted |
| `poisonous_potato` | 2 | 1.2 | 60% Poison 5s |
| `beetroot` | 1 | 1.2 | Crops |
| `wheat` | n/a | n/a | Not edible; used in crafting |
| `dried_kelp` | 1 | 0.6 | Smelted kelp; eats fast (17 ticks) |
| `chorus_fruit` | 4 | 2.4 | Teleports player randomly within 8 blocks |
| `cookie` | 2 | 0.4 | Crafted from wheat + cocoa |

### 5.4 Prepared Foods & Soups

| Item ID | Hunger | Saturation | Use Time | Notes |
|---------|--------|------------|----------|-------|
| `bread` | 5 | 6 | 32 | Crafted from 3 wheat |
| `pumpkin_pie` | 8 | 4.8 | 32 | Pumpkin + sugar + egg |
| `cake` (block, 7 slices) | 2/slice | 0.4/slice | 1 (instant) per bite | 14/2.8 total |
| `mushroom_stew` | 6 | 7.2 | 32 | Returns bowl |
| `beetroot_soup` | 6 | 7.2 | 32 | Returns bowl |
| `rabbit_stew` | 10 | 12 | 32 | Best single-item food |
| `suspicious_stew` | 6 | 7.2 | 32 | Returns bowl; effect varies (see 5.6) |
| `honey_bottle` | 6 | 1.2 | 40 | Cures Poison; returns glass bottle |

### 5.5 Special Food (Golden Apple, Chorus, Honey)

| Item ID | Hunger | Saturation | Effects | Notes |
|---------|--------|------------|---------|-------|
| `golden_apple` | 4 | 9.6 | Regeneration II 5s (Java: II; Bedrock: I 5s), Absorption I 2m | Always eatable |
| `enchanted_golden_apple` | 4 | 9.6 | Regeneration V (Java) / II 20s (Bedrock), Absorption IV 2m, Fire Resistance 5m, Resistance I 5m | Rare loot; rare; cannot craft |
| `chorus_fruit` | 4 | 2.4 | Teleport random within 8 blocks horizontal, 2 blocks vertical | Cannot pass walls |
| `honey_bottle` | 6 | 1.2 | Cures Poison (clears effect) | Stack to 16 |
| `milk_bucket` | 0 | 0 | Clears ALL status effects | Returns bucket |
| `ominous_bottle` (1.21) | 0 | 0 | Bad Omen (level varies 1–5) | Returns glass bottle |

### 5.6 Suspicious Stew Variants

Crafted with a flower (or found in shipwreck supply chests); gives a random effect based on flower used. Duration 6s unless noted.

| Flower Used | Effect | Duration |
|-------------|--------|----------|
| Allium | Fire Resistance | 4s |
| Azure Bluet | Blindness | 8s |
| Blue Orchid | Saturation | 0.35s |
| Cornflower | Jump Boost | 6s |
| Dandelion | Saturation | 0.35s |
| Lily of the Valley | Poison | 12s |
| Oxeye Daisy | Weakness | 9s |
| Poppy | Night Vision | 6s |
| Torchflower | Saturation | 0.35s |
| Tulip (any) | Weakness | 9s |
| Wither Rose | Wither | 8s |
| Cornflower (alt) | Saturation | 0.35s |

### 5.7 Potions

All potions are 3:00 (180s) normal, 8:00 (480s) extended (Redstone), 1:30 (90s) strong (Glowstone). Splash potions: same durations, splash-activated. Lingering potions: 0:45 (normal/strong), 0:22 extended — creates effect cloud.

**Base potions (no effect):**
- `potion` (water bottle)
- `awkward_potion` (brewed from nether wart) — base for all effect potions
- `thick_potion` (glowstone dust on water bottle) — unused
- `mundane_potion` (redstone on water bottle) — unused
- `strong_potion` / `long_potion` — unused base

**Effect potions (Drinkable / Splash / Lingering variants each):**

| Effect Potion | Effect | Duration (Normal) | Strong | Extended |
|---------------|--------|-------------------|--------|----------|
| `potion_of_regeneration` | Regeneration I | 0:45 | II 0:22 | I 1:30 |
| `potion_of_swiftness` | Speed I | 3:00 | II 1:30 | I 8:00 |
| `potion_of_strength` | Strength I | 3:00 | II 1:30 | I 8:00 |
| `potion_of_healing` | Instant Health I | instant | II instant | — |
| `potion_of_night_vision` | Night Vision | 3:00 | — | 8:00 |
| `potion_of_invisibility` | Invisibility | 3:00 | — | 8:00 |
| `potion_of_water_breathing` | Water Breathing | 3:00 | — | 8:00 |
| `potion_of_leaping` | Jump Boost I | 3:00 | II 1:30 | I 8:00 |
| `potion_of_slow_falling` | Slow Falling | 1:30 | — | 4:00 |
| `potion_of_fire_resistance` | Fire Resistance | 3:00 | — | 8:00 |
| `potion_of_poison` | Poison I | 1:30 | II 0:22 | I 2:00 |
| `potion_of_weakness` | Weakness | 1:30 | — | 4:00 |
| `potion_of_harming` | Instant Damage I | instant | II instant | — |
| `potion_of_slowness` | Slowness I | 1:30 | IV 0:20 | I 4:00 |
| `potion_of_turtle_master` | Slowness IV + Resistance III | 0:20 | VI + IV 0:20 | IV + III 0:40 |
| `potion_of_the_turtle_master` | (same) | | | |
| `potion_of_luck` (creative) | Luck | 5:00 | — | — |

**Special potions:**
- `potion_of_slowness` strong = Slowness IV
- `potion_of_strong_slowness` (1.20.5+ renamed)
- `uncraftable_potion` (creative only) — looks like splash but no effect
- `potion_of_infested` (1.21) — spawns silverfish when player takes damage
- `potion_of_oozing` (1.21) — spawns slimes on death
- `potion_of_weaving` (1.21) — applies cobweb blocks on hit
- `potion_of_wind_charged` (1.21) — launches entities on death

### 5.8 Tipped Arrows

Tipped arrows apply the corresponding potion effect on hit. Each potion has a tipped arrow variant with 1/8 the duration of the drinkable potion (e.g. arrow of regeneration = Regeneration 0:05 / strong 0:02 / extended 0:11).

| Tipped Arrow | Effect | Duration |
|--------------|--------|----------|
| `tipped_arrow` (default = regeneration) | Regeneration | 5s |
| `arrow_of_regeneration` | Regeneration I | 5s / II 2s / I 11s |
| `arrow_of_swiftness` | Speed | 22s / 11s / 1m |
| `arrow_of_strength` | Strength | 22s / 11s / 1m |
| `arrow_of_healing` | Instant Health | instant |
| `arrow_of_night_vision` | Night Vision | 22s / 1m |
| `arrow_of_invisibility` | Invisibility | 22s / 1m |
| `arrow_of_water_breathing` | Water Breathing | 22s / 1m |
| `arrow_of_leaping` | Jump Boost | 22s / 11s / 1m |
| `arrow_of_slow_falling` | Slow Falling | 11s / 30s |
| `arrow_of_fire_resistance` | Fire Resistance | 22s / 1m |
| `arrow_of_poison` | Poison | 11s / 5s / 22s |
| `arrow_of_weakness` | Weakness | 11s / 30s |
| `arrow_of_harming` | Instant Damage | instant |
| `arrow_of_slowness` | Slowness | 11s / IV 5s / 30s |
| `arrow_of_turtle_master` | Slowness IV + Resistance III | 5s / 11s |

---

## 6. Materials

### 6.1 Ores, Ingots, Nuggets, Gems, Dusts

| Item ID | Source | Stack | Notes |
|---------|--------|-------|-------|
| `coal` | Coal ore (overworld) | 64 | Fuel 80s (1600 ticks) |
| `charcoal` | Smelted logs | 64 | Fuel 80s; same as coal for crafting |
| `raw_iron` | Iron ore | 64 | Smelt to iron ingot; drops 1+ from raw iron block |
| `iron_ingot` | Smelt iron | 64 | Tool/armor material |
| `iron_nugget` | Smelt iron items / loot | 64 | 9 = iron ingot |
| `raw_copper` | Copper ore | 64 | |
| `copper_ingot` | Smelt copper | 64 | Tools not craftable; used for blocks, brush, lightning rod |
| `raw_gold` | Gold ore | 64 | |
| `gold_ingot` | Smelt gold | 64 | Tool/armor material; piglin bartering |
| `gold_nugget` | Smelt gold items | 64 | 9 = gold ingot |
| `diamond` | Diamond ore | 64 | Mining level 2+ |
| `emerald` | Emerald ore / trades | 64 | |
| `lapis_lazuli` | Lapis ore | 64 | Dye, enchanting fuel |
| `redstone` | Redstone ore | 64 | Redstone dust |
| `quartz` | Nether quartz ore | 64 | |
| `amethyst_shard` | Amethyst clusters | 64 | |
| `netherite_scrap` | Smelt ancient debris | 64 | 4 + 4 gold = 1 netherite ingot |
| `netherite_ingot` | Crafted | 64 | Fire resistant |
| `netherite_upgrade_smithing_template` | Bastion loot | 1 | Required to upgrade diamond→netherite in smithing table |
| `nether_star` | Wither drop | 64 | Epic rarity |
| `echo_shard` | Ancient city loot | 64 | Used to craft recovery compass |
| `scute` | Turtle grows up | 64 | Turtle shell helmet |
| `armadillo_scute` (1.20.5+) | Armadillo brush | 64 | Wolf armor |
| `dragon_breath` | Ender dragon acid cloud | 64 | Lingering potions |
| `ghast_tear` | Ghast drop | 64 | End crystals |
| `blaze_rod` | Blaze drop | 64 | Blaze powder, brewing stand, end rods |
| `blaze_powder` | From blaze rod | 64 | Strength potion (Java), eye of ender, fuel for brewing |
| `prismarine_shard` | Guardian drop | 64 | |
| `prismarine_crystals` | Guardian / sea lantern | 64 | |
| `shulker_shell` | Shulker drop | 64 | Shulker box |
| `nautilus_shell` | Drowned / fishing | 64 | Conduit |
| `heart_of_the_sea` | Buried treasure | 1 | Conduit |
| `sponge` (block) | Ocean monument | 64 | |
| `wet_sponge` (block) | Ocean monument / smelted | 64 | |
| `slime_ball` | Slime drop | 64 | |
| `honeycomb` | Bee nest harvest | 64 | |
| `honey_block` (block) | 4 honey bottles | 64 | |
| `gunpowder` | Creeper/ghast/witch | 64 | TNT, fireworks |
| `glowstone_dust` | Glowstone / witch | 64 | Glowstone block, potion boost |
| `sugar` | Sugar cane / witch | 64 | Potion ingredient |
| `bone_meal` | Skeleton / bone | 64 | Dye white, fertilizer |
| `bone` | Skeleton drop | 64 | Bone meal (3), bonemeal |
| `string` | Spider / cat / cobweb | 64 | Bow, fishing rod, wool |
| `feather` | Chicken / parrot | 64 | Arrows, book & quill |
| `leather` | Cow / hoglin / rabbit | 64 | Armor, books, item frames |
| `rabbit_hide` | Rabbit drop | 64 | 4 = 1 leather |
| `rabbit_foot` | Rabbit 10% drop | 64 | Jump boost potion |
| `ink_sac` | Squid / wandering trader | 64 | Dye black, book & quill |
| `glow_ink_sac` | Glow squid | 64 | Glow signs, item frames |
| `cocoa_beans` | Jungle pod / trader | 64 | Dye brown, cookies |
| `phantom_membrane` | Phantom drop | 64 | Elytra repair, slow falling potion |
| `spider_eye` | Spider 33% drop | 64 | Food, potion |
| `fermented_spider_eye` | Crafted | 64 | Potion ingredient (weakness, slowness, harming) |
| `ender_pearl` | Enderman drop | 16 | Eye of ender, teleport |
| `ender_eye` | Ender pearl + blaze powder | 64 | Locate stronghold |
| `fire_charge` | Blaze powder + coal + gunpowder | 64 | Ignite, ghast fireball |
| `magma_cream` | Magma cube / craft | 64 | Fire resistance potion |
| `tear_of_the_g... no... ghast_tear` listed |
| `nether_wart` | Nether fortress | 64 | Awkward potion base |
| `glistering_melon_slice` | Gold nugget + melon | 64 | Healing potion |
| `golden_carrot` listed in food |
| `spider_eye` listed |
| `fermented_spider_eye` listed |
| `dragon_breath` listed |
| `turtle_egg` (block, can place) | Beach breeding | 64 | |
| `tropical_fish` listed food |

### 6.2 Mob Drops

| Item ID | Source Mob | Stack | Use |
|---------|------------|-------|-----|
| `rotten_flesh` | Zombie, husk, zombie villager | 64 | Food (with hunger risk) |
| `beef` | Cow, mooshroom | 64 | Food |
| `porkchop` | Pig, hoglin | 64 | Food |
| `chicken` | Chicken | 64 | Food |
| `mutton` | Sheep | 64 | Food |
| `rabbit` | Rabbit | 64 | Food |
| `cod` | Cod, polar bear | 64 | Food |
| `salmon` | Salmon, polar bear | 64 | Food |
| `tropical_fish` | Tropical fish | 64 | Food |
| `pufferfish` | Pufferfish, fisherman gift | 64 | Food |
| `leather` | Cow, hoglin, horse, donkey, llama, rabbit (hide) | 64 | |
| `feather` | Chicken, parrot, vex | 64 | |
| `string` | Spider, cave spider, cat, strider | 64 | |
| `spider_eye` | Spider, cave spider | 64 | |
| `gunpowder` | Creeper, ghast, witch | 64 | |
| `skeleton_skull` / `wither_skeleton_skull` / `zombie_head` / `creeper_head` / `player_head` / `dragon_head` / `piglin_head` | Various mobs (charged creeper kill) | 64 | Decoration, soul speed enchant source |
| `bone` | Skeleton, skeleton horse, wither skeleton (sometimes) | 64 | |
| `bone_block` | Fossils, soul sand valley | 64 | |
| `slime_ball` | Slime | 64 | |
| `magma_cream` | Magma cube | 64 | |
| `ghast_tear` | Ghast | 64 | |
| `blaze_rod` | Blaze | 64 | |
| `ender_pearl` | Enderman | 16 | |
| `shulker_shell` | Shulker | 64 | |
| `prismarine_shard` | Guardian | 64 | |
| `prismarine_crystals` | Guardian, sea lantern | 64 | |
| `ink_sac` | Squid | 64 | |
| `glow_ink_sac` | Glow squid | 64 | |
| `nautilus_shell` | Drowned (8%), fishing | 64 | |
| `heart_of_the_sea` | Buried treasure | 1 | |
| `nether_star` | Wither | 64 | |
| `dragon_breath` | Ender dragon | 64 | |
| `dragon_egg` | Ender dragon (1 per world) | 64 | |
| `totem_of_undying` | Evoker | 1 | |
| `phantom_membrane` | Phantom (50–70%) | 64 | |
| `scute` | Turtle grows | 64 | |
| `armadillo_scute` | Brush armadillo | 64 | |
| `echo_shard` | Ancient city chest | 64 | |
| `goat_horn` | Ram goat | 1 | 8 variants |
| `recovery_compass` (1.19) | Craft 8 echo shards | 1 | Points to last death |
| `rabbit_hide` | Rabbit | 64 | |
| `rabbit_foot` | Rabbit 10% | 64 | |
| `emerald` | Villager trade / pillager outpost / trader | 64 | |
| `saddle` | Dungeon, bastion, village, nether fortress | 1 | |
| `name_tag` | Dungeon, fishing, mineshaft | 1 | |
| `music_disc_*` | Various loot, creeper killed by skeleton | 1 | |
| `rabbit_stew` listed | — | | |

### 6.3 Plant Materials

| Item ID | Source | Stack | Notes |
|---------|--------|-------|-------|
| `wheat` | Wheat crop | 64 | Bread, hay, cake, cookies |
| `wheat_seeds` | Tall grass | 64 | Plant on farmland |
| `beetroot_seeds` | Beetroot crop | 64 | |
| `melon_seeds` | Melon slice | 64 | |
| `pumpkin_seeds` | Pumpkin | 64 | |
| `torchflower_seeds` | Brush suspicious sand | 64 | 1.20 plant |
| `pitcher_pod` | Brush suspicious gravel | 64 | 1.20 plant |
| `sugar_cane` | Riverbanks, swamp | 64 | Plant on sand/dirt next to water |
| `bamboo` | Jungle, mangrove swamp | 64 | Plant on most blocks |
| `kelp` | Ocean | 64 | Smelt to dried kelp |
| `seagrass` (block) | Turtle food, drops via shears | 64 | |
| `cactus` (block) | Desert | 64 | |
| `vine` (block) | Jungle | 64 | |
| `sweet_berries` listed food | — | | |
| `glow_berries` listed food | — | | |
| `chorus_fruit` listed food | — | | |
| `chorus_flower` (block) | End | 64 | |
| `nether_wart` | Nether fortress soul sand | 64 | |
| `crimson_fungus` | Crimson nylium | 64 | |
| `warped_fungus` | Warped nylium | 64 | |
| `crimson_roots` | Crimson nylium | 64 | |
| `warped_roots` | Warped nylium | 64 | |
| `nether_sprouts` | Netherrack | 64 | |
| `weeping_vines` (block) | Crimson forest | 64 | |
| `twisting_vines` (block) | Warped forest | 64 | |
| `cocoa_beans` | Jungle pod | 64 | |
| `melon_slice` listed food | — | | |
| `pumpkin` (block) | Grow | 64 | |
| `carved_pumpkin` (block) | Shears | 64 | |
| `lily_pad` (block) | Swamp | 64 | |
| `tall_grass`, `large_fern` (block) | Plains, taiga | 64 | |
| `fern` (block) | Taiga | 64 | |
| `dead_bush` (block) | Desert, badlands | 64 | Sticks when broken |
| `sapling` | Oak, spruce, birch, jungle, acacia, dark oak, cherry, mangrove, bamboo (no sapling; grows from shoots), crimson fungus, warped fungus | 64 | 8 sapling types |
| `mangrove_propagule` | Mangrove tree | 64 | |
| `azalea` (block) | Lush caves | 64 | |
| `flowering_azalea` (block) | Lush caves | 64 | |
| `moss_block` | Lush caves | 64 | |
| `spore_blossom` (block) | Lush caves | 64 | |
| `big_dripleaf` (block) | Lush caves | 64 | |
| `small_dripleaf` (block) | Lush caves | 64 | Bone meal required |
| `hanging_roots` (block) | Lush caves | 64 | |
| `pink_petals` (block) | Cherry biome | 64 | 1.20 |
| `torchflower` (block) | From torchflower seeds | 64 | |
| `pitcher_plant` (block) | From pitcher pod | 64 | |
| `dandelion`, `poppy`, `blue_orchid`, `allium`, `azure_bluet`, `red_tulip`, `orange_tulip`, `white_tulip`, `pink_tulip`, `oxeye_daisy`, `cornflower`, `lily_of_the_valley`, `wither_rose`, `sunflower`, `lilac`, `rose_bush`, `peony`, `torchflower` (block) | Various | 64 | |
| `wither_rose` | Wither kills mob | 64 | Damages non-wither mobs |

### 6.4 Compound & Rare Materials

| Item ID | Source | Use |
|---------|--------|-----|
| `netherite_scrap` | Smelt ancient debris | 4 + 4 gold = netherite ingot |
| `netherite_ingot` | Crafted | Diamond tool/armor upgrade via smithing table |
| `netherite_upgrade_smithing_template` | Bastion bridge loot | Required to upgrade in smithing table |
| `nether_star` | Wither boss | Beacon crafting |
| `end_crystal` | Craft ghast tear + eye + glass | Respawn ender dragon |
| `dragon_breath` | Ender dragon | Lingering potions |
| `echo_shard` | Ancient city | Recovery compass |
| `recovery_compass` | 8 echo shards | Points to last death location |
| `lodestone` (block) | 8 netherite + chiseled stone bricks | Redirects compass |
| `lodestone_compass` | Use compass on lodestone | Points to lodestone |
| `heart_of_the_sea` | Buried treasure | Conduit |
| `conduit` (block) | Heart of sea + 8 nautilus shells | Underwater buffs (Conduit Power) |
| `totem_of_undying` | Evoker drop | Revive on lethal hit |
| `scute` | Turtle grows up | Turtle helmet |
| `armadillo_scute` | Brush armadillo | Wolf armor |
| `turtle_helmet` | 5 scutes | Water breathing on surfacing |
| `wolf_armor` | 6 armadillo scutes | Wearable on tamed wolf |
| `goat_horn` | Ram goat | 8 sound variants |
| `ominous_bottle` | Trial vaults | Bad Omen levels |
| `trial_key` | Trial spawner reward | Opens vaults |
| `ominous_trial_key` | Ominous trial spawner | Opens ominous vaults |
| `breeze_rod` (1.21) | Breeze drop | Wind charges, mace crafting |
| `wind_charge` (1.21) | 4 breeze rods | Throwable knockback weapon |
| `mace` (1.21) | Breeze rod + heavy core | Melee weapon |
| `heavy_core` (1.21) | Ominous vault | Mace crafting |
| `glow_ink_sac` | Glow squid | Glow signs, frames |
| `glow_item_frame` (entity item) | Glow ink sac + item frame | Glowing frame |
| `nether_brick` | Smelted netherrack | Nether brick items |
| `nether_brick_item` | Smelted netherrack | Nether brick block |
| `blaze_rod` | Blaze drop | Blaze powder, brewing stand, end rod |
| `blaze_powder` | Blaze rod | Strength potion (Java), eye of ender, brewing fuel |
| `eye_of_ender` | Ender pearl + blaze powder | Stronghold locator, end portal frame |
| `ender_eye` (same as eye_of_ender) | — | — |
| `enchanted_book` | Enchanting table, loot, trades | Apply enchant to item via anvil |
| `writable_book` | 3 paper + leather | Written book |
| `written_book` | Sign writable book | Read-only; 16 signed copies |
| `book` | 3 paper + leather | Bookshelf, enchanting table |
| `knowledge_book` (creative) | — | Grants recipes |
| `book_and_quill` / `writable_book` | — | — |
| `recovery_compass` listed | — | — |
| `dragon_egg` | Ender dragon | 1 per world |

---

## 7. Redstone Items

### Redstone Placeable Components

| Item ID | Stack | Behavior |
|---------|-------|----------|
| `redstone` (dust) | 64 | Place on top of solid blocks; transmits power 0–15 |
| `redstone_torch` | 64 | Inverts signal; can be on floor/wall |
| `redstone_lantern` | 64 | Activates on power; emits light 15 |
| `redstone_block` | 64 | Always-on power source (15) |
| `repeater` | 64 | 1-tick delay minimum; 1/2/3/4 tick selectable; locks if powered from side |
| `comparator` | 64 | Compares signal strength; subtract mode; reads inventory fullness, etc. |
| `lever` | 64 | Toggle power source |
| `stone_button`, `oak_button` etc. (10 wood variants) | 64 | Momentary: wood=15 ticks, stone=10 ticks |
| `stone_pressure_plate`, `oak_pressure_plate` (wood) | 64 | Player+mob activated; wood = 10 ticks, stone = 10 ticks |
| `light_weighted_pressure_plate` (gold) | 64 | Measures item count (1 per item, max 15) |
| `heavy_weighted_pressure_plate` (iron) | 64 | Measures item count (1 per 10 items, max 15) |
| `oak_pressure_plate` (variants: oak, spruce, birch, jungle, acacia, dark_oak, mangrove, cherry, bamboo, crimson, warped) | 64 | All same behavior |
| `polished_blackstone_pressure_plate` | 64 | Stone variant |
| `tripwire_hook` | 64 | Pair with string; signal when entity crosses |
| `daylight_detector` | 64 | Power 0–15 based on sky light |
| `target` | 64 | Emits power based on arrow hit location (0–15) |
| `note_block` | 64 | Plays note on redstone pulse; instrument depends on block below |
| `lectern` (block, but emits signal via comparator) | 64 | Reads book page count; powers comparator |
| `observer` | 64 | Detects block state change; 2-tick pulse |
| `piston` | 64 | Pushes up to 12 blocks |
| `sticky_piston` | 64 | Pushes and pulls blocks |
| `dispenser` | 64 | Uses items (shoots arrows, places water, equips armor, etc.) |
| `dropper` | 64 | Drops items as entities |
| `hopper` | 64 | Pulls from above, pushes to facing; 5-item buffer |
| `tnt` (block) | 64 | Explodes on redstone, fire, or hit |
| `tnt_minecart` | 16 | TNT on rails; activates on activator rail |
| `redstone_wire` (alt id for `redstone`) | 64 | — |
| `calibrated_sculk_sensor` (1.20) | 64 | Filters vibration by frequency |
| `sculk_sensor` | 64 | Detects vibrations; emits 2-tick pulse, frequency 1–15 |
| `copper_bulb` (1.21) | 64 | Toggles light on redstone; has internal state |
| `crafter` (1.21) | 64 | Auto-crafts on redstone pulse |
| `chiseled_bookshelf` (block) | 64 | 6-slot book storage; emits comparator signal |
| `comparator` (same as above) | — | — |
| `jigsaw` (block) | 64 | Structure generation |
| `command_block` (block) | 64 | Runs command on redstone |
| `chain_command_block`, `repeating_command_block` | 64 | Command block variants |
| `structure_block` (block) | 64 | Save/load structures |
| `structure_void` (block) | 64 | Air in structures |

### Rails

| Item ID | Stack | Behavior |
|---------|-------|----------|
| `rail` | 64 | Plain rail |
| `powered_rail` | 64 | Boosts minecart when powered; slows when not |
| `detector_rail` | 64 | Emits signal when minecart passes |
| `activator_rail` | 64 | Activates minecart with TNT/hopper/etc. |

---

## 8. Transportation

| Item ID | Stack | Notes |
|---------|-------|-------|
| `minecart` | 1 | Holds player/mob |
| `chest_minecart` | 1 | Minecart with chest |
| `hopper_minecart` | 1 | Minecart with hopper (collects items) |
| `tnt_minecart` | 1 | Explodes on activator rail/hit |
| `furnace_minecart` | 1 | Powered by fuel (Java only) |
| `command_block_minecart` | 1 | Runs commands |
| `spawner_minecart` (creative) | 1 | Spawns mob while riding |
| `oak_boat` (and 5 wood variants + bamboo + cherry + mangrove + jungle + spruce + birch + acacia + dark_oak) | 1 | Water transport; 6 wood types + bamboo |
| `oak_chest_boat` (and 6 variants + bamboo) | 1 | Boat with chest (27 slots) |
| `elytra` | 1 | Gliding wings; repaired with phantom membrane; enchanted with Unbreaking/Mending/Curse of Vanishing |
| `saddle` | 1 | Ride pigs, horses, donkeys, mules, striders, camels |
| `carrot_on_a_stick` | 1 | Steer saddled pig |
| `warped_fungus_on_a_stick` | 1 | Steer saddled strider |
| `horse_armor` variants | 1 | See §4.6 |
| `leash` (lead) | 64 | Tether mobs |
| `name_tag` | 1 | Rename mobs |
| `lead` (alt for leash) | 64 | — |

---

## 9. Miscellaneous

### 9.1 Bucket Variants

| Item ID | Stack | Notes |
|---------|-------|-------|
| `bucket` | 16 | Empty; picks up water/lava/powder snow |
| `water_bucket` | 1 | Places water source |
| `lava_bucket` | 1 | Places lava; fuel 1000s (20000 ticks) |
| `powder_snow_bucket` | 1 | Places powder snow |
| `milk_bucket` | 1 | Drink to clear effects |
| `cod_bucket` | 1 | Spawns cod when placed |
| `salmon_bucket` | 1 | Spawns salmon |
| `pufferfish_bucket` | 1 | Spawns pufferfish |
| `tropical_fish_bucket` | 1 | Spawns tropical fish (carries variant data) |
| `axolotl_bucket` | 1 | Spawns axolotl (carries variant) |
| `tadpole_bucket` | 1 | Spawns tadpole |

### 9.2 Map Variants

| Item ID | Stack | Notes |
|---------|-------|-------|
| `map` | 1 | Creates new map when first used |
| `filled_map` | 1 | Has scaling levels 0–4 |
| `explorer_map` (3 variants) | 1 | Ocean monument, woodland mansion, buried treasure — given by cartographer |
| `locator_map` (Bedrock variant) | 1 | — |
| `woodland_explorer_map` | 1 | Cartographer trade |
| `ocean_explorer_map` | 1 | Cartographer trade |
| `buried_treasure_map` | 1 | Shipwreck, underwater ruin |
| `trial_explorer_map` (1.21) | 1 | Cartographer trade (finds trial chambers) |

### 9.3 Book Variants

| Item ID | Stack | Notes |
|---------|-------|-------|
| `book` | 64 | Crafting, enchanting |
| `enchanted_book` | 1 | Stores one enchantment |
| `writable_book` | 1 | 100 pages, editable |
| `written_book` | 16 | Signed; can be copied |
| `book_and_quill` | 1 | Same as writable_book |
| `knowledge_book` (creative) | 1 | Unlocks recipes |
| `writable_book` (same) | — | — |

### 9.4 Music Discs (16 total in 1.21)

| Disc | Length | Composer | Source |
|------|--------|----------|--------|
| `music_disc_13` | 2:58 | C418 | Dungeon, woodland mansion, stronghold |
| `music_disc_cat` | 3:05 | C418 | Dungeon, woodland mansion |
| `music_disc_blocks` | 5:45 | C418 | Dungeon |
| `music_disc_chirp` | 3:05 | C418 | Dungeon |
| `music_disc_far` | 2:54 | C418 | Dungeon, stronghold |
| `music_disc_mall` | 3:17 | C418 | Dungeon |
| `music_disc_mellohi` | 1:36 | C418 | Dungeon, buried treasure, stronghold |
| `music_disc_stal` | 2:30 | C418 | Dungeon, woodland mansion |
| `music_disc_strad` | 3:08 | C418 | Dungeon |
| `music_disc_ward` | 4:11 | C418 | Dungeon, woodland mansion, stronghold |
| `music_disc_11` | 1:11 | C418 | Dungeon |
| `music_disc_wait` | 3:58 | C418 | Dungeon, buried treasure, stronghold |
| `music_disc_otherside` | 3:15 | Lena Raine | Dungeon, stronghold, woodland mansion |
| `music_disc_5` | 2:54 | Samuel Åberg | Ancient city |
| `music_disc_pigstep` | 2:32 | Lena Raine | Bastion remnant (rare) |
| `music_disc_relic` (1.20) | 3:38 | Aaron Cherof | Trail ruins |

All music discs can also drop when a skeleton or stray kills a creeper (random disc).

### 9.5 Banners

- 16 banner colors: white, orange, magenta, light_blue, yellow, lime, pink, gray, light_gray, cyan, purple, blue, brown, green, red, black.
- Each banner is `minecraft:{color}_banner`, stacks to 16.
- Patterns applied via loom (using dyes) or via banner pattern items.
- Ominous banner (`minecraft:gray_banner` w/ specific pattern) is held by raid captains.

### 9.6 Dyes (16)

`white_dye` (bone meal or lily of the valley), `orange_dye` (orange tulip), `magenta_dye` (lilac/allium), `light_blue_dye` (blue orchid), `yellow_dye` (dandelion/sunflower), `lime_dye` (smelt sea pickle), `pink_dye` (pink tulip/peony), `gray_dye` (black+white), `light_gray_dye` (azure bluet/oxeye daisy/white tulip or 1 black + 2 white), `cyan_dye` (1 blue + 1 green), `purple_dye` (1 blue + 1 red), `blue_dye` (lapis or cornflower), `brown_dye` (cocoa beans), `green_dye` (smelt cactus), `red_dye` (rose bush/poppy/red tulip/beetroot), `black_dye` (ink sac/wither rose).

### 9.7 Fireworks

| Item ID | Stack | Notes |
|---------|-------|-------|
| `firework_rocket` | 64 | Flight duration 1–3 (gunpowder count); 1–3 firework stars for explosion |
| `firework_star` | 64 | Color, shape (small ball, large ball, star, creeper, burst), trail, twinkle |

**Firework explosion shapes:** small ball (default), large ball, star, creeper, burst. Add `trail` with diamond, `twinkle` with glowstone.

### 9.8 Spawn Eggs

See §10.

### 9.9 Pottery Sherds (1.20+) — ~20

| Sherd | Source |
|-------|--------|
| `archer_pottery_sherd` | Desert well |
| `arms_up_pottery_sherd` | Desert well |
| `prize_pottery_sherd` | Desert well |
| `blade_pottery_sherd` | Desert pyramid |
| `brewer_pottery_sherd` | Desert pyramid |
| `burn_pottery_sherd` | Desert pyramid |
| `danger_pottery_sherd` | Desert pyramid |
| `skull_pottery_sherd` | Desert pyramid |
| `explorer_pottery_sherd` | Ocean ruins (cold) |
| `heart_pottery_sherd` | Trail ruins |
| `heartbreak_pottery_sherd` | Trail ruins |
| `howl_pottery_sherd` | Trail ruins |
| `sheaf_pottery_sherd` | Trail ruins |
| `miner_pottery_sherd` | Ocean ruins (warm) |
| `mourner_pottery_sherd` | Ocean ruins (cold) |
| `plenty_pottery_sherd` | Ocean ruins (warm) |
| `friend_pottery_sherd` | Trail ruins |
| `shelter_pottery_sherd` | Trail ruins |
| `snort_pottery_sherd` | Trail ruins |
| `plenty_pottery_sherd` listed | |

Each sherd is decorative for crafting decorated pots (4 sherds = 1 pot with custom face patterns).

### 9.10 Smithing Templates (1.20+)

**Armor trims (16 patterns):**
- `bolt_armor_trim_smithing_template` — Trial chambers
- `coast_armor_trim_smithing_template` — Shipwreck
- `dune_armor_trim_smithing_template` — Desert pyramid
- `eye_armor_trim_smithing_template` — Stronghold
- `host_armor_trim_smithing_template` — Trial chambers
- `raiser_armor_trim_smithing_template` — Pillager outpost
- `rib_armor_trim_smithing_template` — Nether fortress
- `sentry_armor_trim_smithing_template` — Pillager outpost
- `shaper_armor_trim_smithing_template` — Trail ruins
- `silence_armor_trim_smithing_template` — Ancient city (rare)
- `snout_armor_trim_smithing_template` — Bastion remnant
- `spire_armor_trim_smithing_template` — End city
- `tide_armor_trim_smithing_template` — Ocean monument (elder guardian)
- `vex_armor_trim_smithing_template` — Woodland mansion
- `ward_armor_trim_smithing_template` — Ancient city
- `wayfinder_armor_trim_smithing_template` — Trail ruins
- `wild_armor_trim_smithing_template` — Jungle temple

That's 17 patterns actually. Let me recount: bolt, coast, dune, eye, host, raiser, rib, sentry, shaper, silence, snout, spire, tide, vex, ward, wayfinder, wild = 17 patterns.

**Trim materials (10):** iron, copper, gold, lapis, emerald, diamond, netherite, redstone, amethyst, quartz.

**Special:** `netherite_upgrade_smithing_template` (Bastion bridge) — required to upgrade diamond→netherite in smithing table.

### 9.11 Banner Patterns (1.21 catalog)

| Pattern | Source |
|---------|--------|
| `flower_banner_pattern` | 1 oxeye daisy in loom? Actually: cartographer trade |
| `creeper_banner_pattern` | 1 paper + creeper head |
| `skull_banner_pattern` | 1 paper + wither skeleton skull |
| `globe_banner_pattern` | Cartographer master trade |
| `mojang_banner_pattern` | 1 paper + enchanted golden apple (creative recipe) |
| `piglin_banner_pattern` | 1 paper + piglin head (1.21) |
| `flow_banner_pattern` | Trail ruins (1.21) |
| `guster_banner_pattern` | Trial chambers (1.21) |

### 9.12 Goat Horns (8 variants)

`ponder_goat_horn`, `sing_goat_horn`, `seek_goat_horn`, `feel_goat_horn` (Java), and 4 more Bedrock-only: `admire_goat_horn`, `call_goat_horn`, `yearn_goat_horn`, `dream_goat_horn`. All obtained from ramming goats or pillager outpost chests.

### 9.13 Other Misc Items

| Item ID | Stack | Notes |
|---------|-------|-------|
| `ender_pearl` | 16 | Throwable teleport |
| `eye_of_ender` | 64 | Stronghold locator |
| `ender_eye` (alt) | 64 | — |
| `totem_of_undying` | 1 | Off-hand revive |
| `recovery_compass` | 1 | Last death direction |
| `lodestone_compass` (nbt form of `compass` with lodestone_tracked) | 1 | Points to lodestone |
| `compass` | 64 | World spawn |
| `clock` | 64 | Day/night cycle |
| `spyglass` | 1 | Zoom |
| `goat_horn` | 1 | Sounds |
| `wind_charge` | 64 | Throwable knockback |
| `ominous_bottle` | 1 | Bad omen amplifier |
| `trial_key` | 64 | Vault key |
| `ominous_trial_key` | 64 | Ominous vault key |
| `pottery_sherd_*` | 64 | Decorated pots |
| `smithing_template_*` | 1 | Trims/upgrades |
| `banner_pattern_*` | 1 | Banner patterns |
| `painting` | 64 | Wall art (size random from `minecraft:painting_variant`) |
| `item_frame` | 64 | Wall item |
| `glow_item_frame` | 64 | Glowing variant |
| `armor_stand` | 16 | Poseable armor display |
| `flower_pot` (block) | 64 | Holds small plants |
| `decorated_pot` | 16 | Crafted with 4 sherds/bricks; stores items |
| `end_crystal` | 64 | Respawn dragon; explosive |
| `experience_bottle` | 64 | Thrown for XP (3–11) |
| `dragon_breath` listed | — | — |
| `saddle` | 1 | Ride |
| `name_tag` | 1 | Rename mob |
| `lead` (leash) | 64 | Tether |
| `enchanted_book` | 1 | Anvil apply |
| `writable_book` | 1 | Book & quill |
| `written_book` | 16 | Signed |
| `book` | 64 | Crafting |
| `paper` | 64 | Crafting |
| `sugar_cane` listed | — | — |
| `stick` | 64 | Tool handles, rails |
| `bone` listed | — | — |
| `bone_meal` listed | — | — |
| `clay_ball` | 64 | Smelt to brick |
| `brick` | 64 | Bricks block |
| `nether_brick` (item) | 64 | Nether bricks block |
| `flint` | 64 | Arrows, flint and steel |
| `coal` listed | — | — |
| `charcoal` listed | — | — |
| `diamond` listed | — | — |
| `emerald` listed | — | — |
| `lapis_lazuli` listed | — | — |
| `quartz` listed | — | — |
| `amethyst_shard` listed | — | — |
| `glass_bottle` | 64 | Potions, honey |
| `brewing_stand` (block, item) | 64 | Potion brewing |
| `blaze_powder` listed | — | — |
| `fermented_spider_eye` listed | — | — |
| `glistering_melon_slice` listed | — | — |
| `dragon_breath` listed | — | — |
| `ghast_tear` listed | — | — |
| `spider_eye` listed | — | — |
| `rabbit_foot` listed | — | — |
| `magma_cream` listed | — | — |
| `blaze_rod` listed | — | — |
| `nether_wart` listed | — | — |
| `golden_carrot` (food) listed | — | — |
| `gold_nugget` | 64 | Glistering melon, golden carrot |
| `iron_nugget` | 64 | — |
| `redstone` listed | — | — |
| `glowstone_dust` listed | — | — |
| `sugar` listed | — | — |
| `gunpowder` listed | — | — |
| `fire_charge` | 64 | Ignite |
| `flint_and_steel` listed | — | — |
| `bow` | 1 | Range |
| `crossbow` | 1 | Range |
| `arrow` | 64 | Bow ammo |
| `tipped_arrow` | 64 | Bow/crossbow ammo w/ effect |
| `spectral_arrow` (Java only, 1.21 still exists) | 64 | Glowing effect on hit |
| `firework_rocket` listed | — | — |
| `firework_star` listed | — | — |
| `air` | — | Empty slot sentinel |
| `structure_void` (block) | — | — |

---

## 10. Spawn Eggs

All spawn eggs are `minecraft:{mob}_spawn_egg` and stack to 64.

| Spawn Egg | Mob Spawned |
|-----------|-------------|
| `allay_spawn_egg` | Allay |
| `axolotl_spawn_egg` | Axolotl |
| `bat_spawn_egg` | Bat |
| `bee_spawn_egg` | Bee |
| `blaze_spawn_egg` | Blaze |
| `bogged_spawn_egg` (1.21) | Bogged |
| `breeze_spawn_egg` (1.21) | Breeze |
| `camel_spawn_egg` | Camel |
| `cat_spawn_egg` | Cat |
| `cave_spider_spawn_egg` | Cave Spider |
| `chicken_spawn_egg` | Chicken |
| `cod_spawn_egg` | Cod |
| `cow_spawn_egg` | Cow |
| `creeper_spawn_egg` | Creeper |
| `dolphin_spawn_egg` | Dolphin |
| `donkey_spawn_egg` | Donkey |
| `drowned_spawn_egg` | Drowned |
| `elder_guardian_spawn_egg` | Elder Guardian |
| `ender_dragon_spawn_egg` (creative only) | Ender Dragon |
| `enderman_spawn_egg` | Enderman |
| `endermite_spawn_egg` | Endermite |
| `evoker_spawn_egg` | Evoker |
| `fox_spawn_egg` | Fox |
| `frog_spawn_egg` | Frog |
| `ghast_spawn_egg` | Ghast |
| `glow_squid_spawn_egg` | Glow Squid |
| `goat_spawn_egg` | Goat |
| `guardian_spawn_egg` | Guardian |
| `hoglin_spawn_egg` | Hoglin |
| `horse_spawn_egg` | Horse |
| `husk_spawn_egg` | Husk |
| `iron_golem_spawn_egg` (creative only) | Iron Golem |
| `llama_spawn_egg` | Llama |
| `magma_cube_spawn_egg` | Magma Cube |
| `mooshroom_spawn_egg` | Mooshroom |
| `mule_spawn_egg` | Mule |
| `ocelot_spawn_egg` | Ocelot |
| `panda_spawn_egg` | Panda |
| `parrot_spawn_egg` | Parrot |
| `phantom_spawn_egg` | Phantom |
| `pig_spawn_egg` | Pig |
| `piglin_spawn_egg` | Piglin |
| `piglin_brute_spawn_egg` | Piglin Brute |
| `pillager_spawn_egg` | Pillager |
| `polar_bear_spawn_egg` | Polar Bear |
| `pufferfish_spawn_egg` | Pufferfish |
| `rabbit_spawn_egg` | Rabbit |
| `ravager_spawn_egg` | Ravager |
| `salmon_spawn_egg` | Salmon |
| `sheep_spawn_egg` | Sheep |
| `shulker_spawn_egg` | Shulker |
| `silverfish_spawn_egg` | Silverfish |
| `skeleton_spawn_egg` | Skeleton |
| `skeleton_horse_spawn_egg` | Skeleton Horse |
| `slime_spawn_egg` | Slime |
| `sniffer_spawn_egg` | Sniffer |
| `snow_golem_spawn_egg` (creative only) | Snow Golem |
| `spider_spawn_egg` | Spider |
| `squid_spawn_egg` | Squid |
| `stray_spawn_egg` | Stray |
| `strider_spawn_egg` | Strider |
| `tadpole_spawn_egg` | Tadpole |
| `trader_llama_spawn_egg` | Trader Llama |
| `tropical_fish_spawn_egg` | Tropical Fish |
| `turtle_spawn_egg` | Turtle |
| `vex_spawn_egg` | Vex |
| `villager_spawn_egg` | Villager |
| `vindicator_spawn_egg` | Vindicator |
| `wandering_trader_spawn_egg` | Wandering Trader |
| `warden_spawn_egg` (creative only) | Warden |
| `witch_spawn_egg` | Witch |
| `wither_spawn_egg` (creative only) | Wither |
| `wither_skeleton_spawn_egg` | Wither Skeleton |
| `wolf_spawn_egg` | Wolf |
| `zoglin_spawn_egg` | Zoglin |
| `zombie_spawn_egg` | Zombie |
| `zombie_horse_spawn_egg` (creative only) | Zombie Horse |
| `zombie_villager_spawn_egg` | Zombie Villager |
| `zombified_piglin_spawn_egg` | Zombified Piglin |

---

## 11. Enchantments

All vanilla enchantments (1.21.x). "Max Lvl" = max level obtainable via enchanting table or anvil.

### Combat Enchantments

| Enchantment ID | Max Lvl | Target | Effect |
|----------------|---------|--------|--------|
| `sharpness` | 5 | Sword, Axe | +0.5 + 0.5/lvl bonus damage to all mobs |
| `smite` | 5 | Sword, Axe | +2.5/lvl bonus damage to undead |
| `bane_of_arthropods` | 5 | Sword, Axe | +2.5/lvl bonus to arthropods + Slowness IV 1-1.5s |
| `knockback` | 2 | Sword | +3 + 3/lvl blocks knockback |
| `fire_aspect` | 2 | Sword | Sets target on fire 4×lvl seconds |
| `sweeping_edge` (Java only) | 3 | Sword | Sweep damage 0%/33%/50%/67%/75% per lvl |
| `density` (1.21) | 5 | Mace | +0.5 damage/block fallen per level |
| `breach` (1.21) | 4 | Mace | Reduces target armor effectiveness by 15%/lvl |
| `wind_burst` (1.21) | 3 | Mace | Launches attacker & target up by 2.5/3.5/4.5 blocks on smash attack |
| `impaling` | 5 | Trident | +2.5/lvl bonus to aquatic mobs (Java); Bedrock: per hit in water/rain |
| `loyalty` | 3 | Trident | Returns trident after throw; speed scales w/ level |
| `riptide` | 3 | Trident | Propels player when thrown in rain/water; mutually exclusive with Loyalty/Channeling |
| `channeling` | 1 | Trident | Summons lightning bolt at target during thunderstorm |
| `power` | 5 | Bow | +25% + 25%/lvl arrow damage |
| `punch` | 2 | Bow | +3 + 3/lvl blocks arrow knockback |
| `flame` | 1 | Bow | Sets arrow target on fire 5s |
| `infinity` | 1 | Bow | No arrow consumed (still need 1 in inventory) |
| `multishot` | 1 | Crossbow | Fires 3 arrows (consumes 1) |
| `piercing` | 4 | Crossbow | Arrows pass through lvl mobs + can retrieve |
| `quick_charge` | 3 | Crossbow | -0.25s/lvl reload (lvl 4+ via commands makes instant) |
| `thorns` | 3 | Armor (any) | Reflects damage: chance 0.15/lvl; reflects 1–4 damage |

### Tools & Mining

| Enchantment ID | Max Lvl | Target | Effect |
|----------------|---------|--------|--------|
| `efficiency` | 5 | Pickaxe, Axe, Shovel, Hoe, Shears | +lvl² + 2 mining speed |
| `silk_touch` | 1 | Pickaxe, Axe, Shovel, Hoe, Shears | Drops block itself (mutually exclusive w/ Fortune) |
| `fortune` | 3 | Pickaxe, Axe, Shovel, Hoe | Multiplies drops: I=33%, II=25%, III=20% chance ×2, ×3, ×4 |
| `unbreaking` | 3 | Any damageable | (100/(lvl+1))% chance to ignore durability use |
| `mending` | 1 | Any damageable | Repairs with collected XP (2 durability per XP) |
| `curse_of_vanishing` | 1 | Any damageable | Item disappears on death (no drop) |

### Armor Enchantments

| Enchantment ID | Max Lvl | Target | Effect |
|----------------|---------|--------|--------|
| `protection` | 4 | Armor (any) | Reduces most damage by 4% × lvl (capped at 80%) |
| `fire_protection` | 4 | Armor | Reduces fire damage 8% × lvl; -15% fire duration/lvl |
| `blast_protection` | 4 | Armor | Reduces explosion damage 8% × lvl; knockback -15%/lvl |
| `projectile_protection` | 4 | Armor | Reduces projectile damage 8% × lvl |
| `feather_falling` | 4 | Boots | Reduces fall damage 12% × lvl (capped at 80%) |
| `respiration` | 3 | Helmet | +15s breath/lvl; 50%/lvl chance to avoid drowning damage |
| `aqua_affinity` | 1 | Helmet | Removes underwater mining penalty |
| `depth_strider` | 3 | Boots | +33%/lvl underwater movement speed |
| `frost_walker` (treasure) | 2 | Boots | Creates frosted ice 2 + lvl blocks; mutually exclusive w/ Depth Strider |
| `soul_speed` (treasure) | 3 | Boots | +0.0305 + 0.0445/lvl speed on soul sand/soil; costs durability |
| `swift_sneak` (treasure) | 3 | Leggings | +15%/lvl sneak speed (max 75% at III) |
| `thorns` (listed above) | — | — | — |
| `curse_of_binding` | 1 | Armor | Cannot be removed from armor slot until broken or in Creative |

### Fishing Enchantments

| Enchantment ID | Max Lvl | Target | Effect |
|----------------|---------|--------|--------|
| `luck_of_the_sea` | 3 | Fishing Rod | +1%/lvl treasure loot chance, -1%/lvl junk |
| `lure` | 3 | Fishing Rod | -5s/lvl wait time |

### Universal / Other

| Enchantment ID | Max Lvl | Target | Effect |
|----------------|---------|--------|--------|
| `unbreaking` | 3 | Any | (above) |
| `mending` (treasure) | 1 | Any | (above) |
| `curse_of_vanishing` | 1 | Any | (above) |

### Treasure-Only Enchantments
Cannot be obtained from enchanting table; only via loot, trading, fishing, or commands:
- Frost Walker (Boots)
- Soul Speed (Boots) — barter with piglins or found in bastion chests
- Swift Sneak (Leggings) — ancient city loot
- Mending (Any) — villager trade, loot, fishing
- Cleaving (Axe) — combat snapshot only, NOT in 1.21 vanilla

---

## 12. Status Effects

### Positive Effects

| Effect ID | Color (RGB) | Effect |
|-----------|-------------|--------|
| `speed` | #7CAFC6 | +20%/lvl movement speed |
| `haste` | #D9C043 | +20%/lvl mining speed |
| `strength` | #932423 | +3 (Java) / +1.5×lvl (Bedrock pre-1.21) melee damage; 1.21+: +1.5/lvl |
| `instant_health` | #F82423 | Heals 2×2^(lvl-1) (Java) / undead: 1.5× that as damage |
| `jump_boost` | #22FF4C | +50%/lvl jump height; reduces fall damage |
| `regeneration` | #CD5FAB | Heals 1 HP every 50/lvl ticks |
| `resistance` | #99453A | Reduces damage 20%/lvl (lvl 5 = 100%) |
| `fire_resistance` | #E49A3A | Immune to fire/lava |
| `water_breathing` | #2E5294 | No drowning |
| `invisibility` | #7F8392 | Invisible (armor/items still visible) |
| `night_vision` | #1F1FA1 | See in dark; full bright |
| `weakness` | #484D48 | -4 (Java) / -1.5×lvl melee damage |
| `health_boost` | #F87D23 | +4 HP/lvl (max 10 levels) |
| `absorption` | #2552A5 | +4 absorption HP/lvl |
| `saturation` | #F82423 | Restores 1 hunger + 2 saturation × lvl per tick |
| `luck` | #339900 | +1 luck/lvl (loot tables, fishing) |
| `slow_falling` | #FFEFD1 | Falling speed reduced; no fall damage |
| `conduit_power` | #1DACD6 | Combined Water Breathing + Haste + Night Vision (underwater) |
| `dolphins_grace` | #7CAFC6 | Swim speed boost (near dolphins) |
| `hero_of_the_village` | #44FF7F | -30% × lvl villager trade discount; gift chance |
| `village_hero` (alt) | — | — |

### Negative Effects

| Effect ID | Color | Effect |
|-----------|-------|--------|
| `slowness` | #5A0000 | -15%/lvl movement speed; lvl 7+ = unable to move |
| `mining_fatigue` | #4A4217 | -20%/lvl mining speed |
| `instant_damage` | #430A09 | Damages 3×2^(lvl-1) (Java); heals undead 1.5× |
| `nausea` | #55FFD7 | Wobble screen distortion |
| `blindness` | #1F1F23 | Black fog; no sprinting/crit |
| `hunger` | #587653 | Drains saturation then hunger at 0.025×lvl per tick |
| `poison` | #4E9331 | 1 damage per 25 ticks (lvl I) / 12 (lvl II) / 6 (lvl III+); cannot kill |
| `wither` | #352A27 | 1 damage per 40 ticks (lvl I) / 20 (lvl II) / 10 (lvl III+) — CAN kill |
| `fatal_poison` (Bedrock) | #4E9331 | Poison that CAN kill |
| `levitation` | #CEFFFF | Floats up 0.045×lvl blocks/tick |
| `glowing` | #94A061 | Outline visible through walls |
| `bad_luck` | #6E2007 | -1 luck/lvl |
| `unluck` (alt) | — | — |
| `darkness` | #1C1C26 | Tunnels vision; can't sprint |
| `bad_omen` | #15BB3E | Triggers raid when entering village; lvl 1–5 |
| `trial_omen` (1.21) | #C5A286 | Triggers ominous trial |
| `raid_omen` (1.21) | #C5A286 | Triggers raid (oomen variant) |

### 1.21 Trial Effects

These effects spawn secondary mobs when the affected entity dies or is hit:

| Effect ID | Color | Effect |
|-----------|-------|--------|
| `wind_charged` (1.21) | #B8F1FF | On death, spawns wind charge burst (launches entities) |
| `weaving` (1.21) | #9C7B7B | On death, spawns cobwebs |
| `oozing` (1.21) | #88B04B | On death, spawns 2 slimes |
| `infested` (1.21) | #88B04B (similar) | On hit, spawns 1-3 silverfish |

### Effect Causes (Selected)

| Effect | Cause |
|--------|-------|
| Speed | Sugar potion, beacon, dolphin's grace |
| Strength | Strength potion, beacon |
| Instant Health | Splash potion, golden apple, beacon |
| Regeneration | Golden apple, Regen potion, beacon, turtle helmet surface |
| Resistance | Enchanted golden apple, beacon, Turtle Master potion |
| Fire Resistance | Enchanted golden apple, Fire Res potion, totem of undying |
| Water Breathing | Turtle helmet, Water Breathing potion, conduit |
| Night Vision | Night Vision potion, conduit |
| Invisibility | Invisibility potion, armor stands |
| Jump Boost | Jump Boost potion, suspicious stew (cornflower) |
| Slow Falling | Slow Falling potion, slow fall |
| Hunger | Rotten flesh, raw chicken, pufferfish, suspicious stew (lily) |
| Poison | Spider eye, pufferfish, Poison potion, suspicious stew (lily) |
| Wither | Wither rose, Wither Skeleton attack, Wither effect potion |
| Nausea | Pufferfish |
| Blindness | Suspicious stew (azure bluet) |
| Levitation | Shulker bullet |
| Glowing | Spectral arrow, lingering Glowing potion (no drinkable in survival) |
| Darkness | Warden sonic boom, sculk shrieker |
| Bad Omen | Kill raid captain, drink ominous bottle |
| Hero of the Village | Defeat raid |
| Trial Omen | Enter trial spawner w/ Bad Omen (1.21) |
| Wind Charged | Hit by wind charge from breeze, or trial spawner |
| Weaving, Oozing, Infested | Trial spawner variant (ominous) |

---

## 13. Durability & Tool Tier Comparison Matrix

### Tools

| Tool | Wood | Gold | Stone | Iron | Diamond | Netherite |
|------|------|------|-------|------|---------|-----------|
| Pickaxe | 59 | 32 | 131 | 250 | 1561 | 2031 |
| Axe | 59 | 32 | 131 | 250 | 1561 | 2031 |
| Shovel | 59 | 32 | 131 | 250 | 1561 | 2031 |
| Hoe | 59 | 32 | 131 | 250 | 1561 | 2031 |
| Sword | 59 | 32 | 131 | 250 | 1561 | 2031 |
| Fishing Rod | — | — | — | — | — | — (64 base) |
| Shears | — | — | — | — | — | — (238) |
| Flint & Steel | — | — | — | — | — | — (65) |
| Shield | — | — | — | — | — | — (336) |
| Bow | — | — | — | — | — | — (384) |
| Crossbow | — | — | — | — | — | — (326) |
| Trident | — | — | — | — | — | — (250) |
| Mace (1.21) | — | — | — | — | — | — (500) |
| Brush | — | — | — | — | — | — (64) |
| Carrot on Stick | — | — | — | — | — | — (7) |
| Warped Fungus on Stick | — | — | — | — | — | — (100) |

### Armor

| Slot | Leather | Gold | Chainmail | Iron | Turtle | Diamond | Netherite |
|------|---------|------|-----------|------|--------|---------|-----------|
| Helmet | 55 | 77 | 165 | 165 | 275 | 363 | 407 |
| Chestplate | 80 | 112 | 240 | 240 | — | 528 | 592 |
| Leggings | 75 | 105 | 225 | 225 | — | 495 | 555 |
| Boots | 65 | 91 | 195 | 195 | — | 429 | 481 |
| **Total** | **275** | **385** | **825** | **825** | — | **1815** | **2035** |

### Armor Set Totals (Defense)

| Material | Helmet | Chestplate | Leggings | Boots | Total Defense | Toughness | KB Resist |
|----------|--------|------------|----------|-------|---------------|-----------|-----------|
| Leather | 1 | 3 | 2 | 1 | 7 | 0 | 0 |
| Gold | 2 | 5 | 3 | 1 | 11 | 0 | 0 |
| Chainmail | 2 | 5 | 4 | 1 | 12 | 0 | 0 |
| Iron | 2 | 6 | 5 | 2 | 15 | 0 | 0 |
| Diamond | 3 | 8 | 6 | 3 | 20 | 2 (per piece) | 0 |
| Netherite | 3 | 8 | 6 | 3 | 20 | 3 (per piece) | 0.1 (per piece) |

### Mining Speed (Tier) Comparison

| Material | Speed Multiplier | Approx blocks/s on matched tier |
|----------|------------------|--------------------------------|
| Wood | 2.0 | ~2.5 |
| Gold | 12.0 | ~15 |
| Stone | 4.0 | ~5 |
| Iron | 6.0 | ~7.5 |
| Diamond | 8.0 | ~10 |
| Netherite | 9.0 | ~11 |

(Efficiency V adds +26 to multiplier on top of base.)

---

## 14. Fuel Values Table

Each furnace operation takes 200 ticks (10 seconds). Fuel value = ticks the item burns.

### Block Fuels

| Item | Burn Ticks | Items Smelted |
|------|-----------|---------------|
| `coal_block` | 16000 | 80 |
| `lava_bucket` | 20000 | 100 |
| `dried_kelp_block` | 4001 | 20 |
| `hay_block` | 200 | 1 |
| `bamboo_block` (1.20) | 300 | 1.5 |
| `oak_log` / all logs | 300 | 1.5 |
| `oak_planks` / all planks | 200 | 1 |
| `oak_slab` / all wood slabs | 150 | 0.75 |
| `oak_fence` / all fences | 200 | 1 |
| `oak_fence_gate` | 200 | 1 |
| `oak_door` / wood doors | 200 | 1 |
| `oak_stairs` / all wood stairs | 200 | 1 |
| `oak_trapdoor` / wood trapdoors | 200 | 1 |
| `oak_button` / wood buttons | 100 | 0.5 |
| `oak_pressure_plate` / wood pressure plates | 200 | 1 |
| `oak_sign` / all signs | 200 | 1 |
| `oak_hanging_sign` (1.20) | 800 | 4 |
| `stick` | 100 | 0.5 |
| `oak_boat` / wood boats | 1200 | 6 |
| `chest` / trapped chest | 300 | 1.5 |
| `crafting_table` | 300 | 1.5 |
| `bookshelf` | 300 | 1.5 |
| `jukebox` | 300 | 1.5 |
| `note_block` | 300 | 1.5 |
| `chest_minecart` (minecart variant) | varies | |
| `bow` | 300 | 1.5 |
| `crossbow` | 300 | 1.5 |
| `fishing_rod` | 300 | 1.5 |
| `ladder` | 200 | 1 |
| `scaffolding` | 400 | 2 |
| `bowl` (wooden) | 200 | 1 |
| `wooden_axe` (and tools) | 200 | 1 |
| `wooden_pickaxe` | 200 | 1 |
| `wooden_sword` | 200 | 1 |
| `wooden_hoe` | 200 | 1 |
| `wooden_shovel` | 200 | 1 |
| `banner` | 300 | 1.5 |
| `dead_bush` | 100 | 0.5 |
| `bamboo` | 50 | 0.25 |
| `sugar_cane` | 50 | 0.25 |
| `carpet` (all colors) | 67 | 0.335 |
| `wool` (all colors) | 100 | 0.5 |
| `mangrove_roots` | 300 | 1.5 |
| `mangrove_propagule` | 100 | 0.5 |
| `bowls` (some wooden) | 200 | 1 |

### Item Fuels

| Item | Burn Ticks | Items Smelted |
|------|-----------|---------------|
| `coal` | 1600 | 8 |
| `charcoal` | 1600 | 8 |
| `blaze_rod` | 2400 | 12 |
| `lava_bucket` | 20000 | 100 |
| `coal_block` | 16000 | 80 |
| `dried_kelp_block` | 4001 | 20 |
| `dried_kelp` | 200 | 1 |
| `stick` | 100 | 0.5 |
| `bamboo` | 50 | 0.25 |
| `bow` | 300 | 1.5 |
| `crossbow` | 300 | 1.5 |
| `fishing_rod` | 300 | 1.5 |
| `wooden_axe` / pickaxe / sword / hoe / shovel | 200 | 1 |
| `banner` | 300 | 1.5 |
| `bowls` | 200 | 1 |

### Carts with furnace (Java only)
- `furnace_minecart`: fueled by coal/charcoal, propels itself on rails

---

## 15. Food Nutrition & Saturation Comparison

### All Food Items Sorted by Saturation

| Item | Hunger | Saturation | Notes |
|------|--------|------------|-------|
| `golden_carrot` | 6 | 14.4 | Best craftable food |
| `enchanted_golden_apple` | 4 | 9.6 | Best effects; rare loot |
| `golden_apple` | 4 | 9.6 | Always eatable |
| `cooked_porkchop` | 8 | 12.8 | Best "stackable cheap" food |
| `cooked_beef` | 8 | 12.8 | Same as cooked porkchop |
| `rabbit_stew` | 10 | 12 | Single-bowl; returns nothing? Returns bowl |
| `cooked_salmon` | 6 | 9.6 | |
| `cooked_mutton` | 6 | 9.6 | |
| `beetroot_soup` | 6 | 7.2 | Returns bowl |
| `mushroom_stew` | 6 | 7.2 | Returns bowl |
| `suspicious_stew` | 6 | 7.2 | Returns bowl + effect |
| `cooked_chicken` | 6 | 7.2 | |
| `bread` | 5 | 6 | Craft from wheat |
| `cooked_cod` | 5 | 6 | |
| `cooked_rabbit` | 5 | 6 | |
| `baked_potato` | 5 | 6 | |
| `apple` | 4 | 2.4 | |
| `chorus_fruit` | 4 | 2.4 | Teleports |
| `rotten_flesh` | 4 | 0.8 | Hunger risk |
| `carrot` | 3 | 3.6 | |
| `beef` | 3 | 1.8 | |
| `porkchop` | 3 | 1.8 | |
| `rabbit` | 3 | 1.8 | |
| `chicken` | 2 | 1.2 | 30% Hunger |
| `mutton` | 2 | 1.2 | |
| `melon_slice` | 2 | 1.2 | |
| `sweet_berries` | 2 | 0.4 | |
| `glow_berries` | 2 | 0.4 | |
| `poisonous_potato` | 2 | 1.2 | 60% Poison |
| `cod` | 2 | 0.4 | |
| `salmon` | 2 | 0.4 | |
| `spider_eye` | 2 | 3.2 | Poison 4s |
| `pumpkin_pie` | 8 | 4.8 | |
| `cake` (full) | 14 | 2.8 | 7 slices × 2/0.4 |
| `cookie` | 2 | 0.4 | |
| `dried_kelp` | 1 | 0.6 | Fast eat (17 ticks) |
| `potato` | 1 | 0.6 | |
| `beetroot` | 1 | 1.2 | |
| `tropical_fish` | 1 | 0.2 | |
| `pufferfish` | 1 | 0.2 | Nausea+Hunger+Poison |
| `honey_bottle` | 6 | 1.2 | Cures poison |

### Edible Time Multipliers

| Food Type | Use Ticks | Notes |
|-----------|-----------|-------|
| Default food | 32 (1.6s) | Most foods |
| Dried kelp | 17 (0.85s) | Fastest |
| Honey bottle | 40 (2.0s) | |
| Milk bucket | 32 (1.6s) | Not really food — clears effects |
| Cake (per slice) | 1 (instant) | Bitten from placed block |
| Ominous bottle | 32 (1.6s) | Drinkable; gives Bad Omen |

---

## 16. Stacking Rules, NBT Data & Special Behaviors

### 16.1 Stacking Rules

- **Default stack size: 64** unless item declares otherwise.
- **Stack 16 items:** ender pearls, snowballs, eggs, signs, hanging signs, beds, banners, boats (with and without chests), minecarts, empty buckets, doors (wood + iron), armor stands, saddles, decorated pots, music discs (some 1), ominous bottles (1), potions (1), stews (1), honey bottles (1), buckets with contents (1), maps (1).
- **Stack 1 items:** All tools, weapons, armor, fishing rods, shears, flint and steel, shields, bows, crossbows, tridents, maces, brushes, goat horns, written books, music discs (most), banner patterns, smithing templates, ominous bottles (1), filled maps (1), writable books (1).
- Items with `damage` component (durability used) **cannot stack at all**, even if their max is 16. (E.g. damaged fishing rod won't stack with undamaged.)
- Items with different NBT/components (enchants, custom names, lore, trim, etc.) **cannot stack**.
- Potion variants stack only with identical variant.

### 16.2 NBT / Component Data (1.20.5+)

Since 1.20.5, item NBT is replaced by **data components**. Each component has an ID like `minecraft:enchantments`, `minecraft:damage`, etc. Key components relevant to a Minecraft clone:

| Component ID | Type | Description |
|--------------|------|-------------|
| `minecraft:custom_data` | NBT compound | Custom mod data |
| `minecraft:max_stack_size` | int | Override stack size |
| `minecraft:max_damage` | int | Override max durability |
| `minecraft:damage` | int | Current durability used |
| `minecraft:enchantments` | { id: lvl } map | Applied enchants |
| `minecraft:stored_enchantments` | { id: lvl } map | Stored in enchanted book |
| `minecraft:repair_cost` | int | Anvil cumulative cost |
| `minecraft:custom_name` | Text | Override display name |
| `minecraft:item_name` | Text | Default display name (translation key) |
| `minecraft:lore` | list<Text> | Lore lines |
| `minecraft:rarity` | enum | common/uncommon/rare/epic |
| `minecraft:enchantment_glint_override` | bool | Force glint |
| `minecraft:hide_additional_tooltip` | bool | Hide extra tooltip |
| `minecraft:hide_tooltip` | bool | Hide all tooltip |
| `minecraft:repairable` (tag) | tag | Items that can repair |
| `minecraft:fire_resistant` | bool | Survives lava (netherite) |
| `minecraft:food` | component | `nutrition`, `saturation`, `can_always_eat`, `eat_seconds`, `effects` |
| `minecraft:consumable` | component | Use animation, sound, on-consume effects |
| `minecraft:use_remainder` | component | Item returned after consume (e.g. bowl from stew) |
| `minecraft:use_cooldown` | component | Cooldown per use (e.g. chorus, wind charge) |
| `minecraft:equippable` | component | Slot, equip sound, model |
| `minecraft:tool` | component | Mining speed rules, default mining tier |
| `minecraft:weapon` | component | Item damage per tick |
| `minecraft:projectile` | component | Projectile weapon mapping |
| `minecraft:trim` | component | Armor trim material + pattern |
| `minecraft:dye_color` | enum | Leather armor color (set via `minecraft:dyed_color`) |
| `minecraft:dyed_color` | int (RGB) | Dyed leather/wolf armor color |
| `minecraft:map_color` | int (RGB) | Map pixel color |
| `minecraft:pottery_pattern` | ResourceLocation | Decorated pot face |
| `minecraft:bucket_entity_data` | NBT | Mob data in bucket |
| `minecraft:entity_data` | NBT | Spawn egg data |
| `minecraft:lodestone_target` | component | Lodestone compass target |
| `minecraft:fireworks` | component | Flight duration + explosions |
| `minecraft:firework_explosion` | component | Star shape + colors |
| `minecraft:banner_patterns` | list | Banner applied patterns |
| `minecraft:writable_book_content` | list<page> | Book & quill pages |
| `minecraft:written_book_content` | list<page> | Signed book |
| `minecraft:bundle_contents` | list | Bundle storage |
| `minecraft:charged_projectiles` | list | Crossbow loaded projectiles |
| `minecraft:intangible_projectile` | bool | Cannot pick up |
| `minecraft:ominous_bottle_amplifier` | int | Bad omen level 0–4 |
| `minecraft:jukebox_playable` | ResourceLocation | Music disc song |
| `minecraft:profile` | component | Player head profile |
| `minecraft:pot_decorations` | list | Decorated pot sherds (4 slots) |
| `minecraft:recipes` | list | Knowledge book recipes |
| `minecraft:block_state` | NBT | Block item state on place |
| `minecraft:block_entity_data` | NBT | Block entity NBT on place (chests, spawners, etc.) |
| `minecraft:bees` | list | Beehive/Bee nest inhabitants |
| `minecraft:lock` | component | Lock code (key item name) |
| `minecraft:container` | list | Shulker box, bundle contents |
| `minecraft:container_loot` | ResourceLocation | Loot table seed for unopened container |
| `minecraft:note_block_sound` | ResourceLocation | Note block instrument (set by block below) |
| `minecraft:pot_decorations` | list<item> | Decorated pot sherds |
| `minecraft:map_post_processing` | enum | Map scale / lock state |
| `minecraft:map_id` | int | Map ID reference |
| `minecraft:debug_stick_state` | NBT | Debug stick state |
| `minecraft:creative_slot_lock` | bool | Creative slot lock |
| `minecraft:enchantable` (tag) | tag | What enchants can apply |
| `minecraft:glider` (1.21 elytra) | bool | Allows gliding |
| `minecraft:tooltip_style` | ResourceLocation | Tooltip frame |
| `minecraft:item_model` | ResourceLocation | Item model override |
| `minecraft:provided_enchantments` (1.21?) | — | — |

### 16.3 Special Item Behaviors

**Shield (`minecraft:shield`)**
- Hold right-click to enter blocking state.
- Blocks 100% damage from frontal 90° arc.
- Disabled by axe attack for 5 seconds (Java).
- Can be painted with banners (combine in crafting grid).
- Enchants: Unbreaking, Mending, Curse of Vanishing only.

**Totem of Undying (`minecraft:totem_of_undying`)**
- Must be in off-hand or main hand.
- On lethal damage: revives player at 1 HP + Regeneration II 45s + Absorption II 9s + Fire Resistance II 40s.
- Consumes the totem.
- Does not work in inventory, only in hands.

**Ender Pearl (`minecraft:ender_pearl`)**
- Throw to teleport player to landing spot.
- Player takes 5 fall damage on landing.
- Cannot teleport through walls or to unloaded chunks.
- Endermen take 1 damage from thrown pearls (Ender Pearls are ender-damage type).

**Eye of Ender (`minecraft:ender_eye`)**
- Throws: flies toward nearest stronghold portal room.
- Has 20% chance to break on use (becomes consumed).
- Place in end portal frame to activate portal (12 eyes max).

**Chorus Fruit (`minecraft:chorus_fruit`)**
- Eaten: restores 4 hunger + 2.4 saturation.
- Teleports player up to 8 blocks horizontally, 2 vertically, to non-air block.
- Cannot pass through solid blocks.
- 1-second cooldown after eating.

**Wind Charge (1.21)**
- Throws projectile that explodes on impact with wind effect.
- Launches entities (knockback) within ~2.5 block radius.
- Does not destroy blocks.
- Stack to 64; 0.5s cooldown.

**Ominous Bottle (1.21)**
- Drinkable; gives Bad Omen effect for 100 minutes.
- `ominous_bottle_amplifier` component sets level (0–4 → Bad Omen I–V).
- Drops from trial vaults and ominous trial vaults.

**Recovery Compass (1.21)**
- Points to player's last death location.
- If no death recorded: spins randomly.
- Works in any dimension (per-dimension death tracking).

**Lodestone Compass**
- Regular `compass` item with `minecraft:lodestone_target` component set.
- Points to lodestone block; if lodestone broken, spins.

**Music Disc**
- Insert into jukebox to play.
- `jukebox_playable` component maps disc to song ID.
- Some discs are rare loot; Pigstep/Relic/otherside/5 from specific structures.

**Enchanted Golden Apple**
- Cannot be crafted (since 1.9).
- Rare loot: dungeon, desert pyramid, mineshaft, stronghold, ancient city, ruined portal, woodland mansion, bastion.

**Decorated Pot**
- Crafted with 4 sherds/bricks.
- Each sherd slot determines one face decoration.
- Stores 1 stack of items (any item type, stack size up to 64).
- Breaks when destroyed by non-silk-touch tool — drops sherds + contents.
- Hopper can interact.
- Can be waterlogged? No.
- Projectiles (arrow, wind charge) break decorated pots.

**Banner**
- 16 color variants.
- Apply patterns via loom (pattern + dye) or banner pattern items.
- Max 6 patterns + 1 "border" pattern; exceeding causes "border" overlay (Java).
- Held by raid captains as ominous banner.

**Bundle**
- Stores up to 1 stack worth of items (combined stack counts).
- Right-click to insert; right-click in inventory to dump.
- Stack size = sum of all items' counts (max 64).
- Currently Java-only as of 1.21 (still in development for Bedrock).

**Suspicious Stew**
- Crafted with mushroom stew recipe + flower.
- Effect depends on flower (see §5.6).
- Effect lasts 6 seconds (varies).
- Stacks to 1.

**Potion**
- Drinkable (3:00 / 8:00 / 1:30 strong), Splash (same time, instant-on-impact), Lingering (cloud 0:22 / 0:45 / 0:11 strong).
- `potion_contents` component stores: `potion` ID, custom effects, custom color.

**Tipped Arrow**
- Arrow with `potion_contents` component.
- Effect duration = 1/8 of corresponding potion.
- Cannot be stacked with regular arrows.

**Spawn Egg**
- `entity_data` component stores mob to spawn.
- Spawn egg color derives from entity type.
- Some eggs are creative-only (iron golem, snow golem, ender dragon, wither, warden).

**Smithing Template**
- `minecraft:trim` for armor trims (17 patterns × 10 materials).
- Required to upgrade diamond→netherite tools/armor in smithing table.
- Each template has a "duplicate recipe" using 7 diamonds + pattern + matching block.

**Armor Trim**
- Apply in smithing table: armor + template + material ingot.
- `trim` component stores `{pattern, material}`.
- 17 patterns × 10 materials = 170 trim combos.
- Color/material affects visual pattern on armor.
- Trim does not change armor stats.

**Decorated Pot**
- (see above)

**Bundle**

**Elytra**
- Wear in chestplate slot.
- Press jump while falling to glide.
- Boost with firework rocket (consume rocket).
- Loses durability while gliding (1/sec + 1/block flown).
- Repaired with phantom membrane in anvil (or Mending).
- Enchants: Unbreaking, Mending, Curse of Vanishing only.
- Cannot be enchanted with Protection/etc.

**Bee Nest / Beehive (block items)**
- `bees` component stores bee entity NBT.
- Honey level 0–5; harvest with shears or bottles when level 5.

**Spawn Egg NBT**

**Lodestone Compass**
- `lodestone_target` component: `{pos: [x,y,z], dimension: "..."}`.
- Updates to point at lodestone block each tick.

**Recovery Compass**
- `recovery_compass` ID.
- Per-dimension death tracking in player data.

**Music Disc**
- `jukebox_playable` component: song ResourceLocation.

**Filled Map**
- `map_id` component: integer ID linking to map state in world data.
- `map_post_processing`: lock or scale.

**Trial/Ominous Trial Key**
- Used to right-click on Vaults (trial chamber reward containers).
- Ominous keys open ominous vaults (better loot, requires Bad Omen variant).

**Wolf Armor (1.21)**
- Right-click tamed wolf to equip.
- Dyed with any dye; washed in cauldron.
- Repaired with armadillo scute.
- Damaged when wolf takes damage (absorbs some).
- Stack size: 1.
- Cannot be enchanted (1.21).

**Heavy Core (1.21 block item)**
- Found in ominous vaults (trial chambers).
- Crafted with breeze rod to make mace.

**Breeze Rod (1.21)**
- Drops from Breeze mobs (trial chambers).
- Crafts 4 wind charges per rod.
- Crafts mace with heavy core.

**Trial Spawner / Vault (block items, creative-only)**
- `block_entity_data` stores configuration.
- Trial spawner: `spawn_data`, `simultaneous_entities`, etc.
- Vault: `server_data` (key state, loot table).

---

## Appendix A — Item Count by Category (1.21.4)

| Category | Count |
|----------|-------|
| Tools & weapons | ~40 |
| Armor (player + horse + wolf) | ~30 |
| Food & drink | ~50 |
| Potions + variants | ~200 (with all splash/lingering/strong/long) |
| Materials (drops + plants + compounds) | ~200 |
| Redstone components | ~40 |
| Transportation | ~25 |
| Spawn eggs | ~80 |
| Music discs | 16 |
| Pottery sherds | 20 |
| Smithing templates | 17 patterns + 1 netherite upgrade = 18 |
| Banner patterns | 8 |
| Goat horns | 8 |
| Dyes | 16 |
| Banners (16 colors × pattern combos) | 16 base + patterned variants |
| Misc | ~150 |
| **Total unique item IDs** | **~1580** |

## Appendix B — 1.21 New Items Summary

- **Mace** (weapon, 500 durability, scales with fall)
- **Breeze Rod** (drops from Breeze)
- **Wind Charge** (throwable, knockback)
- **Heavy Core** (block, mace ingredient)
- **Wolf Armor** (6 armadillo scutes)
- **Trial Key** (vault key)
- **Ominous Trial Key** (ominous vault key)
- **Ominous Bottle** (drinkable, Bad Omen amplifier)
- **Bogged Spawn Egg**, **Breeze Spawn Egg**
- **4 new status effects:** Wind Charged, Weaving, Oozing, Infested
- **3 new mace enchantments:** Density, Breach, Wind Burst
- **2 new banner patterns:** Flow, Guster
- **2 new armor trims:** Bolt, Host
- **Crafter** (block), **Copper Bulb** (block) — see blocks reference

## Appendix C — Cross-Reference to Blocks File

For block items (placeable blocks carried as inventory items), see `01-research-blocks.md`. Many items in this file have dual nature (e.g. `tnt`, `crafting_table`, `oak_planks` are both items and blocks).

---

**End of items reference.**
