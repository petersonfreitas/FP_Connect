import type { CreateFoodOrderItemInput } from "@fp/types";

export type PublicCartItem = CreateFoodOrderItemInput & {
  lineId: string;
};

const maxCartQuantity = 99;

export function readPublicCart(publicSlug: string): PublicCartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(getPublicCartStorageKey(publicSlug));

  if (!raw) {
    return [];
  }

  try {
    return normalizePublicCartItems(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function writePublicCart(publicSlug: string, items: PublicCartItem[]): PublicCartItem[] {
  const normalized = normalizePublicCartItems(items);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(getPublicCartStorageKey(publicSlug), JSON.stringify(normalized));
  }

  return normalized;
}

export function setPublicCartProductQuantity(
  publicSlug: string,
  productId: string,
  quantity: number
): PublicCartItem[] {
  const currentItems = readPublicCart(publicSlug);
  const existingItem = currentItems.find((item) => item.productId === productId);

  return setPublicCartLineQuantity(
    publicSlug,
    existingItem?.lineId ?? createCartLineId(productId),
    quantity,
    {
      itemNote: existingItem?.itemNote ?? null,
      productId
    }
  );
}

export function addPublicCartProduct(
  publicSlug: string,
  input: CreateFoodOrderItemInput
): PublicCartItem[] {
  const currentItems = readPublicCart(publicSlug);
  const normalizedNote = normalizeItemNote(input.itemNote);
  const matchingItem = currentItems.find(
    (item) => item.productId === input.productId && item.itemNote === normalizedNote
  );

  if (matchingItem) {
    return setPublicCartLineQuantity(
      publicSlug,
      matchingItem.lineId,
      matchingItem.quantity + input.quantity
    );
  }

  return writePublicCart(publicSlug, [
    ...currentItems,
    {
      itemNote: normalizedNote,
      lineId: createCartLineId(input.productId),
      productId: input.productId,
      quantity: input.quantity
    }
  ]);
}

export function setPublicCartLineQuantity(
  publicSlug: string,
  lineId: string,
  quantity: number,
  fallbackItem?: Pick<PublicCartItem, "itemNote" | "productId">
): PublicCartItem[] {
  const currentItems = readPublicCart(publicSlug);
  const nextQuantity = normalizeQuantity(quantity);
  const existingItem = currentItems.find((item) => item.lineId === lineId);
  const baseItem = existingItem ?? fallbackItem;

  if (!baseItem) {
    return currentItems;
  }

  const normalizedItem: PublicCartItem = {
    itemNote: normalizeItemNote(baseItem.itemNote),
    lineId,
    productId: baseItem.productId,
    quantity: nextQuantity
  };
  const nextItems = existingItem
    ? currentItems.map((item) => (item.lineId === lineId ? normalizedItem : item))
    : [...currentItems, normalizedItem];

  return writePublicCart(
    publicSlug,
    nextItems.filter((item) => item.quantity > 0)
  );
}

export function setPublicCartProduct(
  publicSlug: string,
  input: PublicCartItem
): PublicCartItem[] {
  return setPublicCartLineQuantity(publicSlug, input.lineId, input.quantity, {
    itemNote: input.itemNote ?? null,
    productId: input.productId
  });
}

export function clearPublicCart(publicSlug: string): PublicCartItem[] {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(getPublicCartStorageKey(publicSlug));
  }

  return [];
}

export function getPublicCartQuantity(
  items: Array<Pick<PublicCartItem, "productId" | "quantity">>,
  productId: string
): number {
  return items
    .filter((item) => item.productId === productId)
    .reduce((sum, item) => sum + item.quantity, 0);
}

export function getPublicCartItemCount(
  items: Array<Pick<PublicCartItem, "quantity">>
): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

function getPublicCartStorageKey(publicSlug: string): string {
  return `fp-food-public-cart:${publicSlug}`;
}

function normalizePublicCartItems(value: unknown): PublicCartItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalizedItems: PublicCartItem[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const productId = "productId" in item ? String(item.productId ?? "").trim() : "";
    const itemNote = normalizeItemNote("itemNote" in item ? item.itemNote : null);
    const lineId =
      normalizeLineId("lineId" in item ? item.lineId : null) ?? createCartLineId(productId);
    const quantity = normalizeQuantity("quantity" in item ? item.quantity : 0);

    if (!productId || quantity <= 0) {
      continue;
    }

    normalizedItems.push({
      itemNote,
      lineId,
      productId,
      quantity
    });
  }

  return normalizedItems.map((item) => ({
    itemNote: item.itemNote,
    lineId: item.lineId,
    productId: item.productId,
    quantity: Math.min(item.quantity, maxCartQuantity)
  }));
}

function normalizeQuantity(value: unknown): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.min(Math.max(Math.trunc(parsed), 0), maxCartQuantity);
}

function normalizeItemNote(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().slice(0, 300);

  return normalized.length > 0 ? normalized : null;
}

function normalizeLineId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized.slice(0, 80) : null;
}

function createCartLineId(productId: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${productId}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}
