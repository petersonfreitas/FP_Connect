# ARCHITECTURE.md - Arquitetura FP WebTech

Este documento resume a arquitetura tecnica viva do ecossistema. Detalhes de status ficam em `docs/MODULE_STATUS.md`; decisoes aprovadas ficam em `docs/DECISIONS.md`.

## Objetivo

O FP WebTech e um ecossistema SaaS multiempresa. A arquitetura deve permitir que novos modulos sejam adicionados sem duplicar identidade, empresa, permissao, auditoria ou integracoes.

Principios:

- um unico banco Supabase/PostgreSQL;
- separacao por schemas de modulo;
- `core` como centro de identidade, empresas, papeis, permissoes, catalogos, modulos contratados e auditoria;
- backend como fronteira de autorizacao;
- frontend sem segredos sensiveis;
- evolucao incremental por backlogs.

## Stack oficial

- Monorepo.
- Next.js para o frontend web.
- NestJS para API interna.
- Supabase Auth.
- Supabase/PostgreSQL.
- Supabase Storage quando houver arquivos.
- Vercel para deploy do frontend.

## Organizacao do monorepo

Estrutura esperada:

```text
apps/
  web/
  food/
  api/
packages/
  shared/
docs/
supabase/
```

Diretrizes:

- `apps/web` concentra o FP Console, o painel inicial do FP Robots e o shell inicial do FP Gateway;
- `apps/food` concentra o frontend operacional separado do FP Food;
- `apps/api` concentra a API Nest modular;
- `packages/shared` guarda tipos/contratos reutilizaveis;
- `supabase/migrations` guarda evolucoes versionadas do banco;
- docs vivos ficam em `docs/`, historicos em `docs/archive/` e escopo funcional em `docs/backlog/`.

## Banco e schemas

O banco e unico.

Schema central:

- `core`: empresas, perfis, papeis, permissoes, vinculos, catalogo de modulos, modulos contratados, auditoria, funcoes centrais.

Schemas de modulo:

- `robots`: eventos, execucoes, automacoes e logs operacionais;
- `food`: operacao de pedidos e entidades do produto Food;
- `gateway`: integracoes externas, credenciais, OAuth, pagamentos, webhooks e canais externos;
- `tracking`: entregas, status e acompanhamento logistico;
- outros schemas futuros conforme backlog aprovado.

Os schemas consultados pela API Nest via Supabase/PostgREST precisam estar expostos em `supabase/config.toml` e tambem nas configuracoes de API do projeto Supabase hospedado. No Supabase hospedado, o caminho e `Project Settings > Data API > Settings > Exposed schemas`. A exposicao do schema nao substitui guards, RLS, policies, service role server-side e escopo por empresa.

Regras:

- entidade de negocio deve possuir `company_id`, salvo entidade global justificada;
- exclusao de negocio deve usar soft delete;
- toda alteracao de schema exige migration versionada;
- indices devem seguir queries reais e filtros por empresa/status/data/soft delete.

## Backend

A API Nest e a fronteira principal de aplicacao.

Responsabilidades:

- autenticar contexto interno recebido do Next server-side;
- validar usuario ativo;
- validar empresa, vinculo, permissao e modulo contratado;
- aplicar policies antes de consultas sensiveis;
- concentrar regras em services;
- manter controllers simples;
- emitir logs e metricas basicas;
- proteger rotas internas por token.

Rotas globais:

- usadas para administracao da plataforma;
- normalmente restritas a `super_admin` ou papel explicitamente autorizado.

Rotas por empresa:

- exigem contexto empresarial;
- validam vinculo e permissao;
- filtram por `company_id`.

## Frontend

Os frontends Next.js operam server-side e chamam a API interna.

Regras:

- nao expor `SUPABASE_SERVICE_ROLE_KEY`;
- nao expor `FP_INTERNAL_API_TOKEN`;
- chamar API interna a partir do server-side;
- usar menus derivados de permissao;
- bloquear duplo submit em formularios e acoes;
- mostrar apenas telas pertinentes ao usuario logado;
- manter interface em portugues do Brasil.

