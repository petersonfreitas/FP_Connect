-- FP Connect core foundation.
-- Shared tenant, module access, permissions and audit base.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create type core.company_status as enum (
  'implementation',
  'active',
  'suspended',
  'cancelled'
);

create type core.application_status as enum (
  'active',
  'inactive',
  'hidden'
);

create type core.company_application_status as enum (
  'implementation',
  'active',
  'suspended',
  'cancelled'
);

create type core.user_status as enum (
  'invited',
  'active',
  'inactive'
);

create type core.global_role as enum (
  'super_admin',
  'fp_admin',
  'support',
  'company_user'
);

create type core.plan_status as enum (
  'active',
  'inactive'
);

create function core.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table core.basic_plans (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  status core.plan_status not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id),
  delete_reason text
);

create trigger set_basic_plans_updated_at
before update on core.basic_plans
for each row execute function core.set_updated_at();

create table core.companies (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  trade_name text,
  document text,
  primary_email text,
  primary_phone text,
  primary_responsible_name text not null,
  primary_responsible_email text,
  status core.company_status not null default 'implementation',
  basic_plan_id uuid references core.basic_plans(id),
  implementation_notes text,
  internal_notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id),
  delete_reason text
);

create index companies_status_idx on core.companies(status) where deleted_at is null;
create index companies_basic_plan_id_idx on core.companies(basic_plan_id) where deleted_at is null;
create unique index companies_document_active_idx
  on core.companies(document)
  where document is not null and deleted_at is null;

create trigger set_companies_updated_at
before update on core.companies
for each row execute function core.set_updated_at();

create table core.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text,
  status core.user_status not null default 'invited',
  global_role core.global_role not null default 'company_user',
  is_internal_user boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id),
  delete_reason text
);

create index profiles_status_idx on core.profiles(status) where deleted_at is null;
create index profiles_global_role_idx on core.profiles(global_role) where deleted_at is null;

create trigger set_profiles_updated_at
before update on core.profiles
for each row execute function core.set_updated_at();

create table core.company_memberships (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references core.companies(id),
  user_id uuid not null references auth.users(id) on delete cascade,
  status core.user_status not null default 'invited',
  is_primary_contact boolean not null default false,
  invited_by uuid references auth.users(id),
  invited_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id),
  delete_reason text
);

create index company_memberships_company_id_idx
  on core.company_memberships(company_id)
  where deleted_at is null;
create index company_memberships_user_id_idx
  on core.company_memberships(user_id)
  where deleted_at is null;
create unique index company_memberships_company_user_active_idx
  on core.company_memberships(company_id, user_id)
  where deleted_at is null;

create trigger set_company_memberships_updated_at
before update on core.company_memberships
for each row execute function core.set_updated_at();

create table core.applications (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  entry_path text,
  status core.application_status not null default 'active',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id),
  delete_reason text
);

create index applications_status_idx on core.applications(status) where deleted_at is null;

create trigger set_applications_updated_at
before update on core.applications
for each row execute function core.set_updated_at();

create table core.company_applications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references core.companies(id),
  application_id uuid not null references core.applications(id),
  status core.company_application_status not null default 'implementation',
  implementation_notes text,
  activated_at timestamptz,
  suspended_at timestamptz,
  cancelled_at timestamptz,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id),
  delete_reason text
);

create index company_applications_company_id_idx
  on core.company_applications(company_id)
  where deleted_at is null;
create index company_applications_application_id_idx
  on core.company_applications(application_id)
  where deleted_at is null;
create index company_applications_status_idx
  on core.company_applications(status)
  where deleted_at is null;
create unique index company_applications_company_application_active_idx
  on core.company_applications(company_id, application_id)
  where deleted_at is null;

create trigger set_company_applications_updated_at
before update on core.company_applications
for each row execute function core.set_updated_at();

create table core.permissions (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references core.applications(id),
  key text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id),
  delete_reason text
);

create index permissions_application_id_idx
  on core.permissions(application_id)
  where deleted_at is null;

create trigger set_permissions_updated_at
before update on core.permissions
for each row execute function core.set_updated_at();

create table core.roles (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references core.applications(id),
  key text not null,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id),
  delete_reason text,
  constraint roles_application_key_unique unique (application_id, key)
);

create index roles_application_id_idx on core.roles(application_id) where deleted_at is null;

create trigger set_roles_updated_at
before update on core.roles
for each row execute function core.set_updated_at();

