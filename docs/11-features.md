# 11. Feature Specifications

> Detailed specifications for the most critical features. Each feature includes: description, acceptance criteria, implementation notes, and edge cases.

## 1. World Creation Flow

### 1.1 User Flow
1. User launches game → **Main Menu** appears (single-player button, options, quit).
2. Click **Single Player** → **World Select** screen.
3. Click **Create New World** → **World Creation Form**.
4. Fill in fields (see below), click **Create New World** button.
5. Loading screen with progress bar (generating spawn area).
6. Game starts.

### 1.2 World Creation Form Fields

| Field | Type | Default | Validation |
|---|---|---|---|
| World Name | text input | "New World" | 1-50 chars, no special filesystem chars |
| Game Mode | dropdown | Survival | Survival/Creative/Adventure/Spectator |
| Difficulty | dropdown | Normal | Peaceful/Easy/Normal/Hard/Hardcore |
| World Type | dropdown | Default | Default/Large Biomes/Amplified/Single Biome/Superflat |
| Seed | text input | (random) | any string or integer; empty = random |
| Random Seed | button | — | generates random 64-bit int |
| Generate Structures | checkbox | ON | ON/OFF |
| Bonus Chest | checkbox | OFF | ON/OFF |
| Allow Cheats | checkbox | OFF | ON/OFF |
| Hardcore | checkbox | OFF | ON (locks Difficulty=Hard, Hardcore mode) |

If **Superflat** is selected, a "Customize Layers" button appears, opening a layer editor (default: grass/dirt/dirt/dirt/bedrock = 5 layers).

If **Single Biome** is selected, a Biome dropdown appears (plains, forest, desert, mountains, ocean, jungle, snow, swamp, etc.).

### 1.3 Acceptance Criteria
- [ ] Form appears with all fields.
- [ ] Default values match vanilla Minecraft 1.21.
- [ ] Hardcore toggle locks difficulty selector to Hard and disables it.
- [ ] Random Seed button generates a random 64-bit integer.
- [ ] Empty seed generates a random seed (different every time).
- [ ] Same seed produces identical world (deterministic).
- [ ] World appears in World Select list after creation.
- [ ] Loading screen shows progress (chunks generated / estimated total).
- [ ] World starts with player at surface, on solid ground, at safe location.

## 2. Game Modes (CRITICAL)

### 2.1 Survival Mode
- Player has 20 HP (10 hearts), 20 hunger, 10 air bubbles.
- Mining takes time (block hardness × tool multiplier).
- Tools have durability, break after use.
- Hostile mobs spawn at night/dark.
- Fall damage, drowning, fire damage, lava damage all apply.
- Death drops all items + XP at death location; respawn at spawn/bed.
- Hunger depletes; if 0, player takes damage (down to 5 HP on Easy, 1 HP on Normal, 0 on Hard).
- Cannot fly.
- Must eat, must craft, must build shelter.

### 2.2 Creative Mode
- Player has unlimited HP (cannot die from damage, but can die from /kill).
- All blocks/items available in Creative inventory (E key opens tabbed menu).
- Instant block break (no mining time).
- Flying enabled (double-tap Space to toggle).
- No hunger, no air limit (can breathe underwater).
- No fall damage.
- Tools have no durability.
- Cannot die from mobs.
- Press `1-9` to select hotbar; press `E` for full creative inventory.
- Mobs still spawn but cannot damage player.

### 2.3 Adventure Mode
- Like Survival, but:
- Cannot break blocks unless tool has `can_destroy` NBT for that block.
- Cannot place blocks unless block has `can_place_on` NBT.
- Designed for custom maps.
- Otherwise identical to Survival.

