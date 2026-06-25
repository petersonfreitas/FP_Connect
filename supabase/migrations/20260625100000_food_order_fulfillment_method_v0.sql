alter table food.orders
  add column if not exists fulfillment_method text not null default 'delivery';

alter table food.orders
  drop constraint if exists food_orders_fulfillment_method_check;

alter table food.orders
  add constraint food_orders_fulfillment_method_check check (
    fulfillment_method in ('delivery', 'pickup')
  );

create index if not exists food_orders_company_fulfillment_active_idx
  on food.orders(company_id, fulfillment_method, created_at desc)
  where deleted_at is null;
