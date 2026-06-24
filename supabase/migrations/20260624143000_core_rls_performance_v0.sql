create or replace function core.user_has_permission(
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
  with active_membership as (
    select 1
    from core.company_memberships cm
    join core.companies c on c.id = cm.company_id
    where cm.company_id = target_company_id
      and cm.user_id = target_user_id
      and cm.status = 'active'
      and cm.deleted_at is null
      and c.status = 'active'
      and c.deleted_at is null
    limit 1
  ),
  active_module as (
    select ca.application_id
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
    limit 1
  ),
  role_permission as (
    select 1
    from core.user_application_roles uar
    join active_module am on am.application_id = uar.application_id
    join core.roles r on r.id = uar.role_id
    join core.role_permissions rp on rp.role_id = r.id
    join core.permissions p on p.id = rp.permission_id
    where uar.company_id = target_company_id
      and uar.user_id = target_user_id
      and p.key = target_permission_key
      and r.application_id = uar.application_id
      and p.application_id = uar.application_id
      and uar.deleted_at is null
      and r.deleted_at is null
      and p.deleted_at is null
    limit 1
  )
  select core.is_super_admin(target_user_id)
    or (
      exists (select 1 from active_membership)
      and exists (select 1 from active_module)
      and exists (select 1 from role_permission)
    );
$$;

drop policy if exists "profiles_select_self_or_super_admin" on core.profiles;
create policy "profiles_select_self_or_super_admin"
on core.profiles for select
to authenticated
using (id = (select auth.uid()) or core.is_super_admin((select auth.uid())));

drop policy if exists "super_admin_all_profiles" on core.profiles;
drop policy if exists "super_admin_insert_profiles" on core.profiles;
create policy "super_admin_insert_profiles"
on core.profiles for insert
to authenticated
with check (core.is_super_admin((select auth.uid())));
drop policy if exists "super_admin_update_profiles" on core.profiles;
create policy "super_admin_update_profiles"
on core.profiles for update
to authenticated
using (core.is_super_admin((select auth.uid())))
with check (core.is_super_admin((select auth.uid())));
drop policy if exists "super_admin_delete_profiles" on core.profiles;
create policy "super_admin_delete_profiles"
on core.profiles for delete
to authenticated
using (core.is_super_admin((select auth.uid())));

drop policy if exists "catalog_select_authenticated_basic_plans" on core.basic_plans;
create policy "catalog_select_authenticated_basic_plans"
on core.basic_plans for select
to authenticated
using (core.is_super_admin((select auth.uid())) or deleted_at is null);

drop policy if exists "catalog_select_authenticated_applications" on core.applications;
create policy "catalog_select_authenticated_applications"
on core.applications for select
to authenticated
using (core.is_super_admin((select auth.uid())) or (deleted_at is null and status <> 'hidden'));

drop policy if exists "catalog_select_authenticated_permissions" on core.permissions;
create policy "catalog_select_authenticated_permissions"
on core.permissions for select
to authenticated
using (core.is_super_admin((select auth.uid())) or deleted_at is null);

drop policy if exists "catalog_select_authenticated_roles" on core.roles;
create policy "catalog_select_authenticated_roles"
on core.roles for select
to authenticated
using (core.is_super_admin((select auth.uid())) or deleted_at is null);

drop policy if exists "super_admin_all_role_permissions" on core.role_permissions;
drop policy if exists "super_admin_insert_role_permissions" on core.role_permissions;
create policy "super_admin_insert_role_permissions"
on core.role_permissions for insert
to authenticated
with check (core.is_super_admin((select auth.uid())));
drop policy if exists "super_admin_update_role_permissions" on core.role_permissions;
create policy "super_admin_update_role_permissions"
on core.role_permissions for update
to authenticated
using (core.is_super_admin((select auth.uid())))
with check (core.is_super_admin((select auth.uid())));
drop policy if exists "super_admin_delete_role_permissions" on core.role_permissions;
create policy "super_admin_delete_role_permissions"
on core.role_permissions for delete
to authenticated
using (core.is_super_admin((select auth.uid())));

drop policy if exists "super_admin_all_basic_plan_applications" on core.basic_plan_applications;
drop policy if exists "super_admin_insert_basic_plan_applications" on core.basic_plan_applications;
create policy "super_admin_insert_basic_plan_applications"
on core.basic_plan_applications for insert
to authenticated
with check (core.is_super_admin((select auth.uid())));
drop policy if exists "super_admin_update_basic_plan_applications" on core.basic_plan_applications;
create policy "super_admin_update_basic_plan_applications"
on core.basic_plan_applications for update
to authenticated
using (core.is_super_admin((select auth.uid())))
with check (core.is_super_admin((select auth.uid())));
drop policy if exists "super_admin_delete_basic_plan_applications" on core.basic_plan_applications;
create policy "super_admin_delete_basic_plan_applications"
on core.basic_plan_applications for delete
to authenticated
using (core.is_super_admin((select auth.uid())));

drop policy if exists "super_admin_all_basic_plans" on core.basic_plans;
drop policy if exists "super_admin_insert_basic_plans" on core.basic_plans;
create policy "super_admin_insert_basic_plans"
on core.basic_plans for insert
to authenticated
with check (core.is_super_admin((select auth.uid())));
drop policy if exists "super_admin_update_basic_plans" on core.basic_plans;
create policy "super_admin_update_basic_plans"
on core.basic_plans for update
to authenticated
using (core.is_super_admin((select auth.uid())))
with check (core.is_super_admin((select auth.uid())));
drop policy if exists "super_admin_delete_basic_plans" on core.basic_plans;
create policy "super_admin_delete_basic_plans"
on core.basic_plans for delete
to authenticated
using (core.is_super_admin((select auth.uid())));

drop policy if exists "super_admin_all_applications" on core.applications;
drop policy if exists "super_admin_insert_applications" on core.applications;
create policy "super_admin_insert_applications"
on core.applications for insert
to authenticated
with check (core.is_super_admin((select auth.uid())));
drop policy if exists "super_admin_update_applications" on core.applications;
create policy "super_admin_update_applications"
on core.applications for update
to authenticated
using (core.is_super_admin((select auth.uid())))
with check (core.is_super_admin((select auth.uid())));
drop policy if exists "super_admin_delete_applications" on core.applications;
create policy "super_admin_delete_applications"
on core.applications for delete
to authenticated
using (core.is_super_admin((select auth.uid())));

drop policy if exists "super_admin_all_permissions" on core.permissions;
drop policy if exists "super_admin_insert_permissions" on core.permissions;
create policy "super_admin_insert_permissions"
on core.permissions for insert
to authenticated
with check (core.is_super_admin((select auth.uid())));
drop policy if exists "super_admin_update_permissions" on core.permissions;
create policy "super_admin_update_permissions"
on core.permissions for update
to authenticated
using (core.is_super_admin((select auth.uid())))
with check (core.is_super_admin((select auth.uid())));
drop policy if exists "super_admin_delete_permissions" on core.permissions;
create policy "super_admin_delete_permissions"
on core.permissions for delete
to authenticated
using (core.is_super_admin((select auth.uid())));

drop policy if exists "super_admin_all_roles" on core.roles;
drop policy if exists "super_admin_insert_roles" on core.roles;
create policy "super_admin_insert_roles"
on core.roles for insert
to authenticated
with check (core.is_super_admin((select auth.uid())));
drop policy if exists "super_admin_update_roles" on core.roles;
create policy "super_admin_update_roles"
on core.roles for update
to authenticated
using (core.is_super_admin((select auth.uid())))
with check (core.is_super_admin((select auth.uid())));
drop policy if exists "super_admin_delete_roles" on core.roles;
create policy "super_admin_delete_roles"
on core.roles for delete
to authenticated
using (core.is_super_admin((select auth.uid())));

drop policy if exists "super_admin_all_companies" on core.companies;
drop policy if exists "company_members_select_companies" on core.companies;
create policy "company_members_select_companies"
on core.companies for select
to authenticated
using (core.user_has_company_access(id, (select auth.uid())));
drop policy if exists "super_admin_insert_companies" on core.companies;
create policy "super_admin_insert_companies"
on core.companies for insert
to authenticated
with check (core.is_super_admin((select auth.uid())));
drop policy if exists "super_admin_update_companies" on core.companies;
create policy "super_admin_update_companies"
on core.companies for update
to authenticated
using (core.is_super_admin((select auth.uid())))
with check (core.is_super_admin((select auth.uid())));
drop policy if exists "super_admin_delete_companies" on core.companies;
create policy "super_admin_delete_companies"
on core.companies for delete
to authenticated
using (core.is_super_admin((select auth.uid())));

drop policy if exists "super_admin_all_company_memberships" on core.company_memberships;
drop policy if exists "users_select_own_memberships" on core.company_memberships;
create policy "users_select_own_memberships"
on core.company_memberships for select
to authenticated
using (user_id = (select auth.uid()) or core.is_super_admin((select auth.uid())));
drop policy if exists "super_admin_insert_company_memberships" on core.company_memberships;
create policy "super_admin_insert_company_memberships"
on core.company_memberships for insert
to authenticated
with check (core.is_super_admin((select auth.uid())));
drop policy if exists "super_admin_update_company_memberships" on core.company_memberships;
create policy "super_admin_update_company_memberships"
on core.company_memberships for update
to authenticated
using (core.is_super_admin((select auth.uid())))
with check (core.is_super_admin((select auth.uid())));
drop policy if exists "super_admin_delete_company_memberships" on core.company_memberships;
create policy "super_admin_delete_company_memberships"
on core.company_memberships for delete
to authenticated
using (core.is_super_admin((select auth.uid())));

drop policy if exists "super_admin_all_company_applications" on core.company_applications;
drop policy if exists "company_members_select_company_applications" on core.company_applications;
create policy "company_members_select_company_applications"
on core.company_applications for select
to authenticated
using (core.user_has_company_access(company_id, (select auth.uid())));
drop policy if exists "super_admin_insert_company_applications" on core.company_applications;
create policy "super_admin_insert_company_applications"
on core.company_applications for insert
to authenticated
with check (core.is_super_admin((select auth.uid())));
drop policy if exists "super_admin_update_company_applications" on core.company_applications;
create policy "super_admin_update_company_applications"
on core.company_applications for update
to authenticated
using (core.is_super_admin((select auth.uid())))
with check (core.is_super_admin((select auth.uid())));
drop policy if exists "super_admin_delete_company_applications" on core.company_applications;
create policy "super_admin_delete_company_applications"
on core.company_applications for delete
to authenticated
using (core.is_super_admin((select auth.uid())));

drop policy if exists "super_admin_all_user_application_roles" on core.user_application_roles;
drop policy if exists "users_select_own_application_roles" on core.user_application_roles;
create policy "users_select_own_application_roles"
on core.user_application_roles for select
to authenticated
using (user_id = (select auth.uid()) or core.is_super_admin((select auth.uid())));
drop policy if exists "super_admin_insert_user_application_roles" on core.user_application_roles;
create policy "super_admin_insert_user_application_roles"
on core.user_application_roles for insert
to authenticated
with check (core.is_super_admin((select auth.uid())));
drop policy if exists "super_admin_update_user_application_roles" on core.user_application_roles;
create policy "super_admin_update_user_application_roles"
on core.user_application_roles for update
to authenticated
using (core.is_super_admin((select auth.uid())))
with check (core.is_super_admin((select auth.uid())));
drop policy if exists "super_admin_delete_user_application_roles" on core.user_application_roles;
create policy "super_admin_delete_user_application_roles"
on core.user_application_roles for delete
to authenticated
using (core.is_super_admin((select auth.uid())));

drop policy if exists "super_admin_all_audit_logs" on core.audit_logs;
drop policy if exists "company_members_select_audit_logs" on core.audit_logs;
create policy "company_members_select_audit_logs"
on core.audit_logs for select
to authenticated
using (company_id is not null and core.user_has_company_access(company_id, (select auth.uid())));
drop policy if exists "super_admin_insert_audit_logs" on core.audit_logs;
create policy "super_admin_insert_audit_logs"
on core.audit_logs for insert
to authenticated
with check (core.is_super_admin((select auth.uid())));
drop policy if exists "super_admin_update_audit_logs" on core.audit_logs;
create policy "super_admin_update_audit_logs"
on core.audit_logs for update
to authenticated
using (core.is_super_admin((select auth.uid())))
with check (core.is_super_admin((select auth.uid())));
drop policy if exists "super_admin_delete_audit_logs" on core.audit_logs;
create policy "super_admin_delete_audit_logs"
on core.audit_logs for delete
to authenticated
using (core.is_super_admin((select auth.uid())));

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
      and cm.user_id = (select auth.uid())
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
      and cm.user_id = (select auth.uid())
      and cm.status = 'active'
      and cm.deleted_at is null
  )
);

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
      and cm.user_id = (select auth.uid())
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
      and cm.user_id = (select auth.uid())
      and cm.status = 'active'
      and cm.deleted_at is null
  )
);

