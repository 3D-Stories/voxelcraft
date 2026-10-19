# 12. Vercel Deployment Guide

> Step-by-step guide to deploy VoxelCraft (the Minecraft clone) on Vercel as a static site. The implementing AI should follow this exactly and include these files in the project.

## 1. Why Vercel Static Hosting

- **No backend needed**: 100% client-side (Three.js + vanilla JS). All saves go to IndexedDB.
- **Free tier**: generous free plan (100GB bandwidth, unlimited static requests).
- **Global CDN**: edge-cached worldwide for fast first paint.
- **HTTPS automatic**: free SSL/TLS certificate.
- **Git-based**: deploy on every push to main branch.
- **Custom domains**: easy to attach.

## 2. Project Configuration Files

### 2.1 `package.json`

```json
{
  "name": "voxelcraft",
  "version": "1.0.0",
  "description": "A vanilla-faithful Minecraft clone for the web, built with Three.js",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "generate-textures": "node scripts/generate-textures.js"
  },
  "dependencies": {
    "three": "^0.160.0",
    "simplex-noise": "^4.0.1",
    "idb": "^8.0.0",
    "pako": "^2.1.0"
  },
  "devDependencies": {
    "vite": "^5.0.10",
    "canvas": "^2.11.2"
  },
  "engines": {
    "node": ">=18"
  }
}
```

### 2.2 `vite.config.js`

```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  // Use relative paths so the build works on any subpath (Vercel root or custom domain)
  base: './',
  
  build: {
    // Modern browsers only (Chrome 110+, Firefox 110+, Safari 16+)
    target: 'es2022',
    
    // Output directory (Vercel reads from here)
    outDir: 'dist',
    
    // Inline small assets (<4KB) as data URLs (reduces HTTP requests)
    assetsInlineLimit: 4096,
    
    // Enable sourcemaps for debugging (Vercel ignores them in production)
    sourcemap: false,
    
    // Manual chunks: split Three.js into its own chunk for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three'],
          'noise': ['simplex-noise'],
          'db': ['idb'],
          'compression': ['pako'],
        },
      },
    },
    
    // Chunk size warning threshold (1MB — we'll have larger chunks due to textures)
    chunkSizeWarningLimit: 1500,
  },
  
  // Dev server config
  server: {
    port: 3000,
    open: true,
    // WebGL needs these headers (Cross-Origin-Embedder-Policy)
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  
  // Dependency optimization (pre-bundle for faster dev)
  optimizeDeps: {
    include: ['three', 'simplex-noise', 'idb', 'pako'],
    exclude: ['canvas'],  // Node-only, used in texture generation script
  },
  
  // Define global constants
  define: {
    __VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
});
```

### 2.3 `vercel.json`

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "version": 2,
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" },
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/(.*\\.(?:png|jpg|jpeg|webp|gif|svg|ico|woff|woff2|ttf|eot|ogg|mp3|wav))",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ],
  
  "rewrites": [
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ],
  
  "cleanUrls": true,
  "trailingSlash": false
}
```

### 2.4 `index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <meta name="description" content="VoxelCraft - A browser-based voxel sandbox game" />
  <meta name="theme-color" content="#000000" />
  <title>VoxelCraft</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin />
  <style>
    /* Initial loading screen (before JS loads) */
    html, body {
      margin: 0; padding: 0;
      width: 100%; height: 100%;
      overflow: hidden;
      background: #000;
      color: #fff;
      font-family: 'Courier New', monospace;
    }
    #loading {
      position: fixed; inset: 0;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 16px;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    }
    #loading h1 {
      font-size: 48px;
      letter-spacing: 4px;
      margin: 0;
      text-shadow: 0 4px 8px rgba(0,0,0,0.5);
    }
    #loading .progress-bar {
      width: 320px; height: 8px;
      background: rgba(255,255,255,0.1);
      border-radius: 4px;
      overflow: hidden;
    }
    #loading .progress-bar-fill {
      width: 0%; height: 100%;
      background: #4CAF50;
      transition: width 0.3s ease;
    }
    #loading .status {
      font-size: 14px;
      color: #aaa;
    }
    #loading .error {
      color: #f44336;
      display: none;
    }
  </style>
