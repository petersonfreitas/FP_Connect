create table if not exists food.dining_tables (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references core.companies(id) on delete cascade,
  store_id uuid references food.stores(id) on delete cascade,
  display_name text not null,
  status text not null default 'available',
  sort_order integer not null default 100,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint food_dining_tables_status_check check (
    status in ('available', 'awaiting_payment', 'inactive', 'occupied')
  ),
  constraint food_dining_tables_sort_order_check check (sort_order between 0 and 100000),
  constraint food_dining_tables_display_name_check check (char_length(trim(display_name)) > 0)
);

create table if not exists food.table_sessions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references core.companies(id) on delete cascade,
  store_id uuid references food.stores(id) on delete set null,
  dining_table_id uuid not null references food.dining_tables(id) on delete restrict,
  order_id uuid references food.orders(id) on delete set null,
  session_number text not null,
  status text not null default 'open',
  customer_name text,
  customer_phone text,
  customer_note text,
  opened_by uuid references auth.users(id),
  closed_by uuid references auth.users(id),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint food_table_sessions_status_check check (
    status in ('awaiting_payment', 'cancelled', 'closed', 'open')
  ),
  constraint food_table_sessions_number_check check (char_length(trim(session_number)) > 0)
);

create unique index if not exists food_dining_tables_store_name_active_uidx
  on food.dining_tables(company_id, store_id, lower(display_name))
  where deleted_at is null;

create index if not exists food_dining_tables_store_status_idx
  on food.dining_tables(company_id, store_id, status, sort_order)
  where deleted_at is null;

create unique index if not exists food_table_sessions_company_number_active_uidx
  on food.table_sessions(company_id, session_number)
  where deleted_at is null;

create unique index if not exists food_table_sessions_active_table_uidx
  on food.table_sessions(dining_table_id)
  where deleted_at is null and status in ('awaiting_payment', 'open');

create index if not exists food_table_sessions_company_status_opened_idx
  on food.table_sessions(company_id, status, opened_at desc)
  where deleted_at is null;

create index if not exists food_table_sessions_table_opened_idx
  on food.table_sessions(dining_table_id, opened_at desc)
  where deleted_at is null;

drop trigger if exists set_food_dining_tables_updated_at on food.dining_tables;
create trigger set_food_dining_tables_updated_at
  before update on food.dining_tables
  for each row
  execute function core.set_updated_at();

drop trigger if exists set_food_table_sessions_updated_at on food.table_sessions;
create trigger set_food_table_sessions_updated_at
  before update on food.table_sessions
  for each row
  execute function core.set_updated_at();

alter table food.dining_tables enable row level security;
alter table food.table_sessions enable row level security;

drop policy if exists food_dining_tables_select_company_members on food.dining_tables;
create policy food_dining_tables_select_company_members
  on food.dining_tables
  for select
  to authenticated
  using (
    deleted_at is null
    and exists (
      select 1
      from core.company_memberships cm
      where cm.company_id = dining_tables.company_id
        and cm.user_id = (select auth.uid())
        and cm.status = 'active'
        and cm.deleted_at is null
    )
  );

drop policy if exists food_dining_tables_service_role_all on food.dining_tables;
create policy food_dining_tables_service_role_all
  on food.dining_tables
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists food_table_sessions_select_company_members on food.table_sessions;
create policy food_table_sessions_select_company_members
  on food.table_sessions
  for select
  to authenticated
  using (
    deleted_at is null
    and exists (
      select 1
      from core.company_memberships cm
      where cm.company_id = table_sessions.company_id
        and cm.user_id = (select auth.uid())
        and cm.status = 'active'
        and cm.deleted_at is null
    )
  );

drop policy if exists food_table_sessions_service_role_all on food.table_sessions;
create policy food_table_sessions_service_role_all
  on food.table_sessions
  for all
  to service_role
  using (true)
  with check (true);

grant select on food.dining_tables to authenticated;
grant select on food.table_sessions to authenticated;
grant select, insert, update, delete on food.dining_tables to service_role;
grant select, insert, update, delete on food.table_sessions to service_role;
