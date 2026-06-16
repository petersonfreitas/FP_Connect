import "server-only";

import type {
  AdminCurrentUserAccessContract,
  FoodStoreContract,
  ModuleAccessContract,
  UpsertFoodStoreInput
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

export async function getCurrentAdminAccess(): Promise<
  InternalApiResult<AdminCurrentUserAccessContract>
> {
  return fetchInternal<AdminCurrentUserAccessContract>("admin-console/users/me/access");
}

export async function getFoodAccess(
  companyId: string
): Promise<InternalApiResult<ModuleAccessContract>> {
  return fetchInternal<ModuleAccessContract>("food/access", {
    headers: {
      "X-FP-Company-Id": companyId
    }
  });
}

export async function getFoodStore(
  companyId: string
): Promise<InternalApiResult<FoodStoreContract>> {
  return fetchInternal<FoodStoreContract>("food/store", {
    headers: {
      "X-FP-Company-Id": companyId
    }
  });
}

export async function upsertFoodStore(
  companyId: string,
  input: UpsertFoodStoreInput
): Promise<InternalApiResult<FoodStoreContract>> {
  return fetchInternal<FoodStoreContract>("food/store", {
    body: JSON.stringify(input),
    headers: {
      "X-FP-Company-Id": companyId
    },
    method: "POST"
  });
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
      error: "FP_INTERNAL_API_TOKEN nao foi configurado no servidor Food."
    };
  }

  const baseUrl = getInternalApiBaseUrl();
  const actor = await requireCurrentUser();
  const response = await fetch(`${baseUrl}/${path}`, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-FP-Actor-User-Id": actor.id,
      "X-FP-Internal-Token": token,
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
