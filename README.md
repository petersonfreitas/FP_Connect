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
- vinculo usuario x empresa;
- papeis/permissoes por usuario, empresa e modulo;
- catalogo de planos e modulos;
- modulos contratados por empresa;
- auditoria administrativa por escopo;
- menu administrativo agrupado em `Cadastro`, `Movimentacao` e `Auditoria`;
- login/logout server-side com Supabase Auth e cookies HttpOnly;
- recuperacao de senha por e-mail via Supabase Auth;
- `actor_user_id` real enviado pelo Next para a API interna em mutacoes auditadas;
- API Nest interna consumida pelo Next server-side.

Ainda precisam ser amadurecidos antes de entrar pesado nos modulos operacionais:

- refresh de sessao e tratamento refinado de expiracao;
- guards/policies completos alem do token interno;
- fluxos de inativacao/soft delete na UI;
- smoke tests manuais dos fluxos principais;
- shell dos modulos Robots, Food e Tracking.

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
- `FP_WEB_URL` define a URL base usada em links server-side, como recuperacao de senha.
- `FP_CNPJ_LOOKUP_USER_AGENT` identifica a chamada server-side para provedores de CNPJ, como BrasilAPI.

O cliente interno do frontend esta em `apps/web/src/lib/internal-api.ts` e usa `server-only`, impedindo importacao por componentes client.

O login do Admin Console usa Supabase Auth pelo server-side do Next. A sessao fica em cookies HttpOnly e o navegador nao recebe a service role nem o token interno.

Para recuperacao de senha, cadastre a URL abaixo em Supabase Dashboard > Authentication > URL Configuration > Redirect URLs:

```text
http://localhost:3000/login/atualizar-senha
```

Em producao, cadastre a mesma rota usando o dominio real definido em `FP_WEB_URL`.

Se no futuro houver cliente Supabase direto no navegador, somente variaveis com prefixo explicito `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` poderao ser usadas ali, com seguranca obrigatoriamente baseada em RLS, permissoes e escopo por empresa. A service role nunca pode ser exposta.

## API interna

Endpoints internos atuais do Admin Console:

- `GET /api/admin-console/overview`
- `GET /api/admin-console/applications`
- `GET /api/admin-console/basic-plans`
- `GET /api/admin-console/catalog`
- `GET /api/admin-console/contracted-modules`
- `GET /api/admin-console/audit-logs`
- `GET /api/admin-console/companies`
- `GET /api/admin-console/companies/:id`
- `GET /api/admin-console/companies/:id/users`
- `GET /api/admin-console/companies/:id/applications`
- `POST /api/admin-console/companies`
- `PATCH /api/admin-console/companies/:id`
- `POST /api/admin-console/companies/:id/applications`
- `GET /api/admin-console/users`
- `GET /api/admin-console/users/:id`
- `POST /api/admin-console/users`
- `PATCH /api/admin-console/users/:id`
- `GET /api/admin-console/companies/:companyId/users/:userId/access`
- `POST /api/admin-console/companies/:companyId/users/:userId/roles`
- `POST /api/admin-console/companies/:companyId/users/:userId/roles/revoke`

Essas rotas usam Supabase server-side com `SUPABASE_SERVICE_ROLE_KEY` e exigem o header `X-FP-Internal-Token` com o valor de `FP_INTERNAL_API_TOKEN`.

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
- `docs/DECISIONS.md`: decisoes arquiteturais aprovadas.
- `docs/ROADMAP.md`: plano macro e proximos passos.
- `docs/MODULE_STATUS.md`: maturidade atual dos modulos.
- `docs/backlog/*.md`: fonte funcional de escopo por modulo.
