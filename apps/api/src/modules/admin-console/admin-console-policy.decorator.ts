import { SetMetadata } from "@nestjs/common";

export const ADMIN_CONSOLE_POLICY_KEY = "adminConsolePolicy";

export type AdminConsolePolicy = {
  authenticatedOnly?: boolean;
  companyBody?: string;
  permissionKey?: AdminConsolePermissionKey;
  companyParam?: string;
  platformRoles?: AdminConsolePlatformRole[];
  superAdminOnly?: boolean;
};

export type AdminConsolePlatformRole = "fp_admin" | "support";

export type AdminConsolePermissionKey =
  | "admin.audit.read"
  | "admin.companies.manage"
  | "admin.companies.read"
  | "admin.modules.manage"
  | "admin.portal.access"
  | "admin.users.manage";

export function AdminConsolePolicy(policy: AdminConsolePolicy) {
  return SetMetadata(ADMIN_CONSOLE_POLICY_KEY, policy);
}

export function AdminConsoleSuperAdminOnly() {
  return AdminConsolePolicy({ superAdminOnly: true });
}

export function AdminConsoleAuthenticatedOnly() {
  return AdminConsolePolicy({ authenticatedOnly: true });
}
