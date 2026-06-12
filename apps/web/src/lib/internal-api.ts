import "server-only";

import type {
  AdminAuditScope,
  AdminAuditLogContract,
  AdminBasicPlanContract,
  AdminCompanyUserAccessContract,
  AdminCompanyApplicationContract,
  AdminCompanyUserContract,
  AdminCompanyContract,
  AdminConsoleOverviewContract,
  AdminCatalogContract,
  AdminContractedModuleContract,
  AdminUserApplicationRoleContract,
  AdminUserContract,
  CreateAdminCompanyInput,
  CreateAdminUserInput,
  GrantAdminUserRoleInput,
  RevokeAdminUserRoleContract,
  RevokeAdminUserRoleInput,
  UpdateAdminCompanyApplicationInput
} from "@fp/types";
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

export async function listAdminCompanies(): Promise<InternalApiResult<AdminCompanyContract[]>> {
  return fetchInternal<AdminCompanyContract[]>("admin-console/companies");
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

export async function listAdminAuditLogs(
  scope: AdminAuditScope = "all"
): Promise<InternalApiResult<AdminAuditLogContract[]>> {
  const search = scope === "all" ? "" : `?scope=${scope}`;
  return fetchInternal<AdminAuditLogContract[]>(`admin-console/audit-logs${search}`);
}

export async function listAdminUsers(): Promise<InternalApiResult<AdminUserContract[]>> {
  return fetchInternal<AdminUserContract[]>("admin-console/users");
}

export async function createAdminUser(
  input: CreateAdminUserInput
): Promise<InternalApiResult<AdminCompanyUserContract>> {
  return fetchInternal<AdminCompanyUserContract>("admin-console/users", {
    body: JSON.stringify(input),
    method: "POST"
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
  const response = await fetch(`${baseUrl}/${path}`, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-FP-Internal-Token": token,
      ...init.headers
    }
  }).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "erro desconhecido";
    return {
      ok: false,
      status: 503,
      statusText: message
    } as Response;
  });

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
