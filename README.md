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

## Supabase

O Supabase CLI é instalado como dev dependency local.

```bash
pnpm supabase:version
pnpm supabase:start
pnpm supabase:status
pnpm supabase:stop
```

O banco é único e separado por schemas de módulo, com `core` centralizando empresas, usuários, permissões, módulos contratados e helpers de autorização.
