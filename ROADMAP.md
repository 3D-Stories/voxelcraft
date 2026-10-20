# VoxelCraft — Minecraft Parity Roadmap

A living checklist of everything needed to reach **Minecraft Java Edition 1.21.x parity**.
Status legend: `[x]` done · `[~]` partial / simplified · `[ ]` missing · `[!]` blocked on a decision or asset.

> Game code lives in `src/`; the authoritative values are in `docs/01`–`docs/12`.
> When an item lands, mark it here and note the commit. Keep entries small enough to finish in one sitting.

**Snapshot:** Phase 1 (vertical slice) is live at https://voxelcraft-3d-stories.vercel.app/.
The survival loop starts to work: drops, inventory, two tool tiers, recipe-list crafting.

---

## 1. World & Terrain

### 1.1 Dimensions
- [x] Overworld dimension, Y −64…320, sea level 63
- [ ] Nether dimension (Y 0…256, lava sea, bedrock roof/floor)
- [ ] End dimension (central island, outer islands, void)
- [ ] Nether portals (obsidian frame, 4×5, 1:8 coordinate scaling, 2 s transition)
- [ ] End portals (stronghold frame, end gateway)
- [ ] Return portals / respawn anchors
- [ ] Per-dimension sky, fog, ambient light and mob spawning
- [ ] Dimension travel keeps inventory/XP; portal cooldowns

### 1.2 Terrain generation
- [x] Deterministic seeded simplex terrain
- [x] Plains / forest / desert biomes with oak trees
- [ ] 3D multi-noise terrain (continentalness, erosion, peaks & valleys, temperature, humidity)
- [ ] All ~60 Overworld biomes from `docs/04`
- [ ] Caves, ravines, aquifers, underground water/lava lakes
- [ ] Deepslate below Y=0, bedrock floor at Y −64
- [ ] Ore veins (coal, copper, iron, gold, redstone, lapis, diamond, emerald, ancient debris)
- [ ] Geodes, fossils, clay, gravel, moss, dripstone, lush caves
- [ ] Rivers and oceans (water bodies at sea level, biome beaches)
- [ ] Snow/ice biomes, snow layers, powder snow
- [ ] Surface rules per biome (sand, red sand, terracotta, podzol, mycelium, mud)
- [ ] Nether terrain + biomes; End islands
- [ ] Biome blending and smooth climate transitions
- [ ] Structures (see §5)
- [ ] `/seed`-style reproduction and world export

### 1.3 Fluids
- [~] Still water block, swimming/sinking, placed by the player
- [ ] Flowing water (levels 0–7), source blocks, slope spread
- [ ] Waterlogged blocks
- [ ] Lava (flow, damage, light 15, obsidian/cobblestone interaction)
- [ ] Buckets (water/lava/milk/powder snow), cauldrons
- [ ] Water physics: flow push, bubble columns, magma, soul sand
- [ ] Ice/blue ice friction, frost walker

### 1.4 Weather & time
- [x] 20-minute day/night cycle, sun/moon/stars, sky tint, fog
- [ ] Moon phases (8), stars dimming by light
- [ ] Weather: rain, snow, thunder, lightning, sky darkening
- [ ] Rain extinguish fires, water cauldrons, fill farmland
- [ ] Clouds (2D layer) and cloud shadows
- [ ] Sleeping through the night; beds set spawn (see §4.7)
- [ ] `/time`, `/weather` commands later (§9)

---

## 2. Rendering & Performance

- [x] Three.js renderer, 16×16 procedural texture atlas, pixelated filtering
- [x] Greedy meshing, per-face textures, shader-side atlas tiling
- [x] Circular render-distance chunk streaming (2 chunks/frame)
- [~] Vertex-baked lighting (colors are white; no sky/block light yet)
- [ ] Sky-light BFS + block-light BFS, 4-bit nibbles, cross-chunk propagation
- [ ] Smooth lighting / ambient occlusion per vertex
- [ ] Block models: stairs, slabs, fences, walls, doors, trapdoors, panes, carpets, buttons, levers, rails, torches, signs
- [ ] Transparent/translucent water and glass (separate render pass)
- [ ] Animated textures (water, lava, fire, portal, sea lantern)
- [ ] Particles (break, hit, splash, smoke, flame, crit, portal, weather)
- [ ] Clouds, distant fog, void sky
- [ ] Chunk meshing in Web Workers (OffscreenCanvas where available)
- [ ] Frustum culling + occlusion culling
- [ ] LOD or farther render distances without frame spikes
- [ ] Entity rendering (mobs, items, projectiles) with animation
- [ ] First/third-person camera (F5), camera collision
- [ ] Debug overlay (F3): FPS, coords, chunk, biome, light, memory
- [ ] Screenshot (F2), fullscreen (F11), zoom (C)
- [ ] Quality settings: render distance, graphics (fast/fancy/fabulous), particles, clouds, VSync

