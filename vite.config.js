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
