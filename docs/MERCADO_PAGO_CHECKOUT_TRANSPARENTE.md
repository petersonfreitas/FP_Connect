# Mercado Pago Checkout Transparente

Referencia operacional para a evolucao do FP Gateway com Mercado Pago Orders API.

## Links oficiais

- Integracao de meios de pagamento: https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/payment-integration.md
- Cartoes credito/debito: https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/payment-integration/cards.md
- Pix: https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/payment-integration/pix.md
- Notificacoes/webhooks: https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/notifications.md
- Testes de integracao: https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/integration-test.md
- Testes com cartao: https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/integration-test/cards.md
- Testes com Pix: https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/integration-test/pix.md

## Decisoes para o FP Gateway

- O FP Gateway cria orders no backend usando a Orders API.
- O FP Gateway guarda credenciais e tokens de provedor apenas server-side.
- Pix pode ser solicitado diretamente pelo backend porque nao exige captura de dados sensiveis do comprador.
- Cartao de credito/debito exige token de cartao gerado no frontend com MercadoPago.js.
- O FP Console, FP Food e a API nao devem coletar nem armazenar numero, validade ou CVV de cartao.
- Para cartao, o frontend deve usar Card Payment Brick preferencialmente; Core Methods fica como alternativa quando for preciso controlar mais a UX.
- A solicitacao interna deve trafegar apenas dados normalizados: valor, comprador, origem, `paymentMethodType`, `paymentMethodId`, `installments` e `cardToken`.
- Webhooks/notificacoes devem atualizar `gateway.payment_requests` e publicar eventos `gateway.payment.*`.

## Evolucao sugerida

1. Manter Pagamentos V0 no FP Console para testes tecnicos de Pix e token de cartao.
2. Criar checkout real no FP Food usando MercadoPago.js/Card Payment Brick. Concluido como V0 publico em `/l/[slug]`.
3. Enviar ao FP Gateway somente o token retornado pelo Mercado Pago e os metadados de pagamento. Concluido como V0 via rota server-side do `apps/food`.
4. Processar order no backend e retornar status normalizado para o Food. Concluido como V0 para status inicial `paid`, `pending` ou `failed`.
5. Implementar webhook publico no Gateway para conciliacao assincrona.
6. Atualizar pedido Food conforme eventos normalizados do Gateway.
