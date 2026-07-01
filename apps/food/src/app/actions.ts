"use server";

import { redirect } from "next/navigation";
import type {
  CreateFoodOrderInput,
  CreateFoodStockEntryInput,
  CreatePublicFoodOrderInput,
  FoodCategoryStatus,
  FoodOrderFulfillmentMethod,
  FoodOrderStatus,
  FoodPaymentMethod,
  FoodPaymentStatus,
  FoodProductStatus,
  FoodCustomerPreferredContactMethod,
  FoodStoreHourKind,
  FoodStoreStatus,
  UpdateFoodOrderPaymentInput,
  UpdateFoodOrderStatusInput,
  UpsertFoodCategoryInput,
  UpsertFoodProductInput,
  UpsertFoodStoreHoursInput,
  UpsertFoodStoreInput
} from "@fp/types";
import {
  createFoodOrder,
  createFoodCategory,
  createFoodProduct,
  createFoodStockEntry,
  createPublicFoodOrder,
  deletePublicFoodCustomerAddress,
  deletePublicFoodCustomerPaymentMethod,
  ensurePublicFoodCustomerStoreAccess,
  savePublicFoodCustomerAddress,
  setPrimaryPublicFoodCustomerAddress,
  setPrimaryPublicFoodCustomerPaymentMethod,
  saveFoodStoreHours,
  updateFoodCategory,
  updateFoodOrderItems,
  updateFoodOrderPayment,
  updateFoodOrderStatus,
  updateFoodProduct,
  uploadFoodProductImage,
  updatePublicFoodCustomerAddress,
  updatePublicFoodCustomerProfile,
  upsertFoodStore
} from "@/lib/internal-api";
import { getCurrentPublicStoreUser } from "@/lib/auth";
import {
  createFallbackPublicStoreContext,
  normalizePublicSlug as normalizeStorePublicSlug,
  storeLoginUrl,
  storeOrderUrl,
  storeUrl
} from "@/lib/public-store-urls";

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
const validPaymentMethods = new Set<FoodPaymentMethod>(["card", "cash", "other", "pix"]);
const validPaymentStatuses = new Set<FoodPaymentStatus>([
  "cancelled",
  "paid",
  "pending"
]);
const validStoreHourKinds = new Set<FoodStoreHourKind>(["delivery", "ordering"]);
const validCustomerContactMethods = new Set<FoodCustomerPreferredContactMethod>([
  "cellphone",
  "email",
  "landline",
  "whatsapp"
]);
const validProductImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const productImageMaxBytes = 3 * 1024 * 1024;

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
    redirect(`/cadastro/loja?${searchCompany}&error=${encodeURIComponent(truncateQueryValue(result.error))}`);
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
  const imageFile = readProductImageFile(formData);
  const removeImage = formData.get("removeImage") === "on";
  const shouldRemoveImage = removeImage && !imageFile;
  const input: UpsertFoodProductInput = {
    categoryId: optionalText(formData.get("categoryId")),
    description: optionalText(formData.get("description")),
    imageUrl: shouldRemoveImage ? null : optionalText(formData.get("imageUrl")),
    kitchenRequired: formData.get("kitchenRequired") !== "false",
    name: String(formData.get("name") ?? ""),
    priceCents: parseMoneyToCents(formData.get("price")),
    slug: optionalText(formData.get("slug")),
    sortOrder: optionalInteger(formData.get("sortOrder")),
    status: normalizeProductStatus(formData.get("status")),
    stockControlEnabled: formData.get("stockControlEnabled") === "on",
    stockMinQuantity: optionalInteger(formData.get("stockMinQuantity")) ?? 0
  };

  if (productId && imageFile) {
    const imageInput = await buildProductImageUploadInput(imageFile);

    if (imageInput.error || !imageInput.data) {
      redirectWithResult(
        "/cadastro/produtos",
        companyId,
        imageInput.error ?? "Imagem do produto invalida.",
        "productUpdated"
      );
    }

    const imageData = imageInput.data;
    const uploadResult = await uploadFoodProductImage(companyId, productId, imageData);

    if (uploadResult.error || !uploadResult.data) {
      redirectWithResult(
        "/cadastro/produtos",
        companyId,
        uploadResult.error ?? "Nao foi possivel enviar a imagem do produto.",
        "productUpdated"
      );
    }

    input.imageUrl = uploadResult.data.imageUrl;
  }

  const result = productId
    ? await updateFoodProduct(companyId, productId, input)
    : await createFoodProduct(companyId, input);

  if (result.error || !result.data) {
    redirectWithResult(
      "/cadastro/produtos",
      companyId,
      result.error,
      productId ? "productUpdated" : "productCreated"
    );
  }

  if (!productId && imageFile) {
    const imageInput = await buildProductImageUploadInput(imageFile);

    if (imageInput.error || !imageInput.data) {
      redirectWithResult(
        "/cadastro/produtos",
        companyId,
        imageInput.error ?? "Imagem do produto invalida.",
        "productCreated"
      );
    }

    const imageData = imageInput.data;
    const uploadResult = await uploadFoodProductImage(companyId, result.data.id, imageData);

    if (uploadResult.error || !uploadResult.data) {
      redirectWithResult(
        "/cadastro/produtos",
        companyId,
        uploadResult.error ?? "Nao foi possivel enviar a imagem do produto.",
        "productCreated"
      );
    }

    const updateResult = await updateFoodProduct(companyId, result.data.id, {
      ...input,
      imageUrl: uploadResult.data.imageUrl
    });

    if (updateResult.error) {
      redirectWithResult("/cadastro/produtos", companyId, updateResult.error, "productCreated");
    }
  }

  redirectWithResult(
    "/cadastro/produtos",
    companyId,
    null,
    productId ? "productUpdated" : "productCreated"
  );
}

