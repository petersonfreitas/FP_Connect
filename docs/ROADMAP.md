# ROADMAP.md - Sequencia do ecossistema FP WebTech

Este arquivo define a ordem de evolucao do produto. Ele nao deve repetir status detalhado, decisoes ou regras de acesso.

Fontes complementares:

- `docs/MODULE_STATUS.md`: status atual por modulo.
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
4. evoluir automacoes, integracoes e analises somente quando o fluxo base estiver estavel.

## Estado atual

O Admin Console esta no fim da fase de fundacao:

- autenticacao server-side com Supabase Auth;
- acesso separado entre usuarios do Console e usuarios de empresas;
- menus permissionados;
- CRUD de usuarios internos do Console;
- usuarios de empresa administrados no contexto da empresa;
- suporte administrativo vinculado por empresa;
- superadmin vinculado automaticamente como suporte ao criar empresa;
- rotas redirecionadas antigas removidas;
- rate limit, metricas basicas e bloqueio de duplo submit implementados.

Pendencia operacional principal:

- smoke test manual com Supabase ativo para confirmar fluxos de acesso, empresa, usuarios, vinculos, modulos contratados e menus.

O FP Robots ja possui a primeira base funcional:

- schema `robots`;
- catalogo inicial de eventos;
- event log por empresa;
- regras simples `evento -> acao`;
- execucoes por regra ativa;
- falha simulada e reprocessamento basico;
- API interna para registrar/listar/detalhar eventos;
- tela `/robots` com contexto empresarial;
- detalhe de evento com payload mascarado.
- botao de evento de teste no Console.

O FP Food foi iniciado como frontend separado:

- app `apps/food`;
- login compartilhado com Supabase Auth e cookies HttpOnly do ecossistema;
- uso da API interna central `apps/api`;
- dashboard operacional V0 em `/`;
- menu lateral por Cadastro e Movimentacao;
- schema `food` com configuracao inicial de loja;
- categorias e produtos operacionais com listas paginadas;
- cardapio derivado para previa interna;
- pedido interno V0;
- vitrine publica V0 por slug em `/l/[slug]`;
- acompanhamento publico V0 em `/l/[slug]/pedido/[orderNumber]`;
- painel interno de pedidos com filtro por status, acoes rapidas e polling leve de 30 segundos;
- detalhe interno de pedido com itens, dados do cliente e historico simples de status;
- pagamento manual V0 no pedido, sem Gateway;
- Cozinha V0 com fila de pedidos aceitos/em preparo e acoes rapidas;
- Entrega simples V0 com fila de pedidos prontos/em rota e status `out_for_delivery`/`delivered`;
- realtime de pedidos, cozinha e acompanhamento publico fica para fase posterior; refresh manual, `router.refresh()` e polling leve sao provisoriamente aceitaveis no MVP;
- eventos `food.store.configured`, `food.menu.updated`, `food.order.created` e `food.order.status_changed` publicados para o FP Robots.

O FP Gateway foi iniciado como shell no FP Console:

- schema `gateway`;
- catalogo, permissao e role no `core`;
- endpoint interno `/gateway/access` com guard de modulo contratado;
- tela `/gateway` para selecionar empresa e validar fronteiras do modulo;
- catalogo inicial de provedores com SMTP, Mercado Pago, WhatsApp e Meta;
- configuracao SMTP por empresa com segredo server-side;
- teste basico de conexao SMTP e evento `gateway.smtp.validated` para FP Robots;
- `gateway` exposto no `supabase/config.toml`.

## Sequencia recomendada

### Bloco 1 - Fechamento do Admin Console

Objetivo: encerrar a fundacao antes de abrir modulos operacionais.

Itens:

- executar smoke test manual do Admin Console;
- corrigir eventuais 403/404 de fluxo real;
- validar edicao e inativacao de vinculos empresariais;
- validar carteira de suporte;
- revisar logs de rate limit e metricas;
- confirmar que menus ocultam tudo que nao pertence ao usuario.

Criterio de saida:

- superadmin, fp_admin, support e company_user entram no portal correto, veem apenas o que podem usar e executam as acoes permitidas.

### Bloco 2 - FP Robots V0

Objetivo: concluir a primeira camada operacional para eventos e automacoes internas.

Escopo inicial:

