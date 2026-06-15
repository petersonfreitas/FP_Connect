import type { ModuleApplicationKey } from "./module-access-policy.decorator";

export type ModuleAccessContract = {
  actorUserId: string | null;
  applicationKey: ModuleApplicationKey;
  companyId: string | null;
  granted: true;
};

export function buildModuleAccessResponse(
  applicationKey: ModuleApplicationKey,
  companyId: string | undefined,
  actorUserId: string | undefined
): ModuleAccessContract {
  return {
    actorUserId: actorUserId ?? null,
    applicationKey,
    companyId: companyId ?? null,
    granted: true
  };
}
