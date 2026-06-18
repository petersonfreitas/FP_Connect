import "server-only";

import type {
  ActivateAdminUserInviteContract,
  AdminAuditScope,
  AdminAuditLogContract,
  AdminBasicPlanContract,
  BulkGrantAdminUserRolesContract,
  BulkGrantAdminUserRolesInput,
  BulkRevokeAdminUserRolesContract,
  BulkRevokeAdminUserRolesInput,
  BulkUpdateAdminCompanyApplicationsContract,
  BulkUpdateAdminCompanyApplicationsInput,
  AdminCompanyUserAccessContract,
  AdminCompanyApplicationContract,
  AdminCompanyUserContract,
  AdminCompanyContract,
  AdminConsoleOverviewContract,
  AdminCatalogContract,
  AdminContractedModuleContract,
  AdminCurrentUserAccessContract,
  AdminUserApplicationRoleContract,
  AdminUserContract,
  CreateAdminCompanyInput,
  CreateAdminConsoleUserInput,
  CreateAdminUserInput,
  GrantAdminUserRoleInput,
  GatewayCompanyProviderConfigContract,
  GatewayProviderContract,
  GatewayProviderValidationContract,
  LinkAdminCompanySupportInput,
  ModuleAccessContract,
  ModuleApplicationKey,
  PaginatedContract,
  CreateRobotsEventContract,
  CreateRobotsEventInput,
  CreateRobotsTestEventContract,
  CreateRobotsTestFailureContract,
  ReprocessRobotsExecutionContract,
  RobotsEventCatalogContract,
  RobotsEventContract,
  RobotsExecutionContract,
  RobotsRuleContract,
  ResendAdminUserInviteContract,
  RevokeAdminUserRoleContract,
  RevokeAdminUserRoleInput,
  UpdateAdminCompanyUserInput,
  UpdateAdminCompanyInput,
  UpdateAdminUserInput,
  UpdateAdminCompanyApplicationInput,
  UpsertGatewaySmtpConfigInput
} from "@fp/types";
import { requireCurrentUser } from "./auth";
import { loadServerEnv } from "./server-env";

const DEFAULT_INTERNAL_API_BASE_URL = "http://localhost:3001/api";

type InternalApiResult<T> =
  | {
      data: T;
      error: null;
    }
  | {
      data: null;
      error: string;
    };

export async function getAdminConsoleOverview(): Promise<
  InternalApiResult<AdminConsoleOverviewContract>
> {
  return fetchInternal<AdminConsoleOverviewContract>("admin-console/overview");
}

export async function getCurrentAdminAccess(): Promise<
  InternalApiResult<AdminCurrentUserAccessContract>
> {
  return fetchInternal<AdminCurrentUserAccessContract>("admin-console/users/me/access");
}

type PaginationParams = {
  page?: number;
  pageSize?: number;
  scope?: "all" | "company" | "platform";
};

export async function listAdminCompanies(
  pagination: PaginationParams = {}
): Promise<InternalApiResult<PaginatedContract<AdminCompanyContract>>> {
  return fetchInternal<PaginatedContract<AdminCompanyContract>>(
    `admin-console/companies${formatPaginationSearch(pagination)}`
  );
}

export async function getAdminCompany(
  id: string
): Promise<InternalApiResult<AdminCompanyContract>> {
  return fetchInternal<AdminCompanyContract>(`admin-console/companies/${id}`);
}

export async function listAdminCompanyUsers(
  companyId: string
): Promise<InternalApiResult<AdminCompanyUserContract[]>> {
  return fetchInternal<AdminCompanyUserContract[]>(`admin-console/companies/${companyId}/users`);
}

export async function listAdminCompanySupportCandidates(
  companyId: string
): Promise<InternalApiResult<AdminUserContract[]>> {
  return fetchInternal<AdminUserContract[]>(
    `admin-console/companies/${companyId}/support-candidates`
  );
}

export async function listAdminCompanyApplications(
  companyId: string
): Promise<InternalApiResult<AdminCompanyApplicationContract[]>> {
  return fetchInternal<AdminCompanyApplicationContract[]>(
    `admin-console/companies/${companyId}/applications`
  );
}

export async function getAdminCompanyUserAccess(
  companyId: string,
  userId: string
): Promise<InternalApiResult<AdminCompanyUserAccessContract>> {
  return fetchInternal<AdminCompanyUserAccessContract>(
    `admin-console/companies/${companyId}/users/${userId}/access`
  );
}

