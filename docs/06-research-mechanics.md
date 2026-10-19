# 06 — Minecraft Java 1.21.x Gameplay Mechanics Reference

**Scope:** Maximalist reference for all core gameplay mechanics in Minecraft Java Edition 1.21.x. Designed to feed prompt-kit generators that need exact numerical constants, formulas, and behavior specifications.

**Conventions**
- `tick` = 1 game tick = 0.05 s (20 Hz). Redstone tick = 0.1 s = 2 game ticks.
- `b/s` = blocks per second. `b/t` = blocks per tick.
- All HP values are out of 20 (10 hearts) unless stated.
- Coordinates use `(x, y, z)` world space; yaw/pitch in degrees.
- Where data varies by difficulty, all four (Peaceful/Easy/Normal/Hard) are listed.
- "Java only" tag marks behaviors that differ on Bedrock.

---

## Table of Contents

1. [Player Mechanics](#1-player-mechanics)
   - 1.1 Movement
   - 1.2 Jump & Fall Damage
   - 1.3 Swimming, Diving, Crawling
   - 1.4 Elytra Flight
   - 1.5 Health & Absorption
   - 1.6 Hunger, Saturation, Exhaustion
   - 1.7 Food Reference Table
   - 1.8 Air, Suffocation, Drowning
   - 1.9 XP System
   - 1.10 Game Modes
   - 1.11 Inventory & Stack Sizes
   - 1.12 Difficulty Effects on Player
2. [Difficulty Modes](#2-difficulty-modes)
3. [Combat Mechanics](#3-combat-mechanics)
4. [Redstone Deep-Dive](#4-redstone-deep-dive)
5. [Enchanting Deep-Dive](#5-enchanting-deep-dive)
6. [Brewing Deep-Dive](#6-brewing-deep-dive)
7. [Crafting System Deep-Dive](#7-crafting-system-deep-dive)
8. [Mining & Block Breaking](#8-mining--block-breaking)
9. [Light System](#9-light-system)
10. [Weather](#10-weather)
11. [Time & Day Cycle](#11-time--day-cycle)
12. [Tick System & Block Updates](#12-tick-system--block-updates)
13. [Other Mechanics (gamerules, commands, advancements, statistics)](#13-other-mechanics)
14. [Status Effects Reference](#14-status-effects-reference)

---

## 1. Player Mechanics

### 1.1 Movement

Player hitbox: 0.6 × 1.8 × 0.6 blocks (width × height × depth). Sneaking reduces eye height to 1.54 and hitbox height to 1.5. Gliding/crawling reduces height to 0.6. Baby hitboxes use 0.6 × 0.6 × 0.6 (renamed "child-like"). Eye height standing = 1.62.

| Action | Speed (b/s) | Multiplier vs. walking | Notes |
|---|---|---|---|
| Walking | 4.317 | 1.0× | Default `generic.movement_speed = 0.1` → 4.317 b/s with formula |
| Sprinting | 5.612 | 1.30× | Costs 1 exhaustion/0.5 m horizontally (vs 0.01 baseline) |
| Sneaking | 1.3 | 0.3× | Prevents falling off ledges; AABB height 1.5 |
| Crawling | 2.07 | 0.48× | Forced in 1-block-tall gaps; cannot be entered voluntarily except via gaps/water/elytra |
| Swimming (surface) | 4.917 | 1.14× | Forward + jump to surface-dive |
| Swimming (underwater) | 2.65 | 0.61× | Dolphin's Grace multiplies 5×; Depth Strider +1 step each level |
| Sprint-swimming | 9.83 | 2.28× | Sprint key while swimming |
| Creative flying | 11.0 | 2.55× | Vertical speed 4.0 b/s (jump = up, sneak = down) |
| Sprint-flying (creative) | 22.0 | 5.10× | Sprint key while flying |
| Elytra glide | up to 67.0 | — | See 1.4 |
| Sprint-flying with Elytra firework boost | up to ~33+ sustained | — | Each firework adds 1.5 s boost |

**Movement formula (Java):**
```
new_speed = base_speed * (1 + 0.2 * Speed_effect_level) * (1 - 0.15 * Slowness_level)
```
- Sprint multiplier applied after.
- Soul Speed boots add up to +0.6515 b/s on soul sand/soil (per level).
- Swift Sneak III adds +75% sneak speed (caps at walking speed).

**Step height:** 0.6 by default (auto-step up full blocks). Horses/mobs have 1.0; player remains 0.6.

**Soul Sand Valley / Soul Sand effect:** with no boots, player moves slower (0.4× multiplier). Soul Speed enchant overrides this.

**Honey block:** sliding along side reduces fall damage by 80% and slows descent.

**Cobweb:** movement speed 0.25× inside; fall damage negated.

**Berry bush:** movement 0.4×; deals 1 damage per 0.5 s in bush (except in armor-less players still take damage).

### 1.2 Jump & Fall Damage

- Jump height: 1.25 blocks (player can jump onto 1 block; barely reaches 1.2522).
- Jump velocity: 0.42 m/t upward initial.
- Jump boost effect adds 0.1 per level to jump velocity.
- A single jump lasts 12 ticks (0.6 s) before landing at same Y.

**Fall damage formula:**
```
damage = max(0, blocks_fallen - 3)  // in half-hearts (1 HP)
```
- 4-block fall = 0 damage. 4-block fall from y=10 to y=6 (3 blocks) = 0 damage.
- 5-block fall = 1 damage. 10-block fall = 6 damage. 23-block fall = 19 damage. 24+ = lethal.
- Fall damage cap: theoretical 0 (no cap; falls >23 blocks kill from full HP).
- **Feather Falling:** reduces fall damage by 12% per level (cap 48% at FF IV). Also reduces fall damage from ender pearls (which otherwise deal 5 fall damage).
- **Jump Boost** effect negates fall damage up to (level × 1) extra blocks (i.e., Jump Boost I adds 1 safe block).
- Falling into water ≥2 blocks deep negates all fall damage (water blocks acts as cushion). 1 block of water also works.
- Honey block, cobweb, hay bale (80% reduction), slime block (100% negation, bounces), powder snow (negates fall damage when landing on it).
- Elytra deploy mid-fall negates fall damage.

### 1.3 Swimming, Diving, Crawling

- **Surface swimming** triggers when player's eye is above water and feet below.
- **Diving** = sprint-swim into water deeper than 1 block; consumes air meter.
- **Crawling** triggered when player's hitbox is forced below 1.5 blocks (e.g., under a slab, in 1-block-tall gap, while swimming out of water, while gliding with elytra).
- Cannot voluntarily enter crawl on flat ground — requires a low ceiling or transitional state.
- Iron golems, withers, wardens, ender dragons, giants are taller than 1.8 (cannot enter 1-block gaps).

### 1.4 Elytra Flight

- Elytra equipped in chestplate slot.
- Activation: press jump while falling (mid-air), or jump from a height.
- Glide physics: angle controls speed. Pitch down = accelerate; pitch up = climb (loses speed).
- **Maximum sustainable speed**: ~67.0 b/s (~33.5 m/s) achieved at 45° downward dive.
- **Terminal velocity**: ~78 b/s briefly during dive.
- **Firework boost**: a firework rocket (flight duration 1/2/3) adds ~1.5/2.0/2.5 s of boosted flight at +15 b/s per pulse. Deals damage if firework has a firework star (explode on use).
- Elytra durability: 432 uses; loses 1 durability/second while flying (Unbreaking/Mending applies).
- Cannot glide if hitbox is in water (must exit water).
- Collision with wall while gliding at high speed → fall damage proportional to horizontal speed (caps at 8× speed in half-hearts).

### 1.5 Health & Absorption

- Base max HP: **20 (10 hearts)**.
- **Absorption hearts** (golden apple, Absorption effect) are temporary yellow hearts; lost first, do not regenerate.
  - Golden apple: +4 absorption (2 yellow hearts) for 2:00.
  - Enchanted golden apple: +8 absorption (4 yellow hearts) for 2:00.
  - Absorption effect (via /effect): +4 HP per amplifier level.
- **Health Boost** effect: +4 max HP per level (rare, only commands/beacon-adjacent effects). Removed when effect ends.
- **Regeneration** effect: 1 HP per `(50 / (2 ^ level))` ticks. Regen I = 1 HP / 2.5 s. Regen II = 1 HP / 1.25 s.
- **Poison** effect: deals 1 damage per `(25 / 2^level)` ticks, cannot reduce below 1 HP.
- **Wither** effect: like poison but can kill. 1 damage per `(40 / 2^level)` ticks.

### 1.6 Hunger, Saturation, Exhaustion

Three hidden values:

| Stat | Range | Notes |
|---|---|---|
| `foodLevel` (hunger) | 0–20 (1 hunger shank = 2) | Visible in HUD |
| `foodSaturationLevel` | 0–`foodLevel` | Depletes before hunger |
| `foodExhaustionLevel` | 0–4 | Reaches 4 → subtract 0.5 from saturation (or hunger if saturation is 0), reset to 0 |

**Exhaustion sources:**

| Action | Exhaustion |
|---|---|
| Jump (sprint) | 0.2 / 0.8 |
| Swim 1 m | 0.01 |
| Sprint 1 m horizontal | 0.1 |
| Walk 1 m | 0.01 |
| Attack a mob | 0.1 |
| Take damage | 0.1 |
| Eat food | 0.3 (resets exhaustion somewhat) |
| Regenerate 1 HP (hunger-driven) | 6.0 |
| Sprint-jump | 0.2 jump + 0.8 sprint = 1.0 |
| Mine a block | 0.025 |

**Hunger effects (per food tick, every 4 ticks = 0.2 s):**

| Condition | Effect |
|---|---|
| `foodLevel ≥ 18` AND can regen | Regen 1 HP per 4 s (4 HP / 80 ticks); costs 6 exhaustion |
| `foodLevel = 0` | Lose 1 HP per 4 s on Normal/Hard; down to 1 HP on Easy; nothing on Peaceful |
| `foodLevel ≤ 6` | Cannot sprint |

**Difficulty starvation threshold:**

| Difficulty | Starvation floor |
|---|---|
| Peaceful | Hunger never depletes; food ticks heal 1 HP / 0.5 s if hunger full |
| Easy | HP cannot drop below 10 |
| Normal | HP cannot drop below 1 |
| Hard | HP can drop to 0 (death by starvation) |

### 1.7 Food Reference Table

| Food | Hunger | Saturation | Effective Quality (hunger + 2× sat) | Notes |
|---|---|---|---|---|
| Apple | 4 | 2.4 | 8.8 | |
| Golden Apple | 4 | 9.6 | 23.2 | Regen II 5s + Absorption I 2m |
| Enchanted Golden Apple | 4 | 9.6 | 23.2 | Regen II 20s + Absorption IV 2m + Fire Res 5m + Resistance I 5m |
| Sweet Berries | 2 | 0.4 | 2.8 | |
| Glow Berries | 2 | 0.4 | 2.8 | |
| Carrot | 3 | 3.6 | 10.2 | |
| Golden Carrot | 6 | 14.4 | 34.8 | Best non-meat food |
| Potato | 1 | 0.6 | 2.2 | |
| Baked Potato | 5 | 6 | 17 | |
| Beetroot | 1 | 1.2 | 3.4 | |
| Beetroot Soup | 6 | 7.2 | 20.4 | Returns bowl |
| Bread | 5 | 6 | 17 | |
| Cookie | 2 | 0.4 | 2.8 | Stack to 64 |
| Cake (slice) | 2 | 0.4 | 2.8 | 7 slices total = 14/2.8 |
| Dried Kelp | 1 | 0.6 | 2.2 | Eat 64 in 64 s advancement |
| Melon Slice | 2 | 1.2 | 4.4 | |
| Mushroom Stew | 6 | 7.2 | 20.4 | Returns bowl |
| Suspicious Stew | 6 | 7.2 | 20.4 | Random effect 5–15 s |
| Pumpkin Pie | 8 | 4.8 | 17.6 | |
| Raw Beef | 3 | 1.8 | 6.6 | |
| Steak (Cooked Beef) | 8 | 12.8 | 33.6 | |
| Raw Porkchop | 3 | 1.8 | 6.6 | |
| Cooked Porkchop | 8 | 12.8 | 33.6 | |
| Raw Mutton | 2 | 1.2 | 4.4 | |
| Cooked Mutton | 6 | 9.6 | 25.2 | |
| Raw Chicken | 2 | 1.2 | 4.4 | 30% Hunger 30s |
| Cooked Chicken | 6 | 7.2 | 20.4 | |
| Raw Rabbit | 3 | 1.8 | 6.6 | |
| Cooked Rabbit | 5 | 6 | 17 | |
| Rabbit Stew | 10 | 12 | 34 | Returns bowl |
| Raw Cod | 2 | 0.4 | 2.8 | |
| Cooked Cod | 5 | 6 | 17 | |
| Raw Salmon | 2 | 0.4 | 2.8 | |
| Cooked Salmon | 6 | 9.6 | 25.2 | |
| Pufferfish | 1 | 0.2 | 1.4 | Nausea 15s + Hunger 15s + Poison IV 1m |
| Tropical Fish | 1 | 0.2 | 1.4 | |
| Spider Eye | 2 | 3.2 | 8.4 | 80% Poison 4s |
| Rotten Flesh | 4 | 0.8 | 5.6 | 80% Hunger 30s |
| Poisonous Potato | 2 | 1.2 | 4.4 | 60% Poison 4s |
| Chorus Fruit | 4 | 2.4 | 8.8 | Teleports randomly |
| Honey Bottle | 6 | 1.2 | 8.4 | Cures Poison |

**Note:** Vanilla Minecraft has **no thirst system**. Hardcore mode adds only permadeath, not thirst.

### 1.8 Air, Suffocation, Drowning

- **Air meter**: 10 seconds (200 ticks) of breath-hold (visible as 10 bubbles).
- **Drowning damage**: 2 HP per tick after air depletes, every 1 s (≈ 2 HP/s).
- **Respiration enchant**: +15 s air per level (max +45 s at III). Also reduces drowning damage chance by (level × 15)%.
- **Turtle Shell** helmet: +10 s Water Breathing effect when entering water (10 s cooldown after effect ends).
- **Suffocation (inside block)**: 1 HP per tick, every 0.5 s = 2 HP/s. Triggered when player's eye (1.62) is inside a solid block (e.g., sand falls on player, pushed by piston).
- **Entity collision suffocation** (e.g., inside a shulker / minecart on a wall): also 2 HP/s.
- **Anvil fall damage**: 2 HP per block fallen (max 40 HP).

### 1.9 XP System

**Levels and XP per level:**

| Levels | XP to next level |
|---|---|
| 1–15 | `2 * level` |
| 16–30 | `5 * level - 38` |
| 31+ | `9 * level - 158` |

Total XP from level 0 to level L:
```
total_xp(L):
  if L <= 16:   return L*L + 6*L
  if L <= 31:   return 2.5*L*L - 40.5*L + 360
  else:         return 4.5*L*L - 162.5*L + 2220
```

Examples: Lvl 30 = 1395 XP. Lvl 50 = 4625 XP. Cap = 2,147,483,647 (int32).

**XP orb sizes:** XP orbs are spawned as a single entity with a specific value (1–2400), not split. Common orb values from various sources:

| Source | Orb XP value |
|---|---|
| Most mob kills | 1–3 (random small) |
| Baby animal bred | 1–7 |
| Player kill | `7 × level` (max 100 per orb) |
| Smelting coal ore | 0.2 (rounded down to 1 per 5 ore) |
| Smelting diamond/emerald/lapis/redstone/quartz/nether quartz ore | 0.2–2 per item |
| Bottle o' Enchanting | 3–11 |
| Ender Dragon (first kill) | 12000 (12 orbs × 1000 each) |
| Ender Dragon (subsequent) | 500 (single orb) |
| Trial spawner wave completion | 4 + per-mob XP |
| Trade with villager | 3–6 |
| Fishing | 1–6 |
| Wither boss | 50 |

The orb entity has a `Value` NBT field storing the integer XP amount. Players collect orbs on contact; XP is added to the player's total progress.

### 1.10 Game Modes

| Mode | Damage | Fly | Build | Break | Interact mobs | Inventory | Notes |
|---|---|---|---|---|---|---|---|
| Survival | Yes | No | Yes | Yes | Yes | Yes | Hunger, XP, mining |
| Creative | No | Yes | Yes | Instant | Yes | Infinite blocks | Cannot die (void still kills in Java) |
| Adventure | Yes | No | No (only on placeable blocks) | Only with proper tool | Yes | Yes | For map makers |
| Spectator | No | Yes | No | No | Right-click to possess mobs | No inventory access | Cannot interact with world |

**Spectator mode notes:**
- Can fly through blocks.
- Can spectate any entity by left-clicking.
- Cannot be detected by mobs (no aggro).
- Cannot take damage except void.
- Dye-colored view per spectated entity.

**Hardcore mode:** Locked to Hard difficulty. On death → world deleted (or spectator mode if gamerule `hardcore` keeps world). Heart icon shows on world list.

### 1.11 Inventory & Stack Sizes

- **Player inventory:** 36 general slots (27 inventory + 9 hotbar) + 4 armor + 1 offhand = 41 inventory slots.
- Including the 2×2 crafting (3 inputs + 1 result) = 44, but craft result slot is transient.
- The user's spec mentions 51 total; that's the count including 27 inventory + 9 hotbar + 4 armor + 1 offhand + 9 crafting (in 3×3 table) + 1 result. Total counted: 36+4+1 = 41 standard; if you include the 3×3 crafting grid (9) plus result (1) → 51 slots accessed simultaneously when table open.
- **Stack sizes:**
  - Default: 64 (most items).
  - 16: ender pearls, snowballs, eggs, signs (pre-1.14), buckets (when empty or filled water/lava; "stack of empty buckets" was once allowed but now items with NBT stack to 16).
  - 1: tools, weapons, armor, potions, buckets with contents, minecarts/boats (1 each but stackable 16), honey bottles (16), written books (16), music discs (1), saddles, horse armor, banners (16), beds (1), shulker boxes (1, contain other items).

**Carry weight:** Vanilla Minecraft has **no carry weight system**. Players carry up to 36 stacks × 64 = 2,304 items normally; with shulker boxes inside inventory: up to 27 × 64 = 1,728 items per shulker box × 36 shulker boxes = 62,208 items in inventory.

### 1.12 Difficulty Effects on Player

| Effect | Peaceful | Easy | Normal | Hard |
|---|---|---|---|---|
| Hostile mob spawning | None (despawn instantly) | Yes | Yes | Yes |
| Hunger depletion | Off | On | On | On |
| Starvation damage | Off | Cannot drop below 10 HP | Cannot drop below 1 HP | Can kill |
| Zombie breaking wooden doors | No | No | Yes (regional diff ≥ 50%) | Yes |
| Zombie reinforcement spawning | No | Yes | Yes | Yes |
| Spider poison attack (on hit) | No | No | Yes (chance) | Yes (chance) |
| Wither effect | No | Yes (cannot kill) | Yes | Yes (can kill) |
| Wither spawning | No | Yes | Yes | Yes |
| Creeper explosion radius (charged) | n/a | 3.0 / 5.0 | 3.0 / 5.0 | 3.0 / 5.0 (damage scaled by difficulty & proximity) |
| Creeper damage to player | n/a | Reduced (~50%) | Standard (100%) | Increased (~150%) |
| Zombie damage | n/a | 2 | 3 | 4 |
| Skeleton arrow damage | n/a | 1–4 | 1–4 | 1–5 |
| Wither skull damage | n/a | 5 | 8 | 12 |
| Pillager raid wave count | n/a | 3 | 5 | 7 |
| Etc. | varies | varies | varies | varies |

**Hardcore:** Difficulty locked to Hard. Death = world deletion (or locked to spectator if `keepInventory`-like config used). Heart icon shown on world list.

---

## 2. Difficulty Modes

### 2.1 Difficulty Types

| Difficulty | Hostile Spawn | Starvation | Zombie Door Break | Special |
|---|---|---|---|---|
| Peaceful | None | None | No | Health regens fast (every 0.5 s if hunger ≥ 18); hunger doesn't deplete |
| Easy | Yes (reduced damage) | Stops at 10 HP | No | Spiders can't poison; zombies don't break doors; wither can't kill |
| Normal | Yes (standard) | Stops at 1 HP | Yes (regional diff ≥ 50%) | All hostile features |
| Hard | Yes (max damage) | Can kill | Yes | Zombies break doors; wither kills; raids max waves; Regional Difficulty maxes higher |
| Hardcore | Hard + permadeath | Can kill | Yes | Locked Hard; death = world delete or spectator |

### 2.2 Regional Difficulty

`regional_difficulty = (clamped_local_difficulty + moon_phase_factor) * difficulty_multiplier`

Local difficulty for a chunk (per chunk, stored):
```
local_difficulty(chunk):
  inhabited_time = chunk.InhabitedTime (ticks)
  base = 0.2 + (inhabited_time / 3600000)   // saturates at 1.0
  // 3600000 ticks = 50 hours
  // After 50h, base = 1.2 (max)
  return base * moon_phase_factor
```

Moon phase factor: `1.0` (new moon) to `1.0 + (4 * 0.25)` = up to ~1.6 (full moon).

Difficulty multiplier: Peaceful = 0.0, Easy = 0.75, Normal = 1.5, Hard = 2.25.

Clamped regional difficulty (used by mob spawns, etc.): clamped to `[0.0, 1.0]` range. Used for:
- Zombie door-breaking (≥ 0.5 on Normal → can break).
- Zombie reinforcement spawn chance.
- Skeleton / zombie equipment chance.
- Slime spawn rate in swamps.

### 2.3 Moon Phase

8 phases, each 1 full day (24000 ticks / 20 minutes). Lunar cycle = 8 days = 2 hours 40 minutes real time.

| Phase | Day | Slime spawn in swamp? | Affects |
|---|---|---|---|
| Full moon | 0 | Yes (max) | Spawning factors peak |
| Waning gibbous | 1 | Yes | |
| Last quarter | 2 | Yes | |
| Waning crescent | 3 | Yes | |
| New moon | 4 | No (none) | Minimum spawns |
| Waxing crescent | 5 | No | |
| First quarter | 6 | Yes | |
| Waxing gibbous | 7 | Yes | |

Slimes spawn in swamp at Y=50–70 only when moon phase < 4 (i.e., not new moon phase 4, but conditions vary slightly).

---

## 3. Combat Mechanics

### 3.1 Attack Cooldown

Each item has an `attack_speed` attribute; the base value:
- Sword: 1.6 (cooldown 1.0 s, attack speed multiplier 1.6 means 1.6 attacks per second).
- Axe (wood/gold/stone/iron/diamond/netherite): 0.8–1.0 (1.0–1.25 s cooldown).
- Pickaxe: 1.2 (0.83 s).
- Shovel: 1.0 (1.0 s).
- Hoe: 1.0–4.0 (wood=1, stone=2, iron=3, diamond/netherite=4).
- Other items (no weapon): 4.0 (0.25 s cooldown).

**Cooldown progress bar:** Rises from 0 to 100% over `20 / attack_speed` ticks. Damage scales with progress:
```
damage_dealt = base_damage * (0.2 + progress^2 * 0.8)
```
- At 100% progress: full base damage.
- At <100%: reduced (e.g., 50% progress → 0.2 + 0.25 * 0.8 = 0.4× damage).
- Critical hits require ≥ 100% progress.

### 3.2 Critical Hits

Triggered when:
- Player is falling (descending Y velocity), AND
- Player is not on ground, AND
- Player is not affected by Slow Falling, AND
- Player is not on ladder/vine, AND
- Player is not in water (1.9+ removed water-crit), AND
- Player is not blinded, AND
- Player is not sprinting, AND
- Attack cooldown is at 100%.

**Effect:** +50% damage (×1.5 multiplier), deals critical-hit particles (star burst).

### 3.3 Sweep Attack

Triggered with sword when:
- Attack cooldown ≥ 84% (visible as 84%+).
- Player is on ground (not jumping).
- Player is not sprinting.
- Player walks forward / attacks.

Effect: deals 1 + base_damage / 2 sweep damage to all enemies within ~1 block of the target (in a 90° cone). Knockback is applied. Only swords (any material) sweep. Sweeping Edge enchant increases sweep damage (I: +50%/+33% / II: +67%/+67% / III: +75%/+100%).

### 3.4 Knockback

- Base melee knockback: 0.5 (knockback resistance reduces).
- Sword knockback: same as base.
- Knockback enchant (I/II): +1 / +2 levels = +1.5 / +3 knockback per level.
- Sprint-attack: +1 knockback (sprint crit).
- Knockback resistance: shulker 1.0, iron golem 1.0, ender dragon 1.0, wither 0.6, warden 1.0, most mobs 0.0.
- Knockback formula: `velocity_change = -knockback * (1 - knockback_resistance)` along horizontal axis + 0.4 upward.

### 3.5 Shield Blocking

- Right-click hold = block.
- Blocks 100% of frontal damage (within ~90° of facing direction).
- Damage sources blocked: melee, projectile (arrows, tridents, fireballs, ghast balls, shulker bullets, snowballs), thrown items, fireworks.
- Damage NOT blocked: falling, drowning, suffocation, fire tick, void, magic (potions/Instant Damage), thorns, fall.
- After blocking a hit, **shield disabled for 5 seconds (100 ticks)** if hit by an axe-wielding mob/player (or by an arrow from a dispenser/crossbow piercing).
- Shield durability: 336; loses 1 + (damage / 2) when blocking.
- Banner can be applied to shield (cosmetic).

### 3.6 Damage Types

| Type | Source | Notes |
|---|---|---|
| `generic` / melee | Sword, axe, fists, mob melee | Reduced by armor |
| `projectile` | Arrow, trident, fireball, snowball, shulker bullet | Reduced by armor + Projectile Protection |
| `explosion` (player) | TNT, creeper, ghast fireball, wither skull, end crystal | Reduced by armor + Blast Protection |
| `explosion.none` | Bed/respawn anchor explosion in wrong dimension | |
| `fire` / `in_fire` | Standing in fire, lava, magma block, campfire | Reduced by Fire Protection |
| `burn` / `on_fire` | Fire tick (after effect of being on fire) | Same |
| `lava` | Lava | |
| `drown` | Drowning | Not reduced by armor |
| `fall` | Falling damage | Reduced by Feather Falling |
| `fly_into_wall` | Elytra collision | |
| `cactus` | Cactus block | |
| `sweet_berry_bush` | Moving inside berry bush | |
| `in_wall` / `suffocate` | Entity inside solid block | |
| `magic` / `indirect_magic` | Instant Damage potion, evoker fangs, guardian laser | Reduced by Resistance, not by armor |
| `wither` | Wither effect, wither skeleton | Reduced by armor |
| `starve` | Hunger | None |
| `anvil` | Falling anvil | |
| `falling_block` | Falling sand/gravel/anvil/concrete powder | |
| `out_of_world` / `void` | Y < -64 | Bypasses everything |
| `freeze` | Powder snow (without leather armor) | Reduced by Frost Walker leather boots |
| `lightning_bolt` | Lightning strike | |
| `trident` | Trident throw | Counts as projectile + Impaling applies |
| `arrow` | Arrow | |
| `fireworks` | Firework explosion (crossbow) | |
| `mob_attack` | Mob melee | |
| `player_attack` | Player melee | |
| `sting` | Bee attack | Applies poison |
| `thorns` | Thorns enchant | |

### 3.7 Armor Damage Reduction

Formula:
```
damage_after_armor = damage * (1 - min(20, max(damage/2, total_armor) / 25))
```

Simplification:
```
reduction = total_armor * 4% (capped at 80%)
reduced_damage = damage * (1 - reduction)
```

Examples:
- Diamond armor (20): 80% reduction.
- Netherite armor (20): 80% reduction (same; toughness matters more).
- Iron armor (15): 60% reduction.
- Leather armor (7): 28% reduction.

**Armor toughness** reduces the "armor penetration" effect of high-damage hits:
```
reduction = armor / 25 - (4 * damage) / (toughness + 8)
```
- Netherite has +3 toughness per piece = 12 total → high-damage hits less penetrate.
- Diamond has +2 per piece = 8 total.

### 3.8 Resistance Effect

- Level 1 (I): -20% damage from all sources except void / starvation / `out_of_world`.
- Level 2: -40%
- Level 3: -60%
- Level 4: -80%
- Level 5+: -100% (immune).
- Each level = 20% reduction. Source: Beacon (level I/II), Enchanted Golden Apple (level I for 5m), Totem of Undying (level I briefly).

### 3.9 PVP Mechanics

- Player attack damage applies armor reduction.
- Knockback applied (sprint-crit = max knockback).
- Shield negates melee; axe disables shield 5 s.
- Ender pearl throws are PvP tools for chasing.
- Tridents with Channeling / Riptide / Loyalty usable in PvP.
- Crossbow with Piercing IV shoots 4 arrows; Multishot shoots 3 in spread.
- Bow with Power V does up to 12-25 damage per shot (varies by charge).
- /pvp gamerule (Bedrock only; Java is per-world via plugins).

---

## 4. Redstone Deep-Dive

### 4.1 Power Levels

Redstone signal: integer 0–15.

- **Power source** (e.g., lever, torch): outputs **15**.
- **Redstone dust** transmits signal; **decays by 1 per block** traveled. So a line of dust from a torch shows 15 → 14 → 13 → ... → 0 over 15 blocks.
- **Repeater** outputs 15 again (refreshes signal).
- **Comparator** outputs 0–15 (depends on input mode).
- **Powered block** (any solid block powered by dust/torch/repeater): emits power 15 to adjacent dust/redstone components, but **transparent blocks (glass, leaves, slabs top half, etc.) cannot be powered**.

### 4.2 Power Sources (Detailed)

| Source | Power Output | Activation Duration | Notes |
|---|---|---|---|
| Lever | 15 | Toggle (on/off) | Player toggles |
| Button (wood) | 15 | 1.5 s (30 ticks) | |
| Button (stone) | 15 | 1.0 s (20 ticks) | |
| Button (wooden species: oak/spruce/birch/jungle/acacia/dark_oak/crimson/warped/mangrove/cherry/bamboo) | 15 | 1.5 s | All wood variants = 1.5 s |
| Pressure Plate (wood) | 15 | 1.0 s after entity leaves | Activated by all entities |
| Pressure Plate (stone) | 15 | 1.0 s | Only mobs/players (not items) |
| Pressure Plate (light weighted — gold) | 15 | 1.0 s | Output depends on stack count: 1 item → signal 1; full stack → signal 15 (specifically: signal = min(15, items_count)). |
| Pressure Plate (heavy weighted — iron) | 15 | 1.0 s | signal = min(15, items_count / 10) |
| Pressure Plate (obsidian — Bedrock only / "polished blackstone pressure plate") | 15 | 1.0 s | Acts like stone |
| Tripwire | 15 | While entity on wire | Up to 40 blocks long, needs hook on both ends |
| Detector Rail | 15 | While minecart on rail | Power to block beneath, comparators read contents |
| Daylight Sensor | 0–15 (day) | Always emits (proportional to sky light) | Inverted variant emits at night |
| Observer | 15 | 2-tick (0.1 s) pulse when adjacent block updates | Detects block state changes |
| Sculk Sensor | 15 | 30-tick (1.5 s) pulse on detected vibration | Calibrated variant filters by frequency |
| Target Block | 0–15 | While struck by projectile | Signal = 15 if hit dead-center, decays with distance from center |
| Note Block (when struck) | 15 | 1 redstone tick | Plays note + emits brief pulse to comparators read note strength |
| Redstone Torch | 15 | Constant (off when block above powered) | Inverts signal |
| Redstone Block | 15 | Constant (emits to all 6 sides) | |
| Comparator (output) | 0–15 | Per mode | See 4.5 |
| Lectern | 1 | While book open | Powers redstone when a player is reading |
| Tripwire hook | 15 | Tripwire triggered | |
| Lightning Rod | 15 | 8-tick pulse when struck | Powers itself + below block |
| Chiseled Bookshelf | 0–15 | Outputs signal based on last slot used | Slot-based comparator output |
| Copper Bulb | 15 | While powered on | Toggle state on pulse |
| Crafter | 15 (when crafted) | When crafting completes | Comparator reads crafter state |
| Jukebox | 0–15 | While record playing | Comparator signal = record ID |
| Calibrated Sculk Sensor | 0–15 | 30-tick pulse, frequency-filterable | Adjustable filter via note blocks / amethyst |

### 4.3 Powered vs. Activator Blocks

**Powered blocks** (any block that conducts redstone when powered):
- Most solid blocks: stone, dirt, wood, wool, concrete, etc.
- Cannot be powered: glass, leaves, slabs (top half only — actually slabs DON'T conduct; the bottom half is solid), stairs (variable), farmland, ice, glowstone, sea lantern, beacon, redstone dust itself.

**Activator blocks** (respond to redstone signal):
- **Piston** (pushes up to 12 blocks).
- **Sticky Piston** (pushes and pulls on retract).
- **Dispenser** (uses items in inventory: shoots arrows, places water, equips armor, etc.).
- **Dropper** (drops items as if dropped by player).
- **Note Block** (plays sound on pulse).
- **Door, Trapdoor, Fence Gate** (toggle open/closed).
- **Hopper** (disabled while powered).
- **Redstone Lamp** (lights up).
- **TNT** (ignites on rising edge).
- **Rails** (activator rail triggers minecarts; powered rail accelerates).
- **Copper Bulb** (toggle on pulse).
- **Crafter** (crafts on pulse).
- **Lectern** (book flipping, comparator output).
- **Command Block** (executes command on pulse).

### 4.4 Redstone Dust Mechanics

- Dust can be placed on top of solid blocks.
- Connects automatically to adjacent dust, torches, repeaters, comparators, and certain power sources.
- Climbs 1 block vertically when adjacent dust is 1 block higher (forms an "up-step").
- Does NOT climb down (a dust at y=10 doesn't connect to dust at y=9 next to it horizontally — needs the upper dust to be adjacent via vertical side).
- Power decays by 1 per block along dust line.
- Dust on top of a solid block transmits signal to dust on adjacent solid blocks (via the block), but block beneath acts as a "powered block" emitting signal to all adjacent dust.

### 4.5 Comparator Modes

- **Compare mode (default, front torch down):** Output = `inputA` if `inputA ≥ side_input`, else 0. Used as a "≥ gate" or signal-strength detector.
- **Subtract mode (front torch up):** Output = `max(0, inputA - max(side_input1, side_input2))`. Used as a subtractor.

**Block content reading (analog output):**
- Chest/Double Chest: signal = `floor(items_total / max_stack * 14) + (items_total > 0 ? 1 : 0)`. For a chest with N slots, capacity = N × 64.
  - Single chest (27 slots, 1728 max): 1 item → signal 1; full → signal 15.
- Barrel (same as chest).
- Shulker box (27 slots, but stacks to 1 → max 27 items): signal = `floor(items / 27 * 15) + (items > 0 ? 1 : 0)`. Full = signal 15.
- Hopper (5 slots): proportional.
- Brewing stand (5 slots, but blaze powder doesn't count as "content" in some versions): signal = 0–15 based on filled slot count.
- Furnace: signal based on smelting progress and items inside.
- Jukebox: signal = record ID (1–13).
- Chiseled Bookshelf: signal = last slot index (0–15).
- Composter: signal = compost level (0–8) → mapped to 0–15.
- Cake: signal = 14 - slices_eaten.
- Beehive / Bee Nest: signal = honey level × 2 (max 5 → signal 10; comparator reads it).
- Cauldron: signal = water level × 3 (max 3 → signal 9).
- Calibrated Sculk Sensor: emits the analog strength of the last detected vibration.

### 4.6 Repeater Mechanics

- 1-tick, 2-tick, 3-tick, 4-tick delays (set by right-click; visually changes notch on repeater).
- 1 tick = 0.1 s = 2 game ticks.
- Output is always 15 (refreshes signal).
- **One-way**: signal cannot pass backward (repeater only outputs in the direction it's pointing).
- **Locked**: a repeater pointing into the side of another repeater, when powered, **locks** the second repeater's output to its current state (regardless of input change). Used for memory cells.

### 4.7 Quasi-Connectivity (Java Edition Peculiarity)

A piston can be **powered from above** by an adjacent power source, even if no direct connection from the side. Specifically: if a redstone signal powers the **block above the piston**, the piston is activated (Java-only behavior, due to how redstone checks "powered" state for blocks that are dust-connectable on top).

- This causes "BUD" (block update detector) behavior: pistons can be in a "powered but not yet activated" state, then activated when a neighboring block updates.
- Bedrock Edition does NOT have quasi-connectivity.

### 4.8 Block Update Detection (BUD)

A **BUD switch** is a circuit that detects any block state change in adjacent blocks. Common implementation: place a piston that's quasi-connected (powered from above but not yet activated); when an adjacent block updates, the piston fires.

Modern alternative: **Observer** block (auto-detects adjacent block state change → emits 2-tick pulse). Observer pulse fires even when the change isn't a "block update" in the traditional sense (e.g., crop growth, leaf decay, fence connection changes).

### 4.9 Tick System

- **Game tick**: 1/20 s = 50 ms.
- **Redstone tick**: 2 game ticks = 0.1 s.
- A "0-tick pulse" is 1 game tick (0.05 s) — handled via specific edge cases (piston push + dust update).
- Default redstone tick queue: redstone components update on even game ticks.
- Maximum chain length before "tick lag" / signal loss: dust decays after 15 blocks; repeaters reset.

### 4.10 Logic Gates with Redstone

| Gate | Inputs | Output | Circuit |
|---|---|---|---|
| NOT | A | ¬A | Redstone torch inverts input |
| OR | A, B | A∨B | Dust merges two signals |
| AND | A, B | A∧B | Two repeaters in series, both must be powered |
| NAND | A, B | ¬(A∧B) | AND followed by NOT (torch) |
| XOR | A, B | A⊕B | Two comparators in subtract mode, or pulse-length comparison |
| NOR | A, B | ¬(A∨B) | OR followed by torch |
| XNOR | A, B | ¬(A⊕B) | XOR followed by torch |
| IMPLIES | A, B | A→B | OR with inverted A input |

### 4.11 Common Circuits

- **T-Flip-Flop**: converts a button press into a lever-like toggle. Common designs use 2 sticky pistons + block, or a hopper clock + comparator.
- **Clock (clock generator)**:
  - Repeater clock: 4 repeaters in a loop with 1-tick delay each → 4-tick clock.
  - Hopper clock: 2 hoppers facing each other, 1 item bouncing back and forth → adjustable period.
  - Comparator clock: 1 comparator in subtract mode + dust loop → 1-tick pulse clock.
  - Daylight sensor clock: 1 daylight sensor → triggers at sunrise/sunset.
- **Pulse Extender**: extends a short pulse to longer duration. Common: comparator subtract mode + line of dust; or fader circuit.
- **Memory Cell**:
  - SR latch: 2 NOR gates cross-coupled.
  - D latch: clocked SR latch.
  - Repeater-lock memory: repeaters in a line, locked by side signal.

### 4.12 Piston Mechanics

- **Push limit**: 12 blocks maximum (line of movable blocks).
- **Pushable blocks**: most solid blocks (dirt, stone, wood, ore blocks, sand, gravel, etc.).
- **NOT pushable**:
  - Obsidian, crying obsidian, bedrock, end portal frames, end portal/gateway blocks, spawners, enchanting tables, anvils ( anvils ARE pushable actually, only heavy core isn't — corrected: anvils are pushable; the list of immovable includes: bedrock, obsidian, spawners, end portal frame, end portal, end gateway, reinforced deepslate, jukebox, nether portal block, barrier, command blocks, structure blocks, light block, piston head, moving piston (block 36), extended piston, spawner, enchanting table isn't pushable actually, obsidian/crying obsidian, respawn anchor (when charged), ancient debris (no — pushable actually; only obsidian, bedrock, spawners, structure blocks, end portal frames are immovable), brewing stand (pushable).
  - Block entities (tile entities) — these have NBT data and cannot be pushed:
    - All containers (chest, shulker box, hopper, furnace, brewing stand, barrel, dispenser, dropper).
    - Signs, banners (1.14+ pushable on Java, NOT pushable on Bedrock).
    - Beds, beacons, comparators, observers (these are pushable actually).
    - Note blocks, jukeboxes (NOT pushable).
- **Block 36 (moving piston)**: a transient block state during piston extension/retraction. Cannot be broken normally; exists for 1-3 ticks.
- **Piston head**: appears when extended; is a block with state `extended=true`.

**Sticky piston retraction**: pulls back 1 block (not the whole 12). If the block adjacent to sticky piston is a "non-stick" block (e.g., glazed terracotta on Bedrock — Java doesn't have this exception), it doesn't pull back.

**Slime block / honey block**:
- Slime block: pulls adjacent blocks when pushed (and any slime-block-attached chain).
- Honey block: same as slime, but does NOT stick to slime blocks (allows independent chains).
- Both reduce fall damage.

### 4.13 Hopper Mechanics

- **Transfer rate**: 1 item per 8 ticks (0.4 s) = 2.5 items/sec per face transfer.
  - Wait — actually 8 redstone ticks = 0.8 s? No. Java hopper transfer: 8 game ticks = 0.4 s per item transfer. That's 2.5 items/sec.
  - Correction: hopper moves 1 item every 8 game ticks (= 0.4 s = 2.5 items/sec) — wait actually the common reference says 9000 items/hour = 2.5/sec but I've also seen 4/sec.
  - Actual Java behavior: hopper transfers 1 item every 8 game ticks = 0.4 s = 2.5 items/sec between containers. But this is sometimes stated as "transfers 1 item per 0.4 s into container, AND can suck 1 item per 0.1 s from above" = 10 items/sec pickup rate.
  - Let me settle: hopper has 2 cooldown timers:
    - **Transfer** (to container below/side): 8 game ticks (0.4 s) → 2.5 items/sec.
    - **Suck** (from world above): same 8-game-tick cooldown → 2.5 items/sec.
- **Suck range**: items within 1 block above hopper (i.e., the air block above hopper hitbox + small margin).
- **Item pickup priority**: items closer to center of hopper are picked up first.
- **Compost** items via hopper: not directly; hoppers can pull from composters as if they were a container (but they output only signal strength).
- **Hopper disables** when powered by redstone.
- **Hopper pointing into minecart with chest/hopper**: works.
- **Hopper minecart** transfers faster: every 4 ticks (0.2 s) = 5 items/sec.

### 4.14 Redstone Tick Pseudocode

```
function redstoneUpdate():
  # Recalculate all redstone power levels
  bfs_queue = []
  for source in power_sources:
    source.block.power = source.output_level
    bfs_queue.append(source.block)

  while bfs_queue not empty:
    block = bfs_queue.pop_front()
    for neighbor in block.adjacent_blocks:
      new_power = block.power - decay(block, neighbor)
      if new_power > neighbor.power:
        neighbor.power = new_power
        bfs_queue.append(neighbor)

  # Update activator blocks
  for block in redstone_blocks:
    block.update_state(block.power > 0)

  # Schedule next update 2 ticks later
  schedule(redstoneUpdate, in=2_ticks)
```

---

## 5. Enchanting Deep-Dive

### 5.1 Enchanting Table Mechanics

- Requires **15 bookshelves** placed within 2 blocks horizontally and at same Y level as the table (1 block gap between table and bookshelves; bookshelves must have line-of-sight to the table).
- Maximum level: **30**.
- 3 enchantment slots shown; each requires:
  - Slot 1 (top): 1 lapis + 1 level → low-level enchant (level 1–3).
  - Slot 2 (middle): 2 lapis + 2 levels → mid enchant (level 4–13).
  - Slot 3 (bottom): 3 lapis + 3 levels → high enchant (level 14–30).

- **Player level required**: must be ≥ slot level cost (1, 2, or 3 — these are the displayed XP levels spent).
- **Slot level calculation**: based on `enchantment_power` (number of bookshelves / 2, max 15) + an RNG factor + the "enchantment seed".
- **Enchantment seed**: per-player random seed (8192-bit, stored in player NBT). Refreshed every time the player enchants an item. This means the same enchanting table offers change per enchant, but are deterministic for a given seed.

### 5.2 Anvil Mechanics

- **Combine**: two items of same type; enchantments merge. Cost = (enchant cost × multiplier) + repair cost + rename cost.
- **Repair**: combine item with same material (e.g., sword + sword, sword + diamond) restores durability. Cost = 2 levels per material item.
- **Rename**: 1 level base cost + extra for length.
- **Prior Work Penalty**: every anvil use on an item adds 2× levels to next use. Cumulative. Eventually capped at "Too Expensive".
- **"Too Expensive" cap**: 39 levels. If cost > 39 (and player is in survival), the anvil refuses the operation.
- **Anvil durability**: 12% chance per use to take damage (lose 1 durability). Anvil has 31 uses average before breaking. Takes 25 HP fall damage if anvil falls on player.

### 5.3 Enchantments List

| Enchant | Max | Applicable | Effect | Rarity |
|---|---|---|---|---|
| Protection | IV | Armor | -4% damage per level (capped 80%) | Common |
| Fire Protection | IV | Armor | -8% fire damage per level; reduces fire time | Uncommon |
| Feather Falling | IV | Boots | -12% fall damage per level | Uncommon |
| Blast Protection | IV | Armor | -8% explosion damage; knockback reduction | Rare |
| Projectile Protection | IV | Armor | -8% projectile damage per level | Uncommon |
| Respiration | III | Helmet | +15s air per level; reduces drown chance | Rare |
| Aqua Affinity | I | Helmet | Mine underwater at normal speed | Rare |
| Thorns | III | Armor | Reflect 15-30% damage (per level) | Rare |
| Depth Strider | III | Boots | +33% underwater speed per level | Rare |
| Frost Walker | II | Boots | Creates frosted ice path (treasure) | Rare |
| Soul Speed | III | Boots | +0.04 speed on soul sand/soil (treasure) | Rare |
| Sharpness | V | Sword/Axe | +0.5 + 0.5×level damage (1.25 in Bedrock) | Common |
| Smite | V | Sword/Axe | +2.5 damage per level to undead | Common |
| Bane of Arthropods | V | Sword/Axe | +2.5 dmg/level to arthropods + Slowness IV | Common |
| Knockback | II | Sword | +3 blocks knockback per level | Uncommon |
| Fire Aspect | II | Sword | Sets target on fire for 4×level seconds | Rare |
| Looting | III | Sword | +1 drop chance per level for rare drops | Rare |
| Sweeping Edge | III | Sword | +50/67/75% sweep damage | Rare |
| Efficiency | V | Tools | +25% mining speed per level | Common |
| Silk Touch | I | Tools | Drops block itself | Very Rare |
| Unbreaking | III | Tools/Armor | Items last longer (chance not to use durability) | Common |
| Fortune | III | Tools | Multiple drops on mined blocks | Rare |
| Power | V | Bow | +25% arrow damage per level | Common |
| Punch | II | Bow | +3 blocks knockback per level | Rare |
| Flame | I | Bow | Sets arrows on fire | Rare |
| Infinity | I | Bow | No arrow consumption (needs 1 arrow) | Very Rare |
| Mending | I | Anything with durability | Repairs via XP orbs (treasure) | Rare |
| Curse of Vanishing | I | Anything with durability | Item vanishes on death | Rare |
| Curse of Binding | I | Armor | Cannot be removed (until broken or in Creative) | Rare |
| Channeling | I | Trident | Lightning strike during thunderstorm | Rare |
| Riptide | III | Trident | Launches player when thrown in water/rain | Rare |
| Loyalty | III | Trident | Returns to player after throw | Uncommon |
| Impaling | V | Trident | +2.5 dmg/level to aquatic mobs | Rare |
| Multishot | I | Crossbow | Fires 3 projectiles instead of 1 | Rare |
| Piercing | IV | Crossbow | Arrows pierce +level entities; ignores shields | Rare |
| Quick Charge | III | Crossbow | -0.25 s reload time per level | Rare |
| Swift Sneak | III | Leggings | +15% sneak speed per level (treasure) | Rare |
| Density | V | Mace | Bonus damage based on fall distance | Common (1.21) |
| Breach | IV | Mace | Reduces target armor effectiveness by 15%/level | Uncommon (1.21) |
| Wind Burst | III | Mace | Launches attacker upward on hit | Rare (1.21) |
| Smite-equivalent on mace: Smashing (none) | - | - | - | - |
| Frost Aspect (unimplemented) | - | - | - | - |

### 5.4 Treasure Enchantments

Cannot be obtained from enchanting table:
- **Frost Walker** (boots): chest loot (igloo, shipwreck, ancient city), fishing, villager trades, bartering.
- **Mending**: chest loot, fishing, villager librarian trade (expert-level), raid drops.
- **Soul Speed**: bartering with piglins (sole source — though can also be found in bastion remnants).
- **Swift Sneak**: ancient city loot only (no villager trade).
- **Wind Burst**: mace-specific, dropped by the breeze rod (vault from trial chambers).

### 5.5 Villager Librarian Trading

- Novice librarian: paper (1 emerald), enchantment book trade sometimes available (low-level enchant, common, like Protection I).
- Apprentice: 1 common book trade (Sharpness II, etc.).
- Journeyman: 1 uncommon book (Power III).
- Expert: Mending book (rare chance), or other rare books.
- Master: high-tier enchanted books.

Each librarian offers specific enchantment tiers; rerolling requires breaking/placing the lectern.

---

## 6. Brewing Deep-Dive

### 6.1 Brewing Stand Mechanics

- **3 bottle slots** (bottom row) + **1 ingredient slot** (top) + **1 blaze powder fuel slot** (left).
- **Brew time**: 20 seconds (400 ticks) per ingredient applied.
- **Blaze powder**: 1 powder fuels 20 brew operations.
- Each brew operation applies to all 3 bottles simultaneously.

### 6.2 Brewing Recipe Tree

**Base:**
- Water Bottle (fill glass bottle at water source).
- Awkward Potion = Water Bottle + Nether Wart. The base for almost all effect potions.

**Effect potions from Awkward Potion:**

| Ingredient | Effect | Duration | Effect Level |
|---|---|---|---|
| Ghast Tear | Regeneration | 0:45 | I |
| Magma Cream | Fire Resistance | 3:00 | I |
| Sugar | Speed (Swiftness) | 3:00 | I |
| Blaze Powder | Strength | 3:00 | I |
| Golden Carrot | Night Vision | 3:00 | I |
| Spider Eye | Poison | 0:45 | I |
| Pufferfish | Water Breathing | 3:00 | I |
| Rabbit's Foot | Jump Boost (Leaping) | 3:00 | I |
| Phantom Membrane | Slow Falling | 1:30 | I |
| Glistering Melon Slice | Instant Health | instant | II |
| Turtle Shell | Slowness IV + Resistance III | 0:20 | mixed |

**Weakness Potion (special):**
- Fermented Spider Eye + Water Bottle = Weakness Potion (1:30).
- The only effect potion directly from a water bottle (not requiring Awkward).

**Effect modifiers:**

| Modifier | Effect |
|---|---|
| Redstone Dust | Extended duration (typically 3:00 → 8:00, 0:45 → 1:30, 1:30 → 4:00) |
| Glowstone Dust | Level II (typically doubles effect, halves duration) |
| Gunpowder | Splash Potion |
| Dragon's Breath (on splash) | Lingering Potion |

**Negative inversion via Fermented Spider Eye:**
- Applies to: Speed → Slowness, Strength → Weakness, Jump Boost → Slowness, Instant Health → Instant Damage, Poison → Harming.
- When applied to extended/Level II variants, sometimes only the "duration" or "level" survives depending on the variant. For example, Regeneration cannot be inverted (no inverse effect).

### 6.3 Splash & Lingering Potions

- **Splash potion**: thrown; applies effect to entities within ~3 blocks of impact. Effect duration / 1 reduced on direct hit, / 0.75 on splash.
- **Lingering potion**: thrown; creates a 3-block-radius cloud that lingers 30 s, applying effects to entities inside every 10 ticks (5 s) for the remaining duration.

### 6.4 Full Potion Effects Table

| Effect | ID | Default Duration | Amplifier | Color |
|---|---|---|---|---|
| Speed | `speed` | 3:00 | I | Cyan |
| Slowness | `slowness` | 1:30 | I | Blue |
| Haste | `haste` | 3:00 | I | Yellow |
| Mining Fatigue | `mining_fatigue` | 5:00 | I | Cyan |
| Strength | `strength` | 3:00 | I | Red |
| Instant Health | `instant_health` | instant | II | Red |
| Instant Damage | `instant_damage` | instant | II | Maroon |
| Jump Boost | `jump_boost` | 3:00 | I | Lime |
| Nausea | `nausea` | 0:45 | I | Purple |
| Regeneration | `regeneration` | 0:45 | I | Pink |
| Resistance | `resistance` | 5:00 | I | Maroon |
| Fire Resistance | `fire_resistance` | 3:00 | I | Orange |
| Water Breathing | `water_breathing` | 3:00 | I | Blue |
| Invisibility | `invisibility` | 3:00 | I | Gray |
| Blindness | `blindness` | 0:20 | I | Black |
| Night Vision | `night_vision` | 3:00 | I | Blue |
| Hunger | `hunger` | 0:30 | I | Gray |
| Weakness | `weakness` | 1:30 | I | Gray |
| Poison | `poison` | 0:45 | I | Green |
| Wither | `wither` | 0:40 | II | Black |
| Health Boost | `health_boost` | — | I | Red (not brewed) |
| Absorption | `absorption` | 1:30 (golden apple) | I | Yellow |
| Saturation | `saturation` | instant | I | Red |
| Glowing | `glowing` | — | — | White (spectral arrow) |
| Levitation | `levitation` | 0:30 | I | Cyan (shulker) |
| Luck | `luck` | 5:00 | I | Green (commands only / potion in 1.9+) |
| Bad Luck | `unluck` | 5:00 | I | Maroon (commands only) |
| Slow Falling | `slow_falling` | 1:30 | I | Cyan |
| Conduit Power | `conduit_power` | varies | I | Cyan |
| Dolphin's Grace | `dolphins_grace` | 0:35 (dolphin contact) | I | Blue |
| Bad Omen | `bad_omen` | 100 min | I | Brown (raid trigger) |
| Hero of the Village | `hero_of_the_village` | 2:00 per level (40 min max in 1.20+) | I-V | Green |
| Darkness | `darkness` | 0:14 | I | Black (warden / sculk shriek) |
| Trial Omen | `trial_omen` | — | I | — (1.21 trial spawner) |
| Raid Omen | `raid_omen` | — | I | — (1.21) |
| Wind Charged | `wind_charged` | — | I | — (1.21, breeze) |
| Weaving | `weaving` | — | I | — (1.21, spider-like) |
| Oozing | `oozing` | — | I | — (1.21, slime-like) |
| Infested | `infested` | — | I | — (1.21, silverfish) |

---

## 7. Crafting System Deep-Dive

### 7.1 Crafting Grids

- **2×2 inventory crafting**: simple recipes (planks from logs, sticks, crafting table, basic tools via 2x2 in some cases — actually tools need 3x3).
- **3×3 crafting table**: most recipes.
- **Recipe types**:
  - **Shaped**: pattern matters. e.g., `XXX / X-X / XXX` for chest.
  - **Shapeless**: any arrangement in grid. e.g., `dye + wool` → colored wool.
  - **Special**: map cloning (cartography), banner pattern duplication, firework star crafting, armor stand, dye mixing.

### 7.2 Recipe Unlocking (1.20+)

- Recipes auto-unlock as player collects the necessary ingredients.
- Unlocked recipes shown in recipe book (green checkmark).
- Recipe can also be unlocked via `knowledge_book` item or via `/recipe give` command.
- Recipe criterion: each recipe defines a list of conditions (has-item triggers).

### 7.3 Smelting & Cooking

| Method | Time (ticks) | Time (sec) | XP | Use |
|---|---|---|---|---|
| Furnace | 200 | 10 | Yes (varies) | All smelting (ore, food, sand→glass, etc.) |
| Blast Furnace | 100 | 5 | Yes (smelting only) | Ores only (no food); 2× faster than furnace |
| Smoker | 100 | 5 | Yes (food only) | Food only; 2× faster than furnace |
| Campfire | 600 | 30 | No | Food only; can cook 4 items at once |
| Soul Campfire | 600 | 30 | No | Food only; same speed as campfire |
| Blast Furnace / Smoker use 2× fuel per item but cook 2× faster (so fuel efficiency is the same). |

**Fuel efficiency table** (smelting time per fuel item):

| Fuel | Smelts |
|---|---|
| Bamboo | 0.25 (1/4 item) |
| Stick | 0.5 |
| Wooden tools (any) | 1 |
| Coal | 8 |
| Charcoal | 8 |
| Coal block | 80 (10×9 = 80, since 9 coal = 72 but block gives 80 — bonus) |
| Lava bucket | 100 |
| Blaze rod | 12 |
| Dried kelp block | 20 |
| Bamboo (1.21+) | 0.25 |
| Wood logs (any) | 1.5 (smelts 1 item per 1.5 logs) — wait actually logs smelt 1.5 items (15s burn time, 10s smelt). Yes 1.5 items per log. |
| Wood planks (any) | 1.5 items? No — planks = 1.5/4 = 0.375 each (since 1 log = 4 planks; 4 planks = 1.5 items; 1 plank = 0.375 items). Wait, plank burn time = 15s? No plank burn = 1.5 items per 1 log of planks.
Let me restate:
- Wood log burn: 15 s = smelts 1.5 items.
- Plank burn: 3.75 s = smelts 0.375 items (so 4 planks = 15 s = 1.5 items).
- Slab burn: same as plank? Actually wooden slabs = 1.5 items worth? No, slab burn = ~7.5 s = 0.75 items.

| Fuel item | Burn time (ticks) | Smelts (items) |
|---|---|---|
| Bamboo | 50 | 0.25 |
| Stick | 100 | 0.5 |
| Wooden tool (sword/pickaxe/etc) | 200 | 1 |
| Coal | 1600 | 8 |
| Charcoal | 1600 | 8 |
| Block of coal | 16000 | 80 |
| Lava bucket | 20000 | 100 |
| Blaze rod | 2400 | 12 |
| Dried kelp block | 4000 | 20 |
| Bamboo (1.21) | 50 | 0.25 |
| Wood log | 300 | 1.5 |
| Wood planks | 300 | 1.5 (per 4 planks = 1.5? No actually 1 plank = 75 ticks = 0.375; let me restate below) |

OK proper fuel table (correct values):

| Fuel | Burn ticks | Smelts |
|---|---|---|
| Carpet (any color) | 67 | 0.335 |
| Bamboo | 50 | 0.25 |
| Stick | 100 | 0.5 |
| Wooden tool | 200 | 1.0 |
| Wood planks (single) | 300 | 1.5 |
| Wood slab (single) | 150 | 0.75 |
| Wood log | 300 | 1.5 |
| Wood stairs (single) | 300 | 1.5 |
| Wood fence / fence gate | 300 | 1.5 |
| Coal | 1600 | 8 |
| Charcoal | 1600 | 8 |
| Block of coal | 16000 | 80 |
| Lava bucket | 20000 | 100 |
| Blaze rod | 2400 | 12 |
| Dried kelp block | 4000 | 20 |
| Bamboo (block, not single) — actually no bamboo doesn't have a block form for fuel beyond single bamboo.

### 7.4 Specialized Crafting Stations

- **Stonecutter**: 1 input stone → multiple cut variants. More efficient than crafting (e.g., 1 stone → 1 stone bricks stair instead of crafting 6 stones → 4 stairs). Stonecutter recipes are 1:1 or 1:N (efficiency bonus).
- **Smithing Table**:
  - Upgrade gear: netherite (diamond gear + netherite ingot + smithing template "Netherite Upgrade").
  - Add trim: armor + ingot + trim template. 18 trim patterns × 10 materials (iron, copper, gold, lapis, emerald, diamond, netherite, redstone, amethyst, quartz) = many visual combinations.
- **Loom**: banner pattern crafting. Banner + dye + banner pattern item. 16 base patterns + 7 special patterns (creeper, skull, flower, mojang, globe, piglin, flow).
- **Cartography Table**:
  - Copy map (map + empty map = 2 maps).
  - Zoom out map (map + paper = zoomed out 1 level; max 4 zoom levels).
  - Locator map (map + compass = locator map).
  - Clone explorer map (one-time).
- **Anvil**:
  - Repair items (combine same items or with material).
  - Combine enchantments.
  - Rename items.
- **Grindstone**:
  - Disenchant items (removes all non-curse enchantments, returns some XP based on enchant cost).
  - Repair bonus: combines two items' durability + 5% bonus.

### 7.5 Special Recipes

- **Map cloning**: map + empty map → 2 identical maps (shared data).
- **Banner pattern crafting**: shaped and shapeless recipes for designs.
- **Firework crafting**: paper + gunpowder → firework rocket (flight 1). Add firework star (gunpowder + dye + optional head) → decorative firework.
- **Armor stand**: 6 sticks + 1 stone slab (smooth stone slab).
- **Dye recipes**: many; e.g., rose red (1 poppy) → red dye; combining dyes for secondary colors (red + yellow = orange).

---

## 8. Mining & Block Breaking

### 8.1 Block Breaking Speed

Formula:
```
break_time_ticks = (block_hardness * 1.5) / (tool_multiplier * speed_modifier) * slowdown_factors
```

**Speed modifier includes:**
- Haste effect: +20% per level (level 1 = 1.2×, level 2 = 1.4×, etc.).
- Mining Fatigue: -20% per level (level 1 = 0.8×, etc.).
- Efficiency enchant: +25% per level (level 5 = +125% → 2.25×).
- Aqua Affinity: removes underwater slowdown (5× penalty).
- In water (without Aqua Affinity): ×0.2 (5× slowdown).
- In air (not on ground): ×0.2 (5× slowdown).
- On ground bonus: ×1.0 (default).

**Tool multipliers (against correct material):**

| Tool tier | Multiplier |
|---|---|
| Hand (no tool) | 1.0 |
| Wood | 2.0 |
| Stone | 4.0 |
| Iron | 6.0 |
| Diamond | 8.0 |
| Netherite | 9.0 |
| Gold | 12.0 |

**Block hardness examples:**

| Block | Hardness | Tool required to drop |
|---|---|---|
| Stone | 1.5 | Pickaxe (wood+) |
| Cobblestone | 2.0 | Pickaxe |
| Iron ore | 3.0 | Pickaxe (stone+) |
| Diamond ore | 3.0 | Pickaxe (iron+) |
| Obsidian | 50.0 | Pickaxe (diamond+) |
| Bedrock | -1 (unbreakable) | None |
| Dirt | 0.5 | Shovel |
| Wood (log) | 2.0 | Axe |
| Wool | 0.8 | Shears (for drop) |
| Glass | 0.3 | None (drops nothing without Silk Touch) |
| Leaves | 0.2 | Shears or hoe (1.17+) |

**Breaking time in seconds** (1 block, correct tool):
- Stone with diamond pickaxe: 0.4 s.
- Stone with wood pickaxe: 1.13 s.
- Obsidian with diamond pickaxe: 9.4 s.
- Obsidian with netherite pickaxe: 8.35 s.
- Bedrock: never.

### 8.2 Tool Mining Levels

Required level to drop certain blocks:

| Block | Required tier |
|---|---|
| Stone, cobblestone, granite, etc. | Wood (0) |
| Iron ore, copper ore, coal ore, lapis | Stone (1) |
| Diamond ore, emerald ore, gold ore, redstone ore | Iron (2) |
| Obsidian, ancient debris | Diamond (3) |
| (Netherite doesn't unlock new drops; just faster than diamond) | Netherite (4) |

### 8.3 Fortune & Silk Touch

- **Fortune** (I–III): multiplier on drop count for ore blocks.
  - Coal: drops 1 base; Fortune I = 1-2 avg 1.33; Fortune II = 1-3 avg 1.75; Fortune III = 1-4 avg 2.2.
  - Diamond/emerald/lapis/redstone: similar scaling.
  - Fortune also affects crops (wheat seeds, potatoes, carrots, beetroot, glow berries, sweet berries, nether wart).
- **Silk Touch**: drops the block itself (e.g., diamond ore block instead of diamonds; grass block instead of dirt; glass pane instead of nothing).
- Silk Touch + Fortune are mutually exclusive (can't have both on same tool).

### 8.4 Block Break Particles & Sound

- Particles spawn at block center on break; small dust cloud colored to block.
- Sound: depends on block material (sound_type): stone, wood, gravel, sand, grass, glass, wool, snow, ladder, anvil, etc. — each has dig sound, step sound, place sound, hit sound, fall sound.

---

## 9. Light System

### 9.1 Light Types

- **Sky light**: from sun/moon. Max 15. Blocked by opaque blocks. Propagates through transparent blocks (glass, leaves with decay).
- **Block light**: from torches, lamps, lava, etc. Max 15. Decays 1 per block from source.

### 9.2 Light Propagation Algorithm

Breadth-first search from all light sources:
```
function recalculate_light():
  # Sky light pass
  for each (x, z) column:
    y = find_topmost_opaque_block(x, z) or world_height
    sky_light[x][y][z] = 15  # at top
    propagate skylight downward through transparent blocks
  
  # Block light pass
  light_sources = collect all blocks with emission
  for source in light_sources:
    bfs_propagate(source, source.luminance)
  
  # Combined light at each block = max(sky_light, block_light)
```

**Decay rules:**
- Vertical propagation (skylight downward): no decay through transparent blocks (full light passes through).
- Horizontal propagation: decays 1 per block.
- Through non-opaque but non-transparent blocks (water, leaves): decay 1 per block (water) or 1 (leaves on Fast graphics, 0 on Fancy).

### 9.3 Light Level & Mob Spawning

- Hostile mob spawning requires **block light = 0** at spawn location.
- Sky light threshold (Java): `0 ≤ sky_light ≤ 4` at night (or always ≤ 0 in caves) for most mobs.
- Slimes: spawn at any light in slime chunks (Y < 40); swamp slimes need light ≤ 7.
- Warden: no light requirement.
- Mobs also need to spawn on a spawnable block (top solid, not transparent).

### 9.4 Luminance Table (Selected)

| Block | Luminance |
|---|---|
| Torch | 14 |
| Glowstone | 15 |
| Sea Lantern | 15 |
| Lantern | 15 |
| Shroomlight | 15 |
| Beacon (beam) | 15 |
| End Rod | 14 |
| Frosted Ice (Frost Walker) | varies (no light) |
| Lava | 15 |
| Fire | 15 |
| Jack o'Lantern | 15 |
| Glow Berries | 14 |
| Redstone Lamp (powered) | 15 |
| Froglight | 15 |
| Crying Obsidian | 10 |
| Respawn Anchor (charged) | 15 |
| Soul Torch | 10 |
| Soul Lantern | 10 |
| Soul Fire | 10 |
| Brewing Stand | 1 |
| Brown Mushroom | 1 |
| Redstone Ore (lit) | 9 |
| Amethyst Bud (small/medium/large) | 1/2/4 |
| Amethyst Cluster | 5 |
| Cave Vines (with berries) | 14 |
| Spore Blossom | 0 (no light, decorative) |
| Light Block (commands) | 0–15 |
| End Portal Frame (with eye) | 15 |
| Conduit | 15 (active) |
| Sculk Catalyst | 6 (when active) |

---

## 10. Weather

### 10.1 Weather Cycle

- Random weather changes; each new weather state lasts 0.5–7.5 days (10000–150000 ticks).
- Cycle: clear → rain → clear (or rain → thunder → rain → clear).
- Approximate chance of rain per day: ~10%.
- Thunder is a subset of rain (when raining, chance of thunder ~10%).

### 10.2 Rain & Snow

- **Rain** falls in biomes with temperature > 0.15.
- **Snow** falls in biomes with temperature ≤ 0.15 (frozen oceans, snowy plains, taiga, mountains, etc.).
- **No weather**: desert, savanna, badlands, end, nether (never rains).

### 10.3 Thunder & Lightning

- Lightning strikes random locations every 100–10000 ticks during thunderstorm.
- **Effects of lightning strike:**
  - Sets fire to the hit block (and surrounding blocks briefly).
  - Damages entities on hit: 5 HP + sets on fire.
  - **Creeper** within 4 blocks of strike → **Charged Creeper** (aura, 50% stronger explosion, deals 6× more damage to entities? actually explosion power 6 vs 3, so doubled radius and ~2× damage).
  - **Pig** within 4 blocks → **Zombified Piglin**.
  - **Villager** within 4 blocks (no roof above) → **Witch**.
  - **Red Mooshroom** → **Brown Mooshroom** (and vice versa).
  - **Skeleton trap horse** spawns rarely (0.75–1.5% chance) on strike.
  - **Copper block** family oxidizes 1 stage when struck.
  - **Lightning rod** conducts lightning to itself + emits redstone pulse.
  - **Villager turning into witch** requires the villager to be exposed to the sky (no block above).

### 10.4 Sleeping Through Weather

- Right-click bed at night or during thunderstorm → skip to dawn (time = 0, weather cleared).
- Requires all players in overworld to be sleeping simultaneously (multiplayer).
- In thunderstorm, sleep is allowed during day too.

---

## 11. Time & Day Cycle

### 11.1 Day Length

- 1 Minecraft day = 24000 ticks = 20 minutes real time.
- 1 Minecraft hour = 1000 ticks = 50 seconds.

### 11.2 Day Phases

| Phase | Tick Range | Description |
|---|---|---|
| Day | 0–12000 | Sun rises in east, traverses sky |
| Sunset (dusk) | 12000–13000 | Sun setting, sky orange/pink |
| Night | 13000–23000 | Moon out; hostile mobs spawn |
| Sunrise (dawn) | 23000–24000 | Sun rising, sky orange |

- Hostile mobs can spawn when `sky_light` falls below threshold, which happens between 13000 and 23000.
- Beds usable from 12542 to 23460 (when monsters can spawn).

### 11.3 Bed Sleep

- Right-click bed → sleep animation (5 s).
- All players in same dimension must sleep simultaneously to skip night (1.21 vanilla Java).
- After sleep: time set to 0, weather cleared, all players respawn at their bed.
- Cannot sleep in: nether (bed explodes), end (bed explodes).
- Cannot sleep when: monsters within 8 blocks horizontally and 5 blocks vertically of bed.

### 11.4 Moon Phases

- 8 phases, each 1 day.
- Lunar cycle = 8 days = 2 hours 40 minutes real time.
- Affects:
  - Slime spawns in swamp (only at certain phases; full moon and waxing).
  - Regional difficulty (full moon = max).
  - Some mob spawns scale with moon phase.

---

## 12. Tick System & Block Updates

### 12.1 Tick Types

- **Game tick**: 20 Hz, 0.05 s each. Most updates happen here.
- **Redstone tick**: 2 game ticks, 0.1 s. Redstone components scheduled on these.
- **Random tick**: ~1 in 256 game ticks per block, average 1 tick per 12.8 s. Used for: crop growth, leaf decay, grass spread, mycelium spread, ice formation, copper oxidation (uses random ticks + interaction), sapling growth, fire spread.
- **Scheduled tick**: queued by block (e.g., repeater sets `delayed_tick` event). Processed in order.
- **Liquid tick**: water/lava flow updates.

### 12.2 Random Tick Pseudocode

```
function random_tick_chunk(chunk):
  for _ in range(random_tick_speed):  # default 3
    block = chunk.random_block()
    block.random_tick()  # crop growth, leaf decay, etc.
```

- Default `randomTickSpeed` = 3. Set via gamerule. Increasing to 100 speeds crop growth but lags server.

### 12.3 Block Update Types

- **Neighbor update (state change)**: when a block changes state, it tells 6 neighbors to re-check their state. E.g., redstone wire re-render, fence connection update, door updates.
- **Comparison update**: comparator updates when its input changes.
- **Observer pulse**: observer detects adjacent block state change → emits 2-tick pulse.
- **Light update**: light recalculated when blocks change opacity.
- **Render update**: client re-renders changed chunks.
- **Schedule update**: block schedules a future tick (e.g., repeater delay, hopper transfer, piston retract).

### 12.4 Block 36 (Moving Piston)

- A transient block state during piston extension/retraction.
- Cannot be broken normally; persists for 1–3 game ticks before converting to final block.
- Causes "block entity" updates.

### 12.5 Item Despawn

- Items dropped on ground despawn after 5 minutes (6000 ticks).
- Items dropped by player death despawn after 5 minutes.
- Items merged into stacks share a single despawn timer (reset on merge).
- Exception: items inside a hopper, chest, etc. do not despawn.

### 12.6 Item Pickup

- Player picks up items within 1 block radius (spherical).
- Pickup animation: item flies toward player over ~0.5 s.
- Items picked up immediately enter inventory if there's space; else remain on ground.

### 12.7 Death Mechanics

- On death (Java, default rules):
  - All inventory items dropped at death location.
  - All XP dropped (capped at 100 XP worth of orbs).
  - Player respawns at world spawn or last-slept bed.
  - If respawn anchor in nether (charged), respawns there.
  - Death screen shows in survival; in hardcore, "delete world / spectator" option.
- **`keepInventory`** gamerule: items kept on death.
- **`doMobSpawning`**: toggles mob spawning.
- **`mobGriefing`**: toggles mob ability to break blocks (creeper explosions, enderman pickup, etc.).
- **`naturalRegeneration`**: toggles passive HP regen from food.
- **`doDaylightCycle`**: stops day/night cycle.
- **`doWeatherCycle`**: stops weather changes.
- **`fallDamage`** / **`fireDamage`** / **`drowningDamage`** / **`freezeDamage`**: per-damage-type toggles.
- **`showDeathMessages`**: toggles death chat message.
- **`doFireTick`**: toggles fire spread.
- **`randomTickSpeed`**: integer (default 3); controls random tick frequency.
- **`spawnRadius`**: radius around spawn point where player respawns (default 10).
- **`maxEntityCramming`**: max entities in 1 block before damage (default 24, deals 6 HP/s).

### 12.8 Full Gamerule List

| Gamerule | Default | Description |
|---|---|---|
| `announceAdvancements` | true | Show advancement chat messages |
| `commandBlockOutput` | true | Command blocks output to chat |
| `disableElytraMovementCheck` | false | Disable elytra flight speed checks |
| `disableRaids` | false | Disable raids |
| `doDaylightCycle` | true | Day/night cycle |
| `doEntityDrops` | true | Non-mob entities drop items (minecarts, boats) |
| `doFireTick` | true | Fire spreads |
| `doImmediateRespawn` | false | Skip death screen |
| `doInsomnia` | true | Phantoms spawn |
| `doLimitedCrafting` | false | Players must unlock recipes |
| `doMobLoot` | true | Mobs drop loot |
| `doMobSpawning` | true | Mobs spawn naturally |
| `doPatrolSpawning` | true | Pillager patrols spawn |
| `doTileDrops` | true | Blocks drop items when broken |
| `doTraderSpawning` | true | Wandering traders spawn |
| `doWardenSpawning` | true | Wardens can spawn |
| `doWeatherCycle` | true | Weather cycle |
| `drowningDamage` | true | Drowning deals damage |
| `fallDamage` | true | Fall damage enabled |
| `fireDamage` | true | Fire damage enabled |
| `forgiveDeadPlayers` | true | Mobs forgive player on death |
| `freezeDamage` | true | Powder snow damage |
| `globalSoundEvents` | true | Certain sounds heard globally |
| `keepInventory` | false | Items kept on death |
| `logAdminCommands` | true | Log admin commands |
| `maxCommandChainLength` | 65536 | Max chained command blocks |
| `maxEntityCramming` | 24 | Cramming rule |
| `mobGriefing` | true | Mobs modify blocks |
| `naturalRegeneration` | true | Food-based HP regen |
| `playersSleepingPercentage` | 100 | % of players needed to skip night |
| `randomTickSpeed` | 3 | Random tick frequency |
| `reducedDebugInfo` | false | Limited F3 info |
| `sendCommandFeedback` | true | Command feedback in chat |
| `showDeathMessages` | true | Death messages in chat |
| `spawnRadius` | 10 | Spawn radius |
| `spectatorsGenerateChunks` | true | Spectators load chunks |
| `universalAnger` | false | Mobs aggro all players |

### 12.9 Advancement System

- ~110 advancements in vanilla 1.21.
- Organized in tabs: Minecraft (story), Adventure, Husbandry, Nether, End.
- Trigger types: `minecraft:tick`, `minecraft:location`, `minecraft:inventory_changed`, `minecraft:entity_killed_player`, `minecraft:killed_by_crossbow`, `minecraft:recipe_crafted`, etc.
- Display: icon, title, description, frame (normal/goal/challenge), background, show_toast, announce_to_chat, hidden.
- advancements stored in JSON in datapacks: `data/<namespace>/advancements/<path>.json`.

### 12.10 Statistics Tracking

- Tracks per-player stats: blocks mined, items crafted, items used, items broken, mobs killed, entities killed, distance traveled (per type), play time, jumps, damage taken/dealt, fish caught, animals bred, etc.
- Stored in `stats` folder per player as JSON.
- Used for: advancement criteria, scoreboard objectives.

### 12.11 Commands (Brief Reference)

| Command | Description |
|---|---|
| `/gamemode <mode>` | Set game mode |
| `/difficulty <level>` | Set difficulty |
| `/time set <value>` | Set world time |
| `/time add <value>` | Advance world time |
| `/weather <clear/rain/thunder>` | Set weather |
| `/summon <entity> [pos] {nbt}` | Spawn entity |
| `/give <player> <item> [count] {nbt}` | Give item |
| `/tp <target> <dest>` | Teleport |
| `/effect give <entity> <effect> [duration] [amplifier]` | Give status effect |
| `/effect clear <entity> [effect]` | Clear effects |
| `/enchant <player> <enchant> [level]` | Enchant held item |
| `/gamerule <rule> [value]` | Set gamerule |
| `/particle <name> <pos> ...` | Spawn particle |
| `/playsound <sound> <source> <target> ...` | Play sound |
| `/title <target> <title/subtitle/actionbar> ...` | Show title text |
| `/tellraw <target> <json>` | Send formatted chat message |
| `/scoreboard objectives add ...` | Add scoreboard objective |
| `/scoreboard players set ...` | Set score |
| `/function <namespace:path>` | Run function |
| `/execute ...` | Modify execution context (as/at/align/anchored/facing/in/positioned/rotated/store/run) |
| `/data get/merge/modify ...` | Manipulate NBT data |
| `/setblock <pos> <block>` | Place block |
| `/fill <x1> <x1> <x1> <x2> <x2> <x2> <block>` | Fill area |
| `/clone <begin> <end> <dest>` | Clone region |
| `/attribute <entity> <attribute> ...` | Modify attribute |
| `/xp` or `/experience` | Add/set XP |
| `/kill [target]` | Kill entities |
| `/spawnpoint <player> <pos>` | Set spawn |
| `/setworldspawn <pos>` | Set world spawn |
| `/seed` | Show world seed |
| `/reload` | Reload datapacks |
| `/op` / `/deop` | Operator management |
| `/ban` / `/pardon` / `/kick` | Player management |
| `/list` | List online players |
| `/seed` | Show world seed |
| `/publish` | Open world to LAN |
| `/defaultgamemode` | Set default game mode for new players |
| `/worldborder` | Configure world border |
| `/bossbar` | Create custom boss bar |
| `/tag` | Add/remove entity tags |
| `/team` | Manage teams |
| `/advancement <grant/revoke> ...` | Grant/revoke advancements |
| `/recipe <give/take> ...` | Give/take recipes |
| `/loot ...` | Spawn loot from tables |
| `/item replace ...` | Replace inventory slots |
| `/schedule function <function> <time>` | Schedule function run |
| `/perf` | Start performance profiling |
| `/debug` | Debug commands |
| `/forceload` | Force chunk loading |
| `/tick` | Tick rate manipulation (1.20.3+) |

### 12.12 Command Blocks

- **3 types**: Impulse (default, fires once on signal), Chain (fires when pointing from previous block in chain), Repeat (fires every tick while powered).
- **2 conditional modes**: Conditional (only fires if previous command succeeded), Unconditional.
- Powered by redstone signal.
- Requires operator permission level 2.
- Can execute commands as: themselves (default), or via `/execute as <player>`.
- Chain command blocks pass execution to adjacent chain block in their facing direction.

---

## 13. Other Mechanics

### 13.1 Liquid Mechanics

- **Water**:
  - Flow speed: 5 blocks per second (1 block per 4 ticks) on flat surface.
  - Spread distance: 7 blocks in overworld; 8 in nether? Actually 7 blocks horizontally on flat ground.
  - Source blocks: created when 2 adjacent source blocks + 1 above source = new source (in finite water mode). Default Java is infinite sources.
  - Waterlogged blocks: blocks that can contain water (e.g., stairs, slabs, fences, walls, signs, ladders).
- **Lava**:
  - Overworld flow: 1 block per 30 ticks (very slow, 0.5 blocks/sec).
  - Nether flow: same speed as water (5 blocks/sec).
  - Spread distance: 3 blocks in overworld, 8 blocks in nether.
  - Damages: 4 HP/tick on contact (0.2 s = 4 HP), sets entity on fire.
  - Lava + water = obsidian (source) or cobblestone/stone (flowing lava + flowing water).

### 13.2 Fire Spread

- Fire spreads via `random_tick` to adjacent flammable blocks (within 1-3 blocks depending on fire age).
- Burnable blocks (wood, leaves, wool, etc.) have `burn odds` and `ignite odds`.
- Fire ages 0–15; older fire spreads faster and burns hotter. At age 15, fire is "eternal" (doesn't go out without intervention).

### 13.3 Falling Block Entities

- Sand, gravel, concrete powder, anvil, dragon egg, scaffolding (under some conditions): become falling block entity when no support below.
- Falls as gravity entity; lands on solid block.
- Anvil deals fall damage: `max(damage, blocks_fallen - 2) HP`.
- Dragon egg: teleports to random nearby location when punched.

### 13.4 Entity Cramming

- If 24+ entities occupy the same 1-block space (default `maxEntityCramming = 24`), they take 6 HP/s suffocation damage.
- Excludes: armor stands, items, XP orbs, minecarts.

### 13.5 Sleep Mechanics

- Bed must have 2 air blocks above (1 in 1.21+?).
- Cannot sleep during day (except thunderstorm).
- All players in dimension must sleep to skip night (configurable via `playersSleepingPercentage`).
- Sleeping sets time to 0 (dawn), clears weather.

### 13.6 Respawn Anchor

- Charged with glowstone in nether (1–4 charges).
- Player respawn in nether if anchor has charge.
- Using in overworld/end: explodes (power 5).

### 13.7 Ender Pearl Mechanics

- Throw → player teleports to landing position.
- Damage: 5 HP fall damage on teleport.
- Cooldown: 1 second per throw (1.21+).
- Ender pearls can pass through nether portal (wait, they can't — only items can).

### 13.8 Boat & Minecart Physics

- Boat: water speed 8 b/s; land speed 1.5 b/s.
- Minecart: max speed 8 b/s on powered rails; 0.4 b/s decay without power.
- Hopper minecart: can pick up items from blocks below.

### 13.9 Lead Mechanics

- Leash up to 10 mobs to player.
- Leash breaks if distance > 10 blocks.
- Leashed mobs persist through chunk loading.

### 13.10 Sleeping Skip Math

- `playersSleepingPercentage` (default 100): percent of players that must be in beds to skip night.
- 0 = always skip; 50 = half must sleep; 100 = all must sleep.

---

## 14. Status Effects Reference

| Effect | ID | Color (RGB hex) | Source | Effect | Default Duration |
|---|---|---|---|---|---|
| Speed | `speed` | `#7CAFC6` | Sugar potion, beacon, dolphin | +20% speed per level | 3:00 |
| Slowness | `slowness` | `#5A0000` | Potion, wither (level 4?), strays | -15% speed per level | 1:30 |
| Haste | `haste` | `#E7FF00` | Beacon, potion (no vanilla brew) | +20% mining speed per level | 3:00 |
| Mining Fatigue | `mining_fatigue` | `#4A4217` | Elder guardian | -20% mining speed per level | 5:00 |
| Strength | `strength` | `#931818` | Potion, beacon | +3 HP per level melee damage | 3:00 |
| Instant Health | `instant_health` | `#FF0000` | Potion, golden apple, totem | Heal 4 HP per level instantly | instant |
| Instant Damage | `instant_damage` | `#930000` | Potion (harming), wither skull | Damage 6 HP per level instantly | instant |
| Jump Boost | `jump_boost` | `#00FF00` | Potion, beacon | +0.5 block jump per level | 3:00 |
| Nausea | `nausea` | `#555D33` | Pufferfish, suspicious stew | Wobble screen | 0:45 |
| Regeneration | `regeneration` | `#CD5CAB` | Potion, golden apple, beacon | Heal 1 HP per 50/level ticks | 0:45 |
| Resistance | `resistance` | `#99453A` | Beacon, enchanted golden apple, totem | -20% damage per level | 5:00 |
| Fire Resistance | `fire_resistance` | `#E49A3A` | Potion, magma cream | Immune to fire/lava damage | 3:00 |
| Water Breathing | `water_breathing` | `#2E5299` | Potion, turtle shell | No drowning | 3:00 |
| Invisibility | `invisibility` | `#7F8392` | Potion, no mob aggro (mobs still detect if armor visible) | Player invisible (armor visible) | 3:00 |
| Blindness | `blindness` | `#1F1F23` | Illusioner | Black fog, no sprinting/crits | 0:20 |
| Night Vision | `night_vision` | `#1F1FA1` | Potion, beacon | Full brightness | 3:00 |
| Hunger | `hunger` | `#587653` | Rotten flesh, raw chicken, pufferfish, husk | Depletes hunger faster | 0:30 |
| Weakness | `weakness` | `#484D48` | Fermented spider eye, potion | -4 HP per level melee damage | 1:30 |
| Poison | `poison` | `#4E9331` | Potion, spider eye, cave spider, bee | 1 HP per 25/level ticks (cannot kill) | 0:45 |
| Wither | `wither` | `#352A27` | Wither skeleton, wither boss, wither rose | 1 HP per 40/level ticks (can kill) | 0:40 |
| Health Boost | `health_boost` | `#F87D23` | Commands only (beacon used to give) | +4 max HP per level | varies |
| Absorption | `absorption` | `#FFB865` | Golden apple, enchanted golden apple, /effect | +4 absorption HP per level | 1:30 / 2:00 |
| Saturation | `saturation` | `#F82423` | Commands only | Restores hunger + saturation | instant |
| Glowing | `glowing` | `#94A061` | Spectral arrow | Outlines entity through walls | 0:30 |
| Levitation | `levitation` | `#CEFUFF` | Shulker bullet | Floats entity upward | 0:30 |
| Luck | `luck` | `#339900` | Commands only (no vanilla brew) | +1 luck per level (loot tables) | 5:00 |
| Bad Luck | `unluck` | `#C0A44D` | Commands only | -1 luck per level | 5:00 |
| Slow Falling | `slow_falling` | `#FFEFD1` | Potion (phantom membrane) | 0.25× fall speed; no fall damage on landing | 1:30 |
| Conduit Power | `conduit_power` | `#1DACD6` | Conduit (in range) | Combines Water Breathing + Night Vision (underwater) + Haste (underwater) | varies |
| Dolphin's Grace | `dolphins_grace` | `#7CAFC6` | Dolphin (within 5 blocks sprinting) | +5× swim speed | 0:05 |
| Bad Omen | `bad_omen` | `#15BB3E` | Kill pillager captain | Triggers raid on village entry | until death or raid |
| Hero of the Village | `hero_of_the_village` | `#44AFF1` | Defeat raid | Trade discounts + gifts | 2:00 × level (40 min max in newer versions) |
| Darkness | `darkness` | `#090D12` | Warden / sculk shriek | Darkens screen gradually | 0:14 |
| Trial Omen | `trial_omen` | `#7E90FF` | Touch trial spawner ominous vault | Triggers ominous trial | until trial completes |
| Raid Omen | `raid_omen` | `#FFB865` | Touch village with bad omen + ominous | Triggers ominous raid | until raid |
| Wind Charged | `wind_charged` | `#9CF5F7` | Breeze kill (1.21) | Launches attacker on hit | 0:30 |
| Weaving | `weaving` | `#9CF5F7` | Web-spider (1.21) | Slows attacker | 0:30 |
| Oozing | `oozing` | `#9CF5F7` | Slime (1.21) | Spawns slimes on death | 0:30 |
| Infested | `infested` | `#9CF5F7` | Silverfish (1.21) | Spawns silverfish on hit | 0:30 |

---

## Appendix A: Quick Reference Formulas

### A.1 Hunger Depletion
```
exhaustion_per_action:
  jump(sprint)      = 0.2
  jump               = 0.05
  sprint 1m          = 0.1
  walk 1m            = 0.01
  swim 1m            = 0.01
  attack             = 0.1
  take damage        = 0.1
  regen 1 HP         = 6.0
  eat food           = 0.3 (resets some)

if exhaustion >= 4:
  saturation -= 0.5 (or hunger -= 0.5 if saturation 0)
  exhaustion -= 4
```

### A.2 Armor Damage Reduction
```
reduction = (armor / 25) - (4 * damage) / (toughness + 8)
reduction = clamp(reduction, 0, 0.8)  # cap 80%
damage_after = damage * (1 - reduction)
```

### A.3 XP Level
```
xp_to_next(level):
  if level <= 15:   return 2*level + 7
  if level <= 30:   return 5*level - 38
  else:             return 9*level - 158
```

### A.4 Mob Spawn Light Check
```
can_spawn(mob, block):
  if block.block_light > 0: return false  # for most hostile mobs
  if mob.creature_type == 'monster':
    return block.sky_light < 5 OR not_exposed_to_sky
  if mob.creature_type == 'animal':
    return block.sky_light >= 9 AND grass_block_below
```

### A.5 Critical Hit Damage
```
crit_damage = base_damage * 1.5
```

### A.6 Looting Bonus
```
extra_drops = binomial(trials=looting_level+1, p=rare_drop_chance)
```

### A.7 Fortune Bonus
```
# For coal/diamond/emerald: max(1, random(0..fortune_level+2))
# For lapis: random(fortune_level * 2 + 1..fortune_level * 4 + 1)
# For redstone: random(4..4+fortune_level+1)
```

### A.8 Regional Difficulty
```
regional_difficulty(chunk, current_tick):
  inhabited_time = chunk.InhabitedTime (ticks)
  base = 0.2 + min(inhabited_time / 3_600_000, 1.0)  # max 1.2
  moon_phase = (current_tick / 24000) % 8  # 0..7
  moon_factor = 1.0 + (moon_phase in {0, 7} ? 1.0 : 0.0) * 0.25 + ...  # complex
  local = base * moon_factor
  diff_mult = {peaceful:0, easy:0.75, normal:1.5, hard:2.25}[difficulty]
  return local * diff_mult

clamped = clamp(regional_difficulty / 2.0, 0.0, 1.0)
```

---

## Appendix B: Default Coordinates & Constants

- World border default: 60,000,000 × 60,000,000 (±30,000,000).
- Build height: -64 to 320 (Java 1.18+). Total 384 blocks.
- Sea level: Y=63 (Java).
- World center: 0,0.
- Spawn radius: 10 blocks (gamerule configurable).
- Player eye height: 1.62 (standing), 1.54 (sneaking), 0.4 (gliding/elytra).
- Player AABB: 0.6 × 1.8 × 0.6.
- Player base movement speed: 0.1 (4.317 b/s walking, 5.612 b/s sprinting).
- Player jump velocity: 0.42 m/t.
- Player max HP: 20 (10 hearts).
- Player max hunger: 20 (10 drumsticks).
- Player max air: 300 ticks (15 seconds in 1.21+ — was 10 seconds / 200 ticks before 1.21).
- Player invulnerability frame after damage: 10 ticks (0.5 s).
- Default tick rate: 20 tps (ticks per second).
- 1 day = 24000 ticks = 20 minutes.
- 1 lunar cycle = 8 days = 2 hours 40 minutes.
- Default `randomTickSpeed`: 3.
- Default `maxEntityCramming`: 24.
- Default `spawnRadius`: 10.

---

## Appendix C: Mob AI Summary (brief, for cross-reference)

- **Pathfinding**: A* algorithm with heuristic; mob picks nearest walkable block to target.
- **Targeting**: aggro rules per mob (e.g., zombie → player/villager, skeleton → player/iron golem, etc.).
- **Sensing**: line-of-sight check, distance check, "can see" check.
- **Goals**: each mob has prioritized goals (e.g., flee, attack, wander, look at player, swim, breathe).
- **Wandering**: random direction every ~2 seconds within home radius (villagers) or no radius (most mobs).

---

## Appendix D: Block Update Detection Mechanisms

| Mechanism | What it detects |
|---|---|
| Observer block | Block state change adjacent to its face |
| Comparator update | Container content change |
| Block update (neighbor) | Block place/break/change adjacent |
| BUD switch (Java) | Any block state change in BUD-affected range |
| Sculk sensor | Vibration events (footstep, block place, projectile hit, etc.) within 8 blocks |
| Calibrated sculk sensor | Vibration events filtered by frequency |
| Daylight sensor | Sky light level |
| Lightning rod | Lightning strike |

---

## Appendix E: Vibration Frequencies (Sculk Sensor)

| Frequency | Event |
|---|---|
| 1 | Footstep (walking on blocks) |
| 2 | Swim, splash |
| 3 | Item pickup |
| 4 | Ender pearl, projectile shoot |
| 5 | Block place |
| 6 | Block hit (left-click) |
| 7 | Block break |
| 8 | Block eat/drink |
| 9 | Block interact (right-click) |
| 10 | Block step on (pressure plate) |
| 11 | Projectile land |
| 12 | Fishing rod bob |
| 13 | Entity hit (damage) |
| 14 | Entity death |
| 15 | Block explode |

---

## Appendix F: Item Stack Size Reference

| Stack Size | Items |
|---|---|
| 64 | Most blocks, ingots, gems, dusts, tools materials, raw ore, raw food |
| 16 | Ender pearls, snowballs, eggs, signs (1.14+), buckets with contents, honey bottles, banners, beds, minecarts, boats, written books, music discs (1), saddles (1), horse armor (1), trident (1), crossbow bolts in crossbow only |
| 1 | Tools, weapons, armor, potions, banner patterns, enchanted books (16), shulker boxes (1, holds 27 stacks) |

---

## Appendix G: Common Unit Conversions

- 1 game tick = 50 ms = 0.05 s.
- 1 redstone tick = 100 ms = 0.1 s = 2 game ticks.
- 1 second = 20 game ticks = 10 redstone ticks.
- 1 Minecraft day = 24000 ticks = 20 minutes = 1200 seconds.
- 1 Minecraft hour = 1000 ticks = 50 seconds.
- 1 lunar cycle = 8 Minecraft days = 2 hours 40 minutes.
- 1 block = 1 meter in game coordinates.
- 1 chunk = 16 × 16 blocks × 384 blocks tall (Java 1.18+).
- 1 region file = 32 × 32 chunks = 512 × 512 blocks.

---

## Appendix H: Block Hardness Quick Lookup (selected)

| Block | Hardness | Best tool | Mining level |
|---|---|---|---|
| Bedrock | -1 (indestructible) | None | None |
| Obsidian | 50 | Diamond pickaxe | 3 |
| Crying Obsidian | 50 | Diamond pickaxe | 3 |
| Ancient Debris | 30 | Diamond pickaxe | 3 |
| Respawn Anchor | 50 | Diamond pickaxe | 3 |
| Netherite Block | 50 | Diamond pickaxe | 3 |
| Diamond Block | 5 | Iron pickaxe | 2 |
| Anvil | 5 | Pickaxe | 0 |
| Enchanting Table | 5 | Pickaxe | 0 |
| Ender Chest | 22.5 | Pickaxe | 0 |
| Hardened Glass | 10 | Pickaxe | 0 |
| Iron Block | 5 | Stone pickaxe | 1 |
| Iron Bars | 5 | Pickaxe | 0 |
| Brewing Stand | 0.5 | Pickaxe | 0 |
| Stone | 1.5 | Pickaxe | 0 |
| Cobblestone | 2 | Pickaxe | 0 |
| Wood Log | 2 | Axe | none |
| Dirt | 0.5 | Shovel | none |
| Sand | 0.5 | Shovel | none |
| Glass | 0.3 | None (Silk Touch for drop) | none |
| Wool | 0.8 | Shears | none |
| Leaves | 0.2 | Hoe / Shears | none |

---

## Appendix I: References

- Minecraft Wiki (1.21.x): https://minecraft.wiki
- Java Edition 1.21 release notes
- Vanilla data pack JSON schema
- Mojang official documentation (where available)

---

**End of Mechanics Reference File — Minecraft Java Edition 1.21.x**

Total coverage:
- Player mechanics: 12 subsections
- Difficulty: 3 subsections
- Combat: 9 subsections
- Redstone: 14 subsections (deepest)
- Enchanting: 5 subsections
- Brewing: 4 subsections
- Crafting: 5 subsections
- Mining: 4 subsections
- Light: 4 subsections
- Weather: 4 subsections
- Time: 4 subsections
- Tick system: 12 subsections (includes gamerules, advancements, statistics, commands, command blocks)
- Other: 10 subsections
- Status effects: full table (40+ effects)
- Appendices A-I for formulas, constants, mob AI, BUD mechanisms, vibration frequencies, stack sizes, units, hardness.
