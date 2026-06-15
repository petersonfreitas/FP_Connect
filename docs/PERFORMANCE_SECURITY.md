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
- endpoints internos de acesso dos produtos operacionais exigem empresa ativa, modulo contratado ativo e permissao do modulo; `super_admin` ignora permissao granular, mas nao ignora modulo contratado;
- toda mutacao auditavel deve receber contexto de usuario autenticado.

Quando houver cliente Supabase no navegador, a decisao deve ser explicita e a seguranca deve depender de RLS, escopo por empresa e permissoes.

## Padrao de queries

Toda query nova deve seguir estes pontos:

- usar `select` explicito, nunca carregar colunas desnecessarias;
- filtrar `deleted_at is null` em entidades com soft delete;
- aplicar escopo por `company_id` em entidades de negocio;
- validar acesso antes de consultar dados sensiveis;
- usar `limit` em listagens;
- usar paginacao com limite maximo definido pelo backend;
- preferir cursor/keyset quando houver volume alto, ordenacao temporal intensa ou necessidade de evitar saltos em dados mutaveis;
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

- `page` e `pageSize` sao aceitaveis para listagens administrativas de volume moderado;
- `pageSize` padrao entre 20 e 50;
- `limit` maximo definido pelo backend;
- cursor por `created_at` e `id` quando a ordenacao for temporal;
- filtros permitidos explicitamente no contrato;
- retorno com `items` e metadados de paginacao, como `page`, `pageSize`, `total` e `totalPages`, ou `nextCursor` em listagens por cursor.

Estado atual:

- empresas e usuarios do Admin Console usam `page`, `pageSize`, `total` e `totalPages`;
- auditoria e modulos contratados ainda usam limite fixo/listagem simples e devem ser os proximos candidatos a paginacao quando o volume exigir.

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

## Custo Supabase

O custo do Supabase nao deve ser tratado como "custo por clique" isolado. Uma acao do usuario pode gerar consumo em banco, compute, Auth MAU, egress, storage, logs, Realtime ou Edge Functions.

Referencias oficiais para acompanhar antes de ir a producao:

- Billing e quotas: https://supabase.com/docs/guides/platform/billing-on-supabase
- Compute e disco: https://supabase.com/docs/guides/platform/compute-and-disk
- Rate limits de Auth: https://supabase.com/docs/guides/auth/rate-limits
- Cost control e spend cap: https://supabase.com/docs/guides/platform/cost-control
- Otimizacao de queries: https://supabase.com/docs/guides/database/query-optimization

Padrao para MVP no plano gratuito:

- usar o projeto free para desenvolvimento, homologacao e pilotos pequenos;
- manter banco, storage e egress enxutos;
- evitar Realtime, Storage pesado e jobs recorrentes ate haver necessidade real;
- medir rotas mais usadas antes de otimizar prematuramente;
- manter dados seed/mock fora do projeto de producao;
- revisar dashboard de usage do Supabase ao fim de cada ciclo de testes.

Padrao para producao com clientes reais:

- usar plano pago antes de operar clientes ativos;
- separar ambiente de producao dos ambientes de teste;
- habilitar controles de custo disponiveis no plano;
- acompanhar CPU, memoria, conexoes, disco, egress, Auth MAU e storage;
- testar carga em ambiente de staging quando houver fluxo novo de alto volume;
- projetar limites por empresa, usuario e modulo contratado.

## Medicao de chamadas

Rotas internas que consultam Supabase devem gerar uma trilha minima de metricas. No MVP, isso pode comecar pelos logs estruturados da API; depois pode evoluir para tabela de metricas, APM ou observabilidade externa.

Campos recomendados:

- rota e metodo;
- status HTTP;
- duracao em milissegundos;
- `actor_user_id` quando existir;
- `company_id` quando existir;
- modulo ou aplicacao funcional;
- tamanho aproximado do payload de resposta quando relevante;
- resultado do rate limit;
- flag de rota lenta quando ultrapassar o alvo definido para o modulo.

Nao registrar:

- tokens;
- chaves de API;
- payload sensivel;
- dados pessoais sem necessidade operacional.

## Rate limit da API interna

A API Nest possui `RateLimitGuard` global como primeira barreira antes de consultas ao Supabase.

Configuracao atual:

- health check fica fora do limite;
- requests internos validos com `x-fp-internal-token` usam chave por `x-fp-actor-user-id`, empresa e metodo;
- requests sem token interno valido usam chave por IP e metodo;
- leitura autenticada: 120 requests por minuto;
- mutacao autenticada: 20 requests por minuto;
- leitura por IP: 60 requests por minuto;
- mutacao por IP: 15 requests por minuto;
- resposta bloqueada retorna HTTP 429 com `Retry-After`;
- todas as respostas controladas recebem `X-RateLimit-Limit`, `X-RateLimit-Remaining` e `X-RateLimit-Reset`.

Esta versao e intencionalmente em memoria para o MVP. Quando houver multiplas instancias, alto volume ou necessidade de limite compartilhado por ambiente, a implementacao deve migrar para Redis/Upstash ou componente equivalente, mantendo os mesmos headers e contrato de erro.

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

## UX de processamento

Formularios e acoes que disparam chamadas server-side devem bloquear novo envio enquanto a solicitacao esta pendente.

Padrao atual:

- usar componente de submit com estado pendente quando a acao usa Server Action;
- alterar o texto do botao para indicar processamento;
- desabilitar botoes em acoes em lote quando nao houver selecao ou enquanto a acao estiver pendente;
- usar modal/overlay apenas para operacoes longas, criticas ou com progresso real conhecido.
