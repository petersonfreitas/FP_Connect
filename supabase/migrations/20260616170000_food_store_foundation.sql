create schema if not exists food;

grant usage on schema food to authenticated, service_role;

create table if not exists food.stores (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references core.companies(id) on delete cascade,
  display_name text not null,
  public_slug text not null,
  status text not null default 'implementation',
  contact_phone text,
  preparation_time_minutes integer,
  delivery_notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint stores_status_check check (
    status in ('closed', 'implementation', 'open', 'suspended')
  ),
  constraint stores_public_slug_check check (
    public_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint stores_preparation_time_check check (
    preparation_time_minutes is null
    or preparation_time_minutes between 0 and 600
  )
);

create unique index if not exists stores_company_active_uidx
  on food.stores(company_id)
  where deleted_at is null;

create unique index if not exists stores_public_slug_active_uidx
  on food.stores(lower(public_slug))
  where deleted_at is null;

create index if not exists stores_status_idx
  on food.stores(status)
  where deleted_at is null;

drop trigger if exists set_stores_updated_at on food.stores;
create trigger set_stores_updated_at
  before update on food.stores
  for each row
  execute function core.set_updated_at();

alter table food.stores enable row level security;

drop policy if exists stores_select_company_members on food.stores;
create policy stores_select_company_members
  on food.stores
  for select
  to authenticated
  using (
    deleted_at is null
    and exists (
      select 1
      from core.company_memberships cm
      where cm.company_id = stores.company_id
        and cm.user_id = auth.uid()
        and cm.status = 'active'
        and cm.deleted_at is null
    )
  );

drop policy if exists stores_service_role_all on food.stores;
create policy stores_service_role_all
  on food.stores
  for all
  to service_role
  using (true)
  with check (true);

grant select, insert, update, delete on food.stores to authenticated, service_role;

insert into robots.event_catalog (
  code,
  source_application_key,
  name,
  description,
  version,
  status
)
values (
  'food.store.configured',
  'food',
  'Loja Food configurada',
  'Emitido quando a configuracao base de uma loja do FP Food e criada ou atualizada.',
  1,
  'active'
)
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description,
  version = excluded.version,
  status = excluded.status,
  deleted_at = null,
  updated_at = now();
