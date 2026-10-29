import path from 'node:path';
import fs from 'node:fs';
import express from 'express';
import { createApp } from './app.js';

const rawPort = process.env.PORT;
const PORT = Number(rawPort && rawPort !== '3773' ? rawPort : (process.env.APP_PORT || 3001));
const HOST = process.env.HOST || '0.0.0.0';
const { app } = createApp();

// Serve client in production if built (Express 5 compatible SPA fallback)
const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
      return;
    }
    next();
  });
}

const server = app.listen(PORT, HOST, () => {
  console.log(`[studinty] Server listening on http://${HOST}:${PORT}`);
});

export default server;
