alter table food.products
  add column if not exists stock_control_enabled boolean not null default false,
  add column if not exists stock_quantity integer not null default 0,
  add column if not exists stock_min_quantity integer not null default 0;

alter table food.products
  drop constraint if exists food_products_stock_quantity_check,
  drop constraint if exists food_products_stock_min_quantity_check;

alter table food.products
  add constraint food_products_stock_quantity_check check (stock_quantity >= 0),
  add constraint food_products_stock_min_quantity_check check (stock_min_quantity >= 0);

create index if not exists food_products_stock_control_active_idx
  on food.products(company_id, stock_control_enabled, stock_quantity, stock_min_quantity)
  where deleted_at is null and status = 'available';
