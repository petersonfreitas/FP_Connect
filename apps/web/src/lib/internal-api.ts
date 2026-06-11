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