drop policy if exists stores_select_company_members on food.stores;
create policy stores_select_company_members
  on food.stores
  for select
  to authenticated
  using (
    deleted_at is null
    and exists (
      select 1
      from core.company_memberships cm
      where cm.company_id = stores.company_id
        and cm.user_id = (select auth.uid())
        and cm.status = 'active'
        and cm.deleted_at is null
    )
  );

drop policy if exists food_categories_select_company_members on food.categories;
create policy food_categories_select_company_members
  on food.categories
  for select
  to authenticated
  using (
    deleted_at is null
    and exists (
      select 1
      from core.company_memberships cm
      where cm.company_id = categories.company_id
        and cm.user_id = (select auth.uid())
        and cm.status = 'active'
        and cm.deleted_at is null
    )
  );

drop policy if exists food_products_select_company_members on food.products;
create policy food_products_select_company_members
  on food.products
  for select
  to authenticated
  using (
    deleted_at is null
    and exists (
      select 1
      from core.company_memberships cm
      where cm.company_id = products.company_id
        and cm.user_id = (select auth.uid())
        and cm.status = 'active'
        and cm.deleted_at is null
    )
  );

drop policy if exists food_orders_select_company_members on food.orders;
create policy food_orders_select_company_members
  on food.orders
  for select
  to authenticated
  using (
    deleted_at is null
    and exists (
      select 1
      from core.company_memberships cm
      where cm.company_id = orders.company_id
        and cm.user_id = (select auth.uid())
        and cm.status = 'active'
        and cm.deleted_at is null
    )
  );

