# MODULE_STATUS.md - Status dos Modulos FP WebTech

Este arquivo controla o avanco dos modulos do ecossistema.

## Niveis de maturidade

| Nivel | Nome | Significado |
|---|---|---|
| 0 | Nao iniciado | Modulo ainda nao possui base validada. |
| 1 | Shell criado | Rotas, menu, layout e protecao basica existem. |
| 2 | Base funcional | Entidades, APIs e telas minimas existem. |
| 3 | Integracao necessaria | Modulo chegou ate a funcao necessaria para outro fluxo. |
| 4 | MVP do modulo | Escopo MVP do backlog foi concluido e validado. |

---

## Status geral

| Modulo | Prioridade atual | Nivel | Status | Observacao |
|---|---:|---:|---|---|
| FP Connect Admin Console | Alta | 2 | Base funcional estabilizada | Empresas, usuarios, papel de plataforma, permissoes, modulos contratados, suporte por carteira, catalogo, auditoria, guards, bloqueios, paginacao inicial e inativacao operacional ja possuem API e telas principais. |
| FP Robots | Alta | 2 | Base funcional em evolucao | Schema `robots`, catalogo de eventos, event log, regras simples `evento -> acao`, execucoes, reprocessamento basico, API interna e painel operacional inicial no Console criados. |
| FP Food | Alta | 2 | Base funcional em evolucao produtiva | Frontend separado `apps/food`, dashboard operacional V0 com acesso rapido da loja, menu lateral reorganizado no padrao do Console por Gestao da loja/Cadastro/Movimentacao, configuracao da loja com link publico, categorias/produtos paginados, cardapio derivado, pedido interno V0, vitrine publica V0 por slug com blocos de loja, acompanhamento, cardapio e checkout, login contextual de consumidor, Minha conta publica, enderecos de entrega V0 com padrao por loja, validacao server-side de carrinho, pedido publico vinculado ao consumidor autenticado, checkout publico com cartao Mercado Pago via Gateway V0, painel de pedidos com filtro/status, detalhe de pedido com historico simples, pagamento manual V0, Cozinha V0 com preparo por item, Entrega simples V0 e eventos `food.*` iniciais criados. Proximas melhorias devem priorizar experiencia, validacoes e processos reais. |
| FP Tracking | Alta | 0 | Preparado para ciclo futuro | Endpoint interno `/api/tracking/access` ja valida empresa, modulo contratado e permissao; deve nascer como frontend separado e assumir entrega/rastreio real do Food depois da estabilizacao produtiva de Food, Gateway, Robots e Console. |
| FP Billing | Futura | 0 | Fundacao de acesso preparada | Endpoint interno `/api/billing/access` ja valida empresa, modulo contratado e permissao; entrara apos base operacional. |
| FP Tickets | Futura | 0 | Fundacao de acesso preparada | Endpoint interno `/api/tickets/access` ja valida empresa, modulo contratado e permissao; entrara apos base operacional. |
| FP Sales | Futura | 0 | Fundacao de acesso preparada | Endpoint interno `/api/sales/access` ja valida empresa, modulo contratado e permissao; entrara apos base operacional. |
| FP Marketing | Futura | 0 | Fundacao de acesso preparada | Endpoint interno `/api/marketing/access` ja valida empresa, modulo contratado e permissao; entrara apos base operacional. |
| FP Gateway | Alta | 2 | Base funcional em evolucao produtiva | Painel operacional em `/gateway`, subareas internas para pagamentos, Mercado Pago, e-mail, provedores e eventos, schema `gateway`, catalogo de provedores, configuracao SMTP por empresa como laboratorio/fallback, tela de e-mail orientada ao futuro provedor por API HTTPS, OAuth Mercado Pago por empresa iniciado, sandbox manual Mercado Pago, contrato interno de solicitacao de pagamento, PIX e cartao tokenizado via Orders API, webhook Mercado Pago V0 e eventos `gateway.*` para Robots. SMTP por socket fica obsoleto para producao; e-mail transacional deve priorizar API HTTPS de provedor dedicado. |
| FP Fiscal | Alta/Media | 0 | Backlog criado | Modulo fiscal proprio, com foco inicial na evolucao fiscal do FP Food. |
| FP Sign | Media | 0 | Backlog criado | Aceite simples, contratos, propostas e arquivamento documental; sem assinatura digital avancada no MVP. |
| FP BI | Media/Baixa | 0 | Backlog criado | Indicadores e dashboards; evoluir apos maturidade dos modulos transacionais. |
| FP Router | Baixa | 0 | Backlog criado | Complemento futuro do FP Tracking; absorve o antigo conceito EixoGuard. |
| FP Monitor | Plataforma/Futura | 0 | Deferido | Modulo de observabilidade de APIs, servicos, integracoes e incidentes; pode antecipar se houver necessidade operacional. |

