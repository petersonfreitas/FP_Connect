-- FP Robots V0: event catalog, event log and execution placeholder.

create table if not exists robots.event_catalog (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  source_application_key text not null,
  name text not null,
  description text,
  version integer not null default 1,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id),
  delete_reason text,
  constraint robots_event_catalog_status_check check (status in ('active', 'inactive'))
);

create trigger set_robots_event_catalog_updated_at
before update on robots.event_catalog
for each row execute function core.set_updated_at();

create table if not exists robots.events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references core.companies(id),
  catalog_event_id uuid not null references robots.event_catalog(id),
  event_code text not null,
  source_application_key text not null,
  source_event_id text,
  idempotency_key text,
  status text not null default 'received',
  payload jsonb not null default '{}'::jsonb,
  payload_masked jsonb not null default '{}'::jsonb,
  origin_metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  accepted_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id),
  delete_reason text,
  constraint robots_events_status_check check (
    status in ('received', 'ignored_duplicate', 'failed')
  )
);

create index if not exists robots_events_company_created_at_idx
  on robots.events(company_id, created_at desc)
  where deleted_at is null;
create index if not exists robots_events_code_created_at_idx
  on robots.events(event_code, created_at desc)
  where deleted_at is null;
create unique index if not exists robots_events_idempotency_active_idx
  on robots.events(company_id, source_application_key, idempotency_key)
  where idempotency_key is not null and deleted_at is null;

create trigger set_robots_events_updated_at
before update on robots.events
for each row execute function core.set_updated_at();

create table if not exists robots.event_executions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references robots.events(id),
  company_id uuid not null references core.companies(id),
  action_type text not null,
  status text not null default 'pending',
  attempt_count integer not null default 0,
  max_attempts integer not null default 3,
  next_attempt_at timestamptz,
  last_error text,
  request_payload jsonb not null default '{}'::jsonb,
  response_payload jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id),
  delete_reason text,
  constraint robots_event_executions_status_check check (
    status in ('pending', 'running', 'succeeded', 'failed', 'cancelled')
  ),
  constraint robots_event_executions_action_type_check check (
    action_type in ('internal_log', 'internal_api', 'email', 'webhook', 'gateway_external_action')
  )
);

create index if not exists robots_event_executions_event_id_idx
  on robots.event_executions(event_id)
  where deleted_at is null;
create index if not exists robots_event_executions_company_status_idx
  on robots.event_executions(company_id, status, created_at desc)
  where deleted_at is null;

create trigger set_robots_event_executions_updated_at
before update on robots.event_executions
for each row execute function core.set_updated_at();

alter table robots.event_catalog enable row level security;
alter table robots.events enable row level security;
alter table robots.event_executions enable row level security;

drop policy if exists "robots_event_catalog_select_authenticated" on robots.event_catalog;
create policy "robots_event_catalog_select_authenticated"
on robots.event_catalog for select
to authenticated
using (deleted_at is null);

drop policy if exists "robots_events_select_company_members" on robots.events;
create policy "robots_events_select_company_members"
on robots.events for select
to authenticated
using (
  deleted_at is null
  and exists (
    select 1
    from core.company_memberships cm
    where cm.company_id = robots.events.company_id
      and cm.user_id = auth.uid()
      and cm.status = 'active'
      and cm.deleted_at is null
  )
);

drop policy if exists "robots_event_executions_select_company_members" on robots.event_executions;
create policy "robots_event_executions_select_company_members"
on robots.event_executions for select
to authenticated
using (
  deleted_at is null
  and exists (
    select 1
    from core.company_memberships cm
    where cm.company_id = robots.event_executions.company_id
      and cm.user_id = auth.uid()
      and cm.status = 'active'
      and cm.deleted_at is null
  )
);

grant usage on schema robots to authenticated, service_role;
grant select, insert, update, delete on all tables in schema robots to authenticated, service_role;

insert into core.permissions (application_id, key, name, description)
select a.id, 'robots.events.write', 'Registrar eventos', 'Permite registrar eventos internos no FP Robots.'
from core.applications a
where a.key = 'robots'
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description;

insert into core.role_permissions (role_id, permission_id)
select r.id, p.id
from core.roles r
join core.applications a on a.id = r.application_id
join core.permissions p on p.application_id = a.id
where a.key = 'robots'
  and r.key = 'module-admin'
  and p.key in ('robots.events.read', 'robots.events.write', 'robots.failures.reprocess')
on conflict do nothing;

insert into robots.event_catalog (code, source_application_key, name, description, version, status)
values
  ('food.store.configured', 'food', 'Loja configurada', 'Emitido quando a configuracao basica da loja Food e concluida.', 1, 'active'),
  ('food.order.created', 'food', 'Pedido criado', 'Emitido quando um pedido Food e criado.', 1, 'active'),
  ('food.order.confirmed', 'food', 'Pedido confirmado', 'Emitido quando a loja confirma um pedido Food.', 1, 'active'),
  ('food.order.rejected', 'food', 'Pedido recusado', 'Emitido quando a loja recusa um pedido Food.', 1, 'active'),
  ('food.order.cancelled', 'food', 'Pedido cancelado', 'Emitido quando um pedido Food e cancelado.', 1, 'active'),
  ('food.order.in_preparation', 'food', 'Pedido em preparo', 'Emitido quando a cozinha inicia o preparo.', 1, 'active'),
  ('food.order.ready', 'food', 'Pedido pronto', 'Emitido quando o pedido fica pronto para retirada ou entrega.', 1, 'active'),
  ('food.order.out_for_delivery', 'food', 'Pedido em entrega', 'Emitido quando o pedido sai para entrega.', 1, 'active'),
  ('food.order.delivered', 'food', 'Pedido entregue', 'Emitido quando a entrega do pedido e concluida.', 1, 'active'),
  ('food.payment.marked_as_paid', 'food', 'Pagamento manual confirmado', 'Emitido quando pagamento manual e marcado como pago.', 1, 'active'),
  ('food.delivery.sent_to_tracking', 'food', 'Entrega enviada ao Tracking', 'Emitido quando Food solicita rastreamento ao Tracking.', 1, 'active'),
  ('food.delivery.tracking_link_received', 'food', 'Link de rastreio recebido', 'Emitido quando Tracking retorna link de rastreio ao Food.', 1, 'active'),
  ('tracking.delivery.created', 'tracking', 'Entrega criada', 'Emitido quando o Tracking cria uma entrega.', 1, 'active'),
  ('tracking.delivery.completed', 'tracking', 'Entrega concluida', 'Emitido quando o Tracking conclui uma entrega.', 1, 'active'),
  ('gateway.provider.connected', 'gateway', 'Provedor conectado', 'Emitido quando uma empresa conecta um provedor externo no Gateway.', 1, 'active'),
  ('gateway.payment.approved', 'gateway', 'Pagamento aprovado', 'Emitido quando Gateway normaliza pagamento aprovado.', 1, 'active'),
  ('gateway.payment.rejected', 'gateway', 'Pagamento rejeitado', 'Emitido quando Gateway normaliza pagamento rejeitado.', 1, 'active'),
  ('gateway.whatsapp.message.sent', 'gateway', 'WhatsApp enviado', 'Emitido quando Gateway confirma envio de WhatsApp.', 1, 'active'),
  ('gateway.whatsapp.message.failed', 'gateway', 'WhatsApp falhou', 'Emitido quando Gateway registra falha de WhatsApp.', 1, 'active')
on conflict (code) do update set
  source_application_key = excluded.source_application_key,
  name = excluded.name,
  description = excluded.description,
  version = excluded.version,
  status = excluded.status;
