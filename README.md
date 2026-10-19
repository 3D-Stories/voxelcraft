# VoxelCraft

A browser-based voxel sandbox game faithful to **Minecraft Java Edition 1.21.x**, built with Three.js and vanilla JavaScript. 100% client-side — static hosting, no backend, no plugins, no downloads.

**Status: Phase 1 vertical slice.** The client is feature-complete for the first milestone: Vite + Three.js scaffold, procedural 16×16 textures and atlas, the chunk data model (16×16×384, Y −64..320), a greedy mesher with tiled atlas textures, deterministic simplex terrain (plains, forest and desert with oak trees) streamed by circular render distance, a first-person player (WASD, jump, sneak, sprint, mouse look, gravity and AABB collision on a fixed 20 TPS tick), block breaking/placement with hardness-based mining times and a targeted-block outline, a 9-slot hotbar with a simple block palette, a 20-minute day/night cycle with sun, moon, stars and fog, and IndexedDB world saving with autosave.

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
| Inventory | E (click a block to put it in the selected slot) |
| Break block | Left mouse (hold; time depends on block hardness) |
| Place block | Right mouse (places the selected hotbar block) |

### Worlds and saves

- The world saves automatically to IndexedDB (database `voxelcraft-worlds`): player position and view, time of day, and compressed snapshots of every chunk you edited. Saves happen every 30 seconds, when a chunk unloads, and when the tab is hidden.
- `?seed=123` loads a different deterministic world. A seed that differs from the saved world is played as a throwaway world and never overwrites the save.
- `?time=18000` starts at a given tick (0 = sunrise, 6000 = noon, 12000 = sunset, 18000 = midnight).

## License

MIT — see [LICENSE](LICENSE). Textures and sounds are generated procedurally or CC0/CC-BY; no Mojang assets are included.
