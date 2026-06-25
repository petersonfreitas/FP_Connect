-- Restrict stock movement RPC to backend service execution only.

revoke execute on function food.register_stock_entry(
  uuid,
  uuid,
  integer,
  uuid,
  text,
  text,
  date,
  text
) from public, anon, authenticated;

grant execute on function food.register_stock_entry(
  uuid,
  uuid,
  integer,
  uuid,
  text,
  text,
  date,
  text
) to service_role;
