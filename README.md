# FP Connect

Monorepo do ecossistema SaaS FP WebTech.

## Stack

- Next.js para frontends.
- NestJS para backend modular.
- Supabase/PostgreSQL como banco unico do ecossistema.
- PNPM + Turborepo.

## Estagio atual

O projeto esta na fundacao do **FP Connect Admin Console**.

Ja existe base funcional para:

- painel principal com dados reais do schema `core`;
- cadastro, listagem, detalhe e edicao de empresas;
- cadastro de empresas com CPF/CNPJ, telefone, celular, CEP e endereco estruturado normalizados;
- cadastro, listagem e edicao de usuarios;
- definicao de papel de plataforma no perfil central do usuario;
- cadastro direto de usuarios internos do Console por convite;
- policy inicial para `fp_admin` convidar e vincular apenas usuarios `support`;
- menu e telas do Console ajustados para `fp_admin` operar somente suporte;
- vinculo usuario x empresa;
- cadastro contextual de usuarios dentro do detalhe da empresa;
- vinculo de suporte administrativo por carteira de empresa;
- vinculo automatico do superadmin criador como suporte da empresa;
- edicao e inativacao contextual do vinculo empresarial sem inativar o perfil central;
- envio e reenvio de convite/ativacao de usuarios por e-mail via Supabase Auth;
- papeis/permissoes por usuario, empresa e modulo;
- tabela de papeis por usuario com selecao e concessao/revogacao em lote;
- catalogo de planos e modulos;
- modulos contratados por empresa;
- tabela de modulos contratados com selecao e acao em lote por empresa;
- auditoria administrativa por escopo;
- menu administrativo agrupado em `Cadastro`, `Movimentacao` e `Auditoria`;
- login/logout server-side com Supabase Auth e cookies HttpOnly;
- recuperacao de senha por e-mail via Supabase Auth;
- refresh de sessao por refresh token HttpOnly no proxy do Next;
- contrato de performance/seguranca para consultas Supabase, custo operacional e rate limit da API interna;
- `actor_user_id` real enviado pelo Next para a API interna em mutacoes auditadas;
- guards/policies explicitos nas rotas do Admin Console, com rotas globais super-admin only e rotas por empresa validadas por permissao e modulo contratado;
- bloqueio efetivo por modulo contratado nos endpoints internos de acesso dos produtos operacionais;
- inativacao operacional de empresas e usuarios pela UI administrativa;
- paginacao nas listagens principais de empresas e usuarios;
- bloqueio visual de botoes enquanto formularios e acoes em lote estao processando;
- contrato de acesso do usuario atual para portal contextual e menu permissionado;
- home contextual que evita carregar overview global para usuarios sem perfil superadmin;
- CRUD separado para usuarios do Console e usuarios da empresa;
- carteira de suporte por empresa;
- remocao de rotas de cadastro usadas apenas como redirecionamento;
- API Nest interna consumida pelo Next server-side.

Ainda precisam ser amadurecidos antes de entrar pesado nos modulos operacionais:

- smoke tests manuais dos fluxos principais, pendentes enquanto o acesso ao Supabase estiver instavel;
- shell dos modulos Food e Tracking;
- persistencia funcional do FP Robots.

O shell V0 do FP Robots ja possui rota `/robots`, entrada no menu, tela inicial, secoes planejadas e estado vazio sem persistencia nova.

Nota de arquitetura futura: o FP Robots deve orquestrar eventos, regras, acoes, execucoes, falhas e reprocessamentos. O futuro FP Gateway devera encapsular provedores externos como WhatsApp, Instagram, Facebook, Ads, Mercado Pago, PagSeguro e canais equivalentes, sem transferir para ele a decisao de negocio das automacoes.

