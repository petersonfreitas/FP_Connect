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

O foco atual deixou de ser criacao de shells e passou a ser amadurecimento produtivo dos fluxos ja implementados:

- smoke tests manuais dos fluxos principais, pendentes enquanto o acesso ao Supabase estiver instavel;
- estabilizacao de UX, validacoes, observabilidade e processos reais em Console, Food, Gateway e Robots;
- smoke tests e conciliacao online do Mercado Pago, especialmente webhook e cartao de debito;
- preparacao gradual para Tracking completo somente depois que pedido, pagamento, eventos e operacao base estiverem maduros.

O FP Robots ja possui base funcional com catalogo de eventos, event log, regras simples, execucoes e reprocessamento basico. O FP Gateway ja concentra provedores, Mercado Pago, pagamentos, webhook V0, SMTP laboratorio/fallback e eventos `gateway.*`. O FP Food ja opera em frontend separado com loja, cardapio, pedidos, cozinha, entrega simples, vitrine publica, login/cadastro de consumidor e checkout Mercado Pago via Gateway.

Nota de arquitetura: o FP Robots orquestra eventos, regras, acoes, execucoes, falhas e reprocessamentos. O FP Gateway encapsula provedores externos como Mercado Pago, SMTP e futuros canais como WhatsApp, Instagram, Facebook, Ads, PagSeguro e equivalentes, sem transferir para ele a decisao de negocio dos modulos consumidores.

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

### Teste local em modo producao

Use este fluxo antes de publicar em Vercel, Railway ou outro provedor:

```bash
pnpm prod:build
pnpm start:api
pnpm start:web
pnpm start:food
```

Execute cada `start:*` em um terminal separado. Portas padrao:

- API Nest: `http://localhost:3001/api`
- FP Console/Web: `http://localhost:3000`
- FP Food: `http://localhost:3002`

`FP_API_INTERNAL_URL` pode ser configurada com ou sem `/api`; os frontends normalizam o
prefixo automaticamente. Ainda assim, prefira deixar explicito em producao, por exemplo:

```text
FP_API_INTERNAL_URL=https://sua-api.up.railway.app/api
```

## Variaveis de ambiente e navegador

Regra atual: variaveis sem prefixo `NEXT_PUBLIC_` nao devem ser expostas ao navegador.

No estado atual do projeto:

- `SUPABASE_URL` fica no servidor Nest/API.
- `SUPABASE_ANON_KEY` e opcional na API e nao e usada pelo frontend no navegador.
- `SUPABASE_SERVICE_ROLE_KEY` fica somente no backend e nunca deve ir para o frontend.
- `FP_INTERNAL_API_TOKEN` fica somente no server-side do Next e no backend.
- `FP_API_INTERNAL_URL` e usada pelo Next server-side para chamar a API interna. Prefira informar a URL com `/api`.
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

## Deploy Railway - API

Para publicar a API Nest no Railway durante o MVP, aponte o servico para a raiz do monorepo.
Use os mesmos comandos de build/start da API:

```text
Root Directory: deixe em branco
Build Command: pnpm install --frozen-lockfile --prod=false && pnpm build:api
Start Command: pnpm --filter @fp/api start
```

O Railway injeta `PORT` automaticamente; nao fixe `PORT=3001` no ambiente de producao.
Nas variaveis do Vercel Web/Food, configure `FP_API_INTERNAL_URL` com a URL publica da API
incluindo `/api`.

O login do Admin Console usa Supabase Auth pelo server-side do Next. A sessao fica em cookies HttpOnly e o navegador nao recebe a service role nem o token interno. Quando o access token expira, o proxy do Next renova a sessao com o refresh token HttpOnly antes de liberar a rota protegida.

O ecossistema usa Supabase Auth unico nesta fase, mas as sessoes sao isoladas por jornada. O Console/Web, o Food operacional e a vitrine publica do Food usam cookies distintos. Na vitrine publica, a sessao do consumidor e contextual por loja, evitando que o login de uma loja seja reaproveitado automaticamente em outra. A senha da identidade Supabase permanece global por enquanto; isolamento maior de credenciais fica para avaliacao futura.

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
- `GET /api/admin-console/users/me/companies`
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
- `GET /api/gateway/access`
- `GET /api/marketing/access`
- `GET /api/robots/access`
- `GET /api/sales/access`
- `GET /api/tickets/access`
- `GET /api/tracking/access`

Endpoints internos atuais do FP Food operacional:

- `GET /api/food/store`
- `POST /api/food/store`
- `GET /api/food/store/hours`
- `POST /api/food/store/hours`
- `GET /api/food/categories?page=1&pageSize=20`
- `POST /api/food/categories`
- `PATCH /api/food/categories/:categoryId`
- `GET /api/food/products?page=1&pageSize=20`
- `POST /api/food/products`
- `PATCH /api/food/products/:productId`
- `GET /api/food/menu`
- `GET /api/food/dashboard`
- `GET /api/food/orders?page=1&pageSize=20`
- `POST /api/food/orders`
- `GET /api/food/orders/:orderId`
- `PATCH /api/food/orders/:orderId/payment`
- `PATCH /api/food/orders/:orderId/status`

Endpoints internos publicos do FP Food, consumidos server-side pelo `apps/food`:

- `GET /api/food/public/stores/:publicSlug/menu`
- `GET /api/food/public/stores/:publicSlug/checkout`
- `POST /api/food/public/stores/:publicSlug/cart/validate`
- `POST /api/food/public/stores/:publicSlug/customers/me`
- `PATCH /api/food/public/stores/:publicSlug/customers/me/profile`
- `GET /api/food/public/stores/:publicSlug/orders/:orderNumber`
- `POST /api/food/public/stores/:publicSlug/orders`
- `POST /api/food/public/stores/:publicSlug/checkout`
- `POST /api/food/public/stores/:publicSlug/orders/:orderNumber/checkout`

Endpoints internos atuais do FP Gateway:

- `GET /api/gateway/providers`
- `GET /api/gateway/providers/configs`
- `POST /api/gateway/providers/mercado-pago/oauth/start`
- `POST /api/gateway/providers/mercado-pago/oauth/callback`
- `POST /api/gateway/providers/mercado-pago/manual-config`
- `GET /api/gateway/payments/requests?page=1&pageSize=20`
- `POST /api/gateway/payments/requests`
- `POST /api/gateway/payments/requests/:paymentRequestId/sync`
- `POST /api/gateway/providers/smtp/config`
- `POST /api/gateway/providers/smtp/test`
- `POST /api/gateway/providers/smtp/test-email`

Webhook publico do Gateway:

- `POST /api/gateway/webhooks/mercado-pago`

Com excecao do webhook publico do Gateway, essas rotas usam Supabase server-side com `SUPABASE_SERVICE_ROLE_KEY` e exigem o header `X-FP-Internal-Token` com o valor de `FP_INTERNAL_API_TOKEN`.

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
