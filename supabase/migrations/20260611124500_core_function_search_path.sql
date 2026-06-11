-- Fix Supabase linter warnings for functions with mutable search_path.

create or replace function core.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function core.current_user_id()
returns uuid
language sql
stable
set search_path = pg_catalog
as $$
  select auth.uid();
$$;
