import "server-only";

import type { AdminConsoleOverviewContract } from "@fp/types";
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

async function fetchInternal<T>(path: string): Promise<InternalApiResult<T>> {
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
    headers: {
      "X-FP-Internal-Token": token
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
    return {
      data: null,
      error: `API interna respondeu ${response.status} ${response.statusText}`.trim()
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