---

## Checklist - FP Connect Admin Console

- [x] Empresas
- [x] Edicao de empresas
- [x] Endereco estruturado, celular e mascaras amigaveis no cadastro de empresas
- [x] Usuarios
- [x] Edicao de usuarios
- [x] Vinculo usuario/empresa
- [x] Perfis/permissoes por usuario, empresa e modulo
- [x] Concessao/revogacao de papeis em lote por usuario
- [x] Catalogo de modulos
- [x] Catalogo de planos
- [x] Modulos contratados por empresa
- [x] Acao em lote para modulos contratados por empresa
- [x] Layout administrativo base
- [x] Menu agrupado em Cadastro, Movimentacao e Auditoria
- [x] Auditoria basica
- [x] API interna Nest consumida pelo Next server-side
- [x] Login/logout server-side com Supabase Auth
- [x] Recuperacao de senha por e-mail
- [x] Refresh de sessao com refresh token HttpOnly no proxy do Next
- [x] Seed SQL inicial de super-admin
- [x] Reset SQL de dados operacionais preservando catalogos nativos
- [x] `actor_user_id` real nas mutacoes auditadas
- [x] Contrato de performance/seguranca para consultas Supabase
- [x] Indices complementares do `core` para consultas atuais
- [x] Guard inicial do Admin Console com usuario ativo e bypass super-admin
- [x] Policies granulares iniciais por permissao em rotas com contexto de empresa
- [x] Envio efetivo de convite/ativacao de usuarios por e-mail
- [x] Reenvio de convite para usuarios pendentes
- [x] Ativacao de perfil e vinculos pendentes apos definicao de senha
- [x] Policies explicitas em rotas globais, empresas, permissoes e modulos do Admin Console
- [x] Bloqueio efetivo por modulo contratado nos endpoints internos de acesso dos produtos operacionais
- [x] Acesso operacional aceita modulo contratado em implantacao ou ativo, bloqueando suspenso/cancelado
- [x] Inativacao operacional de empresas e usuarios exposta na UI administrativa
- [x] Paginacao nas listagens principais de empresas e usuarios
- [x] Bloqueio visual de botoes enquanto formularios e acoes em lote processam
- [x] Modelo documental de acesso, plataforma, empresas e suporte operacional
- [x] Contrato inicial de acesso do usuario atual
- [x] Portal inicial contextual por escopo de acesso
- [x] Menu gerado conforme permissoes reais do usuario
- [x] Papel de plataforma exposto no CRUD central de usuarios
- [x] Cadastro direto de usuarios internos do Console por convite
- [x] Policy inicial para `fp_admin` convidar e vincular apenas suporte
- [x] Menu e UI do `fp_admin` alinhados as policies de suporte
- [x] Cadastro contextual de usuarios no detalhe da empresa
- [x] Edicao/inativacao contextual de vinculo empresarial
- [x] CRUD separado para usuarios do Console
- [x] Vinculo simples de suporte por carteira de empresa
- [x] Vinculo automatico do superadmin criador como suporte da empresa
- [x] Remocao das rotas de cadastro usadas apenas como redirecionamento
- [ ] Smoke test manual dos fluxos principais

---

## Checklist - FP Robots

