create table if not exists gateway.payment_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references core.companies(id) on delete cascade,
  provider_id uuid not null references gateway.provider_catalog(id),
  source_application_key text not null,
  source_reference_type text not null,
  source_reference_id text not null,
  idempotency_key text,
  amount_cents integer not null,
  currency text not null default 'BRL',
  description text not null,
  customer_name text,
  customer_email text,
  customer_phone text,
  status text not null default 'requested',
  payment_url text,
  provider_reference text,
  request_payload jsonb not null default '{}'::jsonb,
  response_payload jsonb not null default '{}'::jsonb,
  error_message text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint gateway_payment_requests_amount_check check (amount_cents > 0),
  constraint gateway_payment_requests_currency_check check (currency ~ '^[A-Z]{3}$'),
  constraint gateway_payment_requests_status_check check (
    status in (
      'requested',
      'requires_provider_config',
      'failed',
      'paid',
      'cancelled',
      'expired'
    )
  )
);

create index if not exists gateway_payment_requests_company_created_idx
  on gateway.payment_requests(company_id, created_at desc)
  where deleted_at is null;

create index if not exists gateway_payment_requests_company_status_idx
  on gateway.payment_requests(company_id, status)
  where deleted_at is null;

create unique index if not exists gateway_payment_requests_company_idempotency_uidx
  on gateway.payment_requests(company_id, idempotency_key)
  where idempotency_key is not null and deleted_at is null;

drop trigger if exists set_gateway_payment_requests_updated_at
  on gateway.payment_requests;
create trigger set_gateway_payment_requests_updated_at
  before update on gateway.payment_requests
  for each row
  execute function core.set_updated_at();

alter table gateway.payment_requests enable row level security;

drop policy if exists gateway_payment_requests_select_company_members
  on gateway.payment_requests;
create policy gateway_payment_requests_select_company_members
  on gateway.payment_requests
  for select
  to authenticated
  using (
    deleted_at is null
    and exists (
      select 1
      from core.company_memberships cm
      where cm.company_id = payment_requests.company_id
        and cm.user_id = auth.uid()
        and cm.status = 'active'
        and cm.deleted_at is null
    )
  );

drop policy if exists gateway_payment_requests_service_role_all
  on gateway.payment_requests;
create policy gateway_payment_requests_service_role_all
  on gateway.payment_requests
  for all
  to service_role
  using (true)
  with check (true);

grant select on gateway.payment_requests to authenticated, service_role;
grant insert, update, delete on gateway.payment_requests to service_role;

insert into robots.event_catalog (
  code,
  source_application_key,
  name,
  description,
  version,
  status
)
values
  (
    'gateway.payment.requested',
    'gateway',
    'Pagamento solicitado',
    'Emitido quando um modulo consumidor solicita um pagamento ao FP Gateway.',
    1,
    'active'
  ),
  (
    'gateway.payment.requires_provider_config',
    'gateway',
    'Pagamento aguardando configuracao de provedor',
    'Emitido quando uma solicitacao de pagamento e registrada sem provedor ativo configurado.',
    1,
    'active'
  ),
  (
    'gateway.payment.failed',
    'gateway',
    'Pagamento falhou',
    'Emitido quando uma solicitacao de pagamento falha no FP Gateway ou no provedor externo.',
    1,
    'active'
  ),
  (
    'gateway.payment.paid',
    'gateway',
    'Pagamento aprovado',
    'Emitido quando um pagamento e confirmado pelo FP Gateway.',
    1,
    'active'
  )
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  version = excluded.version,
  status = excluded.status,
  deleted_at = null,
  updated_at = now();