</head>
<body>
  <div id="loading">
    <h1>VOXELCRAFT</h1>
    <div class="progress-bar"><div class="progress-bar-fill" id="progress-fill"></div></div>
    <div class="status" id="loading-status">Loading engine…</div>
    <div class="error" id="loading-error"></div>
  </div>
  <div id="app" style="display:none; width:100%; height:100%;"></div>
  
  <script type="module" src="/src/main.js"></script>
  <noscript>
    <div style="position:fixed; inset:0; background:#000; color:#fff; display:flex; align-items:center; justify-content:center; font-family:sans-serif;">
      VoxelCraft requires JavaScript to run. Please enable JavaScript in your browser.
    </div>
  </noscript>
</body>
</html>
```

### 2.5 `.gitignore`

```
# Dependencies
node_modules/
.pnpm-store/

# Build output
dist/
build/

# Editor
.vscode/
.idea/
*.swp
*.swo
.DS_Store

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Env
.env
.env.local
.env.*.local

# Vercel
.vercel

# Generated textures (if regenerated each build)
# public/assets/textures/blocks/*.png  # uncomment if you want to git-ignore generated assets
```

### 2.6 `favicon.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">
  <!-- Grass block icon (pixelated) -->
  <rect width="16" height="16" fill="#8B6240"/>
  <rect y="0" width="16" height="4" fill="#7FB238"/>
  <rect y="3" width="16" height="1" fill="#5B8A2A"/>
  <rect x="0" y="4" width="2" height="2" fill="#6E5431"/>
  <rect x="3" y="5" width="2" height="2" fill="#A88454"/>
  <rect x="6" y="6" width="2" height="2" fill="#6E5431"/>
  <rect x="9" y="5" width="2" height="2" fill="#A88454"/>
  <rect x="12" y="6" width="2" height="2" fill="#6E5431"/>
  <rect x="14" y="4" width="2" height="2" fill="#A88454"/>
</svg>
```

## 3. Build & Deploy Steps

### 3.1 Local Development

The AI agent runs these locally during development:

```bash
# 1. Clone the repo it just created via GitHub MCP
git clone https://github.com/<user>/voxelcraft.git
cd voxelcraft

# 2. Install dependencies
npm install

# 3. Generate procedural textures (if not committed to repo)
npm run generate-textures

# 4. Run dev server (Vite, with HMR)
npm run dev
# Open http://localhost:3000

# 5. Build for production (verify before pushing)
npm run build

# 6. Preview production build locally
npm run preview
# Open http://localhost:4173
```

### 3.2 Deploy via Vercel MCP (PRIMARY METHOD — DO NOT USE CLI OR DASHBOARD)

The AI agent has **direct Vercel MCP access**. The user should never need to touch the Vercel CLI or the Vercel dashboard. The AI performs all deploy operations via MCP tools.

**One-time setup (done by AI on first session):**

1. **Link GitHub repo to Vercel** via the Vercel MCP `create_project` tool (or equivalent):
   - `name`: `voxelcraft`
   - `link`: `github:<user>/voxelcraft`
   - `framework`: `vite`
   - `buildCommand`: `npm run build`
   - `outputDirectory`: `dist`
   - `installCommand`: `npm install`
   - `rootDirectory`: `./`
   This sets up auto-deploy on every push to `main`.

2. **Verify the link** by reading the project status via MCP. The first deploy will trigger automatically once the first code is pushed to `main`.

**Per-feature deploy flow (done by AI for every commit):**

1. Commit + push to `main` (per the §0.5.3 loop in `00-master-prompt.md`).
2. Vercel auto-deploys a **production** build (push to `main` = production by default).
3. Read deploy status + build logs via Vercel MCP `get_deployment` / `get_deployment_logs`.
4. If build fails → read logs → fix code → push again. Do NOT paste errors back to the user.
5. If build succeeds → share the production URL with the user.

**Preview deploys (for testing before promoting to prod):**

For riskier features, the AI can push to a `preview` branch instead of `main`:
1. `git checkout -b preview/<feature-name>`
2. Commit + push to the preview branch.
3. Vercel auto-creates a preview deployment at `https://voxelcraft-git-preview-<feature>-<user>.vercel.app`.
4. Share the preview URL with the user for testing.
5. After user approval, merge to `main`: `git checkout main && git merge preview/<feature-name> && git push origin main`.
6. Vercel auto-deploys the merged code to production.

