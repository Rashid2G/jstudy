import path from 'node:path';
import fs from 'node:fs';
import express from 'express';
import { createApp } from './app.js';

const PORT = process.env.PORT || 3001;
const { app } = createApp();

// Serve client in production if built
const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const server = app.listen(PORT, () => {
  console.log(`[studinty] Server listening on port ${PORT}`);
});

export default server;
