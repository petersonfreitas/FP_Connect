create table if not exists food.orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references core.companies(id) on delete cascade,
  store_id uuid references food.stores(id) on delete set null,
  order_number text not null,
  status text not null default 'created',
  customer_name text,
  customer_phone text,
  customer_note text,
  subtotal_cents integer not null default 0,
  total_cents integer not null default 0,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint food_orders_status_check check (
    status in ('accepted', 'cancelled', 'created', 'preparing', 'ready')
  ),
  constraint food_orders_total_check check (subtotal_cents >= 0 and total_cents >= 0)
);

create table if not exists food.order_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references core.companies(id) on delete cascade,
  order_id uuid not null references food.orders(id) on delete cascade,
  product_id uuid references food.products(id) on delete set null,
  product_name text not null,
  unit_price_cents integer not null,
  quantity integer not null,
  total_price_cents integer not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint food_order_items_quantity_check check (quantity between 1 and 99),
  constraint food_order_items_price_check check (
    unit_price_cents >= 0 and total_price_cents >= 0
  )
);

create unique index if not exists food_orders_company_number_active_uidx
  on food.orders(company_id, order_number)
  where deleted_at is null;

create index if not exists food_orders_company_created_at_idx
  on food.orders(company_id, created_at desc)
  where deleted_at is null;

create index if not exists food_orders_company_status_idx
  on food.orders(company_id, status, created_at desc)
  where deleted_at is null;

create index if not exists food_order_items_order_idx
  on food.order_items(order_id)
  where deleted_at is null;

drop trigger if exists set_food_orders_updated_at on food.orders;
create trigger set_food_orders_updated_at
  before update on food.orders
  for each row
  execute function core.set_updated_at();

alter table food.orders enable row level security;
alter table food.order_items enable row level security;

drop policy if exists food_orders_select_company_members on food.orders;
create policy food_orders_select_company_members
  on food.orders
  for select
  to authenticated
  using (
    deleted_at is null
    and exists (
      select 1
      from core.company_memberships cm
      where cm.company_id = orders.company_id
        and cm.user_id = auth.uid()
        and cm.status = 'active'
        and cm.deleted_at is null
    )
  );

drop policy if exists food_orders_service_role_all on food.orders;
create policy food_orders_service_role_all
  on food.orders
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists food_order_items_select_company_members on food.order_items;
create policy food_order_items_select_company_members
  on food.order_items
  for select
  to authenticated
  using (
    deleted_at is null
    and exists (
      select 1
      from core.company_memberships cm
      where cm.company_id = order_items.company_id
        and cm.user_id = auth.uid()
        and cm.status = 'active'
        and cm.deleted_at is null
    )
  );

drop policy if exists food_order_items_service_role_all on food.order_items;
create policy food_order_items_service_role_all
  on food.order_items
  for all
  to service_role
  using (true)
  with check (true);

grant select, insert, update, delete on food.orders to authenticated, service_role;
grant select, insert, update, delete on food.order_items to authenticated, service_role;

insert into robots.event_catalog (
  code,
  source_application_key,
  name,
  description,
  version,
  status
)
values
  (
    'food.order.created',
    'food',
    'Pedido Food criado',
    'Emitido quando um pedido interno ou publico do FP Food e criado.',
    1,
    'active'
  ),
  (
    'food.order.status_changed',
    'food',
    'Status do pedido Food alterado',
    'Emitido quando o status operacional de um pedido Food e alterado.',
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
