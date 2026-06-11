# FP Connect

Monorepo do ecossistema SaaS FP WebTech.

## Stack

- Next.js para frontends.
- NestJS para backend modular.
- Supabase/PostgreSQL como banco único do ecossistema.
- PNPM + Turborepo.

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

Copie `.env.example` para `.env` e preencha as variaveis antes de iniciar a API.

### API interna

Endpoints iniciais do Admin Console:

- `GET /api/admin-console/overview`
- `GET /api/admin-console/applications`
- `GET /api/admin-console/basic-plans`
- `GET /api/admin-console/companies`

Essas rotas usam Supabase server-side com `SUPABASE_SERVICE_ROLE_KEY` e exigem o header `X-FP-Internal-Token` com o valor de `FP_INTERNAL_API_TOKEN`.

O front server-side usa `FP_API_INTERNAL_URL` para chamar a API interna. Em desenvolvimento local, o padrao esperado e `http://localhost:3001/api`.

## Supabase

O Supabase CLI é instalado como dev dependency local.

```bash
pnpm supabase:version
pnpm supabase:start
pnpm supabase:status
pnpm supabase:stop
```

O banco é único e separado por schemas de módulo, com `core` centralizando empresas, usuários, permissões, módulos contratados e helpers de autorização.

Para a API Nest consultar `core` via `@supabase/supabase-js`, o schema `core` precisa estar em Supabase Dashboard > Project Settings > Data API > Exposed schemas. No ambiente local, `supabase/config.toml` ja declara `core` em `[api].schemas`.
