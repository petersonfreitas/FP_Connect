alter table food.stock_movements
  drop constraint if exists food_stock_movements_type_check;

alter table food.stock_movements
  add constraint food_stock_movements_type_check check (
    movement_type in ('adjustment', 'entry', 'sale')
  );

create or replace function food.apply_order_stock_deltas(
  target_company_id uuid,
  target_order_id uuid,
  target_actor_user_id uuid default null,
  deltas jsonb default '[]'::jsonb
)
returns setof food.stock_movements
language plpgsql
security definer
set search_path = food, core, public
as $$
declare
  delta_row jsonb;
  delta_quantity integer;
  movement_row food.stock_movements%rowtype;
  movement_type text;
  next_quantity integer;
  product_row food.products%rowtype;
begin
  if jsonb_typeof(deltas) <> 'array' then
    raise exception 'Deltas de estoque devem ser uma lista';
  end if;

  for delta_row in select * from jsonb_array_elements(deltas)
  loop
    delta_quantity := coalesce((delta_row ->> 'quantityDelta')::integer, 0);

    if delta_quantity = 0 then
      continue;
    end if;

    select *
      into product_row
      from food.products
     where id = (delta_row ->> 'productId')::uuid
       and company_id = target_company_id
       and deleted_at is null
     for update;

    if not found then
      raise exception 'Produto Food nao encontrado';
    end if;

    if product_row.stock_control_enabled is not true then
      continue;
    end if;

    next_quantity := product_row.stock_quantity + delta_quantity;

    if next_quantity < 0 then
      raise exception 'Estoque insuficiente para %. Disponivel: %',
        product_row.name,
        product_row.stock_quantity;
    end if;

    movement_type := case
      when delta_quantity < 0 then 'sale'
      else 'adjustment'
    end;

    update food.products
       set stock_quantity = next_quantity,
           updated_by = target_actor_user_id
     where id = product_row.id;

    insert into food.stock_movements (
      company_id,
      created_by,
      movement_type,
      new_quantity,
      notes,
      previous_quantity,
      product_id,
      quantity,
      store_id
    )
    values (
      target_company_id,
      target_actor_user_id,
      movement_type,
      next_quantity,
      nullif(trim(coalesce(delta_row ->> 'notes', '')), ''),
      product_row.stock_quantity,
      product_row.id,
      abs(delta_quantity),
      product_row.store_id
    )
    returning * into movement_row;

    return next movement_row;
  end loop;

  return;
end;
$$;

revoke execute on function food.apply_order_stock_deltas(
  uuid,
  uuid,
  uuid,
  jsonb
) from public, anon, authenticated;

grant execute on function food.apply_order_stock_deltas(
  uuid,
  uuid,
  uuid,
  jsonb
) to service_role;
