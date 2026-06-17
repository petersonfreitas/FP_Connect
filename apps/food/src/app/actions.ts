"use server";

import { redirect } from "next/navigation";
import type {
  CreateFoodOrderInput,
  FoodCategoryStatus,
  FoodOrderStatus,
  FoodProductStatus,
  FoodStoreStatus,
  UpdateFoodOrderStatusInput,
  UpsertFoodCategoryInput,
  UpsertFoodProductInput,
  UpsertFoodStoreInput
} from "@fp/types";
import {
  createFoodOrder,
  createFoodCategory,
  createFoodProduct,
  createPublicFoodOrder,
  updateFoodCategory,
  updateFoodOrderStatus,
  updateFoodProduct,
  upsertFoodStore
} from "@/lib/internal-api";

const validStatuses = new Set<FoodStoreStatus>([
  "closed",
  "implementation",
  "open",
  "suspended"
]);
const validCategoryStatuses = new Set<FoodCategoryStatus>(["active", "inactive"]);
const validProductStatuses = new Set<FoodProductStatus>([
  "available",
  "hidden",
  "unavailable"
]);
const validOrderStatuses = new Set<FoodOrderStatus>([
  "accepted",
  "cancelled",
  "created",
  "delivered",
  "out_for_delivery",
  "preparing",
  "ready"
]);

export async function saveFoodStoreAction(formData: FormData): Promise<void> {
  const companyId = String(formData.get("companyId") ?? "").trim();

  if (!companyId) {
    redirect("/?error=Empresa%20nao%20informada.");
  }

  const input: UpsertFoodStoreInput = {
    contactPhone: optionalText(formData.get("contactPhone")),
    deliveryNotes: optionalText(formData.get("deliveryNotes")),
    displayName: String(formData.get("displayName") ?? ""),
    preparationTimeMinutes: optionalInteger(formData.get("preparationTimeMinutes")),
    publicSlug: String(formData.get("publicSlug") ?? ""),
    status: normalizeStatus(formData.get("status"))
  };
  const result = await upsertFoodStore(companyId, input);
  const searchCompany = `companyId=${encodeURIComponent(companyId)}`;

  if (result.error) {
    redirect(`/cadastro/loja?${searchCompany}&error=${encodeURIComponent(result.error)}`);
  }

  redirect(`/cadastro/loja?${searchCompany}&saved=1`);
}

export async function saveFoodCategoryAction(formData: FormData): Promise<void> {
  const companyId = requireCompanyId(formData);
  const categoryId = optionalText(formData.get("categoryId"));
  const input: UpsertFoodCategoryInput = {
    description: optionalText(formData.get("description")),
    name: String(formData.get("name") ?? ""),
    slug: optionalText(formData.get("slug")),
    sortOrder: optionalInteger(formData.get("sortOrder")),
    status: normalizeCategoryStatus(formData.get("status"))
  };
  const result = categoryId
    ? await updateFoodCategory(companyId, categoryId, input)
    : await createFoodCategory(companyId, input);

  redirectWithResult(
    "/cadastro/categorias",
    companyId,
    result.error,
    categoryId ? "categoryUpdated" : "categoryCreated"
  );
}

export async function saveFoodProductAction(formData: FormData): Promise<void> {
  const companyId = requireCompanyId(formData);
  const productId = optionalText(formData.get("productId"));
  const input: UpsertFoodProductInput = {
    categoryId: optionalText(formData.get("categoryId")),
    description: optionalText(formData.get("description")),
    imageUrl: optionalText(formData.get("imageUrl")),
    name: String(formData.get("name") ?? ""),
    priceCents: parseMoneyToCents(formData.get("price")),
    slug: optionalText(formData.get("slug")),
    sortOrder: optionalInteger(formData.get("sortOrder")),
    status: normalizeProductStatus(formData.get("status"))
  };
  const result = productId
    ? await updateFoodProduct(companyId, productId, input)
    : await createFoodProduct(companyId, input);

  redirectWithResult(
    "/cadastro/produtos",
    companyId,
    result.error,
    productId ? "productUpdated" : "productCreated"
  );
}

export async function createInternalFoodOrderAction(formData: FormData): Promise<void> {
  const companyId = requireCompanyId(formData);
  const statusFilter = optionalOrderStatusFilter(formData.get("statusFilter"));
  const productIds = formData.getAll("productId").map((value) => String(value));
  const items = productIds
    .map((productId) => ({
      productId,
      quantity: optionalInteger(formData.get(`quantity:${productId}`)) ?? 0
    }))
    .filter((item) => item.quantity > 0);
  const input: CreateFoodOrderInput = {
    customerName: optionalText(formData.get("customerName")),
    customerNote: optionalText(formData.get("customerNote")),
    customerPhone: optionalText(formData.get("customerPhone")),
    items
  };
  const result = await createFoodOrder(companyId, input);

  redirectWithResult(
    "/movimentacao/pedidos",
    companyId,
    result.error,
    "orderCreated",
    { status: statusFilter }
  );
}

export async function updateFoodOrderStatusAction(formData: FormData): Promise<void> {
  const companyId = requireCompanyId(formData);
  const orderId = String(formData.get("orderId") ?? "").trim();
  const statusFilter = optionalOrderStatusFilter(formData.get("statusFilter"));
  const returnTo = normalizeFoodReturnPath(formData.get("returnTo"));

  if (!orderId) {
    redirectWithResult(
      returnTo,
      companyId,
      "Pedido nao informado.",
      "orderUpdated",
      { status: statusFilter }
    );
  }

  const input: UpdateFoodOrderStatusInput = {
    status: normalizeOrderStatus(formData.get("status"))
  };
  const result = await updateFoodOrderStatus(companyId, orderId, input);

  redirectWithResult(
    returnTo,
    companyId,
    result.error,
    "orderUpdated",
    { status: statusFilter }
  );
}

