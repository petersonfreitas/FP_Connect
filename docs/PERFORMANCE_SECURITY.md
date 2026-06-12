# PERFORMANCE_SECURITY.md - Consultas Supabase com seguranca

Este documento define o padrao de performance e seguranca para consultas ao Supabase/PostgreSQL no ecossistema FP WebTech.

## Regra principal

Seguranca vem antes de performance.

Nenhuma otimizacao pode:

- remover validacao de usuario autenticado;
- ignorar empresa ativa, vinculo, permissao ou modulo contratado;
- confiar em `company_id` enviado livremente pelo frontend;
- expor `SUPABASE_SERVICE_ROLE_KEY` ou `FP_INTERNAL_API_TOKEN`;
- trocar soft delete por hard delete em dado de negocio;
- enfraquecer RLS, policies ou escopo multiempresa.

## Fronteira atual

No estado atual, o Admin Console acessa o banco pelo backend Nest usando Supabase server-side e `SUPABASE_SERVICE_ROLE_KEY`.

Isso significa:

- o frontend nao acessa Supabase diretamente;
- RLS continua existindo como defesa em profundidade;
- a API Nest precisa aplicar guard/policy antes de consultas sensiveis;
- o Admin Console exige usuario ativo antes de acessar rotas internas;
- `super_admin` possui bypass global;
- rotas com contexto de empresa podem usar policies granulares por permissao;
- rotas globais continuam restritas a super-admin;
- toda mutacao auditavel deve receber contexto de usuario autenticado.

Quando houver cliente Supabase no navegador, a decisao deve ser explicita e a seguranca deve depender de RLS, escopo por empresa e permissoes.

## Padrao de queries

Toda query nova deve seguir estes pontos:

- usar `select` explicito, nunca carregar colunas desnecessarias;
- filtrar `deleted_at is null` em entidades com soft delete;
- aplicar escopo por `company_id` em entidades de negocio;
- validar acesso antes de consultar dados sensiveis;
- usar `limit` em listagens;
- preferir paginacao por cursor/keyset quando houver ordenacao por data ou id;
- evitar N+1; buscar ids em lote com `in(...)` quando apropriado;
- retornar payload enxuto para listagens e detalhe separado para dados pesados;
- usar `Promise.all` apenas para consultas independentes;
- manter regras criticas no backend, banco ou ambos.

## Padrao de indices

Toda migration de tabela operacional deve avaliar indices para:

- `company_id`;
- `status`;
- relacionamentos frequentes;
- coluna de ordenacao principal, normalmente `created_at desc`;
- combinacoes usadas juntas, como `company_id, created_at desc`;
- filtros com soft delete usando indice parcial `where deleted_at is null`;
- auditoria por `action, created_at desc` e, quando houver filtro, `company_id, created_at desc`.

Evite criar indice sem query real ou caminho previsto. Indice acelera leitura, mas aumenta custo de escrita e armazenamento.

## Paginacao

Listagens novas devem nascer paginadas.

Padrao recomendado:

- `limit` padrao entre 25 e 50;
- `limit` maximo definido pelo backend;
- cursor por `created_at` e `id` quando a ordenacao for temporal;
- filtros permitidos explicitamente no contrato;
- retorno com `items` e `nextCursor`.

Listagens pequenas de catalogo global podem continuar sem paginacao enquanto tiverem volume controlado.

## Cache

Cache so deve ser usado quando nao reduzir seguranca.

Permitido com cuidado:

- catalogo global de modulos;
- planos base;
- roles e permissoes globais;
- dados sem informacao sensivel por empresa.

Evitar neste momento:

- cache de dados por empresa;
- cache de permissoes de usuario sem invalidacao clara;
- cache de payload sensivel.

## Operacoes em lote

Operacoes em lote podem comecar reaproveitando regras unitarias quando o volume for pequeno.

Quando crescerem, devem evoluir para RPC/transacao no PostgreSQL ou service dedicado, mantendo:

- validacao de permissao antes da operacao;
- escopo por empresa;
- auditoria;
- comportamento idempotente quando aplicavel;
- retorno claro de sucesso, falha ou itens ignorados.

## Checklist para novos modulos

Antes de concluir uma entidade nova em qualquer schema de modulo:

- [ ] possui `company_id`, salvo entidade global justificada;
- [ ] possui `created_at`, `updated_at` e soft delete quando for dado de negocio;
- [ ] possui RLS habilitado;
- [ ] possui policies coerentes com empresa, usuario e modulo;
- [ ] possui indices dos filtros e ordenacoes principais;
- [ ] listagens sao paginadas ou justificadamente pequenas;
- [ ] API valida autenticacao, empresa, vinculo, permissao e modulo contratado;
- [ ] frontend nao recebe segredos nem depende de regra critica visual.