drop policy if exists food_order_items_select_company_members on food.order_items;
create policy food_order_items_select_company_members
  on food.order_items
  for select
  to authenticated
  using (
    deleted_at is null
    and exists (
      select 1
      from core.company_memberships cm
      where cm.company_id = order_items.company_id
        and cm.user_id = (select auth.uid())
        and cm.status = 'active'
        and cm.deleted_at is null
    )
  );

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
        and cm.user_id = (select auth.uid())
        and cm.status = 'active'
        and cm.deleted_at is null
    )
  );

drop policy if exists gateway_company_provider_configs_select_company_members
  on gateway.company_provider_configs;
create policy gateway_company_provider_configs_select_company_members
  on gateway.company_provider_configs
  for select
  to authenticated
  using (
    deleted_at is null
    and exists (
      select 1
      from core.company_memberships cm
      where cm.company_id = company_provider_configs.company_id
        and cm.user_id = (select auth.uid())
        and cm.status = 'active'
        and cm.deleted_at is null
    )
  );

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
        and cm.user_id = (select auth.uid())
        and cm.status = 'active'
        and cm.deleted_at is null
    )
  );

drop policy if exists food_store_hours_select_company_members on food.store_hours;
create policy food_store_hours_select_company_members
  on food.store_hours
  for select
  to authenticated
  using (
    deleted_at is null
    and exists (
      select 1
      from core.company_memberships cm
      where cm.company_id = store_hours.company_id
        and cm.user_id = (select auth.uid())
        and cm.status = 'active'
        and cm.deleted_at is null
    )
  );

