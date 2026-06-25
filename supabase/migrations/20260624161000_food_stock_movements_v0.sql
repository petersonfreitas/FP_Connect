create table if not exists food.stock_movements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references core.companies(id) on delete cascade,
  store_id uuid references food.stores(id) on delete set null,
  product_id uuid not null references food.products(id) on delete restrict,
  movement_type text not null default 'entry',
  quantity integer not null,
  previous_quantity integer not null,
  new_quantity integer not null,
  invoice_number text,
  batch_code text,
  expires_at date,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint food_stock_movements_type_check check (movement_type in ('entry')),
  constraint food_stock_movements_quantity_check check (quantity > 0),
  constraint food_stock_movements_previous_quantity_check check (previous_quantity >= 0),
  constraint food_stock_movements_new_quantity_check check (new_quantity >= 0)
);

create index if not exists food_stock_movements_company_created_idx
  on food.stock_movements(company_id, created_at desc)
  where deleted_at is null;

create index if not exists food_stock_movements_product_created_idx
  on food.stock_movements(product_id, created_at desc)
  where deleted_at is null;

alter table food.stock_movements enable row level security;

drop policy if exists food_stock_movements_select_company_members on food.stock_movements;
create policy food_stock_movements_select_company_members
  on food.stock_movements
  for select
  to authenticated
  using (
    deleted_at is null
    and exists (
      select 1
      from core.company_memberships cm
      where cm.company_id = stock_movements.company_id
        and cm.user_id = (select auth.uid())
        and cm.status = 'active'
        and cm.deleted_at is null
    )
  );

drop policy if exists food_stock_movements_service_role_all on food.stock_movements;
create policy food_stock_movements_service_role_all
  on food.stock_movements
  for all
  to service_role
  using (true)
  with check (true);

create or replace function food.register_stock_entry(
  target_company_id uuid,
  target_product_id uuid,
  movement_quantity integer,
  target_actor_user_id uuid default null,
  invoice_number text default null,
  batch_code text default null,
  expires_at date default null,
  notes text default null
)
returns food.stock_movements
language plpgsql
security definer
set search_path = food, core, public
as $$
declare
  product_row food.products%rowtype;
  movement_row food.stock_movements%rowtype;
  next_quantity integer;
begin
  if movement_quantity is null or movement_quantity <= 0 then
    raise exception 'Quantidade de entrada deve ser maior que zero';
  end if;

  select *
    into product_row
    from food.products
   where id = target_product_id
     and company_id = target_company_id
     and deleted_at is null
   for update;

  if not found then
    raise exception 'Produto Food nao encontrado';
  end if;

  if product_row.stock_control_enabled is not true then
    raise exception 'Produto nao controla estoque';
  end if;

  next_quantity := product_row.stock_quantity + movement_quantity;

  update food.products
     set stock_quantity = next_quantity,
         updated_by = target_actor_user_id
   where id = product_row.id;

  insert into food.stock_movements (
    batch_code,
    company_id,
    created_by,
    expires_at,
    invoice_number,
    movement_type,
    new_quantity,
    notes,
    previous_quantity,
    product_id,
    quantity,
    store_id
  )
  values (
    nullif(trim(batch_code), ''),
    target_company_id,
    target_actor_user_id,
    expires_at,
    nullif(trim(invoice_number), ''),
    'entry',
    next_quantity,
    nullif(trim(notes), ''),
    product_row.stock_quantity,
    product_row.id,
    movement_quantity,
    product_row.store_id
  )
  returning * into movement_row;

  return movement_row;
end;
$$;

grant select on food.stock_movements to authenticated;
grant select, insert, update, delete on food.stock_movements to service_role;
grant execute on function food.register_stock_entry(
  uuid,
  uuid,
  integer,
  uuid,
  text,
  text,
  date,
  text
) to service_role;