- aplicar e validar migration do event log;
- publicar evento interno de teste;
- validar regras simples `evento -> acao`;
- criar execucoes por regra ativa;
- registrar falha basica;
- reprocessar falha manualmente;
- nenhuma integracao externa real no V0.

Diretriz:

- FP Robots orquestra eventos e execucoes.
- FP Gateway, modulo futuro, encapsulara provedores externos como WhatsApp, Meta, pagamentos e canais equivalentes.

Criterio de saida:

- um modulo consegue registrar um evento interno e acompanhar seu processamento basico.

### Bloco 3 - FP Food MVP

Objetivo: primeiro produto operacional do ecossistema.

Base criada:

- frontend separado para operacao do Food;
- dashboard operacional V0;
- navegacao operacional por Cadastro e Movimentacao;
- empresa com modulo Food contratado;
- configuracao inicial da loja;
- categorias com listagem paginada;
- produtos com listagem paginada;
- cardapio operacional derivado;
- pedido interno V0;
- vitrine publica V0 por slug;
- acompanhamento publico V0 do pedido;
- detalhe de pedido e historico simples de status;
- pagamento manual V0;
- cozinha e entrega simples V0;
- eventos iniciais de integracao com FP Robots.

Proximo escopo:

- preparacao dos contratos de integracao com Gateway e Tracking;
- validacao da vitrine publica com pedido real;
- integracao inicial com Tracking;
- integracao inicial com Gateway real/teste para pagamentos e mensagens;
- melhoria de UX operacional conforme gargalos dos fluxos integrados;
- auditoria minima;
- eventos publicados para FP Robots quando fizer sentido.

Criterio de saida:

- uma empresa consegue operar um pedido simples com isolamento por empresa.

### Bloco 4 - FP Tracking MVP

Objetivo: complementar o Food com acompanhamento logistico.

Escopo inicial:

- entrega associada a pedido ou origem operacional;
- status de entrega;
- eventos de andamento;
- consulta por empresa;
- base para futura roteirizacao.

Criterio de saida:

- um pedido ou entrega possui rastreamento operacional simples.

### Bloco 5 - FP Gateway MVP

Objetivo: iniciar a camada oficial de integracoes externas em ambiente real/teste.

Escopo inicial:

- catalogo inicial de provedores: iniciado;
- configuracao de provedor por empresa: iniciada com SMTP;
- conexao real/teste com Mercado Pago ou provedor autorizado;
- abstracao inicial de pagamento para o Food;
- recebimento e normalizacao de webhook;
- logs tecnicos mascarados;
- eventos `gateway.*` para FP Robots.

Criterio de saida:

- Food consegue solicitar uma operacao de pagamento sem conhecer credenciais ou detalhes do provedor.

### Bloco 6 - Integracao Food -> Gateway -> Tracking -> Robots

Objetivo: validar o ecossistema funcionando em cadeia.

Fluxo esperado:

1. Food cria pedido.
2. Gateway processa pagamento ou mensagem externa quando aplicavel.
3. Tracking recebe ou acompanha entrega.
4. Robots registra eventos operacionais.
5. Console observa status, logs e permissoes.

Criterio de saida:

- fluxo multiempresa ponta a ponta com contratos reais de integracao e sem credenciais externas dentro dos modulos consumidores.

## Modulos futuros

Os modulos abaixo orientam arquitetura, mas nao devem virar implementacao sem autorizacao ou dependencia real:

- FP Gateway: integracoes externas, credenciais, OAuth, WhatsApp, Meta, pagamentos e provedores equivalentes.
- FP Fiscal: emissao e gestao fiscal, inicialmente conectado ao Food quando o fluxo exigir.
- FP Router: roteirizacao e apoio logistico futuro do Tracking.
- FP Sign: aceite de propostas e documentos simples.
- FP BI: indicadores e dashboards apos maturidade dos modulos transacionais.
- FP Marketing, Sales, Tickets e Billing: modulos planejados conforme backlogs.

## Regras de evolucao

- Backlogs definem escopo.
- Fluxos reais definem prioridade.
- Nao criar integracao externa antes do FP Gateway.
- Nao duplicar identidade, empresa ou permissao fora do `core`.
- Nao transformar backlog futuro em implementacao atual sem autorizacao.
- Cada bloco deve terminar com validacao objetiva antes do proximo.