export async function createAdminCompany(
  input: CreateAdminCompanyInput
): Promise<InternalApiResult<AdminCompanyContract>> {
  return fetchInternal<AdminCompanyContract>("admin-console/companies", {
    body: JSON.stringify(input),
    method: "POST"
  });
}

export async function updateAdminCompany(
  id: string,
  input: UpdateAdminCompanyInput
): Promise<InternalApiResult<AdminCompanyContract>> {
  return fetchInternal<AdminCompanyContract>(`admin-console/companies/${id}`, {
    body: JSON.stringify(input),
    method: "PATCH"
  });
}

export async function updateAdminCompanyApplication(
  companyId: string,
  input: UpdateAdminCompanyApplicationInput
): Promise<InternalApiResult<AdminCompanyApplicationContract>> {
  return fetchInternal<AdminCompanyApplicationContract>(
    `admin-console/companies/${companyId}/applications`,
    {
      body: JSON.stringify(input),
      method: "POST"
    }
  );
}

export async function bulkUpdateAdminCompanyApplications(
  companyId: string,
  input: BulkUpdateAdminCompanyApplicationsInput
): Promise<InternalApiResult<BulkUpdateAdminCompanyApplicationsContract>> {
  return fetchInternal<BulkUpdateAdminCompanyApplicationsContract>(
    `admin-console/companies/${companyId}/applications/bulk`,
    {
      body: JSON.stringify(input),
      method: "POST"
    }
  );
}

export async function listAdminBasicPlans(): Promise<
  InternalApiResult<AdminBasicPlanContract[]>
> {
  return fetchInternal<AdminBasicPlanContract[]>("admin-console/basic-plans");
}

export async function getAdminCatalog(): Promise<InternalApiResult<AdminCatalogContract>> {
  return fetchInternal<AdminCatalogContract>("admin-console/catalog");
}

export async function listAdminContractedModules(): Promise<
  InternalApiResult<AdminContractedModuleContract[]>
> {
  return fetchInternal<AdminContractedModuleContract[]>("admin-console/contracted-modules");
}

export async function getModuleAccess(
  applicationKey: ModuleApplicationKey,
  companyId: string
): Promise<InternalApiResult<ModuleAccessContract>> {
  return fetchInternal<ModuleAccessContract>(`${applicationKey}/access`, {
    headers: {
      "X-FP-Company-Id": companyId
    }
  });
}

export async function listGatewayProviders(
  companyId: string
): Promise<InternalApiResult<GatewayProviderContract[]>> {
  return fetchInternal<GatewayProviderContract[]>("gateway/providers", {
    headers: {
      "X-FP-Company-Id": companyId
    }
  });
}

export async function listGatewayProviderConfigs(
  companyId: string
): Promise<InternalApiResult<GatewayCompanyProviderConfigContract[]>> {
  return fetchInternal<GatewayCompanyProviderConfigContract[]>("gateway/providers/configs", {
    headers: {
      "X-FP-Company-Id": companyId
    }
  });
}

export async function upsertGatewaySmtpConfig(
  companyId: string,
  input: UpsertGatewaySmtpConfigInput
): Promise<InternalApiResult<GatewayCompanyProviderConfigContract>> {
  return fetchInternal<GatewayCompanyProviderConfigContract>("gateway/providers/smtp/config", {
    body: JSON.stringify(input),
    headers: {
      "X-FP-Company-Id": companyId
    },
    method: "POST"
  });
}

export async function testGatewaySmtpConfig(
  companyId: string
): Promise<InternalApiResult<GatewayProviderValidationContract>> {
  return fetchInternal<GatewayProviderValidationContract>("gateway/providers/smtp/test", {
    headers: {
      "X-FP-Company-Id": companyId
    },
    method: "POST"
  });
}

export async function listRobotsEventCatalog(
  companyId: string
): Promise<InternalApiResult<RobotsEventCatalogContract[]>> {
  return fetchInternal<RobotsEventCatalogContract[]>("robots/events/catalog", {
    headers: {
      "X-FP-Company-Id": companyId
    }
  });
}

export async function listRobotsEvents(
  companyId: string
): Promise<InternalApiResult<RobotsEventContract[]>> {
  return fetchInternal<RobotsEventContract[]>("robots/events", {
    headers: {
      "X-FP-Company-Id": companyId
    }
  });
}

export async function listRobotsRules(
  companyId: string
): Promise<InternalApiResult<RobotsRuleContract[]>> {
  return fetchInternal<RobotsRuleContract[]>("robots/rules", {
    headers: {
      "X-FP-Company-Id": companyId
    }
  });
}

