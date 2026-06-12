-- Complementary indexes for current Admin Console query patterns.
-- These keep the existing security model intact and only improve read paths.

create index if not exists basic_plans_name_active_idx
  on core.basic_plans(name)
  where deleted_at is null;

create index if not exists applications_sort_order_active_idx
  on core.applications(sort_order)
  where deleted_at is null;

create index if not exists companies_created_at_active_idx
  on core.companies(created_at desc)
  where deleted_at is null;

create index if not exists profiles_created_at_active_idx
  on core.profiles(created_at desc)
  where deleted_at is null;

create index if not exists company_memberships_company_created_at_active_idx
  on core.company_memberships(company_id, created_at desc)
  where deleted_at is null;

create index if not exists company_memberships_user_created_at_active_idx
  on core.company_memberships(user_id, created_at desc)
  where deleted_at is null;

create index if not exists company_applications_created_at_active_idx
  on core.company_applications(created_at desc)
  where deleted_at is null;

create index if not exists company_applications_company_created_at_active_idx
  on core.company_applications(company_id, created_at desc)
  where deleted_at is null;

create index if not exists company_applications_company_status_active_idx
  on core.company_applications(company_id, status)
  where deleted_at is null;

create index if not exists roles_application_name_active_idx
  on core.roles(application_id, name)
  where deleted_at is null;

create index if not exists user_application_roles_company_user_created_at_active_idx
  on core.user_application_roles(company_id, user_id, created_at desc)
  where deleted_at is null;

create index if not exists user_application_roles_company_created_at_active_idx
  on core.user_application_roles(company_id, created_at desc)
  where deleted_at is null;

create index if not exists audit_logs_action_created_at_idx
  on core.audit_logs(action, created_at desc);

create index if not exists audit_logs_company_created_at_idx
  on core.audit_logs(company_id, created_at desc)
  where company_id is not null;

create index if not exists audit_logs_actor_created_at_idx
  on core.audit_logs(actor_user_id, created_at desc)
  where actor_user_id is not null;