### 2.4 Spectator Mode
- Invisible to other entities (mobs don't target).
- Can fly through blocks (no collision).
- Cannot interact with world (no breaking/placing).
- Cannot pick up items.
- Can teleport to players with `number keys` (in multiplayer — not relevant here).
- Can spectate from mob POV (press use key on mob).
- No HUD (no hotbar, no hearts).

### 2.5 Hardcore Mode
- Sub-mode of Survival.
- Difficulty locked to Hard (cannot change).
- On death: world becomes Spectator-only (cannot respawn in survival).
- In web context: do NOT delete the world — just lock to spectator.
- Heart icon on world list indicates Hardcore.

### 2.6 Mode Switching
- Press Esc → "Open to LAN" → "Allow Cheats: ON" → "Start LAN World" — grants access to /gamemode command.
- Or: if cheats were enabled at world creation, /gamemode works directly.
- Or: in pause menu, "Settings" → "Player Abilities" toggles individual abilities (in single-player Creative-equivalent).

## 3. Difficulty Modes (CRITICAL)

### 3.1 Peaceful
- No hostile mob spawns (slimes still spawn in slime chunks? Actually no — Peaceful disables all hostile spawns).
- Hunger depletes normally, but stops at 0 saturation (player doesn't starve).
- Health regenerates 1 HP/0.5 sec when hunger is full.
- Wither effect from wither roses still applies but withers don't spawn.
- Warden cannot spawn.
- Raids don't trigger.

### 3.2 Easy
- Hostile mobs spawn; damage is reduced (zombie 2 HP instead of 3, etc.).
- Zombies don't break doors.
- Spiders don't apply poison.
- Hunger can deplete to 0; player takes damage down to 5 HP (cannot die from hunger).
- Caves are less dangerous.

### 3.3 Normal
- Standard mob damage.
- Zombies can break wooden doors (regional difficulty > 50%).
- Spiders can poison (cave spiders always can).
- Hunger can deplete to 0; player takes damage down to 1 HP (cannot die from hunger).
- Wither effect from wither roses applies.

### 3.4 Hard
- Max mob damage.
- Zombies always break doors.
- Spiders always poison.
- Hunger can deplete to 0; player takes damage down to 0 HP (can die from hunger).
- Wither effect stronger.
- Raids harder (more illagers per wave).
- Warden can spawn (deep dark).

### 3.5 Hardcore
- Same as Hard, but locked. Death = spectator-only.

### 3.6 Regional Difficulty
A per-chunk value based on:
- Inhabited time (how long players have been near this chunk)
- Moon phase
- World difficulty

Affects:
- Mob equipment chance (zombies with swords, skeletons with helmets)
- Zombie villager conversion chance (50% on Hard, lower on easier)
- Skeleton accuracy
- Spider poison chance

Formula: `regional = (clampedRegionalTime * 0.25) / 3600000 * (currentDifficulty * 1.25) + moonPhaseFactor + 0.5`
Where clampedRegionalTime is in ticks (cap at 3,600,000 = 50 hours).

## 4. Camera Modes (CRITICAL)

### 4.1 Camera States
Three states, cycled with F5 key:
1. **First-person**: camera at player eye (Y = player.y + 1.62). Player model hidden.
2. **Third-person back**: camera 3 blocks behind player, looking at player's back. Player model visible.
3. **Third-person front**: camera 3 blocks in front of player, looking at player's face. Player model visible.

### 4.2 Implementation

```javascript
// src/player/CameraController.js
export class CameraController {
  constructor(camera, player) {
    this.camera = camera;
    this.player = player;
    this.mode = 'first';  // 'first' | 'third-back' | 'third-front'
    this.thirdPersonDistance = 3.0;
    this.targetDistance = 3.0;
    this.transitionTime = 0;  // for smooth interpolation
  }
  
  toggleCamera() {
    if (this.mode === 'first') this.mode = 'third-back';
    else if (this.mode === 'third-back') this.mode = 'third-front';
    else this.mode = 'first';
    this.transitionTime = 250;  // ms
  }
  
  update(dt) {
    if (this.transitionTime > 0) {
      this.transitionTime -= dt * 1000;
    }
    
    const eyePos = this.player.position.clone();
    eyePos.y += 1.62;  // eye height
    
    if (this.mode === 'first') {
      this.camera.position.copy(eyePos);
      this.camera.rotation.copy(this.player.rotation);
      this.player.model.visible = false;
    } else {
      const dir = this.mode === 'third-back' ? -1 : 1;
      const offset = new THREE.Vector3(
        Math.sin(this.player.rotation.y) * Math.cos(this.player.rotation.x) * this.thirdPersonDistance * dir,
        -Math.sin(this.player.rotation.x) * this.thirdPersonDistance * dir,
        Math.cos(this.player.rotation.y) * Math.cos(this.player.rotation.x) * this.thirdPersonDistance * dir
      );
      const targetPos = eyePos.clone().sub(offset);  // for back: camera behind player
      
      // Camera collision: raycast from player to target; if hit, pull camera in
      const ray = new THREE.Raycaster(eyePos, offset.clone().normalize(), 0, this.thirdPersonDistance);
      const intersects = ray.intersectObjects(this.world.getCollisionMeshes());
      if (intersects.length > 0) {
        targetPos.copy(intersects[0].point);
      }
      
      this.camera.position.copy(targetPos);
      this.camera.lookAt(eyePos);
      this.player.model.visible = true;
    }
  }
}
```

### 4.3 Acceptance Criteria
- [ ] F5 cycles: first → third-back → third-front → first.
- [ ] Camera transition is smooth (250ms interpolation).
- [ ] In third-person, camera doesn't clip through walls (raycast collision).
- [ ] In third-person, player model is visible (head, body, arms, legs — all 8 limbs articulated).
- [ ] In third-person front, player's face is visible.
- [ ] Mouse look works in all 3 modes.
- [ ] Movement direction is relative to camera in third-person (W = away from camera).
- [ ] In Spectator mode, third-person camera can clip through blocks (free camera).

## 5. Movement & Controls

### 5.1 Default Keybindings

| Action | Key | Notes |
|---|---|---|
| Move forward | W | |
| Move backward | S | |
| Strafe left | A | |
| Strafe right | D | |
| Jump | Space | double-tap to fly in Creative |
| Sneak | Left Shift | hold, or toggle in options |
| Sprint | Left Ctrl | double-tap W also sprints |
| Inventory | E | |
| Drop item | Q | |
| Swap hands | F | |
| Hotbar 1-9 | 1-9 | |
| Attack/Destroy | Left Mouse (hold) | continuous mining |
| Use/Place | Right Mouse | |
| Pick block | Middle Mouse | copies targeted block |
| Camera toggle | F5 | cycle first/third/third-front |
| Sneak-exit | Shift + right-click | place block on container without opening |
| Chat | T | opens chat input |
| Command | / | opens chat with `/` pre-filled |
| Screenshot | F2 | saves PNG |
| Toggle fullscreen | F11 | |
| Pause menu | Esc | |
| Debug overlay | F3 | toggle |
| Show hitboxes | F3 + B | |
| Show chunk borders | F3 + G | |
| Spectator teleport | number keys | in spectator mode |

### 5.2 Movement Physics

| State | Speed (blocks/sec) | Notes |
|---|---|---|
| Walk | 4.317 | default |
| Sprint | 5.612 | 30% faster, FOV widens slightly |
| Sneak | 1.3 | prevents walking off edges |
| Fly (Creative) | 11.0 | double-tap Space to toggle |
| Sprint-fly (Creative) | 22.0 | hold sprint |
| Swim (horizontal) | 4.0 | slightly slower than walk |
| Swim (vertical, down) | 4.0 | sink |
| Swim (vertical, up) | 4.0 | press space |
| Sneak-fly (Creative) | 2.2 | hold sneak |
| Elytra glide | varies | based on angle, max ~67 horizontal |

### 5.3 Jump Mechanics
- Jump velocity: 0.42 blocks/tick × 20 TPS = ~8.4 blocks/sec upward initial.
- Jump height: 1.25 blocks (can jump onto 1-block-high step).
- Sprint-jump: covers 4 blocks horizontally (vs 3 walking).
- Jump fatigue: landing on slime bounces; on hay bale reduces fall damage.

### 5.4 Fall Damage
- Fall distance > 3 blocks → damage.
- Damage = (fall_distance - 3) × 1 HP per block.
- Feather Falling enchant: reduces by 12% per level (max 48% at IV).
- Landed in water: no damage.
- Landed on slime block: no damage, bounce instead.
- Landed on hay bale: 80% damage reduction.
- Landed on sweet berry bush: 100% damage reduction (you take berry damage instead).
- Landed on cobweb: no damage, slowed.

## 6. Inventory & Crafting

### 6.1 Inventory Layout
- 36 main inventory slots (3 rows of 9, top half).
- 9 hotbar slots (bottom row, always visible).
- 4 armor slots (helmet, chestplate, leggings, boots).
- 1 offhand slot (right hand if main is left-handed? Actually offhand is left).
- 1 crafting result slot (in inventory 2x2 grid).
- 4 crafting input slots (2x2 grid in inventory; 3x3 grid in crafting table).

### 6.2 Inventory Interactions
- **Click item**: pick up stack (cursor holds it).
- **Click again**: place stack in slot (or merge if same item).
- **Right-click**: pick up half / place one.
- **Left-drag**: distribute evenly across dragged slots.
- **Right-drag**: place one in each dragged slot.
- **Shift-click**: move stack to other inventory (inv → hotbar or vice versa).
- **Shift-click in crafting output**: craft as many as possible, move to inventory.
- **Number key 1-9**: swap hotbar slot with hovered slot.
- **F**: swap main hand ↔ offhand.
- **Q**: drop hovered stack (or single item if ctrl+Q).
- **Outside inventory click**: drop stack on ground.

### 6.3 Crafting System

#### 6.3.1 Recipe Matching Algorithm
```javascript
function matchRecipe(grid, registry) {
  // grid is 3x3 array of {itemId, count} (null for empty)
  // Try shaped recipes first
  for (const recipe of registry.shaped) {
    if (matchesShaped(grid, recipe)) return recipe.result;
  }
  // Then shapeless
  for (const recipe of registry.shapeless) {
    if (matchesShapeless(grid, recipe)) return recipe.result;
  }
  return null;
}

function matchesShaped(grid, recipe) {
  // recipe.pattern is array of strings like ["XXX", " X ", "XXX"]
  // recipe.key maps chars to item IDs
  // Check that grid matches pattern exactly (after trimming empty rows/cols)
  const trimmedGrid = trimEmptyEdges(grid);
  const trimmedPattern = trimEmptyEdges(recipe.pattern);
  
  if (trimmedGrid.length !== trimmedPattern.length) return false;
  if (trimmedGrid[0].length !== trimmedPattern[0].length) return false;
  
  for (let r = 0; r < trimmedGrid.length; r++) {
    for (let c = 0; c < trimmedGrid[r].length; c++) {
      const cell = trimmedGrid[r][c];
      const patternChar = trimmedPattern[r][c];
      const expected = patternChar === ' ' ? null : recipe.key[patternChar];
      if ((cell?.itemId ?? null) !== expected) return false;
    }
  }
  return true;
}
```

#### 6.3.2 Recipe Unlocking (1.20+)
- Recipes unlock when player picks up certain ingredients (e.g., pick up iron ingot → unlocks iron tools/armor recipes).
- Recipe unlocks stored in player save data.
- Toast notification appears on unlock.
- Recipe book panel in inventory shows all unlocked recipes.
- Show all recipes (cheat): if `doLimitedCrafting` is false (default), show all unlocked recipes.

### 6.4 Crafting Stations

| Station | Grid | Notes |
|---|---|---|
| Player inventory | 2x2 | basic recipes (planks, sticks, crafting table, basic tools) |
| Crafting Table | 3x3 | all recipes |
| Furnace | 1 input + 1 fuel + 1 output | smelting |
| Blast Furnace | 1+1+1 | smelting ores only, 2x faster |
| Smoker | 1+1+1 | food only, 2x faster |
| Stonecutter | 1 input + 1 output | stone variants, more efficient |
| Smithing Table | 3 input (template + gear + material) | netherite upgrade + armor trim |
| Loom | 3 input (banner + dye + pattern) | banner patterns |
| Cartography Table | 2 input | map zoom/copy/lock/locator |
| Anvil | 3 input (left + right + name) | repair + combine + rename |
| Grindstone | 2 input | disenchant + repair bonus |
| Brewing Stand | 4 input (3 bottles + 1 ingredient) + 1 fuel | brewing |

## 7. Mob Implementation Spec

### 7.1 Mob Categories & Spawning

| Category | Spawn condition | Examples |
|---|---|---|
| Passive (overworld) | Day, surface, light > 7 | cow, pig, sheep, chicken |
| Passive (water) | Water, day | cod, salmon, squid, dolphin |
| Hostile (overworld) | Dark (light 0), night or cave | zombie, skeleton, creeper, spider |
| Hostile (water) | Dark water | drowned |
| Hostile (nether) | Nether, any light | zombie pigman, blaze, ghast, wither skeleton |
| Hostile (end) | End | enderman, shulker |
| Neutral | Spawn like passive/hostile, aggro on trigger | enderman, wolf, piglin |
| Tamable | Same as passive | wolf, cat, horse |
| Boss | Special | ender dragon (End center), wither (player-summoned), warden (deep dark sculk) |

### 7.2 Spawn Algorithm (per chunk, per tick)

```javascript
function tickMobSpawning(world, chunks) {
  // Hostile mob cap: 70 (scales with chunks loaded)
  // Passive mob cap: 10
  // Water mob cap: 5
  // Ambient mob cap: 15 (bats)
  
  for (const chunk of chunks) {
    if (Math.random() < 0.05) {  // 5% per chunk per tick
      // Pick random position in chunk
      const x = chunk.cx * 16 + Math.floor(Math.random() * 16);
      const z = chunk.cz * 16 + Math.floor(Math.random() * 16);
      const y = findSpawnY(world, x, z);
      
      // Check spawn rules
      const biome = world.getBiome(x, y, z);
      const light = world.getBlockLight(x, y, z);
      const sky = world.getSkyLight(x, y, z);
      
      const mobType = pickMobType(biome, light, sky, time, difficulty);
      if (mobType && world.mobCount(mobType.category) < mobType.cap) {
        // Spawn pack (1-4 mobs)
        const packSize = 1 + Math.floor(Math.random() * 4);
        for (let i = 0; i < packSize; i++) {
          world.spawnMob(mobType, x + randOffset(), y, z + randOffset());
        }
      }
    }
  }
}
```

### 7.3 Mob AI Examples (Critical Path)

#### Zombie
- Goals (priority order):
  1. `MeleeAttackPlayer` (target players within 16 blocks, walk to them, attack)
  2. `MoveToVillage` (search for wooden doors, break them on Hard)
  3. `HuntVillagers` (target villagers within 8 blocks)
  4. `FleeFromSun` (when in sunlight, run to shade)
  5. `WanderAround` (random walk)
  6. `LookAtPlayer` (head turns toward player)
- Attack: 3 HP (Easy 2, Normal 3, Hard 4)
- Speed: 4.3 blocks/sec (same as player walk)
- Health: 20 HP
- Drops: rotten flesh (0-2), rare iron ingot/carrot/potato (2.5%), iron shovel/sword (5% + 1% per difficulty level)
- Spawn: light level 0, any overworld biome except mushroom fields
- Burns in sunlight (top block sky light = 15, helmet prevents)
- Can break wooden doors on Hard / regional difficulty > 50%
- Converts to drowned if underwater 30+ sec
- Converts to husk if in desert too long (or vice versa)

#### Creeper
- Goals:
  1. `Swell` (when within 1.2 blocks of player, expand + 1.5s fuse → explode)
  2. `MeleeAttackPlayer` (not attack — just walk toward player)
  3. `FleeFromOcelot` (run from cats/ocelots)
  4. `WanderAround`
- Health: 20 HP
- Explosion: 3x3x3 hole at ground, damage falls off with distance.
  - Easy: 25 HP at center
  - Normal: 49 HP
  - Hard: 73 HP
  - Charged (lightning strike): 2x damage and radius
- Drops: gunpowder (0-2), music disc (if killed by skeleton arrow)
- Spawn: same as zombie
- Does NOT burn in sunlight
- Hissing sound during fuse

#### Villager
- Brain-based (not goals)
- Activities: WORK, PLAY, REST, MEET, IDLE, FLEE
- Memories: nearest job site, nearest bed, nearest player, last gossip, current path
- Schedules by time:
  - 0-2000 (morning): WORK
  - 2000-9000 (day): WORK / MEET
  - 9000-11000 (evening): wander / IDLE
  - 11000-12000 (sunset): go to bed
  - 12000-24000 (night): SLEEP
- Professions: armorer, butcher, cartographer, cleric, farmer, fisherman, fletcher, leatherworker, librarian, mason, nitwit, shepherd, toolsmith, weaponsmith
- Each profession has trade table (tier 1-5): see `03-research-mobs.md` §8 for full trade tables
- Breeds with food (3 bread / 12 carrots / 12 potatoes / 12 beetroots)
- Baby grows in 20 minutes
- Can be zombified (zombie villager), cured with weakness + golden apple

#### Ender Dragon (Boss)
- 5 phases:
  1. **CIRCLING**: dragon flies in circle around island, attacks end crystals periodically
  2. **STRAFING**: dragon dives at player, breathes dragon breath projectile
  3. **PERCHING**: dragon lands on end portal frame, breathes dragon breath cone
  4. **FLYING_TO_PORTAL**: dragon returns to perch
  5. **TAKING_OFF**: dragon leaves perch after taking damage
- Health: 200 HP (100 hearts)
- End crystals heal dragon (player must destroy them)
- 4 corner crystals are caged (need to climb pillar + break iron bars)
- Death: ascends to Y=100, explodes into XP, reveals exit portal with dragon egg
- After death: end gateway portals spawn (throw player to outer islands)
- Resummon: place 4 end crystals on portal sides → respawns dragon + crystals

## 8. Nether Dimension Spec

### 8.1 Portal Mechanics
- Build obsidian frame: 4 wide × 5 tall (minimum 2x3 interior, max 23x23).
- Use flint and steel to ignite.
- Purple portal blocks fill the frame.
- Stepping in: 4 sec teleport (1 sec in creative).
- Coordinate scale 8:1 (Nether X=10 → Overworld X=80).
- Portal search: scan 128-block radius in destination dimension for existing portal. If none, generate new one.
- Cooldown: 300 ticks (15 sec) after teleport before re-teleport.

### 8.2 Nether Properties
- Y range: 0-127 usable (1.18+ supports 0-384 but generation only 0-127 by default).
- Bedrock ceiling at Y=127 (overworld-style) — but in 1.18+ this was expanded; check.
- Lava sea at Y=31.
- Netherrack terrain (red).
- Biomes: nether wastes, soul sand valley, crimson forest, warped forest, basalt deltas.
- Mobs: zombified piglin (50%), ghast (5%), magma cube (10%), piglin (10%), blaze (in fortresses), wither skeleton (in fortresses), hoglin (in crimson forest).
- Beds explode (do not set spawn).
- Water evaporates instantly.
- Respawn anchor (charging with glowstone) sets spawn.
- Compass spins randomly (no north).
- Maps don't work (unless with locator + lodestone).

## 9. End Dimension Spec

### 9.1 Access
- Find stronghold (eye of ender leads to it; rings of strongholds at 1280-2816+ blocks from spawn).
- 12 end portal frames in portal room; place eye of ender in each (some pre-filled).
- Stepping in: instant teleport to End central island, on obsidian platform.
- No return except via end portal after dragon fight, or death.

### 9.2 End Properties
- Y range: 0-255.
- Fixed time: 6000 (noon) always.
- No weather.
- Void below Y=0 (instant death if fall).
- Central island: 100-block radius, with obsidian pillars (10 pillars, 8 with end crystals).
- Outer islands: 1000 blocks away, accessible via end gateway portals (post-dragon fight).
- End city structures on outer islands: contain shulkers, loot, elytra (in end ship).

### 9.3 Ender Dragon Fight
- See §7.3 Ender Dragon.
- After kill: exit portal opens with dragon egg on top.
- 4 end gateway portals spawn (one per cardinal direction), throw player to outer islands.
- Dragon can be resummoned (4 end crystals on portal sides).

## 10. Redstone Spec

### 10.1 Power System
- Power levels: 0-15.
- Power sources output 15 (except daylight sensor / comparator which can output 0-15).
- Redstone dust: power decreases by 1 per block traveled (so 15-block max length).
- Power propagates: through solid blocks (redstone dust adjacent to solid block powers it), up slabs/stairs, through 1-block gaps.
- Quasi-connectivity (Java only): a piston can be powered by redstone 1 block above it, even if not directly adjacent.

### 10.2 Components
| Component | Input | Output | Behavior |
|---|---|---|---|
| Lever | manual | 15 | constant power until toggled |
| Button (wood) | manual | 15 | 1.5 sec pulse |
| Button (stone) | manual | 15 | 1.0 sec pulse |
| Pressure plate (wood) | entity | 15 | power while entity stands |
| Pressure plate (stone) | entity | 15 | power while entity stands (no items) |
| Pressure plate (light) | entity count | 1-15 | scales with items |
| Pressure plate (heavy) | entity count | 1-15 | scales with items (more weight per item) |
| Tripwire | entity | 15 | power while entity in tripwire |
| Daylight sensor | sky light | 0-15 | power scales with daylight |
| Observer | block change | 15 | 1-tick pulse when adjacent block changes |
| Sculk sensor | vibration | 15 | 1-2 sec pulse on vibration |
| Comparator | input A + B | A-B or A | compare mode: A>=B output A; subtract mode: output A-B |
| Repeater | input | output 15 | 1-4 tick delay, locks signal direction |
| Redstone torch | none | 15 (off when powered) | inverts signal |
| Piston | power | push | pushes up to 12 blocks |
| Sticky piston | power | push/pull | same, but pulls back on depower |
| Dispenser | power | use item | uses contained item (shoots arrow, places water, etc.) |
| Dropper | power | drop item | drops item as entity |
| Hopper | none | transfer | transfers items at 4/sec |

### 10.3 Redstone Tick
- Redstone runs at 10 TPS (every 100ms = 2 game ticks).
- Each redstone update propagates through the network.
- Repeater delay: 1-4 redstone ticks = 0.1-0.4 sec.
- Use BFS from "dirty" sources each tick.

## 11. Enchanting Spec

### 11.1 Enchanting Table
- Place 15 bookshelves within 2 blocks (chebyshev distance) at same Y level.
- Right-click table → 3 enchantment slots appear.
- Slot 1: costs 1 level + 1 lapis.
- Slot 2: costs 2 levels + 2 lapis.
- Slot 3: costs 3 levels + 3 lapis (requires level 30).
- Enchantments offered depend on:
  - Player's enchantment seed (random per player).
  - Slot level (1, 4, 7, ..., 30).
  - Item type (sword gets Sharpness, pickaxe gets Efficiency, etc.).
- Re-roll: enchant another item to get new offers.

### 11.2 Anvil
- 3 input slots: target item, sacrifice item, name.
- Combines enchantments from sacrifice onto target.
- Costs XP levels based on:
  - Enchantment count + level (each enchant = X levels where X = enchant cost × level).
  - Prior work penalty: each anvil use adds 2^(uses-1) levels to next cost.
- "Too Expensive" cap: 39 levels (or 40+ in Creative).
- Anvil takes 12% durability damage per use; breaks when durability = 0.
- Three tiers: anvil → chipped anvil → damaged anvil (each use has chance to degrade).

### 11.3 Enchantment Table Offerings
When player right-clicks enchanting table:
1. Calculate slot levels: `slotLevel = (playerLevel >= 30 ? 30 : playerLevel) * [1, 0.5, 0.25]` approximately.
2. For each slot, generate enchantment seed: `slotSeed = enchantmentSeed + slotLevel * 1000 + slotIndex * 100`.
3. Pick enchantments based on slot level + item type (each enchantment has min/max slot level range).
4. Show 3 enchantments (one per slot), displayed in Standard Galactic Alphabet (or just Roman numerals if SG not implemented).

## 12. Brewing Spec

### 12.1 Brewing Stand
- 4 input slots: 3 bottles + 1 ingredient.
- 1 fuel slot: blaze powder (20 brews per powder).
- 20-second brew time per ingredient.
- Output: 3 modified potions (one per bottle).

### 12.2 Recipe Tree
```
Water Bottle
   ↓ + Nether Wart
Awkward Potion
   ↓ + Ghast Tear
Potion of Healing
   ↓ + Glowstone
Potion of Healing II
   ↓ + Redstone
Potion of Healing (extended, but healing doesn't extend — so no)
   ↓ + Gunpowder
Splash Potion of Healing
   ↓ + Dragon's Breath
Lingering Potion of Healing
```

(See `06-research-mechanics.md` §7 for the full recipe tree.)

### 12.3 Effect Potions
Each effect has:
- Duration (default, extended ×2, level II ×0.5)
- Amplifier (level 0 default, level 1 for II)
- Color (potion bottle tint)

## 13. Save/Load Spec

### 13.1 IndexedDB Schema

```javascript
// Database: voxelcraft-worlds
// Object stores:

const dbSchema = {
  worlds: {  // world metadata
    keyPath: 'id',
    indexes: ['name', 'lastPlayed']
  },
  chunks: {  // chunk block data
    keyPath: 'key',  // format: "worldId:dim:cx:cz"
  },
  player: {  // per-world player state
    keyPath: 'worldId',
  },
  entities: {  // per-world entities (mobs, items)
    keyPath: 'key',  // format: "worldId:entityId"
  },
  blockEntities: {  // per-world block entities (chests, signs, hoppers)
    keyPath: 'key',  // format: "worldId:x:y:z"
  },
};
```

### 13.2 Save Triggers
- Player sleeps (skip night).
- Player presses Esc → Save and Quit.
- Auto-save every 30 seconds (only modified chunks).
- Chunk unload (when player moves away).
- Before browser tab close (`beforeunload` event).

### 13.3 Save Format
Each chunk compressed with `LZ4` or `gzip` (use `pako` library, ~10KB). Block IDs stored as `Uint8Array` (raw bytes). Block states as separate `Uint8Array`. Light array as `Uint8Array`.

### 13.4 World List
Main menu shows world list:
- World name
- Game mode + difficulty icon
- Last played timestamp
- Hardcore indicator (heart icon)
- Delete button (with confirmation)
- Click to play → loading screen → spawn at last position

## 14. Options Menu Spec

(See `09-research-settings.md` for the full reference. Here we summarize structure.)

### 14.1 Tabs
1. **Video** (render distance slider, graphics mode, smooth lighting, FOV, etc.)
2. **Controls** (collapsible categories: movement, gameplay, inventory, multiplayer, creative, misc)
3. **Audio & Music** (10 channel sliders + device selector + subtitles toggle)
4. **Language** (selector for en_us, en_gb, zh_cn, de_de, fr_fr, es_es, ja_jp, ko_kr, ru_ru, pt_br)
5. **Chat** (visibility, colors, links, opacity, narrator)
6. **Accessibility** (text background, delay, distortion effects, FOV effects, narrator, high contrast)
7. **Skin** (skin selector, layer toggles, slim/classic model)
8. **Resource Packs** (list of packs, drag-drop ZIPs, enable/disable)
9. **Telemetry** (level selector, opt-in/out)

### 14.2 Settings Storage
- Global settings → `localStorage` (key: `voxelcraft:options`, value: JSON).
- Per-world settings (gamerules) → IndexedDB (in `worlds` store).
- Hot-swap: most settings apply instantly. Render distance requires chunk reload (show toast: "Render distance change will apply after world reload").

### 14.3 Defaults (must match vanilla 1.21)

```javascript
const DEFAULT_OPTIONS = {
  // Video
  renderDistance: 12,
  graphicsMode: 1,  // 0=Fast, 1=Fancy, 2=Fabulous
  ao: 2,  // 0=OFF, 1=MIN, 2=MAX
  maxFps: 120,
  vsync: true,
  fov: 70,
  fovEffect: 100,  // %
  gamma: 0.5,  // 0=Moody, 1=Bright
  viewBobbing: true,
  guiScale: 0,  // 0=Auto, 1-4
  attackIndicator: 1,  // 0=OFF, 1=CROSSHAIR, 2=HOTBAR
  clouds: 1,  // 0=OFF, 1=Fast, 2=Fancy
  particles: 0,  // 0=All, 1=Decreased, 2=Minimal
  mipmapLevels: 2,
  entityShadows: true,
  entityDistance: 100,  // %
  biomeBlend: 2,  // 0-7
  distortionEffect: 100,
  darknessEffect: 100,
  hideLightOpacity: false,
  
  // Audio
  masterVolume: 1.0,
  musicVolume: 1.0,
  ambientVolume: 1.0,
  blockVolume: 1.0,
  hostileVolume: 1.0,
  friendlyVolume: 1.0,
  playerVolume: 1.0,
  recordsVolume: 1.0,
  weatherVolume: 1.0,
  jukeboxVolume: 1.0,
  showSubtitles: false,
  
  // Controls
  sensitivity: 1.0,  // 0.0-2.0
  invertY: false,
  autoJump: false,
  sneakToggle: false,
  sprintToggle: false,
  keyBindings: { /* see defaults */ },
  
  // Language
  language: 'en_us',
  forceUnicodeFont: false,
  
  // Chat
  chatVisibility: 0,  // 0=show, 1=commands only, 2=hidden
  chatColors: true,
  chatLinks: true,
  chatLinksPrompt: true,
  chatOpacity: 1.0,
  textOpacity: 1.0,
  chatLineSpacing: 0.0,
  chatDelay: 0.0,
  commandSuggestions: true,
  narrator: 0,  // 0=off, 1=system, 2=chat, 3=both
  
  // Accessibility
  textBackground: true,
  textBackgroundOpacity: 0.5,
  toastNotificationTime: 5.0,
  panoramaScrollSpeed: 1.0,
  monochromeLogos: false,
  highContrast: false,
  
  // Skin
  skin: 'steve',
  modelType: 'classic',  // 'classic' | 'slim'
  layers: {
    hat: true, jacket: true, sleeves: true, leggings: true,
    cape: true, rightSleeve: true, leftSleeve: true,
    rightLeg: true, leftLeg: true
  },
};
```

## 15. Commands Spec

(See `06-research-mechanics.md` §12 for full list. Here we spec the most-used.)

### 15.1 Command Parser
```
/gamemode <mode> [target]       → switch gamemode (target = @s or self)
/difficulty <difficulty>         → switch difficulty
/time set <value>                → set world time (day=1000, night=13000, noon=6000, midnight=18000)
/time add <value>                → add to world time
/time query <day|daytime|gametime>
/weather <clear|rain|thunder> [<duration>]
/give <player> <item> [<count>] [<nbt>]
/clear [<player>] [<item>] [<count>]
/summon <entity> [<x> <y> <z>] [<nbt>]
/kill [<target>]
/tp <target> [<x> <y> <z>] [<yRot> <xRot>]
/teleport <target> [<x> <y> <z>]
/effect <give|clear> <player> [<effect>] [<duration>] [<amplifier>] [<hideParticles>]
/enchant <player> <enchantment> [<level>]
/gamerule <rule> [<value>]
/seed
/setblock <x> <y> <z> <block> [<mode>]
/fill <x1> <y1> <z1> <x2> <y2> <z2> <block> [<mode>]
/clone <x1> <y1> <z1> <x2> <y2> <z2> <x> <y> <z> [<mode>]
/particle <name> <x> <y> <z> [<dx> <dy> <dz>] [<speed>] [<count>]
/playsound <sound> <source> <player> [<x> <y> <z>] [<volume>] [<pitch>] [<minVolume>]
/title <player> <title|subtitle|actionbar> <text>
/tellraw <player> <json>
/xp <amount> [<player>]
/advancement <grant|revoke> <player> <only|until|from|through|everything> [<advancement>] [<criterion>]
```

### 15.2 Target Selectors
- `@p` - nearest player
- `@s` - self (command executor)
- `@a` - all players
- `@e` - all entities
- `@r` - random player
- With args: `@e[type=zombie,distance=..10]` - all zombies within 10 blocks

## 16. Performance Auto-Detection

```javascript
function detectDeviceTier() {
  const gl = document.createElement('canvas').getContext('webgl2');
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
  
  const cpus = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 4;
  
  // GPU tier detection
  let gpuTier = 'low';
  if (renderer.includes('rtx') || renderer.includes('radeon rx 6') || renderer.includes('apple m1')) {
    gpuTier = 'ultra';
  } else if (renderer.includes('gtx 1') || renderer.includes('radeon rx 5')) {
    gpuTier = 'high';
  } else if (renderer.includes('gtx 9') || renderer.includes('intel iris')) {
    gpuTier = 'mid';
  }
  
  // Run quick benchmark (1 sec)
  const fps = benchmarkRender();
  
  if (gpuTier === 'ultra' && cpus >= 8 && memory >= 16) return 'ultra';
  if (gpuTier === 'high' && cpus >= 6 && memory >= 8) return 'high';
  if (gpuTier === 'mid' && cpus >= 4 && memory >= 4) return 'mid';
  return 'low';
}

const TIER_PRESETS = {
  ultra:  { renderDistance: 24, graphicsMode: 2, particles: 0, ao: 2, entityDistance: 200 },
  high:   { renderDistance: 16, graphicsMode: 1, particles: 0, ao: 2, entityDistance: 150 },
  mid:    { renderDistance: 12, graphicsMode: 1, particles: 1, ao: 1, entityDistance: 100 },
  low:    { renderDistance: 6,  graphicsMode: 0, particles: 2, ao: 0, entityDistance: 75  },
};
```
