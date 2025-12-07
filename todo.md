# TODO - Plataforma Lia Vasconcelos

## Funcionalidades Principais

### Estrutura do Banco de Dados
- [x] Criar tabela de assinaturas (subscriptions)
- [x] Criar tabela de conteúdo (content)
- [x] Criar tabela de pagamentos (payments)
- [x] Configurar relacionamentos entre tabelas

### Backend (tRPC)
- [x] Implementar rotas de autenticação
- [x] Implementar rotas de assinatura (criar, verificar status)
- [x] Implementar rotas de pagamento PIX
- [x] Implementar rotas de conteúdo (listar, upload, deletar)
- [x] Implementar middleware de verificação de assinatura ativa

### Frontend - Página Inicial
- [x] Criar página inicial com perfil da Lia Vasconcelos
- [x] Exibir foto de perfil e descrição
- [x] Mostrar planos de assinatura (1, 3 e 6 meses)
- [x] Implementar botões de assinatura

### Sistema de Checkout
- [x] Criar página de checkout
- [x] Formulário de cadastro/login obrigatório
- [x] Exibir resumo do plano selecionado
- [x] Gerar QR Code PIX para pagamento
- [x] Implementar verificação automática de pagamento
- [x] Liberar acesso imediato após confirmação

### Área de Membros
- [x] Criar página de conteúdo exclusivo
- [x] Exibir fotos e vídeos para assinantes
- [x] Implementar proteção de rota (apenas assinantes ativos)
- [x] Sistema de posts/feed
- [x] Contador de mídias

### Painel Administrativo
- [x] Criar página de admin
- [x] Upload de fotos e vídeos
- [x] Gerenciar posts
- [ ] Visualizar assinantes ativos
- [ ] Gerenciar pagamentos

### Testes e Documentação
- [x] Testar fluxo completo de assinatura
- [x] Testar sistema de pagamento
- [x] Testar proteção de conteúdo
- [x] Criar documentação de integração PIX
- [x] Integrar Mercado Pago com credenciais reais
- [x] Todos os testes passando
- [x] Criar checkpoint final