**Promote a specific deployment to production (rollback scenario):**

If a production push broke something and you need to roll back to a previous deployment:
1. List deployments via Vercel MCP `list_deployments`.
2. Find the last known-good deployment URL.
3. Promote it via Vercel MCP `promote_deployment` with the deployment ID/URL.
4. Confirm the production URL now serves the previous version.

### 3.3 Custom Domain (via Vercel MCP)

If the user provides a custom domain (e.g., `voxelcraft.example.com`):

1. The AI adds the domain via Vercel MCP `add_domain` tool: `projectId=<voxelcraft-project-id>`, `domain=voxelcraft.example.com`.
2. Vercel returns the DNS records to add (an `A` record pointing to `76.76.21.21` or a `CNAME` pointing to `cname.vercel-dns.com`).
3. The AI tells the user: "Please add these DNS records at your domain registrar: <records>. I'll wait."
4. After the user confirms DNS is added, the AI verifies domain status via MCP `get_domain`.
5. Wait 5-30 min for DNS propagation. The AI can poll via MCP.
6. HTTPS is provisioned automatically by Vercel. The AI confirms via MCP.

The AI should NOT ask the user to navigate the Vercel dashboard — the dashboard should never need to be opened.

### 3.4 Vercel CLI / Dashboard (DO NOT USE)

