# 🚀 Guia de Deploy no Railway - Plataforma Lia Vasconcelos

## 📋 Pré-requisitos

1. Conta no [Railway](https://railway.app) (pode usar login do GitHub)
2. Repositório do projeto no GitHub
3. Banco de dados MySQL configurado

---

## 🗄️ Passo 1: Configurar Banco de Dados MySQL

### Opção A: Usar MySQL do Railway (Recomendado)

1. No Railway, clique em **"New Project"**
2. Selecione **"Provision MySQL"**
3. Aguarde a criação do banco
4. Clique no serviço MySQL criado
5. Vá na aba **"Variables"**
6. Copie o valor de `DATABASE_URL` (você vai precisar depois)

### Opção B: Usar banco externo (PlanetScale, etc.)

Se você já tem um banco MySQL externo, tenha em mãos a URL de conexão no formato:
```
mysql://usuario:senha@host:3306/nome_do_banco
```

---

## 📦 Passo 2: Deploy da Aplicação

1. **No Railway, clique em "New Project"** (ou adicione ao projeto existente se criou o MySQL)

2. **Selecione "Deploy from GitHub repo"**
   - Autorize o Railway a acessar seu GitHub (se necessário)
   - Selecione o repositório do projeto

3. **Aguarde o Railway detectar o projeto**
   - O Railway vai detectar automaticamente que é um projeto Node.js

---

## ⚙️ Passo 3: Configurar Variáveis de Ambiente

1. Clique no serviço da aplicação (não no MySQL)
2. Vá na aba **"Variables"**
3. Clique em **"New Variable"** e adicione as seguintes variáveis:

### Variáveis OBRIGATÓRIAS:

```bash
DATABASE_URL=mysql://usuario:senha@host:3306/nome_do_banco
# Se usou MySQL do Railway, copie a URL que você salvou no Passo 1
# Se não, use a URL do seu banco externo

JWT_SECRET=gere_uma_string_aleatoria_de_no_minimo_32_caracteres
# Você pode gerar em: https://generate-secret.vercel.app/32

NODE_ENV=production

PORT=3000
```

### Variáveis para Autenticação Manus (se aplicável):

```bash
VITE_APP_ID=seu_app_id_manus
OAUTH_SERVER_URL=https://oauth.manus.im
OWNER_OPEN_ID=seu_open_id_aqui
```

### Variáveis para Mercado Pago (se aplicável):

```bash
MERCADO_PAGO_ACCESS_TOKEN=seu_token_mercado_pago
```

4. Clique em **"Add"** para cada variável

---

## 🔄 Passo 4: Executar Migrations do Banco

Após o primeiro deploy:

1. No Railway, vá no serviço da aplicação
2. Clique na aba **"Settings"**
3. Role até **"Service Settings"**
4. Em **"Custom Build Command"**, adicione:
   ```bash
   pnpm install && pnpm run db:push && pnpm run build
   ```
5. Clique em **"Redeploy"** para executar as migrations

**Importante:** Após as migrations serem executadas com sucesso, você pode remover o `pnpm run db:push` do comando de build para evitar executar migrations em todo deploy.

---

## 🌐 Passo 5: Acessar a Aplicação

1. Vá na aba **"Settings"** do serviço da aplicação
2. Role até **"Networking"**
3. Clique em **"Generate Domain"**
4. O Railway vai gerar um domínio público (ex: `seu-projeto.up.railway.app`)
5. Aguarde alguns segundos e acesse o domínio gerado

---

## 🔍 Verificar Logs

Se algo der errado:

1. Vá na aba **"Deployments"**
2. Clique no deployment mais recente
3. Veja os logs de build e runtime
4. Procure por erros em vermelho

---

## 🔧 Problemas Comuns

### ❌ Erro: "Cannot connect to database"
- Verifique se a variável `DATABASE_URL` está correta
- Certifique-se de que o banco MySQL está rodando
- Se usar MySQL do Railway, verifique se os serviços estão no mesmo projeto

### ❌ Erro: "Port already in use"
- O Railway gerencia as portas automaticamente
- Certifique-se de que `PORT` está definido como `3000`

### ❌ Erro de build
- Verifique se todas as dependências estão no `package.json`
- Veja os logs de build para identificar o erro específico

### ❌ Aplicação não inicia
- Verifique os logs de runtime
- Certifique-se de que todas as variáveis obrigatórias estão configuradas
- Verifique se o comando `pnpm start` está correto

---

## 🎯 Domínio Personalizado (Opcional)

1. Vá em **"Settings"** > **"Networking"**
2. Em **"Custom Domain"**, adicione seu domínio
3. Configure os registros DNS conforme instruções do Railway
4. Aguarde a propagação DNS (pode levar até 48h)

---

## 📝 Notas Importantes

- ✅ O Railway faz deploy automático quando você faz push no GitHub
- ✅ Você tem $5 de crédito gratuito por mês
- ✅ Após o crédito gratuito, o custo é baseado no uso
- ✅ Você pode pausar o projeto quando não estiver usando para economizar créditos

---

## 🆘 Precisa de Ajuda?

- [Documentação do Railway](https://docs.railway.app)
- [Discord do Railway](https://discord.gg/railway)
- [Status do Railway](https://status.railway.app)

---

## ✅ Checklist Final

- [ ] Banco de dados MySQL configurado
- [ ] Repositório no GitHub
- [ ] Projeto criado no Railway
- [ ] Variáveis de ambiente configuradas
- [ ] Migrations executadas
- [ ] Domínio gerado
- [ ] Aplicação acessível e funcionando

---

**Boa sorte com seu deploy! 🚀**
