-- Allow operational module access while a contracted module is in implementation.
-- Suspended and cancelled modules remain blocked.

create or replace function core.company_has_module(
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
      and ca.status in ('implementation', 'active')
      and c.status = 'active'
      and a.deleted_at is null
      and ca.deleted_at is null
      and c.deleted_at is null
  );
$$;

revoke execute on function core.company_has_module(uuid, text) from public, anon, authenticated;
grant execute on function core.company_has_module(uuid, text) to service_role;
