import { SetMetadata } from "@nestjs/common";

export const MODULE_ACCESS_POLICY_KEY = "moduleAccessPolicy";

export type ModuleApplicationKey =
  | "billing"
  | "food"
  | "marketing"
  | "robots"
  | "sales"
  | "tickets"
  | "tracking";

export type ModuleAccessPolicy = {
  applicationKey: ModuleApplicationKey;
  companyBody?: string;
  companyHeader?: string;
  companyParam?: string;
  permissionKey: string;
};

export function ModuleAccessPolicy(policy: ModuleAccessPolicy) {
  return SetMetadata(MODULE_ACCESS_POLICY_KEY, policy);
}