- [x] Shell visual V0
- [x] Separacao conceitual entre orquestracao do Robots e provedores externos via FP Gateway
- [x] Estrutura do modulo
- [x] Catalogo inicial de eventos
- [x] Registro de eventos
- [x] Event log
- [x] Payload mascarado para consulta operacional
- [x] Status inicial de recebimento
- [x] Logs de erro em execucoes falhadas
- [x] Listagem de eventos
- [x] Detalhe de evento
- [x] Regras simples `evento -> acao`
- [x] Acao `internal_log` para primeira automacao interna
- [x] Execucoes geradas por regras ativas
- [x] Painel operacional inicial com visao geral, eventos, execucoes, regras e catalogo
- [x] Remocao dos atalhos de teste do Console
- [x] Filtros e paginacao em eventos e execucoes
- [x] Reprocessamento basico
- [x] Integracao inicial com Food
- [ ] Integracao inicial com Tracking

---

## Checklist - FP Food

- [x] Frontend separado quando iniciar o modulo
- [x] Dashboard operacional V0
- [x] Atalhos de area da loja e link publico no dashboard operacional
- [x] Menu lateral por Gestao da loja, Cadastro e Movimentacao no padrao visual do Console
- [x] Schema `food`
- [x] Endpoint interno de acesso
- [x] Configuracao da loja
- [x] Link publico visivel no cadastro da loja
- [x] Evento `food.store.configured` para Robots
- [x] Categorias
- [x] Produtos
- [x] Listas paginadas de categorias e produtos
- [x] Cardapio operacional derivado
- [x] Evento `food.menu.updated` para Robots
- [x] Vitrine publica V0 por slug
- [x] Vitrine publica organizada por loja, acompanhamento, cardapio e checkout
- [x] Acompanhamento publico V0 por numero do pedido
- [x] Identidade de consumidor por loja V0
- [x] Login contextual na vitrine publica
- [x] Sessao publica do consumidor isolada por loja
- [x] Smoke test de isolamento de sessao entre Console, Food operacional e vitrines publicas por loja
- [x] Minha conta publica do consumidor
- [x] Enderecos de entrega V0 com multiplos cadastros e endereco padrao por loja
- [x] Selecao de endereco de entrega no checkout publico
- [x] Fotografia do endereco de entrega no pedido publico
- [x] Logout publico da vitrine por loja
- [x] Bloqueio de checkout sem login e sem cadastro completo
- [x] Validacao server-side de carrinho publico
- [x] Carrinho publico com linhas separadas por observacao e edicao de quantidade/observacao por linha
- [x] Pedido publico vinculado ao consumidor autenticado
- [x] Criacao de pedido interno V0
- [x] Painel interno de pedidos
- [x] Atendimento interno separado para criacao de pedidos de balcao
- [ ] Controle de mesa/comanda
- [x] Detalhe interno do pedido
- [x] Historico simples de status do pedido
- [x] Filtro por status no painel de pedidos
- [x] Polling leve de 30 segundos no painel de pedidos
- [x] Cozinha V0 com pedidos aceitos e em preparo
- [x] Status de preparo por item de pedido para cozinha
- [x] Entrega simples V0 com pedidos prontos e em rota
- [x] Status simples do pedido
- [x] Pagamento manual V0
- [x] Checkout publico com cartao Mercado Pago via FP Gateway V0
- [x] Smoke test publico com cartao Mercado Pago sandbox
- [ ] Smoke test publico com cartao de debito Mercado Pago sandbox
- [x] Retentativa publica de pagamento com cartao sem duplicar pedido
- [ ] Grupos de complementos por produto com ingredientes inclusos removiveis
- [ ] Snapshot de complementos no carrinho e nos itens do pedido
- [ ] Realtime futuro para pedidos, cozinha e acompanhamento publico
- [x] Eventos de pedido para Robots
- [ ] Integracao com Tracking

---

## Checklist - FP Gateway

