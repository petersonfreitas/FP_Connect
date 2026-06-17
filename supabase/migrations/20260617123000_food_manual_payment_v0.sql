alter table food.orders
  add column if not exists payment_status text not null default 'pending',
  add column if not exists payment_method text,
  add column if not exists payment_note text,
  add column if not exists paid_at timestamptz,
  add column if not exists paid_by uuid references auth.users(id);

alter table food.orders
  drop constraint if exists food_orders_payment_status_check;

alter table food.orders
  add constraint food_orders_payment_status_check check (
    payment_status in ('cancelled', 'paid', 'pending')
  );

alter table food.orders
  drop constraint if exists food_orders_payment_method_check;

alter table food.orders
  add constraint food_orders_payment_method_check check (
    payment_method is null
    or payment_method in ('card', 'cash', 'other', 'pix')
  );

alter table food.orders
  drop constraint if exists food_orders_payment_note_length_check;

alter table food.orders
  add constraint food_orders_payment_note_length_check check (
    payment_note is null
    or char_length(payment_note) <= 600
  );

create index if not exists food_orders_company_payment_status_idx
  on food.orders(company_id, payment_status, created_at desc)
  where deleted_at is null;

insert into robots.event_catalog (
  code,
  source_application_key,
  name,
  description,
  version,
  status
)
values (
  'food.payment.marked_as_paid',
  'food',
  'Pagamento manual confirmado',
  'Emitido quando pagamento manual e marcado como pago no FP Food.',
  1,
  'active'
)
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description,
  version = excluded.version,
  status = excluded.status,
  deleted_at = null,
  updated_at = now();
