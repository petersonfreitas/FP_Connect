create table if not exists food.order_status_history (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references core.companies(id) on delete cascade,
  order_id uuid not null references food.orders(id) on delete cascade,
  previous_status text,
  status text not null,
  actor_user_id uuid references auth.users(id),
  changed_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint food_order_status_history_previous_status_check check (
    previous_status is null
    or previous_status in (
      'accepted',
      'cancelled',
      'created',
      'delivered',
      'out_for_delivery',
      'preparing',
      'ready'
    )
  ),
  constraint food_order_status_history_status_check check (
    status in (
      'accepted',
      'cancelled',
      'created',
      'delivered',
      'out_for_delivery',
      'preparing',
      'ready'
    )
  )
);

create index if not exists food_order_status_history_order_changed_idx
  on food.order_status_history(order_id, changed_at);

create index if not exists food_order_status_history_company_changed_idx
  on food.order_status_history(company_id, changed_at desc);

alter table food.order_status_history enable row level security;

drop policy if exists food_order_status_history_select_company_members on food.order_status_history;
create policy food_order_status_history_select_company_members
  on food.order_status_history
  for select
  to authenticated
  using (
    exists (
      select 1
      from core.company_memberships cm
      where cm.company_id = order_status_history.company_id
        and cm.user_id = auth.uid()
        and cm.status = 'active'
        and cm.deleted_at is null
    )
  );

drop policy if exists food_order_status_history_service_role_all on food.order_status_history;
create policy food_order_status_history_service_role_all
  on food.order_status_history
  for all
  to service_role
  using (true)
  with check (true);

grant select, insert, update, delete on food.order_status_history to authenticated, service_role;

insert into food.order_status_history (
  actor_user_id,
  changed_at,
  company_id,
  metadata,
  order_id,
  previous_status,
  status
)
select
  o.updated_by,
  o.updated_at,
  o.company_id,
  jsonb_build_object('source', 'migration-backfill'),
  o.id,
  null,
  o.status
from food.orders o
where o.deleted_at is null
  and not exists (
    select 1
    from food.order_status_history h
    where h.order_id = o.id
  );
