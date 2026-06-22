import "server-only";

import type {
  AdminCurrentUserAccessContract,
  CreatePublicFoodCheckoutContract,
  CreatePublicFoodCheckoutInput,
  CreateFoodOrderInput,
  FoodCategoryContract,
  FoodDashboardContract,
  FoodMenuContract,
  FoodOrderContract,
  FoodOrderDetailContract,
  FoodPublicCheckoutContract,
  FoodOrderStatus,
  FoodProductContract,
  FoodStoreContract,
  ModuleAccessContract,
  PaginatedContract,
  RetryPublicFoodPaymentInput,
  UpdateFoodOrderPaymentInput,
  UpdateFoodOrderStatusInput,
  UpsertFoodCategoryInput,
  UpsertFoodProductInput,
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

type PaginationParams = {
  page?: number;
  pageSize?: number;
  status?: FoodOrderStatus;
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

export async function listFoodCategories(
  companyId: string,
  pagination: PaginationParams = {}
): Promise<InternalApiResult<PaginatedContract<FoodCategoryContract>>> {
  return fetchInternal<PaginatedContract<FoodCategoryContract>>(
    `food/categories${formatPaginationSearch(pagination)}`,
    {
      headers: {
        "X-FP-Company-Id": companyId
      }
    }
  );
}

export async function listAllFoodCategories(
  companyId: string
): Promise<InternalApiResult<FoodCategoryContract[]>> {
  const result = await listFoodCategories(companyId, {
    page: 1,
    pageSize: 100
  });

  if (result.error || !result.data) {
    return result;
  }

  return {
    data: result.data.items,
    error: null
  };
}

export async function listFoodProducts(
  companyId: string,
  pagination: PaginationParams = {}
): Promise<InternalApiResult<PaginatedContract<FoodProductContract>>> {
  return fetchInternal<PaginatedContract<FoodProductContract>>(
    `food/products${formatPaginationSearch(pagination)}`,
    {
      headers: {
        "X-FP-Company-Id": companyId
      }
    }
  );
}

export async function listAllFoodProducts(
  companyId: string
): Promise<InternalApiResult<FoodProductContract[]>> {
  const result = await listFoodProducts(companyId, {
    page: 1,
    pageSize: 100
  });

  if (result.error || !result.data) {
    return result;
  }

  return {
    data: result.data.items,
    error: null
  };
}

export async function createFoodCategory(
  companyId: string,
  input: UpsertFoodCategoryInput
): Promise<InternalApiResult<FoodCategoryContract>> {
  return fetchInternal<FoodCategoryContract>("food/categories", {
    body: JSON.stringify(input),
    headers: {
      "X-FP-Company-Id": companyId
    },
    method: "POST"
  });
}

export async function updateFoodCategory(
  companyId: string,
  categoryId: string,
  input: UpsertFoodCategoryInput
): Promise<InternalApiResult<FoodCategoryContract>> {
  return fetchInternal<FoodCategoryContract>(`food/categories/${categoryId}`, {
    body: JSON.stringify(input),
    headers: {
      "X-FP-Company-Id": companyId
    },
    method: "PATCH"
  });
}

export async function createFoodProduct(
  companyId: string,
  input: UpsertFoodProductInput
): Promise<InternalApiResult<FoodProductContract>> {
  return fetchInternal<FoodProductContract>("food/products", {
    body: JSON.stringify(input),
    headers: {
      "X-FP-Company-Id": companyId
    },
    method: "POST"
  });
}

export async function updateFoodProduct(
  companyId: string,
  productId: string,
  input: UpsertFoodProductInput
): Promise<InternalApiResult<FoodProductContract>> {
  return fetchInternal<FoodProductContract>(`food/products/${productId}`, {
    body: JSON.stringify(input),
    headers: {
      "X-FP-Company-Id": companyId
    },
    method: "PATCH"
  });
}

export async function getFoodMenu(
  companyId: string
): Promise<InternalApiResult<FoodMenuContract>> {
  return fetchInternal<FoodMenuContract>("food/menu", {
    headers: {
      "X-FP-Company-Id": companyId
    }
  });
}

export async function getFoodDashboard(
  companyId: string
): Promise<InternalApiResult<FoodDashboardContract>> {
  return fetchInternal<FoodDashboardContract>("food/dashboard", {
    headers: {
      "X-FP-Company-Id": companyId
    }
  });
}

export async function getPublicFoodMenu(
  publicSlug: string
): Promise<InternalApiResult<FoodMenuContract>> {
  return fetchPublicInternal<FoodMenuContract>(
    `food/public/stores/${encodeURIComponent(publicSlug)}/menu`
  );
}

export async function getPublicFoodCheckout(
  publicSlug: string
): Promise<InternalApiResult<FoodPublicCheckoutContract>> {
  return fetchPublicInternal<FoodPublicCheckoutContract>(
    `food/public/stores/${encodeURIComponent(publicSlug)}/checkout`
  );
}

export async function listFoodOrders(
  companyId: string,
  pagination: PaginationParams = {}
): Promise<InternalApiResult<PaginatedContract<FoodOrderContract>>> {
  return fetchInternal<PaginatedContract<FoodOrderContract>>(
    `food/orders${formatPaginationSearch(pagination)}`,
    {
      headers: {
        "X-FP-Company-Id": companyId
      }
    }
  );
}

export async function createFoodOrder(
  companyId: string,
  input: CreateFoodOrderInput
): Promise<InternalApiResult<FoodOrderContract>> {
  return fetchInternal<FoodOrderContract>("food/orders", {
    body: JSON.stringify(input),
    headers: {
      "X-FP-Company-Id": companyId
    },
    method: "POST"
  });
}

export async function getFoodOrderDetail(
  companyId: string,
  orderId: string
): Promise<InternalApiResult<FoodOrderDetailContract>> {
  return fetchInternal<FoodOrderDetailContract>(`food/orders/${orderId}`, {
    headers: {
      "X-FP-Company-Id": companyId
    }
  });
}

export async function createPublicFoodOrder(
  publicSlug: string,
  input: CreateFoodOrderInput
): Promise<InternalApiResult<FoodOrderContract>> {
  return fetchPublicInternal<FoodOrderContract>(
    `food/public/stores/${encodeURIComponent(publicSlug)}/orders`,
    {
      body: JSON.stringify(input),
      method: "POST"
    }
  );
}

export async function createPublicFoodCheckout(
  publicSlug: string,
  input: CreatePublicFoodCheckoutInput
): Promise<InternalApiResult<CreatePublicFoodCheckoutContract>> {
  return fetchPublicInternal<CreatePublicFoodCheckoutContract>(
    `food/public/stores/${encodeURIComponent(publicSlug)}/checkout`,
    {
      body: JSON.stringify(input),
      method: "POST"
    }
  );
}

export async function retryPublicFoodPayment(
  publicSlug: string,
  orderNumber: string,
  input: RetryPublicFoodPaymentInput
): Promise<InternalApiResult<CreatePublicFoodCheckoutContract>> {
  return fetchPublicInternal<CreatePublicFoodCheckoutContract>(
    `food/public/stores/${encodeURIComponent(publicSlug)}/orders/${encodeURIComponent(
      orderNumber
    )}/checkout`,
    {
      body: JSON.stringify(input),
      method: "POST"
    }
  );
}

export async function getPublicFoodOrder(
  publicSlug: string,
  orderNumber: string
): Promise<InternalApiResult<FoodOrderContract>> {
  return fetchPublicInternal<FoodOrderContract>(
    `food/public/stores/${encodeURIComponent(publicSlug)}/orders/${encodeURIComponent(orderNumber)}`
  );
}

export async function updateFoodOrderStatus(
  companyId: string,
  orderId: string,
  input: UpdateFoodOrderStatusInput
): Promise<InternalApiResult<FoodOrderContract>> {
  return fetchInternal<FoodOrderContract>(`food/orders/${orderId}/status`, {
    body: JSON.stringify(input),
    headers: {
      "X-FP-Company-Id": companyId
    },
    method: "PATCH"
  });
}

export async function updateFoodOrderPayment(
  companyId: string,
  orderId: string,
  input: UpdateFoodOrderPaymentInput
): Promise<InternalApiResult<FoodOrderContract>> {
  return fetchInternal<FoodOrderContract>(`food/orders/${orderId}/payment`, {
    body: JSON.stringify(input),
    headers: {
      "X-FP-Company-Id": companyId
    },
    method: "PATCH"
  });
}

async function fetchPublicInternal<T>(
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
  const response = await fetch(`${baseUrl}/${path}`, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
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
  const baseUrl = value.replace(/\/+$/, "");
  return baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;
}

function formatPaginationSearch({ page, pageSize, status }: PaginationParams): string {
  const params = new URLSearchParams();

  if (page) {
    params.set("page", String(page));
  }

  if (pageSize) {
    params.set("pageSize", String(pageSize));
  }

  if (status) {
    params.set("status", status);
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

    return truncateErrorDetail(detail ?? message);
  }

  const text = await response.text().catch(() => "");
  return truncateErrorDetail(text);
}

function truncateErrorDetail(value: string | undefined): string | undefined {
  const normalized = value?.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return undefined;
  }

  return normalized.length > 500 ? `${normalized.slice(0, 497)}...` : normalized;
}
