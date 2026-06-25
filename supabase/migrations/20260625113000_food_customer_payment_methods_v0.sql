create table if not exists food.customer_payment_methods (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references core.companies(id) on delete cascade,
  store_id uuid references food.stores(id) on delete cascade,
  customer_account_id uuid references food.customer_accounts(id) on delete set null,
  customer_id uuid not null references food.customers(id) on delete cascade,
  customer_store_access_id uuid references food.customer_store_access(id) on delete set null,
  provider_key text not null default 'mercado_pago',
  provider_customer_id text,
  provider_card_id text,
  provider_payment_request_id uuid references gateway.payment_requests(id) on delete set null,
  payment_method_id text,
  payment_method_type text not null,
  card_brand text,
  card_last4 text,
  is_default boolean not null default false,
  status text not null default 'pending_tokenization',
  consented_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint food_customer_payment_methods_provider_check check (
    provider_key in ('mercado_pago')
  ),
  constraint food_customer_payment_methods_type_check check (
    payment_method_type in ('credit_card', 'debit_card')
  ),
  constraint food_customer_payment_methods_status_check check (
    status in ('active', 'inactive', 'pending_tokenization')
  ),
  constraint food_customer_payment_methods_last4_check check (
    card_last4 is null or card_last4 ~ '^[0-9]{4}$'
  )
);

create index if not exists food_customer_payment_methods_customer_idx
  on food.customer_payment_methods(customer_id, store_id, status)
  where deleted_at is null;

create index if not exists food_customer_payment_methods_company_provider_idx
  on food.customer_payment_methods(company_id, provider_key, provider_card_id)
  where deleted_at is null and provider_card_id is not null;

create unique index if not exists food_customer_payment_methods_default_uidx
  on food.customer_payment_methods(customer_id, store_id)
  where deleted_at is null and is_default;

drop trigger if exists set_food_customer_payment_methods_updated_at
  on food.customer_payment_methods;
create trigger set_food_customer_payment_methods_updated_at
  before update on food.customer_payment_methods
  for each row
  execute function core.set_updated_at();

alter table food.customer_payment_methods enable row level security;

drop policy if exists food_customer_payment_methods_self_select
  on food.customer_payment_methods;
create policy food_customer_payment_methods_self_select
  on food.customer_payment_methods
  for select
  to authenticated
  using (
    deleted_at is null
    and exists (
      select 1
      from food.customers c
      join food.customer_accounts ca on ca.id = c.account_id
      where c.id = customer_payment_methods.customer_id
        and ca.auth_user_id = (select auth.uid())
        and c.deleted_at is null
        and ca.deleted_at is null
    )
  );

drop policy if exists food_customer_payment_methods_service_role_all
  on food.customer_payment_methods;
create policy food_customer_payment_methods_service_role_all
  on food.customer_payment_methods
  for all
  to service_role
  using (true)
  with check (true);

grant select on food.customer_payment_methods to authenticated, service_role;
grant insert, update, delete on food.customer_payment_methods to service_role;
