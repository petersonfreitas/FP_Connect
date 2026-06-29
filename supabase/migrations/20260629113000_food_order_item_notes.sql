alter table food.order_items
  add column if not exists item_note text;
