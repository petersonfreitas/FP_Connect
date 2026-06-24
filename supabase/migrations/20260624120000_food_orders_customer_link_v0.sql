alter table food.orders
  add column if not exists customer_account_id uuid references food.customer_accounts(id) on delete set null,
  add column if not exists customer_id uuid references food.customers(id) on delete set null,
  add column if not exists customer_store_access_id uuid references food.customer_store_access(id) on delete set null;

create index if not exists food_orders_customer_active_idx
  on food.orders(company_id, customer_id, created_at desc)
  where deleted_at is null and customer_id is not null;

create index if not exists food_orders_customer_store_access_active_idx
  on food.orders(company_id, customer_store_access_id, created_at desc)
  where deleted_at is null and customer_store_access_id is not null;