export async function createFoodStockEntryAction(formData: FormData): Promise<void> {
  const companyId = requireCompanyId(formData);
  const input: CreateFoodStockEntryInput = {
    batchCode: optionalText(formData.get("batchCode")),
    expiresAt: optionalText(formData.get("expiresAt")),
    invoiceNumber: optionalText(formData.get("invoiceNumber")),
    notes: optionalText(formData.get("notes")),
    productId: String(formData.get("productId") ?? ""),
    quantity: optionalInteger(formData.get("quantity")) ?? 0
  };
  const result = await createFoodStockEntry(companyId, input);

  redirectWithResult(
    "/movimentacao/estoque",
    companyId,
    result.error,
    "stockEntryCreated"
  );
}

export async function saveFoodStoreHoursAction(formData: FormData): Promise<void> {
  const companyId = requireCompanyId(formData);
  const selectedTab = normalizeStoreHourTab(formData.get("tab"));
  const hours: UpsertFoodStoreHoursInput["hours"] = [];

  for (const key of formData.getAll("hourKey")) {
    const normalizedKey = String(key);
    const [kindValue, weekdayValue] = normalizedKey.split(":");
    const kind = normalizeStoreHourKind(kindValue);
    const parsedWeekday = optionalInteger(weekdayValue);
    const isActive = formData.get(`isActive:${normalizedKey}`) === "on";
    const isAllDay = formData.get(`isAllDay:${normalizedKey}`) === "on";
    const opensAt = isAllDay
      ? "00:00"
      : String(formData.get(`opensAt:${normalizedKey}`) ?? "");
    const closesAt = isAllDay
      ? "23:59"
      : String(formData.get(`closesAt:${normalizedKey}`) ?? "");

    if (
      parsedWeekday === null ||
      !Number.isInteger(parsedWeekday) ||
      parsedWeekday < 0 ||
      parsedWeekday > 6
    ) {
      redirectWithResult("/cadastro/horarios", companyId, "Dia da semana invalido.", "hoursSaved");
    }

    const weekday = parsedWeekday;

    if (isActive) {
      hours.push({
        closesAt,
        isActive,
        kind,
        opensAt,
        weekday
      });
    }
  }

  const result = await saveFoodStoreHours(companyId, { hours });

  redirectWithResult("/cadastro/horarios", companyId, result.error, "hoursSaved", {
    tab: selectedTab
  });
}

export async function createInternalFoodOrderAction(formData: FormData): Promise<void> {
  const companyId = requireCompanyId(formData);
  const statusFilter = optionalOrderStatusFilter(formData.get("statusFilter"));
  const returnTo = normalizeFoodReturnPath(formData.get("returnTo"));
  const input: CreateFoodOrderInput = {
    customerName: optionalText(formData.get("customerName")),
    customerNote: optionalText(formData.get("customerNote")),
    customerPhone: optionalText(formData.get("customerPhone")),
    fulfillmentMethod: normalizeCounterFulfillmentMethod(formData.get("fulfillmentMethod")),
    items: parseCounterOrderItems(formData)
  };
  const result = await createFoodOrder(companyId, input);

  redirectWithResult(
    returnTo,
    companyId,
    result.error,
    "orderCreated",
    { status: statusFilter }
  );
}

