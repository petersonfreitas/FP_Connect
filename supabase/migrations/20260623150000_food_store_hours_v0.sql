create table if not exists food.store_hours (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references core.companies(id) on delete cascade,
  store_id uuid not null references food.stores(id) on delete cascade,
  kind text not null,
  weekday smallint not null,
  opens_at time not null,
  closes_at time not null,
  is_active boolean not null default true,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint food_store_hours_kind_check check (kind in ('ordering', 'delivery')),
  constraint food_store_hours_weekday_check check (weekday between 0 and 6),
  constraint food_store_hours_time_check check (opens_at <> closes_at)
);

create unique index if not exists food_store_hours_active_uidx
  on food.store_hours(store_id, kind, weekday, opens_at, closes_at)
  where deleted_at is null;

create index if not exists food_store_hours_company_kind_weekday_idx
  on food.store_hours(company_id, kind, weekday)
  where deleted_at is null;

create index if not exists food_store_hours_store_kind_weekday_idx
  on food.store_hours(store_id, kind, weekday)
  where deleted_at is null;

drop trigger if exists set_food_store_hours_updated_at on food.store_hours;
create trigger set_food_store_hours_updated_at
  before update on food.store_hours
  for each row
  execute function core.set_updated_at();

alter table food.store_hours enable row level security;

drop policy if exists food_store_hours_select_company_members on food.store_hours;
create policy food_store_hours_select_company_members
  on food.store_hours
  for select
  to authenticated
  using (
    deleted_at is null
    and exists (
      select 1
      from core.company_memberships cm
      where cm.company_id = store_hours.company_id
        and cm.user_id = auth.uid()
        and cm.status = 'active'
        and cm.deleted_at is null
    )
  );

drop policy if exists food_store_hours_service_role_all on food.store_hours;
create policy food_store_hours_service_role_all
  on food.store_hours
  for all
  to service_role
  using (true)
  with check (true);

grant select, insert, update, delete on food.store_hours to authenticated, service_role;

insert into robots.event_catalog (
  code,
  source_application_key,
  name,
  description,
  version,
  status
)
values (
  'food.store.hours.updated',
  'food',
  'Horarios da loja Food atualizados',
  'Emitido quando os horarios de pedidos ou entregas da loja Food sao atualizados.',
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
