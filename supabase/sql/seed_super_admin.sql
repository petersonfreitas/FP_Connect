-- FP Connect - seed inicial de super-admin.
--
-- Como usar:
--   1. Crie manualmente o primeiro usuario em Supabase Auth.
--   2. Copie o UUID desse usuario.
--   3. Substitua os valores no CTE `seed`.
--   4. Execute este script no SQL Editor do Supabase.
--
-- Este script nao cria auth.users. Ele apenas cria/atualiza o perfil core
-- correspondente ao Auth existente.

begin;

with seed as (
  select
    '00000000-0000-0000-0000-000000000000'::uuid as user_id,
    'admin@fpwebtech.com.br'::text as email,
    'Super Admin FP WebTech'::text as full_name
)
insert into core.profiles (
  id,
  full_name,
  email,
  status,
  global_role,
  is_internal_user,
  deleted_at,
  deleted_by,
  delete_reason
)
select
  user_id,
  full_name,
  email,
  'active'::core.user_status,
  'super_admin'::core.global_role,
  true,
  null,
  null,
  null
from seed
on conflict (id) do update set
  full_name = excluded.full_name,
  email = excluded.email,
  status = excluded.status,
  global_role = excluded.global_role,
  is_internal_user = excluded.is_internal_user,
  deleted_at = null,
  deleted_by = null,
  delete_reason = null,
  updated_at = now();

commit;
