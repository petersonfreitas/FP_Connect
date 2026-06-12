import { SetMetadata } from "@nestjs/common";

export const ADMIN_CONSOLE_POLICY_KEY = "adminConsolePolicy";

export type AdminConsolePolicy = {
  companyBody?: string;
  permissionKey?: AdminConsolePermissionKey;
  companyParam?: string;
};

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