drop policy if exists food_customer_accounts_self_select on food.customer_accounts;
create policy food_customer_accounts_self_select
  on food.customer_accounts
  for select
  to authenticated
  using (deleted_at is null and auth_user_id = (select auth.uid()));

drop policy if exists food_customer_accounts_self_insert on food.customer_accounts;
create policy food_customer_accounts_self_insert
  on food.customer_accounts
  for insert
  to authenticated
  with check (auth_user_id = (select auth.uid()));

drop policy if exists food_customer_accounts_self_update on food.customer_accounts;
create policy food_customer_accounts_self_update
  on food.customer_accounts
  for update
  to authenticated
  using (deleted_at is null and auth_user_id = (select auth.uid()))
  with check (auth_user_id = (select auth.uid()));

drop policy if exists food_customers_self_select on food.customers;
create policy food_customers_self_select
  on food.customers
  for select
  to authenticated
  using (
    deleted_at is null
    and exists (
      select 1
      from food.customer_accounts ca
      where ca.id = customers.account_id
        and ca.auth_user_id = (select auth.uid())
        and ca.deleted_at is null
    )
  );

drop policy if exists food_customers_self_insert on food.customers;
create policy food_customers_self_insert
  on food.customers
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from food.customer_accounts ca
      where ca.id = customers.account_id
        and ca.auth_user_id = (select auth.uid())
        and ca.deleted_at is null
    )
  );

