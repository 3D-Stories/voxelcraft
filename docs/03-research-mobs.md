# Minecraft Java 1.21.x — Mob & Entity Reference

**Purpose:** Complete reference of every mob and entity in Minecraft Java Edition 1.21.x for an AI building a Minecraft clone. Covers AI systems, statistics, behaviors, spawning, breeding, sounds, and special mechanics. The user explicitly requires that mobs "walk and stuff" — this document therefore goes maximalist on AI behavior so the implementing model can recreate believable mob life.

**Version target:** Java Edition 1.21.0 – 1.21.4 (Tricky Trials update included; covers Bogged, Breeze, Armadillo, Crafter-era spawns).

---

## Table of Contents

1. [Entity Property Reference](#1-entity-property-reference)
2. [Mob AI / Behavior System](#2-mob-ai--behavior-system)
   - 2.1 [Goals System](#21-goals-system)
   - 2.2 [Pathfinding & Navigation](#22-pathfinding--navigation)
   - 2.3 [Sensing](#23-sensing)
   - 2.4 [Brain System (1.14+ mobs)](#24-brain-system-114-mobs)
3. [Passive Mobs](#3-passive-mobs)
4. [Neutral Mobs](#4-neutral-mobs)
5. [Hostile Mobs](#5-hostile-mobs)
6. [Boss Mobs](#6-boss-mobs)
7. [Tamable Mobs](#7-tamable-mobs)
8. [Villager System](#8-villager-system)
9. [Other Entities (non-mob)](#9-other-entities-non-mob)
10. [Spawn Rules Reference](#10-spawn-rules-reference)
11. [Mob Spawning Algorithm](#11-mob-spawning-algorithm)
12. [Breeding Reference](#12-breeding-reference)
13. [Mob Sounds Reference](#13-mob-sounds-reference)
14. [Special Mob Behaviors Deep-Dive](#14-special-mob-behaviors-deep-dive)

---

## 1. Entity Property Reference

### 1.1 Core Entity NBT / Property Categories

Every entity has the following data fields (subset; full schema in `Entity`, `Mob`, `LivingEntity` classes):

| Category | Fields | Notes |
|---|---|---|
| Position | `Pos[x,y,z]`, `Motion[x,y,z]`, `Rotation[yaw,pitch]`, `OnGround`, `FallDistance` | Server-authoritative at 20 TPS |
| Identity | `id` (int), `UUID`, `CustomName`, `CustomNameVisible`, `Silent`, `NoAI`, `Glowing`, `Tags[]` | `NoAI=true` skips goal/brain ticking |
| Health | `Health`, `Attributes[]`, `DeathTime`, `HurtTime`, `HurtByTimestamp`, `AbsorptionAmount` | LivingEntity only |
| AI | `Brain`, `HandDropChances[]`, `ArmorDropChances[]`, `CanPickUpLoot`, `PersistenceRequired`, `Leashed`, `Leash.UUID` | Mob only |
| Targets | `HurtBy`, `Target` (legacy), Brain memories (newer mobs) | Some mobs use legacy target selectors |
| Inventory | `ArmorItems[]`, `HandItems[]`, `Saddle`, `ChestedHorse`, `Items[]` (chest horse) | Per-mob |
| Passenger | `Passenger`, `RootVehicle`, `Vehicle` | Stack-based riding |
| Fire | `Fire`, `HasVisualFire` | Ticks remaining; -1 = extinguish |
| Dimensional | `PortalCooldown`, `Dimension` | Per-entity nether portal timer |

### 1.2 Standard Attributes (1.21)

| Attribute ID | Default (Player) | Description |
|---|---|---|
| `generic.max_health` | 20.0 | HP cap (half-hearts = value) |
| `generic.follow_range` | 16.0 (most mobs 16–40) | Goal target search radius (blocks) |
| `generic.knockback_resistance` | 0.0 | 0–1 chance to negate knockback |
| `generic.movement_speed` | 0.25 (zombie 0.23, skeleton 0.25, villager 0.5 inner-village) | Meters/tick × 20 = blocks/sec |
| `generic.flying_speed` | 0.4 (parrot, bat, allay, bee) | Flying entities only |
| `generic.attack_damage` | 2.0 | Base melee damage (modified per mob) |
| `generic.attack_knockback` | 0.0 | Extra knockback on hit |
| `generic.attack_speed` | 4.0 | Player only (attacks/sec) |
| `generic.armor` | 0.0 | 0–20 flat damage reduction |
| `generic.armor_toughness` | 0.0 | Reduces armor penetration |
| `generic.luck` | 0.0 | Affects loot tables (player only) |
| `generic.max_absorption` | 0.0 | Cap for absorption effect |
| `generic.gravity` | 0.08 | Per-tick downward accel (mobs default 0.08) |
| `generic.scale` | 1.0 | 1.21+ visual/collision scale |
| `generic.step_height` | 0.6 | Auto-step-up height (1.20.5+) |
| `generic.jump_strength` | 0.42 | Horse-only jump stat (1.20.5+) |
| `generic.safe_fall_distance` | 3.0 | Distance before fall damage starts |
| `generic.fall_damage_multiplier` | 1.0 | Scales fall damage taken |
| `horse.jump_strength` | 0.7 | Legacy (replaced by generic.jump_strength in 1.20.5) |
| `zombie.spawn_reinforcements` | 0.0–0.1 | Chance to summon aid on hit |

### 1.3 Standard Hitbox Sizes

| Mob | Width × Height (blocks) | Eye Height | Notes |
|---|---|---|---|
| Player | 0.6 × 1.8 | 1.62 | Sneak: 0.6 × 1.5 |
| Zombie | 0.6 × 1.95 | 1.74 | Baby: 0.3 × 0.975 |
| Skeleton | 0.6 × 1.99 | 1.74 | |
| Creeper | 0.6 × 1.7 | 1.445 | |
| Spider | 1.4 × 0.9 | 0.65 | Can climb walls |
| Cave Spider | 0.7 × 0.5 | 0.45 | Fits through 0.5 gaps |
| Enderman | 0.6 × 2.9 | 2.55 | 3-block-tall, can't fit 2-tall doorways |
| Slime (small/med/large) | 0.51 / 1.02 / 2.04 cube | 0.325/0.65/1.3 | |
| Witch | 0.6 × 1.95 | 1.62 | |
| Iron Golem | 1.4 × 2.7 | 2.025 | Can hit 2-block-up targets |
| Villager | 0.6 × 1.95 | 1.62 | Baby: 0.3 × 0.975 |
| Wandering Trader | 0.6 × 1.95 | 1.62 | |
| Cow | 0.9 × 1.4 | 1.0 | |
| Pig | 0.9 × 0.9 | 0.65 | |
| Sheep | 0.9 × 1.3 | 0.95 | |
| Chicken | 0.4 × 0.7 | 0.4 | |
| Horse | 1.4 × 1.6 | 1.33 | Donkey/mule same |
| Llama | 0.9 × 1.87 | 1.67 | Trader llama same |
| Cat | 0.6 × 0.7 | 0.35 | |
| Ocelot | 0.6 × 0.7 | 0.35 | |
| Wolf | 0.6 × 0.85 | 0.45 | |
| Parrot | 0.5 × 0.9 | 0.54 | Perchable on shoulder |
| Fox | 0.6 × 0.7 | 0.4 | |
| Bee | 0.5 × 0.5 (flat 0.7×0.6 when landed) | 0.15 | |
| Turtle | 1.2 × 0.4 | 0.15 | |
| Axolotl | 0.75 × 0.42 | 0.2 | |
| Frog | 0.5 × 0.5 | 0.28 | |
| Goat | 0.9 × 1.3 | 0.93 | |
| Sniffer | 1.9 × 1.75 | 1.0 | Largest passive hitbox |
| Allay | 0.4 × 0.6 | 0.36 | |
| Armadillo | 0.7 × 0.65 | 0.24 | |
| Camel | 1.7 × 2.3 | 1.6 | 2-player saddle |
| Strider | 0.9 × 1.7 | 1.0 | |
| Dolphin | 0.9 × 0.6 | 0.3 | |
| Squid | 0.8 × 0.8 | 0.4 | |
| Glow Squid | 0.8 × 0.8 | 0.4 | |
| Bat | 0.5 × 0.9 | 0.45 | |
| Cod | 0.5 × 0.3 | 0.195 | |
| Salmon | 0.7 × 0.4 | 0.26 | |
| Pufferfish | 0.7 × 0.7 | 0.35 | |
| Tropical Fish | 0.5 × 0.4 | 0.24 | |
| Phantom | 0.9 × 0.5 | 0.25 | |
| Ravager | 1.95 × 2.2 | 1.6 | |
| Pillager | 0.6 × 1.95 | 1.74 | |
| Vindicator | 0.6 × 1.95 | 1.74 | |
| Evoker | 0.6 × 1.95 | 1.74 | |
| Vex | 0.4 × 0.8 | 0.275 | Flies through blocks |
| Guardian | 0.85 × 0.85 | 0.425 | |
| Elder Guardian | 1.9975 × 1.9975 | 1.0 | |
| Shulker | 1.0 × 1.0 | 0.5 | Closed: 1.0×1.0, open adds 0.5 |
| Ghast | 4.0 × 4.0 | 2.6 | |
| Blaze | 0.6 × 1.8 | 1.4 | |
| Magma Cube | same as slime | | |
| Wither Skeleton | 0.7 × 2.4 | 2.1 | |
| Hoglin | 1.4 × 1.4 | 1.0 | |
| Piglin | 0.6 × 1.95 | 1.74 | |
| Piglin Brute | 0.6 × 1.95 | 1.74 | |
| Zombified Piglin | 0.6 × 1.95 | 1.74 | |
| Breeze | 0.6 × 1.77 | 1.34 | 1.21 |
| Bogged | 0.6 × 1.99 | 1.74 | 1.21 skeleton variant |
| Warden | 0.9 × 2.9 | 2.4 | |
| Ender Dragon | 16.0 × 8.0 | 6.0 | Largest entity hitbox |
| Wither | 0.9 × 3.5 | 2.0 | |

### 1.4 Standard Speed Reference

Speeds are stored in `generic.movement_speed` (blocks per tick). Multiply by 20 for blocks/second at full walk.

| Mob | Attribute Speed | Effective blocks/sec | Notes |
|---|---|---|---|
| Zombie | 0.23 | 4.6 | Can sprint 1.5× when targeting |
| Husk | 0.23 | 4.6 | |
| Drowned | 0.23 (land), swim 0.2 | 4.6 / 4.0 swim | Slower in water |
| Skeleton | 0.25 | 5.0 | |
| Stray | 0.25 | 5.0 | |
| Bogged | 0.25 | 5.0 | |
| Wither Skeleton | 0.25 sprint-bonus | ~6.0 | |
| Creeper | 0.20 → 0.30 (when primed-strafe) | 4.0 / 6.0 | Sprint-strafes when chasing |
| Spider | 0.30 (day 0.3, night chasing) | 6.0 | Climbs walls |
| Cave Spider | 0.30 | 6.0 | |
| Enderman | 0.30 | 6.0 | Teleports up to 32 blocks |
| Witch | 0.25 | 5.0 | |
| Slime (any size) | 0.7 (jump) → ~2.8 effective | | Hops every ½ sec |
| Iron Golem | 0.25 | 5.0 | |
| Villager (wander) | 0.5 | 10.0 inside village | Panics 0.6, walks 0.4 |
| Pillager | 0.35 | 7.0 | Raider sprint |
| Vindicator | 0.35 (sprint 1.4×) | 7.0 / ~9.8 Johnny mode | |
| Ravager | 0.3 (roar-stun-able) | 6.0 | |
| Phantom | 0.45 + dive boost | ~9.0 | |
| Ghast | 0.85 flight | ~17 | Slow drift |
| Blaze | 0.23 flight | ~4.6 | Hovers |
| Wither | 0.6 flight | 12 | |
| Ender Dragon | 0.1 → 0.6 dive | variable | |
| Warden | 0.4 → 0.6 (smelling/angry) | 8 / 12 | |
| Wolf (wild) | 0.3 | 6 | Tamed same; sprinting 1.5× |
| Cat | 0.3 | 6 | |
| Fox | 0.3 (sleep 0 / crouch 0.18 / sprint 0.6) | | |
| Bee | 0.3 flight + 0.6 boost when chasing | | |
| Allay | 0.4 flight | 8 | |
| Parrot | 0.4 flight | 8 | |
| Bat | 0.1 flight | 2 | Drifts |
| Strider | 0.33 land/0.66 lava | 6.6 / 13.2 | |
| Camel | 0.35 (walk) / 0.55 (dash) | 7 / 11 | Dash 1.21 |
| Goat | 0.35 + jump | | |
| Horse (genetic) | 0.1125–0.3375 | 2.25–6.75 (stat range 4.7–14.2 b/s) | |
| Sniffer | 0.16 | 3.2 | Slowest passive |

### 1.5 Damage Calculation Formula

Per-tick melee damage resolution:

```
finalDamage = max(0, incomingDamage * (1 - min(20, max(armor/5, armor - damage/(2+toughness/4))) / 25) * (1 - resistance%) )
```

Simplified: `armor` reduces 0.8–80% of incoming damage, capped by `toughness`. Resistance effect reduces 20%/level (cap level 5 = 100%). Vanilla armor: leather 7→13, gold 11, chain 12, iron 15, diamond 20+netherite +4 toughness. Knockback resistance: chance to ignore knockback entirely.

---

## 2. Mob AI / Behavior System

Minecraft mob AI runs on **two parallel systems** that have coexisted since 1.14:

- **Legacy Goals system** — Used by most pre-1.14 mobs and still maintained for zombies, skeletons, creepers, spiders, etc.
- **Brain system** (newer) — Used by villagers, piglins, allays, axolotls, frogs, goats, camels, armadillos, wardens, sniffer, bees, dolphins, etc.

Both systems run every tick (20 Hz) but the Brain system uses modular memories and tasks, while Goals use prioritized selectors.

### 2.1 Goals System

#### 2.1.1 Structure

Every `MobEntity` has:

```java
public final GoalSelector goalSelector;        // behavior goals
public final GoalSelector targetSelector;      // target acquisition goals
```

`GoalSelector` is a set of `PrioritizedGoal` (priority `int`, wrapped `Goal`). Each tick:

1. For each selector, all goals are filtered by `canUse()` (their start condition).
2. Goals of the same priority can't run simultaneously — the first valid one wins.
3. Higher-priority goals (lower number) preempt lower-priority ones if they need to start; the lower one's `stop()` is called.
4. Running goals call `tick()` each tick; `canContinueToUse()` gates continuation.

#### 2.1.2 Goal Types (Flags)

Each Goal declares one or more `Goal.Flag` (a bitset). Mobs cannot run two goals that share a flag simultaneously:

| Flag | Meaning |
|---|---| 
| `MOVE` | Pathfinding / walking |
| `LOOK` | Head rotation / aim |
| `JUMP` | Jumping |
| `TARGET` | Currently targeting an entity |

#### 2.1.3 Common Goal Classes (Mojang mappings)

| Class | Purpose |
|---|---|
| `FloatGoal` | Stay afloat in water |
| `PanicGoal` | Flee randomly when on fire / hit |
| `LookAtPlayerGoal` | Idle head-track |
| `RandomLookAroundGoal` | Random head turn |
| `WaterAvoidingRandomStrollGoal` | Wander, prefer land |
| `RandomStrollGoal` | Wander anywhere |
| `RandomSwimmingGoal` | Wander in water |
| `FleeSunGoal` | Burn in daylight → seek shade |
| `RestrictSunGoal` | Stay under shade |
| `MeleeAttackGoal` | Walk up to target and swing |
| `RangedAttackGoal` | Bow / fireball attack |
| `RangedBowAttackGoal` | Skeleton bow |
| `RangedCrossbowAttackGoal` | Pillager crossbow |
| `NearestAttackableTargetGoal<T>` | Find nearest target of type T |
| `HurtByTargetGoal` | Target whatever hit me (with alert-allies option) |
| `OwnerHurtTargetGoal` / `OwnerHurtByTargetGoal` | Tamed wolf attacks |
| `BreedGoal` | Walk to partner for breeding |
| `TemptGoal` | Follow player holding breeding item |
| `FollowParentGoal` | Baby follows adult |
| `FollowFlockLeaderGoal` | Schools of fish |
| `AvoidEntityGoal<T>` | Flee from entity type T |
| `LeapAtTargetGoal` | Spider leap |
| `ClimbOnTopOfPowderSnowGoal` | |
| `DoorsInteractGoal` / `OpenDoorGoal` | Zombies open wooden doors |
| `BreakDoorGoal` | Zombies break wooden doors (Hard difficulty) |
| `MoveThroughVillageGoal` | Zombie village siege |
| `RemoveBlockGoal` | Silverfish emerging |
| `GolemRandomStrollInVillageGoal` | Iron Golem patrol |
| `FindWaterGoal`, `TryFindWaterGoal` | Aquatic mobs |
| `FollowBoatGoal` | Fish swim with boats |
| `EatBlockGoal` | Sheep eat grass |
| `SitWhenOrderedToGoal` | Tamed sit |
| `FollowOwnerGoal` | Tamed follow |
| `SkeletonTrapGoal` | Skeleton horse trap triggers |

#### 2.1.4 Example: Zombie Goal Registration

```java
// 1.21 MobEntity.registerGoals for Zombie:
goalSelector.addGoal(0, new FloatGoal(zombie));
goalSelector.addGoal(2, new ZombieAttackGoal(zombie, 1.0, false));  // melee
goalSelector.addGoal(3, new FleeSunGoal(zombie, 1.0));
goalSelector.addGoal(5, new WaterAvoidingRandomStrollGoal(zombie, 1.0));
goalSelector.addGoal(6, new LookAtPlayerGoal(zombie, Player.class, 8.0F));
goalSelector.addGoal(6, new RandomLookAroundGoal(zombie));
targetSelector.addGoal(1, new HurtByTargetGoal(zombie, true));
targetSelector.addGoal(2, new NearestAttackableTargetGoal<>(zombie, Player.class, true));
targetSelector.addGoal(3, new NearestAttackableTargetGoal<>(zombie, AbstractVillager.class, false));
targetSelector.addGoal(3, new NearestAttackableTargetGoal<>(zombie, IronGolem.class, true));
targetSelector.addGoal(5, new NearestAttackableTargetGoal<>(zombie, Turtle.class, 10, true, false, turtle -> !turtle.isBaby()));
// On Hard, also:
goalSelector.addGoal(4, new BreakDoorGoal(zombie, x -> true));
```

Lower number = higher priority. `0` is float (always run if in water). Attack is `2`. Flee-sun is `3`. Wander is `5`. Look-around shares priority `6` so only one runs at a time.

#### 2.1.5 Target Selectors

Target goals acquire and store the current `target` LivingEntity. Common patterns:

- `NearestAttackableTargetGoal` — scans `follow_range` for nearest entity of given class. Can filter by line-of-sight, must-see, must-be-on-same-team.
- `HurtByTargetGoal` — sets target to whoever damaged the mob; can also alert nearby allies of same type (e.g., bees, zombified piglins, endermen in some cases).
- `ResetUniversalAngerTargetGoal` — used for "universally angry" mobs (zombified piglins, endermen). After aggro, target is whoever the mob is looking at.

### 2.2 Pathfinding & Navigation

#### 2.2.1 A* Pathfinding

Minecraft uses **A\*** over a 3D voxel node graph. Each tick (or every few ticks for distant paths), the mob requests a path from current position to target.

- Node = a single block position with walkability flags.
- Heuristic = Manhattan distance to goal (with some diagonal allowance).
- Edge cost = step cost; jumping up costs more; water nodes cost more for non-aquatic.
- Path is **partial** — the algorithm stops early after a node budget (`maxPathLength`, typically 32–128 blocks) so distant goals produce step-by-step refinement.

#### 2.2.2 Navigation Types

Each mob has one `PathNavigation` subclass; chosen at entity construction:

| Class | Used by | Behavior |
|---|---|---|
| `GroundPathNavigation` | Zombie, cow, villager, pillager, etc. | Standard A*; can pass doors |
| `WaterBoundPathNavigation` | Squid, fish, dolphin | Only pathfinds in water |
| `AmphibiousPathNavigation` | Turtle, axolotl, frog | Both land and water |
| `FlyingPathNavigation` | Bat, parrot, bee, allay, ghast, phantom, vex | Treats air as walkable |
| `HoveringPathNavigation` | Blaze | Hovers slightly off ground |

Key configuration per navigation:

| Field | Effect |
|---|---|
| `nodeEvaluator.canPassDoors` | Whether doors block paths |
| `nodeEvaluator.canOpenDoors` | Whether doors are passable (zombies open) |
| `nodeEvaluator.canFloat` | Whether mob stays on water surface |
| `nodeEvaluator.canWalkOverFence` | Villager avoid; ravager ignores |

#### 2.2.3 Pathfinding Node Types

`BlockPathTypes` weights each block:

| Type | Default penalty (malus) | Notes |
|---|---|---|
| `WALKABLE` | 0.0 | |
| `OPEN` | 1.0 | Empty space (fall risk) |
| `WATER` | 8.0 for land mobs | |
| `WATER_BORDER` | 8.0 | |
| `RAIL` | 0.0 | Minecart-only |
| `DANGER_FIRE` | 1.0 | Adjacent to fire/lava |
| `DAMAGE_FIRE` | 1.0 | On fire/lava |
| `DANGER_CACTUS` | 1.0 | |
| `DAMAGE_CACTUS` | 1.0 | |
| `DAMAGE_STICKY_HONEY` | 1.0 | |
| `DAMAGE_OTHER` | 1.0 | Sweet berries, wither roses, etc. |
| `DANGER_OTHER` | 1.0 | |
| `DOOR_OPEN` | 1.0 | |
| `DOOR_WOOD_CLOSED` | 1.0 | |
| `BREACH` | 1.0 | |
| `LEAVES` | -1 (most mobs); 0 (spider) | Spiders can climb through |
| `COCOA` | -1 | |
| `FENCE` | -3 (can't cross) | |

A malus of `≤ -1` means the block is unwalkable; the higher the positive malus, the more the mob avoids it.

#### 2.2.4 Climbing

Spiders, cave spiders, and goats (jump not climb) handle vertical surfaces differently. Spiders use a dedicated `ClimbOnTopOfPowderSnowGoal`-adjacent override where the entity is treated as on a ladder if `block.isCollisionShapeFullBlock` is false on the side. Spiders can wall-climb any solid vertical surface and stop at top edges. Kelp, ladders, vines, scaffolding, and twisty vines provide climbing paths to all mobs.

### 2.3 Sensing

#### 2.3.1 Line of Sight

`LivingEntity.hasLineOfSight(target)` raycasts from eye height to target's bounding box center, returning false if a non-`Occlusion`-transparent block is hit. Used by skeleton bow targeting, villager gossip, and enderman provocation.

#### 2.3.2 Hearing

The sculk sensor / warden system uses a custom **vibration** channel. Vibrations travel through 8 blocks per tick (configurable) and are routed to listeners (`VibrationListener`). Sources include footsteps on certain blocks, projectiles landing, blocks breaking/placing, hits, and some mob sounds.

Vibration types (`GameEvent` registry, partial list):

| Event | Default radius |
|---|---|
| `step` | 16 |
| `swim` | 16 |
| `flap` | 16 |
| `entity_action` | 16 |
| `equip` | 16 |
| `hit_ground` | 16 |
| `hit_block` | 16 |
| `block_change` | 16 |
| `block_place` | 16 |
| `block_attach` | 16 |
| `block_close` | 16 |
| `block_open` | 16 |
| `block_activate` | 16 |
| `block_deactivate` | 16 |
| `block_use` | 16 |
| `container_close` | 16 |
| `container_open` | 16 |
| `drink` | 16 |
| `eat` | 16 |
| `entity_damage` | 16 |
| `entity_die` | 16 |
| `entity_dismount` | 16 |
| `entity_interact` | 16 |
| `entity_mount` | 16 |
| `entity_place` | 16 |
| `instrument_play` | 16 |
| `item_interact_finish` | 16 |
| `item_interact_start` | 16 |
| `jukebox_play` | 16 |
| `jukebox_stop_play` | 16 |
| `lightning_strike` | 16 |
| `note_block_play` | 16 |
| `prime_fuse` | 16 |
| `projectile_land` | 16 |
| `projectile_shoot` | 16 |
| `resonate_1` – `resonate_15` | 16 |
| `shear` | 16 |
| `splash` | 16 |
| `teleport` | 16 |
| `unequip` | 16 |
| `wither_summon` | 16 |

Sculk sensors listen for all of these by default; Calibrated Sculk Sensors can filter by an amplitude/amethyst single channel.

#### 2.3.3 Smell

Only the Warden formally "smells" — it has a 6-block instant sense radius for any entity with a "smellable" tag (currently all non-sneaking players/mobs). Sneaking reduces vibration emission but does not hide smell from the Warden; wool blocks absorb vibrations.

### 2.4 Brain System (1.14+ mobs)

The `Brain` class is a registry of:

- **Memories** — `MemoryModuleType<?>` → value, with optional expiry (ticks). Memories auto-expire when unused.
- **Sensors** — `SensorType<?>` subclasses that run every N ticks to populate memories (e.g., nearest players, nearest beds, nearest hostile mobs, visible items on the ground).
- **Behaviors** — `BehaviorControl<?>` instances grouped by activity.

#### 2.4.1 Activities

Behaviors are grouped by activity. Only one activity (set) is active at a time per mob:

| Activity | Used by | Trigger |
|---|---|---|
| `CORE` | All brain mobs | Always-on base behaviors |
| `IDLE` | All brain mobs | Default when nothing else |
| `WORK` | Villagers | Daytime, has profession, at workstation |
| `PLAY` | Villager children | Daytime |
| `REST` | Villagers | Nighttime |
| `MEET` | Villagers | Afternoon gathering |
| `PREPARE_FOR_NIGHT` | Villagers | Sunset transition |
| `PANIC` | Villagers, allay | Hit / zombie nearby |
| `RAID` | Villagers | Raid active |
| `HIDE` | Villagers | Raid bell rung |
| `FIGHT` | Piglins, villagers (iron-golem-only) | Has combat target |
| `CELEBRATE` | Piglins, villagers (raid won) | |
| `EMERGE` | Warden | Emerging from ground |
| `DIG` | Warden | Despawning into ground |
| `INVESTIGATE` | Warden | Heard disturbance |
| `SNIFF` | Warden | Searching |

#### 2.4.2 Memory Module Examples (Villager)

```
Villager memories include:
- NEAREST_LIVING_ENTITIES        (expires in 200t)
- NEAREST_PLAYERS                 (200t)
- NEAREST_VISIBLE_LIVING_ENTITIES (200t)
- WALK_TARGET                     (200t)
- LOOK_TARGET                     (200t)
- INTERACTABLE_DOORS              (200t)
- OPENED_DOORS                    (200t)
- NEAREST_BED                     (200t)
- NEAREST_JOB_SITE                (200t)
- JOB_SITE                        (never expires when claimed)
- POTENTIAL_JOB_SITE              (200t)
- HOME                            (never expires)
- SECONDARY_JOB_SITE              (never)
- MEETING_POINT                   (never)
- BREED_TARGET                    (200t)
- INTERACTION_TARGET              (200t)
- PLAY_DEAD                       (200t)
- CANT_REACH_WALK_TARGET_SINCE    (always)
- GOLEM_DETECTED_RECENTLY         (600t)
- LAST_SLEPT                      (always)
- LAST_WOKEN                      (always)
- LAST_WORKED_AT_POI              (always)
- MOBS                            (any nearby mobs)
- HURT_BY                         (200t)
- HURT_BY_ENTITY                  (200t)
- ATTACK_TARGET                   (200t)
- VILLAGER_HOSTILES               (200t)
```

#### 2.4.3 Sensors

Sensors run on intervals (e.g., every 20 ticks for nearest players, every 40 ticks for visible items). They are responsible for keeping memories fresh. Common ones:

- `NearestLivingEntitySensor`
- `PlayerSensor`
- `VillagerBabiesSensor`
- `SecondaryPoiSensor` (workstation + secondary gathering POI)
- `VillagerHostilesSensor`
- `GolemLastSeenSensor`
- `PiglinSpecificSensor`
- `PiglinMobsSensor`
- `HoglinSpecificSensor`
- `AxolotlAttackablesSensor`
- `FrogAttackablesSensor`
- `AdultSensor`
- `IsInWaterSensor`

#### 2.4.4 Behavior Control Flow

```
brain.tick()
  -> each Sensor: tick_if_due(sensor)
  -> each Activity currently active:
       for each Behavior in activity, in priority order:
         if !running and can_run(brain):
            start(brain)
            add to running set
            break (one starts per activity per tick max)
         if running and can_continue(brain):
            tick(brain)
         else:
            stop(brain)
            remove from running
```

Behaviors are stateful, with `tryStart`, `tick`, `canStop`, `stop` hooks. They use memories for input (via `MemoryCondition` predicates) and write back to memories for output.

#### 2.4.5 Brain vs Goals Trade-off

| Feature | Goals | Brain |
|---|---|---|
| Tick cost | Lower | Higher (memory refresh) |
| State retention | Implicit in goal instance | Explicit in memories |
| Behavior reuse | Awkward (subclass per mob) | High — same Behavior reused across mobs |
| Schedule support | Manual | Built-in schedule + activity map |
| Used by | Zombies, creepers, spiders, most 1.13-era mobs | Villagers, piglins, allays, axolotls, goats, frogs, armadillos, sniffers, wardens, bees, dolphins |

When implementing a clone, pick one. The Brain system is more flexible but more complex; Goals is simpler and works fine for ~70% of mobs.

---

## 3. Passive Mobs

Passive mobs never attack the player on sight (with noted exceptions for self-defense). They typically flee or defend in some narrow cases (e.g., llama spit, panda retaliation).

### 3.1 Overworld Terrestrial Passive Mobs

| Mob | Health | Damage | Hitbox | Spawn Conditions | Drops | Notes |
|---|---|---|---|---|---|---|
| Cow | 10 (5♥) | 0 | 0.9×1.4 | Grass, light ≥ 9, common | Leather 0-2, Raw Beef 1-3 (cooked if fire) | Breed with wheat |
| Mooshroom (red/brown) | 10 | 0 | 0.9×1.4 | Mushroom Fields biome | Same as cow + mushroom stew when milked with bowl; shear → becomes cow, spawns mushrooms | Lightning: red↔brown |
| Pig | 10 | 0 | 0.9×0.9 | Grass, light ≥ 9 | Raw Porkchop 1-3 | Breed with carrots/potatoes/beetroot; saddled & carrot-on-stick to ride |
| Sheep | 8 (4♥) | 0 | 0.9×1.3 | Grass, light ≥ 9 | Wool 1 (color-biased), Mutton 1-2 | Eats grass to regrow wool; can be dyed before shearing |
| Chicken | 4 (2♥) | 0 | 0.4×0.7 | Light ≥ 9, grass | Feather 0-2, Raw Chicken 1 (cooked if fire) | Lays egg every 5-10 min; immune to fall damage (flutters); breeds with seeds |
| Rabbit | 3 (1.5♥) | 0 | 0.4×0.4 | Most biomes (desert, snow, taiga, etc.) | Raw Rabbit 0-1, Rabbit Hide 0-1, Rabbit's Foot 0-1 (10% on player kill) | 6 variants + Killer Bunny (JEB_) + Toast (renamed) |
| Horse | 15-30 (random) | 0 (kick 1-2 ♥) | 1.4×1.6 | Plains/savanna herds of 2-6 | Leather 0-2 | Tame by mounting 0-20 times; stats inherit random |
| Donkey | 15-30 | 0 | 1.4×1.6 | Plains | Leather 0-2 | Chested (15 slots); breed with golden apples/carrots |
| Mule | 15-30 | 0 | 1.4×1.6 | Cannot spawn naturally; bred horse×donkey | Leather 0-2 | Sterile; chested |
| Skeleton Horse | 15 | 0 | 1.4×1.6 | Lightning trap on surface | Bones 0-2 | Trap: in storm, near player, skeleton horse + 3 mounted skeletons spawn |
| Zombie Horse | 15 | 0 | 1.4×1.6 | Creative only | Rotten Flesh 0-2 | Cannot spawn in survival |
| Llama | 15-30 | 1 ♥ (spit) | 0.9×1.87 | Savanna/Windswept Hills herds 4-7 | Leather 0-2 | Strength 1-5 (storage 3-15 slots); caravans of 10; spit at wolves |
| Trader Llama | 20 | 1 (spit) | 0.9×1.87 | With wandering trader | Leather 0-2 | Same as llama but leashed by trader |
| Cat | 10 | 0 (scratch wolf 1 ♥) | 0.6×0.7 | Village (1 per 4 beds, max 5) and Swamp Hut (1 black) | String 0-2 | 11 vanilla + 1 community + 2 Jinx; tamed with raw cod/salmon; creepers avoid 6 blocks |
| Ocelot | 10 | 0 | 0.6×0.7 | Jungle | String 0-2, Raw Cod? | Trust mechanic: feed cod/salmon; creeper avoidance |
| Parrot | 6 (3♥) | 0 | 0.5×0.9 | Jungle | Feather 1-2 | Tamed with seeds; 5 colors; sits on shoulder; imitates nearby hostile mob sounds; cookies kill |
| Panda | 20 | 0 (aggressive 6 ♥) | 1.3×1.25 | Bamboo Jungle | Bamboo 1-2 | 7 personalities (normal, lazy, worried, playful, aggressive, weak, brown); breeding requires 8+ bamboo within; weak dies at 10 ♥; sneezes transfer |
| Fox | 10 | 0 | 0.6×0.7 | Taiga/Snowy Taiga/Grove (sometimes spawn holding item) | No drop naturally (drops held item) | Tamed via sweet berries 2× to breed; trusted via giving food then leading baby out; sleeps day, hunts at night; can hold items in mouth |
| Bee | 10 | 2 ♥ (sting, dies 60s later if aggravated) | 0.5×0.5 (flat 0.7×0.6 when landed) | Plains/Forest/Flower Forest/Birch Forest/Sunflower Plains with bee nest | No drops | Spawns in nest (1-3); breeds with any flower; pollinates crops, returns to nest at night/rain |
| Turtle | 30 (15♥) | 0 | 1.2×0.4 | Beaches (sand) | Seagrass 0-2; on death: Bowl → Turtle Shell piece dropped only if baby grows up | Lays eggs on home beach; eggs hatch in 4-6 nights; scute dropped when baby matures |
| Axolotl | 14 (7♥) | 2 | 0.75×0.42 | Lush Caves water | None | 5 colors (lucy, wild, gold, cyan, blue); tropical fish bucket to breed; plays dead at 33% HP; gives player Regeneration I + Mining Fatigue removal buff |
| Frog | 10 | 0 | 0.5×0.5 | Swamps/Mangrove Swamps (spawned from tadpoles) | None | 3 temperate variants (temperate, cold, warm); tongue-pulls slimes/magma cubes; produces froglights based on small magma cube variant eaten |
| Tadpole | 6 | 0 | 0.3×0.4 | Hatches from frogspawn (water) | None | Grows into frog whose type depends on current biome temp |
| Goat | 10 | 0 (rams 1-3 ♥ + knockback) | 0.9×1.3 | Mountains/Meadows/Snowy Slopes | Mutton 1 if killed | 5% screaming goat (lower horn cooldown, higher ram damage); rams every 30-300s; jumps 5 blocks |
| Sniffer | 8 (4♥) | 0 | 1.9×1.75 | From Sniffer Egg hatched by player | None | Cannot spawn naturally; digs for torchflower seeds and pitcher pods; hatches egg in 20 min on moss |
| Allay | 20 (10♥) | 0 | 0.4×0.6 | Pillager Outposts cages (1-3) and Woodland Mansions | None | Hands player any matching items it finds; duplicates when given amethyst shard while dancing to jukebox |
| Armadillo | 12 (6♥) | 0 | 0.7×0.65 | Badlands/Savanna | None | 1.21; rolls into shell when hit or near undead; sheds armadillo scutes every 5-10 min (used for wolf armor) |
| Camel | 32 (16♥) | 0 | 1.7×2.3 | Desert villages (1 per village) | None | 1.20; saddled; 2 riders (front+back); dash on a 40-tick cooldown (8-block horizontal leap) |
| Strider | 20 (10♥) | 0 | 0.9×1.7 | Nether lava lakes (2-4) | String 0-2 | Rides on lava; saddled with warped fungus on a stick; cold (out of lava) → turns purple, shivers |
| Glow Squid | 10 | 0 | 0.8×0.8 | Underground water, deep (Y < 30) | Glow Ink Sac 1-3 | 1.17; ink particles when hit; passive |
| Squid | 10 | 0 | 0.8×0.8 | Ocean/River water | Ink Sac 1-3 | Hurtles when hit |
| Bat | 6 (3♥) | 0 | 0.5×0.9 | Caves Y ≤ 63, light ≤ 3 | None | Roosts upside down; despawns in daylight (overworld) |
| Snow Golem | 4 (2♥) | 0 (snowball 0 ♥ to non-ender/nether; 3 ♥ to blaze) | 0.7×1.9 | Player-built (pumpkin + 2 snow blocks) | Snowballs 0-15 | Player-built; melts in hot biomes; leaves snow trail; pushes back mobs in rain |
| Iron Golem | 100 (50♥) | 7-21 ♥ (varies with attack lift) | 1.4×2.7 | Villages (1 per 10 villagers) or player-built (4 iron + carved pumpkin) | Iron Ingot 3-5, Poppy 0-2 | Attacks hostile mobs; cannot swim (sinks); throws players into air; craks visual at 75/50/25% HP |

### 3.2 Aquatic Passive Mobs

| Mob | Health | Damage | Spawn | Drops | Notes |
|---|---|---|---|---|---|
| Cod | 3 (1.5♥) | 0 | Normal oceans/cold oceans | Raw Cod 1 | Schools of 3-6 |
| Salmon | 3 | 0 | Oceans/rivers (also frozen) | Raw Salmon 1 | 2 sizes |
| Pufferfish | 3 | 0 + poison aura 4-6s (touch) | Lukewarm/Deep Lukewarm Ocean | Pufferfish 1 | Inflates when player/mob within 5 blocks |
| Tropical Fish | 3 | 0 | Lukewarm Ocean/Deep Lukewarm Ocean/Coral Reefs | Tropical Fish 1 (or 0-1 bone meal-like) | 22 patterns × multiple colors = thousands of variants |
| Dolphin | 10 (5♥) | 0 (slap 1 ♥) | All non-frozen oceans | Raw Cod/Salmon 0-1 | Neutral: if attacked, calls nearby dolphins; gives Dolphin's Grace to swimming player; treasure pathfinder when fed |
| Axolotl (already above) | 14 | 2 | Lush Caves water | None | |
| Glow Squid (already above) | 10 | 0 | Underground water | Glow Ink Sac | |

### 3.3 Villager & Wandering Trader (see §8 for full system)

| Mob | Health | Spawn | Drops | Notes |
|---|---|---|---|---|
| Villager | 20 (10♥) | Villages, igloo basement, zombie cure | None (drop loot table empty) | See §8 |
| Wandering Trader | 20 | 1 per player per 20-34 min anywhere | Potion of Invisibility (1), Milk Bucket (1) | 2 trader llamas with him; despawns after 40-60 min |

---

## 4. Neutral Mobs

Neutral mobs don't attack the player by default but will if provoked. Provocation triggers vary.

| Mob | Health | Damage | Trigger to Aggro | Leash/Tame | Notes |
|---|---|---|---|---|---|
| Wolf | 8 wild (20 tamed) | 4 (wild) / 4 + critical (tamed) | Hit by player → pack attacks | Tame with bones (1-7); persists | Spawn in forest/taiga packs; breeds with any meat; collar dyed |
| Spider | 16 (8♥) | 2 | Day: passive; Night or dark: hostile; if hit day: hostile briefly | None | Climbs walls; can spawn with skeleton/jockey; `PersistenceRequired` when rider |
| Cave Spider | 12 (6♥) | 2 + Poison I 7s (Normal) / 15s (Hard) | Always hostile (monster) | None | Only from spawner in mineshafts; 0.5×0.5 fits in gaps |
| Enderman | 40 (20♥) | 7 (Easy) / 10 / 15 (Hard) | Looked at face (eye-to-eye within 64 blocks), or hit | None | Teleports when shot at, on water damage, on fire; becomes passive in rain; takes 2× damage from water; can pick up certain blocks |
| Polar Bear | 30 (15♥) | 4 (Easy) / 6 / 7 (Hard) | Approaching cub, or hit | None | Ice/snow biomes; cubs cannot be bred; parents attack |
| Panda (aggressive) | 20 | 6 | Hit, or has lazy/aggressive personality near hit | None | Same hitbox as pandas; aggressive panda attacks player even if not hit when nearby panda hurt |
| Llama | 15-30 | 1 (spit) | Hit | None (use lead to follow) | Spits at wolves; caravan with lead |
| Trader Llama | 20 | 1 (spit) | Hit | None | |
| Dolphin | 10 | 1 (slap) | Hit → calls nearby dolphins | None | |
| Bee | 10 | 2 (+ Poison I 10s on Hard) | Hit, or hive/nest is broken/harvested without campfire | None | Dies 60s after stinging |
| Iron Golem (player-built) | 100 | 7-21 | Hit by player | None | Player-built golems never attack their builder; village golems attack hostile mobs and players with low village reputation |
| Piglin | 16 (8♥) | 5-13 (varies; uses golden sword) | Player not wearing gold armor in Nether; or attacking piglin | None | Barter with gold ingot; hunt hoglins; afraid of soul fire, zombified piglins |
| Piglin Brute | 50 (25♥) | 7-19 | Always hostile to player | None | 1.16.2+; no barter; in bastion; converts to zombified piglin (loses brute status) in overworld |
| Hoglin | 40 (20♥) | 2-12 (attack-lift varies) | Within 16 blocks, attacks player (no provocation) — technically hostile, but immune to knockback & can be bred | Breed with crimson fungi | Repelled by warped fungi; "retreat" behavior; converts to zoglin in overworld after 15s |
| Zoglin | 40 | 2-12 | Always hostile | None | Created when hoglin leaves the Nether |
| Zombified Piglin | 20 (10♥) | 5-17 (Easy 5, Normal 8, Hard 12, plus 1 per reinforcement) | Hit (any) → entire pack within 32 blocks aggros | None | Spawns in Nether (any light) and when pig leaves Nether |
| Goat | 10 | 1-3 (ram) | Hit, or random long-charge at standing-still entities | None | Some "screaming" goats are more aggressive |
| Fox (if attacked) | 10 | 2 (rare) | Hit | Trust via breeding | Usually flees |

---

## 5. Hostile Mobs

### 5.1 Overworld Hostile Mobs

| Mob | Health | Damage (Easy/Normal/Hard) | Spawn Conditions | Drops | XP | Notes |
|---|---|---|---|---|---|---|
| Zombie | 20 (10♥) | 3/4/6 (melee) | Light 0; overworld; on solid block | Rotten Flesh 0-2; rare iron ingot/carrot/potato, iron sword/shovel/helmet/chestplate/boots (with chance on Hard) | 5 | Can break wooden doors (Hard); summons reinforcement on hit (Hard); burns in sun |
| Husk | 20 | 3/4/6 + Hunger 5s (Normal) / 11s (Hard) on hit | Desert surface, light 0 | Rotten Flesh 0-2 | 5 | Doesn't burn in sun; converts to zombie (then drowned) when submerged |
| Drowned | 20 (10♥) | 3/4/6 melee; trident 7/9/13 ranged | Ocean/River water (any light) or beaches at night | Rotten Flesh 0-2; Nautilus Shell 0-1 (3% chance, 8% on drowned with shell in hand); Copper Ingot 0-1 (11%); Fishing Rod 0-1 (3%); Trident 0-1 (8.5% with looting III 11.5%); on drowned with trident, drops trident | 5 | Holds trident/fishing rod; can swim; converts from zombie when submerged 30s |
| Skeleton | 20 (10♥) | Bow 1-4 (Easy) / 1-4 / 1-5 (Hard) | Light 0, overworld | Arrow 0-2; Bone 0-2; Bow 1 (8.5%) | 5 | Burns in daylight; can pick up items; spawns with armor in some structures |
| Stray | 20 (10♥) | Bow 1-4 + Slowness I 30s (arrow) | Snow biomes (light 0) | Arrow 0-2; Bone 0-2; Arrow of Slowness 0-1 (50% on Hard) | 5 | Burns in daylight |
| Bogged | 16 (8♥) | Bow 2-4 + Poison I 5s (Normal) / Poison II 5s (Hard) | Trial Chambers spawners; Swamp/Mangrove Swamp surface (light 0) 1.21 | Arrow 0-2; Bone 0-2; Arrow of Poison 0-1 (50% Hard) | 5 | 1.21; burns in daylight; can be sheared for 2 mushrooms; half the HP of skeleton |
| Creeper | 20 (10♥) | Explosion: 49 (Easy close-range) / 49 / 65 (Hard) | Light 0, overworld | Gunpowder 0-2; Music Disc (when killed by skeleton/stray arrow) | 5 | Sneaks up; 1.5s fuse (1.2s ignited by flint/steel); explosion power 3 (charged creeper 6); flees ocelots/cats 6 blocks; can be ignited by flint/steel or fire aspect |
| Spider | 16 (8♥) | 2 | Light 0 (monster) or any (passive, only if spawned with PersistenceRequired); on solid block | String 0-2; Spider Eye 0-1 (33%) | 5 | Climbs walls; can spawn with skeleton rider (1% in nether fortress wither skeleton room, spider spawner, etc.); day-spawned spiders are passive |
| Cave Spider | 12 (6♥) | 2 + Poison | Mineshaft spawner only | String 0-2; Spider Eye 0-1 | 5 | Fits 0.5 gaps; poison bypasses armor |
| Witch | 26 (13♥) | Splash potions: Poison, Slowness, Weakness, Harming | In witch huts (any light, only at Y 58-67), or 25% chance to spawn in place of villager when struck by lightning | Sugar 0-2; Redstone 0-2; Glowstone Dust 0-2; Gunpowder 0-2; Spider Eye 0-2; Glass Bottle 0-2; Potion of Healing 1 (8.5%); Potion of Fire Resistance 1 (8.5%); Potion of Swiftness 1 (8.5%); Potion of Water Breathing 1 (8.5%) | 5 | Drinks healing/regeneration/fire resistance/swiftness/water breathing at low HP or in hazard |
| Slime (Large) | 25 (12.5♥) | 4 | Swamp surface (light ≤ 7, moon phase matters) or any chunk below Y=40 | Slimeball 0-2 (only from smallest) | 1-4 (size-based) | Splits into 2-4 of next size down when killed (large→medium→small); damage on contact only when target moving |
| Slime (Medium) | 4 (2♥) | 2 | (split from large) | (same) | | |
| Slime (Small) | 1 (0.5♥) | 0 | (split from medium) | Slimeball 0-2 | | |
| Silverfish | 8 (4♥) | 1 | Stronghold, igloo basement, extreme hills infested blocks; or end portal room spawner | None | 5 | Awakens nearby infested stone blocks when hit; can't drop |
| Guardian | 30 (15♥) | 4 (Easy melee) / 6 / 9 (Hard); 6 laser (any) | Ocean monuments (water) | Prismarine Shard 0-2; Prismarine Crystals 0-2; Raw Cod 0-1 (2.5%); Fish (random, 2.5%) | 10 | Spikes damage 2 when contact; laser needs 1-3s charge (line-of-sight) |
| Elder Guardian | 80 (40♥) | 5-9 (spikes 2 + Mining Fatigue III 5min on hit) | 3 per ocean monument (boss-tier) | Prismarine Shard 0-2; Prismarine Crystals 0-2; Raw Cod 0-1; Tide Armor Trim Smithing Template (20%); Wet Sponge 1 | 10 | Spawns in monument; inflicts Mining Fatigue III every 60s within 50 blocks; |
| Pillager | 24 (12♥) | Crossbow 5-9 (Easy 5, Normal 7, Hard 9 if point-blank; less with distance) | Outpost patrols; raids; anywhere at night light 0 | Crossbow (8.5%); Arrow 0-2; Emerald 0-1 (1%); Iron Axe 0-1 | 5 + raid bonus | Crossbow with Piercing I or Multishot occasionally; spawns with banner on patrols |
| Vindicator | 24 (12♥) | 13/13/13 melee (axe disables shield) | Woodland Mansions; raids | Emerald 0-1 (10%); Iron Axe 0-1 (10%) | 5 + raid bonus | "Johnny" nametag → attacks all non-illagers; sprint-speed 1.4× when targeting |
| Evoker | 24 (12♥) | Fangs 6 (any difficulty; bypasses armor) | Woodland Mansions; raids Wave 5+ | Totem of Undying 1; Emerald 0-1 (10%); Evil villager banner? | 10 + raid | Summons 3 vexes (capped at 8); fang attack pattern in line or ring |
| Vex | 14 (7♥) | 3-5 (Easy 3, Normal 4, Hard 5) | Summoned by evoker | None | 3 | Flies through walls; iron sword; dies after 33-108s if not killed |
| Ravager | 100 (50♥) | 7 melee / 12 roar / 18 charge | Raids Wave 3/5/6+ | Saddle 1 | 20 | 50% HP disables shields on hit; roar knocks back allies and nearby mobs; stun 2s when hitting shield; can destroy crops/leaves (not pumpkin/melon stems) |
| Phantom | 6 (3♥) | 2 + 3 (swoop) | Player hasn't slept in 3+ days, spawns above player at night in overworld | Phantom Membrane 0-1 (50% w/ Looting III = 75%) | 5 + 3 per night | Burns in daylight; swoops in waves; insomnia mechanic |
| Bogged (already above) | 16 | Bow + Poison | 1.21 | | 5 | |

### 5.2 Nether Hostile Mobs

| Mob | Health | Damage | Spawn Conditions | Drops | XP | Notes |
|---|---|---|---|---|---|---|
| Blaze | 20 (10♥) | 6 melee; fireball 5 + fire 5s | Nether Fortress spawner | Blaze Rod 0-1 | 10 | Flies short hover; immune to fire/lava; shoots 3-burst fireballs at range |
| Magma Cube (Large) | 25 (12.5♥) | 6 | Nether any light (anywhere in Nether Wastees, Basalt Deltas high rate) | Magma Cream 0-1 (large/medium only) | 1-4 | Splits like slime; immune to fire/lava; doesn't take fall damage |
| Magma Cube (Medium) | 4 (2♥) | 4 | (split) | (same) | | |
| Magma Cube (Small) | 1 | 2 + fire 5s contact | (split) | Magma Cream 0-1 | | |
| Ghast | 10 (5♥) | Fireball explosion 17 (Easy) / 17 / 17 (Hard) (point-blank 9 + fire) | Nether any light, in air over lava lakes | Gunpowder 0-2; Ghast Tear 0-1 | 5 | 4-block eyes; 100-block sight range; shoots fireball player can punch back |
| Wither Skeleton | 20 (10♥) | 5-7 + Wither II 10s (any difficulty) | Nether Fortress light ≤ 7 | Coal 0-1; Bone 0-2; Stone Sword 8.5%; Wither Skeleton Skull 1 (2.5%, +1% per looting) | 5 | 2.4-tall; immune to fire; spawns in groups of 1-5 |
| Zombified Piglin (neutral) | 20 | 5-17 + pack | Nether any light | Rotten Flesh 0-1; Gold Nugget 0-1; Gold Ingot 0-1 (2.5%); Gold Sword 8.5% | 5 | See §4 |
| Hoglin (neutral/hostile) | 40 | 2-12 | Crimson Forest | Raw Porkchop 2-4 (cooked if fire) | 1-3 + 1-3 per player kill | Breedable; converts to zoglin |
| Piglin (neutral) | 16 | 5-13 | Crimson Forest / Nether Wastes / Bastion | Gold Sword 8.5%; Gold Ingot, etc. (drops what they picked up) | 5 + barter | See §4 and §14 |
| Piglin Brute (neutral/hostile) | 50 | 7-19 | Bastion only | None natively (drops axe) | 20 | 1.16.2+ |
| Zoglin | 40 | 2-12 | (created) | Rotten Flesh 1-3 | 5 | |
| Strider (passive, listed) | 20 | 0 | Lava lakes | String | 1-2 | |

### 5.3 End Hostile Mobs

| Mob | Health | Damage | Spawn Conditions | Drops | XP | Notes |
|---|---|---|---|---|---|---|
| Enderman | 40 (20♥) | 7/10/15 | End (any light); Overworld/Nether dark; spawns in groups in End | Ender Pearl 0-1 | 5 | Teleports up to 32 blocks (16-tick cooldown); water damages 1 ♥/sec; takes 2× from water |
| Shulker | 30 (15♥) | 4 (Easy) / 4 / 5 bullet + Levitation 10s | End City / End Ship | Shulker Shell 0-1 (50%, +6.25% per looting level) | 5 | Hides in shell (armor 20 closed, 0 open); bullet follows target; sometimes clones to nearby blocks |
| Endermite | 8 (4♥) | 2 | 5% chance when ender pearl lands | None | 3 | Despawns after 2 minutes (despite PersistenceRequired); endermen attack on sight |

### 5.4 1.21+ New Hostile Mobs

| Mob | Health | Damage | Spawn | Drops | XP | Notes |
|---|---|---|---|---|---|---|
| Breeze | 30 (15♥) | 2-13 (melee 2-4 Easy/Normal/Hard; wind charge direct 2 + knockback; wind charge AoE 4 + knockback) | Trial Chambers (1.21) | 1-2 Wind Charges; Breeze Rod 1-4 (10% per looting level) | 5 | 1.21; jumps around like a parkour master; wind charge attack pushes player and breaks non-solid blocks (buttons, levers, doors can be opened); wind charge leaves a 1-tick wind burst that launches entities |
| Bogged (already listed in overworld) | 16 | 2-4 + Poison | Trial Chambers / Swamp | | 5 | |

### 5.5 Hostile Boss-Tier Mobs (see §6)

Ender Dragon (200 ♥), Wither (300 ♥), Warden (250 ♥ technically not boss).

---

## 6. Boss Mobs

### 6.1 Ender Dragon (`minecraft:ender_dragon`)

- **Health:** 200 (100♥) on Java; regenerates 1 ♥/tick if connected to an End Crystal
- **Hitbox:** 16.0 × 8.0
- **Damage:**
  - Head contact: 6 (Easy) / 10 / 15 (Hard)
  - Body/Wing contact: 4 / 7 / 10 (Hard)
  - Dragon Fireball: lingering purple AoE cloud — 3 ♥/sec for 4 sec on Normal
  - Wing buffet knockback: launches player ~5 blocks
- **Spawn:** One per End dimension; respawns by placing 4 End Crystals on the exit portal's bedrock pillars (each in correct orientation)
- **Fight mechanics:**
  - 10 End Crystals (on obsidian pillars) heal dragon for 1♥/tick when within line of sight
  - Crystals destroyed by bow shot or climbing + melee
  - Dragon has 4 attack patterns: strafe (fireball), perch (lands on portal, releases dragon breath), charge (dives at player), flap (wing buffet in center)
  - **Perch phase:** exposes head — 4× damage from arrows/head melees
  - **Weakness:** Arrow to mouth during breath attack = 10× damage (instant kill per arrow on Easy)
  - **Drops:** 12,000 XP (single drop, splits to 500 XP orbs of 24), End portal opens, dragon egg spawns on top of exit portal
  - **Respawn:** End Crystals re-summon; XP only first kill; egg only first kill
  - **Death animation:** rises into air, beams of light, explodes into XP orbs
- **Phases:**
  1. **Holding Pattern** — circles End at high altitude
  2. **Strafe** — shoots dragon fireball at player
  3. **Perch** — flies to portal, lands; calls dragon breath attack (purple cloud)
  4. **Charge** — dives at player; if shielded, deals 2 ♥ knockback
  5. **Flap** — hovers low over portal, buffeting nearby players

### 6.2 Wither (`minecraft:wither`)

- **Health:** 300 (150♥) — first phase, 150 (75♥) second phase armor regen
- **Hitbox:** 0.9 × 3.5
- **Summoning:** Place 4 soul sand in T-shape, then 3 wither skeleton skulls on top → consume skulls, explosion (no block damage on Java, only entity damage), spawns wither
- **Damage:**
  - Wither Skull (blue): 12 (Easy) / 12 / 12 (Hard) — creates explosion (power 1)
  - Wither Skull (black): 5 (Easy) / 8 / 12 (Hard) — fire explosion (power 1)
  - Wither II effect for 10s on any wither skull hit
  - Contact dash: 3-12 melee
- **Fight mechanics:**
  - **Phase 1 (above half HP):** flies, shoots skulls at living entities (including passive mobs)
  - **Armor break (50% HP):** armor shatters; gains Wither II aura; flies toward target on ground; immune to arrows (deflects)
  - **Regen:** +1 ♥/sec continuously
  - **Block destruction:** destroys any block except bedrock, obsidian, end portal frames, reinforced deepslate, command blocks, barriers, jigsaw, structure blocks
  - **Drops:** Nether Star 1; 50 XP
- **Death animation:** rises, explodes (no block damage)

### 6.3 Warden (`minecraft:warden`) — "technically not a boss"

- **Health:** 250 (125♥)
- **Hitbox:** 0.9 × 2.9
- **Damage:**
  - Melee: 16 (Easy) / 30 / 45 (Hard) — highest of any mob; bypasses shield
  - Sonic boom: 6 (Easy) / 10 / 15 (Hard) — 20-block range, ignores armor & obstacles
- **Emergence:** Spawns when Sculk Shrieker is triggered 4× within 10 min (in Deep Dark); rises from ground over ~7s; despawns after 60s without a target
- **Behavior:**
  - Uses vibration sensing (8 blocks/tick) and smell (6-block instant sense)
  - Charges anger on entities it hears: per vibration adds 35 anger; per smell (target visible within 6 blocks) adds 100 anger; 6 anger/sec decay
  - At 80+ anger: attacks target with melee
  - At 100+ anger + unreachable target: fires sonic boom (every 2-3s, 5s cooldown)
  - Smells even when player is sneaking or invisible
  - Immune to fire/lava/drowning/fall/knockback
  - Cannot be killed by fall damage or other mobs (immune to non-player melee from most sources)
  - **Does not drop loot** (player is expected to flee; design intent)
  - Drops: 1 Sculk Catalyst (1.19+)
  - XP: 5
- **No designated "boss bar"** but the only fight-avoidance boss in vanilla

---

## 7. Tamable Mobs

### 7.1 Wolf (`minecraft:wolf`)

- **Taming:** Feed bones (1-7 average 2). On success, hearts spawn, collar appears (default red).
- **Stats post-tame:** Health 20 (10♥) up from 8 (4♥) wild.
- **Behavior:**
  - `SitWhenOrderedToGoal` (priority 0): sits when player right-clicks
  - `FollowOwnerGoal` (priority 1): walks within 10 blocks; teleport to owner if >12 blocks away
  - `MeleeAttackGoal` (priority 3): attacks whatever the owner attacks or whatever attacks the owner
  - `OwnerHurtByTargetGoal` / `OwnerHurtTargetGoal`
- **Healing:** Any meat food (raw/cooked); heals 1-8 HP per item
- **Breeding:** Any meat; puppies inherit stats from parents with some randomization
- **Collar color:** Any of 16 dyes
- **1.21+ Wolf Armor:** Armadillo Scute ×6 crafts armor that absorbs damage; degrades (visual cracks at 33%/66%/100% damage taken), can be repaired with scute; cannot be damaged by thorns/cactus/etc while wearing

### 7.2 Cat (`minecraft:cat`)

- **Taming:** Feed raw cod or raw salmon (1-3 tries). On success, hearts, sits on player.
- **11 vanilla types** (plus Black for swamp hut): `tabby`, `black`, `red`, `siamese`, `british_shorthair`, `calico`, `persian`, `ragdoll`, `white`, `jellie`, `all_black`
- **Behavior:**
  - Sits when ordered; follows when standing
  - Sleeps on beds (in their owner's house) when not following
  - Morning gift: 7% chance to drop a gift next to a sleeping cat's owner — `rabbit's_foot`, `rabbit_hide`, `string`, `rotten_flesh`, `feather`, `raw_chicken`, `phantom_membrane` (rare)
  - Creepers avoid cats within 6 blocks; phantoms too
- **Breeding:** Cod/salmon; kittens inherit pattern from parent

### 7.3 Parrot (`minecraft:parrot`)

- **Taming:** Feed any seed (wheat seeds, melon, pumpkin, beetroot, torchflower). 33% chance per seed.
- **5 colors:** red, blue, green, cyan, gray
- **Behavior:**
  - Sits on shoulder when player walks through it (perched)
  - Right-click to dismount shoulder
  - Imitates sounds of nearby hostile mobs at random intervals (with their pitch shifted)
  - Cookies poison parrots (4-7 damage, kills at low HP)
- **Cannot breed**

### 7.4 Horse, Donkey, Mule

- **Taming:** Right-click to mount; bucks player off 0-20 times before allowing saddle. Each attempt: temper +5 to +10 (random); when temper > max temper (initialized 0-99), tamed.
- **Saddle required** to ride and steer.
- **Horse stats** (genetic, inherit roughly from parents with mutation):
  - Health: 15-30 (random; inherited ±13 HP mutation)
  - Speed: 4.74-14.23 blocks/sec (genetic, 0.1125-0.3375 attribute)
  - Jump strength: 1.0-5.5 blocks cleared (0.4-1.0 jump strength attribute)
- **Donkeys/Mules:** Always have same 15-30 HP; speed 7.5-8 blocks/sec; can be chested (15 slots)
- **Breeding:** Golden apple or golden carrot; creates baby; cooldown 5 min
- **Skeleton/Zombie horse:** Cannot be bred; saddled but tamed by default

### 7.5 Llama / Trader Llama

- **Taming:** Mount repeatedly (high temper). Once tamed, can be equipped with chest (strength 1-5: 3/6/9/12/15 slots).
- **Caravan:** Lead one llama → up to 9 nearby llamas follow in single file.
- **Breeding:** Hay bales; babies inherit strength with mutation.
- **Spit attack:** 1 ♥; shoots wolves and any entity that hits them.
- **Trader llama:** Leashed to wandering trader; same mechanics.

### 7.6 Fox (limited)

- **Taming:** Cannot truly be tamed; breeding two foxes with sweet berries produces a baby that trusts the player (and doesn't flee from them). The baby's parents flee.
- **Behavior:** Holds items in mouth; uses sword/effect items; hunts chickens, rabbits, fish (jumps into snow); sleeps at day in taiga.

### 7.7 Allay

- **Taming:** Give an allay an item → it flies around collecting all matching items (by item type, not stack) and delivers them to the player or a note block.
- **Duplicating:** Give an allay an amethyst shard while it's dancing (when a nearby jukebox is playing) → spawns a new allay with 2.5-min cooldown.
- **No breeding, no traditional taming.** The allay follows whoever last gave it an item; if that player leaves, it goes to nearest note block to deliver.

---

## 8. Villager System

### 8.1 Villager Base Stats

- **Health:** 20 (10♥)
- **Speed:** 0.5 (in village), 0.4 (idle), 0.6 (panic)
- **Hitbox:** 0.6 × 1.95 (baby 0.3 × 0.975)
- **Drops:** None native (no items on death)
- **Spawn:** Naturally in villages; from curing zombie villagers

### 8.2 Villager Types (Professions)

13 professions + 1 unemployed + 1 nitwit. Profession is determined by claiming a workstation (POI of type corresponding to the profession):

| Profession | Workstation Block | Max Trade Tiers |
|---|---|---|
| Armorer | Blast Furnace | 5 |
| Butcher | Smoker | 5 |
| Cartographer | Cartography Table | 5 |
| Cleric | Brewing Stand | 5 |
| Farmer | Composter | 5 |
| Fisherman | Barrel | 5 |
| Fletcher | Fletching Table | 5 |
| Leatherworker | Cauldron | 5 |
| Librarian | Lectern | 5 |
| Mason | Stonecutter | 5 |
| Shepherd | Loom | 5 |
| Toolsmith | Smithing Table | 5 |
| Weaponsmith | Grindstone | 5 |
| Nitwit | None | 0 (no trades) |
| Unemployed | None (until workstation claimed) | 0 |

### 8.3 Trade Tiers

Each villager has 5 trade tiers; trades unlock progressively as the player trades enough to fill the experience bar:

| Tier | Name | XP Threshold | Trades Unlocked |
|---|---|---|---|
| 1 | Novice | 0 | 2 trades |
| 2 | Apprentice | 10 | 2 trades |
| 3 | Journeyman | 70 | 2 trades |
| 4 | Expert | 150 | 2 trades |
| 5 | Master | 250 | 2-4 trades (varies) |

Each trade has its own XP and stock; stock replenishes on `restock` (every 2 in-game hours if villager can reach workstation). Villagers gain 2 XP per trade, which compounds toward leveling.

### 8.4 Trade Tables (Examples by Profession)

Tier 1 trades are 2 per villager, randomly drawn from a weighted table. Below are common examples:

**Armorer** (sells armor):

| Tier | Trade | Price (emeralds) | Demand/Price lock |
|---|---|---|---|
| 1 | 12 coal → 1 emerald | — | 16 max stock |
| 1 | 5 emeralds → iron boots | 5 | 12 |
| 1 | 9 emeralds → iron leggings | 9 | 12 |
| 2 | 4 emeralds → bell | 4 | 12 |
| 2 | 5 emeralds → iron chestplate | 5 | 12 |
| 3 | 7 emeralds → chainmail boots | 7 | 12 |
| 3 | 9-11 emeralds → chainmail leggings | 9-11 | 12 |
| 4 | 12-15 emeralds → enchanted diamond leggings | 12-15 | 3 |
| 4 | 16-19 emeralds → enchanted diamond chestplate | 16-19 | 3 |
| 5 | 13 emeralds → diamond helmet | 13 | 3 |

**Butcher** (sells cooked food):

| Tier | Trade | Price |
|---|---|---|
| 1 | 7 raw chicken → 1 emerald | — |
| 1 | 7 raw porkchop → 1 emerald | — |
| 1 | 14 raw rabbit → 1 emerald | — |
| 1 | 2 emeralds → 5 cooked chicken | 2 |
| 2 | 4 emeralds → cooked porkchop (5) | 4 |
| 3 | 1 emerald → cooked mutton ×? | 1 |
| 4 | 16 sweet berries → 1 emerald | — |
| 4 | 7 emeralds → rabbit stew ×1 | 7 |
| 5 | Dried kelp blocks | — |

**Cartographer** (sells maps & banners):

| Tier | Trade |
|---|---|
| 1 | 20 paper → 1 emerald; 7 emeralds + 1 compass → ocean explorer map |
| 2 | 11 glass panes (any) → 1 emerald; 13 emeralds + compass → woodland explorer map |
| 3 | 13 emeralds + 1 compass → trial chambers map (1.21) |
| 4 | 7 emeralds → banner pattern (any); 8 emeralds → globe banner pattern |
| 5 | 14 emeralds → banner pattern (1.21+ new) |

**Cleric** (sells magical items):

| Tier | Trade |
|---|---|
| 1 | 3 gold ingots → 1 emerald; 4 emeralds → redstone (2) |
| 2 | 1 emerald → lapis lazuli (1-3); 1 emerald → glowstone (1) |
| 3 | 4 emeralds → bottle o' enchanting |
| 4 | 5 emeralds → ender pearl (1) |
| 5 | 3 emeralds → experience bottle ×3 (some); 64 netherrack → 1 emerald |

**Farmer** (sells crops):

| Tier | Trade |
|---|---|
| 1 | 20 wheat → 1 emerald; 1 emerald → bread (6) |
| 1 | 22 carrots → 1 emerald; 1 emerald → 16 carrots |
| 1 | 22 potatoes → 1 emerald; 1 emerald → 16 potatoes |
| 1 | 22 beetroot → 1 emerald; 1 emerald → 16 beetroot |
| 2 | 15 emeralds → suspicious stew (saturation effect, 7s) |
| 2 | 4 emeralds → 16 cookies |
| 3 | 3 emeralds → shears; 3 emeralds → 16 cookies / pumpkin pie ×1 |
| 4 | 1 emerald → cake; 1-3 emeralds → golden carrot ×3 |
| 5 | 3 emeralds → glistering melon slice ×3; 3 emeralds → cake; emerald → 4 sweet berries |

**Fisherman** (sells fish):

| Tier | Trade |
|---|---|
| 1 | 10 string → 1 emerald; 6 raw cod → 1 emerald; 1 emerald → cooked cod (6) |
| 1 | 6 raw salmon → 1 emerald; 1 emerald → cooked salmon (6) |
| 2 | 2 emeralds → campfire ×1; 2 emeralds → fishing rod (unenchanted) |
| 3 | 8-22 emeralds → enchanted fishing rod |
| 4 | 2-3 emeralds → bucket of cod |
| 5 | 4 emeralds → enchanted fishing rod (better enchant) |

**Fletcher** (sells arrows/bows):

| Tier | Trade |
|---|---|
| 1 | 32 stick → 1 emerald; 1 emerald → 16 arrow |
| 1 | 16 gravel → 1 emerald; 1 emerald → 16 flint |
| 2 | 1 emerald → bow; 26 flint → 1 emerald |
| 3 | 2-3 emeralds → 16 arrow; 8 emeralds → crossbow |
| 4 | 7-21 emeralds + 16 arrow → 5 tipped arrow (any potion) |
| 5 | 2 emeralds → 5 spectral arrows; 1 emerald → 12 arrow (special) |

**Leatherworker** (sells leather armor):

| Tier | Trade |
|---|---|
| 1 | 6 emeralds → leather cap; 12 emerald → leather pants |
| 2 | 7 emeralds → leather tunic; 3 emerald → leather boots |
| 3 | 6 emeralds + 2 rabbit hide → rabbit hide ×4? |
| 3 | 7 emeralds → saddle ×1 |
| 4 | 6 emeralds + 1 leather cap → dyed leather cap (random color) |
| 5 | 5 emeralds → leather horse armor |

**Librarian** (sells books/enchanted books):

| Tier | Trade |
|---|---|
| 1 | 24 paper → 1 emerald; 9 emeralds → bookshelf; 5-64 emerald + book → enchanted book (random tier 1 enchant) |
| 2 | 1 emerald → lantern; 1 book → 1 emerald |
| 3 | 4 emeralds → book ×?; 5-22 emerald + book → enchanted book (tier 2) |
| 4 | 5 emerald → 4 experience bottle ×1; 36-64 emerald + book → enchanted book (tier 3) |
| 5 | 20 emerald → name tag; 5-64 emerald + book → enchanted book (tier 4-5); 5 emerald → glass ×4 |

**Mason** (sells bricks/polished stone):

| Tier | Trade |
|---|---|
| 1 | 10 clay → 1 emerald; 1 emerald → 10 brick |
| 2 | 1 emerald → 4 polished andesite; chiseled stone bricks |
| 3 | 1 emerald → 4 polished diorite / granite / dripstone |
| 4 | 1 emerald → 16 quartz; 1 emerald → 16 red sand |
| 5 | 1 emerald → 1 glazed terracotta (random color) |

**Shepherd** (sells wool & banners):

| Tier | Trade |
|---|---|
| 1 | 18 wool → 1 emerald; 2 emerald → 1 shears |
| 1 | 1 emerald → 1 wool (any color) |
| 2 | 1 emerald → 1 dyeable banner; 1 emerald → 1 carpet (any color) |
| 3 | 1 emerald → 1 banner pattern; 1 emerald → 1 bed (any color) |
| 4 | 1 emerald → 1 painting; 2 emerald → 1 painted banner |
| 5 | 3 emerald → 1 banner pattern (custom 1.21 patterns) |

**Toolsmith** (sells tools):

| Tier | Trade |
|---|---|
| 1 | 1 emerald → 16 coal; 1 emerald → stone tools |
| 2 | 4 emerald → enchanted iron pickaxe |
| 3 | 7-11 emerald → enchanted iron shovel / axe / hoe |
| 4 | 9 emerald → diamond pickaxe; 12-15 emerald → enchanted diamond pickaxe |
| 5 | 13 emerald → enchanted diamond shovel; 13 emerald → enchanted diamond axe |

**Weaponsmith** (sells weapons):

| Tier | Trade |
|---|---|
| 1 | 1 emerald → 16 coal; 2 emerald → iron axe |
| 2 | 1 emerald → 1 bell |
| 2 | 3 emerald → enchanted iron sword |
| 3 | 7-21 emerald → enchanted iron sword (better enchant) |
| 4 | 13-26 emerald → enchanted diamond axe |
| 5 | 13-26 emerald → enchanted diamond sword |

### 8.5 Gossip System

Villagers remember player actions and spread gossip about players. Five gossip types:

| Gossip Type | Value Per | Decay Rate |
|---|---|---|
| `MAJOR_POSITIVE` (cured zombie villager) | 20 | Decay 1 / 100 ticks |
| `MINOR_POSITIVE` (trading with villager) | 1 | Decay 1 / 100 ticks |
| `MAJOR_NEGATIVE` (attacked villager) | -20 | Decay 1 / 100 ticks |
| `MINOR_NEGATIVE` (attacked villager) | -1 | Decay 1 / 100 ticks |
| `TRADING` (trading) | 1 (similar to minor positive) | Decay 1 / 100 ticks |

Villagers share gossip at meeting points (bell, gathering). Reputation affects:

- **Iron Golem spawn rate** (high reputation → spawns defensive golems)
- **Trade price discounts/surcharges** — price modifier = `1 - (gossipValue / 100)`, clamped 0.05 to 1.0
- **Golem aggression** — at reputation < -100, village golems attack the player

### 8.6 Breeding

- **Trigger:** Player throws food at 2 villagers; they pick up & eat if hungry
- **Required food:** 3 bread / 12 carrots / 12 potatoes / 12 beetroots per villager
- **Willingness:** Villagers only breed if they have 24 food (stacking bread=4×3=12 food units, etc.) in inventory
- **Cooldown:** 5 minutes between breedings per villager
- **Baby:** Grows up in 20 minutes (or 10 with speed-boost via feeding — gives back willingness)
- **Profession inheritance:** Baby becomes unemployed → claims workstation when adult

### 8.7 Zombie Villager Curing

- Spawn: 5% chance zombie spawns as zombie villager (varies by difficulty)
- Cure: throw Splash Potion of Weakness, then feed Golden Apple; takes 2-5 minutes
- Cured villager gets `MAJOR_POSITIVE` gossip with the curer (significant discount)
- During cure: gains Regeneration I (Strength I in 1.20+ for balancing)

### 8.8 Behavior Schedule (Brain-based)

| Time | Activity |
|---|---|
| 06:00–10:00 | WORK (go to claimed workstation, do job) |
| 10:00–14:00 | WORK / MEET (gather at bell) |
| 14:00–18:00 | WORK |
| 18:00–20:00 | MEET (gather) |
| 20:00–22:00 | PREPARE_FOR_NIGHT |
| 22:00–06:00 | REST (sleep in claimed bed) |
| Always | IDLE if no activity matches |
| During raid | HIDE (run to beds, do not work) |
| When hit | PANIC (run, may give iron golem alert) |

### 8.9 POI (Point of Interest) System

POIs are special block positions stored in a server-side registry. Used for:

- Workstations (claimed by villagers)
- Beds (claimed by villagers)
- Bells (meeting points)
- Bee nests/hives (bee homes)
- Nether portals (validation)
- Lodestone (compass target)
- Lightning rods (during storms)

POI has a type, position, and "occupied" count. Villagers claim POIs by writing to memory `JOB_SITE` or `HOME`.

---

## 9. Other Entities (non-mob)

Non-mob entities are objects without AI (some have minimal logic). All share the base `Entity` class but skip `Mob` / `LivingEntity` extensions.

### 9.1 Projectiles

| Entity | ID | Hitbox | Damage | Notes |
|---|---|---|---|---|
| Arrow | `minecraft:arrow` | 0.5 cube | Bow damage (1-10) | Sticks in block, recoverable |
| Spectral Arrow | `minecraft:spectral_arrow` | 0.5 | Same + Glowing 10s | Trail of gold particles |
| Tipped Arrow | `minecraft:arrow` (with Potion tag) | 0.5 | Same + potion effect | Inherits arrow + tip potion |
| Snowball | `minecraft:snowball` | 0.25 | 0 (3 ♥ to blaze) | Knockback only |
| Egg | `minecraft:egg` | 0.25 | 0 | 1/8 chance to spawn chicken on break |
| Ender Pearl | `minecraft:ender_pearl` | 0.25 | 0 + teleport + 5 ♥ fall-damage to thrower | Despawns on contact with end gateway |
| Eye of Ender | `minecraft:eye_of_ender` | 0.25 | 0 | Floats toward stronghold, drops 1/5 chance |
| Fireball (Ghast) | `minecraft:fireball` | 1.0 cube | Explosion 1 + fire 5s | Player can punch back |
| Small Fireball (Blaze) | `minecraft:small_fireball` | 0.3125 | 5 + fire 5s | |
| Dragon Fireball | `minecraft:dragon_fireball` | 1.0 | Lingering Dragon Breath cloud | Splash, not block damage |
| Wither Skull | `minecraft:wither_skull` | 0.3125 | Explosion + Wither II 10s | Black skull power 1; blue skull power 1 destroys obsidian-adjacent blocks |
| Trident | `minecraft:trident` | 0.5 | Trident melee + Loyalty/Riptide/Channeling | Sticks in ground, returns with Loyalty |
| Llama Spit | `minecraft:llama_spit` | 0.25 | 1 ♥ | |
| Shulker Bullet | `minecraft:shulker_bullet` | 0.3125 | 4 + Levitation 10s | Homing |
| Wind Charge (player) | `minecraft:wind_charge` | 0.3125 | 1 ♥ + 7-block wind-burst knockback (launches entities); breaks non-solid blocks (levers, buttons, doors toggled) | 1.21 |
| Wind Charge (Breeze) | `minecraft:wind_charge` | 0.3125 | Same as above | |
| Firework Rocket | `minecraft:firework_rocket` | 0.25 | Explosion (varies by firework star) | Used for Elytra boost (2 seconds × flight duration) |
| Fishing Bobber | `minecraft:fishing_bobber` | 0.25 | 0 | Player fishing hook |

### 9.2 Vehicles

| Entity | ID | Capacity | Notes |
|---|---|---|---|
| Boat (all wood types) | `minecraft:boat` | 2 (1 in 1.21; was 2 historically — currently 2 riders as of 1.21.2: front + back) | Sinks after 1 sec without momentum; can carry mob |
| Boat with Chest | `minecraft:chest_boat` | 2 + 27-slot inventory | |
| Minecart | `minecraft:minecart` | 1 | Top speed 8 b/s on rails; derails on sharp turn at high speed |
| Chest Minecart | `minecraft:chest_minecart` | 1 + 27 slots | |
| Hopper Minecart | `minecraft:hopper_minecart` | 1 + 5 slots | Picks up items passing over |
| Furnace Minecart | `minecraft:furnace_minecart` | 1 + 0 | Powered by fuel; pushes other carts |
| TNT Minecart | `minecraft:tnt_minecart` | 1 | Explodes on impact (rail), or activator rail |
| Spawner Minecart | `minecraft:spawner_minecart` | 1 | Spawns mob of stored type |
| Command Block Minecart | `minecraft:commandblock_minecart` | 1 | Runs command every tick |
| Hopper Minecart (re-listed) | | | |

### 9.3 World Effect Entities

| Entity | ID | Notes |
|---|---|---|
| Falling Block | `minecraft:falling_block` | Sand, gravel, anvil, dragon egg, concrete powder; lands after fall; converts to block on impact; damages entities (1-40 ♥ scaled by fall distance for anvil) |
| TNT (primed) | `minecraft:tnt` | 80-tick fuse; explosion power 4; activated by redstone, fire, or Flint & Steel |
| End Crystal | `minecraft:end_crystal` | Explodes when hit (power 6); beams to dragon |
| Area Effect Cloud | `minecraft:area_effect_cloud` | Lingering potion effect; ~30s lifetime, splash-radius |
| Experience Orb | `minecraft:experience_orb` | Collected by player when within 1.5 blocks |
| Item | `minecraft:item` | Dropped item entity; despawns 5 min (10 sec if no owner) |
| Item Frame | `minecraft:item_frame` | Wall-mounted item display |
| Glow Item Frame | `minecraft:glow_item_frame` | Always-visible in dark |
| Painting | `minecraft:painting` | Multiple sizes/variants; pick on placement |
| Leash Knot | `minecraft:leash_knot` | Tied lead to fence post |
| Lead Knot | (deprecated, same as above) | |
| Lightning Bolt | `minecraft:lightning_bolt` | Struck entities take 5 ♥ + fire 8s; converts villager→witch, pig→zombified piglin, creeper→charged, mooshroom red↔brown, triggers copper oxidation reset |
| Marker | `minecraft:marker` | Invisible no-op entity for datapacks |
| Ominous Item Spawner | `minecraft:ominous_item_spawner` | 1.21 trial spawners; spawns item floating in air |
| Interaction | `minecraft:interaction` | 1.19.4+ invisible box that can be clicked; reports interaction to scoreboards |
| Display (Block/Item/Text) | `minecraft:block_display` / `item_display` / `text_display` | 1.19.4+ static display entities for maps/datapacks |
| Evoker Fangs | `minecraft:evoker_fangs` | Static entity that snaps shut after 1.2s, dealing 6 ♥ |
| Marker (Datapack) | `minecraft:marker` | |

### 9.4 Special Effect Entities

| Entity | ID | Notes |
|---|---|---|
| Dragon Fireball | `minecraft:dragon_fireball` | (see projectiles) |
| Lightning Bolt | `minecraft:lightning_bolt` | (see above) |
| End Gateway (block, but spawns beam entity) | — | Bedrock-only beam entity |
| Fishing Bobber | `minecraft:fishing_bobber` | (see projectiles) |
| Ominous Item Spawner | `minecraft:ominous_item_spawner` | 1.21 |

### 9.5 Non-Mob Non-Projectiles

| Entity | ID | Notes |
|---|---|---|
| Armor Stand | `minecraft:armor_stand` | Static; can hold armor & items in hands; poses; takes damage from fire, cactus, etc.; can have arms, base plate, marker (no collision) flags |
| Player | `minecraft:player` | Cannot be spawned normally; only via real player connection |

---

## 10. Spawn Rules Reference

### 10.1 Spawn Categories & Caps

Minecraft maintains four spawning "categories" with separate mob caps:

| Category | Cap Formula (per player) | Contains |
|---|---|---|
| `monster` | 70 × (chunks/289) | Zombie, skeleton, creeper, spider, enderman, slime (overworld), witch, etc. — only spawns in darkness |
| `creature` | 10 × (chunks/289) | Cow, sheep, pig, chicken, etc. — spawns on grass in daylight |
| `ambient` | 15 × (chunks/289) | Bat |
| `water_creature` | 5 × (chunks/289) | Squid, dolphin (surface) |
| `underground_water_creature` | 5 × (chunks/289) | Glow squid (1.18+) |
| `axolotls` | 5 × (chunks/289) | Axolotl |
| `misc` | Unlimited (per-mob type) | Minecarts, item entities, etc. |

`chunks` = loaded chunk count (289 = 17×17 default render distance). Caps are **shared across all players in dimension**.

### 10.2 Spawn Conditions

| Mob | Block Required | Light Level | Biome Restriction | Other |
|---|---|---|---|---|
| Zombie | Solid top block, non-leaf | ≤ 0 in 1.18+ (sky light) | Any overworld | Door-breaking on Hard; baby zombie 5% chance |
| Husk | Sand/red sand | ≤ 0 sky light | Desert | Doesn't burn in day |
| Drowned | Water ≥ 2 deep | Any | Ocean, River, Beach (night) | Spawns in water day or night |
| Skeleton | Solid top block | ≤ 0 sky light | Any overworld (and Nether Fortress for wither skeletons) | Burns in day; baby skeleton rare/none |
| Stray | Solid top block (snow) | ≤ 0 sky light | Snowy Tundra, Snowy Mountains, Ice Spikes, Frozen River, Snowy Beach | |
| Bogged | Solid top block | ≤ 0 sky light | Swamp, Mangrove Swamp (surface); Trial Chambers spawners | 1.21 |
| Creeper | Solid top block | ≤ 0 sky light | Any overworld | |
| Spider | Solid top block | ≤ 0 sky light | Any overworld | Can spawn as skeleton jockey |
| Cave Spider | (spawner only) | (any) | Mineshaft spawner | |
| Witch | Solid block | Any (hut) / ≤ 0 (anywhere else) | Swamp hut or any overworld | 25% chance to spawn in place of villager when lightning strikes |
| Slime | Solid top block ( swamp ) / ignore light below Y=40 | ≤ 7 (swamp); any (slime chunks) | Swamp surface (Y=50-70) or slime chunks below Y=40 | Moon phase: 0% new moon → 100% full moon |
| Enderman | Solid top block | ≤ 0 sky light (overworld/nether) / any (End) | Any overworld + Nether + End | 3× spawn rate in Nether + End |
| Pillager | Solid top block | Any | Patrols at day (overworld), outposts, raids | |
| Vindicator/Evoker | Solid top block | Any | Woodland Mansions (any light), raids | |
| Ravager | Solid top block | Any | Raids only | |
| Phantom | Air, no block within 13 blocks above player | Sky light ≥ 0 (night) | Any overworld | Player insomnia 3+ days |
| Blaze | (spawner) | Any | Nether Fortress spawner | |
| Magma Cube | Solid block (Nether) | Any | Nether (common in Basalt Deltas) | |
| Ghast | Air (Nether) | Any | Nether (anywhere in air above lava lakes) | |
| Wither Skeleton | Solid block (fortress) | ≤ 7 | Nether Fortress | |
| Piglin | Solid block | ≤ 11 | Crimson Forest, Nether Wastes, Bastion | |
| Hoglin | Crimson Nylium | Any (any light) | Crimson Forest | |
| Slime (Nether) | (only magma cubes spawn here) | | | |
| Shulker | (only spawns via duplication) | Any | End City / End Ship | Duplicates onto nearby air blocks at 50% HP |
| Guardian | Water in monument | Any | Ocean Monument | |
| Elder Guardian | Water in monument | Any | Ocean Monument (3 max) | |
| Cod | Water (any temp) | Any | Ocean (non-frozen), River | Schools of 3-6 |
| Salmon | Water | Any | Ocean (any), River | Schools of 1-5 |
| Pufferfish | Water | Any | Lukewarm / Deep Lukewarm Ocean | |
| Tropical Fish | Water | Any | Lukewarm Ocean, Coral Reefs | |
| Dolphin | Water | Any | Ocean (non-frozen) | |
| Squid | Water | Any | Ocean, River | |
| Glow Squid | Water, Y < 30 | Any | Underground water | |
| Axolotl | Water, lush caves | Any | Lush Caves | |
| Turtle | Sand | Any | Beaches (lay eggs) | Only natural spawn is eggs → baby turtles |
| Bee | Bee nest block (initially) | Any | Plains, Forest, Birch Forest, Flower Forest, Sunflower Plains, Meadow, Mangrove Swamp | Spawns with 1-3 bees in nest |
| Bat | Solid block, Y ≤ 63, light ≤ 3 | ≤ 3 | Any overworld underground / caves | |
| Pillager Patrol | Solid block | Any | Overworld surface | Day 5+; every 10 ticks check, 30% chance per day to spawn |
| Warden | (manual emergence) | | Deep Dark | Requires 4 sculk shriekers triggered in 10 min within 40 blocks |

### 10.3 Light Level Changes (1.18+)

Spawn algorithm uses **sky light**, not block light, for monsters. Specifically:

- Hostile spawns require `sky_light == 0` (i.e., sky blocked by opaque block above, OR night)
- Block light from torches (14) prevents spawn within 14 blocks

Above-ground surface monsters only spawn at night (sky_light 4 → 0 transition at sunset). In caves / under cover, any time of day works.

### 10.4 Mob Cap Calculation

```
mobCap = 70 * ceil(loadedChunks / 289)
```

- 289 chunks = 17×17 (a single player's default view distance)
- 2 players: 70 × 2 = 140 monster cap (if they're far enough apart that chunk sets don't overlap)
- 4 players spread out: 280

The cap counts only **persisted** mobs in the dimension. Mobs more than 128 blocks from any player despawn immediately; mobs beyond 32-128 blocks randomly despawn at 1/800 chance per tick after 30 sec.

---

## 11. Mob Spawning Algorithm

### 11.1 Spawn Cycle (Per Dimension)

The mob spawning runs once per tick (20 Hz) but each phase has different cadence:

```
Every game tick:
  1. For each player:
       a. Pick a random chunk in player's 5-chunk radius (15×15 = 225 chunks around player)
       b. Pick random block in chunk; pick random X/Z, top Y
       c. Validate position (solid below, air above, no collision)
       d. Choose mob type from biome's spawn list (weighted)
       e. Check spawn rules (light, block, sky)
       f. If hostile mob: pack spawning — pick 1-4 mobs of same/different type nearby

  2. Pack spawning:
     a. Choose pack size from spawn list entry (1-4 typical)
     b. Pick 12 random attempts within 41×41×41 cube around original position
     c. Each attempt: validate spawn; if valid, spawn the mob
     d. Stop when pack size reached or attempts exhausted

  3. Cap enforcement:
     - Each spawn checks category cap; if exceeded, abort
     - Skipped spawns do not refund attempts

Every 20 ticks (1 sec):
  - Despawn check for each loaded mob:
    - Monster > 128 blocks from player: despawn immediately
    - Monster 32-128 blocks: 1/800 chance/tick after 30 sec idle
    - Passive mobs: don't despawn naturally (unless PersistentRequired=false and not in chunk for >5min?)
    - Named mobs: never despawn
    - Tamed mobs: never despawn
```

### 11.2 Pack Spawning

Each spawn list entry has:

- `entity_type` — mob to spawn
- `weight` — relative probability
- `min_size` / `max_size` — pack bounds (1-4 typically)
- `spawn_cost` — 1.18+ optional per-biome cost (used for some hostile mobs in deep dark)

For most overworld creatures, a pack of 4 means 4 individual mobs spawn in the 41×41×41 cube around the initial position.

For spiders, the initial spawn can be a **skeleton jockey** (1% chance).

For zombies, on Hard difficulty, 5% of spawns are **baby zombies**, and on Hard 5% of zombie pack spawns include a chicken jockey (baby zombie riding chicken).

### 11.3 Spawn Costs

1.18+ introduced per-biome spawn cost for certain mobs. Each spawn subtracts a cost from a chunk's "budget"; when budget ≤ 0, no more mobs of that type spawn in that chunk. Used to:

- Limit Phantoms in any given area
- Limit Cave Spiders
- Limit Warden-adjacent sculk spawns

### 11.4 Despawn Rules

| Mob Class | Despawn Behavior |
|---|---|
| Most monsters | >128 blocks from player: instant despawn; 32-128: random after 30s idle |
| PersistentRequired=true | Never despawns (named, leashed, item-picked-up, bred, tamed, etc.) |
| Passive mobs (cow, sheep, etc.) | Once spawned naturally, never despawn naturally (until chunk unloads); however, the spawn algorithm does NOT refill passive mobs in already-populated chunks (the cap is on initial spawn, not maintenance) |
| Wandering Trader | Despawns after 40-60 min |
| Tamed mobs | Never despawn |
| Bosses (Ender Dragon, Wither) | Never despawn |
| Warden | Despawns after 60s without target |
| Item Entity | 5 min (10 sec if no pickup owner) |
| Dropped XP | 5 min |
| Arrows | 60 sec |

### 11.5 Persistence Acquisition

Mobs become persistent (don't despawn) when:

- Named (CustomName set via name tag)
- Leashed
- Picked up an item (some mobs, e.g., zombies, can pick up dropped items)
- Tamed (wolf, cat, etc.)
- Part of a breeding pair / baby
- Spawned via spawner (no, actually spawner mobs still despawn; only persistentRequired=true)
- Wandering trader (auto-persistent)

---

## 12. Breeding Reference

### 12.1 Breeding Items & Cooldowns

| Mob | Breeding Item | Baby Growth | Breeding Cooldown | Notes |
|---|---|---|---|---|
| Cow | Wheat | 20 min | 5 min | Mooshroom same |
| Mooshroom | Wheat | 20 min | 5 min | Shear to convert to cow |
| Pig | Carrot, Potato, Beetroot | 20 min | 5 min | |
| Sheep | Wheat | 20 min | 5 min | |
| Chicken | Any seeds (wheat, melon, pumpkin, beetroot, torchflower) | 20 min | 5 min | Also lays eggs every 5-10 min |
| Rabbit | Carrot, Golden Carrot, Dandelion | 20 min | 5 min | |
| Wolf | Any meat (raw/cooked) | 20 min | 5 min | Must be tamed |
| Cat | Raw Cod, Raw Salmon | 20 min | 5 min | Must be tamed |
| Ocelot | Raw Cod, Raw Salmon | 20 min | 5 min | Trust not taming |
| Horse | Golden Apple, Enchanted Golden Apple, Golden Carrot | 20 min | 5 min | Stats inherit |
| Donkey | Same as horse | 20 min | 5 min | |
| Mule | (sterile, can't breed) | — | — | |
| Llama | Hay Bale | 20 min | 5 min | Strength inherit |
| Trader Llama | Hay Bale | 20 min | 5 min | |
| Panda | Bamboo (need 8+ bamboo within 5 blocks of both parents) | 20 min | 5 min | Personality inherit |
| Fox | Sweet Berries, Glow Berries | 20 min | 5 min | Baby trusts player who fed parents |
| Bee | Any flower | 20 min (maturation: 1 tick to breeding) | 5 min | Returns to nest |
| Turtle | Seagrass | 20 min | 5 min | Lays eggs on home beach |
| Axolotl | Bucket of Tropical Fish | 20 min | 5 min | |
| Goat | Wheat | 20 min | 5 min | |
| Camel | Cactus | 20 min | 5 min | |
| Hoglin | Crimson Fungi | 20 min | 5 min | Repelled by warped fungi |
| Strider | Warped Fungi (string on a stick controls; breed with warped fungi) | 20 min | 5 min | |
| Sniffer | Torchflower Seeds | 20 min | 5 min | Sniffer egg hatches in 20 min |
| Frog | Slimeball | (egg → tadpole → frog) | 5 min | Egg hatches tadpoles in 10 min |
| Allay | (cannot breed; duplicates with amethyst shard + jukebox dance) | — | 2.5 min | |
| Armadillo | Spider Eyes | 20 min | 5 min | |
| Villager | Bread (3) / Carrot (12) / Potato (12) / Beetroot (12) | 20 min | 5 min | Both must be willing |
| Frog | Slimeball | Frogspawn → Tadpoles | 5 min | |
| Sniffer | (sniffer eggs; both parents needed) | Egg hatch 20 min | 5 min | |

### 12.2 Baby Growth Acceleration

Feeding a baby the breeding item reduces growth time by 10% (1 min) per feeding, up to ~50% reduction (5 feedings). After 5 feedings, food has no extra effect.

### 12.3 Special Breeding Mechanics

- **Horse stat inheritance:** Average of parents ± random mutation (0.5× random range). Health, speed, and jump are independent genes.
- **Sheep color:** Baby inherits color from parents; if parents are different colors, baby is a mix (red+white = pink, etc.).
- **Axolotl color:** 1/1200 chance for blue (vs. parents' colors).
- **Panda personality:** Determined by hidden gene + main gene combination.
- **Frog variant:** Tadpole's maturation biome determines frog type (cold/temperate/warm).

---

## 13. Mob Sounds Reference

Sounds are critical for the implementing AI to provide authentic feedback. Each mob has these sound categories (mostly):

- `ambient` — Idle sound, played every 80-160 ticks randomly
- `hurt` — When damaged
- `death` — On death
- `step` — Footstep (most terrestrial mobs)
- `splash` — In water
- `swim` — Moving through water
- `fall` — Landing after fall (with big-fall variant)

### 13.1 Common Sound Events (selected)

| Mob | Ambient | Hurt | Death | Step | Special |
|---|---|---|---|---|---|
| Cow | `entity.cow.ambient` (moo) | `entity.cow.hurt` | `entity.cow.death` | `entity.cow.step` | Milk: `entity.cow.milk` |
| Pig | `entity.pig.ambient` | `entity.pig.hurt` | `entity.pig.death` | `entity.pig.step` | Saddle: `entity.pig.saddle` |
| Sheep | `entity.sheep.ambient` | `entity.sheep.hurt` | `entity.sheep.death` | `entity.sheep.step` | Shear: `entity.sheep.shear` |
| Chicken | `entity.chicken.ambient` | `entity.chicken.hurt` | `entity.chicken.death` | `entity.chicken.step` | Egg: `entity.chicken.egg` |
| Horse | `entity.horse.ambient` | `entity.horse.hurt` | `entity.horse.death` | `entity.horse.step` | Gallop, breathe, angry, eat |
| Wolf | `entity.wolf.ambient` (whine), `entity.wolf.growl` (angry) | `entity.wolf.hurt` | `entity.wolf.death` | `entity.wolf.step` | Shake: `entity.wolf.shake` |
| Cat | `entity.cat.ambient` (variants per type!) | `entity.cat.hurt` | `entity.cat.death` | `entity.cat.step` | Purr, hiss, eat |
| Villager | `entity.villager.ambient` (per-profession pitch) | `entity.villager.hurt` | `entity.villager.death` | `entity.villager.step` | Yes, no, trade |
| Zombie | `entity.zombie.ambient` | `entity.zombie.hurt` | `entity.zombie.death` | `entity.zombie.step` | Infect villager: `entity.zombie.infect` |
| Skeleton | `entity.skeleton.ambient` | `entity.skeleton.hurt` | `entity.skeleton.death` | `entity.skeleton.step` | |
| Creeper | `entity.creeper.hiss` (fuse start) | `entity.creeper.hurt` | `entity.creeper.death` | `entity.creeper.step` (rare) | `entity.creeper.primed` |
| Spider | `entity.spider.ambient` | `entity.spider.hurt` | `entity.spider.death` | `entity.spider.step` | |
| Enderman | `entity.enderman.ambient` (deep hum) | `entity.enderman.hurt` | `entity.enderman.death` | (none) | Scream: `entity.enderman.scream` (when angered), stare: `entity.enderman.stare` |
| Blaze | `entity.blaze.ambient` (breath) | `entity.blaze.hurt` | `entity.blaze.death` | (none) | `entity.blaze.breathe`, `entity.blaze.shoot` |
| Ghast | `entity.ghast.ambient` (moan) | `entity.ghast.hurt` | `entity.ghast.death` | (none) | `entity.ghast.warn` (before fireball), `entity.ghast.shoot` |
| Wither | `entity.wither.ambient` | `entity.wither.hurt` | `entity.wither.death` | (none) | `entity.wither.spawn`, `entity.wither.shoot` |
| Ender Dragon | (none ambient) | `entity.ender_dragon.hurt` | `entity.ender_dragon.death` | (none) | `entity.ender_dragon.flap`, `entity.ender_dragon.growl`, `entity.ender_dragon.shoot` |
| Warden | `entity.warden.ambient` | `entity.warden.hurt` | `entity.warden.death` | `entity.warden.step` | `entity.warden.heartbeat`, `entity.warden.sonic_boom`, `entity.warden.agitated`, `entity.warden.angry`, `entity.warden.listening`, `entity.warden.sniff`, `entity.warden.dig`, `entity.warden.emerge`, `entity.warden.roar` |
| Breeze | `entity.breeze.ambient` | `entity.breeze.hurt` | `entity.breeze.death` | `entity.breeze.step` | `entity.breeze.wind_burst`, `entity.breeze.inhale`, `entity.breeze.shoot`, `entity.breeze.jump`, `entity.breeze.land`, `entity.breeze.slide` |
| Bogged | `entity.bogged.ambient` | `entity.bogged.hurt` | `entity.bogged.death` | `entity.bogged.step` | `entity.bogged.shear` |
| Allay | `entity.allay.ambient_with_item`, `entity.allay.ambient_without_item` | `entity.allay.hurt` | `entity.allay.death` | (none) | `entity.allay.throw`, `entity.allay.item_given`, `entity.allay.item_taken` |
| Sniffer | `entity.sniffer.ambient` | `entity.sniffer.hurt` | `entity.sniffer.death` | `entity.sniffer.step` | `entity.sniffer.digging`, `entity.sniffer.digging_stop`, `entity.sniffer.happy`, `entity.sniffer.sniffing`, `entity.sniffer.searching`, `entity.sniffer.scenting`, `entity.sniffer.spit` (egg) |
| Armadillo | `entity.armadillo.ambient` | `entity.armadillo.hurt` | `entity.armadillo.death` | `entity.armadillo.step` | `entity.armadillo.roll`, `entity.armadillo.land`, `entity.armadillo.peek`, `entity.armadillo.unroll` (1.21), `entity.armadillo.scute_drop`, `entity.armadillo.brush` |
| Camel | `entity.camel.ambient` | `entity.camel.hurt` | `entity.camel.death` | `entity.camel.step` | `entity.camel.saddle`, `entity.camel.sit`, `entity.camel.stand`, `entity.camel.dash`, `entity.camel.dash_ready` |
| Goat | `entity.goat.ambient` (3 variants: normal/screaming) | `entity.goat.hurt` | `entity.goat.death` | `entity.goat.step` | `entity.goat.screaming.ambient`, `entity.goat.ram_impact`, `entity.goat.long_jump`, `entity.goat.prepare_ram` |
| Frog | `entity.frog.ambient` | `entity.frog.hurt` | `entity.frog.death` | (none) | `entity.frog.eat`, `entity.frog.lay_egg`, `entity.frog.tongue`, `entity.frog.step` (water) |
| Axolotl | `entity.axolotl.ambient` (idle, water, air variants) | `entity.axolotl.hurt` | `entity.axolotl.death` | (none) | `entity.axolotl.idle_air`, `entity.axolotl.attack`, `entity.axolotl.splash` |

### 13.2 Pitch & Volume Variance

Most sound events allow `pitch_variance` (±pitch × 0.8-1.2) and `volume_variance` (±0.2). Babies use pitch × 1.5-2.0 for ambient sounds. Distance attenuation: 16-block standard fall-off (1.0 at 0 blocks → 0.0 at 16 blocks).

### 13.3 Subtitles

Each sound event has a subtitle string (e.g., `subtitles.entity.creeper.primed` → "Creeper hisses"). Subtitles fire even if the player has them off — they're used for game-feel.

---

## 14. Special Mob Behaviors Deep-Dive

### 14.1 Creeper Explosion Mechanics

- **Fuse:** 30 ticks (1.5 sec) from provocation; reduced to 24 ticks (1.2s) when ignited by Flint & Steel or Fire Aspect sword
- **Explosion power:** 3 (regular), 6 (charged)
- **Trigger radius:** 3 blocks (within line of sight)
- **Strategic retreat:** When fuse is in progress and target moves >7 blocks away, creeper stops and defuses
- **Damage calculation:** All entities within 8 blocks (charged 12) take damage based on:
  ```
  damage = explosion_power × (1 - distance / radius × 0.5) × (1 - blast resistance / 25)
  ```
  With additional knockback away from explosion center.
- **Block damage:** All blocks within radius × (1 - 0.225 × blast_resistance) destroyed, with 30% drop rate (vs 100% for player-mined). TNT and creepers both use this formula.
- **Charged creeper:** Created when lightning strikes within 4 blocks. Aura visible (electric blue particles). Explosion power doubles; damage doubles. Head drop chance for zombies/skeletons/creepers/withers when killed by charged creeper = 100% (vs 2.5% normally) — only way to get player heads in survival.
- **Cat/Ocelot avoidance:** Creepers avoid cats/ocelots within 6 blocks (run in opposite direction).
- **Music disc farming:** When a creeper is killed by a skeleton's, stray's, or bogged's arrow, it drops a music disc instead of gunpowder.

### 14.2 Enderman Teleportation & Aggro

- **Aggro triggers:**
  1. **Looked at face:** Within 64 blocks, player's eye-direction intersects enderman's eye/face bounding box → aggro after 0.5s
  2. **Hit by player:** Immediate aggro (last-damage cause check)
  3. **Hit by projectile:** Teleports away; bow shots get deflected (enderman blinks before arrow hits)
- **Teleport behavior:**
  - Range: up to 32 blocks horizontally, 16 blocks vertically
  - Cooldown: 16 ticks (0.8 sec) per teleport
  - Target selection: random position within 16-block cube of player that has solid ground below
  - Cannot teleport into water, lava, or onto air
  - Teleports when on fire (water/lava/rain)
  - Teleports when targeted by projectile (avoidance)
  - Teleports when player looks away after aggro (sneaks up behind player)
- **Water damage:** 1 ♥/sec when in contact with water; rain also damages
- **Block carrying:** Enderman can pick up certain blocks (full list):
  - Grass block, dirt, coarse dirt, podzol, sand, red sand, gravel, dandelion, poppy, blue orchid, allium, azure bluet, red tulip, orange tulip, white tulip, pink tulip, oxeye daisy, cornflower, lily of the valley, wither rose, torchflower, wheat, carrot, potato, beetroot, melon (stem), pumpkin (stem), netherrack, crimson fungus, warped fungus, crimson roots, warped roots, moss block, TNT, cactus, clay, pumpkin, carved pumpkin, jack o'lantern, melon, brown mushroom, red mushroom, TNT, mycelium, crimson nylium, warped nylium, bamboo, sugar cane (1.21+)
- **Becomes passive in rain** (teleports away from rain, then despawns when too wet)
- **Endermite hostility:** Endermen attack nearby endermites on sight
- **Death:** Drops 0-1 ender pearl; explodes into smoke (no actual explosion)

### 14.3 Villager Pathfinding to Beds/Workstations

- Each villager has claimed POIs: `HOME` (bed), `JOB_SITE` (workstation), `MEETING_POINT` (bell)
- During the day, schedule is WORK (06:00-18:00) → walk to JOB_SITE; stand near (within 1 block) for job task ticks
- During evening MEET (18:00-20:00) → walk to MEETING_POINT
- At night REST (22:00-06:00) → walk to HOME bed; sleep
- If path to claimed POI is blocked (e.g., bed has wall in front), villager enters "can't reach walk target" memory state; if 600 ticks (30s) pass, villager releases the POI and tries to find another
- Pathfinding uses standard A* with the GroundPathNavigation node evaluator
- Villagers will open/close doors along path; can also use fence gates
- If attacked → PANIC activity → run away (often toward home bed if night)
- During raid: villager enters RAID activity → runs to nearest bed, refuses to leave

### 14.4 Piglin Bartering

- **Trigger:** Player throws (right-click) a gold ingot at a piglin (within 8 blocks)
- **Process:** Piglin picks up ingot, looks at it for 2-6 sec, then drops a random item
- **Result table (60 possible items, weighted):**
  | Item | Quantity | Chance per barter |
  |---|---|---|
  | Soul Speed I Book | 1 | 1.09% |
  | Soul Speed II Book | 1 | 0.73% |
  | Soul Speed III Book | 1 | 1.64% |
  | Iron Boots w/ Soul Speed I-III | 1 | 5.45% |
  | Iron Nuggets | 4-9 × 10-23 | 2.18% each (3 entries) |
  | Crying Obsidian | 1-3 | 8.37% |
  | Nether Quartz | 5-12 | 4.36% |
  | Glowstone Dust | 5-12 | 4.36% |
  | Nether Brick | 1-3 | 4.36% |
  | String | 3-9 | 4.91% |
  | Leather | 2-4 | 4.91% |
  | Obsidian | 1 | 8.36% |
  | Fire Resistance Potion | 1 | 1.74% |
  | Splash Fire Resistance Potion | 1 | 1.74% |
  | Spectral Arrow | 6-12 | 2.18% |
  | Gravel | 2-8 | 4.36% |
  | Blackstone | 4-8 | 4.36% |
  | Soul Sand | 4-8 | 4.36% |
- **Bartering rules:**
  - Piglins will not barter while attacking the player
  - Piglins zombify in overworld (after 15s) — no barter
  - Piglins admire gold ingot by looking at it for 2-6 sec
- **Hunt behavior:** Piglins attack hoglins in groups of 3+ (using crossbow if holding one or sword if melee); after killing hoglin, they may carry the raw porkchop

### 14.5 Allay Item Collection

- **Taming/Binding:** Right-click allay with item → allay becomes "bound" to that player and stores the item type
- **Collection:** Allay scans 32-block radius for matching item entities on the ground
- **Delivery path:** Picks up item → flies to bound player; if player unreachable, drops item where player last was
- **Note block delivery:** If a note block is played within 16 blocks, allay flies to it and drops items there for 30 sec (cooldown 4 sec)
- **Duplication:** When allay is given amethyst shard while dancing (jukebox playing within 16 blocks), spawns a new allay with 2.5-min cooldown
- **Pickup limit:** 1 stack at a time per allay

### 14.6 Warden Sensing System (Deep Dive)

The Warden uses a custom anger system tracked per entity:

**Anger accumulation per entity type:**

| Event | Anger Added |
|---|---|
| Vibration from a player/mob (within sculk sensor range, warden as listener) | +35 |
| Smelling entity within 6 blocks (regardless of sneak) | +100 per sense |
| Player attacks Warden directly | +100 |
| Player projectile hits Warden | +5 |
| Touch (collision) | +10 |
| Standing still within Warden's detection radius for 60s | small additions |

**Anger decay:** 6 per second when target out of sight/smell for 6+ seconds

**Behavior thresholds:**

| Anger | Behavior |
|---|---|
| 0-19 | Investigate (move to last vibration location) |
| 20-39 | Sniff (look around) |
| 40-49 | Investigate more aggressively (faster movement) |
| 50-79 | Sniff + Approach |
| 80-99 | Attack: chase target on foot |
| 100+ | Attack + use Sonic Boom if target is unreachable |

**Sonic Boom attack:**
- Range: 15 blocks (20 in some versions)
- Charge: 1.5 sec visible charge animation
- Damage: 6 (Easy) / 10 (Normal) / 15 (Hard) — bypasses armor AND shields AND blocks (line-of-sight not required)
- Knockback: Strong horizontal knockback away from Warden
- Cooldown: 5 seconds after each boom
- Visual: blue-white vertical beam from Warden chest to target

**Movement:**
- Walks on ground; cannot fly
- Speed: 0.4 normally (8 b/s); 0.6 (12 b/s) when actively chasing target with high anger
- Cannot be pushed back by knockback (knockback_resistance = 1.0)
- Cannot fall (immune to fall damage)
- Cannot burn (immune to fire)
- Cannot drown (immune to drowning)

**Despawn:** After 60 seconds without a target (no vibrations, no smell detections), the Warden burrows into the ground and despawns.

### 14.7 Ender Dragon Fight Phases

**Spawning:**
- One Ender Dragon per End dimension on first entry
- Respawns by placing 4 End Crystals on the exit portal bedrock pillars (one per direction: north/south/east/west)

**Crystal Healing:**
- 10 crystals on top of obsidian pillars heal the dragon at 1 ♥/tick if they have line of sight
- Crystals destroyed by bow shot or climbing the pillar and meleeing; explosion damages nearby crystals
- Iron bars cage some crystals (1.21+)

**Flight pattern:**
1. **Holding Pattern:** circles End at high altitude (Y 80+)
2. **Strafe:** dive-bombs player, shoots dragon fireball
3. **Perch:** lands on exit portal; releases dragon breath attack (purple lingering cloud AoE — 3 ♥/sec on Normal); exposes head (player can melee head for 4× damage)
4. **Charge:** dives at player on ground
5. **Flap:** hovers low over portal, buffeting nearby players with wing knockback (~5 blocks)

**Damage zones:**
- Head: takes 4× damage from arrows and melee
- Body/Wings: normal damage
- Tail: 0.5× damage

**Death:**
- Animation: dragon rises into air, beams of light shoot out from body, then explodes into XP orbs
- Drops: 12,000 XP (one orb of 12,000, splits into ~500 orbs of 24 XP each)
- Exit portal opens with dragon egg on top
- Bedrock at center of portal lights up

### 14.8 Wither Summoning and Fight

**Summoning:**
1. Place 4 soul sand in T-shape (3 on bottom, 1 on top center)
2. Place 3 wither skeleton skulls on top of the 3 vertical soul sand blocks
3. Soul sand blocks consume; Wither spawns with explosion (no block damage on Java — Bedrock has block damage)
4. Wither builds HP for 11 seconds (invulnerable, blue-black flashes)

**Phase 1 (Above 50% HP):**
- Flies slowly toward a random target
- Shoots 3 wither skulls per second (alternating blue/black)
- Blue skulls: explode on impact, destroy weaker blocks (power 1)
- Black skulls: explode with fire, do not destroy blocks as aggressively
- All skulls inflict Wither II for 10 seconds on hit
- Targets any living entity (mobs, animals, players) — not skeletons/withers

**Phase 2 (Below 50% HP):**
- Wither armor "shatters" — visible texture change
- Falls to ground, becomes melee-only
- Gains immunity to arrows (deflects them)
- Sprint speed toward target
- Continues to regen 1 ♥/sec
- Still deals contact damage and may spawn 3 wither roses

**Death:**
- Animation: rises, glows, then explodes
- Drops: 1 Nether Star
- XP: 50

**Combat Tips (for implementing AI):**
- Smite enchantment deals +50% damage (boss is undead)
- Bedrock cage / obsidian box limits movement
- Blue skulls are 1 in 8 of total shots; player can hide behind solid blocks

### 14.9 Slime Splitting Mechanics

- **Slime sizes:** `Size = 1, 2, 4` (1 = small, 2 = medium, 4 = large)
  - Health: `Size² + 1` → small = 1, medium = 4, large = 25? Actually: large 25, medium 4, small 1
  - Damage on contact: `Size` → small 0, medium 2, large 4
  - Hitbox: `Size × 0.51` cube (so 0.51, 1.02, 2.04)
- **Splitting:** When killed, large spawns 2-4 mediums, medium spawns 2-4 smalls, small spawns nothing
- **Spawning conditions:**
  - **Swamp:** surface above Y=50, light ≤ 7, phase-of-moon matters (full moon = 100% spawn rate, new moon = 0%)
  - **Slime chunks:** specific chunks (1/10 of all chunks) below Y=40, any light, ignore grass
- **Splitting slimes:**
  - Don't split if killed by player with Smite on a small slime (already smallest)
  - Splitting slimes inherit some NBT (PersistenceRequired, etc.)
- **Magma cube:** same size mechanics; large spawns 2-4 medium, etc. Drops Magma Cream only from large/medium (small has a 1/4 chance)
- **Fruitless killing:** Killing a small slime with Looting III can drop up to 5 slimeballs

### 14.10 Phantom Spawning at Insomnia

- **Trigger:** Player hasn't slept (entered bed) in 3+ in-game days (60,000 ticks = 50 min real)
- **Stats checked:** `LastRestStat`, incremented each successful sleep; on wake, `LastSlept` is set; phantom spawn timer counts from `LastSlept`
- **Spawn conditions:**
  - Above player (20-34 blocks up)
  - Player above sea level (Y ≥ 64) — i.e., not in caves
  - Sky visible above player (no block above within 20 blocks)
  - Night (between 13000 and 23000 in day cycle)
  - 1-4 phantoms per spawn wave; spawn waves happen every 60-120 sec
- **Phantom behavior:**
  - Fly in circles high above player, then dive in swoops
  - On dive, deal 2 ♥ on contact
  - Damage taken from swoop: 3 ♥ (Hard)
  - Die in sunlight (daylight) — burn 1 ♥/sec when sky_light ≥ 15
- **Insomnia reset:** Sleeping in a bed (or being in bed during transition to morning) resets the insomnia counter to 0
- **Server config:** `/gamerule doInsomnia true/false` disables phantom spawning entirely

### 14.11 Bee Behavior (Full Cycle)

- **Nest:** Bee nest spawns naturally with 1-3 bees; holds up to 3 bees; has honey level 0-5 (incremented when bee returns from pollination)
- **Pollination:** Bee flies to nearby flower (within 22 blocks), lands, gathers nectar for 2 sec, returns to nest with pollen particles
- **Crop acceleration:** When bee passes over crops, accelerates growth by 1 stage (10% chance per pass)
- **Honey harvest:** When honey level = 5, player can harvest with shears (3 honeycomb) or bottles (3 honey bottles)
- **Angering bees:** If player breaks nest/hive without campfire below, OR harvests honey without campfire, OR attacks bee → bee enters "aggro" mode
- **Aggro propagation:** Attacked bee calls all bees within 50 blocks; entire hive aggros
- **Sting:** Deals 2 ♥ + Poison I for 10s (Normal/Hard); bee dies 60 seconds after stinging (visible stinger remains in player)
- **Night/rain:** All bees return to nest and sleep
- **Breeding:** Any flower (held or growing) — babies inherit same colony

### 14.12 Pillager Patrol & Raid

- **Patrols:**
  - Spawn on surface, light > 0 (day), 5+ days elapsed
  - 30% chance per day to spawn
  - 2-5 pillagers (1 captain with banner)
  - Patrol moves in straight line; changes direction every 50-100 blocks
  - Patrols attack villagers, players, iron golems, wandering traders
- **Raid:**
  - Triggered when player with Bad Omen effect enters a village
  - Bad Omen obtained by killing pillager captain (1-5 levels based on captain's patrol)
  - 7 waves (Easy: 3, Normal: 5, Hard: 7)
  - Each wave: pillagers, vindicators, then evokers (wave 5+), ravagers (wave 3+), witches (wave 4+)
  - Hero of the Village effect after victory (1 level per wave survived) → trade discounts
  - Raid victory: villagers emerge, throw gifts at player

### 14.13 Lightning Effects (per entity)

When lightning strikes within 4 blocks of an entity:

| Entity | Effect |
|---|---|
| Pig | Becomes Zombified Piglin |
| Villager | Becomes Witch (25% chance in 1.16+; previously 100% in thunderstorm if hit) |
| Creeper | Becomes Charged Creeper (aura, double explosion power) |
| Mooshroom (red) | Becomes Brown Mooshroom |
| Mooshroom (brown) | Becomes Red Mooshroom |
| Skeleton Trap Horse | Triggers spawn: skeleton horse + 3 mounted skeletons |
| Player | Takes 5 ♥ damage + sets on fire for 8 sec (player damage reduction applies) |
| Other mobs | Take 5 ♥ + fire 8s |

### 14.14 Axolotl Combat Tricks

- Attack slimes, magma cubes, drowned, guardians, elder guardians, squids, fish
- Heal player on combat: gives player Regeneration I (5 sec) and removes Mining Fatigue when player kills mob that axolotl is targeting
- Plays dead: at <33% HP, axolotl flips on side and gains Regeneration I for 10 sec; other mobs lose aggro during this state

### 14.15 Goat Ramming Mechanics

- Charge interval: 30-300 sec random
- Targets: any entity standing still on solid ground within 10-30 blocks
- Wind-up: 1-2 sec lowering head, then accelerates 0.55 speed
- Damage: 1-3 ♥ + knockback 8+ blocks
- Knockback: launches target 8-10 blocks horizontally, can fall off cliffs
- Jump: can jump 5 blocks high naturally
- "Screaming" variant (5% spawn): more frequent ramming (every 5-30 sec), higher damage
- Doesn't ram player who recently fed it

### 14.16 Frog Tongue Mechanics

- Targets: small slime, small magma cube
- Pulls target to mouth with tongue (1-2 blocks)
- Slime: consumed, no drop
- Magma cube: consumed, drops 1 froglight block of corresponding color:
  - Temperate frog → ochre froglight
  - Cold frog → verdant froglight
  - Warm frog → pearlescent froglight

### 14.17 Sniffer Lifecycle

- Sniffer Egg: found via archaeology in ocean ruins (warm/cold? — warm ocean ruins 6.7% chance in suspicious sand)
- Hatching: place on moss block, hatches in 20 min (10 min accelerated)
- Snifflet (baby): grows to adult in 40 min
- Adult sniffer: digs in dirt/grass/mud/podzol/moss/roots every 9 min when idle; finds torchflower seeds (50%) or pitcher pod (50%)
- Cannot be bred naturally (only via egg)
- Can breed (1.21+?) — actually no, sniffer is a "legacy" unique individual; breeding not implemented in 1.21

### 14.18 Allay Decoration Mechanics

- Particle: heart particles when given item
- Dances when jukebox playing within 16 blocks
- Duplicates when given amethyst shard while dancing
- Pickup limit: 1 stack per trip
- Delivery: drops items at player feet (or at note block if one was played recently)
- Wandering: if no player within 64 blocks, allay wanders freely

### 14.19 Camel Dash

- 1.20+ camel has a "dash" ability
- Cooldown: 40 ticks (2 sec)
- Dash: 8-block horizontal leap (with some vertical)
- Triggered by jump key (space) when ridden
- Two riders: front rider controls, back rider can shoot
- Cannot dash while in water

### 14.20 Warden "Searching" State

The Warden, when emerging, has a 7-second search phase:
- Bursts out of the ground (3 sec)
- Sniffs the air (1 sec)
- Roars (1 sec) — visible audio cue
- Begins moving toward last vibration location (2 sec post-roar)
- Gains full aggression 7 seconds after emergence

### 14.21 Trial Spawner Mechanics (1.21)

- New Trial Spawner block in Trial Chambers
- Spawns a fixed mob type (skeleton, zombie, spider, bogged, silverfish, baby zombie, slime, breeze, etc.)
- Spawn pattern:
  - Detects players within 14 blocks
  - Activates: emits smoke + sounds
  - Spawns mobs at rate based on player count (1-2 mobs per player per cycle)
  - Cap: 1× player count concurrent mobs
  - Each cycle: 1.5 sec between spawns
- Deactivation: after 30 sec without player kills or after 12+ mobs spawned
- Drops key on kill: drops Trial Key → opens nearby Vault
- Ominous mode: player with Bad Omen triggers ominous trial — spawns waves of breeze/bogged/with skeletons with buffs; rewards are better

### 14.22 Mob Effects Reference

Effects commonly applied to mobs:

| Effect | Effect on Mob | Source |
|---|---|---|
| Regeneration | +1 ♥ per 25 ticks per level | Bee stinger (none), golden apple, axolotl on player |
| Poison | 1 ♥ per 25 ticks per level (level 1) | Cave spider, witch potion, pufferfish, poison arrow, bogged arrow |
| Wither | 1 ♥ per 40 ticks (lvl 1), per 20 ticks (lvl 2) | Wither skeleton hit, wither skull, wither rose |
| Slowness | -15% per level | Stray arrow, witch potion |
| Weakness | -4 melee damage | Witch potion |
| Mining Fatigue | -30% mining speed per level | Elder guardian aura |
| Levitation | +0.045 Y/tick per level upward | Shulker bullet |
| Dolphin's Grace | +5 swim speed | Dolphin near player in water |
| Bad Omen | Trigger raid on village entry | Killed pillager captain |
| Hero of the Village | Trade discount + gift | Raid victory |
| Glowing | Outline visible through walls | Spectral arrow, spectral effect |
| Invisibility | Render invisibility (mobs still sense) | Invisibility potion |
| Night Vision | See in dark | Potion |
| Fire Resistance | Immune to fire | Potion, magma cream |
| Water Breathing | No drowning | Potion, turtle shell |
| Slow Falling | Negate fall damage | Potion, slow fall |
| Levitation (alternative) | Float upward | Shulker |
| Hero of the Village (levels) | Discount = 0.30 - 0.06 × level (so -30% to -54%) | Each wave of raid survived |

---

## Appendix A — Quick Reference: All Mob Health & Damage (1.21)

| Mob | Health (♥) | Damage (Easy/Normal/Hard) |
|---|---|---|
| Bat | 3 | 0 |
| Cat | 10 | 0 (1 scratch) |
| Chicken | 4 | 0 |
| Cow | 10 | 0 |
| Pig | 10 | 0 |
| Sheep | 8 | 0 |
| Rabbit | 3 | 0 |
| Horse | 15-30 | 0 (kick 1-2) |
| Donkey/Mule | 15-30 | 0 |
| Llama | 15-30 | 1 (spit) |
| Trader Llama | 20 | 1 (spit) |
| Wolf (wild) | 8 | 4 |
| Wolf (tamed) | 20 | 4 |
| Ocelot | 10 | 0 |
| Parrot | 6 | 0 |
| Fox | 10 | 2 |
| Bee | 10 | 2 |
| Turtle | 30 | 0 |
| Axolotl | 14 | 2 |
| Frog | 10 | 0 |
| Tadpole | 6 | 0 |
| Goat | 10 | 1-3 (ram) |
| Sniffer | 8 | 0 |
| Allay | 20 | 0 |
| Armadillo | 12 | 0 |
| Camel | 32 | 0 |
| Strider | 20 | 0 |
| Glow Squid | 10 | 0 |
| Squid | 10 | 0 |
| Cod | 3 | 0 |
| Salmon | 3 | 0 |
| Pufferfish | 3 | 0 + poison |
| Tropical Fish | 3 | 0 |
| Dolphin | 10 | 1 |
| Polar Bear | 30 | 4/6/7 |
| Panda | 20 | 0-6 |
| Mooshroom | 10 | 0 |
| Villager | 20 | 0 |
| Wandering Trader | 20 | 0 |
| Snow Golem | 4 | 0 (snowball 0-3 to blaze) |
| Iron Golem | 100 | 7-21 |
| Zombie | 10 | 3/4/6 |
| Husk | 10 | 3/4/6 |
| Drowned | 10 | 3/4/6 (trident 7/9/13) |
| Skeleton | 10 | 1-4 (bow) |
| Stray | 10 | 1-4 + Slowness |
| Bogged | 8 | 2-4 + Poison |
| Wither Skeleton | 10 | 5-7 + Wither II |
| Creeper | 10 | 49 (explosion close) |
| Spider | 8 | 2 |
| Cave Spider | 6 | 2 + Poison |
| Witch | 13 | Potions |
| Slime (small/med/large) | 1/4/12 | 0/2/4 |
| Magma Cube (small/med/large) | 1/4/12 | 2/4/6 + fire |
| Silverfish | 4 | 1 |
| Enderman | 20 | 7/10/15 |
| Endermite | 4 | 2 |
| Phantom | 6 | 2-3 |
| Pillager | 12 | 5-9 (crossbow) |
| Vindicator | 12 | 13 (axe, any difficulty) |
| Evoker | 12 | 6 (fangs) |
| Vex | 7 | 3-5 |
| Ravager | 50 | 7/12/18 |
| Guardian | 15 | 4-9 |
| Elder Guardian | 40 | 5-9 + Mining Fatigue |
| Shulker | 15 | 4-5 + Levitation |
| Blaze | 10 | 6 (melee) / 5 (fireball) |
| Ghast | 5 | 17 (fireball explosion) |
| Hoglin | 20 | 2-12 |
| Zoglin | 20 | 2-12 |
| Piglin | 8 | 5-13 |
| Piglin Brute | 25 | 7-19 |
| Zombified Piglin | 10 | 5-17 (pack) |
| Breeze | 15 | 2-13 + knockback |
| Warden | 125 | 16/30/45 (melee); 6/10/15 (sonic boom) |
| Wither | 150 | 5-12 + Wither II |
| Ender Dragon | 100 | 6/10/15 (head); 4/7/10 (body) |

## Appendix B — Recommended Implementation Order for a Minecraft Clone

1. **Entity base class** — position, motion, AABB, gravity, collision
2. **LivingEntity** — health, damage, death, attributes
3. **Mob** — goal selector, target selector, navigation
4. **Pathfinding** — A* over voxel graph, multiple navigation types (ground, water, flying, amphibious)
5. **Simple hostile mob (zombie)** — melee AI, sun burn, door break, target player
6. **Simple passive mob (cow)** — wander, breed, tempt with wheat
7. **Creeper** — explosion mechanic, fuse timer, charged variant
8. **Skeleton** — ranged attack, bow aim, strafe, sun burn
9. **Spider** — wall climbing, day/night behavior toggle
10. **Slime** — split mechanic, hop AI, hitbox scaling
11. **Tamable wolf** — sit, follow owner, attack owner's target, breed
12. **Villager** — brain system, POI, schedule, trades (this is the biggest single feature)
13. **Iron Golem** — village defense, anti-hostile AI
14. **Pathfinding refinements** — door opening, water avoidance, fence-jumping (ravager)
15. **Enderman** — teleport, aggro on look, block carrying
16. **Boss: Wither** — summoning, two-phase fight, block destruction
17. **Boss: Ender Dragon** — multi-phase fight, crystal healing, perch mechanic
18. **Warden** — vibration sensing, anger accumulation, sonic boom, despawn
19. **Breeze / Bogged** (1.21) — wind charge projectile, poison arrows

## Appendix C — Critical Engine Notes

- **Server-authoritative mob AI:** Mob position and decisions should be server-authoritative; client only renders. Mobs running on client can desync.
- **Goal tick budget:** Vanilla caps goal evaluation per tick; large mob counts (slime farms, raid farms) can TPS-drag. For a clone, batch the goal tick (every other tick for distant mobs).
- **Pathfinding cache:** Cache the most recent path per mob; recompute only if target moved >2 blocks or path invalid.
- **Spawn cap enforcement:** Check before each spawn; reject if cap reached. Important for performance — over-spawning is the most common cause of mob lag.
- **NBT persistence:** Save full mob state (brain, memories, attributes, inventory) on chunk unload so villages don't reset.
- **Sound:** Each sound should be tagged with `category` (hostile, neutral, passive, player, block, ambient, weather) for volume slider routing.
- **Particles:** Mob death particles, damage hearts (server-side), and ambient particles (bee pollen, axolotl bubbles) should be sent via packet to all nearby players.

---

**End of Mob & Entity Reference — Minecraft Java 1.21.x**

Total documented: 80+ mob types, 40+ non-mob entity types, 13 villager professions, 5 boss-tier encounters, full AI system (Goals + Brain), full spawn algorithm, full breeding table, full sound reference, 22 deep-dive special behaviors. Use with §01 Blocks Reference for complete world-construction vocabulary.
