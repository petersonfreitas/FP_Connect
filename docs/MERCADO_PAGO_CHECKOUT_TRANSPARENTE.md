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
- Webhooks/notificacoes devem atualizar `gateway.payment_requests`, publicar eventos `gateway.payment.*` e refletir status aprovado no pedido Food quando a origem for `food_order`.
- Retentativas de pagamento em pedido existente nao devem duplicar `food.orders`; cada nova tentativa cria uma nova `gateway.payment_requests` com a mesma origem do pedido.
- Eventos `gateway.payment.*` enviados ao FP Robots devem carregar `paymentMethodType`, `paymentTypeId` e `paymentMethodId` quando disponivel. Esses campos nao sao sensiveis e servem para auditoria operacional.

## Webhook Mercado Pago

- Endpoint publico da API: `https://<sua-api>/api/gateway/webhooks/mercado-pago`.
- Variavel obrigatoria em producao: `MERCADO_PAGO_WEBHOOK_SECRET`, gerada em Mercado Pago > Webhooks > Configure notifications.
- Evento Mercado Pago a configurar: `Order (Mercado Pago)`. Este fluxo usa Checkout Transparente com API Orders; o topico `Payment` pertence ao fluxo legado de API Payments e nao deve ser usado para esta conciliacao.
- A assinatura `x-signature` deve ser validada com HMAC SHA256 conforme a documentacao oficial.
- A validacao principal usa `WebhookSignatureValidator` do SDK oficial `mercadopago`; a validacao manual permanece como fallback compatível e como apoio de diagnostico.
- A validacao da assinatura deve considerar que `data.id` pode chegar como query plana (`data.id`), query aninhada (`data[id]`) ou apenas no corpo em simulacoes/logs. A API aceita essas variacoes mantendo a comparacao HMAC com o `x-signature`.
- Em hospedagem com proxy, `x-request-id` pode ser inserido/alterado pela infraestrutura. A validacao testa o manifesto com o header recebido e tambem sem `request-id`, conforme a regra do Mercado Pago para campos ausentes.
- `MERCADO_PAGO_WEBHOOK_SECRET` deve ser exatamente a chave revelada em Mercado Pago > Webhooks > Configure notifications para a aplicacao configurada, sem aspas manuais no valor da env.
- Apos receber notificacao `order`, a API consulta `/v1/orders/{id}` pelo SDK usando o ID `ORD...`, atualiza `gateway.payment_requests` e publica o evento correspondente no Robots.
- A conciliacao automatica por webhook e a consulta manual do Gateway usam a mesma rotina server-side. A consulta manual permanece como fallback operacional, mas fica bloqueada na interface quando a solicitacao ja esta com status `paid`.

## Evolucao sugerida

1. Manter a area Pagamentos no FP Gateway para testes tecnicos de Pix e token de cartao.
2. Criar checkout real no FP Food usando MercadoPago.js/Card Payment Brick. Concluido como V0 publico em `/l/[slug]`.
3. Enviar ao FP Gateway somente o token retornado pelo Mercado Pago e os metadados de pagamento. Concluido como V0 via rota server-side do `apps/food`.
4. Processar order no backend e retornar status normalizado para o Food. Concluido como V0 para status inicial `paid`, `pending` ou `failed`.
5. Implementar webhook publico no Gateway para conciliacao assincrona. Concluido como V0.
6. Atualizar pedido Food conforme eventos normalizados do Gateway.

## Validacoes

- 2026-06-22: smoke test online do checkout publico com cartao de credito validado no sandbox Mercado Pago usando os cenarios APRO, OTHE e CONT.
- Cartao de debito permanece pendente de validacao por falta de cartao de teste no momento.
- Para validar webhook: criar uma cobranca pendente, aprovar no sandbox, confirmar que `gateway.payment_requests.status` virou `paid`, que o pedido Food de origem virou `payment_status = paid`, que o evento de transicao foi publicado no FP Robots e que o botao manual aparece desabilitado como `Pagamento confirmado`.