---

## 3. Blocks (target ~800)

Current block set: stone, grass, dirt, sand, oak log, oak leaves, water, oak planks, crafting table.

- [ ] Full block registry with block states (facing, waterlogged, powered, half, shape, …)
- [ ] Natural: gravel, clay, sandstone, red sand, terracotta sets, deepslate set, tuff, calcite, dripstone, moss, mud, snow, ice, packed/blue ice, obsidian, bedrock, magma, soul sand/soil, netherrack, basalt, blackstone, end stone, purpur…
- [ ] Ores + deepslate variants; raw ore blocks
- [ ] Woods ×11 (log, wood, stripped, planks, slabs, stairs, fences, gates, doors, trapdoors, signs, boats)
- [ ] Stone families (cobblestone, mossy, bricks, smooth, chiseled, slabs, stairs, walls)
- [ ] Copper oxidation stages + waxing
- [ ] Wool ×16, concrete/powder, terracotta ×16, glass/stained glass, glazed terracotta
- [ ] Plants: grass, ferns, flowers, saplings, mushrooms, cactus, sugar cane, bamboo, vines, lily pads, kelp, seagrass, coral
- [ ] Crops: wheat, carrots, potatoes, beetroot, melon, pumpkin, berries
- [~] Functional: crafting table and furnace done; chest, barrel, hopper, dispenser, dropper, observer, piston/sticky piston, note block, jukebox, lever, buttons, pressure plates, tripwire, target, daylight detector, sculk sensor, lightning rod, beacon, conduit, respawn anchor, lodestone, bells
- [ ] Lighting: torches, lanterns, soul variants, campfire, candles, glowstone, sea lantern, shroomlight, froglight, amethyst
- [ ] Decoration: banners, paintings, item frames, armor stands, flower pots, bookshelves, chiseled bookshelf, lectern, cauldron, composter, beehive, bee nest
- [ ] Nether/End blocks, portal frames
- [ ] Block breaking drops with correct tools, fortune/silk touch behavior
- [ ] Block sounds (break/place/step)
- [ ] Block tags (mineable/pickaxe, needs_stone_tool, logs, leaves, …)

---

## 4. Player

### 4.1 Movement
- [x] Walk 4.317 / sprint 5.612 / sneak 1.3 / jump 8.4, 1.2522-block apex
- [x] AABB collision, per-axis sweeping, gravity −32, terminal −78
- [~] Swim (basic up/down, 4 b/s), no water drag/momentum or bubble columns
- [ ] Sprint-jump momentum (4.225-block sprint jumps)
- [ ] Step height 0.6 auto-step (slabs) — no slabs yet
- [ ] Sneak edge protection
- [ ] Crawling/crawling hitbox (1.5 → 0.6)
- [ ] Climbing ladders/vines/scaffolding
- [x] Creative flight 11/22/2.2 b/s, vertical 4 (god mode)
- [ ] Elytra gliding + firework boost, flight damage
- [ ] Fall damage, safe landing in water/hay/slime/honey/powder snow
- [ ] Fluid movement (water/lava), Depth Strider, Dolphin's Grace
- [ ] Movement in cobwebs, sweet berry bushes, soul sand, honey
- [ ] Riding boats/minecarts/horses/pigs/striders
- [ ] 0.6×1.8 hitbox, 1.62 eye height (done), 1.5 sneak, 0.6 crawl
- [ ] Hand/arm animation, item in hand rendering
- [ ] F5 camera, third-person front

### 4.2 Health, hunger, air
- [x] 20 HP, fall/drown/starve/void damage, death screen + respawn
- [x] Fall damage, drowning, starvation, air meter + bubbles, damage flash
- [x] Hunger 20, saturation, exhaustion from moving/jumping/mining, regen
- [x] Death screen with respawn (inventory kept)
- [ ] Armor points/toughness, protection enchantments
- [ ] Fire/lava/suffocation/cactus/explosion/projectile/magic damage
- [ ] Damage cooldown (10 ticks), knockback, damage tilt
- [ ] Sprint gating at hunger ≤ 6, food variety/crops
- [ ] Air 300 ticks (currently 200 per docs), Respiration, water breathing
- [ ] Fire ticks, freezing, poison/wither/absorption
- [ ] Totem of undying, golden apples
- [ ] Experience: orbs, levels, enchanting costs, death drops (inventory is kept)

