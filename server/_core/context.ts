import { inferAsyncReturnType } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { verifyToken } from './oauth';

export interface User {
  id: string;
  email: string;
  // Adicione outros campos de usuário
}

export async function createContext({ req, res }: CreateExpressContextOptions) {
  const token = req.headers.authorization?.split(' ')[1];
  let user: User | null = null;

  if (token) {
    try {
      // A função verifyToken deve ser implementada para validar o JWT
      // e retornar os dados do usuário (id, email, etc.)
      user = await verifyToken(token);
    } catch (error) {
      console.error('Erro ao verificar token:', error);
    }
  }

  return {
    req,
    res,
    user,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
