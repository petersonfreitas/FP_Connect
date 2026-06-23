create table if not exists food.customer_accounts (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active',
  email_confirmed_at timestamptz,
  phone_confirmed_at timestamptz,
  terms_accepted_at timestamptz,
  privacy_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint food_customer_accounts_status_check check (
    status in ('active', 'inactive', 'blocked')
  )
);

create table if not exists food.customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references core.companies(id) on delete cascade,
  account_id uuid references food.customer_accounts(id) on delete set null,
  full_name text,
  cpf_hash text,
  cpf_last4 text,
  preferred_contact_method text,
  origin text not null default 'online',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint food_customers_status_check check (
    status in ('active', 'inactive', 'blocked')
  ),
  constraint food_customers_origin_check check (
    origin in ('counter', 'online', 'phone')
  ),
  constraint food_customers_contact_method_check check (
    preferred_contact_method is null
    or preferred_contact_method in ('cellphone', 'email', 'landline', 'whatsapp')
  )
);

create table if not exists food.customer_store_access (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references core.companies(id) on delete cascade,
  store_id uuid not null references food.stores(id) on delete cascade,
  customer_id uuid not null references food.customers(id) on delete cascade,
  status text not null default 'active',
  registered_at timestamptz not null default now(),
  last_access_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint food_customer_store_access_status_check check (
    status in ('active', 'inactive', 'blocked')
  )
);

create table if not exists food.customer_phones (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references core.companies(id) on delete cascade,
  customer_id uuid not null references food.customers(id) on delete cascade,
  store_id uuid references food.stores(id) on delete cascade,
  phone_e164 text not null,
  type text not null default 'cellphone',
  is_primary boolean not null default false,
  is_preferred boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint food_customer_phones_type_check check (
    type in ('cellphone', 'landline', 'other', 'whatsapp')
  ),
  constraint food_customer_phones_e164_check check (
    phone_e164 ~ '^\+[1-9][0-9]{7,14}$'
  )
);

create table if not exists food.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references core.companies(id) on delete cascade,
  customer_id uuid not null references food.customers(id) on delete cascade,
  store_id uuid references food.stores(id) on delete cascade,
  label text,
  postal_code text,
  street text not null,
  number text not null,
  complement text,
  district text,
  city text not null,
  state text not null,
  reference text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  is_primary boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint food_customer_addresses_state_check check (char_length(state) = 2)
);

create unique index if not exists food_customer_accounts_auth_user_active_uidx
  on food.customer_accounts(auth_user_id)
  where deleted_at is null;

create unique index if not exists food_customers_company_account_active_uidx
  on food.customers(company_id, account_id)
  where account_id is not null and deleted_at is null;

create index if not exists food_customers_company_status_idx
  on food.customers(company_id, status)
  where deleted_at is null;

create unique index if not exists food_customer_store_access_active_uidx
  on food.customer_store_access(store_id, customer_id)
  where deleted_at is null;

create index if not exists food_customer_store_access_customer_idx
  on food.customer_store_access(customer_id, status)
  where deleted_at is null;

create index if not exists food_customer_phones_lookup_idx
  on food.customer_phones(company_id, phone_e164)
  where deleted_at is null;

create index if not exists food_customer_addresses_customer_idx
  on food.customer_addresses(customer_id, store_id)
  where deleted_at is null;

drop trigger if exists set_food_customer_accounts_updated_at on food.customer_accounts;
create trigger set_food_customer_accounts_updated_at
  before update on food.customer_accounts
  for each row
  execute function core.set_updated_at();

drop trigger if exists set_food_customers_updated_at on food.customers;
create trigger set_food_customers_updated_at
  before update on food.customers
  for each row
  execute function core.set_updated_at();

drop trigger if exists set_food_customer_store_access_updated_at on food.customer_store_access;
create trigger set_food_customer_store_access_updated_at
  before update on food.customer_store_access
  for each row
  execute function core.set_updated_at();

drop trigger if exists set_food_customer_phones_updated_at on food.customer_phones;
create trigger set_food_customer_phones_updated_at
  before update on food.customer_phones
  for each row
  execute function core.set_updated_at();

drop trigger if exists set_food_customer_addresses_updated_at on food.customer_addresses;
create trigger set_food_customer_addresses_updated_at
  before update on food.customer_addresses
  for each row
  execute function core.set_updated_at();

alter table food.customer_accounts enable row level security;
alter table food.customers enable row level security;
alter table food.customer_store_access enable row level security;
alter table food.customer_phones enable row level security;
alter table food.customer_addresses enable row level security;

drop policy if exists food_customer_accounts_self_select on food.customer_accounts;
create policy food_customer_accounts_self_select
  on food.customer_accounts
  for select
  to authenticated
  using (deleted_at is null and auth_user_id = auth.uid());

drop policy if exists food_customer_accounts_self_insert on food.customer_accounts;
create policy food_customer_accounts_self_insert
  on food.customer_accounts
  for insert
  to authenticated
  with check (auth_user_id = auth.uid());

