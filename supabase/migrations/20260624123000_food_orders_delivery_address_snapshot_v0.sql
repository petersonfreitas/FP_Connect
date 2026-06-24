alter table food.orders
  add column if not exists customer_address_id uuid references food.customer_addresses(id) on delete set null,
  add column if not exists delivery_address_snapshot jsonb;

create index if not exists food_orders_customer_address_active_idx
  on food.orders(company_id, customer_address_id, created_at desc)
  where deleted_at is null and customer_address_id is not null;

create unique index if not exists food_customer_addresses_primary_active_uidx
  on food.customer_addresses(customer_id, store_id)
  where deleted_at is null and is_active = true and is_primary = true;
