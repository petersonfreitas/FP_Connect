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
| FP Robots | Alta | 2 | Base funcional em evolucao | Schema `robots`, catalogo de eventos, event log, regras simples `evento -> acao`, execucoes, falha simulada, reprocessamento basico, API interna e tela inicial no Console criados. |
| FP Food | Alta | 2 | Base funcional em evolucao | Frontend separado `apps/food`, menu lateral por Cadastro/Movimentacao, configuracao da loja, categorias/produtos paginados, cardapio derivado, pedido interno V0, vitrine publica V0 por slug, acompanhamento publico de pedido, painel de pedidos com filtro/status, Cozinha V0 e eventos `food.*` iniciais criados. |
| FP Tracking | Alta | 0 | Fundacao de acesso preparada | Endpoint interno `/api/tracking/access` ja valida empresa, modulo contratado e permissao; deve nascer como frontend separado quando entrar em desenvolvimento. |
| FP Billing | Futura | 0 | Fundacao de acesso preparada | Endpoint interno `/api/billing/access` ja valida empresa, modulo contratado e permissao; entrara apos base operacional. |
| FP Tickets | Futura | 0 | Fundacao de acesso preparada | Endpoint interno `/api/tickets/access` ja valida empresa, modulo contratado e permissao; entrara apos base operacional. |
| FP Sales | Futura | 0 | Fundacao de acesso preparada | Endpoint interno `/api/sales/access` ja valida empresa, modulo contratado e permissao; entrara apos base operacional. |
| FP Marketing | Futura | 0 | Fundacao de acesso preparada | Endpoint interno `/api/marketing/access` ja valida empresa, modulo contratado e permissao; entrara apos base operacional. |
| FP Gateway | Alta | 0 | Backlog criado | Integracoes externas, credenciais, OAuth, pagamentos, Mercado Pago, WhatsApp e Meta; LinkedIn e gov.br fora do escopo inicial. |
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
- [x] Separacao conceitual entre orquestracao do Robots e provedores externos via futuro FP Gateway
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
- [x] Acao `internal_log` para teste controlado
- [x] Execucoes geradas por regras ativas
- [x] Botao de evento de teste no Console
- [x] Botao de falha simulada no Console
- [x] Reprocessamento basico
- [x] Integracao inicial com Food
- [ ] Integracao inicial com Tracking

---

## Checklist - FP Food

- [x] Frontend separado quando iniciar o modulo
- [x] Menu lateral por Cadastro e Movimentacao
- [x] Schema `food`
- [x] Endpoint interno de acesso
- [x] Configuracao da loja
- [x] Evento `food.store.configured` para Robots
- [x] Categorias
- [x] Produtos
- [x] Listas paginadas de categorias e produtos
- [x] Cardapio operacional derivado
- [x] Evento `food.menu.updated` para Robots
- [x] Vitrine publica V0 por slug
- [x] Acompanhamento publico V0 por numero do pedido
- [x] Criacao de pedido interno V0
- [x] Painel interno de pedidos
- [x] Filtro por status no painel de pedidos
- [x] Polling leve de 30 segundos no painel de pedidos
- [x] Cozinha V0 com pedidos aceitos e em preparo
- [x] Status simples do pedido
- [ ] Realtime futuro para pedidos, cozinha e acompanhamento publico
- [ ] Pagamento manual, se previsto
- [x] Eventos de pedido para Robots
- [ ] Integracao com Tracking

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

Validar o ciclo funcional da vitrine publica V0 do FP Food:

1. confirmar que a loja esta com status `open`;
2. confirmar que o schema `food` esta exposto nas configuracoes de API do Supabase hospedado;
3. executar `pnpm dev:food` e acessar o frontend Food com usuario autorizado;
4. acessar `/l/[slug-da-loja]`;
5. adicionar produtos ao carrinho simples;
6. enviar pedido publico;
7. confirmar a pagina `/l/[slug-da-loja]/pedido/[numero]`;
8. alterar status em `Movimentacao > Pedidos`;
9. recarregar a pagina publica do pedido e validar o novo status;
10. confirmar evento `food.order.created` no FP Robots com origem `public-store-v0`;
11. seguir para melhoria de UX operacional ou preparacao da integracao com Tracking.

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
