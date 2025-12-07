import { Express, Request, Response } from 'express';
import { SignJWT, jwtVerify } from 'jose';
import { User } from './context';

// Chave secreta para assinar e verificar o JWT
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_for_dev');

// Função para criar um JWT
async function createToken(user: User): Promise<string> {
  return new SignJWT(user)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h') // Token expira em 2 horas
    .sign(JWT_SECRET);
}

// Função para verificar um JWT (usada no contexto do tRPC)
export async function verifyToken(token: string): Promise<User> {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  // Assumindo que o payload contém { id: string, email: string }
  return payload as User;
}

// Função para registrar as rotas Express de OAuth
export function registerOAuthRoutes(app: Express) {
  // Rota de Login: Redireciona para o servidor OAuth
  app.get('/api/auth/oauth', (req: Request, res: Response) => {
    const redirectUri = `${process.env.OAUTH_SERVER_URL}/auth?app_id=${process.env.VITE_APP_ID}&redirect_uri=${encodeURIComponent(process.env.OAUTH_REDIRECT_URI || '')}`;
    res.redirect(redirectUri);
  });

  // Rota de Callback: Recebe o código de autorização e troca por um token JWT
  app.get('/api/auth/callback', async (req: Request, res: Response) => {
    const { code } = req.query;

    if (!code) {
      return res.status(400).send('Código de autorização não fornecido.');
    }

    try {
      // 1. Trocar o código por um token de acesso (chamada ao servidor OAuth)
      // Esta é uma simplificação. Na vida real, você faria uma requisição POST
      // para o servidor OAuth para trocar o 'code' por um 'access_token' e dados do usuário.
      // Para fins de correção de bug, vamos simular a obtenção do usuário.
      // O código real deve ser implementado pelo usuário.

      // 2. Simulação de obtenção de dados do usuário (Substituir pela lógica real)
      const user: User = {
        id: 'user-id-from-oauth', // ID real do usuário
        email: 'user@example.com', // E-mail real do usuário
      };

      // 3. Criar o JWT
      const token = await createToken(user);

      // 4. Redirecionar para o frontend com o token (ou definir um cookie)
      // O frontend deve ser capaz de ler este token e armazená-lo.
      res.cookie('auth_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
      res.redirect(process.env.OAUTH_REDIRECT_SUCCESS_URI || '/'); // Redireciona para a página inicial do frontend
    } catch (error) {
      console.error('Erro no callback OAuth:', error);
      res.status(500).send('Erro no processo de autenticação.');
    }
  });

  // Rota de Logout
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    res.clearCookie('auth_token');
    res.status(200).send({ success: true });
  });
}