export async function listRobotsExecutions(
  companyId: string
): Promise<InternalApiResult<RobotsExecutionContract[]>> {
  return fetchInternal<RobotsExecutionContract[]>("robots/executions", {
    headers: {
      "X-FP-Company-Id": companyId
    }
  });
}

export async function getRobotsEvent(
  companyId: string,
  eventId: string
): Promise<InternalApiResult<RobotsEventContract>> {
  return fetchInternal<RobotsEventContract>(`robots/events/${eventId}`, {
    headers: {
      "X-FP-Company-Id": companyId
    }
  });
}

export async function createRobotsEvent(
  companyId: string,
  input: CreateRobotsEventInput
): Promise<InternalApiResult<CreateRobotsEventContract>> {
  return fetchInternal<CreateRobotsEventContract>("robots/events", {
    body: JSON.stringify(input),
    headers: {
      "X-FP-Company-Id": companyId
    },
    method: "POST"
  });
}

export async function createRobotsTestEvent(
  companyId: string
): Promise<InternalApiResult<CreateRobotsTestEventContract>> {
  return fetchInternal<CreateRobotsTestEventContract>("robots/test-event", {
    headers: {
      "X-FP-Company-Id": companyId
    },
    method: "POST"
  });
}

export async function createRobotsTestFailure(
  companyId: string
): Promise<InternalApiResult<CreateRobotsTestFailureContract>> {
  return fetchInternal<CreateRobotsTestFailureContract>("robots/test-failure", {
    headers: {
      "X-FP-Company-Id": companyId
    },
    method: "POST"
  });
}

export async function reprocessRobotsExecution(
  companyId: string,
  executionId: string
): Promise<InternalApiResult<ReprocessRobotsExecutionContract>> {
  return fetchInternal<ReprocessRobotsExecutionContract>(
    `robots/executions/${executionId}/reprocess`,
    {
      headers: {
        "X-FP-Company-Id": companyId
      },
      method: "POST"
    }
  );
}

export async function listAdminAuditLogs(
  scope: AdminAuditScope = "all"
): Promise<InternalApiResult<AdminAuditLogContract[]>> {
  const search = scope === "all" ? "" : `?scope=${scope}`;
  return fetchInternal<AdminAuditLogContract[]>(`admin-console/audit-logs${search}`);
}

export async function listAdminUsers(
  pagination: PaginationParams = {}
): Promise<InternalApiResult<PaginatedContract<AdminUserContract>>> {
  return fetchInternal<PaginatedContract<AdminUserContract>>(
    `admin-console/users${formatPaginationSearch(pagination)}`
  );
}

export async function getAdminUser(id: string): Promise<InternalApiResult<AdminUserContract>> {
  return fetchInternal<AdminUserContract>(`admin-console/users/${id}`);
}

export async function createAdminUser(
  input: CreateAdminUserInput
): Promise<InternalApiResult<AdminCompanyUserContract>> {
  return fetchInternal<AdminCompanyUserContract>("admin-console/users", {
    body: JSON.stringify(input),
    method: "POST"
  });
}

export async function createAdminConsoleUser(
  input: CreateAdminConsoleUserInput
): Promise<InternalApiResult<AdminUserContract>> {
  return fetchInternal<AdminUserContract>("admin-console/users/console", {
    body: JSON.stringify(input),
    method: "POST"
  });
}

export async function resendAdminUserInvite(
  companyId: string,
  userId: string
): Promise<InternalApiResult<ResendAdminUserInviteContract>> {
  return fetchInternal<ResendAdminUserInviteContract>(
    `admin-console/companies/${companyId}/users/${userId}/invite`,
    {
      method: "POST"
    }
  );
}

export async function updateAdminCompanyUserMembership(
  companyId: string,
  userId: string,
  input: UpdateAdminCompanyUserInput
): Promise<InternalApiResult<AdminCompanyUserContract>> {
  return fetchInternal<AdminCompanyUserContract>(
    `admin-console/companies/${companyId}/users/${userId}/membership`,
    {
      body: JSON.stringify(input),
      method: "PATCH"
    }
  );
}

export async function linkAdminCompanySupport(
  companyId: string,
  input: LinkAdminCompanySupportInput
): Promise<InternalApiResult<AdminCompanyUserContract>> {
  return fetchInternal<AdminCompanyUserContract>(`admin-console/companies/${companyId}/support`, {
    body: JSON.stringify(input),
    method: "POST"
  });
}

