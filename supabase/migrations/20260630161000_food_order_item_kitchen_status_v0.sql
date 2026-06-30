alter table food.order_items
  add column if not exists item_status text not null default 'pending';

alter table food.order_items
  drop constraint if exists food_order_items_item_status_check;

alter table food.order_items
  add constraint food_order_items_item_status_check check (
    item_status in ('cancelled', 'pending', 'preparing', 'ready')
  );

update food.order_items oi
set item_status = case
  when o.status = 'cancelled' then 'cancelled'
  when oi.kitchen_required = false then 'ready'
  when o.status in ('ready', 'out_for_delivery', 'delivered') then 'ready'
  when o.status = 'preparing' then 'preparing'
  else 'pending'
end
from food.orders o
where o.id = oi.order_id;

create index if not exists food_order_items_company_status_idx
  on food.order_items(company_id, item_status, order_id)
  where deleted_at is null;
