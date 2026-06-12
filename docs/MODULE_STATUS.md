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
| FP Connect Admin Console | Alta | 2 | Base funcional em fechamento | Empresas, usuarios, permissoes, modulos contratados, catalogo e auditoria ja possuem API e telas principais. |
| FP Robots | Alta | 0 | Nao iniciado | Proximo modulo de plataforma recomendado apos hardening final do Admin Console. |
| FP Food | Alta | 0 | Nao iniciado | Deve nascer como frontend separado quando entrar em desenvolvimento. |
| FP Tracking | Alta | 0 | Nao iniciado | Deve nascer como frontend separado quando entrar em desenvolvimento. |
| FP Billing | Futura | 0 | Aguardando fase posterior | Entrara apos base operacional. |
| FP Tickets | Futura | 0 | Aguardando fase posterior | Entrara apos base operacional. |
| FP Sales | Futura | 0 | Aguardando fase posterior | Entrara apos base operacional. |
| FP Marketing | Futura | 0 | Aguardando fase posterior | Entrara apos base operacional. |
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
- [x] Guard inicial do Admin Console exigindo super-admin ativo
- [ ] Guards/policies completos por usuario, empresa, permissao e modulo
- [ ] Bloqueio efetivo por empresa/modulo em todas as rotas sensiveis
- [ ] Soft delete/inativacao exposto na UI quando autorizado
- [ ] Smoke test manual dos fluxos principais

---

## Checklist - FP Robots

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

Antes de abrir implementacao pesada em Robots, Food e Tracking, fechar o hardening da fundacao:

1. aplicar guards/policies reais nas rotas sensiveis;
2. resolver empresa/contexto ativo para autorizacao;
3. validar smoke test completo de empresas, usuarios, permissoes, modulos e auditoria.

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
