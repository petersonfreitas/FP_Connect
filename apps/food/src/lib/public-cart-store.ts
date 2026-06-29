import type { CreateFoodOrderItemInput } from "@fp/types";

export type PublicCartItem = CreateFoodOrderItemInput;

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

  return setPublicCartProduct(publicSlug, {
    itemNote: existingItem?.itemNote ?? null,
    productId,
    quantity
  });
}

export function setPublicCartProduct(
  publicSlug: string,
  input: PublicCartItem
): PublicCartItem[] {
  const currentItems = readPublicCart(publicSlug);
  const nextQuantity = normalizeQuantity(input.quantity);
  const normalizedItem: PublicCartItem = {
    itemNote: normalizeItemNote(input.itemNote),
    productId: input.productId,
    quantity: nextQuantity
  };
  const existingItem = currentItems.find((item) => item.productId === input.productId);
  const nextItems = existingItem
    ? currentItems.map((item) =>
        item.productId === input.productId ? normalizedItem : item
      )
    : [...currentItems, normalizedItem];

  return writePublicCart(
    publicSlug,
    nextItems.filter((item) => item.quantity > 0)
  );
}

export function clearPublicCart(publicSlug: string): PublicCartItem[] {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(getPublicCartStorageKey(publicSlug));
  }

  return [];
}

export function getPublicCartQuantity(items: PublicCartItem[], productId: string): number {
  return items.find((item) => item.productId === productId)?.quantity ?? 0;
}

export function getPublicCartItemCount(items: PublicCartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

function getPublicCartStorageKey(publicSlug: string): string {
  return `fp-food-public-cart:${publicSlug}`;
}

function normalizePublicCartItems(value: unknown): PublicCartItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const byProductId = new Map<string, PublicCartItem>();

  for (const item of value) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const productId = "productId" in item ? String(item.productId ?? "").trim() : "";
    const itemNote = normalizeItemNote("itemNote" in item ? item.itemNote : null);
    const quantity = normalizeQuantity("quantity" in item ? item.quantity : 0);

    if (!productId || quantity <= 0) {
      continue;
    }

    byProductId.set(productId, {
      itemNote,
      productId,
      quantity: (byProductId.get(productId)?.quantity ?? 0) + quantity
    });
  }

  return Array.from(byProductId.values()).map((item) => ({
    itemNote: item.itemNote,
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