Aplicacoes atuais:

- `apps/web`: FP Console, area administrativa do FP Robots e shell inicial do FP Gateway;
- `apps/food`: operacao do FP Food.

Os frontends compartilham Supabase Auth, cookies HttpOnly de sessao e a mesma API interna, mas podem ter deploys independentes na Vercel.

Se o Supabase for usado no navegador futuramente, a decisao deve ser explicita e limitada a `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`, com RLS obrigatoria.

## Acesso e permissoes

O modelo completo esta em `docs/ACCESS_MODEL.md`.

Resumo:

- identidade e unica;
- papel de plataforma define acesso ao Console;
- vinculos empresariais definem empresas acessiveis;
- modulos contratados definem produto disponivel;
- permissoes definem acoes permitidas;
- carteira de suporte define empresas atendidas por operadores internos.

Menus ocultam o que o usuario nao pode acessar, mas a seguranca real permanece no backend e no banco.

## APIs internas e externas

APIs internas:

- conectam `apps/web` e `apps/api`;
- usam token interno;
- nao sao contrato publico;
- devem validar contexto antes de acessar dados.

APIs publicas/externas:

- ficam deferidas ate backlog ou autorizacao explicita;
- devem ter namespace/versionamento proprio;
- exigem autenticacao de integracao;
- exigem idempotencia quando aplicavel;
- devem registrar logs e auditoria.

Webhooks:

- entrada exige assinatura, token ou validacao equivalente;
- saida, retries e reprocessamentos pertencem preferencialmente ao FP Robots;
- provedores externos devem ser encapsulados pelo futuro FP Gateway.

## FP Robots e FP Gateway

FP Robots:

- orquestra eventos internos;
- registra execucoes, tentativas, erros e reprocessamentos;
- deve nascer sem dependencia obrigatoria de provedores externos.

FP Food:

- opera como produto transacional separado do Console;
- usa o schema `food`;
- consulta identidade, empresa, modulos e permissoes no `core` via API;
- publica eventos `food.*` para o FP Robots quando houver mudanca operacional relevante.

FP Gateway:

- modulo iniciado como shell no Console para credenciais, OAuth e provedores externos;
- deve encapsular WhatsApp, Instagram, Facebook, Ads, Mercado Pago, PagSeguro e canais equivalentes;
- deve ser a fronteira entre o ecossistema e APIs externas.

Regra:

- Robots solicita uma acao; Gateway executa a integracao externa quando o modulo existir.

## Performance e seguranca

Padrao completo em `docs/PERFORMANCE_SECURITY.md`.

Resumo:

- seguranca vem antes de performance;
- usar `select` explicito;
- paginar listagens;
- filtrar soft delete;
- evitar N+1;
- medir rotas antes de otimizar;
- usar rate limit e logs estruturados;
- mover cache/RPC/transacao para onde houver evidencia real.

## Soft delete e auditoria

Entidades de negocio devem usar:

- `created_at`;
- `updated_at`;
- `deleted_at`;
- `deleted_by`, quando aplicavel;
- `delete_reason`, quando aplicavel.

Consultas padrao ignoram registros apagados logicamente.

Hard delete so e permitido para dados temporarios, descartaveis, seeds ou com autorizacao explicita.

## Modulos atuais e futuros

Prioridade atual:

1. FP Connect Admin Console.
2. FP Robots.
3. FP Food.
4. FP Gateway.
5. FP Tracking.

Futuros modulos:

- FP Fiscal;
- FP Router;
- FP Sign;
- FP BI;
- FP Marketing;
- FP Sales;
- FP Tickets;
- FP Billing.

Backlogs futuros orientam fronteiras, mas nao viram implementacao sem autorizacao ou dependencia real.

## Diretriz final

Antes de criar uma estrutura nova, verifique se o `core`, a API interna ou um modulo existente ja oferece o contrato necessario.

Prefira evolucao pequena, migration versionada, guard/policy explicito, validacao objetiva e documentacao curta.
