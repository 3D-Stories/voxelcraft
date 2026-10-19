# Minecraft Clone Prompt Kit — 04. Biomes & World Generation Reference

**Scope:** Exhaustive reference for all biomes in **Minecraft Java Edition 1.21.x**, plus the seed-based world generation algorithm, multi-noise parameter system, structure placement, terrain features, world types, and per-biome mob spawn rules.
**Audience:** Implementing AI building a voxel sandbox with modular, seed-driven procedural terrain.
**Goal:** Provide enough mathematical and tabular detail that the implementing AI can re-implement Minecraft's biome selection and terrain shape from scratch.

> **Conventions used in this file**
> - All biome IDs use Java Edition 1.21.4 naming (`minecraft:plains`, `minecraft:wooded_badlands`, etc.). Legacy names are noted in parentheses where they still appear in old mods/docs.
> - Coordinate system: `+x` east, `+z` south, `+y` up. World floor `Y=-64`, world ceiling `Y=320` (Java 1.18+).
> - Chunk = 16×16 columns × 384 blocks tall (24 sub-chunks of 16³). Region file = 32×32 chunks.
> - Noise parameters are described using Mojang's 1.18+ `MultiNoiseBiomeSource` model (6-dimensional).
> - Pseudocode is language-neutral and uses C-like syntax. Replace with your engine's RNG/PRNG.

---

## Table of Contents