### 4.3 Combat
- [ ] Attack cooldown 1.6 (sword)/1.0 (hand), damage formula
- [ ] Critical hits, sweeping, knockback, sprint knockback
- [ ] Shields (blocking, disable on axe hit)
- [ ] Bows/crossbows, arrows (tipped/spectral), tridents, snowballs, eggs, ender pearls
- [ ] Mob targeting/damage/knockback
- [ ] Armor equip slots and durability
- [ ] Item durability + anvil repair + mending/unbreaking

### 4.4 Food & farming
- [~] Apples: eat with right-click, 4 hunger / 2.4 saturation; oak leaves 0.5% drop
- [ ] Eating animation/hold time, more foods
- [ ] Crops, growth stages, bone meal, hoe/tilling, hydration
- [ ] Animals breeding, eggs, milk, honey
- [ ] Cake, pumpkin pie, stews, fish

### 4.5 Inventory & items
- [x] 36-slot inventory, 9-slot hotbar, stack counts, selection
- [x] Drops from blocks, item consumption on place
- [~] Tools: wood/stone pickaxe/axe/shovel/sword, durability
- [ ] Full item registry (~1000 items), item tags
- [x] 2×2 crafting grid in inventory; 3×3 at a crafting table
- [x] Drag/drop, stack splitting, shift-click between hotbar/storage
- [ ] Number-key swap, drop key (Q), drag-to-distribute
- [ ] Armor slots (4) + offhand (1)
- [ ] Item tooltips (name, durability, enchantments, food)
- [ ] Item rarity colors, item entities on the ground, pickup delay
- [ ] Buckets, boats, minecarts, saddles, leads, name tags
- [ ] Tools: iron, diamond, netherite, gold; shears, flint & steel, fishing rod, compass, clock, spyglass, recovery compass
- [ ] Enchantments (all 1.21), anvil, grindstone, smithing table
- [ ] Potions, splash/lingering, brewing stand, ingredients
- [ ] Shulker boxes, ender chest, bundles

### 4.6 Crafting stations
- [x] Crafting table block
- [x] 2×2 / 3×3 grid crafting UI (shaped + shapeless matching)
- [ ] Recipe book with unlock toasts
- [x] Furnace (smelting 200 ticks, fuel, progress UI); XP pending
- [ ] Blast furnace, smoker
- [ ] Campfire cooking
- [ ] Stonecutter, loom, cartography table, fletching table, smithing table
- [ ] Brewing stand
- [ ] Enchanting table (+ bookshelves, lapis)
- [ ] Anvil (repair, combine, rename)
- [ ] Grindstone (disenchant, repair)
- [ ] Beacon, conduit effects

### 4.7 Status effects
- [ ] All 1.21 effects (speed, slowness, haste, mining fatigue, strength, instant health/damage, jump boost, nausea, regeneration, resistance, fire resistance, water breathing, invisibility, blindness, night vision, hunger, weakness, poison, wither, health boost, absorption, saturation, glowing, levitation, luck, unluck, slow falling, conduit power, dolphins grace, bad omen, hero of the village, darkness, oozing, weaving, wind charged, infested)
- [ ] Effect HUD icons + timers, milk clears
- [ ] Potions, beacons, conduits, totems

### 4.8 Sleep & spawn
- [ ] Beds, sleep through night, set spawn, explosions in Nether/End
- [ ] Respawn anchor, lodestone compass
- [ ] `/spawnpoint` later

---

## 5. Structures & World Features

- [ ] Villages (all 5 styles), houses, farms, wells, bells, villagers, iron golems
- [ ] Dungeons, mineshafts, ravines (structure parts)
- [ ] Strongholds (end portal room, libraries, silverfish)
- [ ] Woodland mansions, ocean monuments, buried treasure, shipwrecks, ruins, igloos, witch huts
- [ ] Pillager outposts, raids, illagers
- [ ] Nether fortresses, bastion remnants, ruined portals
- [ ] End cities, end ships, chorus plants
- [ ] Ancient cities (deep dark, sculk, warden)
- [ ] Trial chambers (1.21), vaults, trial spawners
- [ ] Ocean ruins, coral reefs, amethyst geodes
- [ ] Fossils, desert pyramids, jungle temples
- [ ] Mineshaft/stronghold jigsaw connectivity
- [ ] Loot tables (all containers + chests, fishing)
- [ ] Structure spacing/separation/salt + biome filters
- [ ] Feature placement (trees, flowers, ore veins, vegetation, lakes, springs)
- [ ] Snake/cave carvers, noise caves, aquifers
- [ ] Amethyst geodes, dripstone caves, lush caves

