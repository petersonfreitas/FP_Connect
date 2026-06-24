export type PublicStoreUrlContext = {
  basePath: string;
  host: string | null;
  isCustomDomain: boolean;
  publicSlug: string;
};

export function createFallbackPublicStoreContext(publicSlug: string): PublicStoreUrlContext {
  const normalizedSlug = normalizePublicSlug(publicSlug);

  return {
    basePath: `/l/${encodeURIComponent(normalizedSlug)}`,
    host: null,
    isCustomDomain: false,
    publicSlug: normalizedSlug
  };
}

export function normalizePublicSlug(value: string): string {
  const slug = value.trim().toLowerCase();

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("Slug publico da loja invalido.");
  }

  return slug;
}

export function storeUrl(context: PublicStoreUrlContext, path = "/"): string {
  const normalizedPath = normalizeStorePath(path);
  return normalizedPath === "/" ? context.basePath : `${context.basePath}${normalizedPath}`;
}

export function storeLoginUrl(context: PublicStoreUrlContext, nextPath = storeUrl(context)): string {
  const params = new URLSearchParams({
    next: nextPath
  });

  return `${storeUrl(context, "/entrar")}?${params.toString()}`;
}

export function storeOrderUrl(context: PublicStoreUrlContext, orderNumber: string): string {
  return storeUrl(context, `/pedido/${encodeURIComponent(orderNumber)}`);
}

export function normalizeStoreRedirectPath(
  value: string,
  context: PublicStoreUrlContext
): string {
  const path = value.trim();

  if (!path.startsWith("/") || path.startsWith("//")) {
    return storeUrl(context);
  }

  if (path === context.basePath || path.startsWith(`${context.basePath}/`)) {
    return path;
  }

  return storeUrl(context);
}

function normalizeStorePath(path: string): string {
  const normalized = path.trim();

  if (!normalized || normalized === "/") {
    return "/";
  }

  return normalized.startsWith("/") ? normalized : `/${normalized}`;
}
