# 🚀 Deploy Rápido - Plataforma Lia Vasconcelos

## ⚡ Início Rápido

Este projeto está **pronto para deploy no Railway**. Siga os passos abaixo:

### 1️⃣ Criar conta no Railway
Acesse: https://railway.app e faça login com GitHub

### 2️⃣ Criar novo projeto
- Clique em **"New Project"**
- Selecione **"Provision MySQL"** (para o banco de dados)
- Depois adicione **"Deploy from GitHub repo"** (para a aplicação)

### 3️⃣ Configurar variáveis de ambiente
Adicione no mínimo estas variáveis:
```
DATABASE_URL=<copie do serviço MySQL>
JWT_SECRET=<gere uma string aleatória de 32+ caracteres>
NODE_ENV=production
PORT=3000
```

### 4️⃣ Executar migrations
No primeiro deploy, adicione em "Custom Build Command":
```bash
pnpm install && pnpm run db:push && pnpm run build
```

### 5️⃣ Gerar domínio público
Em Settings > Networking > Generate Domain

---

## 📖 Guia Completo

Para instruções detalhadas, veja: **[GUIA_DEPLOY_RAILWAY.md](./GUIA_DEPLOY_RAILWAY.md)**

---

## 📁 Arquivos de Configuração Incluídos

- ✅ `railway.json` - Configuração do Railway
- ✅ `nixpacks.toml` - Configuração de build
- ✅ `.env.example` - Exemplo de variáveis de ambiente
- ✅ `GUIA_DEPLOY_RAILWAY.md` - Guia completo passo a passo

---

## 🔧 Desenvolvimento Local

```bash
# Instalar dependências
pnpm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Executar migrations
pnpm run db:push

# Iniciar servidor de desenvolvimento
pnpm run dev
```

---

## 📦 Scripts Disponíveis

- `pnpm dev` - Inicia servidor de desenvolvimento
- `pnpm build` - Compila o projeto para produção
- `pnpm start` - Inicia servidor de produção
- `pnpm db:push` - Executa migrations do banco de dados
- `pnpm test` - Executa testes
- `pnpm check` - Verifica tipos TypeScript

---

## 🛠️ Stack Tecnológica

- **Frontend:** React + Vite + TailwindCSS
- **Backend:** Node.js + Express + tRPC
- **Banco de Dados:** MySQL + Drizzle ORM
- **Autenticação:** OAuth + JWT
- **Pagamentos:** Mercado Pago (opcional)

---

## 📞 Suporte

Se encontrar problemas durante o deploy, consulte:
- [Guia completo de deploy](./GUIA_DEPLOY_RAILWAY.md)
- [Documentação do Railway](https://docs.railway.app)
- Logs de deploy no Railway

---

**Projeto configurado e pronto para deploy! 🎉**