drop policy if exists food_customer_accounts_self_update on food.customer_accounts;
create policy food_customer_accounts_self_update
  on food.customer_accounts
  for update
  to authenticated
  using (deleted_at is null and auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

drop policy if exists food_customer_accounts_service_role_all on food.customer_accounts;
create policy food_customer_accounts_service_role_all
  on food.customer_accounts
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists food_customers_self_select on food.customers;
create policy food_customers_self_select
  on food.customers
  for select
  to authenticated
  using (
    deleted_at is null
    and exists (
      select 1
      from food.customer_accounts ca
      where ca.id = customers.account_id
        and ca.auth_user_id = auth.uid()
        and ca.deleted_at is null
    )
  );

drop policy if exists food_customers_self_insert on food.customers;
create policy food_customers_self_insert
  on food.customers
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from food.customer_accounts ca
      where ca.id = customers.account_id
        and ca.auth_user_id = auth.uid()
        and ca.deleted_at is null
    )
  );

drop policy if exists food_customers_self_update on food.customers;
create policy food_customers_self_update
  on food.customers
  for update
  to authenticated
  using (
    deleted_at is null
    and exists (
      select 1
      from food.customer_accounts ca
      where ca.id = customers.account_id
        and ca.auth_user_id = auth.uid()
        and ca.deleted_at is null
    )
  )
  with check (
    exists (
      select 1
      from food.customer_accounts ca
      where ca.id = customers.account_id
        and ca.auth_user_id = auth.uid()
        and ca.deleted_at is null
    )
  );

drop policy if exists food_customers_service_role_all on food.customers;
create policy food_customers_service_role_all
  on food.customers
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists food_customer_store_access_self_select on food.customer_store_access;
create policy food_customer_store_access_self_select
  on food.customer_store_access
  for select
  to authenticated
  using (
    deleted_at is null
    and exists (
      select 1
      from food.customers c
      join food.customer_accounts ca on ca.id = c.account_id
      where c.id = customer_store_access.customer_id
        and ca.auth_user_id = auth.uid()
        and c.deleted_at is null
        and ca.deleted_at is null
    )
  );

drop policy if exists food_customer_store_access_self_insert on food.customer_store_access;
create policy food_customer_store_access_self_insert
  on food.customer_store_access
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from food.customers c
      join food.customer_accounts ca on ca.id = c.account_id
      where c.id = customer_store_access.customer_id
        and ca.auth_user_id = auth.uid()
        and c.deleted_at is null
        and ca.deleted_at is null
    )
  );

drop policy if exists food_customer_store_access_self_update on food.customer_store_access;
create policy food_customer_store_access_self_update
  on food.customer_store_access
  for update
  to authenticated
  using (
    deleted_at is null
    and exists (
      select 1
      from food.customers c
      join food.customer_accounts ca on ca.id = c.account_id
      where c.id = customer_store_access.customer_id
        and ca.auth_user_id = auth.uid()
        and c.deleted_at is null
        and ca.deleted_at is null
    )
  )
  with check (
    exists (
      select 1
      from food.customers c
      join food.customer_accounts ca on ca.id = c.account_id
      where c.id = customer_store_access.customer_id
        and ca.auth_user_id = auth.uid()
        and c.deleted_at is null
        and ca.deleted_at is null
    )
  );

drop policy if exists food_customer_store_access_service_role_all on food.customer_store_access;
create policy food_customer_store_access_service_role_all
  on food.customer_store_access
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists food_customer_phones_self_select on food.customer_phones;
create policy food_customer_phones_self_select
  on food.customer_phones
  for select
  to authenticated
  using (
    deleted_at is null
    and exists (
      select 1
      from food.customers c
      join food.customer_accounts ca on ca.id = c.account_id
      where c.id = customer_phones.customer_id
        and ca.auth_user_id = auth.uid()
        and c.deleted_at is null
        and ca.deleted_at is null
    )
  );

drop policy if exists food_customer_phones_service_role_all on food.customer_phones;
create policy food_customer_phones_service_role_all
  on food.customer_phones
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists food_customer_addresses_self_select on food.customer_addresses;
create policy food_customer_addresses_self_select
  on food.customer_addresses
  for select
  to authenticated
  using (
    deleted_at is null
    and exists (
      select 1
      from food.customers c
      join food.customer_accounts ca on ca.id = c.account_id
      where c.id = customer_addresses.customer_id
        and ca.auth_user_id = auth.uid()
        and c.deleted_at is null
        and ca.deleted_at is null
    )
  );

drop policy if exists food_customer_addresses_service_role_all on food.customer_addresses;
create policy food_customer_addresses_service_role_all
  on food.customer_addresses
  for all
  to service_role
  using (true)
  with check (true);

grant select, insert, update, delete on food.customer_accounts to authenticated, service_role;
grant select, insert, update, delete on food.customers to authenticated, service_role;
grant select, insert, update, delete on food.customer_store_access to authenticated, service_role;
grant select, insert, update, delete on food.customer_phones to authenticated, service_role;
grant select, insert, update, delete on food.customer_addresses to authenticated, service_role;

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
    'food.customer.registered',
    'food',
    'Cliente Food registrado',
    'Emitido quando uma conta de consumidor e vinculada ao cadastro comercial do FP Food.',
    1,
    'active'
  ),
  (
    'food.customer.store_access_created',
    'food',
    'Acesso do cliente a loja criado',
    'Emitido quando um consumidor recebe vinculo comercial explicito com uma loja Food.',
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
