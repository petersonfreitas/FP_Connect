-- Restrict internal SECURITY DEFINER helpers from public RPC execution.

revoke execute on function core.is_super_admin(uuid) from public, anon, authenticated;
revoke execute on function core.user_has_company_access(uuid, uuid) from public, anon, authenticated;
revoke execute on function core.company_has_module(uuid, text) from public, anon, authenticated;
revoke execute on function core.user_has_permission(uuid, text, text, uuid) from public, anon, authenticated;

grant execute on function core.is_super_admin(uuid) to service_role;
grant execute on function core.user_has_company_access(uuid, uuid) to service_role;
grant execute on function core.company_has_module(uuid, text) to service_role;
grant execute on function core.user_has_permission(uuid, text, text, uuid) to service_role;
