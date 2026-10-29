/// <reference types="vitest" />
import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function studintyApiPlugin(): Plugin {
  return {
    name: 'studinty-sqlite-api',
    async configureServer(server) {
      const { createApp } = await import('./server/app.js');
      const { app } = createApp();
      server.middlewares.use(app);
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), studintyApiPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'server/**/*.{test,spec}.ts'],
  },
});