create table core.role_permissions (
  role_id uuid not null references core.roles(id) on delete cascade,
  permission_id uuid not null references core.permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_id, permission_id)
);

create table core.user_application_roles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references core.companies(id),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid not null references core.applications(id),
  role_id uuid not null references core.roles(id),
  granted_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id),
  delete_reason text
);

create index user_application_roles_company_id_idx
  on core.user_application_roles(company_id)
  where deleted_at is null;
create index user_application_roles_user_id_idx
  on core.user_application_roles(user_id)
  where deleted_at is null;
create index user_application_roles_application_id_idx
  on core.user_application_roles(application_id)
  where deleted_at is null;
create unique index user_application_roles_unique_active_idx
  on core.user_application_roles(company_id, user_id, application_id, role_id)
  where deleted_at is null;

create trigger set_user_application_roles_updated_at
before update on core.user_application_roles
for each row execute function core.set_updated_at();

create table core.basic_plan_applications (
  basic_plan_id uuid not null references core.basic_plans(id) on delete cascade,
  application_id uuid not null references core.applications(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (basic_plan_id, application_id)
);

create table core.audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references core.companies(id),
  actor_user_id uuid references auth.users(id),
  action text not null,
  entity_schema text not null default 'core',
  entity_table text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_company_id_idx on core.audit_logs(company_id);
create index audit_logs_actor_user_id_idx on core.audit_logs(actor_user_id);
create index audit_logs_action_idx on core.audit_logs(action);
create index audit_logs_created_at_idx on core.audit_logs(created_at);

create function core.current_user_id()
returns uuid
language sql
stable
as $$
  select auth.uid();
$$;

create function core.is_super_admin(target_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = core, public
as $$
  select exists (
    select 1
    from core.profiles p
    where p.id = target_user_id
      and p.global_role = 'super_admin'
      and p.status = 'active'
      and p.deleted_at is null
  );
$$;

create function core.user_has_company_access(
  target_company_id uuid,
  target_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = core, public
as $$
  select core.is_super_admin(target_user_id)
    or exists (
      select 1
      from core.company_memberships cm
      join core.companies c on c.id = cm.company_id
      where cm.company_id = target_company_id
        and cm.user_id = target_user_id
        and cm.status = 'active'
        and cm.deleted_at is null
        and c.status = 'active'
        and c.deleted_at is null
    );
$$;

create function core.company_has_module(
  target_company_id uuid,
  target_application_key text
)
returns boolean
language sql
stable
security definer
set search_path = core, public
as $$
  select exists (
    select 1
    from core.company_applications ca
    join core.applications a on a.id = ca.application_id
    join core.companies c on c.id = ca.company_id
    where ca.company_id = target_company_id
      and a.key = target_application_key
      and a.status = 'active'
      and ca.status = 'active'
      and c.status = 'active'
      and a.deleted_at is null
      and ca.deleted_at is null
      and c.deleted_at is null
  );
$$;

create function core.user_has_permission(
  target_company_id uuid,
  target_application_key text,
  target_permission_key text,
  target_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = core, public
as $$
  select core.is_super_admin(target_user_id)
    or exists (
      select 1
      from core.user_application_roles uar
      join core.roles r on r.id = uar.role_id
      join core.role_permissions rp on rp.role_id = r.id
      join core.permissions p on p.id = rp.permission_id
      join core.applications a on a.id = uar.application_id
      where uar.company_id = target_company_id
        and uar.user_id = target_user_id
        and a.key = target_application_key
        and p.key = target_permission_key
        and r.application_id = uar.application_id
        and p.application_id = a.id
        and uar.deleted_at is null
        and r.deleted_at is null
        and p.deleted_at is null
        and a.deleted_at is null
        and core.user_has_company_access(target_company_id, target_user_id)
        and core.company_has_module(target_company_id, target_application_key)
    );
$$;

alter table core.basic_plans enable row level security;
alter table core.companies enable row level security;
alter table core.profiles enable row level security;
alter table core.company_memberships enable row level security;
alter table core.applications enable row level security;
alter table core.company_applications enable row level security;
alter table core.permissions enable row level security;
alter table core.roles enable row level security;
alter table core.role_permissions enable row level security;
alter table core.user_application_roles enable row level security;
alter table core.basic_plan_applications enable row level security;
alter table core.audit_logs enable row level security;

create policy "profiles_select_self_or_super_admin"
on core.profiles for select
to authenticated
using (id = auth.uid() or core.is_super_admin());

create policy "super_admin_all_profiles"
on core.profiles for all
to authenticated
using (core.is_super_admin())
with check (core.is_super_admin());

create policy "catalog_select_authenticated_basic_plans"
on core.basic_plans for select
to authenticated
using (deleted_at is null);

create policy "catalog_select_authenticated_applications"
on core.applications for select
to authenticated
using (deleted_at is null and status <> 'hidden');

create policy "catalog_select_authenticated_permissions"
on core.permissions for select
to authenticated
using (deleted_at is null);

create policy "catalog_select_authenticated_roles"
on core.roles for select
to authenticated
using (deleted_at is null);

create policy "catalog_select_authenticated_role_permissions"
on core.role_permissions for select
to authenticated
using (true);

create policy "super_admin_all_role_permissions"
on core.role_permissions for all
to authenticated
using (core.is_super_admin())
with check (core.is_super_admin());

create policy "catalog_select_authenticated_basic_plan_applications"
on core.basic_plan_applications for select
to authenticated
using (true);

create policy "super_admin_all_basic_plan_applications"
on core.basic_plan_applications for all
to authenticated
using (core.is_super_admin())
with check (core.is_super_admin());

create policy "super_admin_all_basic_plans"
on core.basic_plans for all
to authenticated
using (core.is_super_admin())
with check (core.is_super_admin());

create policy "super_admin_all_applications"
on core.applications for all
to authenticated
using (core.is_super_admin())
with check (core.is_super_admin());

create policy "super_admin_all_permissions"
on core.permissions for all
to authenticated
using (core.is_super_admin())
with check (core.is_super_admin());

create policy "super_admin_all_roles"
on core.roles for all
to authenticated
using (core.is_super_admin())
with check (core.is_super_admin());

create policy "super_admin_all_companies"
on core.companies for all
to authenticated
using (core.is_super_admin())
with check (core.is_super_admin());

create policy "company_members_select_companies"
on core.companies for select
to authenticated
using (core.user_has_company_access(id));

create policy "super_admin_all_company_memberships"
on core.company_memberships for all
to authenticated
using (core.is_super_admin())
with check (core.is_super_admin());

create policy "users_select_own_memberships"
on core.company_memberships for select
to authenticated
using (user_id = auth.uid());

create policy "super_admin_all_company_applications"
on core.company_applications for all
to authenticated
using (core.is_super_admin())
with check (core.is_super_admin());

create policy "company_members_select_company_applications"
on core.company_applications for select
to authenticated
using (core.user_has_company_access(company_id));

create policy "super_admin_all_user_application_roles"
on core.user_application_roles for all
to authenticated
using (core.is_super_admin())
with check (core.is_super_admin());

create policy "users_select_own_application_roles"
on core.user_application_roles for select
to authenticated
using (user_id = auth.uid());

create policy "super_admin_all_audit_logs"
on core.audit_logs for all
to authenticated
using (core.is_super_admin())
with check (core.is_super_admin());

create policy "company_members_select_audit_logs"
on core.audit_logs for select
to authenticated
using (company_id is not null and core.user_has_company_access(company_id));

grant usage on schema core to authenticated, service_role;
grant select, insert, update, delete on all tables in schema core to authenticated, service_role;
grant execute on all functions in schema core to authenticated, service_role;

insert into core.basic_plans (key, name, description)
values
  ('foundation', 'Foundation', 'Plano base para classificação comercial inicial, sem cobrança automática no MVP.')
on conflict (key) do nothing;

insert into core.applications (key, name, description, entry_path, sort_order)
values
  ('admin-console', 'FP Connect Admin Console', 'Painel central de empresas, usuários, permissões, módulos contratados e auditoria.', '/', 10),
  ('robots', 'FP Robots', 'Eventos, automações, webhooks, e-mails, logs e reprocessamentos.', '/robots', 20),
  ('food', 'FP Food', 'Loja, vitrine, cardápio, pedidos, cozinha, pagamentos manuais e entrega simples.', '/food', 30),
  ('tracking', 'FP Tracking', 'Entregas, entregadores, localização, ocorrências e rastreamento público.', '/tracking', 40),
  ('marketing', 'FP Marketing', 'Campanhas, canais, leads, qualificação e conversão para Sales.', '/marketing', 50),
  ('sales', 'FP Sales', 'Clientes, oportunidades, propostas, pipeline e visão 360.', '/sales', 60),
  ('tickets', 'FP Tickets', 'Chamados, atendimento, implantação, anexos, filas e SLA visual.', '/tickets', 70),
  ('billing', 'FP Billing', 'Planos, assinaturas, cobranças manuais, pagamentos e status financeiro.', '/billing', 80)
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description,
  entry_path = excluded.entry_path,
  sort_order = excluded.sort_order;

insert into core.permissions (application_id, key, name, description)
select a.id, permission_key, permission_name, permission_description
from core.applications a
join (
  values
    ('admin-console', 'admin.portal.access', 'Acessar portal', 'Permite acessar o portal principal do FP Connect.'),
    ('admin-console', 'admin.companies.read', 'Consultar empresas', 'Permite consultar empresas do ecossistema.'),
    ('admin-console', 'admin.companies.manage', 'Gerenciar empresas', 'Permite criar e alterar empresas.'),
    ('admin-console', 'admin.users.manage', 'Gerenciar usuários', 'Permite criar, convidar, vincular e inativar usuários.'),
    ('admin-console', 'admin.modules.manage', 'Gerenciar módulos contratados', 'Permite liberar, ativar, suspender e cancelar módulos por empresa.'),
    ('admin-console', 'admin.audit.read', 'Consultar auditoria', 'Permite consultar auditoria administrativa.'),
    ('robots', 'robots.events.read', 'Consultar eventos', 'Permite consultar eventos e execuções do FP Robots.'),
    ('robots', 'robots.failures.reprocess', 'Reprocessar falhas', 'Permite reprocessar falhas autorizadas.'),
    ('food', 'food.access', 'Acessar FP Food', 'Permite acessar o FP Food quando contratado.'),
    ('tracking', 'tracking.access', 'Acessar FP Tracking', 'Permite acessar o FP Tracking quando contratado.'),
    ('marketing', 'marketing.access', 'Acessar FP Marketing', 'Permite acessar o FP Marketing quando contratado.'),
    ('sales', 'sales.access', 'Acessar FP Sales', 'Permite acessar o FP Sales quando contratado.'),
    ('tickets', 'tickets.access', 'Acessar FP Tickets', 'Permite acessar o FP Tickets quando contratado.'),
    ('billing', 'billing.access', 'Acessar FP Billing', 'Permite acessar o FP Billing quando contratado.')
) as seed(application_key, permission_key, permission_name, permission_description)
  on seed.application_key = a.key
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description;

insert into core.roles (application_id, key, name, description)
select a.id, role_key, role_name, role_description
from core.applications a
join (
  values
    ('admin-console', 'company-admin', 'Admin da Empresa', 'Administra usuários e acessos da própria empresa dentro dos módulos contratados.'),
    ('admin-console', 'company-user', 'Usuário da Empresa', 'Acessa o portal e os módulos liberados para sua empresa.'),
    ('robots', 'module-admin', 'Administrador do FP Robots', 'Administra eventos, falhas e integrações autorizadas do FP Robots.'),
    ('food', 'module-admin', 'Administrador do FP Food', 'Administra a operação do FP Food para a própria empresa.'),
    ('tracking', 'module-admin', 'Administrador do FP Tracking', 'Administra a operação do FP Tracking para a própria empresa.'),
    ('marketing', 'module-admin', 'Administrador do FP Marketing', 'Administra campanhas e leads da própria empresa.'),
    ('sales', 'module-admin', 'Administrador do FP Sales', 'Administra operação comercial da própria empresa.'),
    ('tickets', 'module-admin', 'Administrador do FP Tickets', 'Administra chamados da própria empresa.'),
    ('billing', 'module-admin', 'Administrador do FP Billing', 'Administra visão financeira autorizada da própria empresa.')
) as seed(application_key, role_key, role_name, role_description)
  on seed.application_key = a.key
on conflict (application_id, key) do update set
  name = excluded.name,
  description = excluded.description;

insert into core.role_permissions (role_id, permission_id)
select r.id, p.id
from core.roles r
join core.applications a on a.id = r.application_id
join core.permissions p on p.application_id = a.id
where r.key = 'module-admin'
   or (a.key = 'admin-console' and r.key = 'company-admin' and p.key in (
      'admin.portal.access',
      'admin.companies.read',
      'admin.users.manage'
   ))
   or (a.key = 'admin-console' and r.key = 'company-user' and p.key = 'admin.portal.access')
on conflict do nothing;

insert into core.basic_plan_applications (basic_plan_id, application_id)
select bp.id, a.id
from core.basic_plans bp
join core.applications a on a.key = 'admin-console'
where bp.key = 'foundation'
on conflict do nothing;
