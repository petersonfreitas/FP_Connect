alter table food.orders
  drop constraint if exists food_orders_fulfillment_method_check;

alter table food.orders
  add constraint food_orders_fulfillment_method_check check (
    fulfillment_method in ('delivery', 'dine_in', 'pickup')
  );
