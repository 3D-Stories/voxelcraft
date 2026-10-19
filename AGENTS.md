# AGENTS.md — VoxelCraft

## What this directory is

The complete spec for VoxelCraft — a browser-based Minecraft Java Edition 1.21 clone
(Three.js + vanilla JS, static Vercel hosting) — lives in `docs/` (13 design files,
committed as the initial commit of the GitHub repo `voxelcraft`:
https://github.com/crandrosoff/voxelcraft). No game code or `package.json` exists yet.
The build brief is `docs/00-master-prompt.md`: it mandates creating the GitHub repo and
linking Vercel before writing code (§0.5), forbids starting game code before the plan is
confirmed (§14), and contains the phased roadmap (§11).

## Tech constraints (master prompt §2 — non-negotiable)

- Three.js `^0.160`, vanilla JS ES2022+ modules. **No TypeScript, no React/Vue/Svelte,
  no jQuery, no lodash.** No cannon.js/rapier (custom AABB voxel physics), no Howler
  (Web Audio directly), custom A* (no pathfinding lib).
- Deps: `three`, `simplex-noise`, `idb`, `pako`; Vite 5 build → static SPA, `dist/`.
  100% client-side — no backend, no Vercel functions, no multiplayer.
- Scripts once scaffolded: `npm run dev` (port 3000), `build`, `preview` (4173),
  `generate-textures` (`scripts/generate-textures.js`, procedural PNG textures).

## Look up gameplay values — never improvise

`docs/01..09-research-*.md` are authoritative value tables (blocks, items, mobs,
biomes, dimensions, mechanics, recipes, structures, settings). Before hardcoding any number
(HP, damage, drop chance, hardness, light level, speed, fuel ticks, …), look it up there;
if not certain, verify on https://minecraft.wiki first — Java Edition wins where editions
differ. Cite the wiki URL in a comment beside the value (master prompt §0.5.5). Never
include Mojang assets: textures are generated procedurally, sounds must be CC0/CC-BY.

## Architecture invariants (docs/10-architecture.md)

- Dual loop: render via `requestAnimationFrame` (interpolated), fixed 50 ms sim tick
  (20 TPS) via accumulator. All gameplay runs on the sim tick.
- Chunk: 16×16×384, Y −64..320, `SEA_LEVEL = 63`. Storage: `Uint8Array` per chunk for
  blockIds + blockStates, one byte per block for 4-bit sky + 4-bit block light.
  Index formula `yo*256 + z*16 + x` with `yo = y + 64` must be used everywhere.
- Greedy meshing and vertex-baked lighting (sky BFS + block-light BFS) — no realtime
  lights. Mesh/lights rebuilt only on chunk edit; throttle to 1–3 chunks/frame.
- Heavy work (chunkgen, meshing, pathfinding) in Web Workers; OffscreenCanvas optional
  with main-thread fallback (Safari).
- Saves: IndexedDB database `voxelcraft-worlds`; settings in `localStorage`. Same seed
  must produce an identical world (deterministic generation is an acceptance criterion).

## Verification (docs/12-deployment.md §14–15)

No test framework is specified anywhere — do not invent one. The gate is: `npm run build`
clean → `npm run preview` smoke test 60+ s → check the Vercel deploy logs and browser
console. A headless browser smoke test is expected; the `playwright-cli` skill is
available on this host.

## Deploy — verified environment gap

The spec forbids the Vercel CLI and dashboard and assumes GitHub + Vercel MCP
(12-deployment.md §3.4/§17). In this environment neither MCP is configured. Verified here:
`gh` is authenticated as `crandrosoff`; the `vercel` CLI is installed but not logged in.
Surface this to the user and get a decision before deploying — do not silently substitute
a method, and do not ask the user to run commands the spec tells the agent to own.

## Git & release conventions (master prompt §0.5)

Conventional commits with scope (`feat(chunk-system): greedy meshing + render distance`);
push each feature to `main` (single-dev project; `preview/<feature>` branches for risky
work); tag phase ends `v0.X.0-phaseN`. Vercel Hobby plan (12-deployment.md §16):
1 concurrent build — wait for the deploy to finish before pushing again — and
non-commercial use only; flag the Pro upgrade before adding any monetization.
