-- FP Connect - reset de dados operacionais.
--
-- Objetivo:
--   Limpar dados de empresas, usuarios de negocio, vinculos, modulos contratados,
--   papeis concedidos e auditoria, preservando cargas nativas do sistema.
--
-- Preservado:
--   core.basic_plans
--   core.applications
--   core.permissions
--   core.roles
--   core.role_permissions
--   core.basic_plan_applications
--
-- Atencao:
--   Este script e destrutivo para dados operacionais.
--   Ele nao apaga auth.users. Para recriar o super-admin no core, rode depois
--   supabase/sql/seed_super_admin.sql com o UUID do Auth manual.

begin;

truncate table
  core.audit_logs,
  core.user_application_roles,
  core.company_memberships,
  core.company_applications,
  core.companies,
  core.profiles
restart identity cascade;

commit;
