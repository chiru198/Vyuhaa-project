
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    watch: {
      // Use polling to avoid EMFILE errors
      usePolling: true,
      interval: 1000,
      // Ignore more directories to reduce file watching load
      ignored: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.git/**',
        '**/.vscode/**',
        '**/.idea/**',
        '**/coverage/**',
        '**/*.log',
        '**/tmp/**',
        '**/temp/**',
        '**/cache/**',
        '**/.next/**',
        '**/.nuxt/**',
        '**/public/**',
        '**/static/**',
        '**/.DS_Store',
        '**/Thumbs.db',
        '**/*.map',
        '**/package-lock.json',
        '**/yarn.lock',
        '**/bun.lockb'
      ]
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'lucide-react'
    ],
    // Force optimization to reduce file watching
    force: true
  },
  build: {
    rollupOptions: {
      // Reduce chunking complexity
      output: {
        manualChunks: undefined
      }
    },
    // Disable source maps in development to reduce file load
    sourcemap: false
  },
  esbuild: {
    logOverride: { 
      'this-is-undefined-in-esm': 'silent' 
    }
  }
}));
