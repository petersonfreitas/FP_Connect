# ROADMAP.md - Sequencia do ecossistema FP WebTech

Este arquivo define a direcao de evolucao do produto. Ele deve permanecer curto e nao repetir status detalhado, decisoes ou backlogs.

Fontes complementares:

- `docs/MODULE_STATUS.md`: status atual, nivel e checklists por modulo.
- `docs/ACCESS_MODEL.md`: papeis, vinculos e permissoes.
- `docs/ARCHITECTURE.md`: arquitetura tecnica.
- `docs/DECISIONS.md`: decisoes aprovadas.
- `docs/backlog/`: escopo funcional completo.

## Objetivo

Construir o ecossistema SaaS FP WebTech com base comum multiempresa, Admin Console central, modulos operacionais independentes e integracoes externas controladas.

O crescimento deve ser incremental:

1. consolidar a fundacao;
2. liberar o menor fluxo util por modulo;
3. validar com dados reais;
4. evoluir UX, processos, automacoes, integracoes e analises com criterio de producao;
5. iniciar novos modulos completos somente quando o fluxo base estiver estavel.

## Estado Atual

O detalhe operacional vive em `docs/MODULE_STATUS.md`.

Resumo executivo:

- Admin Console: base funcional estabilizada, ainda com smoke test manual amplo pendente.
- FP Robots: base funcional de eventos, regras simples, execucoes e reprocessamento basico.
- FP Food: primeiro produto operacional em evolucao produtiva, com loja, cardapio, pedidos, cozinha, entrega simples, vitrine publica e checkout Mercado Pago via Gateway.
- FP Gateway: base funcional em evolucao produtiva, com provedores, Mercado Pago, pagamentos, webhook V0, SMTP laboratorio/fallback e direcao de e-mail por API HTTPS.
- FP Tracking: preparado para ciclo futuro, mas ainda nao iniciado como modulo operacional.

## Diretriz Atual

- Tratar Console, Food, Gateway e Robots como preparacao de entrega para producao.
- Usar o FP Food como primeiro consumidor real do ecossistema.
- Evoluir Gateway conforme contratos reais de pagamento, mensagens e provedores surgirem.
- Manter Robots como trilha de eventos e automacoes, sem armazenar credenciais de provedores externos.
- Preservar pagamento manual, entrega simples e SMTP por socket como fallback/laboratorio do MVP.
- Iniciar FP Tracking completo somente depois que pedidos, pagamentos, eventos, permissoes e operacao base estiverem maduros.

## Sequencia Recomendada

### Bloco 1 - Console, Food, Gateway e Robots em modo producao

Objetivo: estabilizar a experiencia real dos fluxos ja implementados.

Prioridades:

- validar smoke tests online dos fluxos principais;
- melhorar UX, textos, menus, feedback de erro e estados de processamento;
- revisar regras reais de pedido, pagamento, cozinha e entrega simples;
- manter paginacao, filtros e bloqueio de duplo submit como padrao;
- registrar eventos relevantes no Robots.

Criterio de saida:

- uma empresa consegue operar pedido, pagamento, cozinha, entrega simples e eventos com menus coerentes e falhas compreensiveis.

### Bloco 2 - Gateway produtivo

Objetivo: fortalecer o Gateway como camada oficial de integracoes externas.

Prioridades:

- validar webhook Mercado Pago online em fluxo real de pedido;
- amadurecer OAuth Mercado Pago por empresa;
- manter sandbox manual somente como apoio de teste;
- evoluir e-mail transacional por API HTTPS;
- preparar contratos futuros para WhatsApp/Meta sem acoplar Food ou Robots aos provedores.

Criterio de saida:

- modulos consumidores solicitam operacoes externas sem conhecer credenciais nem detalhes de provedor.

### Bloco 3 - Food produtivo

Objetivo: amadurecer o FP Food como primeiro produto vendavel.

Prioridades:

- refinar vitrine publica, carrinho e checkout;
- melhorar painel interno de pedidos, cozinha e entrega;
- revisar configuracoes da loja conforme processos reais;
- manter integrações com Gateway e Robots limpas;
- adiar configuracoes avancadas ate haver contrato real que justifique.

Criterio de saida:

- a loja consegue receber, acompanhar e concluir pedidos com experiencia clara para operador e cliente.

### Bloco 4 - Tracking MVP

Objetivo: complementar o Food com acompanhamento logistico real quando a base estiver madura.

Escopo inicial:

- entrega associada a pedido ou origem operacional;
- status de entrega;
- eventos de andamento;
- consulta por empresa;
- base para futura roteirizacao.

Criterio de saida:

- um pedido ou entrega possui rastreamento operacional simples, sem substituir prematuramente a entrega simples do Food.

### Bloco 5 - Cadeia integrada

Objetivo: validar o ecossistema funcionando em cadeia.

Fluxo esperado:

1. Food cria pedido.
2. Gateway processa pagamento ou mensagem externa quando aplicavel.
3. Tracking recebe ou acompanha entrega.
4. Robots registra eventos operacionais e dispara automacoes.
5. Console observa status, logs, permissoes e suporte.

Criterio de saida:

- fluxo multiempresa ponta a ponta com contratos reais de integracao e sem credenciais externas dentro dos modulos consumidores.

## Modulos Futuros

Os modulos abaixo orientam arquitetura, mas nao devem virar implementacao sem autorizacao ou dependencia real:

- FP Fiscal: emissao e gestao fiscal, inicialmente conectado ao Food quando o fluxo exigir.
- FP Router: roteirizacao e apoio logistico futuro do Tracking.
- FP Sign: aceite de propostas e documentos simples.
- FP BI: indicadores e dashboards apos maturidade dos modulos transacionais.
- FP Marketing, Sales, Tickets e Billing: modulos planejados conforme backlogs.

## Regras De Evolucao

- Backlogs definem escopo.
- Fluxos reais definem prioridade.
- Nao criar integracao externa fora do FP Gateway.
- Nao duplicar identidade, empresa ou permissao fora do `core`.
- Nao transformar backlog futuro em implementacao atual sem autorizacao.
- Cada bloco deve terminar com validacao objetiva antes do proximo.