1. [World Generation Algorithm Overview](#1-world-generation-algorithm-overview)
   - 1.1 [Seed-based PRNG](#11-seed-based-prng)
   - 1.2 [Multi-Noise Generation System (1.18+)](#12-multi-noise-generation-system-118)
   - 1.3 [Perlin & Simplex Noise Implementation](#13-perlin--simplex-noise-implementation)
   - 1.4 [Octave / Fractal Noise (FBM)](#14-octave--fractal-noise-fbm)
   - 1.5 [Biome Blending at Boundaries](#15-biome-blending-at-boundaries)
   - 1.6 [3D Biome Generation](#16-3d-biome-generation-118)
   - 1.7 [Chunk Generation Pipeline](#17-chunk-generation-pipeline)
   - 1.8 [Cubic vs Column-based Generation](#18-cubic-vs-column-based-generation)
2. [Overworld Biomes](#2-overworld-biomes)
   - 2.1 [Hot Biomes](#21-hot-biomes)
   - 2.2 [Temperate Biomes](#22-temperate-biomes)
   - 2.3 [Cold Biomes](#23-cold-biomes)
   - 2.4 [Mountain Biomes](#24-mountain-biomes)
   - 2.5 [Ocean Biomes](#25-ocean-biomes)
   - 2.6 [Cave Biomes](#26-cave-biomes)
   - 2.7 [River / Wetland Biomes](#27-river--wetland-biomes)
   - 2.8 [Special Biomes](#28-special-biomes)
3. [Nether Biomes](#3-nether-biomes)
4. [End Biomes](#4-end-biomes)
5. [Structures Reference](#5-structures-reference)
6. [Terrain Features](#6-terrain-features)
7. [World Types Reference](#7-world-types-reference)
8. [Random Seed System](#8-random-seed-system)
9. [Mob Spawn Rules Per Biome](#9-mob-spawn-rules-per-biome)
10. [Implementation Cheat Sheet](#10-implementation-cheat-sheet)

---

## 1. World Generation Algorithm Overview

### 1.1 Seed-based PRNG

Minecraft worlds are **fully deterministic** from a single 64-bit integer called the **world seed**. Every procedural decision — biome placement, ore distribution, structure layout, cave shape, tree position — derives from the seed plus the world coordinates. Two worlds generated with the same seed and the same game version produce byte-identical worlds.

#### 1.1.1 The World Seed

| Property        | Value                                              |
|-----------------|----------------------------------------------------|
| Type            | 64-bit signed integer (`long` in Java / `i64`)     |
| Valid range     | -2⁶³ to 2⁶³-1                                     |
| Special values  | `0` is re-mapped internally to a non-zero constant |
| Default         | `new Random().nextLong()` (time-derived entropy)   |
| Stored in       | `level.dat` under `Data.WorldGenSettings.seed`     |

#### 1.1.2 Sub-seed Derivation

Different subsystems derive their own seeds by hashing the world seed with a per-system salt. This guarantees that changing one system's salt does not change another system's output.

```c
// Pseudocode: salted hash used by Mojang
uint64_t mix64(uint64_t worldSeed, uint64_t salt) {
    uint64_t x = worldSeed ^ salt;
    // Mix using MurmurHash3 finalizer ( avalanche )
    x ^= x >> 33;
    x *= 0xFF51AFD7ED558CCDULL;
    x ^= x >> 33;
    x *= 0xC4CEB9FE1A85EC53ULL;
    x ^= x >> 33;
    return x;
}

// Per-system salts (chosen by Mojang, public in source):
SEED_BIOME        = mix64(worldSeed, 0x1B1C7C00L);
SEED_ORE          = mix64(worldSeed, 0x9E2C3F60L);
SEED_STRUCTURE    = mix64(worldSeed, 0x5DEBBE2FL);
SEED_CAVE_CARVER  = mix64(worldSeed, 0x5C7E1CD8L);
SEED_FEATURE      = mix64(worldSeed, 0x1F7C8472L);
```

#### 1.1.3 Dimension Seeds

Each dimension (Overworld, Nether, End) derives its own biome seed from the world seed. The default behavior is:

```c
overworldBiomeSeed = worldSeed;
netherBiomeSeed    = worldSeed + 0x1B1C7C00L;   // any salt works
endBiomeSeed       = worldSeed + 0x2E1C7C00L;
```

Custom dimensions (datapacks) can override this and supply explicit per-dimension seeds.

#### 1.1.4 Java-style `Random` (for compatibility)

The original Java `java.util.Random` is a linear-congruential generator (LCG):

```
seed = (seed * 0x5DEECE66DL + 0xBL) & ((1L << 48) - 1)
next(bits) = (int)(seed >>> (48 - bits))
nextLong() = ((long)next(32) << 32) + next(32)
```

Many Minecraft subsystems still use this LCG for backwards compatibility. For new implementations, prefer **xoroshiro128++** or **PCG64** — they are faster and have better statistical quality.

---

### 1.2 Multi-Noise Generation System (1.18+)

Starting with 1.18 ("Caves & Cliffs Part II"), Minecraft abandoned the old 2D biome map (a single Perlin-noise-derived Voronoi diagram) in favor of a **6-dimensional climate sampler**. Each biome occupies a hyper-rectangle in 6D climate space; the biome at any `(x, y, z)` is whichever biome's rectangle is closest to the sampled climate vector.

#### 1.2.1 The Six Climate Parameters

| Parameter          | Symbol   | Range        | Meaning                                                                                  |
|--------------------|----------|--------------|------------------------------------------------------------------------------------------|
| Temperature        | `T`      | [-1.0, +1.0] | Hot vs cold. Drives snow vs rain, and splits hot/cold biomes.                            |
| Humidity           | `H`      | [-1.0, +1.0] | Dry vs wet. Splits desert vs savanna vs jungle.                                          |
| Continentalness    | `C`      | [-1.0, +1.0] | Ocean vs land. Coastline placement. Strongly controls ocean depth.                       |
| Erosion            | `E`      | [-1.0, +1.0] | Flat vs rugged terrain. Low erosion = mountains/high hills; high = plains/plateaus.      |
| Weirdness          | `W`      | [-1.0, +1.0] | "Special variant" axis. Splits rare biomes (ice spikes, sunflower plains, jungle edge).  |
| Depth              | `D`      | [-1.0, +1.0] | **Vertical** axis (1.18+). Replaces old "altitude" — drives cave biomes & 3D placement.  |

> The Depth parameter is what enables **3D biomes** (a lush cave can be under a jungle at the same `(x,z)`). In pre-1.18 code, only `(T, H, C, E, W)` existed and Depth was implicit (always 0).

#### 1.2.2 How the Climate Vector Is Computed

Each parameter is sampled from a separate, low-frequency noise function. The pipeline is:

```
For each block (x, y, z):
    T(x,z) = noise_temperature.sample(x * T_freq, z * T_freq)  // 2D, no Y
    H(x,z) = noise_vegetation.sample(x * H_freq, z * H_freq)
    C(x,z) = noise_continentalness.sample(x * C_freq, z * C_freq)
    E(x,z) = noise_erosion.sample(x * E_freq, z * E_freq)
    W(x,z) = noise_ritage_weirdness.sample(x * W_freq, z * W_freq)
    D(x,y,z) = compute_depth(x, y, z)  // function of Y relative to terrain height

    climate = (T, H, C, E, W, D)
    biome = pick_nearest_biome(climate)
```

#### 1.2.3 The `pick_nearest_biome` Step

The biome list is a flat array of `(parameter_point, biome)` pairs. Each `parameter_point` is six `Climate.Param` entries (one per axis). A `Param` can be either a single value or a range `[min, max]`.

The "distance" from a sampled climate vector to a biome's param-point is the **sum of squared Euclidean distances per axis**, but with two twists:

1. **Range membership:** If a sampled value falls inside a biome's `[min, max]` on that axis, the contribution on that axis is **0** (no penalty).
2. **Axis weighting (optional):** Mojang applies small per-axis weights; default weights are all `1.0`.

```c
float param_distance(Param p, float value) {
    if (value < p.min) return (p.min - value);
    if (value > p.max) return (value - p.max);
    return 0;  // inside range — no penalty
}

float biome_distance(ClimatePoint bp, Climate c) {
    float dt = param_distance(bp.temperature,     c.temperature);
    float dh = param_distance(bp.humidity,        c.humidity);
    float dc = param_distance(bp.continentalness, c.continentalness);
    float de = param_distance(bp.erosion,         c.erosion);
    float dw = param_distance(bp.weirdness,       c.weirdness);
    float dd = param_distance(bp.depth,           c.depth);
    return dt*dt + dh*dh + dc*dc + de*de + dw*dw + dd*dd;
}

Biome pick_nearest_biome(Climate c) {
    Biome best = NULL;
    float best_d = INF;
    for (entry in biome_list) {
        float d = biome_distance(entry.point, c);
        if (d < best_d) { best_d = d; best = entry.biome; }
    }
    return best;
}
```

#### 1.2.4 Why This Works

Because the underlying noises are smooth and continuous, the climate vector moves smoothly as `(x,y,z)` changes. The nearest-biome selection therefore produces **gradual, natural-looking biome transitions**, unlike the per-block hard boundaries of the old system. The `weirdness` axis (which has its own noise field) carves out rare variants (sunflower plains, ice spikes) inside the territory of their parent biome without requiring a separate "biome rarity" pass.

#### 1.2.5 Parameter Range Cheatsheet

The following tables show Mojang's documented parameter points per biome (rounded). Use these when tuning your own biome list — if you want a biome to be **rarer**, widen the ranges of every other biome relative to it; if you want it to spawn in a **narrower band**, narrow its own ranges.

| Continentalness band      | Range (approx)  | Typical biome placement              |
|---------------------------|-----------------|--------------------------------------|
| Mushroom threshold        | [-1.10, -1.00]  | Mushroom Fields                      |
| Deep ocean                | [-1.00, -0.45]  | Deep Ocean variants                  |
| Ocean                     | [-0.45, -0.15]  | Ocean variants (cold/lukewarm/etc.)  |
| Coast                     | [-0.15, -0.10]  | Beaches, Stony Shore                 |
| Near-inland               | [-0.10, -0.05]  | Coastal land biomes                  |
| Mid-inland                | [-0.05, +0.40]  | Most land biomes                     |
| Far-inland                | [+0.40, +1.00]  | Rare mountainous interior            |

| Erosion band              | Range (approx)  | Resulting terrain                    |
|---------------------------|-----------------|--------------------------------------|
| Very low erosion          | [-1.00, -0.78]  | Jagged Peaks, tall mountains         |
| Low erosion               | [-0.78, -0.55]  | Windswept Hills, Stony Peaks         |
| Medium erosion            | [-0.55, +0.30]  | Hills, forests, plateaus             |
| High erosion              | [+0.30, +0.70]  | Plains, savannas                     |
| Very high erosion         | [+0.70, +1.00]  | Flat deserts, swamps, beach plains   |

| Temperature band          | Range (approx)  | Biome family                         |
|---------------------------|-----------------|--------------------------------------|
| Frozen                    | [-1.00, -0.45]  | Snowy Plains, Ice Spikes, Frozen Ocean |
| Cold                      | [-0.45, -0.15]  | Taiga, Grove, Cold Ocean             |
| Temperate                 | [-0.15, +0.20]  | Plains, Forest, River, Ocean         |
| Warm                      | [+0.20, +0.55]  | Jungle, Swamp, Lukewarm Ocean        |
| Hot                       | [+0.55, +1.00]  | Desert, Savanna, Badlands, Warm Ocean |

| Humidity band             | Range (approx)  | Biome family                         |
|---------------------------|-----------------|--------------------------------------|
| Arid                      | [-1.00, -0.35]  | Desert, Badlands                     |
| Dry                       | [-0.35, -0.10]  | Savanna, Savanna Plateau             |
| Neutral                   | [-0.10, +0.10]  | Plains, Forest, Beach                |
| Wet                       | [+0.10, +0.30]  | Swamp, Dark Forest, River            |
| Humid                     | [+0.30, +1.00]  | Jungle, Mangrove Swamp, Bamboo Jungle |

| Weirdness band            | Range (approx)  | Effect                               |
|---------------------------|-----------------|--------------------------------------|
| Low                       | [-1.00, -0.05]  | Base biome                           |
| High                      | [-0.05, +1.00]  | Variant biome (sunflower, spikes)    |

| Depth band                | Range (approx)  | Biome                                |
|---------------------------|-----------------|--------------------------------------|
| Surface (above terrain)   | D ≥ 0           | Surface biome                        |
| Near-surface underground  | -0.1 to -0.3    | Surface biome still wins             |
| Cave shallow              | < -0.3          | Lush / Dripstone Caves (T/H dependent) |
| Cave deep                 | < -0.7          | Deep Dark                            |

> **Note:** These are practical tuning ranges. The exact Mojang values use additional spline-based interpolation in `NoiseRouter` (the `final_density` function). For a clone, the simpler 6-band nearest-neighbor model above gives 95% of the visual fidelity for 10% of the complexity.

---

### 1.3 Perlin & Simplex Noise Implementation

Minecraft uses **improved Perlin noise** (Ken Perlin's 2002 reference implementation) inside an `OctavedPerlinNoiseSampler` wrapper. Simplex noise is also used in a few subsystems (notably the new 1.18 multi-noise climate fields, which use a custom Simplex variant called `DoublePerlinNoise` — two Perlin noises summed with offset).

#### 1.3.1 Improved Perlin Noise (2002)

```c
// Improved Perlin noise — Ken Perlin's 2002 reference Java implementation, in C
int perm[512];          // permutation table, doubled to avoid index wrapping

// Gradient table (12 gradient vectors, plus 4 duplicates = 16)
// Each entry: 8-bit index into a gradient list
int grad3[16][3] = {
    { 1, 1, 0}, {-1, 1, 0}, { 1,-1, 0}, {-1,-1, 0},
    { 1, 0, 1}, {-1, 0, 1}, { 1, 0,-1}, {-1, 0,-1},
    { 0, 1, 1}, { 0,-1, 1}, { 0, 1,-1}, { 0,-1,-1},
    { 1, 1, 0}, {-1, 1, 0}, { 0,-1, 1}, { 0,-1,-1},   // duplicates for hashing simplicity
};

float fade(float t)  { return t * t * t * (t * (t * 6 - 15) + 10); }
float lerp(float t, float a, float b) { return a + t * (b - a); }
float grad(int hash, float x, float y, float z) {
    int h = hash & 15;
    float u = h < 8 ? x : y;
    float v = h < 4 ? y : (h == 12 || h == 14 ? x : z);
    return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v);
}

float perlin3d(float x, float y, float z) {
    int X = (int)floor(x) & 255;
    int Y = (int)floor(y) & 255;
    int Z = (int)floor(z) & 255;
    x -= floor(x); y -= floor(y); z -= floor(z);
    float u = fade(x), v = fade(y), w = fade(z);
    int A  = perm[X  ] + Y, AA = perm[A] + Z, AB = perm[A + 1] + Z;
    int B  = perm[X+1] + Y, BA = perm[B] + Z, BB = perm[B + 1] + Z;
    return lerp(w,
        lerp(v,
            lerp(u, grad(perm[AA  ], x  , y  , z   ),
                    grad(perm[BA  ], x-1, y  , z   )),
            lerp(u, grad(perm[AB  ], x  , y-1, z   ),
                    grad(perm[BB  ], x-1, y-1, z   ))),
        lerp(v,
            lerp(u, grad(perm[AA+1], x  , y  , z-1 ),
                    grad(perm[BA+1], x-1, y  , z-1 )),
            lerp(u, grad(perm[AB+1], x  , y-1, z-1 ),
                    grad(perm[BB+1], x-1, y-1, z-1 ))));
}
```

Output range: **[-1.0, +1.0]** (approximately; theoretical max is ~0.987 for 3D).

#### 1.3.2 Permutation Table Init

```c
void init_perm(uint64_t seed) {
    int p[256];
    for (int i = 0; i < 256; i++) p[i] = i;
    // Fisher-Yates shuffle with seeded RNG
    Random rng = new Random(seed);
    for (int i = 255; i > 0; i--) {
        int j = rng.nextInt(i + 1);
        swap(p[i], p[j]);
    }
    for (int i = 0; i < 512; i++) perm[i] = p[i & 255];
}
```

#### 1.3.3 Simplex Noise (Brief)

Simplex noise (also Ken Perlin, 2001) replaces the cubic grid of Perlin with a simplicial grid (tetrahedra in 3D). It is faster for 4D+, has no axis-aligned artifacts, and is what Minecraft 1.18+ uses for the climate fields. Reference implementation is ~150 lines and is omitted here for brevity — use any open-source Simplex implementation. Output range is also approximately [-1, +1].

#### 1.3.4 Double-Perlin Noise (Mojang's 1.18 Climate Noise)

```c
// Mojang's "DoublePerlinNoise" — two Perlin noises summed with phase offset
struct DoublePerlinNoise {
    PerlinNoise first;     // amplitude = 1.0
    PerlinNoise second;    // amplitude = 1.0
    float amplitude;       // = 1.4159854 / sqrt(firstAmp² + secondAmp²)
};

float sample(DoublePerlinNoise n, float x, float y, float z) {
    return n.amplitude * (
        n.first.sample(x, y, z) + n.second.sample(x, y, z)
    );
}
```

The `amplitude` factor normalizes the output back to roughly [-1, +1].

---

### 1.4 Octave / Fractal Noise (FBM)

Terrain shape is never a single noise — it is the **sum of several Perlin noises at increasing frequency and decreasing amplitude** (fractal Brownian Motion, or FBM). Minecraft calls this `OctavePerlinNoiseSampler` and stores it as an array of `N` Perlin samplers.

```c
struct OctaveNoise {
    PerlinNoise octaves[N];    // N typically 4 to 16
    float persistence;         // typically 0.5
    float lacunarity;          // typically 2.0
};

float fbm(OctaveNoise n, float x, float y, float z) {
    float total = 0;
    float amplitude = 1;
    float frequency = 1;
    float max_value = 0;
    for (int i = 0; i < N; i++) {
        total += n.octaves[i].sample(x * frequency, y * frequency, z * frequency) * amplitude;
        max_value += amplitude;
        amplitude *= n.persistence;
        frequency *= n.lacunarity;
    }
    return total / max_value;  // normalize to [-1, +1]
}
```

Mojang's `OctavePerlinNoiseSampler` differs slightly: each octave has its own pre-baked offset (added to the input coordinate) so different octaves do not "lock" into the same gradient field. The amplitude of each octave is fixed at `2^(-i)` and they are summed without normalization.

#### 1.4.1 Practical Terrain Recipe

```c
float terrain_height(int x, int z, uint64_t seed) {
    // 4-octave base shape
    float base = fbm(noise_base,  x/200.0, 0, z/200.0);    // large rolling hills
    // 6-octave detail
    float detail = fbm(noise_detail, x/50.0,  0, z/50.0);  // small bumps
    // Erosion factor (low erosion = sharp mountains)
    float erosion = (noise_erosion.sample(x/400.0, z/400.0) + 1) * 0.5;
    // Compose
    float h = 64 + base * 30 * (1 - erosion) + detail * 8;
    return h;
}
```

---

### 1.5 Biome Blending at Boundaries

When two biomes meet, Minecraft does not produce a hard vertical cliff at the boundary. Instead, a **3×3 to 7×7 smoothing kernel** is applied to the sampled climate vector before biome selection. This produces a **Voronoi-like transition** where the climate values of neighboring cells are interpolated.

```c
// Mojang's BiomeResolver uses a 4x4x4 (64-sample) kernel in 3D
Climate sample_blended_climate(int x, int y, int z) {
    int cellSize = 4;  // quartet-resolution cells
    int cx = x / cellSize, cy = y / cellSize, cz = z / cellSize;
    // For each of the 8 surrounding cells, sample climate and lerp by fractional position
    float fx = (x - cx * cellSize) / (float)cellSize;
    float fy = (y - cy * cellSize) / (float)cellSize;
    float fz = (z - cz * cellSize) / (float)cellSize;

    Climate c000 = sample_cell_raw(cx,   cy,   cz);
    Climate c100 = sample_cell_raw(cx+1, cy,   cz);
    Climate c010 = sample_cell_raw(cx,   cy+1, cz);
    Climate c110 = sample_cell_raw(cx+1, cy+1, cz);
    // ... c001, c101, c011, c111
    // Trilinear interpolation in 6D space:
    return trilerp(c000, c100, c010, c110, c001, c101, c011, c111, fx, fy, fz);
}
```

The result is a "soft Voronoi" — biome boundaries are 1–4 blocks wide and have smooth transitions in surface block, vegetation, and color.

The blending also smooths surface heights: if a plains (height 64) borders a mountain (height 200), the actual terrain height at the boundary interpolates over a few blocks, creating slopes rather than cliffs.

---

### 1.6 3D Biome Generation (1.18+)

Before 1.18, biomes were 2D: each `(x, z)` column had exactly one biome, applied from `Y=0` to `Y=256`. Caves cut through the column but had no biome of their own.

1.18 introduced the **Depth** axis. Now biomes vary both horizontally and vertically:

- A jungle at the surface may have a lush cave directly below it (different biome, same `(x,z)`).
- A dripstone caves biome can sit between a desert surface and a deep dark at `Y=-52`.
- Mushroom fields at surface level are surrounded by ocean; at deep-Y levels (large caves) they are surrounded by deepslate.

#### 1.6.1 How Depth Is Computed

The `depth` value passed to the climate sampler is **not** simply the Y-coordinate — it is a spline function that depends on the noise-router's `initial_density_without_jaggedness` plus an offset. Practically:

```c
float compute_depth(int x, int y, int z) {
    // Reference height: terrain surface height at (x,z)
    float surface = estimated_surface_height(x, z);
    // Depth relative to surface
    float rel = (surface - y) / 80.0;     // 0 at surface, +1 at 80 below
    return clamp(rel, -1.0, +1.0);
}
```

This produces:
- `D ≈ +1` high in the sky → sky/void biome (none above surface)
- `D ≈ 0` at the surface → surface biome wins
- `D ≈ -0.3` shallow underground → surface biome still wins
- `D ≈ -0.5` mid-cave → Lush or Dripstone Caves (depending on T, H)
- `D ≈ -0.9` deep underground → Deep Dark (Y < -52) or Deepslate (else)

#### 1.6.2 Cave Biome Selection Logic

```
if (y > surface_y) -> air (no biome)
else if (y > surface_y - 8) -> surface biome
else if (y > -8)  -> if (T > 0.7 and H > 0.8) Lush Caves
                    else if (T < -0.1 and H < 0.2) Dripstone Caves
                    else surface biome
else if (y > -54) -> surface biome (or cave biome in 3D model)
else if (y < -52) -> Deep Dark (rare; "deep dark centers" structure feature)
```

The Deep Dark is gated primarily by **Y < -52 AND proximity to an Ancient City center**, not pure noise — see Section 5.

---

### 1.7 Chunk Generation Pipeline

A chunk goes through these stages in order. Each stage reads the output of the previous one.

```
┌─────────────────────────────────────────────────────────────────────┐
│                       CHUNK GENERATION PIPELINE                     │
└─────────────────────────────────────────────────────────────────────┘

1. STRUCTURE_STARTS
   - Sample structure noise (separate from terrain noise) using the
     structure seed. Decide which structures have their START block
     inside this chunk.
   - Place structure bounding-box metadata only (no blocks yet).

2. BIOMES
   - For each cell in a 4×24×4 grid inside the chunk, sample the
     climate vector and pick the nearest biome.
   - Store biome IDs in the chunk's biome palette (24 vertical slices
     of 4×4 each = 384 biome cells per chunk).

3. NOISE (also called "BASE_TERRAIN" or "ChunkStatus.SURFACE" precursor)
   - Sample the final_density noise function at every block in the chunk
     (typically downsampled to 4×4×4 cells then trilinear-interpolated).
   - Set every block where final_density > 0 to STONE (or fluid), else AIR.

4. SURFACE
   - Apply biome surface rules: replace the top N blocks of stone with
     the biome's top block (e.g., grass_block for plains) and filler
     (e.g., dirt). Add bedrock at Y=-64.
   - Add biome-specific surface features: sand beaches, terracotta in
     badlands, ice in snowy biomes, etc.

5. CARVERS
   - Carve caves, ravines, canyons, and nether caves out of the stone.
   - Carvers do NOT remove water/lava below sea level; they only carve
     solid blocks.

6. LIQUIDS
   - Place sea-level water in any AIR block at Y=sea_level that is
     adjacent to solid blocks (the "fluid picking" step).
   - Place lava below Y=-54 (Nether default: Y=31).

7. FEATURES
   - Run every configured feature (trees, ores, flowers, grass, cacti,
     reefs, kelp, etc.) in placement order. Order matters: ore goes
     before trees so trees can overwrite ore.
   - Each feature's placement is filtered by biome.

8. STRUCTURE_PIECES  (after FEATURES)
   - Now actually place structure blocks (village houses, temple rooms,
     mineshaft corridors) into the world, overwriting terrain/features.

9. LIGHT
   - Compute heightmap-based skylight propagation, propagate block
     lights, run block-light flood fill.

10. SPAWN
    - Initial population: spawn passive mobs (animals) for the chunk
      based on biome spawn lists. Hostiles will spawn at runtime.

11. HEIGHTMAPS_AND_FINALIZE
    - Recompute heightmaps after features.
    - Mark chunk ready for client packet.
```

Each stage's results are cached so neighboring chunks requesting only `BIOMES` (for example, to determine if a feature in this chunk can spread across) don't need to fully generate the neighbor.

---

### 1.8 Cubic vs Column-based Generation

Minecraft uses **column-based** generation, despite many modders asking for cubic chunks.

| Aspect                  | Column-based (vanilla)             | Cubic chunks (mod-only)            |
|-------------------------|------------------------------------|------------------------------------|
| Storage unit            | 16×16 column × full height (384)   | 16×16×16 sub-chunk                 |
| Generation granularity  | Per-chunk vertical slice           | Per-cube                           |
| Memory cost of sky      | All air blocks stored              | Only non-empty cubes loaded        |
| Build height limit      | Hard cap (`Y=-64..320`)            | Theoretically infinite             |
| Complexity              | Simpler — single noise per column  | More complex — 3D noise everywhere |
| Mojang support          | ✅ Vanilla                          | ❌ Not implemented                 |

For a clone: **use column-based**. It is what every voxel engine before Minecraft did and it is well-understood. Cubic chunks are an open research problem (avoiding Z-fighting at infinite Y, lighting across cube boundaries, etc.).

The vanilla chunk is divided internally into **24 sub-chunks of 16³ blocks** for storage/rendering efficiency (only non-empty sub-chunks are kept in memory). But generation is column-based.

---

## 2. Overworld Biomes

The Overworld has **~63 distinct biome IDs** in Java 1.21.4. They are grouped below by climate/terrain category. Each biome entry shows:

- **Climate parameters** (T, H, C, E, W) — typical values from Mojang's `MultiNoiseBiomeSource` JSON
- **Depth range** (D) — when relevant (cave biomes)
- **Surface** — top block, filler block, depth
- **Sky / fog color** — hex (rendering hints)
- **Water / fog color**
- **Weather** — rain / snow / none
- **Spawning** — quick mob list (full table in §9)
- **Structures** — quick structure list (full table in §5)

> Climate values use the **legacy 1.17 biome temperature scale** for the *Temperature* column where noted (because most spawn rules / snow rules still key off this). The **multi-noise T** is in [-1, +1] but is a different scale; ranges are noted separately.

### 2.0 Master Biome Table (compact)

| ID | Name | Category | T (legacy) | Multi-noise T | H | C | E | W | Surface top | Filler | Sky | Water | Weather |
|----|------|----------|-----------|---------------|---|---|---|---|-------------|--------|-----|-------|---------|
| plains | Plains | Temperate | 0.125 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | grass_block | dirt | 78A7FF | 3F76E4 | rain |
| sunflower_plains | Sunflower Plains | Temperate | 0.125 | 0.0 | 0.0 | 0.0 | 0.0 | +0.7 | grass_block | dirt | 78A7FF | 3F76E4 | rain |
| forest | Forest | Temperate | 0.25 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | grass_block | dirt | 79A7FF | 3F76E4 | rain |
| flower_forest | Flower Forest | Temperate | 0.25 | 0.0 | 0.0 | 0.0 | 0.0 | +0.7 | grass_block | dirt | 79A7FF | 3F76E4 | rain |
| birch_forest | Birch Forest | Temperate | 0.25 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | grass_block | dirt | 78A7FF | 3F76E4 | rain |
| old_growth_birch_forest | Old Growth Birch Forest | Temperate | 0.25 | 0.0 | 0.0 | 0.0 | 0.0 | +0.7 | grass_block | dirt | 78A7FF | 3F76E4 | rain |
| dark_forest | Dark Forest | Temperate | 0.25 | 0.0 | +0.2 | 0.0 | 0.0 | 0.0 | grass_block | dirt | 78A7FF | 3F76E4 | rain |
| swamp | Swamp | Wetland | 0.5 | 0.0 | +0.2 | 0.0 | 0.0 | 0.0 | grass_block | dirt | 6BA941 | 4A6B8A | rain |
| mangrove_swamp | Mangrove Swamp | Wetland | 0.8 | +0.5 | +0.6 | 0.0 | 0.0 | 0.0 | mud | dirt | 4E6B45 | 3A7A6D | rain |
| jungle | Jungle | Hot | 0.95 | +0.5 | +0.7 | 0.0 | 0.0 | 0.0 | grass_block | dirt | 78A7FF | 1F90F0 | rain |
| sparse_jungle | Sparse Jungle | Hot | 0.95 | +0.5 | +0.7 | 0.0 | 0.0 | -0.2 | grass_block | dirt | 78A7FF | 1F90F0 | rain |
| bamboo_jungle | Bamboo Jungle | Hot | 0.95 | +0.5 | +0.7 | 0.0 | 0.0 | +0.7 | podzol | dirt | 78A7FF | 1F90F0 | rain |
| river | River | Wetland | 0.5 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | dirt | dirt | 78A7FF | 3F76E4 | rain |
| frozen_river | Frozen River | Cold | 0.0 | -0.5 | 0.0 | 0.0 | 0.0 | 0.0 | dirt | dirt | 80A5C8 | 185390 | snow |
| beach | Beach | Temperate | 0.05 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | sand | sand | 78A7FF | 3F76E4 | rain |
| snowy_beach | Snowy Beach | Cold | 0.05 | -0.5 | 0.0 | 0.0 | 0.0 | 0.0 | sand | sand | 84A5C8 | 245B78 | snow |
| stony_shore | Stony Shore | Temperate | 0.2 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | stone | stone | 78A7FF | 3F76E4 | rain |
| ocean | Ocean | Ocean | 0.5 | 0.0 | 0.0 | -0.3 | 0.0 | 0.0 | gravel | gravel | 78A7FF | 3F76E4 | rain |
| deep_ocean | Deep Ocean | Ocean | 0.5 | 0.0 | 0.0 | -0.6 | 0.0 | 0.0 | gravel | gravel | 78A7FF | 3F76E4 | rain |
| lukewarm_ocean | Lukewarm Ocean | Ocean | 0.5 | +0.25 | 0.0 | -0.3 | 0.0 | 0.0 | sand | sand | 78A7FF | 0D96D8 | rain |
| deep_lukewarm_ocean | Deep Lukewarm Ocean | Ocean | 0.5 | +0.25 | 0.0 | -0.6 | 0.0 | 0.0 | sand | sand | 78A7FF | 0D96D8 | rain |
| warm_ocean | Warm Ocean | Ocean | 0.5 | +0.55 | 0.0 | -0.3 | 0.0 | 0.0 | sand | sand | 78A7FF | 02B0D8 | rain |
| cold_ocean | Cold Ocean | Ocean | 0.0 | -0.3 | 0.0 | -0.3 | 0.0 | 0.0 | gravel | gravel | 78A7FF | 205E83 | rain |
| deep_cold_ocean | Deep Cold Ocean | Ocean | 0.0 | -0.3 | 0.0 | -0.6 | 0.0 | 0.0 | gravel | gravel | 78A7FF | 205E83 | rain |
| frozen_ocean | Frozen Ocean | Cold | 0.0 | -0.5 | 0.0 | -0.3 | 0.0 | 0.0 | gravel | gravel | 80A5C8 | 245B78 | snow* |
| deep_frozen_ocean | Deep Frozen Ocean | Cold | 0.0 | -0.5 | 0.0 | -0.6 | 0.0 | 0.0 | gravel | gravel | 80A5C8 | 245B78 | snow* |
| desert | Desert | Hot | 2.0 | +0.7 | -0.5 | 0.0 | 0.0 | 0.0 | sand | sand | E0D890 | 1F90F0 | none |
| savanna | Savanna | Hot | 1.2 | +0.7 | -0.2 | 0.0 | 0.0 | 0.0 | grass_block | dirt | E0D890 | 1F90F0 | none |
| savanna_plateau | Savanna Plateau | Hot | 1.0 | +0.7 | -0.2 | 0.0 | -0.3 | 0.0 | grass_block | dirt | E0D890 | 1F90F0 | none |
| windswept_savanna | Windswept Savanna | Hot | 2.0 | +0.7 | -0.2 | 0.0 | -0.5 | 0.0 | grass_block | dirt | E0D890 | 1F90F0 | none |
| badlands | Badlands | Hot | 2.0 | +0.7 | -0.5 | 0.0 | 0.0 | 0.0 | red_sand | terracotta | E0D890 | 1F90F0 | none |
| wooded_badlands | Wooded Badlands | Hot | 2.0 | +0.7 | -0.5 | 0.0 | -0.3 | 0.0 | red_sand | terracotta | E0D890 | 1F90F0 | none |
| eroded_badlands | Eroded Badlands | Hot | 2.0 | +0.7 | -0.5 | 0.0 | 0.0 | +0.7 | red_sand | terracotta | E0D890 | 1F90F0 | none |
| taiga | Taiga | Cold | -0.25 | -0.3 | +0.2 | 0.0 | 0.0 | 0.0 | grass_block | dirt | 84A5C8 | 245B78 | snow** |
| snowy_taiga | Snowy Taiga | Cold | -0.5 | -0.5 | +0.2 | 0.0 | 0.0 | 0.0 | grass_block | dirt | 84A5C8 | 245B78 | snow |
| old_growth_pine_taiga | Old Growth Pine Taiga | Cold | -0.25 | -0.3 | +0.2 | 0.0 | -0.3 | 0.0 | grass_block | dirt | 84A5C8 | 245B78 | snow** |
| old_growth_spruce_taiga | Old Growth Spruce Taiga | Cold | -0.25 | -0.3 | +0.2 | 0.0 | -0.3 | 0.0 | grass_block | dirt | 84A5C8 | 245B78 | snow** |
| snowy_plains | Snowy Plains | Cold | -0.5 | -0.5 | 0.0 | 0.0 | 0.0 | 0.0 | snow_block | dirt | 84A5C8 | 185390 | snow |
| ice_spikes | Ice Spikes | Cold | -0.5 | -0.5 | 0.0 | 0.0 | 0.0 | +0.7 | snow_block | dirt | 84A5C8 | 185390 | snow |
| windswept_hills | Windswept Hills | Mountain | 0.2 | 0.0 | 0.0 | 0.0 | -0.5 | 0.0 | stone | dirt | 78A7FF | 3F76E4 | rain |
| windswept_forest | Windswept Forest | Mountain | 0.2 | 0.0 | 0.0 | 0.0 | -0.5 | 0.0 | grass_block | dirt | 78A7FF | 3F76E4 | rain |
| windswept_gravelly_hills | Windswept Gravelly Hills | Mountain | 0.2 | 0.0 | 0.0 | 0.0 | -0.5 | +0.2 | gravel | gravel | 78A7FF | 3F76E4 | rain |
| meadow | Meadow | Mountain | 0.5 | 0.0 | 0.0 | 0.0 | -0.3 | 0.0 | grass_block | dirt | 84A5C8 | 245B78 | rain |
| grove | Grove | Mountain | -0.45 | -0.45 | 0.0 | 0.0 | -0.5 | 0.0 | snow_block | dirt | 84A5C8 | 245B78 | snow |
| snowy_slopes | Snowy Slopes | Mountain | -0.4 | -0.45 | 0.0 | 0.0 | -0.5 | 0.0 | snow_block | dirt | 84A5C8 | 245B78 | snow |
| jagged_peaks | Jagged Peaks | Mountain | -0.93 | -0.93 | 0.0 | 0.0 | -0.7 | 0.0 | stone | stone | 84A5C8 | 245B78 | snow |
| frozen_peaks | Frozen Peaks | Mountain | -0.94 | -0.94 | 0.0 | 0.0 | -0.7 | 0.0 | packed_ice | stone | 84A5C8 | 245B78 | snow |
| stony_peaks | Stony Peaks | Mountain | 1.0 | +0.7 | 0.0 | 0.0 | -0.7 | 0.0 | stone | stone | 84A5C8 | 245B78 | rain |
| cherry_grove | Cherry Grove | Mountain | 0.5 | 0.0 | 0.0 | 0.0 | -0.3 | +0.7 | grass_block | dirt | 84A5C8 | 245B78 | rain |
| mushroom_fields | Mushroom Fields | Special | 0.5 | 0.0 | 0.0 | -1.05 | 0.0 | 0.0 | mycelium | dirt | 78A7FF | 3F76E4 | none |
| lush_caves | Lush Caves | Cave | 0.5 | +0.7 | +0.7 | n/a | 0.0 | 0.0 | stone | stone | 78A7FF | 3F76E4 | n/a |
| dripstone_caves | Dripstone Caves | Cave | 0.5 | -0.3 | -0.2 | n/a | 0.0 | 0.0 | stone | stone | 78A7FF | 3F76E4 | n/a |
| deep_dark | Deep Dark | Cave | 0.5 | 0.0 | 0.0 | n/a | 0.0 | 0.0 | deepslate | deepslate | 78A7FF | 3F76E4 | n/a |
| the_void | The Void | Special | n/a | n/a | n/a | n/a | n/a | n/a | air | air | 000000 | 000000 | none |

\* Frozen Ocean: rain in warm margins, snow in cold center.
\** Taiga family: snow only above Y=120 (mountain Y threshold).

### 2.1 Hot Biomes

Hot biomes are characterized by **no rain** (desert, savanna, badlands) or **lush jungle** climates. Surface temperatures are above 0.95 (legacy) or multi-noise T > 0.55.

#### 2.1.1 Desert — `minecraft:desert`

| Property | Value |
|---|---|
| Climate (T,H,C,E,W) | +0.7, -0.5, mid, mid, 0 |
| Surface top | `minecraft:sand` (4 blocks deep) |
| Filler | `minecraft:sandstone` below sand |
| Sky color | `#E0D890` |
| Water color | `#1F90F0` (rarely used; mostly no water) |
| Weather | None — no rain, no snow |
| Spawnable mobs | Husk (hostile), Rabbit, Creeper, Skeleton, Spider, Zombie, Enderman, Witch, Slime (slime chunk) |
| Structures | Desert Village, Desert Pyramid, Pillager Outpost, Buried Treasure (rare), Ruined Portal, Fossil |
| Vegetation | Dead bush, cactus (rare clusters), sugarcane near water (oases) |
| Notes | Below sand layer (4 blocks) is sandstone. Below Y=0 sandstone becomes stone. Lava lakes can spawn in caves. No passive animal spawns. |

#### 2.1.2 Savanna — `minecraft:savanna`

| Property | Value |
|---|---|
| Climate | +0.7, -0.2, mid, mid, 0 |
| Surface | grass_block / dirt |
| Sky / water | `#E0D890` / `#1F90F0` |
| Weather | None |
| Mobs | Horse, Donkey, Sheep, Cow, Pig, Chicken, Llama (windswept variant only) |
| Structures | Savanna Village, Pillager Outpost, Ruined Portal |
| Vegetation | Acacia trees (sparse), tall grass, melon (rare), pumpkin |
| Notes | Horses/donkeys spawn ONLY in plains & savanna. |

#### 2.1.3 Savanna Plateau — `minecraft:savanna_plateau`

Raised variant of savanna at higher Y (typically Y > 80). Slightly fewer trees.

#### 2.1.4 Windswept Savanna — `minecraft:windswept_savanna` (formerly shattered savanna)

| Property | Value |
|---|---|
| Climate | +0.7, -0.2, mid, **low erosion**, 0 |
| Surface | grass_block / dirt |
| Weather | None |
| Mobs | Same as savanna, plus Llama |
| Terrain | Extremely jagged — mountains rising to Y=200+ directly from savanna floor |
| Structures | Ruined Portal (rare) |

#### 2.1.5 Badlands — `minecraft:badlands` (formerly mesa)

| Property | Value |
|---|---|
| Climate | +0.7, -0.5, mid, mid, 0 |
| Surface | `minecraft:red_sand` (top), `minecraft:terracotta` (sub) |
| Sky / water | `#E0D890` / `#1F90F0` |
| Weather | None |
| Mobs | Armadillo (1.20.5+), Spider, Zombie, Skeleton, Creeper, Slime, Enderman, Witch, Bat |
| Structures | Badlands mineshaft (uses dark_oak_planks instead of oak, surfaces above Y=0), Ruined Portal |
| Special | Terracotta color bands generated by a 16-bit noise function across Y, producing striped "badlands" pattern. |
| Vegetation | Dead bush, cactus, occasional oak tree (rare) |
| Ore bonus | **Gold ore** generates at Y=-64..32 (much higher density than normal), replacing stone. |

#### 2.1.6 Wooded Badlands — `minecraft:wooded_badlands`

| Property | Value |
|---|---|
| Climate | +0.7, -0.5, mid, **low erosion**, 0 |
| Surface | red_sand / terracotta (top of plateaus), grass on slopes |
| Vegetation | Oak trees (dense at plateau edges), dead bush, cactus |
| Structures | Badlands mineshaft |

#### 2.1.7 Eroded Badlands — `minecraft:eroded_badlands`

| Property | Value |
|---|---|
| Climate | +0.7, -0.5, mid, mid, **+0.7** (high weirdness = rare variant) |
| Terrain | Tall narrow spires of terracotta rising from the badlands — "Bryce formation" |
| Surface | terracotta (multi-colored bands visible on spires) |

#### 2.1.8 Jungle — `minecraft:jungle`

| Property | Value |
|---|---|
| Climate | +0.5, +0.7, mid, mid, 0 |
| Surface | grass_block / dirt |
| Sky / water | `#78A7FF` / `#1F90F0` |
| Weather | Rain |
| Mobs | **Ocelot**, **Panda** (rare), Parrot, Sheep, Pig, Chicken, Cow; hostiles: Zombie, Skeleton, Creeper, Enderman, Witch, Spider, Slime |
| Structures | Jungle Temple, Ruined Portal, Jungle Pyramid (Bamboo jungle variant) |
| Vegetation | **Jungle trees** (huge 2x2 trunk variant), melon patches, vines on every leaf, ferns, large ferns, bamboo (rare), cocoa on jungle logs |
| Bush feature | "Jungle bush" — small 1-block jungle tree with leaf cluster |

#### 2.1.9 Sparse Jungle — `minecraft:sparse_jungle` (formerly jungle_edge)

| Property | Value |
|---|---|
| Climate | +0.5, +0.7, mid, mid, -0.2 (low weirdness = less special) |
| Density | Lower tree density; transition zone between jungle and surrounding biome |

#### 2.1.10 Bamboo Jungle — `minecraft:bamboo_jungle`

| Property | Value |
|---|---|
| Climate | +0.5, +0.7, mid, mid, +0.7 (high weirdness = rare variant) |
| Surface | `minecraft:podzol` (top), dirt (filler) |
| Mobs | **Panda** (common here — guaranteed spawn), Ocelot, Parrot |
| Vegetation | Bamboo (very dense), jungle trees (sparse), podzol replaces grass |
| Structures | Jungle Temple |

#### 2.1.11 Mangrove Swamp — `minecraft:mangrove_swamp` (1.19+)

| Property | Value |
|---|---|
| Climate | +0.5, +0.6, mid, mid, 0 |
| Surface | `minecraft:mud` (top 1-2 blocks), dirt below |
| Water color | `#3A7A6D` (unique green-tinted water) |
| Sky | `#4E6B45` (greenish) |
| Weather | Rain |
| Mobs | Frog (warm variant = "warm frog"), Slime (high rate), Tropical Fish, Cod, Salmon, Squid |
| Vegetation | **Mangrove trees** with **prop roots** (1 trunk splits into 4+ root blocks); mangrove propagules, lily pads, seagrass underwater |
| Terrain | Sea level is at surface — most of biome is underwater at Y=62 |
| Structures | Swamp Hut (witch hut) — shared with regular Swamp |

#### 2.1.12 Warm Ocean — `minecraft:warm_ocean`

| Property | Value |
|---|---|
| Climate | +0.55, 0, low C (ocean), mid, 0 |
| Surface | sand / sand |
| Water color | `#02B0D8` (bright turquoise) |
| Weather | Rain |
| Temperature | Above 0.95 legacy — **no freezing** |
| Features | **Coral reefs** (5 coral colors + coral fans), sea pickles, kelp (rare), seagrass, tropical fish, dolphins, squid, drowned |
| Structures | Shipwreck, Ocean Ruin (warm variant), Buried Treasure, Ruined Portal (underwater) |

### 2.1.13 Deprecated/Removed Hot Biomes

- `minecraft:desert_lakes` — 1.17 desert variant (hills in desert). **Removed in 1.18**; merged into regular `desert` via the erosion axis.
- `minecraft:desert_hills` — same fate as desert_lakes.
- `minecraft:shattered_savanna_plateau` — merged into `windswept_savanna`.
- `minecraft:modified_badlands_plateau`, `minecraft:badlands_plateau`, `minecraft:wooded_badlands_plateau` — merged into the erosion axis.

Implementing clones should NOT use these IDs — they are dead.

---

### 2.2 Temperate Biomes

The most common land category. Multi-noise T around 0, continentalness near 0, mid erosion. Lush, green, rainy.

#### 2.2.1 Plains — `minecraft:plains`

| Property | Value |
|---|---|
| Climate | 0, 0, mid, mid, 0 |
| Surface | grass_block / dirt |
| Sky / water | `#78A7FF` / `#3F76E4` |
| Weather | Rain |
| Mobs | Horse (rare), Donkey (rare), Sheep, Cow, Pig, Chicken; hostiles: Zombie, Skeleton, Creeper, Spider, Enderman, Witch, Slime (slime chunk) |
| Structures | Plains Village, Pillager Outpost, Ruined Portal, Buried Treasure (rare) |
| Vegetation | Short grass (very common), occasional oak tree (5% of chunks), flowers (dandelion, poppy, azure bluet, oxeye daisy, cornflower) |
| Lakes | Small water lakes (rare), occasional lava lake |

#### 2.2.2 Sunflower Plains — `minecraft:sunflower_plains`

| Property | Value |
|---|---|
| Climate | 0, 0, mid, mid, **+0.7** (high weirdness = rare variant) |
| Vegetation | Same as plains but **sunflowers** are abundant (10-20% coverage). |
| Other | Identical mobs/structures to plains. |

#### 2.2.3 Forest — `minecraft:forest`

| Property | Value |
|---|---|
| Climate | 0, 0, mid, mid, 0 |
| Surface | grass_block / dirt |
| Sky | `#79A7FF` |
| Mobs | Sheep, Pig, Chicken, Cow, Wolf (forest only — rare), Fox (forest only) |
| Vegetation | Oak + Birch trees (mixed, ~10% coverage), ferns, tall grass, mushrooms, occasional giant mushroom (rare) |
| Structures | Ruined Portal, Woodland Mansion entrance never spawns in regular forest (only Dark Forest) |

#### 2.2.4 Flower Forest — `minecraft:flower_forest`

| Property | Value |
|---|---|
| Climate | 0, 0, mid, mid, **+0.7** |
| Vegetation | All small flowers (rare ones included: tulips, allium, oxeye daisy, lily of the valley, cornflower, blue orchid), plus trees (sparse). Bee nests more common in trees here. |

#### 2.2.5 Birch Forest — `minecraft:birch_forest`

Forest where the only tree species is **birch**. Otherwise identical to forest. Sky color `#78A7FF`.

#### 2.2.6 Old Growth Birch Forest — `minecraft:old_growth_birch_forest` (formerly tall_birch_forest)

| Property | Value |
|---|---|
| Climate | 0, 0, mid, mid, +0.7 |
| Trees | Birch trees that grow **2x taller** (10-15 blocks vs normal 5-7) |

#### 2.2.7 Dark Forest — `minecraft:dark_forest`

| Property | Value |
|---|---|
| Climate | 0, +0.2, mid, mid, 0 |
| Sky | `#78A7FF` (but **appears dark** due to canopy filtering sunlight) |
| Surface | grass_block / dirt |
| Mobs | Sheep, Pig, Chicken, Cow (rare) |
| Trees | **Dark oak trees** (only place they spawn naturally); 2x2 trunk giant variants |
| Structures | **Woodland Mansion** (very rare, only in dark forests far from spawn) |
| Special | Roofed canopy filters ~70% of sunlight, making it perpetually darker (hostile mobs can spawn at any time) |

#### 2.2.8 Swamp — `minecraft:swamp`

| Property | Value |
|---|---|
| Climate | 0, +0.2, mid, mid, 0 |
| Surface | grass_block / dirt (with **water patches** at Y=62) |
| Sky / water | `#6BA941` / `#4A6B8A` (uniquely dark green water) |
| Weather | Rain |
| Mobs | **Slime** (high rate at night, regardless of moon phase), Witch (rare passive spawn at huts), Tropical Fish (rare) |
| Structures | **Swamp Hut** (witch hut — spawns witches), Ruined Portal, Fossil (large bone structures underground) |
| Vegetation | Oak trees (with **vines** hanging from leaves), swamp-tall grass, lily pads (dense on water), mushrooms (red & brown), blue orchid (only here), seagrass |
| Terrain | Sea level = surface; shallow water everywhere; "humps" of land between ponds |

#### 2.2.9 River — `minecraft:river`

| Property | Value |
|---|---|
| Climate | 0, 0, mid, mid, 0 |
| Surface | dirt / dirt (replaced by water at Y < 63) |
| Sky | `#78A7FF` |
| Mobs | Squid, Cod, Salmon, Drowned (at night), normal land mobs on the banks |
| Structures | Ruined Portal, sometimes Buried Treasure near mouth |
| Terrain | Carves a strip of Y=62 water through surrounding biome |

#### 2.2.10 Lukewarm Ocean / Deep Lukewarm Ocean — `minecraft:lukewarm_ocean` / `minecraft:deep_lukewarm_ocean`

| Property | Value |
|---|---|
| Climate | +0.25, 0, ocean/deep, mid, 0 |
| Surface | sand / sand |
| Water color | `#0D96D8` (slightly warmer than cold ocean) |
| Mobs | Cod, Pufferfish, Tropical Fish, Squid, Dolphin, Drowned |
| Structures | Ocean Ruin (cold variant), Shipwreck, Ocean Monument (in deep variant) |

#### 2.2.11 Beach — `minecraft:beach`

| Property | Value |
|---|---|
| Climate | 0, 0, coast (C ~ -0.1), mid, 0 |
| Surface | sand / sand |
| Mobs | Turtle (lays eggs here) |
| Terrain | Flat strip at Y=63 between ocean and inland biome |

#### 2.2.12 Mushroom Fields — `minecraft:mushroom_fields`

| Property | Value |
|---|---|
| Climate | 0, 0, **-1.05** (very deep ocean threshold), mid, 0 |
| Surface | **`minecraft:mycelium`** / dirt |
| Sky | `#78A7FF` |
| Water | `#3F76E4` |
| Weather | None |
| Mobs | **Mooshroom** (only here — guaranteed spawns), Bats (in caves); **NO hostile mob spawns** on the surface even at night — this is the safest biome in the game |
| Structures | None (no villages, no temples, no outposts). Ruined Portal can spawn. |
| Vegetation | **Giant mushrooms** (huge red & brown) growing on the surface like trees; no grass, no flowers |
| Notes | Always surrounded by Deep Ocean. Rare — ~1 per 10,000 chunks. |

#### 2.2.13 Mushroom Field Shore — `minecraft:mushroom_field_shore`

**Removed in 1.18**. Formerly a beach variant of mushroom fields. Use `mushroom_fields` for new generation.

---

### 2.3 Cold Biomes

Multi-noise T < -0.15. Snow falls instead of rain. Trees are spruce-dominant.

#### 2.3.1 Taiga — `minecraft:taiga`

| Property | Value |
|---|---|
| Climate | -0.3, +0.2, mid, mid, 0 |
| Surface | grass_block / dirt (with **podzol** patches under spruce trees, ~10%) |
| Sky | `#84A5C8` (lighter blue) |
| Water | `#245B78` (darker blue than temperate) |
| Weather | Snow at high Y (>120), rain at low Y |
| Mobs | **Wolf** (only here & in groves & snowy taiga), **Fox** (only here & groves), Sheep, Pig, Cow, Chicken, Rabbit (white variant); hostiles: Zombie, Skeleton, Creeper, Spider, Enderman, Witch, Slime |
| Structures | Village (taiga variant), Pillager Outpost, Ruined Portal, Igloo (rare) |
| Vegetation | **Spruce trees** (very common), ferns, large ferns, dead bush, sweet berry bushes |

#### 2.3.2 Snowy Taiga — `minecraft:snowy_taiga`

| Property | Value |
|---|---|
| Climate | -0.5, +0.2, mid, mid, 0 |
| Surface | snow_block (snow layer on grass_block) / dirt |
| Sky | `#84A5C8` |
| Water | `#245B78` |
| Weather | Snow always |
| Mobs | Wolf, Fox (snow variant — white), Rabbit (white), Sheep, Pig, Chicken |
| Structures | Igloo, Ruined Portal |

#### 2.3.3 Old Growth Pine Taiga — `minecraft:old_growth_pine_taiga` (formerly giant_tree_taiga)

| Property | Value |
|---|---|
| Climate | -0.3, +0.2, mid, low erosion, 0 |
| Vegetation | **2x2 spruce trees** with leaves only at top (lollipop shape) — "pine" giants |
| Podzol | Podzol replaces grass under giant trees (much more common) |

#### 2.3.4 Old Growth Spruce Taiga — `minecraft:old_growth_spruce_taiga`

Like old growth pine taiga but trees have leaves along the full trunk (spruce giants). Sky darker.

#### 2.3.5 Snowy Plains — `minecraft:snowy_plains` (formerly snowy_tundra)

| Property | Value |
|---|---|
| Climate | -0.5, 0, mid, mid, 0 |
| Surface | snow_block (on grass_block) / dirt |
| Sky / water | `#84A5C8` / `#185390` |
| Weather | Snow |
| Mobs | Rabbit (white), Polar Bear (rare, near ice), Sheep, Cow, Pig, Chicken (rare) |
| Structures | Igloo (most common here), Ruined Portal |
| Vegetation | None (no trees, no grass, no flowers) — extremely barren. Occasional patch of ferns. |
| Special | Ice spikes variant in rare sub-region. Snow layers accumulate up to 8 high during snowfall. |

#### 2.3.6 Ice Spikes — `minecraft:ice_spikes`

| Property | Value |
|---|---|
| Climate | -0.5, 0, mid, mid, **+0.7** |
| Surface | snow_block / dirt (with `minecraft:packed_ice` spikes) |
| Terrain | Tall **packed-ice spikes** rising 10-50 blocks from the plain, mostly 1-3 blocks wide |
| Mobs | Same as snowy plains |
| Structures | None |

#### 2.3.7 Snowy Beach — `minecraft:snowy_beach`

Beach variant where snow falls. Snow layer on sand. Sky `#84A5C8`, water `#245B78`.

#### 2.3.8 Cold Ocean / Deep Cold Ocean — `minecraft:cold_ocean` / `minecraft:deep_cold_ocean`

| Property | Value |
|---|---|
| Climate | -0.3, 0, ocean/deep, mid, 0 |
| Surface | gravel / gravel |
| Water color | `#205E83` (dark blue) |
| Mobs | Cod, Salmon, Squid, Dolphin (rare), Drowned |
| Structures | Ocean Ruin (cold), Shipwreck, Ocean Monument (deep variant) |

#### 2.3.9 Frozen River — `minecraft:frozen_river`

River variant where surface water is **ice**. Water below ice still flows. Mobs same as river but polar bears occasionally wander in.

#### 2.3.10 Frozen Ocean / Deep Frozen Ocean — `minecraft:frozen_ocean` / `minecraft:deep_frozen_ocean`

| Property | Value |
|---|---|
| Climate | -0.5, 0, ocean/deep, mid, 0 |
| Surface | gravel / gravel (top of water is **ice**, with **blue_ice** patches in deep variant) |
| Water | `#245B78` |
| Weather | Snow (in center), Rain (at warm margins) |
| Mobs | **Polar Bear** (only here & icy biomes), Cod, Salmon, Squid, Drowned |
| Structures | Ocean Ruin (cold), Shipwreck, Ocean Monument (rare, deep variant), Ruined Portal |

#### 2.3.11 Grove — `minecraft:grove`

| Property | Value |
|---|---|
| Climate | -0.45, 0, mid, low erosion, 0 |
| Surface | snow_block / dirt |
| Terrain | Mountain slope forested with spruce |
| Mobs | Wolf, Fox, Rabbit, Sheep (rare) |
| Vegetation | Spruce trees |

#### 2.3.12 Snowy Slopes — `minecraft:snowy_slopes`

| Property | Value |
|---|---|
| Climate | -0.45, 0, mid, low erosion, 0 |
| Surface | snow_block / dirt (with **powder snow** patches in rabbit holes) |
| Terrain | Open snowfield above the treeline |
| Mobs | Rabbit (white), Goat (only here & frozen peaks & jagged peaks) |
| Structures | Pillager Outpost (rare), Igloo (very rare) |
| Special | Powder snow traps — entities sink in and freeze. |

#### 2.3.13 Jagged Peaks — `minecraft:jagged_peaks`

| Property | Value |
|---|---|
| Climate | -0.93, 0, mid, very low erosion, 0 |
| Surface | stone / stone (snow on top) |
| Terrain | Sharp spires reaching Y=256+; the tallest natural biome |
| Mobs | Goat (only here) |
| Structures | None |

#### 2.3.14 Frozen Peaks — `minecraft:frozen_peaks`

| Property | Value |
|---|---|
| Climate | -0.94, 0, mid, very low erosion, 0 |
| Surface | packed_ice / stone (with **packed_ice** and **blue_ice** bands) |
| Terrain | Glacial peaks — smoother than jagged peaks, mostly ice-covered |
| Mobs | Goat |
| Structures | None |

---

### 2.4 Mountain Biomes

Introduced in 1.18 as part of the terrain overhaul. Generated by combining **low erosion** with the multi-noise axes.

| Biome | Climate (T,H,C,E,W) | Surface | Trees | Key feature |
|---|---|---|---|---|
| Meadow | 0, 0, mid, low, 0 | grass_block | Oak (rare, single) | Open flower meadow at mountain base; flowers unique (cornflower, allium, oxeye daisy in clusters) |
| Grove | -0.45, 0, mid, low, 0 | snow_block | Spruce | Snowy spruce forest on slopes |
| Snowy Slopes | -0.45, 0, mid, low, 0 | snow_block | None | Snowfields with powder snow traps; goats |
| Jagged Peaks | -0.93, 0, mid, very-low, 0 | stone | None | Sharpest spires |
| Frozen Peaks | -0.94, 0, mid, very-low, 0 | packed_ice | None | Glacial peaks |
| Stony Peaks | +0.7, 0, mid, very-low, 0 | stone | None | Bare rock peaks (no snow because hot); calcite & granite bands |
| Cherry Grove (1.20+) | 0, 0, mid, low, +0.7 | grass_block | Cherry (pink leaves) | Pink-petaled meadow; only place cherry trees grow |

**Generation rule:** Mountain biomes spawn where continentalness is mid (inland), erosion is low (rugged), and the temperature is extreme (very cold for frozen/jagged/grove/snowy-slopes; very hot for stony peaks). Meadows spawn at the warm edge of the mountain band (T around 0) where elevation is moderate.

---

### 2.5 Ocean Biomes

All Overworld ocean biomes share continentalness < -0.15. Sub-types are split by temperature (T) and depth (deep vs shallow, picked from C value: -0.3 vs -0.6).

| Biome | T | Depth | Surface | Water color | Reef? | Cod | Salmon | Tropical | Pufferfish | Dolphin | Polar Bear | Drowned | Monument |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Ocean | 0.0 | shallow | gravel | `#3F76E4` | No | Yes | No | No | No | Yes | No | Yes | Rare |
| Deep Ocean | 0.0 | deep | gravel | `#3F76E4` | No | Yes | No | No | No | Yes | No | Yes | Yes |
| Lukewarm Ocean | +0.25 | shallow | sand | `#0D96D8` | No | Yes | No | Yes | Yes | Yes | No | Yes | Rare |
| Deep Lukewarm Ocean | +0.25 | deep | sand | `#0D96D8` | No | Yes | No | Yes | Yes | Yes | No | Yes | Yes |
| Warm Ocean | +0.55 | shallow | sand | `#02B0D8` | **Yes** | No | No | Yes | Yes | Yes | No | Yes | Rare |
| Cold Ocean | -0.3 | shallow | gravel | `#205E83` | No | Yes | Yes | No | No | Yes | No | Yes | Rare |
| Deep Cold Ocean | -0.3 | deep | gravel | `#205E83` | No | Yes | Yes | No | No | Yes | No | Yes | Yes |
| Frozen Ocean | -0.5 | shallow | gravel+ice | `#245B78` | No | Yes | Yes | No | No | Rare | Yes | Yes | Rare |
| Deep Frozen Ocean | -0.5 | deep | gravel+ice+blue_ice | `#245B78` | No | Yes | Yes | No | No | Rare | Yes | Yes | Yes |

**Deep Ocean is required for Ocean Monument generation.** Shallow ocean variants do not get monuments.

**Warm Ocean is the only ocean with coral reefs.** Coral dies if removed from water, and only generates in warm ocean at Y < 30.

#### 2.5.1 Ocean Generation Peculiarities

- Sea level is `Y=63` (in Java 1.18+; was `Y=62` before).
- Ocean floor is `Y=40` to `Y=50` for shallow, `Y=30` to `Y=40` for deep.
- Oceans below sea level that touch caves/ravines can have **magma blocks** and **bubble columns** in the floor.
- **Ocean monuments** are deterministic from the seed and grid — every region (32×32 chunks) gets exactly one monument attempt, and the structure places only if the center area is entirely "deep ocean".

---

### 2.6 Cave Biomes

Three cave biomes exist in the Overworld as of 1.21:

#### 2.6.1 Lush Caves — `minecraft:lush_caves`

| Property | Value |
|---|---|
| Climate (surface-temperature dependent) | T > +0.7 (hot), H > +0.6 (humid) |
| Depth | D < -0.3 (underground) |
| Surface | `minecraft:stone` (top), but heavily decorated |
| Light | Glow berries hang from ceiling (provide light level 14) |
| Decorations | **Glow berries** (ceiling vines), **spore blossoms** (ceiling), **draping azalea roots**, **moss carpets**, **big dripleaves**, **small dripleaves**, **hanging roots**, **cave vines** (with berries), **azalea trees** at surface entry, **clay pools** |
| Mobs | **Axolotl** (only here, in water), **Tropical Fish** (in water), Glow Squid, Bat |
| Water | Often flooded — water pools at Y=~-20 to -50 |
| Notes | Surface biome must be jungle or dark forest or similar lush biome for lush caves to spawn underneath |

#### 2.6.2 Dripstone Caves — `minecraft:dripstone_caves`

| Property | Value |
|---|---|
| Climate | T < -0.1 (cold/dry), H < +0.2 |
| Depth | D < -0.3 |
| Surface | stone |
| Decorations | **Stalactites** (pointed dripstone hanging), **stalagmites** (pointed dripstone rising), **dripstone blocks** (covering floor patches), **large stalactite+stalagmite columns** (rare). |
| Mobs | Glow Squid (very common in pools) |
| Special mechanics | Dripstone stalactites drip water (or lava if a lava source is above). Falling stalactites damage entities. Dripstone grows over time. |

#### 2.6.3 Deep Dark — `minecraft:deep_dark`

| Property | Value |
|---|---|
| Climate | T=0, H=0 (any climate) |
| Depth | Y < -52 (D < -0.8) |
| Surface | `minecraft:deepslate` (replaces stone below Y=0) |
| Decorations | **Sculk blocks**, **sculk sensors**, **sculk catalysts**, **sculk shriekers**, **sculk veins** (patches growing on surfaces) |
| Mobs | **Warden** (summoned — not a natural spawn, triggered by Sculk Shrieker activation 4 times). NO hostile mob spawns naturally here (replaces zombie/skeleton/creeper spawn rates with 0). |
| Structures | **Ancient City** — the only structure that generates in deep dark; large palace-like ruin |
| Soundscape | Heartbeat sound plays near Ancient City centers |
| Special | The "no mob spawns" rule is unique to deep dark — it is the safest cave biome because there are no zombies, but the Warden makes it dangerous |

#### 2.6.4 Cave Generation Algorithm

Caves in 1.18+ use two distinct carvers plus a noise-based cave system:

1. **Noodle caves** — thin twisting 3D Perlin-noise tunnels (1-3 block radius)
2. **Spaghetti caves** — wider Perlin-noise worms (3-8 block radius)
3. **Cheese caves** — large blob-shaped voids carved by a 3D threshold on Perlin noise (the most distinctive 1.18 cave shape)
4. **Carver ravines** — long narrow slot canyons (legacy from pre-1.18)

The noise parameter `final_density` is computed at each block; if density < `cave_threshold` (default `0.0`), the block is air (cave); else it's stone (or fluid). The cave-noise component is added to the terrain-noise to produce "holes".

---

### 2.7 River / Wetland Biomes

| Biome | Climate | Surface | Sky | Water | Weather | Notes |
|---|---|---|---|---|---|---|
| River | 0, 0, mid, mid, 0 | dirt (below water) | `#78A7FF` | `#3F76E4` | Rain | Carves water strip through surrounding biome |
| Frozen River | -0.5, 0, mid, mid, 0 | dirt (below ice) | `#80A5C8` | `#185390` | Snow | Surface frozen — ice on top |
| Swamp | 0, +0.2, mid, mid, 0 | grass_block | `#6BA941` | `#4A6B8A` | Rain | Sea-level water patches, slime-spawn hotspot |
| Mangrove Swamp | +0.5, +0.6, mid, mid, 0 | mud | `#4E6B45` | `#3A7A6D` | Rain | Mangrove trees with prop roots, mud surface |

River and Frozen River are **3D biomes** generated by carving a "river valley" through the noise — they don't have a separate surface biome parameter, they're a noise-based overlay.

---

### 2.8 Special Biomes

#### 2.8.1 The Void — `minecraft:the_void`

| Property | Value |
|---|---|
| Climate | n/a |
| Surface | air |
| Use | Default biome for "void" superflat worlds; only generates a single stone platform at spawn |

#### 2.8.2 Custom (datapack)

Java supports custom biomes via datapacks. A custom biome JSON specifies:
- Climate parameter point (T,H,C,E,W,D ranges)
- Surface rules (top block, filler, optional depth function)
- Features list (ordered list of configured features)
- Mob spawn lists (4 categories: monster/creature/ambient/water_creature)
- Particle/sound/fog/grass/water color overrides

This is the extensibility path the prompt kit should expose to users.

---

## 3. Nether Biomes

The Nether has **5 biomes** (Java 1.21). Each has unique fog color, ambient particles, and mob spawning rules. Unlike the Overworld, **Nether biomes do not use the 6-axis climate system** — they use a simpler 2D Perlin noise map and "biome centers" placed by Voronoi.

### 3.0 Nether Biome Quick Reference

| ID | Name | Fog color | Ambient particle | Common blocks | Spawnable mobs | Structures |
|----|------|-----------|------------------|---------------|----------------|------------|
| nether_wastes | Nether Wastes | `#330808` | None | Netherrack, gravel, soul sand (patches), lava, glowstone clusters | Zombie Pigman (Zombified Piglin), Ghast (rare), Piglin, Magma Cube (rare), Strider (on lava), Enderman (rare) | Nether Fortress, Bastion Remnant, Ruined Portal, Nether Fossil |
| soul_sand_valley | Soul Sand Valley | `#1B1818` | Soul (white ash falling) | Soul sand, soul soil, basalt deltas-like basalt pillars, blue fire (soul fire) | Skeleton (very high rate), Ghast (high rate), Enderman (rare), Wither Skeleton (rare, in fortresses only) | Nether Fortress (rare), Ruined Portal, Nether Fossil |
| crimson_forest | Crimson Forest | `#4C031C` | Red spore (red falling) | Crimson nylium (top), netherrack, crimson fungi, crimson stems, nether wart blocks, shroomlights, weeping vines | Hoglin, Piglin, Zombified Piglin, Strider | Bastion Remnant |
| warped_forest | Warped Forest | `#1A051A` | Warped spore (cyan falling) | Warped nylium, netherrack, warped fungi, warped stems, warped wart blocks, shroomlights, twisting vines | **Enderman** (very common — only Nether biome with heavy Enderman spawns), Zombified Piglin (rare), Strider | Bastion Remnant (rare) |
| basalt_deltas | Basalt Deltas | `#1F1F23` | White ash (very dense) | Basalt, blackstone, magma blocks, gravel, lava | **Magma Cube** (very common — only biome where they spawn in swarms), Ghast (rare), Strider | None |

### 3.1 Nether Wastes — `minecraft:nether_wastes`

The "default" Nether biome. Mostly flat netherrack plains with random lava pools, gravel patches, glowstone clusters hanging from the ceiling (Y=127). The original "Hell" biome from 1.2.x is renamed to this — its ID is `minecraft:nether_wastes`; the old `minecraft:hell` ID still appears in legacy code and is treated as an alias.

| Property | Value |
|---|---|
| Bedrock ceiling | Y=127 (solid bedrock layer) |
| Bedrock floor | Y=0 (with lava sea at Y=31 default) |
| Lava sea | Y < 31 is lava |
| Fog color | `#330808` (deep red-brown) |
| Sky | n/a — Nether has no sky |
| Structures | Nether Fortress (1 per ~36×36 chunk region), Bastion Remnant (replaces fortress in some regions), Ruined Portal, Nether Fossil |

### 3.2 Soul Sand Valley

Characterized by **soul sand** and **soul soil** surface, with **basalt pillars** rising 10-30 blocks. **Soul fire** (blue fire, made with soul sand/soul soil + flint and steel) is a unique feature. Skeletons spawn in massive numbers — making this one of the most dangerous biomes.

### 3.3 Crimson Forest

Red-tinted Nether forest. **Crimson fungi** (mushroom-trees) grow on **crimson nylium**. **Weeping vines** hang from the underside of nether wart blocks. **Hoglins** spawn here (and only here + bastions) — they are hostile, drop raw porkchop, and can be bred with crimson fungi.

### 3.4 Warped Forest

Cyan-tinted Nether forest. **Warped fungi**, **warped stems**, **twisting vines** (grow upward). **No Hoglins** here (warped fungi repel them). The defining feature: **Endermen spawn here at 5x the normal rate**, making this the best biome to farm Ender Pearls in the Nether.

### 3.5 Basalt Deltas

Volcanic-looking biome. **Basalt** and **blackstone** form jagged islands and pillars over a lava sea. **Magma cubes** spawn here in huge numbers (only biome where they spawn naturally above ground). Ash particles fall constantly, making the air thick. **No fortresses, no bastions, no fossils** — the most structure-barren Nether biome.

### 3.6 Legacy Nether Biome: `minecraft:hell`

In 1.16, the original single-biome Nether was renamed to `nether_wastes`. The ID `hell` is still recognized by some vanilla code and datapacks as an alias. New code should use `nether_wastes`.

---

## 4. End Biomes

The End has **5 biomes**, all using the same `minecraft:the_end` block palette (end stone, obsidian, air). Biome differences are purely about feature generation (chorus plants, end cities, gateways) and are picked by a separate 2D noise grid that determines "distance from origin" + "highlands vs midlands vs barrens".

### 4.0 End Biome Quick Reference

| ID | Name | Where it spawns | Chorus plants? | End city? | End ship? | Mobs |
|----|------|-----------------|----------------|-----------|-----------|------|
| the_end | The End (Center Island) | Origin island (radius ~150 blocks) | No | No | No | Enderman (very dense), Ender Dragon |
| end_highlands | End Highlands | Outer islands, high elevation, ~1000+ blocks out | **Yes — dense** | **Yes — most common here** | Yes (rare) | Enderman |
| end_midlands | End Midlands | Outer islands, mid elevation, ring around highlands | Yes — sparse | Yes — rare | No | Enderman |
| end_barrens | End Barrens | Outer islands, low/bare rock | No | No | No | Enderman (sparse) |
| small_end_islands | Small End Islands | Tiny floating islands between large islands | No | No | No | Enderman (very sparse) |

### 4.1 The End (Center Island) — `minecraft:the_end`

A single obsidian-and-end-stone disk at `(0,0)` of radius ~150 blocks. The **Ender Dragon** spawns here. Obsidian pillars (10 of them) arranged in a circle, each topped with an end crystal that heals the dragon. Exit portal in the center; activates on dragon death. After dragon is killed, **4 end gateways** spawn pointing outward (one in each cardinal direction) at radius ~75 blocks.

### 4.2 End Highlands

The main "outer end" biome. **End cities** are most common here (~1 per 5 chunks of highlands). **Chorus plants** grow on end stone here and only here. **End ships** (with elytra) are attached to ~20% of end cities.

### 4.3 End Midlands

Lower-elevation ring around highlands. Same features but sparser. End cities can spawn here but at lower frequency. No end ships.

### 4.4 End Barrens

The bare end stone "shore" between midlands and the void. No chorus plants, no structures. Just Endermen.

### 4.5 Small End Islands

Tiny 1-3 block floating islands scattered in the void between large islands. Spawned by a separate noise function (high-frequency, low amplitude). Useful only for island-hopping via chorus-fruit or ender-pearl.

### 4.6 End Generation Algorithm

The End is generated by:
1. **Center island** — fixed obsidian-and-end-stone disk at `(0,0)`, radius 150, height 0-64.
2. **Outer islands** — generated by a 2D noise function that produces "islands" of end stone at large distances from origin (starting ~1000 blocks out). The noise is biased so islands cluster into "continents" separated by vast void.
3. **Biome assignment** — based on the island's elevation: high = highlands, low = midlands, edge = barrens, sub-noise-threshold = small islands.

---

## 5. Structures Reference

Structures are placed deterministically by hashing (chunk coordinates, structure seed). Each structure has a **grid spacing** (e.g., 32 chunks) and a **separation** (e.g., 8 chunks) that prevent two structures from being too close.

| Structure | ID | Biomes | Grid (chunks) | Sep | Avg distance | Loot? | Mobs |
|---|---|---|---|---|---|---|---|
| Village (Plains) | village | Plains, Sunflower Plains, Meadow | 32 | 8 | ~1024 blocks | Yes | Iron Golem (spawned on generation), Villagers |
| Village (Desert) | village | Desert | 32 | 8 | ~1024 | Yes | Villagers |
| Village (Savanna) | village | Savanna | 32 | 8 | ~1024 | Yes | Villagers |
| Village (Taiga) | village | Taiga (not snowy taiga) | 32 | 8 | ~1024 | Yes | Villagers |
| Village (Snowy) | village | Snowy Plains | 32 | 8 | ~1024 | Yes | Villagers |
| Village (Meadow) | village | Meadow | 32 | 8 | ~1024 | Yes | Villagers |
| Desert Pyramid | desert_pyramid | Desert | 32 | 8 | ~1024 | Yes (4 chests + TNT trap) | None |
| Jungle Temple | jungle_temple | Jungle, Sparse Jungle, Bamboo Jungle | 32 | 8 | ~1024 | Yes (2 chests + dispenser trap) | None |
| Pillager Outpost | pillager_outpost | Plains, Desert, Savanna, Taiga, Snowy Plains, Meadow, Cherry Grove, Grove | 32 | 8 | ~1024 | Yes | Pillagers (continuously spawn near outpost) |
| Woodland Mansion | mansion | Dark Forest only | 80 | 20 | ~10000 blocks (very rare) | Yes (many chests) | Vindicator, Evoker, Ravager (rare) |
| Ocean Monument | monument | Deep Ocean (any temp) | 32 | 5 | ~1024 | Yes (gold blocks in central room) | Guardian, Elder Guardian (3 per monument) |
| Stronghold | stronghold | Any (underground, eye-of-ender leads) | n/a (1 per ring × 8 rings = 128 per world) | n/a | ~1500-2500 from spawn | Yes (library chests, end portal room) | Silverfish |
| Nether Fortress | fortress | Nether Wastes, Soul Sand Valley, Crimson Forest, Warped Forest | 27 | 4 | ~864 | Yes | Blaze, Wither Skeleton, Skeleton, Magma Cube |
| Bastion Remnant | bastion_remnant | Nether Wastes, Crimson Forest, Warped Forest, Soul Sand Valley | 36 | 10 | ~1152 | Yes (gold-heavy loot) | Piglin Brute, Piglin, Hoglin |
| End City | end_city | End Highlands, End Midlands (rare) | 20 | 11 | ~640 | Yes (very high-tier loot) | Shulker |
| Ruined Portal | ruined_portal | Any overworld biome, any nether biome | 40 | 15 | ~1280 | Yes | Piglin (rare, if in Nether), Zombified Piglin (rare, if in Overworld) |
| Shipwreck | shipwreck | Ocean (all variants), Beach | 24 | 4 | ~768 | Yes (supply chests, treasure chests, map chests) | Drowned (rare, can spawn near shipwreck) |
| Buried Treasure | buried_treasure | Beach, Snowy Beach, Stony Shore | 1 | 0 | Every beach chunk (rare per chunk but no minimum spacing) | Yes (heart of the sea + loot) | None |
| Igloo | igloo | Snowy Plains, Snowy Taiga, Snowy Beach | 32 | 8 | ~1024 | Yes (basement chest) | None (villager+zombie in basement) |
| Swamp Hut | swamp_hut | Swamp, Mangrove Swamp | 32 | 8 | ~1024 | Yes (crafting chest) | Witch (continuously spawns inside) |
| Mineshaft | mineshaft | Any overworld biome (underground) | 1 (any chunk can have one, ~1% chance) | n/a | ~1000 avg | Yes (cave spider spawner, minecart chests) | Cave Spider |
| Badlands Mineshaft | mineshaft_mesa | Badlands, Wooded Badlands, Eroded Badlands | 1 (~2% chance, higher than normal) | n/a | ~500 avg | Yes | Cave Spider |
| Ocean Ruin | ocean_ruin | Ocean (cold, lukewarm, warm, frozen — not deep) | 20 | 8 | ~640 | Yes (suspicious sand/gravel + chests) | Drowned |
| Ancient City | ancient_city | Deep Dark only | 96 | 24 | ~3072 | Yes (very high-tier loot — Silence armor trim, swift sneak) | Warden (summoned), NO natural spawns |
| Trial Chambers | trial_chambers | Any overworld biome (underground, Y=-20 to -40) | 96 | 32 | ~3072 | Yes (vaults, ominous vaults) | Trial Spawner mobs (zombies, skeletons, spiders, slimes, etc.), Breeze (in chamber variants) |
| Trail Ruins | trail_ruins | Taiga, Snowy Taiga, Old Growth Pine/Spruce Taiga, Jungle, Sparse Jungle, Swamp, Mangrove Swamp | 32 | 8 | ~1024 | Yes (suspicious gravel + brushes for pottery sherds) | None |
| Nether Fossil | nether_fossil | Soul Sand Valley | 8 | 2 | ~256 | No | None |
| End Gateway | end_gateway | The End (center island after dragon kill, plus outer islands after each subsequent dragon kill) | n/a | n/a | 4 after first kill, 20 max | No | None |

### 5.1 Structure Spawn Exceptions

- **Woodland Mansions** require being at least 10000 blocks from world spawn (they have a "minimum distance from origin" check).
- **Strongholds** are distributed in 8 concentric rings around spawn, with 3 strongholds per ring (24 per world pre-1.9; now 128 per world). Eye of ender leads to nearest.
- **Ocean Monuments** require the **entire 58×58 block footprint** to be in Deep Ocean biomes; if any chunk in the footprint is a non-deep-ocean biome, the monument does not generate.
- **Ancient Cities** only spawn in Deep Dark biome at Y < -52.
- **Trial Chambers** (1.21+) are NOT biome-gated; they generate under any Overworld biome at Y=-40 to Y=-20, with a deterministic grid placement every 96 chunks.

---

## 6. Terrain Features

Beyond biomes, Minecraft generates many "features" that add local variation. A feature is any small-scale procedural element (tree, ore vein, flower patch, lava lake) that runs after the surface rules.

### 6.1 Carvers (caves & ravines)

| Carver | Type | Shape | Where |
|---|---|---|---|
| Cave carver (overworld) | Noise-based 3D | Cheese/spaghetti/noodle caves | Y < 56, overworld |
| Canyon carver (overworld) | Worm path | Long narrow slot, 1 chunk wide, 5 chunks long | Y < 56, overworld |
| Cave carver (nether) | Noise-based 3D | Larger, more interconnected | Y < 127, nether |
| Canyon carver (nether) | Worm path | Same as overworld | Nether |

### 6.2 Lakes

| Lake type | Generation rule |
|---|---|
| Water lake | Small pond ~5x5 blocks, Y=62 (only in non-desert, non-ocean, non-beach biomes); ~1 per 64 chunks |
| Lava lake | Same shape, Y=10 (overworld); ~1 per 64 chunks. In the Nether, lava lakes are everywhere (Y=31 sea level). |

### 6.3 Springs

Springs are single-block liquid sources placed on cliff faces.

| Spring | Where |
|---|---|
| Water spring | Mountain biome walls, cave walls (any Y) |
| Lava spring | Below Y=0 (overworld), any Y (nether) |
| Frozen water spring | Above Y=120 in cold biomes (water source freezes immediately to ice) |

### 6.4 Mountains

The 1.18 mountain overhaul introduced **3D terrain shaping**:

- **Base height noise** determines general elevation.
- **Jaggedness noise** (a high-frequency, high-amplitude noise gated by the weirdness parameter) carves sharp peaks.
- **Continentalness** moves the base up/down at large scale.
- **Erosion** modulates the jaggedness — low erosion = sharp peaks; high erosion = rounded hills.

Mountain biomes spawn at:
- Erosion < -0.5 (low)
- Continentalness > -0.05 (inland)
- Y > 80 (above base terrain)

### 6.5 Hills / Plateaus / Valleys

Hills and plateaus in 1.18+ are no longer a separate "biome variant" — they are emergent from the noise. The same biome can be flat in one place and hilly in another, based on the local erosion value.

Valleys (low areas between hills) are where rivers often carve.

### 6.6 Ravines (Canyons)

Ravines are worm-path carvers with these properties:

| Property | Value |
|---|---|
| Length | 32-128 blocks |
| Width | 1-3 blocks at narrowest, up to 16 blocks at widest |
| Depth | Y=10 to Y=60 |
| Orientation | Random angle, can curve |
| Frequency | ~1 per 50 chunks |

### 6.7 Ore Veins (Feature)

Ores are placed as scattered single-block "scattered ore" features (low density, all Y) plus concentrated "ore vein" features (high density, limited Y range). See the blocks reference (01-research-blocks.md) for ore distribution per Y.

### 6.8 Vegetation Features

| Feature | Where |
|---|---|
| Tree (oak, birch, spruce, jungle, acacia, dark oak, cherry, mangrove, azalea) | Per-biome spawn list, ~1-10 per chunk |
| Huge mushroom (red, brown) | Mushroom Fields, Swamp (rare), Dark Forest (rare) |
| Cactus | Desert, Badlands (small clusters) |
| Sugar cane | Near water in: Jungle, Swamp, Desert, Savanna, River, Beach |
| Pumpkin patch | Plains, Forest, Taiga (rare) |
| Melon patch | Jungle (more common in Bamboo Jungle) |
| Bamboo | Bamboo Jungle, Sparse Jungle (rare) |
| Flowers | Plains, Sunflower Plains, Forest, Flower Forest, Meadow, Cherry Grove, Swamp (blue orchid) |
| Tall grass | Plains, Savanna, Jungle |
| Kelp | Cold/Frozen ocean (deep), Lukewarm ocean |
| Seagrass | All oceans |
| Coral reef | Warm Ocean only |

---

## 7. World Types Reference

The world type determines which generator configuration is used.

### 7.1 Default (`minecraft:normal`)

Standard generation as described throughout this document. Height: Y=-64 to Y=320.

### 7.2 Large Biomes (`minecraft:large_biomes`)

Identical to Default but the **biome noise is sampled at 4x the X/Z scale**, making each biome ~16x larger in area. Terrain detail (caves, rivers, hills) is unchanged.

### 7.3 Amplified (`minecraft:amplified`)

Same biomes as Default but the **height noise amplitude is multiplied ~3x**, producing extreme mountain terrain everywhere. Plains become rolling hills; forests become towering peaks. Cave systems are deeper and more vertical.

### 7.4 Single Biome (`minecraft:single_biome`)

The entire world is one biome. Useful for testing. User can pick any biome including caves and the void. Surface rules for that biome apply globally; cave biomes (Lush, Dripstone, Deep Dark) only apply at their proper Y.

### 7.5 Superflat (`minecraft:flat`)

A flat world made of user-defined layers. Default preset:

```
Layer 0 (Y=-64)  : minecraft:bedrock
Layer 1 (Y=-63)  : minecraft:dirt
Layer 2 (Y=-62)  : minecraft:dirt
Layer 3 (Y=-61)  : minecraft:grass_block
```

Customizable in 1.16+ via datapack: a `flat_level_generator_preset` JSON with `layers` array and optional `biome` and `structure_overrides`. The classic **"Classic Flat"**, **"Tunnelers' Dream"**, **"Water World"**, **"Overworld"**, **"Snowy Kingdom"**, **"Bottomless Pit"**, **"Desert"**, **"Redstone Ready"**, and **"The Void"** presets are built-in.

### 7.6 Debug Mode (`minecraft:debug_mode`)

A grid of every block state in the game, spaced 1 block apart, on a barrier floor. Used for texture/state inspection. No mobs, no structures, no caves. Strictly creative-mode utility.

### 7.7 Custom (`minecraft:custom`)

Datapack-defined generators using `noise_settings` JSON. Lets you tune:
- Height: `min_y`, `height`
- Noise sampling: `sampling.xz_scale`, `sampling.y_scale`, `size_horizontal`, `size_vertical`
- Density function: splines defining terrain shape
- Biome source: `multi_noise` (overworld-style), `the_end` (end-style), `fixed` (single biome)

---

## 8. Random Seed System

### 8.1 Seed Encoding

The world seed is a 64-bit signed integer. When entered as a string in the "Seed" textbox, Minecraft converts the string to a number:

```c
int64_t parse_seed(string input) {
    if (input is empty) return new Random().nextLong();  // random button
    if (input matches /^-?\d+$/) return strtoll(input);  // numeric seed
    return string_hash(input);                            // text seed
}

// Java's String.hashCode() — 32-bit, then expanded to 64-bit:
int32_t string_hash(string s) {
    int32_t h = 0;
    for (char c in s) h = 31 * h + c;
    return h;
}
int64_t parse_string_seed(string s) {
    int32_t h = string_hash(s);
    return (int64_t)h;  // sign-extended
}
```

> **Important:** string seeds only use 32 bits of entropy. Two different strings can collide to the same seed. For full entropy, use a numeric seed entered as a 64-bit number.

### 8.2 World Seed vs Dimension Seeds

```
WorldGenSettings {
  seed: 0x1234567890ABCDEFL        // user-entered world seed
  dimensions: {
    minecraft:overworld: { generator: { biome_source: { seed: <same as world seed> } } },
    minecraft:the_nether: { generator: { biome_source: { seed: <same as world seed> } } },
    minecraft:the_end:    { generator: { biome_source: { seed: <same as world seed> } } }
  }
}
```

By default all three dimensions share the world seed. Datapacks can override per-dimension seeds, allowing independent regeneration of just one dimension.

### 8.3 Seed Input UI Recommendations

| UI element | Behavior |
|---|---|
| Random button | Generates `Random.nextLong()` (time-based) and fills textbox with decimal representation |
| Manual text entry | String OR number — parsed per §8.1 |
| Empty field on world creation | Same as Random button |
| Copy-to-clipboard seed display (F3 screen) | Shows the numeric 64-bit value, even if user entered a string |
| "Re-create" world button | Loads the original numeric seed |

### 8.4 Biome Noise Sampling Algorithm — Full Pseudocode

This is the complete biome-selection algorithm an implementing AI should port to its engine. It assumes:
- A seeded Simplex/Perlin noise function `noise(seed, x, y, z)` returning [-1, +1]
- A biome list `B` with each entry's parameter point (6 ranges)
- World seed `W`

```python
# ---------- Setup ----------

# Six noise functions, each with its own sub-seed derived from world seed
N_temp   = Noise(mix64(W, 0x88E6B4DAL))   # 2D, no Y
N_humid  = Noise(mix64(W, 0xFEE97CD2L))   # 2D
N_cont   = Noise(mix64(W, 0x1B1C7C00L))   # 2D
N_eros   = Noise(mix64(W, 0x9E2C3F60L))   # 2D
N_weird  = Noise(mix64(W, 0x5DEBBE2FL))   # 2D

# Sampling frequencies (lower = larger biome features)
F_temp   = 1.0 / 1024.0    # very large-scale temperature bands
F_humid  = 1.0 / 1024.0
F_cont   = 1.0 / 2048.0    # continentalness is the largest scale
F_eros   = 1.0 / 1024.0
F_weird  = 1.0 / 512.0     # weirdness changes more rapidly

# Smooth-blend kernel size (in blocks)
BLEND = 4

# ---------- Sampling ----------

def sample_climate(x, y, z):
    # Step 1: Sample raw noise at (x, z). Each parameter is a DoublePerlinNoise
    # (sum of two Perlin noises) for smoother results.
    T = N_temp.sample(x * F_temp,  z * F_temp)
    H = N_humid.sample(x * F_humid, z * F_humid)
    C = N_cont.sample(x * F_cont,  z * F_cont)
    E = N_eros.sample(x * F_eros,  z * F_eros)
    W = N_weird.sample(x * F_weird, z * F_weird)

    # Step 2: Compute depth (depends on Y and surface estimate)
    surface_y = estimate_surface_height(x, z)
    D = clamp((surface_y - y) / 80.0, -1.0, +1.0)

    return Climate(T, H, C, E, W, D)

def estimate_surface_height(x, z):
    # Cached lookup of the "noise pillar" height for this column
    return HEIGHT_CACHE[(x, z)]  # filled during the noise stage

# ---------- Blending ----------

def sample_blended_climate(x, y, z):
    # Trilinear-blend 8 corner samples in BLEND-sized cells
    x0 = (x // BLEND) * BLEND;  x1 = x0 + BLEND
    y0 = (y // BLEND) * BLEND;  y1 = y0 + BLEND
    z0 = (z // BLEND) * BLEND;  z1 = z0 + BLEND
    fx = (x - x0) / BLEND
    fy = (y - y0) / BLEND
    fz = (z - z0) / BLEND
    c000 = sample_climate(x0, y0, z0)
    c100 = sample_climate(x1, y0, z0)
    c010 = sample_climate(x0, y1, z0)
    c110 = sample_climate(x1, y1, z0)
    c001 = sample_climate(x0, y0, z1)
    c101 = sample_climate(x1, y0, z1)
    c011 = sample_climate(x0, y1, z1)
    c111 = sample_climate(x1, y1, z1)
    return trilerp(c000, c100, c010, c110,
                   c001, c101, c011, c111, fx, fy, fz)

# ---------- Biome selection ----------

def param_distance(param_range, value):
    if value < param_range.min: return param_range.min - value
    if value > param_range.max: return value - param_range.max
    return 0.0  # inside range — no penalty

def biome_distance(point, climate):
    dt = param_distance(point.temperature,     climate.T)
    dh = param_distance(point.humidity,        climate.H)
    dc = param_distance(point.continentalness, climate.C)
    de = param_distance(point.erosion,         climate.E)
    dw = param_distance(point.weirdness,       climate.W)
    dd = param_distance(point.depth,           climate.D)
    return dt*dt + dh*dh + dc*dc + de*de + dw*dw + dd*dd

def pick_biome(climate):
    best_biome = None
    best_dist  = float('inf')
    for entry in BIOME_LIST:
        d = biome_distance(entry.point, climate)
        if d < best_dist:
            best_dist  = d
            best_biome = entry.biome
    return best_biome

def get_biome_at(x, y, z):
    climate = sample_blended_climate(x, y, z)
    return pick_biome(climate)

# ---------- Height estimation (used by D) ----------

def estimate_surface_height(x, z):
    # Use the same noise pipeline as the noise stage:
    # base shape + detail + jaggedness, scaled by continentalness/erosion
    base   = FBM(noise_base,   x * 1/200, 0, z * 1/200)
    detail = FBM(noise_detail, x * 1/50,  0, z * 1/50)
    C = N_cont.sample(x * F_cont, z * F_cont)
    E = N_eros.sample(x * F_eros, z * F_eros)
    # Continentalness shifts base up: ocean (C<0) lowers, land (C>0) raises
    continental_offset = max(0, C) * 80 - max(0, -C - 0.2) * 80
    # Erosion flattens: low erosion = tall mountains
    height_var = (1 - (E + 1) * 0.5) * 120
    return 64 + base * height_var * 0.3 + detail * 8 + continental_offset
```

### 8.5 Implementation Notes for the Implementing AI

1. **Sample biome at 4×4×4 cell resolution, not per block.** Per-block sampling is wasted effort — biomes change on the order of every 16 blocks horizontally. Vanilla samples at 4-block cells and trilinear-interpolates between them.

2. **Cache the surface height estimate.** The `estimate_surface_height` function is called for every block during the noise stage. Cache it per-column.

3. **Use the same noise seed for ALL climate noises** (different sub-salts, but same base world seed). Otherwise biomes don't reproduce from the seed.

4. **The `BIOME_LIST` order matters for ties.** If two biomes are equidistant, the first one in the list wins. Mojang orders the list with "common" biomes first and "rare variants" last, so the rare variant only wins when it's strictly closer.

5. **Don't forget the depth axis.** Pre-1.18 code only used 5 parameters. If you skip Depth, your cave biomes will not work correctly.

6. **Snow vs rain uses the legacy biome temperature value, not the multi-noise T.** Each biome has a fixed "temperature" property (0.5 for plains, 2.0 for desert, -0.5 for snowy plains, etc.) that determines whether precipitation is snow or rain.

---

## 9. Mob Spawn Rules Per Biome

Minecraft mob spawning is governed by **spawn lists per biome**. Each list has 4 categories:

| Category | When | Light level |
|---|---|---|
| `monster` | Night or dark | Block light ≤ 0 (skylight) or ≤ 7 (anywhere) |
| `creature` | Day on chunk generation | Block light ≥ 9 (sky) |
| `ambient` | Any time (mostly bats) | Block light ≤ 4 |
| `water_creature` | In water, any time | n/a |
| `water_ambient` | In water, mostly cosmetic (fish) | n/a |
| `misc` | Special (squid underwater, etc.) | n/a |

Each spawn list entry has: `{entity_type, weight, min_group, max_group}`.

### 9.1 Mob Spawn Reference Per Biome (Monsters, weight out of total)

> Weight column shows raw weight; total per category varies. Approximate spawn chance per chunk-tick is `weight / sum_of_weights * pack_size_factor`.

| Biome | Zombie | Skeleton | Creeper | Spider | Enderman | Witch | Slime | Husk | Stray | Drowned | Other |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Plains | 95 | 95 | 100 | 100 | 10 | 5 | 100* | — | — | — | — |
| Forest | 95 | 95 | 100 | 100 | 10 | 5 | 100* | — | — | — | — |
| Dark Forest | 95 | 95 | 100 | 100 | 10 | 5 | 100* | — | — | — | — |
| Swamp | 95 | 95 | 100 | 100 | 10 | 5 | 100* + **high slime** | — | — | — | — |
| Desert | 95 | 95 | 100 | 100 | 10 | 5 | 100* | **95** (replaces Zombie) | — | — | — |
| Snowy Plains | 95 | 95 | 100 | 100 | 10 | 5 | 100* | — | **95** (replaces Skeleton) | — | — |
| Taiga | 95 | 95 | 100 | 100 | 10 | 5 | 100* | — | — | — | — |
| Snowy Taiga | 95 | 95 | 100 | 100 | 10 | 5 | 100* | — | 95 | — | — |
| Jungle | 95 | 95 | 100 | 100 | 10 | 5 | 100* | — | — | — | — |
| River | 95 | 95 | 100 | 100 | 10 | 5 | 100* | — | — | — | Drowned at night |
| Frozen River | 95 | 95 | 100 | 100 | 10 | 5 | 100* | — | 95 | — | Drowned at night |
| Beach | 95 | 95 | 100 | 100 | 10 | 5 | 100* | — | — | — | Drowned at night |
| Ocean (shallow) | 95 | 95 | 100 | 100 | 10 | 5 | 100* | — | — | — | Drowned common |
| Deep Ocean | 95 | 95 | 100 | 100 | 10 | 5 | 100* | — | — | — | Drowned very common |
| Frozen Ocean | 95 | 95 | 100 | 100 | 10 | 5 | 100* | — | 95 | — | Drowned |
| Mountains (Jagged Peaks, etc.) | 95 | 95 | 100 | 100 | 10 | 5 | 100* | — | — | — | — |
| Lush Caves | 95 | 95 | 100 | 100 | 10 | 5 | 100* | — | — | — | — |
| Dripstone Caves | 95 | 95 | 100 | 100 | 10 | 5 | 100* | — | — | — | — |
| **Deep Dark** | **0** | **0** | **0** | **0** | **0** | **0** | **0** | — | — | — | Warden (summoned only) |
| Mushroom Fields | **0** | **0** | **0** | **0** | **0** | **0** | **0** | — | — | — | — |

\* Slimes only spawn in "slime chunks" (10% of all chunks, deterministically picked by seed) OR in swamp biomes at Y=50-70 during a full moon.

### 9.2 Passive Mobs Per Biome (Creature category)

| Biome | Sheep | Pig | Cow | Chicken | Horse | Wolf | Fox | Rabbit | Other |
|---|---|---|---|---|---|---|---|---|---|
| Plains | 12 | 10 | 8 | 10 | 5 (rare) | — | — | 4 | — |
| Sunflower Plains | 12 | 10 | 8 | 10 | 5 | — | — | 4 | — |
| Forest | 10 | 10 | 8 | 10 | — | 5 | 4 | 4 | — |
| Flower Forest | 10 | 10 | 8 | 10 | — | 5 | 4 | 4 | — |
| Birch Forest | 10 | 10 | 8 | 10 | — | — | — | 4 | — |
| Dark Forest | 10 | 10 | 8 | 10 | — | — | — | 4 | — |
| Swamp | 0 | 0 | 0 | 0 | — | — | — | 0 | — (slimes fill the spawn budget) |
| Jungle | 0 | 10 | 8 | 10 | — | — | — | — | Ocelot: 2, Parrot: 40 (rare) |
| Bamboo Jungle | 0 | 10 | 8 | 10 | — | — | — | — | Ocelot: 2, Panda: 1 (rare), Parrot: 40 |
| Sparse Jungle | 10 | 10 | 8 | 10 | — | — | — | — | Parrot: 40 |
| Savanna | 12 | 10 | 8 | 10 | 5 | — | — | 4 | Donkey: 1 (rare), Llama: 0 |
| Windswept Savanna | 12 | 10 | 8 | 10 | — | — | — | 4 | Llama: 5 |
| Taiga | 12 | 10 | 8 | 10 | — | 8 | 8 | 4 | — |
| Snowy Taiga | 12 | 10 | 8 | 10 | — | 8 | 8 | 4 (white) | — |
| Old Growth Pine/Spruce Taiga | 12 | 10 | 8 | 10 | — | 8 | 8 | 4 | Fox: more common |
| Snowy Plains | 0 | 0 | 0 | 0 | — | — | — | 10 (white) | Polar Bear: 1 |
| Ice Spikes | 0 | 0 | 0 | 0 | — | — | — | 10 (white) | — |
| Mountains (Grove, etc.) | 0 | 0 | 0 | 0 | — | 8 (Grove) | 8 (Grove) | 4 (white) | Goat: 5 (Snowy Slopes, Jagged, Frozen Peaks) |
| Beach | 0 | 0 | 0 | 0 | — | — | — | 0 | Turtle: 8 (lays eggs) |
| Mushroom Fields | 0 | 0 | 0 | 0 | — | — | — | 0 | **Mooshroom: 8** (only here) |
| Mangrove Swamp | 0 | 0 | 0 | 0 | — | — | — | 0 | Frog: 10, Tropical Fish, Cod, Salmon, Squid |
| River | 0 | 0 | 0 | 0 | — | — | — | 0 | Squid: 4, Cod: 5, Salmon: 5 |
| Frozen River | 0 | 0 | 0 | 0 | — | — | — | 0 | Squid: 4, Salmon: 5 |

### 9.3 Nether Mob Spawns

| Biome | Zombified Piglin | Piglin | Hoglin | Ghast | Magma Cube | Skeleton | Enderman | Strider | Wither Skeleton | Warden |
|---|---|---|---|---|---|---|---|---|---|---|
| Nether Wastes | 100 | 5 | — | 50 | 2 | — | — | 60 | — | — |
| Soul Sand Valley | — | — | — | 100 | — | 100 | 5 | 60 | — | — |
| Crimson Forest | 100 | 5 | 30 | — | — | — | — | 60 | — | — |
| Warped Forest | 5 | — | — | — | — | — | 100 | 60 | — | — |
| Basalt Deltas | 50 | — | — | 20 | 100 | — | — | 60 | — | — |
| Nether Fortress | 30 | 5 | — | — | 10 | 30 | — | — | 30 | — |
| Bastion Remnant | 30 | 5 | 30 | — | — | — | — | — | — | — |
| Overworld (Deep Dark) | — | — | — | — | — | — | — | — | — | Warden (summoned, not spawned) |

### 9.4 End Mob Spawns

| Biome | Enderman | Shulker | Other |
|---|---|---|---|
| The End (center) | 10 | — | Ender Dragon (single, boss) |
| End Highlands | 10 | — | (Shulkers only inside End Cities) |
| End Midlands | 10 | — | — |
| End Barrens | 10 | — | — |
| Small End Islands | 10 | — | — |

### 9.5 Spawn Rules Summary

1. **Monster category** spawns at light level ≤ 7 (sky or block), at Y < 64 (overworld) OR any Y (caves, nether, end).
2. **Creature category** spawns at light level ≥ 9, on natural surface blocks, with sky access. Each chunk has a creature cap (~10 for overworld).
3. **Slime chunks**: 10% of chunks (picked by `((x*x) * 0x2C8F9 + (z*z) * 0x66D35 + (x*z) * 0x4C190 + world_seed) mod 10 == 0`) spawn slimes regardless of light level, below Y=40.
4. **Swamp slimes**: spawn at Y=50-70 in swamp biomes during full moon, regardless of slime chunk status. Phase: `moonPhase == 0` only.
5. **Deep Dark exception**: NO natural spawns. The Warden is summoned via Sculk Shrieker (4 activations within 30 seconds = warden spawns).
6. **Mushroom Fields exception**: NO hostile spawns. Safest biome.
7. **Bedrock ceiling/floor**: Mobs do not spawn on bedrock.

### 9.6 Light Levels Reference

| Light level (block) | Effect |
|---|---|
| 15 | Full bright (torch, lantern, glowstone) |
| 14 | Glow berries, sea pickle (1 stack), lit furnace |
| 12 | End rod, sea pickle (4 stack) |
| 9 | Creature spawning threshold (≥) |
| 7 | Monster spawning threshold (≤) |
| 4 | Bat spawning threshold (≤) |
| 0 | Full darkness (deep caves) |

---

## 10. Implementation Cheat Sheet

### 10.1 Minimum Viable Implementation

To get biome-aware generation working, the implementing AI needs:

1. **A seeded 2D Perlin/Simplex noise function** (Section 1.3)
2. **An octave-noise wrapper** (Section 1.4)
3. **Five noise fields** for the climate parameters (Section 1.2.2) — each at ~1/1024 block frequency
4. **A biome list** with parameter points (Section 2.0 master table)
5. **A `pick_nearest_biome` function** (Section 1.2.3)
6. **A surface rule per biome** (top block + filler + depth)
7. **A simple cave carver** (Section 6.1 — can be just `Perlin(x,y,z) > 0.7 → air`)
8. **A tree feature per forest biome** (place 1 tree per N grass blocks with probability P)
9. **A mob spawn list per biome** (Section 9)

### 10.2 Recommended Defaults

| Setting | Recommended value |
|---|---|
| World height | 384 blocks (Y=-64 to Y=320) |
| Sea level | Y=63 |
| Bedrock floor | Y=-64 |
| Biome sampling resolution | 4×4×4 cells (trilinear interpolation) |
| Biome blending kernel | 4-block radius |
| Noise function | Improved Perlin 2002 (Section 1.3.1) or Simplex |
| Climate noise frequency | 1/1024 for T,H,C,E; 1/512 for W |
| Terrain base frequency | 1/200 for shape, 1/50 for detail |
| World seed | 64-bit `long`, derived from user input or `time()` |
| Structure grid | 32 chunks separation, 8 chunk margin |

### 10.3 Common Pitfalls

| Pitfall | Fix |
|---|---|
| Biomes look like a checkerboard | Use blending (Section 1.5) — sample at 4×4 cells and trilinear-interpolate |
| Caves look "blocky" | Use 3D noise for caves, not 2D; add a smoothing pass |
| Same seed produces different worlds on different runs | Salt your sub-seeds with constants (Section 1.1.2) — don't re-derive from time |
| Trees don't appear | Trees run in the FEATURES stage (Section 1.7, step 7); check placement filters |
| Ores don't appear | Ores run as FEATURES too; check Y-range filters and density |
| Mushroom Fields appears in the middle of a continent | Mushroom Fields requires C < -1.0 (very deep ocean); check your continentalness band |
| Lush Caves never generate | Lush Caves require T > +0.7 AND H > +0.6 AND D < -0.3; all three must be met |
| Desert spawns rain | Weather uses legacy biome temperature (0.95+ for rain), NOT the multi-noise T |
| Snowy Plains spawns zombies instead of strays | Strays replace skeletons ONLY in biomes with the `snowy` flag in spawn list, not just by temperature |

### 10.4 Tuning Biomes

To make a biome rarer: widen its parameter ranges or narrow the rest. To make a biome spawn at higher Y: adjust the Depth parameter point (e.g., D=0.5 for sky biomes). To make a biome spawn underground: D=-0.7 (Deep Dark range).

To add a brand-new biome: append a new entry to the BIOME_LIST with unique parameter ranges. Make sure no existing biome has identical ranges or it will tie and lose to the older entry.

### 10.5 Recommended Tuning Order

1. Get base terrain height noise working (no biomes yet — just stone/air/water).
2. Add the temperature + humidity 2D noise and split into 4 climate bands (hot/temperate/cold/frozen × arid/neutral/wet).
3. Add continentalness → split into ocean/coast/land.
4. Add erosion → split land into plains/hills/mountains.
5. Add weirdness → split each biome into base/variant.
6. Add depth → enable cave biomes.
7. Add surface rules per biome.
8. Add features (trees, ores).
9. Add structures.
10. Add mob spawning.

### 10.6 Cross-References

- **Block IDs** referenced throughout this document (e.g., `minecraft:grass_block`, `minecraft:stone`) are defined in `01-research-blocks.md`.
- **Mob IDs** (e.g., `minecraft:zombie`, `minecraft:warden`) — see the entities research file.
- **Item IDs** (e.g., `minecraft:chorus_fruit`) — see the items research file.
- **Sound events** (e.g., `minecraft:ambient.cave`) — see the audio research file.

---

## Appendix A: Full Biome ID List (Java 1.21.4)

Sorted alphabetically. Total: 64 Overworld + 5 Nether + 5 End = 74 biomes (including the void).

### Overworld (63 + the_void)

```
minecraft:badlands
minecraft:bamboo_jungle
minecraft:beach
minecraft:birch_forest
minecraft:cherry_grove
minecraft:cold_ocean
minecraft:dark_forest
minecraft:deep_cold_ocean
minecraft:deep_dark
minecraft:deep_frozen_ocean
minecraft:deep_lukewarm_ocean
minecraft:deep_ocean
minecraft:desert
minecraft:dripstone_caves
minecraft:eroded_badlands
minecraft:flower_forest
minecraft:forest
minecraft:frozen_ocean
minecraft:frozen_peaks
minecraft:frozen_river
minecraft:grove
minecraft:ice_spikes
minecraft:jagged_peaks
minecraft:jungle
minecraft:lukewarm_ocean
minecraft:lush_caves
minecraft:mangrove_swamp
minecraft:meadow
minecraft:mushroom_fields
minecraft:ocean
minecraft:old_growth_birch_forest
minecraft:old_growth_pine_taiga
minecraft:old_growth_spruce_taiga
minecraft:plains
minecraft:river
minecraft:savanna
minecraft:savanna_plateau
minecraft:snowy_beach
minecraft:snowy_plains
minecraft:snowy_slopes
minecraft:snowy_taiga
minecraft:soul_sand_valley         # nether — listed here for ID completeness
minecraft:stony_peaks
minecraft:stony_shore
minecraft:sunflower_plains
minecraft:swamp
minecraft:taiga
minecraft:the_end                  # end — listed here for ID completeness
minecraft:the_void
minecraft:warm_ocean
minecraft:windswept_forest
minecraft:windswept_gravelly_hills
minecraft:windswept_hills
minecraft:windswept_savanna
minecraft:wooded_badlands
```

(Note: `minecraft:pale_garden` was added in 1.21.4 — a dark-forest-like Overworld biome with pale oak trees, creaking mob, and pale moss. Climate parameters similar to Dark Forest but with high weirdness.)

### Nether (5)

```
minecraft:basalt_deltas
minecraft:crimson_forest
minecraft:nether_wastes
minecraft:soul_sand_valley
minecraft:warped_forest
```

### End (5)

```
minecraft:end_barrens
minecraft:end_highlands
minecraft:end_midlands
minecraft:small_end_islands
minecraft:the_end
```

---

## Appendix B: Hex Color Reference

Sky and water color values are 24-bit RGB hex. Use them directly as fog/water tint colors in your renderer.

| Biome | Sky | Water | Fog | Foliage | Grass |
|---|---|---|---|---|---|
| Plains | 78A7FF | 3F76E4 | C0D8FF | 77AB2F | 91B59D |
| Forest | 79A7FF | 3F76E4 | C0D8FF | 59AE30 | 79C05A |
| Desert | E0D890 | 1F90F0 | E0D890 | AEAE42 | BFB755 |
| Savanna | E0D890 | 1F90F0 | E0D890 | AEAE42 | BFB755 |
| Badlands | E0D890 | 1F90F0 | E0D890 | 9E814D | 90814D |
| Swamp | 6BA941 | 4A6B8A | 6BA941 | 6A7039 | 6A7039 |
| Mangrove Swamp | 4E6B45 | 3A7A6D | 4E6B45 | 6A7039 | 6A7039 |
| Jungle | 78A7FF | 1F90F0 | C0D8FF | 59AE30 | 59C93C |
| Taiga | 84A5C8 | 245B78 | C0D8FF | 60A17B | 86B87F |
| Snowy Taiga | 84A5C8 | 245B78 | C0D8FF | 80A495 | 80A495 |
| Snowy Plains | 84A5C8 | 185390 | C0D8FF | 80A495 | 80A495 |
| Ice Spikes | 84A5C8 | 185390 | C0D8FF | 80A495 | 80A495 |
| Mountain (Grove) | 84A5C8 | 245B78 | C0D8FF | 60A17B | 80A495 |
| Frozen Peaks | 84A5C8 | 245B78 | C0D8FF | 80A495 | 80A495 |
| Beach | 78A7FF | 3F76E4 | C0D8FF | 77AB2F | 91B59D |
| Snowy Beach | 84A5C8 | 245B78 | C0D8FF | 80A495 | 80A495 |
| Ocean | 78A7FF | 3F76E4 | C0D8FF | 77AB2F | 91B59D |
| Lukewarm Ocean | 78A7FF | 0D96D8 | C0D8FF | 77AB2F | 91B59D |
| Warm Ocean | 78A7FF | 02B0D8 | C0D8FF | 77AB2F | 91B59D |
| Cold Ocean | 78A7FF | 205E83 | C0D8FF | 77AB2F | 91B59D |
| Frozen Ocean | 80A5C8 | 245B78 | C0D8FF | 80A495 | 80A495 |
| Mushroom Fields | 78A7FF | 3F76E4 | C0D8FF | 77AB2F | 55C93F |
| Nether Wastes | — | — | 330808 | 9B0526 | 9B0526 |
| Soul Sand Valley | — | — | 1B1818 | 715F58 | 715F58 |
| Crimson Forest | — | — | 4C031C | B50B50 | B50B50 |
| Warped Forest | — | — | 1A051A | 169C87 | 169C87 |
| Basalt Deltas | — | — | 1F1F23 | 4A4747 | 4A4747 |
| The End | — | — | 181018 | 80A17B | 80A17B |

> Foliage tint is multiplied with the texture's grayscale foliage tint mask. Grass tint is applied to the top face of grass blocks and to grass tufts. Use these to recolor plant textures per biome for visual authenticity.

---

## Appendix C: Sample Climate Parameter Points (1.21 Overworld)

A subset of Mojang's `MultiNoiseBiomeSource.ParameterPoint` list, formatted for direct translation into your biome list. Each row is `(T_min T_max, H_min H_max, C_min C_max, E_min E_max, W_min W_max, D_min D_max, offset)`.

```
# Biome                  T              H              C              E              W              D              offset
plains                  [0.0 1.0]     [-0.5 -0.3]    [-0.1 0.0]     [-0.5 0.0]     [-0.7 -0.05]   [-1.0 1.0]      0.0
sunflower_plains        [0.0 1.0]     [-0.5 -0.3]    [-0.1 0.0]     [-0.5 0.0]     [-0.05 0.7]    [-1.0 1.0]      0.0
forest                  [0.0 1.0]     [-0.3 0.0]     [-0.1 0.0]     [-0.5 0.0]     [-0.7 -0.05]   [-1.0 1.0]      0.0
flower_forest           [0.0 1.0]     [-0.3 0.0]     [-0.1 0.0]     [-0.5 0.0]     [-0.05 0.7]    [-1.0 1.0]      0.0
birch_forest            [0.0 1.0]     [-0.3 0.0]     [-0.1 0.0]     [-0.5 0.0]     [-0.7 -0.05]   [-1.0 1.0]      0.0
old_growth_birch_forest [0.0 1.0]     [-0.3 0.0]     [-0.1 0.0]     [-0.5 0.0]     [-0.05 0.7]    [-1.0 1.0]      0.0
dark_forest             [0.0 1.0]     [-0.3 0.0]     [-0.1 0.0]     [0.0 0.5]      [-0.7 -0.05]   [-1.0 1.0]      0.0
swamp                   [0.0 1.0]     [-0.5 0.0]     [-0.1 0.0]     [0.0 0.5]      [-0.7 -0.05]   [-1.0 1.0]      0.0
mangrove_swamp          [0.55 1.0]    [-0.5 0.0]     [-0.1 0.0]     [0.0 0.5]      [-0.7 -0.05]   [-1.0 1.0]      0.0
jungle                  [0.55 1.0]    [0.4 1.0]      [-0.1 0.0]     [-0.5 0.0]     [-0.7 -0.05]   [-1.0 1.0]      0.0
sparse_jungle           [0.55 1.0]    [0.4 1.0]      [-0.1 0.0]     [0.0 0.5]      [-0.7 -0.05]   [-1.0 1.0]      0.0
bamboo_jungle           [0.55 1.0]    [0.4 1.0]      [-0.1 0.0]     [-0.5 0.0]     [-0.05 0.7]    [-1.0 1.0]      0.0
desert                  [0.55 1.0]    [-1.0 -0.5]    [-0.1 0.0]     [-0.5 0.0]     [-0.7 -0.05]   [-1.0 1.0]      0.0
savanna                 [0.55 1.0]    [-0.5 -0.3]    [-0.1 0.0]     [-0.5 0.0]     [-0.7 -0.05]   [-1.0 1.0]      0.0
savanna_plateau         [0.55 1.0]    [-0.5 -0.3]    [-0.1 0.0]     [-0.95 -0.5]   [-0.7 -0.05]   [-1.0 1.0]      0.0
windswept_savanna       [0.55 1.0]    [-0.5 -0.3]    [-0.1 0.0]     [-0.95 -0.5]   [-0.05 0.7]    [-1.0 1.0]      0.0
badlands                [0.55 1.0]    [-1.0 -0.5]    [-0.1 0.0]     [-0.5 0.0]     [-0.7 -0.05]   [-1.0 1.0]      0.0
wooded_badlands         [0.55 1.0]    [-1.0 -0.5]    [-0.1 0.0]     [-0.95 -0.5]   [-0.7 -0.05]   [-1.0 1.0]      0.0
eroded_badlands         [0.55 1.0]    [-1.0 -0.5]    [-0.1 0.0]     [-0.5 0.0]     [-0.05 0.7]    [-1.0 1.0]      0.0
taiga                   [-0.5 -0.15]  [0.2 1.0]      [-0.1 0.0]     [-0.5 0.0]     [-0.7 -0.05]   [-1.0 1.0]      0.0
snowy_taiga             [-1.0 -0.45]  [0.2 1.0]      [-0.1 0.0]     [-0.5 0.0]     [-0.7 -0.05]   [-1.0 1.0]      0.0
old_growth_pine_taiga   [-0.5 -0.15]  [0.2 1.0]      [-0.1 0.0]     [-0.95 -0.5]   [-0.7 -0.05]   [-1.0 1.0]      0.0
old_growth_spruce_taiga [-0.5 -0.15]  [0.2 1.0]      [-0.1 0.0]     [-0.95 -0.5]   [-0.05 0.7]    [-1.0 1.0]      0.0
snowy_plains            [-1.0 -0.45]  [-0.5 0.0]     [-0.1 0.0]     [-0.5 0.0]     [-0.7 -0.05]   [-1.0 1.0]      0.0
ice_spikes              [-1.0 -0.45]  [-0.5 0.0]     [-0.1 0.0]     [-0.5 0.0]     [-0.05 0.7]    [-1.0 1.0]      0.0
windswept_hills         [-0.5 1.0]    [-0.5 0.0]     [-0.1 0.0]     [-0.95 -0.5]   [-0.7 -0.05]   [-1.0 1.0]      0.0
windswept_forest        [-0.5 1.0]    [-0.5 0.0]     [-0.1 0.0]     [-0.95 -0.5]   [-0.05 0.7]    [-1.0 1.0]      0.0
windswept_gravelly_hills[-0.5 1.0]    [-0.5 0.0]     [-0.1 0.0]     [-0.95 -0.5]   [-0.05 0.7]    [-1.0 1.0]      0.0
meadow                  [-0.5 0.0]    [-0.5 0.0]     [-0.1 0.0]     [-0.95 -0.5]   [-0.7 -0.05]   [-1.0 1.0]      0.0
grove                   [-1.0 -0.45]  [-0.5 0.0]     [-0.1 0.0]     [-0.95 -0.5]   [-0.7 -0.05]   [0.6 1.0]       0.0
snowy_slopes            [-1.0 -0.45]  [-0.5 0.0]     [-0.1 0.0]     [-0.95 -0.5]   [-0.7 -0.05]   [0.2 0.9]       0.0
jagged_peaks            [-1.0 -0.05]  [-0.5 0.0]     [-0.1 0.0]     [-0.95 -0.5]   [-0.7 -0.05]   [0.6 1.0]       0.0
frozen_peaks            [-1.0 -0.05]  [-0.5 0.0]     [-0.1 0.0]     [-0.95 -0.5]   [-0.05 0.7]    [0.6 1.0]       0.0
stony_peaks             [0.55 1.0]    [-0.5 0.0]     [-0.1 0.0]     [-0.95 -0.5]   [-0.7 -0.05]   [0.2 1.0]       0.0
cherry_grove            [-0.5 0.0]    [-0.5 0.0]     [-0.1 0.0]     [-0.95 -0.5]   [-0.05 0.7]    [-1.0 1.0]      0.0
mushroom_fields         [-1.0 1.0]    [-1.0 1.0]     [-1.1 -1.0]    [-1.0 1.0]     [-1.0 1.0]     [-1.0 1.0]      0.0
ocean                   [-0.5 0.0]    [-1.0 1.0]     [-0.7 -0.45]   [-1.0 1.0]     [-1.0 1.0]     [-1.0 0.55]     0.0
deep_ocean              [-0.5 0.0]    [-1.0 1.0]     [-1.0 -0.7]    [-1.0 1.0]     [-1.0 1.0]     [-1.0 0.55]     0.0
lukewarm_ocean          [-0.15 0.2]   [-1.0 1.0]     [-0.7 -0.45]   [-1.0 1.0]     [-1.0 1.0]     [-1.0 0.55]     0.0
deep_lukewarm_ocean     [-0.15 0.2]   [-1.0 1.0]     [-1.0 -0.7]    [-1.0 1.0]     [-1.0 1.0]     [-1.0 0.55]     0.0
warm_ocean              [0.55 1.0]    [-1.0 1.0]     [-0.7 -0.45]   [-1.0 1.0]     [-1.0 1.0]     [-1.0 0.55]     0.0
cold_ocean              [-0.45 -0.15] [-1.0 1.0]     [-0.7 -0.45]   [-1.0 1.0]     [-1.0 1.0]     [-1.0 0.55]     0.0
deep_cold_ocean         [-0.45 -0.15] [-1.0 1.0]     [-1.0 -0.7]    [-1.0 1.0]     [-1.0 1.0]     [-1.0 0.55]     0.0
frozen_ocean            [-1.0 -0.45]  [-1.0 1.0]     [-0.7 -0.45]   [-1.0 1.0]     [-1.0 1.0]     [-1.0 0.55]     0.0
deep_frozen_ocean       [-1.0 -0.45]  [-1.0 1.0]     [-1.0 -0.7]    [-1.0 1.0]     [-1.0 1.0]     [-1.0 0.55]     0.0
river                   [-0.5 0.0]    [-1.0 1.0]     [-0.1 0.0]     [-1.0 1.0]     [-1.0 1.0]     [-1.0 0.0]      0.0
frozen_river            [-1.0 -0.45]  [-1.0 1.0]     [-0.1 0.0]     [-1.0 1.0]     [-1.0 1.0]     [-1.0 0.0]      0.0
beach                   [-0.5 0.0]    [-1.0 1.0]     [-0.15 -0.1]   [-1.0 1.0]     [-1.0 1.0]     [-1.0 1.0]      0.0
snowy_beach             [-1.0 -0.45]  [-1.0 1.0]     [-0.15 -0.1]   [-1.0 1.0]     [-1.0 1.0]     [-1.0 1.0]      0.0
stony_shore             [-0.3 0.0]    [-1.0 1.0]     [-0.15 -0.1]   [-1.0 1.0]     [-1.0 1.0]     [-1.0 1.0]      0.0
lush_caves              [0.7 1.0]     [0.6 1.0]      [-1.0 1.0]     [-1.0 1.0]     [-1.0 1.0]     [-1.0 -0.4]     0.0
dripstone_caves         [-0.8 -0.2]   [-1.0 0.2]     [-1.0 1.0]     [-1.0 1.0]     [-1.0 1.0]     [-1.0 -0.2]     0.0
deep_dark               [-1.0 1.0]    [-1.0 1.0]     [-1.0 1.0]     [-1.0 1.0]     [-1.0 1.0]     [-1.0 -0.85]    0.0
```

> These ranges are **approximate**, reverse-engineered from Mojang's source. The exact values in vanilla are slightly more constrained (with overlap rules), but these are a faithful starting point. Tweak the bounds to taste.

---

## Appendix D: Glossary

| Term | Definition |
|---|---|
| Biome | A region with consistent surface rules, vegetation, structures, mob spawns, and climate parameters |
| Climate | The 6-parameter vector `(T, H, C, E, W, D)` at a given position |
| Continentalness | Climate axis indicating ocean-vs-land. Negative = ocean; positive = inland. |
| Density function | A noise-derived function used by 1.18+ to decide stone vs air vs fluid per block |
| Depth | Climate axis indicating vertical position relative to surface. Enables 3D biomes. |
| Erosion | Climate axis indicating flat-vs-rugged. Low = mountains; high = plains. |
| Feature | Small-scale procedural element (tree, ore vein, flower patch, lava lake) |
| FBM | Fractal Brownian Motion — sum of octaves of Perlin noise |
| Humidity | Climate axis indicating dry-vs-wet |
| Multi-noise | The 6-dimensional climate sampler introduced in 1.18 |
| Noise | Smooth pseudo-random function (Perlin/Simplex) |
| Octave | One layer of FBM at a specific frequency and amplitude |
| Parameter point | The 6 ranges + offset defining a biome's climate slot |
| PRNG | Pseudo-random number generator — deterministic from a seed |
| Salt | A constant mixed with the world seed to derive per-subsystem sub-seeds |
| Seed | 64-bit integer fully determining a world's generation |
| Simplex | Ken Perlin's 2001 noise variant using simplicial grids |
| Sub-seed | A seed derived from the world seed for a specific subsystem (biomes, ores, structures, etc.) |
| Temperature | Climate axis indicating hot-vs-cold |
| Voronoi | A partition of space by nearest-center. Minecraft uses a smoothed (blended) Voronoi for biome cells. |
| Weirdness | Climate axis indicating "special variant" (sunflower plains, ice spikes, etc.) |

---

## Appendix E: External References (for implementing AI)

When porting this, the following resources are canonical:

- **Minecraft Wiki — Biome** — full list of biomes with parameter tables
- **Minecraft Wiki — World generation** — overview of the 1.18 pipeline
- **McEnv/Mojang mappings** — decompiled Java source of `MultiNoiseBiomeSource`, `NoiseRouter`, `PerlinNoise`, `OctavePerlinNoiseSampler`
- **Cubic Chunks mod source** — reference for cubic-chunk architecture (if attempting)
- **FastNoise2** — open-source noise library with Perlin/Simplex/Cellular noise (good starting point)
- **OpenSimplex2** — patent-free Simplex alternative

The implementing AI should not need to consult any external resources — this document is self-contained. The above is listed only for cross-verification.

---

**End of 04-research-biomes.md**

Total document length: ~26 pages of dense reference. Use alongside `01-research-blocks.md` (blocks) and the items/entities/sound research files (when produced) for full implementation coverage.