- [x] Shell visual V0 no FP Console
- [x] Shell visual V0 organizado por subareas internas no FP Console
- [x] Area dedicada para configuracao Mercado Pago, separada da operacao de pagamentos
- [x] Area de e-mail reposicionada para API HTTPS futura, mantendo SMTP como laboratorio/fallback
- [x] Schema `gateway`
- [x] Catalogo do modulo no `core`
- [x] Permissao `gateway.access`
- [x] Role `module-admin`
- [x] Endpoint interno de acesso
- [x] Menu condicionado por modulo/permissao
- [x] Catalogo inicial de provedores
- [x] Configuracao de provedor por empresa
- [x] Configuracao SMTP V0
- [x] Teste basico de conexao SMTP
- [x] Evento `gateway.smtp.validated` para FP Robots
- [x] Envio real de e-mail SMTP de teste
- [x] Evento `gateway.smtp.test_email_sent` para FP Robots
- [x] Evento `gateway.smtp.test_email_failed` para falha de envio SMTP
- [x] Tratamento de erro TLS/SMTP para evitar queda do processo da API em provedor mal configurado
- [x] Mensagem operacional para erro SMTP `wrong version number`, orientando porta/TLS correta
- [ ] Estabilizacao operacional SMTP em provedor/rede sem timeout
- [ ] Provedor de e-mail transacional por API HTTPS para fase de producao
- [x] Tabela `gateway.payment_requests`
- [x] Contrato interno para solicitar pagamento
- [x] Tela para registrar/listar solicitacoes de pagamento
- [x] Filtros e paginacao em solicitacoes de pagamento
- [x] Eventos `gateway.payment.*` iniciais para FP Robots
- [x] SDK oficial Mercado Pago instalada na API
- [x] Inicio OAuth Mercado Pago por empresa
- [x] Callback OAuth Mercado Pago com tokens server-side
- [x] Evento `gateway.mercado_pago.oauth_connected` para FP Robots
- [x] Configuracao manual sandbox Mercado Pago por empresa
- [x] Criacao real de order PIX Mercado Pago via Checkout Transparente Orders API a partir de `gateway.payment_requests`
- [x] Roteiro sandbox PIX ajustado com nome `APRO` e valor sugerido `200,00`
- [x] Validacao sandbox PIX para e-mail de pagador com dominio `@testuser.com`
- [x] Consulta manual de status Mercado Pago Orders na tela de Pagamentos
- [x] Status inicial da order Mercado Pago normalizado na criacao, com `gateway.payment.paid` imediato quando sandbox nascer pago
- [x] Contrato V0 preparado para cartao de credito/debito Mercado Pago com token gerado por MercadoPago.js/Card Payment Brick
- [x] Integracao Food -> Gateway para solicitar pagamento com cartao a partir do pedido publico
- [x] Nova tentativa de pagamento para pedido existente gerando nova `gateway.payment_requests`
- [x] Smoke test com cartao Mercado Pago sandbox
- [x] Smoke test com PIX Mercado Pago sandbox
- [x] Webhook Mercado Pago V0 para conciliacao assincrona de orders
- [ ] Smoke test webhook Mercado Pago sandbox
- [ ] Envio transacional SMTP solicitado pelo FP Robots

---

## Checklist - FP Tracking

- [ ] Frontend separado quando iniciar o modulo
- [ ] Estrutura do modulo
- [ ] Entregadores
- [ ] Veiculos, se previsto
- [ ] Entregas
- [ ] Status da entrega
- [ ] Vinculo com pedido de origem
- [ ] Criacao de entrega a partir do Food
- [ ] Tela basica de entregas
- [ ] Tela/PWA inicial do entregador, se previsto
- [ ] Link publico de rastreamento
- [ ] Eventos para Robots
- [ ] Retorno de status para Food

---

## Proximo marco recomendado

Estabilizar os fluxos ja implementados com mentalidade de producao, usando o FP Food como primeiro consumidor real do ecossistema:

1. validar webhook Mercado Pago online em fluxo real de pedido;
2. melhorar UX, menus, mensagens de erro, estados de carregamento e validacoes do Food e Gateway;
3. revisar regras e processos reais de pedido, pagamento, cozinha e entrega simples;
4. manter FP Robots como trilha de eventos e automacoes dos fluxos integrados;
5. modelar configuracoes avancadas do Food somente quando o contrato real exigir;
6. preservar pagamento manual, entrega simples e SMTP por socket como fallback/laboratorio do MVP;
7. iniciar FP Tracking completo somente depois que Food, Gateway, Robots e Console estiverem maduros para operacao.

---

## Como atualizar

Atualize este arquivo sempre que um modulo mudar de nivel.

Formato recomendado:

```text
Modulo:
Nivel anterior:
Novo nivel:
Data:
Motivo:
Arquivos/migrations principais:
Pendencias:
```
