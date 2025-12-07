import { Request, Response, NextFunction } from 'express';
import { TRPCError } from '@trpc/server';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err instanceof TRPCError) {
    // Erros tRPC
    res.status(500).json({
      code: err.code,
      message: err.message,
    });
  } else {
    // Outros erros
    console.error(err);
    res.status(500).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Ocorreu um erro inesperado no servidor.',
    });
  }
}
