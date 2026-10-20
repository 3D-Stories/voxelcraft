# VoxelCraft

A browser-based voxel sandbox game faithful to **Minecraft Java Edition 1.21.x**, built with Three.js and vanilla JavaScript. 100% client-side — static hosting, no backend, no plugins, no downloads.

**Live:** https://voxelcraft-3d-stories.vercel.app/

**Status: Phase 1 + survival slice.** The world renders and persists: Vite + Three.js, procedural 16×16 block and item textures with a greedy-meshed atlas, deterministic simplex terrain (plains, forest, desert with oak trees) streamed by circular render distance, a first-person player (WASD, jump, sneak, sprint, mouse look, gravity, AABB collision, swimming on a fixed 20 TPS tick), a 20-minute day/night cycle with sun, moon, stars and fog, and IndexedDB saves with autosave.

The survival loop works: new worlds start with **wooden tools and apples**, breaking blocks **drops items into a 36-slot inventory**, and **crafting** runs on a 2×2 grid (E) or a placed table's 3×3 grid. A **furnace** smelts logs to charcoal and stone to smooth stone with real fuel values. **Health, hunger and air** track movement, falls, drowning and starvation, with hearts/hunger/bubbles on the HUD, a death screen and respawn. Placeable water, swimming and a creative **god mode** (G) round it out.

## Roadmap

[`ROADMAP.md`](ROADMAP.md) tracks the full path to Minecraft parity — every block, mob, system and screen, with what is done, partial or missing.

## Specification

| File | Contents |
|---|---|
| [`docs/00-master-prompt.md`](docs/00-master-prompt.md) | Build brief: tech constraints, roadmap, acceptance criteria |
| [`docs/01-research-blocks.md`](docs/01-research-blocks.md) … [`docs/09-research-settings.md`](docs/09-research-settings.md) | Reference tables: blocks, items, mobs, biomes, dimensions, mechanics, recipes, structures, settings |
| [`docs/10-architecture.md`](docs/10-architecture.md) | Module architecture, chunk format, greedy meshing, lighting |
| [`docs/11-features.md`](docs/11-features.md) | Feature specs with acceptance criteria |
| [`docs/12-deployment.md`](docs/12-deployment.md) | Vercel deployment guide |

## Development

```bash
npm install
npm run dev               # http://localhost:3000
npm run build             # → dist/
npm run preview           # http://localhost:4173
npm run generate-textures # regenerate public/assets/textures/blocks/*.png
                          # (needs the native module: npm i --no-save canvas)
```

### Controls

| Action | Key |
|---|---|
| Move | W A S D |
| Jump | Space |
| Sneak | Left Shift |
| Sprint | Left Ctrl, or double-tap W |
| Look | Click the canvas to capture the mouse; Esc releases it |
| Select hotbar slot | 1-9, or the mouse wheel |
| Inventory | E — 36 slots + 2×2 crafting grid (click/right-click/shift-click to move items) |
| Use block | Right-click a placed crafting table (3×3 grid) or furnace (smelting UI) |
| Break block | Left mouse (hold; speed depends on the held tool and block hardness) |
| Place block | Right mouse (consumes the selected block; free in god mode) |
| Eat | Right-click while holding food (apples) |
| God mode | G — instant mining, 5-block reach, invulnerable; double-tap Space to fly (Space up, Shift down) |
| Swim | Space to rise, Shift to dive (water slows you down) |

### Progression

1. Punch oak leaves/logs, then press **E** and use the **2×2 crafting grid**: one log → 4 **oak planks**, two planks stacked vertically → 4 **sticks**.
2. Fill the 2×2 with planks to craft a **crafting table**; place it and right-click it for the **3×3 grid**.
3. Craft a **wooden pickaxe** (3 planks + 2 sticks) — new worlds already include one — then mine stone for **stone tools**.
4. Craft a **furnace** (8 stone at the table): logs smelt to charcoal (80 s of fuel each), stone to smooth stone.
5. Watch your hearts, hunger and air: falls hurt (1 HP per block past 3), drowning and starvation kill, apples restore hunger, and the death screen respawns you at spawn.

Click a stack to pick it up, click again to place, right-click to split/place one, shift-click to move stacks. Stone drops stone (cobblestone is not in the block set yet), and iron/diamond tiers wait for ore generation.

### Worlds and saves

- The world saves automatically to IndexedDB (database `voxelcraft-worlds`): player position and view, time of day, and compressed snapshots of every chunk you edited. Saves happen every 30 seconds, when a chunk unloads, and when the tab is hidden.
- `?seed=123` loads a different deterministic world. A seed that differs from the saved world is played as a throwaway world and never overwrites the save.
- `?time=18000` starts at a given tick (0 = sunrise, 6000 = noon, 12000 = sunset, 18000 = midnight).

## License

MIT — see [LICENSE](LICENSE). Textures and sounds are generated procedurally or CC0/CC-BY; no Mojang assets are included.
