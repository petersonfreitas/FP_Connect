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
| FP Connect Admin Console | Alta | 2 | Base funcional estabilizada | Empresas, usuarios, papel de plataforma, permissoes, modulos contratados, catalogo, auditoria, guards, bloqueios, paginacao inicial e inativacao operacional ja possuem API e telas principais. |
| FP Robots | Alta | 1 | Shell criado | Rota `/robots`, menu, layout inicial e fronteira conceitual com FP Gateway criados; falta dominio funcional e persistencia. |
| FP Food | Alta | 0 | Fundacao de acesso preparada | Endpoint interno `/api/food/access` ja valida empresa, modulo contratado e permissao; deve nascer como frontend separado quando entrar em desenvolvimento. |
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
- [x] Inativacao operacional de empresas e usuarios exposta na UI administrativa
- [x] Paginacao nas listagens principais de empresas e usuarios
- [x] Bloqueio visual de botoes enquanto formularios e acoes em lote processam
- [x] Modelo documental de acesso, plataforma, empresas e suporte operacional
- [x] Contrato inicial de acesso do usuario atual
- [x] Portal inicial contextual por escopo de acesso
- [x] Menu gerado conforme permissoes reais do usuario
- [x] Papel de plataforma exposto no CRUD central de usuarios
- [x] Cadastro contextual de usuarios no detalhe da empresa
- [x] Edicao/inativacao contextual de vinculo empresarial
- [ ] CRUD separado para usuarios do Console
- [ ] Vinculo de suporte por carteira de empresa
- [ ] Smoke test manual dos fluxos principais

---

## Checklist - FP Robots

- [x] Shell visual V0
- [x] Separacao conceitual entre orquestracao do Robots e provedores externos via futuro FP Gateway
- [ ] Estrutura do modulo
- [ ] Registro de eventos
- [ ] Outbox/event log
- [ ] Payload
- [ ] Status do processamento
- [ ] Logs de erro
- [ ] Listagem de eventos
- [ ] Detalhe de evento
- [ ] Reprocessamento basico
- [ ] Integracao inicial com Food/Tracking

---

## Checklist - FP Food

- [ ] Frontend separado quando iniciar o modulo
- [ ] Configuracao da loja
- [ ] Categorias
- [ ] Produtos
- [ ] Cardapio
- [ ] Vitrine publica
- [ ] Criacao de pedido
- [ ] Painel de pedidos
- [ ] Status do pedido
- [ ] Pagamento manual, se previsto
- [ ] Eventos para Robots
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

Antes de abrir implementacao pesada em Robots, Food e Tracking, concluir a validacao final da fundacao:

1. ajustar portal inicial, menus e CRUDs de usuario conforme `docs/ACCESS_MODEL.md`;
2. executar smoke test completo de empresas, usuarios, permissoes, modulos e auditoria;
3. evoluir o FP Robots para contratos de eventos e event log quando a fundacao estiver validada.

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
