alter table food.products
  add column if not exists kitchen_required boolean not null default true;

alter table food.order_items
  add column if not exists kitchen_required boolean not null default true;