---

## 6. Mobs & Entities

### 6.1 Entity framework
- [ ] Base entity (position, velocity, AABB, gravity, collision)
- [ ] Living entity (health, effects, equipment, drops)
- [ ] Pathfinding (A* on voxel graph, jump/cost rules)
- [ ] Goal system (float, look, target, melee, avoid, panic)
- [ ] Spawning rules (light, biome, height, caps, despawn)
- [ ] Entity rendering + animations (head, limbs, walk cycle)
- [ ] Item entities, XP orbs, projectiles

### 6.2 Passive
- [ ] Cow, pig, sheep, chicken, rabbit, horse/donkey/mule, wolf, cat/ocelot, fox, panda, polar bear, turtle, axolotl, frog, bee, parrot, bat, squid/glow squid, dolphin, cod/salmon/tropical fish, goat, llama, camel, sniffer, armadillo, allay, snow golem, iron golem

### 6.3 Hostile
- [ ] Zombie/husk/drowned, skeleton/stray/bogged, creeper, spider/cave spider, enderman, witch, slime/magma cube, phantom, pillager/vindicator/evoker/illusioner/ravager, vex, blaze, ghast, wither skeleton, piglin/piglin brute/zombified piglin, hoglin/zoglin, guardian/elder guardian, shulker, silverfish/endermite, warden, breeze, bogged

### 6.4 Bosses
- [ ] Ender dragon (crystals, phases, perch, egg)
- [ ] Wither (spawn, shield phases, star)
- [ ] Elder guardian (mining fatigue)
- [ ] Warden (darkness, sonic boom)

### 6.5 Interactions
- [ ] Taming/breeding/baby growth, leads, saddles, feeding
- [ ] Villager professions/trades, restock, gossip, zombie curing
- [ ] Raids, bad omen, hero of the village
- [ ] Mob equipment, drops, XP, looting
- [ ] Combat AI (ranged, melee, creeper fuse, enderman teleport, spider climb)

---

## 7. Redstone

- [ ] Redstone dust (15 power, decay, connections, vertical)
- [ ] Redstone torch/block, lever, buttons, pressure plates
- [ ] Repeater (1–4 tick delay, locking), comparator (compare/subtract, containers)
- [ ] Pistons/sticky pistons, slime/honey block movement, move limits (12)
- [ ] Observer, daylight detector, sculk sensor, target block, tripwire
- [ ] Dispenser/dropper, hopper, dropper chains, item transport
- [ ] Rails (normal/powered/detector/activator), minecarts (chest/hopper/furnace/TNT)
- [ ] Note blocks, jukebox, bells
- [ ] Doors, trapdoors, fence gates (redstone)
- [ ] TNT, minecart TNT, detonator
- [ ] Redstone lamps, copper bulbs
- [ ] Entity interaction (minecart riders)
- [ ] Tick order/firing semantics close to vanilla

---

## 8. Commands & Chat

- [ ] Chat (T), command input (/), history
- [ ] `/help`, `/give`, `/time`, `/weather`, `/tp`, `/gamemode`, `/difficulty`, `/seed`, `/setblock`, `/fill`, `/clone`, `/summon`, `/kill`, `/clear`, `/effect`, `/enchant`, `/xp`, `/spawnpoint`, `/setworldspawn`, `/gamerule`, `/scoreboard`, `/tag`, `/team`, `/tellraw`, `/title`, `/playsound`, `/particle`, `/locate`, `/loot`, `/advancement`, `/recipe`, `/function` (optional)
- [ ] Command blocks, functions, execute
- [ ] Tab completion and error messages
- [ ] Operator/permission model (single-player: cheats toggle)

---

## 9. UI/UX

