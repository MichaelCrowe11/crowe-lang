import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createCroweApp } from '../../packages/crowe-vite-plugin/src/index';

export default defineConfig({
  plugins: [
    ...createCroweApp({
      hmr: true,
      sourceMaps: true
    }),
    react()
  ],
  server: {
    port: 3000,
    open: true
  },
  build: {
    sourcemap: true
  }
});