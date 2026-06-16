-- FP Robots V0: simple automation rules and actions.

create table if not exists robots.automation_rules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references core.companies(id),
  event_catalog_id uuid not null references robots.event_catalog(id),
  event_code text not null,
  name text not null,
  description text,
  status text not null default 'active',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id),
  delete_reason text,
  constraint robots_automation_rules_status_check check (status in ('active', 'inactive'))
);

create index if not exists robots_automation_rules_company_event_idx
  on robots.automation_rules(company_id, event_code)
  where deleted_at is null;
create unique index if not exists robots_automation_rules_company_name_active_idx
  on robots.automation_rules(company_id, name)
  where deleted_at is null;

create trigger set_robots_automation_rules_updated_at
before update on robots.automation_rules
for each row execute function core.set_updated_at();

create table if not exists robots.automation_rule_actions (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references robots.automation_rules(id),
  company_id uuid not null references core.companies(id),
  action_type text not null,
  name text not null,
  action_config jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  status text not null default 'active',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id),
  delete_reason text,
  constraint robots_automation_rule_actions_status_check check (status in ('active', 'inactive')),
  constraint robots_automation_rule_actions_type_check check (
    action_type in ('internal_log', 'internal_api', 'email', 'webhook', 'gateway_external_action')
  )
);

create index if not exists robots_automation_rule_actions_rule_idx
  on robots.automation_rule_actions(rule_id, sort_order)
  where deleted_at is null;
create index if not exists robots_automation_rule_actions_company_idx
  on robots.automation_rule_actions(company_id)
  where deleted_at is null;

create trigger set_robots_automation_rule_actions_updated_at
before update on robots.automation_rule_actions
for each row execute function core.set_updated_at();

alter table robots.event_executions
  add column if not exists rule_id uuid references robots.automation_rules(id),
  add column if not exists rule_action_id uuid references robots.automation_rule_actions(id);

create index if not exists robots_event_executions_rule_action_idx
  on robots.event_executions(rule_action_id)
  where deleted_at is null;

alter table robots.automation_rules enable row level security;
alter table robots.automation_rule_actions enable row level security;

drop policy if exists "robots_automation_rules_select_company_members" on robots.automation_rules;
create policy "robots_automation_rules_select_company_members"
on robots.automation_rules for select
to authenticated
using (
  deleted_at is null
  and exists (
    select 1
    from core.company_memberships cm
    where cm.company_id = robots.automation_rules.company_id
      and cm.user_id = auth.uid()
      and cm.status = 'active'
      and cm.deleted_at is null
  )
);

drop policy if exists "robots_automation_rule_actions_select_company_members" on robots.automation_rule_actions;
create policy "robots_automation_rule_actions_select_company_members"
on robots.automation_rule_actions for select
to authenticated
using (
  deleted_at is null
  and exists (
    select 1
    from core.company_memberships cm
    where cm.company_id = robots.automation_rule_actions.company_id
      and cm.user_id = auth.uid()
      and cm.status = 'active'
      and cm.deleted_at is null
  )
);

grant select, insert, update, delete on all tables in schema robots to authenticated, service_role;