export async function updateInternalFoodOrderItemsAction(formData: FormData): Promise<void> {
  const companyId = requireCompanyId(formData);
  const orderId = String(formData.get("orderId") ?? "").trim();
  const returnTo = normalizeFoodReturnPath(formData.get("returnTo"));

  if (!orderId) {
    redirectWithResult(returnTo, companyId, "Pedido nao informado.", "orderUpdated");
  }

  const input: CreateFoodOrderInput = {
    customerName: optionalText(formData.get("customerName")),
    customerNote: optionalText(formData.get("customerNote")),
    customerPhone: optionalText(formData.get("customerPhone")),
    fulfillmentMethod: normalizeCounterFulfillmentMethod(formData.get("fulfillmentMethod")),
    items: parseCounterOrderItems(formData)
  };
  const result = await updateFoodOrderItems(companyId, orderId, input);

  redirectWithResult(returnTo, companyId, result.error, "orderUpdated");
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

export async function updateFoodOrderPaymentAction(formData: FormData): Promise<void> {
  const companyId = requireCompanyId(formData);
  const orderId = String(formData.get("orderId") ?? "").trim();
  const returnTo = normalizeFoodReturnPath(formData.get("returnTo"));

  if (!orderId) {
    redirectWithResult(returnTo, companyId, "Pedido nao informado.", "paymentUpdated");
  }

  const input: UpdateFoodOrderPaymentInput = {
    paymentMethod: optionalPaymentMethod(formData.get("paymentMethod")),
    paymentNote: optionalText(formData.get("paymentNote")),
    paymentStatus: normalizePaymentStatus(formData.get("paymentStatus"))
  };
  const result = await updateFoodOrderPayment(companyId, orderId, input);

  redirectWithResult(returnTo, companyId, result.error, "paymentUpdated");
}

export async function finalizeCounterFoodOrderPaymentAction(formData: FormData): Promise<void> {
  const companyId = requireCompanyId(formData);
  const orderId = String(formData.get("orderId") ?? "").trim();
  const returnTo = normalizeFoodReturnPath(formData.get("returnTo"));

  if (!orderId) {
    redirectWithResult(returnTo, companyId, "Pedido nao informado.", "paymentUpdated");
  }

  const paymentResult = await updateFoodOrderPayment(companyId, orderId, {
    paymentMethod: optionalPaymentMethod(formData.get("paymentMethod")),
    paymentNote: optionalText(formData.get("paymentNote")),
    paymentStatus: "paid"
  });

  if (paymentResult.error) {
    redirectWithResult(returnTo, companyId, paymentResult.error, "paymentUpdated");
  }

  const statusResult = await updateFoodOrderStatus(companyId, orderId, {
    status: "delivered"
  });

  redirectWithResult(returnTo, companyId, statusResult.error, "paymentUpdated");
}

export async function createPublicFoodOrderAction(formData: FormData): Promise<void> {
  const publicSlug = normalizePublicSlug(formData.get("publicSlug"));
  const storeContext = createFallbackPublicStoreContext(publicSlug);
  const currentUser = await getCurrentPublicStoreUser(publicSlug);
  const basePath = storeUrl(storeContext);

  if (!currentUser) {
    redirect(storeLoginUrl(storeContext, basePath));
  }

  const customerSessionResult = await ensurePublicFoodCustomerStoreAccess(publicSlug, {
    authUserId: currentUser.id,
    email: currentUser.email
  });

  if (customerSessionResult.error) {
    redirect(
      `${basePath}?error=${encodeURIComponent(
        truncateQueryValue(customerSessionResult.error)
      )}`
    );
  }

  if (!customerSessionResult.data?.isCompleteForCheckout) {
    redirect(
      `${storeUrl(storeContext, "/conta")}?error=${encodeURIComponent(
        truncateQueryValue("Complete seu cadastro antes de finalizar o pedido.")
      )}`
    );
  }

  const productIds = formData.getAll("productId").map((value) => String(value));
  const items = productIds
    .map((productId) => ({
      productId,
      quantity: optionalInteger(formData.get(`quantity:${productId}`)) ?? 0
    }))
    .filter((item) => item.quantity > 0);
  const input: CreatePublicFoodOrderInput = {
    authUserId: currentUser.id,
    customerName: customerSessionResult.data.customer.fullName,
    deliveryAddressId: optionalText(formData.get("deliveryAddressId")),
    email: currentUser.email,
    fulfillmentMethod: formData.get("fulfillmentMethod") === "pickup" ? "pickup" : "delivery",
    customerNote: optionalText(formData.get("customerNote")),
    customerPhone: customerSessionResult.data.primaryPhone?.phoneE164 ?? null,
    items
  };
  const result = await createPublicFoodOrder(publicSlug, input);

  if (result.error || !result.data) {
    redirect(
      `${basePath}?error=${encodeURIComponent(
        truncateQueryValue(result.error ?? "Pedido nao foi criado.")
      )}`
    );
  }

  redirect(
    `${storeOrderUrl(storeContext, result.data.orderNumber)}?created=1`
  );
}

export async function trackPublicFoodOrderAction(formData: FormData): Promise<void> {
  const publicSlug = normalizePublicSlug(formData.get("publicSlug"));
  const storeContext = createFallbackPublicStoreContext(publicSlug);
  const orderNumber = String(formData.get("orderNumber") ?? "").trim().toUpperCase();
  const basePath = storeUrl(storeContext);

  if (!orderNumber) {
    redirect(`${basePath}?error=${encodeURIComponent(truncateQueryValue("Informe o numero do pedido."))}`);
  }

  redirect(storeOrderUrl(storeContext, orderNumber));
}

export async function savePublicCustomerProfileAction(formData: FormData): Promise<void> {
  const publicSlug = normalizePublicSlug(formData.get("publicSlug"));
  const storeContext = createFallbackPublicStoreContext(publicSlug);
  const accountPath = storeUrl(storeContext, "/conta");
  const currentUser = await getCurrentPublicStoreUser(publicSlug);

  if (!currentUser) {
    redirect(storeLoginUrl(storeContext, accountPath));
  }

  const result = await updatePublicFoodCustomerProfile(publicSlug, {
    acceptedPrivacy: formData.get("acceptedPrivacy") === "on",
    acceptedTerms: formData.get("acceptedTerms") === "on",
    authUserId: currentUser.id,
    email: currentUser.email,
    fullName: String(formData.get("fullName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    preferredContactMethod: normalizeCustomerContactMethod(
      formData.get("preferredContactMethod")
    )
  });

  if (result.error) {
    redirect(`${accountPath}?error=${encodeURIComponent(truncateQueryValue(result.error))}`);
  }

  redirect(`${accountPath}?saved=1`);
}

export async function savePublicCustomerAddressAction(formData: FormData): Promise<void> {
  const publicSlug = normalizePublicSlug(formData.get("publicSlug"));
  const storeContext = createFallbackPublicStoreContext(publicSlug);
  const accountPath = storeUrl(storeContext, "/conta");
  const currentUser = await getCurrentPublicStoreUser(publicSlug);

  if (!currentUser) {
    redirect(storeLoginUrl(storeContext, accountPath));
  }

  const result = await savePublicFoodCustomerAddress(
    publicSlug,
    buildPublicCustomerAddressInput(formData, currentUser)
  );

  if (result.error) {
    redirect(`${accountPath}?error=${encodeURIComponent(truncateQueryValue(result.error))}`);
  }

  redirect(`${accountPath}?addressSaved=1`);
}

export async function updatePublicCustomerAddressAction(formData: FormData): Promise<void> {
  const publicSlug = normalizePublicSlug(formData.get("publicSlug"));
  const addressId = String(formData.get("addressId") ?? "").trim();
  const storeContext = createFallbackPublicStoreContext(publicSlug);
  const accountPath = storeUrl(storeContext, "/conta");
  const currentUser = await getCurrentPublicStoreUser(publicSlug);

  if (!currentUser) {
    redirect(storeLoginUrl(storeContext, accountPath));
  }

  if (!addressId) {
    redirect(`${accountPath}?error=${encodeURIComponent("Endereco nao informado.")}`);
  }

  const result = await updatePublicFoodCustomerAddress(
    publicSlug,
    addressId,
    buildPublicCustomerAddressInput(formData, currentUser)
  );

  if (result.error) {
    redirect(`${accountPath}?error=${encodeURIComponent(truncateQueryValue(result.error))}`);
  }

  redirect(`${accountPath}?addressUpdated=1`);
}

export async function deletePublicCustomerAddressAction(formData: FormData): Promise<void> {
  const publicSlug = normalizePublicSlug(formData.get("publicSlug"));
  const addressId = String(formData.get("addressId") ?? "").trim();
  const storeContext = createFallbackPublicStoreContext(publicSlug);
  const accountPath = storeUrl(storeContext, "/conta");
  const currentUser = await getCurrentPublicStoreUser(publicSlug);

  if (!currentUser) {
    redirect(storeLoginUrl(storeContext, accountPath));
  }

  if (!addressId) {
    redirect(`${accountPath}?error=${encodeURIComponent("Endereco nao informado.")}`);
  }

  const result = await deletePublicFoodCustomerAddress(publicSlug, addressId, {
    authUserId: currentUser.id,
    email: currentUser.email
  });

  if (result.error) {
    redirect(`${accountPath}?error=${encodeURIComponent(truncateQueryValue(result.error))}`);
  }

  redirect(`${accountPath}?addressDeleted=1`);
}

export async function setPublicCustomerPrimaryAddressAction(
  formData: FormData
): Promise<void> {
  const publicSlug = normalizePublicSlug(formData.get("publicSlug"));
  const addressId = String(formData.get("addressId") ?? "").trim();
  const storeContext = createFallbackPublicStoreContext(publicSlug);
  const accountPath = storeUrl(storeContext, "/conta");
  const currentUser = await getCurrentPublicStoreUser(publicSlug);

  if (!currentUser) {
    redirect(storeLoginUrl(storeContext, accountPath));
  }

  if (!addressId) {
    redirect(`${accountPath}?error=${encodeURIComponent("Endereco nao informado.")}`);
  }

  const result = await setPrimaryPublicFoodCustomerAddress(publicSlug, addressId, {
    authUserId: currentUser.id,
    email: currentUser.email
  });

  if (result.error) {
    redirect(`${accountPath}?error=${encodeURIComponent(truncateQueryValue(result.error))}`);
  }

  redirect(`${accountPath}?addressPrimary=1`);
}

export async function setPublicCustomerPrimaryPaymentMethodAction(
  formData: FormData
): Promise<void> {
  const publicSlug = normalizePublicSlug(formData.get("publicSlug"));
  const paymentMethodId = String(formData.get("paymentMethodId") ?? "").trim();
  const storeContext = createFallbackPublicStoreContext(publicSlug);
  const accountPath = storeUrl(storeContext, "/conta");
  const currentUser = await getCurrentPublicStoreUser(publicSlug);

  if (!currentUser) {
    redirect(storeLoginUrl(storeContext, accountPath));
  }

  if (!paymentMethodId) {
    redirect(`${accountPath}?error=${encodeURIComponent("Cartao nao informado.")}`);
  }

  const result = await setPrimaryPublicFoodCustomerPaymentMethod(publicSlug, paymentMethodId, {
    authUserId: currentUser.id,
    email: currentUser.email
  });

  if (result.error) {
    redirect(`${accountPath}?error=${encodeURIComponent(truncateQueryValue(result.error))}`);
  }

  redirect(`${accountPath}?paymentMethodPrimary=1`);
}

export async function deletePublicCustomerPaymentMethodAction(
  formData: FormData
): Promise<void> {
  const publicSlug = normalizePublicSlug(formData.get("publicSlug"));
  const paymentMethodId = String(formData.get("paymentMethodId") ?? "").trim();
  const storeContext = createFallbackPublicStoreContext(publicSlug);
  const accountPath = storeUrl(storeContext, "/conta");
  const currentUser = await getCurrentPublicStoreUser(publicSlug);

  if (!currentUser) {
    redirect(storeLoginUrl(storeContext, accountPath));
  }

  if (!paymentMethodId) {
    redirect(`${accountPath}?error=${encodeURIComponent("Cartao nao informado.")}`);
  }

  const result = await deletePublicFoodCustomerPaymentMethod(publicSlug, paymentMethodId, {
    authUserId: currentUser.id,
    email: currentUser.email
  });

  if (result.error) {
    redirect(`${accountPath}?error=${encodeURIComponent(truncateQueryValue(result.error))}`);
  }

  redirect(`${accountPath}?paymentMethodDeleted=1`);
}

function requireCompanyId(formData: FormData): string {
  const companyId = String(formData.get("companyId") ?? "").trim();

  if (!companyId) {
    redirect("/?error=Empresa%20nao%20informada.");
  }

  return companyId;
}

function normalizePublicSlug(value: FormDataEntryValue | null): string {
  try {
    return normalizeStorePublicSlug(String(value ?? ""));
  } catch {
    redirect("/l/loja-nao-informada?error=Loja%20publica%20invalida.");
  }
}

function buildPublicCustomerAddressInput(
  formData: FormData,
  currentUser: { email: string | null; id: string }
) {
  return {
    authUserId: currentUser.id,
    city: String(formData.get("city") ?? ""),
    complement: optionalText(formData.get("complement")),
    district: optionalText(formData.get("district")),
    email: currentUser.email,
    isPrimary: formData.get("isPrimary") === "on",
    label: optionalText(formData.get("label")),
    number: String(formData.get("number") ?? ""),
    postalCode: optionalText(formData.get("postalCode")),
    reference: optionalText(formData.get("reference")),
    state: String(formData.get("state") ?? ""),
    street: String(formData.get("street") ?? "")
  };
}

function readProductImageFile(formData: FormData): File | null {
  const value = formData.get("imageFile");

  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  return value;
}

async function buildProductImageUploadInput(file: File): Promise<
  | {
      data: {
        contentBase64: string;
        contentType: string;
        fileName: string;
      };
      error: null;
    }
  | {
      data: null;
      error: string;
    }
> {
  if (!validProductImageTypes.has(file.type)) {
    return {
      data: null,
      error: "Imagem do produto deve ser JPG, PNG ou WEBP."
    };
  }

  if (file.size > productImageMaxBytes) {
    return {
      data: null,
      error: "Imagem do produto deve ter no maximo 3 MB."
    };
  }

  return {
    data: {
      contentBase64: Buffer.from(await file.arrayBuffer()).toString("base64"),
      contentType: file.type,
      fileName: file.name
    },
    error: null
  };
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
    search.set("error", truncateQueryValue(error));
    redirect(`${basePath}?${search.toString()}`);
  }

  search.set(successKey, "1");
  redirect(`${basePath}?${search.toString()}`);
}

function truncateQueryValue(value: string): string {
  return value.length > 500 ? `${value.slice(0, 497)}...` : value;
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

function parseCounterOrderItems(formData: FormData): CreateFoodOrderInput["items"] {
  const lineIds = formData.getAll("cartLineId").map((value) => String(value));
  const productIds =
    lineIds.length > 0 ? lineIds : formData.getAll("productId").map((value) => String(value));

  return productIds
    .map((id) => {
      const productId = String(
        lineIds.length > 0 ? formData.get(`productId:${id}`) : id
      ).trim();

      return {
        itemNote: optionalText(formData.get(`itemNote:${id}`)),
        orderItemId: optionalText(formData.get(`orderItemId:${id}`)),
        productId,
        quantity: optionalInteger(formData.get(`quantity:${id}`)) ?? 0
      };
    })
    .filter((item) => item.productId)
    .filter((item) => item.quantity > 0);
}

function normalizeCounterFulfillmentMethod(
  value: FormDataEntryValue | null
): FoodOrderFulfillmentMethod {
  return String(value ?? "") === "delivery" ? "delivery" : "dine_in";
}

function normalizePaymentStatus(value: FormDataEntryValue | null): FoodPaymentStatus {
  const status = String(value ?? "");

  if (!validPaymentStatuses.has(status as FoodPaymentStatus)) {
    return "pending";
  }

  return status as FoodPaymentStatus;
}

function normalizeCustomerContactMethod(
  value: FormDataEntryValue | null
): FoodCustomerPreferredContactMethod {
  const method = String(value ?? "");

  if (!validCustomerContactMethods.has(method as FoodCustomerPreferredContactMethod)) {
    return "whatsapp";
  }

  return method as FoodCustomerPreferredContactMethod;
}

function normalizeStoreHourKind(value: string): FoodStoreHourKind {
  if (!validStoreHourKinds.has(value as FoodStoreHourKind)) {
    redirect("/cadastro/horarios?error=Tipo%20de%20horario%20invalido.");
  }

  return value as FoodStoreHourKind;
}

function normalizeStoreHourTab(value: FormDataEntryValue | null): FoodStoreHourKind {
  const tab = String(value ?? "");

  if (tab === "delivery") {
    return "delivery";
  }

  return "ordering";
}

function optionalPaymentMethod(value: FormDataEntryValue | null): FoodPaymentMethod | null {
  const method = String(value ?? "");

  if (!validPaymentMethods.has(method as FoodPaymentMethod)) {
    return null;
  }

  return method as FoodPaymentMethod;
}

function normalizeFoodReturnPath(value: FormDataEntryValue | null): string {
  const path = String(value ?? "").trim();

  if (
    path === "/movimentacao/atendimento" ||
    path === "/movimentacao/cozinha" ||
    path === "/movimentacao/entregas"
  ) {
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
