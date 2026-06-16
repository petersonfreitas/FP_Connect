create table if not exists food.categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references core.companies(id) on delete cascade,
  store_id uuid references food.stores(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  status text not null default 'active',
  sort_order integer not null default 100,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint food_categories_status_check check (status in ('active', 'inactive')),
  constraint food_categories_slug_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table if not exists food.products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references core.companies(id) on delete cascade,
  store_id uuid references food.stores(id) on delete cascade,
  category_id uuid references food.categories(id) on delete set null,
  name text not null,
  slug text not null,
  description text,
  price_cents integer not null,
  status text not null default 'available',
  image_url text,
  sort_order integer not null default 100,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint food_products_price_check check (price_cents >= 0),
  constraint food_products_status_check check (status in ('available', 'unavailable', 'hidden')),
  constraint food_products_slug_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create unique index if not exists food_categories_company_slug_active_uidx
  on food.categories(company_id, slug)
  where deleted_at is null;

create index if not exists food_categories_company_sort_idx
  on food.categories(company_id, sort_order, name)
  where deleted_at is null;

create unique index if not exists food_products_company_slug_active_uidx
  on food.products(company_id, slug)
  where deleted_at is null;

create index if not exists food_products_company_category_sort_idx
  on food.products(company_id, category_id, sort_order, name)
  where deleted_at is null;

drop trigger if exists set_food_categories_updated_at on food.categories;
create trigger set_food_categories_updated_at
  before update on food.categories
  for each row
  execute function core.set_updated_at();

drop trigger if exists set_food_products_updated_at on food.products;
create trigger set_food_products_updated_at
  before update on food.products
  for each row
  execute function core.set_updated_at();

alter table food.categories enable row level security;
alter table food.products enable row level security;

drop policy if exists food_categories_select_company_members on food.categories;
create policy food_categories_select_company_members
  on food.categories
  for select
  to authenticated
  using (
    deleted_at is null
    and exists (
      select 1
      from core.company_memberships cm
      where cm.company_id = categories.company_id
        and cm.user_id = auth.uid()
        and cm.status = 'active'
        and cm.deleted_at is null
    )
  );

drop policy if exists food_categories_service_role_all on food.categories;
create policy food_categories_service_role_all
  on food.categories
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists food_products_select_company_members on food.products;
create policy food_products_select_company_members
  on food.products
  for select
  to authenticated
  using (
    deleted_at is null
    and exists (
      select 1
      from core.company_memberships cm
      where cm.company_id = products.company_id
        and cm.user_id = auth.uid()
        and cm.status = 'active'
        and cm.deleted_at is null
    )
  );

drop policy if exists food_products_service_role_all on food.products;
create policy food_products_service_role_all
  on food.products
  for all
  to service_role
  using (true)
  with check (true);

grant select, insert, update, delete on food.categories to authenticated, service_role;
grant select, insert, update, delete on food.products to authenticated, service_role;

insert into robots.event_catalog (
  code,
  source_application_key,
  name,
  description,
  version,
  status
)
values (
  'food.menu.updated',
  'food',
  'Cardapio Food atualizado',
  'Emitido quando categorias ou produtos do cardapio Food sao criados ou atualizados.',
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