drop policy if exists food_customers_self_update on food.customers;
create policy food_customers_self_update
  on food.customers
  for update
  to authenticated
  using (
    deleted_at is null
    and exists (
      select 1
      from food.customer_accounts ca
      where ca.id = customers.account_id
        and ca.auth_user_id = (select auth.uid())
        and ca.deleted_at is null
    )
  )
  with check (
    exists (
      select 1
      from food.customer_accounts ca
      where ca.id = customers.account_id
        and ca.auth_user_id = (select auth.uid())
        and ca.deleted_at is null
    )
  );

drop policy if exists food_customer_store_access_self_select on food.customer_store_access;
create policy food_customer_store_access_self_select
  on food.customer_store_access
  for select
  to authenticated
  using (
    deleted_at is null
    and exists (
      select 1
      from food.customers c
      join food.customer_accounts ca on ca.id = c.account_id
      where c.id = customer_store_access.customer_id
        and ca.auth_user_id = (select auth.uid())
        and c.deleted_at is null
        and ca.deleted_at is null
    )
  );

drop policy if exists food_customer_store_access_self_insert on food.customer_store_access;
create policy food_customer_store_access_self_insert
  on food.customer_store_access
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from food.customers c
      join food.customer_accounts ca on ca.id = c.account_id
      where c.id = customer_store_access.customer_id
        and ca.auth_user_id = (select auth.uid())
        and c.deleted_at is null
        and ca.deleted_at is null
    )
  );

drop policy if exists food_customer_store_access_self_update on food.customer_store_access;
create policy food_customer_store_access_self_update
  on food.customer_store_access
  for update
  to authenticated
  using (
    deleted_at is null
    and exists (
      select 1
      from food.customers c
      join food.customer_accounts ca on ca.id = c.account_id
      where c.id = customer_store_access.customer_id
        and ca.auth_user_id = (select auth.uid())
        and c.deleted_at is null
        and ca.deleted_at is null
    )
  )
  with check (
    exists (
      select 1
      from food.customers c
      join food.customer_accounts ca on ca.id = c.account_id
      where c.id = customer_store_access.customer_id
        and ca.auth_user_id = (select auth.uid())
        and c.deleted_at is null
        and ca.deleted_at is null
    )
  );

drop policy if exists food_customer_phones_self_select on food.customer_phones;
create policy food_customer_phones_self_select
  on food.customer_phones
  for select
  to authenticated
  using (
    deleted_at is null
    and exists (
      select 1
      from food.customers c
      join food.customer_accounts ca on ca.id = c.account_id
      where c.id = customer_phones.customer_id
        and ca.auth_user_id = (select auth.uid())
        and c.deleted_at is null
        and ca.deleted_at is null
    )
  );

drop policy if exists food_customer_addresses_self_select on food.customer_addresses;
create policy food_customer_addresses_self_select
  on food.customer_addresses
  for select
  to authenticated
  using (
    deleted_at is null
    and exists (
      select 1
      from food.customers c
      join food.customer_accounts ca on ca.id = c.account_id
      where c.id = customer_addresses.customer_id
        and ca.auth_user_id = (select auth.uid())
        and c.deleted_at is null
        and ca.deleted_at is null
    )
  );
