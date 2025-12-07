# Integração com Pagamento PIX

## Status Atual

A plataforma está configurada com um **sistema de pagamento PIX simulado** para fins de desenvolvimento e testes. Para colocar em produção, você precisará integrar com um gateway de pagamento real.

## Como Funciona Atualmente (Simulação)

1. **Criação de Assinatura**: Quando o usuário escolhe um plano, o sistema cria:
   - Um registro de assinatura com status "pending"
   - Um registro de pagamento com código PIX simulado

2. **Código PIX Simulado**: 
   - É gerado um código único usando `nanoid`
   - Um QR Code SVG básico é criado como placeholder
   - Status inicial: "pending"

3. **Verificação de Pagamento**:
   - Para testes, o sistema **aprova automaticamente** qualquer pagamento verificado
   - Isso permite testar o fluxo completo sem integração real

## Integrações Recomendadas

Para produção, recomendamos integrar com um dos seguintes gateways:

### 1. Mercado Pago

**Vantagens:**
- Muito popular no Brasil
- API bem documentada
- Suporte a PIX, cartão, boleto
- Taxas competitivas

**Documentação:** https://www.mercadopago.com.br/developers/pt/docs

**Implementação Básica:**
```typescript
import mercadopago from 'mercadopago';

mercadopago.configure({
  access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN!
});

// Criar pagamento PIX
const payment = await mercadopago.payment.create({
  transaction_amount: amount / 100, // converter de centavos para reais
  description: `Assinatura ${planType}`,
  payment_method_id: 'pix',
  payer: {
    email: user.email,
  }
});

// payment.point_of_interaction.transaction_data contém:
// - qr_code: código PIX para copiar e colar
// - qr_code_base64: imagem do QR Code em base64
```

### 2. PagSeguro

**Vantagens:**
- Empresa brasileira (UOL)
- Boa reputação
- Suporte completo a PIX

**Documentação:** https://dev.pagseguro.uol.com.br/

### 3. Stripe (com PIX)

**Vantagens:**
- Plataforma global
- Excelente documentação
- Suporte a PIX no Brasil desde 2022

**Documentação:** https://stripe.com/docs/payments/pix

### 4. Asaas

**Vantagens:**
- Focado em pequenas e médias empresas brasileiras
- Taxas mais baixas
- API simples

**Documentação:** https://docs.asaas.com/

## Como Implementar (Exemplo com Mercado Pago)

### Passo 1: Instalar SDK

```bash
pnpm add mercadopago
```

### Passo 2: Configurar Credenciais

Adicione no painel de Secrets da plataforma Manus:
- `MERCADO_PAGO_ACCESS_TOKEN`: seu token de acesso

### Passo 3: Atualizar `server/routers.ts`

Substitua a seção de criação de pagamento:

```typescript
// Importar no topo do arquivo
import mercadopago from 'mercadopago';

// Configurar (pode fazer em um arquivo separado)
mercadopago.configure({
  access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN!
});

// Na mutation subscription.create:
// Criar pagamento real no Mercado Pago
const payment = await mercadopago.payment.create({
  transaction_amount: amount / 100,
  description: `Assinatura Lia Vasconcelos - ${input.planType}`,
  payment_method_id: 'pix',
  payer: {
    email: ctx.user.email || 'noemail@example.com',
    first_name: ctx.user.name || 'Cliente',
  }
});

const pixCode = payment.body.point_of_interaction.transaction_data.qr_code;
const pixQrCode = `data:image/png;base64,${payment.body.point_of_interaction.transaction_data.qr_code_base64}`;

// Salvar ID do pagamento do Mercado Pago para referência
await db.createPayment({
  subscriptionId,
  userId: ctx.user.id,
  amount,
  paymentMethod: "pix",
  pixCode,
  pixQrCode,
  status: "pending",
  // Adicionar campo externalPaymentId na tabela para guardar payment.body.id
});
```

### Passo 4: Implementar Webhook

Para receber notificações automáticas de pagamento:

```typescript
// Adicionar rota no server/_core/index.ts
app.post('/api/webhook/mercadopago', async (req, res) => {
  const { type, data } = req.body;
  
  if (type === 'payment') {
    const paymentId = data.id;
    
    // Buscar detalhes do pagamento
    const payment = await mercadopago.payment.get(paymentId);
    
    if (payment.body.status === 'approved') {
      // Buscar assinatura pelo externalPaymentId
      // Ativar assinatura
      // Calcular datas
      // Atualizar banco de dados
    }
  }
  
  res.status(200).send('OK');
});
```

### Passo 5: Configurar Webhook no Mercado Pago

1. Acesse o painel do Mercado Pago
2. Vá em Configurações > Webhooks
3. Adicione a URL: `https://seu-dominio.manus.space/api/webhook/mercadopago`
4. Selecione o evento: "Pagamentos"

## Verificação Manual vs Automática

### Atual (Simulado)
- Verificação a cada 3 segundos via polling
- Aprovação automática para testes

### Com Gateway Real
- **Webhook**: Gateway notifica automaticamente quando pago
- **Polling** (backup): Verificar status a cada 5-10 segundos
- Timeout: Parar de verificar após 15-30 minutos

## Segurança

1. **Nunca exponha** tokens de acesso no frontend
2. **Valide webhooks** usando assinatura do gateway
3. **Verifique valores** antes de ativar assinatura
4. **Log de transações** para auditoria
5. **Teste em ambiente sandbox** antes de produção

## Próximos Passos

1. Escolher gateway de pagamento
2. Criar conta e obter credenciais de teste
3. Implementar integração em ambiente de desenvolvimento
4. Testar fluxo completo
5. Configurar webhooks
6. Migrar para credenciais de produção
7. Monitorar transações

## Suporte

Para dúvidas sobre integração:
- Mercado Pago: https://www.mercadopago.com.br/developers/pt/support
- PagSeguro: https://dev.pagseguro.uol.com.br/docs/suporte
- Stripe: https://support.stripe.com/
- Asaas: https://ajuda.asaas.com/

## Custos Estimados (Taxas)

- **Mercado Pago PIX**: ~0,99% por transação
- **PagSeguro PIX**: ~0,99% por transação
- **Stripe PIX**: ~2,59% + R$ 0,39 por transação
- **Asaas PIX**: ~0,89% por transação

*Valores aproximados, consulte os sites oficiais para taxas atualizadas.*