The Vercel CLI (`npm install -g vercel` + `vercel login` + `vercel --prod`) and the Vercel web dashboard (https://vercel.com/dashboard) are **explicitly off-limits** for this project. All operations go through the Vercel MCP. If the AI cannot perform an operation via MCP, it should ask the user to grant additional MCP permissions — not fall back to the CLI.

## 4. Environment Variables

VoxelCraft is fully client-side and needs **no environment variables** by default.

Optional (for future multiplayer support):
- `VITE_SERVER_URL`: WebSocket URL for multiplayer server (not used in single-player MVP).

**Add via Vercel MCP** (NOT via the dashboard):
1. AI calls Vercel MCP `set_env_var` with `projectId`, `key=VITE_SERVER_URL`, `value=<url>`, `target=production`.
2. Vercel redeploys automatically with the new env var.
3. Reference in code as `import.meta.env.VITE_SERVER_URL`.

For local dev, the AI creates a `.env.local` file (gitignored) with the same key.

## 5. Performance Optimization for Vercel

### 5.1 Asset Caching
Vercel automatically caches static assets at the edge. The `vercel.json` headers above set:
- `Cache-Control: max-age=31536000, immutable` for hashed assets (in `/_assets/`).
- Same for media files (PNG, OGG, etc.).

### 5.2 Compression
Vercel auto-compresses with Brotli/Gzip. No action needed.

### 5.3 Bundle Size Analysis
Run `npm run build` then check `dist/` size:
- Target: <2MB gzipped total.
- If too large, audit with `npx vite-bundle-visualizer`.

### 5.4 Image Optimization
Textures are 16×16 PNGs — already tiny (~1KB each). Total texture atlas: ~300KB. No optimization needed.

For larger images (skybox, etc.), use WebP format.

### 5.5 Code Splitting
Vite auto-splits code by dynamic imports. The `manualChunks` config splits vendor libraries. The implementing AI can lazy-load:
- End dimension assets (only loaded when entering End).
- Nether assets (only loaded when entering Nether).
- Music tracks (loaded on first play).

Example:
```javascript
// Lazy-load the End dimension
const EndModule = await import('./worldgen/EndGenerator.js');
```

## 6. Browser Compatibility

### 6.1 Required APIs
- WebGL2 (95%+ browser support as of 2024).
- Web Workers (98%+).
- IndexedDB 3.0 (98%+).
- Web Audio API (98%+).
- Pointer Lock API (95%+).
- requestAnimationFrame (100%).

### 6.2 Fallbacks
- **Safari 15**: no OffscreenCanvas → main-thread meshing (slower).
- **Old mobile browsers**: WebGL2 may not be supported → show "unsupported browser" message.

### 6.3 Detection Code

```javascript
function checkBrowserSupport() {
  const errors = [];
  
  // WebGL2
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2');
  if (!gl) errors.push('WebGL2 is not supported. Please use a modern browser.');
  
  // IndexedDB
  if (!window.indexedDB) errors.push('IndexedDB is not supported. World saves will not work.');
  
  // Web Audio
  if (!window.AudioContext && !window.webkitAudioContext) {
    errors.push('Web Audio API is not supported. Sound will not play.');
  }
  
  // Pointer Lock
  if (!('pointerLockElement' in document)) {
    errors.push('Pointer Lock API is not supported. Mouse look will not work properly.');
  }
  
  // Web Workers
  if (typeof Worker === 'undefined') {
    errors.push('Web Workers are not supported. Game will be very slow.');
  }
  
  return errors;
}
```

## 7. Monitoring & Analytics (Optional)

### 7.1 Vercel Analytics
- Built-in Web Analytics (free, privacy-friendly).
- **Enable via Vercel MCP** `enable_analytics` (do NOT use the dashboard).
- Tracks: page views, unique visitors, top pages, referrers, countries, devices, browsers.

### 7.2 Speed Insights
- Real-user monitoring (RUM) for Core Web Vitals.
- **Enable via Vercel MCP** `enable_speed_insights`.
- Tracks: LCP, FID, CLS, TTFB.

The AI can read analytics data via MCP `get_analytics` / `get_speed_insights` and report back to the user (e.g., "Average LCP is 1.8s, below the 2.5s target.").

### 7.3 Error Tracking (Optional)
For production error tracking, integrate Sentry:
```bash
npm install @sentry/browser
```

```javascript
// src/main.js (top of file)
import * as Sentry from '@sentry/browser';

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: 'YOUR_SENTRY_DSN',
    tracesSampleRate: 0.1,
  });
}
```

## 8. CI/CD Pipeline

### 8.1 GitHub Actions (Optional — Vercel handles deploys automatically)

Vercel auto-deploys on every push to `main` (production) and every push to a feature branch (preview). No CI/CD setup is strictly required.

If you want to run lint/tests BEFORE the Vercel deploy kicks in, add a GitHub Action:

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      # - run: npm test  # if you have tests
```

The AI creates this file in the first commit (along with `.gitignore`, `LICENSE`, `README.md`) so CI runs from day one. The AI can check CI status via the GitHub MCP `get_commit_status` or `get_check_runs` tools, and should not push to `main` if CI is red.

## 9. Common Vercel Issues & Fixes

### 9.1 "Blank white screen" after deploy
**Cause**: `base` config wrong, or routes not rewriting to `index.html`.
**Fix**: Ensure `vite.config.js` has `base: './'` and `vercel.json` has the `rewrites` rule.

### 9.2 "404 on /assets/..." errors
**Cause**: Vite output not in `dist/`, or Vercel `outputDirectory` wrong.
**Fix**: Verify `outputDirectory: "dist"` in `vercel.json` and `outDir: 'dist'` in `vite.config.js`.

### 9.3 WebGL context lost on mobile
**Cause**: Mobile browsers aggressively reclaim GPU memory.
**Fix**: Listen for `webglcontextlost` event, pause game, attempt recovery on `webglcontextrestored`.

### 9.4 IndexedDB quota exceeded
**Cause**: Browser storage limit (typically 1-2GB or 10% of free disk).
**Fix**: Show warning when nearing limit; offer "delete old worlds" UI. Each chunk is ~100KB, so a world with 1000 modified chunks = 100MB.

### 9.5 Cross-Origin Isolation errors
**Cause**: Some advanced features (SharedArrayBuffer, OffscreenCanvas with workers) require COOP/COEP headers.
**Fix**: Set headers in `vercel.json` (already done in our config above).

### 9.6 Slow first paint (>3 sec)
**Cause**: Bundle too large, textures too big.
**Fix**:
- Check `npm run build` output size.
- Use code splitting for End/Nether assets.
- Compress textures to WebP.
- Enable Vercel's Edge Caching.

## 10. Local Build Verification Checklist

Before deploying, verify:

- [ ] `npm run build` completes without errors.
- [ ] `dist/` folder is created with `index.html`, `assets/`, and `assets/textures/`.
- [ ] `npm run preview` works locally (open `http://localhost:4173`).
- [ ] Game loads, can create world, can break/place blocks, can save/quit.
- [ ] No console errors in browser DevTools.
- [ ] Lighthouse audit: Performance > 80, Best Practices = 100.
- [ ] Total `dist/` size < 5MB (or < 2MB gzipped).

## 11. Vercel Project Settings (Configured via MCP, NOT Dashboard)

The AI sets these via Vercel MCP when creating the project (or updates them via MCP `update_project` if needed):

| Setting | Value |
|---|---|
| Framework Preset | Vite |
| Root Directory | `./` (default) |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |
| Development Command | `npm run dev` |
| Node.js Version | 20.x |
| Region | Auto (or pick nearest to your users) |
| Speed Insights | Enabled (via MCP) |
| Web Analytics | Enabled (via MCP) |

**The user should never need to open the Vercel dashboard.** All settings are configured programmatically by the AI via MCP. If a setting cannot be changed via MCP, the AI documents it and asks the user for permission to make a one-time dashboard visit (this should be rare).

## 12. Custom `404.html`

If user navigates to a route that doesn't exist (rare for SPA), Vercel shows default 404. To customize:

```html
<!-- public/404.html -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VoxelCraft - Page Not Found</title>
  <style>
    body { margin: 0; background: #1a1a2e; color: #fff; font-family: monospace; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .container { text-align: center; }
    h1 { font-size: 72px; margin: 0; color: #4CAF50; }
    p { font-size: 18px; }
    a { color: #4CAF50; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <h1>404</h1>
    <p>This chunk hasn't generated yet.</p>
    <p><a href="/">Return to spawn</a></p>
  </div>
</body>
</html>
```

## 13. README.md Template

```markdown
# VoxelCraft

A browser-based voxel sandbox game inspired by Minecraft, built with Three.js and deployed on Vercel.

## Play

Visit: https://your-project-name.vercel.app

## Features

- Three dimensions: Overworld, Nether, End
- 60+ mobs with full AI
- 800+ blocks, 1500+ items
- Redstone, enchanting, brewing, crafting
- Creative and Survival modes
- All 5 difficulty levels
- First-person and third-person cameras
- Procedural world generation with seeds
- Save/load worlds to browser storage
- Configurable options menu

## Run Locally

\`\`\`bash
npm install
npm run dev
# Open http://localhost:3000
\`\`\`

## Build

\`\`\`bash
npm run build
npm run preview
\`\`\`

## Deploy

This project is set up for automatic deployment via Vercel MCP:

1. The GitHub repo is linked to a Vercel project.
2. Every push to `main` auto-deploys to production at `https://voxelcraft.vercel.app`.
3. Every push to a `preview/*` branch creates a preview deployment.
4. Roll back by promoting a previous deployment via Vercel MCP.

Manual CLI / dashboard steps are NOT required.

## Tech Stack

- Three.js (rendering)
- Vite (bundler)
- Vanilla JS (no framework)
- IndexedDB (saves)
- Web Audio API (sound)
- GitHub (source control)
- Vercel (hosting, via MCP)

## Browser Support

Chrome 110+, Firefox 110+, Safari 16+, Edge 110+.

## License

MIT (code). Textures and sounds are procedurally generated or CC0/CC-BY.
```

## 14. Final Pre-Push Checklist (AI Self-Check Before Each Push)

Before the AI pushes to GitHub (which triggers a Vercel auto-deploy):

- [ ] All files committed to git.
- [ ] `npm run build` succeeds locally with 0 errors.
- [ ] `npm run preview` works locally — game is playable for 60+ seconds without crashes.
- [ ] `vercel.json` is in project root.
- [ ] `vite.config.js` has `base: './'`.
- [ ] `index.html` has loading screen.
- [ ] `public/assets/textures/` exists with at least basic block textures.
- [ ] `public/assets/sounds/` exists with at least click/dig sounds.
- [ ] No console errors in browser DevTools during smoke test.
- [ ] README.md exists with run instructions.
- [ ] `.gitignore` excludes `node_modules/` and `dist/`.
- [ ] Commit message follows conventional-commits format (`feat:`/`fix:`/`chore:`/`docs:`).
- [ ] If on a feature branch: PR will be auto-created; if on `main`: production will auto-deploy.

If any of these fail, the AI fixes the issue and re-checks before pushing. The user should never see a broken production deploy.

## 15. Post-Deploy Verification (AI Self-Check After Each Push)

After Vercel finishes the auto-deploy (AI reads deploy status via MCP):

- [ ] Read deploy logs via `get_deployment_logs` — confirm "Build Complete" with no errors.
- [ ] Visit the Vercel URL programmatically (headless fetch) — confirm HTML returns 200.
- [ ] Smoke-test in a headless browser if possible (Puppeteer/Playwright via MCP):
  - [ ] Loading screen shows progress.
  - [ ] Main menu appears within 5 sec.
  - [ ] Create a world — world generates within 10 sec.
  - [ ] Walk, break/place a block, switch camera modes.
  - [ ] Open options menu — settings can be changed.
  - [ ] No console errors during the smoke test.
- [ ] Report the deploy URL + smoke-test results to the user.
- [ ] If smoke test fails: roll back via `promote_deployment` to the previous known-good deployment, then debug.

The user does NOT need to manually verify each deploy — the AI does it on their behalf and only reports issues that require user input.

## 16. Free Tier (Hobby Plan) Constraints & Scaling

**The user is on the Vercel Hobby (free) plan.** All deployment guidance in this file must work within these limits. The AI agent must NOT attempt to enable Pro-only features or assume paid capabilities.

### 16.1 What's Available on Hobby (Free)

| Feature | Hobby limit | Affects us? |
|---|---|---|
| Bandwidth | 100 GB/month | Yes — ~33,000 visitors/month at 3MB load |
| Build minutes | 6,000 min/month | Yes — ~30-60 sec per build = 6,000-12,000 builds/month |
| Concurrent builds | 1 (others queued) | Yes — fast iteration may queue |
| Deployments per project | Unlimited | No issue |
| Preview deployments | Unlimited | No issue |
| Production deployments | Unlimited | No issue |
| Web Analytics | Free, included | Yes — use it |
| Speed Insights | Free, included | Yes — use it |
| Edge Network | Global CDN, included | Yes — fast worldwide |
| Automatic HTTPS | Included | Yes |
| Custom domains | 1 per project on production | Yes — `voxelcraft.example.com` works |
| Environment variables | Unlimited | Yes (we don't need any for MVP) |
| Serverless function invocations | 100,000/month | N/A — we're 100% static |
| Static asset storage | Unlimited | Yes |
| Image Optimization | 1,000 images/month | N/A — textures are tiny PNGs, no optimization needed |
| Team members | 1 (solo) | N/A — single-dev project |

### 16.2 What's NOT Available on Hobby (Pro-only features we must NOT use)

| Pro-only feature | Why we skip it | Workaround |
|---|---|---|
| Password-protected preview deploys | Not needed | Previews are public — that's fine for a personal project |
| Custom domains on preview deploys | Not needed | Previews use auto-generated URLs like `voxelcraft-git-feat-x-<user>.vercel.app` |
| Team SSO / SAML | N/A | Single-dev project |
| DDoS mitigation boost | Rarely needed | Vercel's baseline protection is sufficient |
| Higher concurrent builds (2-12) | Slower iteration | Queue — be patient, or batch commits |
| Commercial usage rights | **IMPORTANT** — see §16.4 below | Don't monetize |
| Advanced Image Optimization | N/A | We don't optimize images |
| Edge Config | Not needed | N/A |
| Vercel KV / Postgres (free trial then paid) | Not needed | Use IndexedDB client-side |

### 16.3 Build Queue Behavior on Hobby

With only 1 concurrent build, the AI should:

1. **Avoid pushing 2 commits in rapid succession** — the second will queue behind the first, wasting build minutes. If the AI needs to fix something quickly, batch the changes into a single commit.
2. **Wait for builds to finish before pushing again** — poll `get_deployment` status via MCP before pushing the next commit. ~30-60 sec typical build time.
3. **Don't delete+redeploy unnecessarily** — each deploy costs build minutes. Be intentional.
4. **Use preview branches for risky work** — push to `preview/<feature>` first; this still uses the same single build slot, but doesn't disturb production.

### 16.4 Non-Commercial Use Restriction (IMPORTANT)

The Vercel Hobby plan is **for non-commercial, personal projects only**. This means:

- ✅ **OK**: Personal portfolio, free open-source project, hobby game, learning project, sharing with friends.
- ❌ **NOT OK**: Putting ads on the site, charging for access, selling in-game items, sponsorships, affiliate links, using it as a demo for paid consulting.

If the user ever wants to monetize VoxelCraft (ads, Patreon, paid features, etc.), they MUST upgrade to Vercel Pro ($20/month) first. The AI should:
- Not add advertising code without confirming the user has upgraded.
- Not add analytics that sell user data (Google AdSense, etc.).
- Not add payment integrations (Stripe, PayPal) without flagging the upgrade requirement.

For now, the project is assumed to be a personal/hobby Minecraft clone — Hobby plan is fine.

### 16.5 Bandwidth Budget

100GB/month on Hobby. At ~3MB initial page load + ~500KB lazy-loaded sounds = ~3.5MB per first-time visitor.

| Daily visitors | Monthly bandwidth | Within free tier? |
|---|---|---|
| 100 | ~10 GB | ✅ Plenty of headroom |
| 500 | ~52 GB | ✅ Within budget |
| 1,000 | ~105 GB | ⚠️ Slightly over — consider upgrading |
| 5,000 | ~525 GB | ❌ Need Pro plan |

For a personal project, 100-500 daily visitors is realistic and well within budget. If the project goes viral (10k+ visitors/day), the AI should warn the user about exceeding the limit and suggest upgrading to Pro.

**Optimization tips to stretch bandwidth**:
- Lazy-load sounds and music (don't preload).
- Lazy-load End/Nether dimension assets.
- Use Brotli compression (Vercel does this automatically).
- Use WebP for any larger images (textures are tiny PNGs already).
- Cache aggressively via `Cache-Control: max-age=31536000, immutable` (already in `vercel.json`).

### 16.6 Build Minutes Budget

6,000 minutes/month. At 30-60 sec per build = 6,000-12,000 builds/month. Very generous for a single-dev project.

If approaching limit (rare — would mean 200+ builds/day):
- Skip CI for trivial commits (use `[skip ci]` in commit message — but Vercel doesn't honor this; only GitHub Actions does).
- Batch commits before pushing.
- Use local `npm run build` + `npm run preview` more, push less often.

### 16.7 What Happens When You Hit a Limit

- **Bandwidth**: Vercel shows a 429 Too Many Requests error to new visitors. Existing cached visitors still work. Upgrade to Pro to lift.
- **Build minutes**: New builds fail to start. Existing deploys still serve. Wait until next month, or upgrade.
- **Concurrent builds**: Builds queue — no error, just slower. Auto-resolves.

The AI should monitor these via Vercel MCP `get_project` (returns usage stats) and warn the user if usage crosses 80% of any limit.

### 16.8 Upgrading to Pro (When Needed)

If the user outgrows Hobby:
- Pro is $20/month per team member.
- Removes bandwidth limit (fair use).
- Removes build minute limit (fair use).
- Allows commercial usage.
- 2-12 concurrent builds.
- Password-protected previews.
- Custom domains on previews.

The AI should suggest upgrading only when:
- Bandwidth exceeds ~80GB/month sustained.
- Build queue becomes a real bottleneck (>5 min waits).
- User wants to monetize the site.
- User wants team collaboration.

For a personal Minecraft clone, Hobby is almost certainly sufficient indefinitely.

## 17. Vercel MCP Tool Reference (USE THESE — NOT CLI)

The AI agent uses these Vercel MCP tools for all deployment operations. The user never invokes these directly — the AI does it on their behalf.

| MCP Tool | Purpose | Equivalent CLI (DO NOT USE) |
|---|---|---|
| `create_project` | Link GitHub repo to Vercel as new project | `vercel link` |
| `list_deployments` | List all deployments for the project | `vercel ls` |
| `get_deployment` | Get details of a specific deployment | `vercel inspect <url>` |
| `get_deployment_logs` | Read build/runtime logs | `vercel logs <url>` |
| `promote_deployment` | Promote a deployment to production | `vercel promote <url>` |
| `delete_deployment` | Delete an old deployment | `vercel rm <url>` |
| `set_env_var` | Set an environment variable | `vercel env add` |
| `get_env_vars` | List env vars | `vercel env ls` |
| `add_domain` | Attach a custom domain | `vercel domains add` |
| `get_domain` | Check domain status + DNS config | `vercel domains inspect` |
| `enable_analytics` | Enable Vercel Web Analytics | dashboard toggle |
| `enable_speed_insights` | Enable Speed Insights (RUM) | dashboard toggle |
| `get_analytics` | Read analytics data | dashboard view |
| `get_project` | Read project config | `vercel project ls` |
| `update_project` | Update project settings | dashboard edit |

**Workflow rule**: If the AI cannot find an MCP tool for a needed operation, it should ask the user to grant the missing MCP permission — NOT fall back to the CLI or dashboard.

## 18. Local Vercel Emulation

To test build behavior locally before pushing (the AI does this automatically per the §0.5.3 loop):

```bash
# Build and serve exactly like Vercel will
npm run build
npx serve dist -l 4173
```

For full Vercel platform emulation locally, the AI would normally use `vercel dev`, but since the CLI is off-limits per §3.4, use `npm run dev` (Vite dev server) + `npm run build` + `npm run preview` as the local test loop. The behavior is functionally equivalent for a static SPA.

## 19. Per-Feature Deploy Script (AI-Run, NOT User-Run)

The AI runs this sequence locally for every feature milestone (per `00-master-prompt.md` §0.5.3):

```bash
#!/bin/bash
# scripts/deploy.sh — run by the AI agent, not the user
set -e

echo "🔨 Building..."
npm run build

echo "📦 Bundle size:"
du -sh dist/

echo "📝 Committing..."
git add .
git commit -m "$1"  # commit message passed as arg

echo "🚀 Pushing to GitHub (triggers Vercel auto-deploy)..."
git push origin main

echo "✅ Pushed. Vercel will auto-deploy. AI checks status via MCP."
```

The AI then polls Vercel MCP `get_deployment_logs` for the latest deployment, confirms success, and reports the URL to the user.

---

**That's everything.** The implementing AI should:
1. Read all 12 reference files.
2. Create the project structure from `00-master-prompt.md` §3.
3. Add the config files from this document (§2).
4. Implement all features from `11-features.md`.
5. Follow the architecture in `10-architecture.md`.
6. Deploy using the steps in this document (§3).
7. Verify the checklist in §14 and §15.

Final deliverable: a working VoxelCraft game live on Vercel, playable in any modern browser, faithful to vanilla Minecraft 1.21.