- [x] Loading screen with progress, error screen, WebGL fallback message
- [x] Crosshair, hotbar with icons/counts/durability, god-mode badge, hint bar
- [~] Inventory screen (36 slots + recipe list); no drag/drop or grids yet
- [ ] Title screen with splash text and panorama
- [ ] World select / create (name, seed, gamemode, cheats, difficulty)
- [ ] Pause menu (Esc), save & quit, options
- [ ] Options: video, audio, controls (rebindable), language, accessibility
- [ ] HUD: hearts, armor, hunger, XP bar/level, air bubbles, effect icons, crosshair modes
- [ ] Debug overlay (F3): FPS, coords, chunk, biome, light, memory, entity count
- [ ] Debug screens (F3+G chunk borders, F3+B hitboxes, F3+L noise)
- [ ] Item tooltips, durability, enchantment glow
- [ ] Recipe book, advancements screen + toasts
- [ ] Death screen with respawn/quit
- [ ] Chat window, command blocks UI
- [x] Furnace screen (input/fuel/output, flame and progress)
- [ ] Container screens: chest, barrel, hopper, brewing, enchanting, anvil
- [ ] Sign editing, book & quill
- [ ] Toast notifications (advancements, recipes)
- [ ] Language support (at least en_us; localization-ready strings)
- [ ] Mobile touch controls, gamepad support
- [ ] Fullscreen, zoom, screenshots
- [ ] FPS limiter, VSync, frame pacing, chunk-load screen

---

## 10. Audio

- [ ] Web Audio graph with master/category volumes (music, blocks, hostile, neutral, players, ambient, weather, UI, voice)
- [ ] Block break/place/step sounds per material
- [ ] Player hurt/death/splash/eat/burp
- [ ] Mob sounds (ambient/hurt/death/attack) for every mob
- [ ] Explosions, fire, lava, water, portal, redstone, note blocks
- [ ] Cave ambience, rain/thunder, wind
- [ ] Music discs + background music (CC0/CC-BY assets only)
- [ ] Positional audio (3D panning) + listener orientation
- [ ] Subtitles (optional)

---

## 11. Persistence & Platform

- [x] IndexedDB saves: player, time, inventory, compressed chunk edits
- [x] Autosave (30 s), on chunk unload, on tab hide; seed-keyed chunks
- [ ] Multiple worlds (list/create/delete/duplicate) per database
- [ ] World metadata: name, seed, gamemode, difficulty, version, playtime, last played
- [ ] Save format versioning + migration
- [ ] Export/import world as a file (backup/restore)
- [ ] Statistics screen + persistence
- [ ] Advancements persistence
- [ ] Settings persistence (localStorage), key bindings
- [ ] Performance budgets: gzip < 2 MB, FCP < 2 s, 60 FPS at render distance 8+
- [ ] Offline/PWA support (optional; static hosting already works)
- [ ] Error reporting / crash screen with copyable diagnostics
- [ ] Vercel preview/production deploy loop (done), cache headers, usage monitoring

---

## 12. Not planned (Minecraft features that need servers/other platforms)

- [ ] Multiplayer / Realms / LAN (spec says 100% client-side; likely out of scope)
- [ ] Marketplace / Bedrock cross-play
- [ ] Mod loader / data packs (could be a sandboxed JS API later)
- [ ] Realms, social features, telemetry

> If the goal ever changes for any of these, move the item into the relevant section and add a design note.

---

## Milestones

| # | Milestone | Scope | Status |
|---|---|---|---|
| M1 | **First playable** | chunks, player, break/place, HUD, worldgen, sky, saves | done |
| M2 | **Survival core** | drops, inventory, tools, crafting grid, furnace, health/hunger, basic mobs | in progress |
| M3 | **World depth** | caves/ores/structure generation, full biomes, redstone, more blocks | planned |
| M4 | **Dimensions & bosses** | Nether/End, portals, dragon, wither | planned |
| M5 | **Content parity** | all items/blocks/mobs/enchantments/structures | planned |
| M6 | **Polish** | audio, UI screens, options, mobile, performance | planned |

### Next up (ordered queue)
1. ~~3×3 crafting grid + drag/drop inventory~~ — done
2. ~~Furnace + smelting + fuel~~ — done (XP pending)
3. ~~Health, damage, death/respawn, hunger/air HUD~~ — done
4. First hostile mob (zombie spawning + combat)
5. Ore generation + iron/diamond tiers + armor
6. Caves/aquifers and flowing water
7. Redstone core (dust, torch, repeater, piston)
8. Nether dimension + portals
9. Audio system (block/mob/ambient, CC0 assets)
10. Menus/options/localization

---

## Working agreement

- Pick the top unchecked item (or the next milestone), implement it end to end, add a smoke test, and mark it here.
- Every gameplay number must come from `docs/01`–`docs/12` or minecraft.wiki (Java wins); cite the source beside the constant.
- Keep the deploy loop green: `npm run build`, preview smoke, push, verify the production deployment.
- If an item needs an asset (sound, texture, model) we cannot generate, mark it `[!]` and note the blocker.
