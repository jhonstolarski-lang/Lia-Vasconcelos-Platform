import mercadopago from 'mercadopago';

// O token de acesso deve ser fornecido via variável de ambiente
const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

if (!accessToken) {
  console.error('MERCADO_PAGO_ACCESS_TOKEN não está configurado.');
} else {
  mercadopago.configure({
    access_token: accessToken,
  });
}

export { mercadopago };
