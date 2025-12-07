import { Request, Response, NextFunction } from 'express';
import path from 'path';

export function serveClient(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === 'production') {
    // Em produção, serve os arquivos estáticos do diretório 'dist' do frontend
    const clientPath = path.join(process.cwd(), 'dist', 'client');
    // Se a rota não for uma API, tenta servir o arquivo index.html
    if (!req.path.startsWith('/api')) {
      return res.sendFile(path.join(clientPath, 'index.html'));
    }
  }
  next();
}
