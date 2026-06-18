create table if not exists gateway.provider_catalog (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  category text not null,
  auth_type text not null,
  status text not null default 'active',
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint gateway_provider_catalog_key_check check (
    key ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'
  ),
  constraint gateway_provider_catalog_category_check check (
    category in ('payment', 'messaging', 'email', 'ads', 'social')
  ),
  constraint gateway_provider_catalog_auth_type_check check (
    auth_type in ('oauth', 'api_key', 'smtp_credentials', 'manual')
  ),
  constraint gateway_provider_catalog_status_check check (
    status in ('active', 'inactive')
  )
);

create index if not exists gateway_provider_catalog_status_sort_idx
  on gateway.provider_catalog(status, sort_order)
  where deleted_at is null;

drop trigger if exists set_gateway_provider_catalog_updated_at on gateway.provider_catalog;
create trigger set_gateway_provider_catalog_updated_at
  before update on gateway.provider_catalog
  for each row
  execute function core.set_updated_at();

create table if not exists gateway.company_provider_configs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references core.companies(id) on delete cascade,
  provider_id uuid not null references gateway.provider_catalog(id),
  status text not null default 'not_configured',
  public_config jsonb not null default '{}'::jsonb,
  secret_config jsonb not null default '{}'::jsonb,
  last_validation_status text,
  last_validation_message text,
  last_validated_at timestamptz,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint gateway_company_provider_configs_status_check check (
    status in ('not_configured', 'configured', 'active', 'error', 'inactive')
  ),
  constraint gateway_company_provider_configs_validation_status_check check (
    last_validation_status is null
    or last_validation_status in ('untested', 'succeeded', 'failed')
  )
);

create unique index if not exists gateway_company_provider_configs_company_provider_uidx
  on gateway.company_provider_configs(company_id, provider_id)
  where deleted_at is null;

create index if not exists gateway_company_provider_configs_company_status_idx
  on gateway.company_provider_configs(company_id, status)
  where deleted_at is null;

drop trigger if exists set_gateway_company_provider_configs_updated_at
  on gateway.company_provider_configs;
create trigger set_gateway_company_provider_configs_updated_at
  before update on gateway.company_provider_configs
  for each row
  execute function core.set_updated_at();

alter table gateway.provider_catalog enable row level security;
alter table gateway.company_provider_configs enable row level security;

drop policy if exists gateway_provider_catalog_select_authenticated
  on gateway.provider_catalog;
create policy gateway_provider_catalog_select_authenticated
  on gateway.provider_catalog
  for select
  to authenticated
  using (deleted_at is null);

drop policy if exists gateway_provider_catalog_service_role_all
  on gateway.provider_catalog;
create policy gateway_provider_catalog_service_role_all
  on gateway.provider_catalog
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists gateway_company_provider_configs_select_company_members
  on gateway.company_provider_configs;
create policy gateway_company_provider_configs_select_company_members
  on gateway.company_provider_configs
  for select
  to authenticated
  using (
    deleted_at is null
    and exists (
      select 1
      from core.company_memberships cm
      where cm.company_id = company_provider_configs.company_id
        and cm.user_id = auth.uid()
        and cm.status = 'active'
        and cm.deleted_at is null
    )
  );

drop policy if exists gateway_company_provider_configs_service_role_all
  on gateway.company_provider_configs;
create policy gateway_company_provider_configs_service_role_all
  on gateway.company_provider_configs
  for all
  to service_role
  using (true)
  with check (true);

grant select on gateway.provider_catalog to authenticated, service_role;
grant insert, update, delete on gateway.provider_catalog to service_role;
grant select, insert, update, delete on gateway.company_provider_configs to service_role;

insert into gateway.provider_catalog (
  key,
  name,
  description,
  category,
  auth_type,
  status,
  sort_order
)
values
  (
    'smtp',
    'SMTP',
    'Envio de e-mails transacionais por servidor SMTP da empresa.',
    'email',
    'smtp_credentials',
    'active',
    10
  ),
  (
    'mercado_pago',
    'Mercado Pago',
    'Pagamentos online e webhooks normalizados para modulos consumidores.',
    'payment',
    'oauth',
    'active',
    20
  ),
  (
    'whatsapp',
    'WhatsApp',
    'Canal futuro de mensagens solicitado pelo FP Robots e executado pelo Gateway.',
    'messaging',
    'api_key',
    'inactive',
    30
  ),
  (
    'meta',
    'Meta',
    'Integracao futura com ativos Meta para Marketing e canais autorizados.',
    'social',
    'oauth',
    'inactive',
    40
  )
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  auth_type = excluded.auth_type,
  status = excluded.status,
  sort_order = excluded.sort_order,
  deleted_at = null,
  updated_at = now();

insert into robots.event_catalog (
  code,
  source_application_key,
  name,
  description,
  version,
  status
)
values (
  'gateway.smtp.validated',
  'gateway',
  'SMTP validado',
  'Emitido quando a configuracao SMTP de uma empresa e validada pelo FP Gateway.',
  1,
  'active'
)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  version = excluded.version,
  status = excluded.status,
  deleted_at = null,
  updated_at = now();
