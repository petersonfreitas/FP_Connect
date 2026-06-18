create schema if not exists gateway;

comment on schema gateway is
  'FP Gateway schema: external providers, credentials, OAuth, payments, webhooks, WhatsApp and Meta integrations.';

grant usage on schema gateway to authenticated, service_role;

insert into core.applications (key, name, description, entry_path, sort_order)
values
  (
    'gateway',
    'FP Gateway',
    'Integracoes externas, credenciais, OAuth, pagamentos, webhooks, WhatsApp e Meta.',
    '/gateway',
    45
  )
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description,
  entry_path = excluded.entry_path,
  sort_order = excluded.sort_order;

insert into core.permissions (application_id, key, name, description)
select
  a.id,
  'gateway.access',
  'Acessar FP Gateway',
  'Permite acessar o FP Gateway quando contratado.'
from core.applications a
where a.key = 'gateway'
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description;

insert into core.roles (application_id, key, name, description)
select
  a.id,
  'module-admin',
  'Administrador do FP Gateway',
  'Administra integracoes externas autorizadas da propria empresa.'
from core.applications a
where a.key = 'gateway'
on conflict (application_id, key) do update set
  name = excluded.name,
  description = excluded.description;

insert into core.role_permissions (role_id, permission_id)
select r.id, p.id
from core.roles r
join core.permissions p on p.application_id = r.application_id
join core.applications a on a.id = r.application_id
where a.key = 'gateway'
  and r.key = 'module-admin'
  and p.key = 'gateway.access'
on conflict do nothing;