## Comandos

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm build
```

### Desenvolvimento local

```bash
pnpm dev:web
pnpm dev:api
pnpm dev:stack
```

Copie `.env.example` para `.env` e preencha as variaveis antes de iniciar web/API.

## Variaveis de ambiente e navegador

Regra atual: variaveis sem prefixo `NEXT_PUBLIC_` nao devem ser expostas ao navegador.

No estado atual do projeto:

- `SUPABASE_URL` fica no servidor Nest/API.
- `SUPABASE_ANON_KEY` e opcional na API e nao e usada pelo frontend no navegador.
- `SUPABASE_SERVICE_ROLE_KEY` fica somente no backend e nunca deve ir para o frontend.
- `FP_INTERNAL_API_TOKEN` fica somente no server-side do Next e no backend.
- `FP_API_INTERNAL_URL` e usada pelo Next server-side para chamar a API interna.
- `FP_WEB_URL` define a URL base usada em links server-side, como recuperacao de senha e convite de usuarios.
- `MERCADO_PAGO_CLIENT_ID` e `MERCADO_PAGO_CLIENT_SECRET` ficam somente na API e habilitam o OAuth do FP Gateway.
- No app Mercado Pago, cadastre o redirect como `${FP_WEB_URL}/gateway/mercado-pago/callback`.
- `FP_CNPJ_LOOKUP_USER_AGENT` identifica a chamada server-side para provedores de CNPJ, como BrasilAPI.

O cliente interno do frontend esta em `apps/web/src/lib/internal-api.ts` e usa `server-only`, impedindo importacao por componentes client.

## Deploy Vercel - Web e Food

Para projetos Next.js em monorepo, configure cada app no Vercel com o root do proprio app.
Nao sobrescreva o Output Directory; deixe em branco para a Vercel detectar `.next`.

FP Console/Web:

```text
Root Directory: apps/web
Framework Preset: Next.js
Install Command: corepack enable && corepack prepare pnpm@9.0.0 --activate && pnpm --dir ../.. install --frozen-lockfile --prod=false
Build Command: pnpm vercel-build
Output Directory: deixe em branco
```

FP Food:

```text
Root Directory: apps/food
Framework Preset: Next.js
Install Command: corepack enable && corepack prepare pnpm@9.0.0 --activate && pnpm --dir ../.. install --frozen-lockfile --prod=false
Build Command: pnpm vercel-build
Output Directory: deixe em branco
```

O erro `now-next-routes-manifest` normalmente indica que a Vercel nao encontrou o output `.next`.
Neste repo, `turbo.json` precisa manter o output de build com `.next/**` e `!.next/cache/**`.
Se o log mostrar `devDependencies: skipped because NODE_ENV is set to production`, mantenha
`--prod=false` no Install Command ou remova `NODE_ENV=production` das variaveis manuais do projeto
na Vercel. O build Next.js precisa de devDependencies.

## Deploy Render - API

Para a API Nest, crie um Web Service Node no Render apontando para a raiz do monorepo.
O build precisa instalar devDependencies, pois `@nestjs/cli` e necessario para `nest build`.

```text
Root Directory: deixe em branco
Build Command: pnpm install --frozen-lockfile --prod=false && pnpm build:api
Start Command: pnpm --filter @fp/api start:render
```

Se o log mostrar `nest: not found`, o install foi executado em modo producao e pulou
devDependencies do workspace da API. Mantenha `--prod=false` no Build Command.
No Render, nao use `corepack enable` no Build Command; em alguns ambientes ele tenta alterar
`/usr/bin/pnpm`, que e read-only.
Se o log mostrar `Cannot find module .../apps/api/dist/main.js`, use o `start:render` acima:
ele recompila a API antes de iniciar o processo Node.

O login do Admin Console usa Supabase Auth pelo server-side do Next. A sessao fica em cookies HttpOnly e o navegador nao recebe a service role nem o token interno. Quando o access token expira, o proxy do Next renova a sessao com o refresh token HttpOnly antes de liberar a rota protegida.

Para recuperacao de senha e aceite de convite, cadastre a URL abaixo em Supabase Dashboard > Authentication > URL Configuration > Redirect URLs:

```text
http://localhost:3000/login/atualizar-senha
```

Em producao, cadastre a mesma rota usando o dominio real definido em `FP_WEB_URL`.

O cadastro de usuarios do Admin Console usa `inviteUserByEmail` no backend Nest com service role. O link enviado pelo Supabase direciona para `/login/atualizar-senha`, onde o usuario define a senha inicial. Ao definir a senha, o servidor ativa o perfil e os vinculos pendentes no `core`. O reenvio de convite e permitido somente para usuarios e vinculos ainda pendentes.

Se no futuro houver cliente Supabase direto no navegador, somente variaveis com prefixo explicito `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` poderao ser usadas ali, com seguranca obrigatoriamente baseada em RLS, permissoes e escopo por empresa. A service role nunca pode ser exposta.

## API interna

Endpoints internos atuais do Admin Console:

- `GET /api/admin-console/overview`
- `GET /api/admin-console/users/me/access`
- `GET /api/admin-console/applications`
- `GET /api/admin-console/basic-plans`
- `GET /api/admin-console/catalog`
- `GET /api/admin-console/contracted-modules`
- `GET /api/admin-console/audit-logs`
- `GET /api/admin-console/companies?page=1&pageSize=20`
- `GET /api/admin-console/companies/:id`
- `GET /api/admin-console/companies/:id/users`
- `GET /api/admin-console/companies/:id/support-candidates`
- `GET /api/admin-console/companies/:id/applications`
- `POST /api/admin-console/companies`
- `PATCH /api/admin-console/companies/:id`
- `POST /api/admin-console/companies/:id/applications`
- `POST /api/admin-console/companies/:id/applications/bulk`
- `POST /api/admin-console/companies/:id/support`
- `GET /api/admin-console/users?page=1&pageSize=20`
- `GET /api/admin-console/users?page=1&pageSize=20&scope=platform`
- `GET /api/admin-console/users/:id`
- `POST /api/admin-console/users/console`
- `POST /api/admin-console/users`
- `PATCH /api/admin-console/users/:id`
- `GET /api/admin-console/companies/:companyId/users/:userId/access`
- `POST /api/admin-console/users/me/activate-invite`
- `POST /api/admin-console/companies/:companyId/users/:userId/invite`
- `PATCH /api/admin-console/companies/:companyId/users/:userId/membership`
- `POST /api/admin-console/companies/:companyId/users/:userId/roles`
- `POST /api/admin-console/companies/:companyId/users/:userId/roles/bulk`
- `POST /api/admin-console/companies/:companyId/users/:userId/roles/revoke`
- `POST /api/admin-console/companies/:companyId/users/:userId/roles/revoke-bulk`

Endpoints internos de acesso aos modulos operacionais:

- `GET /api/billing/access`
- `GET /api/food/access`
- `GET /api/marketing/access`
- `GET /api/robots/access`
- `GET /api/sales/access`
- `GET /api/tickets/access`
- `GET /api/tracking/access`

Essas rotas usam Supabase server-side com `SUPABASE_SERVICE_ROLE_KEY` e exigem o header `X-FP-Internal-Token` com o valor de `FP_INTERNAL_API_TOKEN`.

As rotas do Admin Console tambem exigem `X-FP-Actor-User-Id` apontando para um usuario ativo no `core.profiles`. `super_admin` possui bypass global. Rotas com contexto de empresa podem usar policies granulares por permissao, como `admin.companies.read`, `admin.companies.manage`, `admin.users.manage` e `admin.modules.manage`. Rotas globais continuam restritas a super-admin.

As rotas internas dos modulos tambem exigem `X-FP-Actor-User-Id` e `X-FP-Company-Id`. A empresa precisa estar ativa, o modulo precisa estar contratado e ativo, e usuarios comuns precisam possuir a permissao do modulo. `super_admin` ignora a permissao granular, mas nao ignora o bloqueio por modulo contratado.

Em desenvolvimento local, o padrao esperado para o frontend chamar a API e:

```text
FP_API_INTERNAL_URL=http://localhost:3001/api
```

O cadastro de empresas possui rota server-side no Next para consulta de CNPJ. Essa rota envia `User-Agent`, `Accept: application/json`, timeout e retry curto para falhas transitorias do provedor. A integracao externa ainda pode ficar indisponivel por limite, bloqueio ou instabilidade do provedor.

## Supabase

O Supabase CLI e instalado como dev dependency local.

```bash
pnpm supabase:version
pnpm supabase:start
pnpm supabase:status
pnpm supabase:stop
```

O banco e unico e separado por schemas de modulo, com `core` centralizando empresas, usuarios, permissoes, modulos contratados e helpers de autorizacao.

Para a API Nest consultar `core` via `@supabase/supabase-js`, o schema `core` precisa estar em Supabase Dashboard > Project Settings > Data API > Exposed schemas. No ambiente local, `supabase/config.toml` ja declara `core` em `[api].schemas`.

Consultas devem seguir `docs/PERFORMANCE_SECURITY.md`: seguranca acima de performance, `select` explicito, escopo por empresa, soft delete, paginacao para listagens novas, indices alinhados a queries reais, medicao de uso e rate limit antes de chamadas ao Supabase.

### Scripts SQL operacionais

Scripts manuais ficam em `supabase/sql`.

- `supabase/sql/reset_business_data.sql`: limpa dados operacionais e preserva catalogos nativos do sistema.
- `supabase/sql/seed_super_admin.sql`: transforma um usuario ja criado no Supabase Auth em super-admin no schema `core`.

Fluxo recomendado para primeiro acesso:

1. Criar manualmente o primeiro usuario no Supabase Auth.
2. Copiar o UUID desse usuario.
3. Substituir o UUID no CTE `seed` de `seed_super_admin.sql`.
4. Executar o script no SQL Editor do Supabase.

## Documentacao viva

- `docs/ARCHITECTURE.md`: contrato tecnico do ecossistema.
- `docs/ACCESS_MODEL.md`: modelo de identidade, acesso de plataforma, empresas, modulos e suporte operacional.
- `docs/ATUALIZACOES_DOCUMENTOS_BASE_FPWEBTECH_v1.0.0.md`: plano fonte de atualizacao dos documentos-base.
- `docs/DECISIONS.md`: decisoes arquiteturais aprovadas.
- `docs/PERFORMANCE_SECURITY.md`: padrao de consultas Supabase com seguranca, custo operacional e rate limit.
- `docs/ROADMAP.md`: plano macro e proximos passos.
- `docs/MODULE_STATUS.md`: maturidade atual dos modulos.
- `docs/backlog/00.indice_backlogs_pendentes_fpwebtech_v1.0.0.md`: indice dos backlogs pendentes formalizados.
- `docs/backlog/*.md`: fonte funcional de escopo por modulo.