export async function activateCurrentUserInvite(): Promise<
  InternalApiResult<ActivateAdminUserInviteContract>
> {
  return fetchInternal<ActivateAdminUserInviteContract>("admin-console/users/me/activate-invite", {
    method: "POST"
  });
}

export async function updateAdminUser(
  id: string,
  input: UpdateAdminUserInput
): Promise<InternalApiResult<AdminUserContract>> {
  return fetchInternal<AdminUserContract>(`admin-console/users/${id}`, {
    body: JSON.stringify(input),
    method: "PATCH"
  });
}

export async function grantAdminUserRole(
  companyId: string,
  userId: string,
  input: GrantAdminUserRoleInput
): Promise<InternalApiResult<AdminUserApplicationRoleContract>> {
  return fetchInternal<AdminUserApplicationRoleContract>(
    `admin-console/companies/${companyId}/users/${userId}/roles`,
    {
      body: JSON.stringify(input),
      method: "POST"
    }
  );
}

export async function bulkGrantAdminUserRoles(
  companyId: string,
  userId: string,
  input: BulkGrantAdminUserRolesInput
): Promise<InternalApiResult<BulkGrantAdminUserRolesContract>> {
  return fetchInternal<BulkGrantAdminUserRolesContract>(
    `admin-console/companies/${companyId}/users/${userId}/roles/bulk`,
    {
      body: JSON.stringify(input),
      method: "POST"
    }
  );
}

export async function revokeAdminUserRole(
  companyId: string,
  userId: string,
  input: RevokeAdminUserRoleInput
): Promise<InternalApiResult<RevokeAdminUserRoleContract>> {
  return fetchInternal<RevokeAdminUserRoleContract>(
    `admin-console/companies/${companyId}/users/${userId}/roles/revoke`,
    {
      body: JSON.stringify(input),
      method: "POST"
    }
  );
}

export async function bulkRevokeAdminUserRoles(
  companyId: string,
  userId: string,
  input: BulkRevokeAdminUserRolesInput
): Promise<InternalApiResult<BulkRevokeAdminUserRolesContract>> {
  return fetchInternal<BulkRevokeAdminUserRolesContract>(
    `admin-console/companies/${companyId}/users/${userId}/roles/revoke-bulk`,
    {
      body: JSON.stringify(input),
      method: "POST"
    }
  );
}

async function fetchInternal<T>(
  path: string,
  init: RequestInit = {}
): Promise<InternalApiResult<T>> {
  loadServerEnv();

  const token = process.env.FP_INTERNAL_API_TOKEN?.trim();
  if (!token) {
    return {
      data: null,
      error: "FP_INTERNAL_API_TOKEN nao foi configurado no servidor web."
    };
  }

  const baseUrl = getInternalApiBaseUrl();
  const actor = await requireCurrentUser();
  const response = await fetch(`${baseUrl}/${path}`, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-FP-Internal-Token": token,
      "X-FP-Actor-User-Id": actor.id,
      ...init.headers
    }
  }).catch((): null => {
    return null;
  });

  if (!response) {
    return {
      data: null,
      error: "API interna respondeu 503 fetch failed"
    };
  }

  if (!response.ok) {
    const detail = await readErrorDetail(response);

    return {
      data: null,
      error: [`API interna respondeu ${response.status} ${response.statusText}`.trim(), detail]
        .filter(Boolean)
        .join(": ")
    };
  }

  return {
    data: (await response.json()) as T,
    error: null
  };
}

function getInternalApiBaseUrl(): string {
  const value = process.env.FP_API_INTERNAL_URL?.trim() || DEFAULT_INTERNAL_API_BASE_URL;
  return value.replace(/\/$/, "");
}

function formatPaginationSearch({ page, pageSize, scope }: PaginationParams): string {
  const params = new URLSearchParams();

  if (page) {
    params.set("page", String(page));
  }

  if (pageSize) {
    params.set("pageSize", String(pageSize));
  }

  if (scope && scope !== "all") {
    params.set("scope", scope);
  }

  const search = params.toString();
  return search ? `?${search}` : "";
}

async function readErrorDetail(response: Response): Promise<string | undefined> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await response.json().catch(() => undefined)) as
      | { detail?: unknown; message?: unknown }
      | undefined;
    const detail = typeof body?.detail === "string" ? body.detail : undefined;
    const message = typeof body?.message === "string" ? body.message : undefined;

    return detail ?? message;
  }

  const text = await response.text().catch(() => "");
  return text || undefined;
}
