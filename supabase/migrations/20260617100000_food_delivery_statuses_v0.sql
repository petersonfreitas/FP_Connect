alter table food.orders
  drop constraint if exists food_orders_status_check;

alter table food.orders
  add constraint food_orders_status_check check (
    status in (
      'accepted',
      'cancelled',
      'created',
      'delivered',
      'out_for_delivery',
      'preparing',
      'ready'
    )
  );