export async function updateFoodOrderStatusInlineAction(input: {
  companyId: string;
  orderId: string;
  status: FoodOrderStatus;
}): Promise<{ error: string | null }> {
  const companyId = input.companyId.trim();
  const orderId = input.orderId.trim();

  if (!companyId) {
    return { error: "Empresa nao informada." };
  }

  if (!orderId) {
    return { error: "Pedido nao informado." };
  }

  if (!validOrderStatuses.has(input.status)) {
    return { error: "Status do pedido invalido." };
  }

  const result = await updateFoodOrderStatus(companyId, orderId, {
    status: input.status
  });

  return { error: result.error };
}

export async function createPublicFoodOrderAction(formData: FormData): Promise<void> {
  const publicSlug = normalizePublicSlug(formData.get("publicSlug"));
  const productIds = formData.getAll("productId").map((value) => String(value));
  const items = productIds
    .map((productId) => ({
      productId,
      quantity: optionalInteger(formData.get(`quantity:${productId}`)) ?? 0
    }))
    .filter((item) => item.quantity > 0);
  const input: CreateFoodOrderInput = {
    customerName: optionalText(formData.get("customerName")),
    customerNote: optionalText(formData.get("customerNote")),
    customerPhone: optionalText(formData.get("customerPhone")),
    items
  };
  const result = await createPublicFoodOrder(publicSlug, input);
  const basePath = `/l/${encodeURIComponent(publicSlug)}`;

  if (result.error || !result.data) {
    redirect(
      `${basePath}?error=${encodeURIComponent(result.error ?? "Pedido nao foi criado.")}`
    );
  }

  redirect(
    `${basePath}/pedido/${encodeURIComponent(result.data.orderNumber)}?created=1`
  );
}

export async function trackPublicFoodOrderAction(formData: FormData): Promise<void> {
  const publicSlug = normalizePublicSlug(formData.get("publicSlug"));
  const orderNumber = String(formData.get("orderNumber") ?? "").trim().toUpperCase();
  const basePath = `/l/${encodeURIComponent(publicSlug)}`;

  if (!orderNumber) {
    redirect(`${basePath}?error=${encodeURIComponent("Informe o numero do pedido.")}`);
  }

  redirect(`${basePath}/pedido/${encodeURIComponent(orderNumber)}`);
}

function requireCompanyId(formData: FormData): string {
  const companyId = String(formData.get("companyId") ?? "").trim();

  if (!companyId) {
    redirect("/?error=Empresa%20nao%20informada.");
  }

  return companyId;
}

function normalizePublicSlug(value: FormDataEntryValue | null): string {
  const slug = String(value ?? "").trim().toLowerCase();

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    redirect("/l/loja-nao-informada?error=Loja%20publica%20invalida.");
  }

  return slug;
}

function redirectWithResult(
  basePath: string,
  companyId: string,
  error: string | null,
  successKey: string,
  extraParams: Record<string, string | undefined> = {}
): never {
  const search = new URLSearchParams({
    companyId
  });

  for (const [key, value] of Object.entries(extraParams)) {
    if (value) {
      search.set(key, value);
    }
  }

  if (error) {
    search.set("error", error);
    redirect(`${basePath}?${search.toString()}`);
  }

  search.set(successKey, "1");
  redirect(`${basePath}?${search.toString()}`);
}

function optionalText(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim();
  return text || null;
}

function optionalInteger(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").trim();

  if (!text) {
    return null;
  }

  return Number.parseInt(text, 10);
}

function normalizeStatus(value: FormDataEntryValue | null): FoodStoreStatus {
  const status = String(value ?? "");

  if (!validStatuses.has(status as FoodStoreStatus)) {
    return "implementation";
  }

  return status as FoodStoreStatus;
}

function normalizeCategoryStatus(value: FormDataEntryValue | null): FoodCategoryStatus {
  const status = String(value ?? "");

  if (!validCategoryStatuses.has(status as FoodCategoryStatus)) {
    return "active";
  }

  return status as FoodCategoryStatus;
}

function normalizeProductStatus(value: FormDataEntryValue | null): FoodProductStatus {
  const status = String(value ?? "");

  if (!validProductStatuses.has(status as FoodProductStatus)) {
    return "available";
  }

  return status as FoodProductStatus;
}

function normalizeOrderStatus(value: FormDataEntryValue | null): FoodOrderStatus {
  const status = String(value ?? "");

  if (!validOrderStatuses.has(status as FoodOrderStatus)) {
    return "created";
  }

  return status as FoodOrderStatus;
}

function optionalOrderStatusFilter(value: FormDataEntryValue | null): FoodOrderStatus | undefined {
  const status = String(value ?? "");

  if (!validOrderStatuses.has(status as FoodOrderStatus)) {
    return undefined;
  }

  return status as FoodOrderStatus;
}

function normalizeFoodReturnPath(value: FormDataEntryValue | null): string {
  const path = String(value ?? "").trim();

  if (path === "/movimentacao/cozinha" || path === "/movimentacao/entregas") {
    return path;
  }

  if (/^\/movimentacao\/pedidos\/[0-9a-fA-F-]{36}$/.test(path)) {
    return path;
  }

  return "/movimentacao/pedidos";
}

function parseMoneyToCents(value: FormDataEntryValue | null): number {
  const normalized = String(value ?? "")
    .trim()
    .replace(/\./g, "")
    .replace(",", ".");
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.round(parsed * 100);
}
