import { Express } from 'express';
import { Server } from 'http';
import express from 'express';
import * as path from 'path';
import fs from 'fs/promises';

// Funções placeholder para compatibilidade com o index.ts
export async function setupVite(app: Express, server: Server) {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    root: 'client', // O frontend está na pasta client
  });
  app.use(vite.middlewares);
  // Serve HTML para todas as rotas que não são de API
  app.use('*', async (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    try {
      const url = req.originalUrl;
      let template = await fs.readFile(
        path.resolve('client/index.html'),
        'utf-8'
      );
      template = await vite.transformIndexHtml(url, template);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const path = require('path');
  app.use(express.static(path.resolve('client/dist')));
  app.use('*', (req, res) => {
    res.sendFile(path.resolve('client/dist/index.html'));
  });
}
