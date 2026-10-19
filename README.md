# VoxelCraft

A browser-based voxel sandbox game faithful to **Minecraft Java Edition 1.21.x**, built with Three.js and vanilla JavaScript. 100% client-side — static hosting, no backend, no plugins, no downloads.

**Status: pre-development.** This repository currently contains the complete specification (below); the game code has not been started yet.

## Specification

| File | Contents |
|---|---|
| [`docs/00-master-prompt.md`](docs/00-master-prompt.md) | Build brief: tech constraints, roadmap, acceptance criteria |
| [`docs/01-research-blocks.md`](docs/01-research-blocks.md) … [`docs/09-research-settings.md`](docs/09-research-settings.md) | Reference tables: blocks, items, mobs, biomes, dimensions, mechanics, recipes, structures, settings |
| [`docs/10-architecture.md`](docs/10-architecture.md) | Module architecture, chunk format, greedy meshing, lighting |
| [`docs/11-features.md`](docs/11-features.md) | Feature specs with acceptance criteria |
| [`docs/12-deployment.md`](docs/12-deployment.md) | Vercel deployment guide |

## Development

The scaffold (Vite 5 + Three.js `^0.160`) lands with the next commits:

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # → dist/
npm run preview  # http://localhost:4173
```

## License

MIT — see [LICENSE](LICENSE). Textures and sounds are generated procedurally or CC0/CC-BY; no Mojang assets are included.
