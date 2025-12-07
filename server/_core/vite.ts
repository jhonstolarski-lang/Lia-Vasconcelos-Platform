import { Express } from 'express';
import { Server } from 'http';
import express from 'express';

// Funções placeholder para compatibilidade com o index.ts
export async function setupVite(app: Express, server: Server) {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    root: 'client', // O frontend está na pasta client
  });
  app.use(vite.middlewares);
}

export function serveStatic(app: Express) {
  const path = require('path');
  app.use(express.static(path.resolve('client/dist')));
  app.use('*', (req, res) => {
    res.sendFile(path.resolve('client/dist/index.html'));
  });
}
