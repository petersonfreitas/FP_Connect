"use server";

import { redirect } from "next/navigation";
import {
  signInPublicStoreWithPassword,
  signInWithPassword,
  signOut,
  signOutPublicStore
} from "./auth";
import { getCurrentAdminAccess } from "./internal-api";
import {
  createFallbackPublicStoreContext,
  normalizePublicSlug,
  normalizeStoreRedirectPath,
  storeUrl
} from "./public-store-urls";

export async function signInAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = normalizeRedirectPath(String(formData.get("next") ?? ""));
  const result = await signInWithPassword(email, password);

  if (!result.ok) {
    const nextParam = next ? `&next=${encodeURIComponent(next)}` : "";
    redirect(`/login?error=${encodeURIComponent(result.error)}${nextParam}`);
  }

  const accessResult = await getCurrentAdminAccess();

  if (!hasFoodPortalAccess(accessResult.data)) {
    await signOut();
    const nextParam = next ? `&next=${encodeURIComponent(next)}` : "";
    const error =
      "Este usuario nao possui acesso ao portal operacional do FP Food. Use o login da vitrine publica da loja correta.";
    redirect(`/login?error=${encodeURIComponent(error)}${nextParam}`);
  }

  redirect(next || "/");
}

export async function signOutAction(): Promise<void> {
  await signOut();
  redirect("/login");
}

export async function publicCustomerSignInAction(formData: FormData): Promise<void> {
  const publicSlug = String(formData.get("publicSlug") ?? "");
  const storeContext = createFallbackPublicStoreContext(normalizePublicSlug(publicSlug));
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = normalizeStoreRedirectPath(String(formData.get("next") ?? ""), storeContext);
  const result = await signInPublicStoreWithPassword(storeContext.publicSlug, email, password);

  if (!result.ok) {
    const params = new URLSearchParams({
      error: result.error,
      next
    });

    redirect(`${storeUrl(storeContext, "/entrar")}?${params.toString()}`);
  }

  redirect(next);
}

export async function publicCustomerSignOutAction(formData: FormData): Promise<void> {
  const publicSlug = String(formData.get("publicSlug") ?? "");
  const storeContext = createFallbackPublicStoreContext(normalizePublicSlug(publicSlug));

  await signOutPublicStore(storeContext.publicSlug);
  redirect(`${storeUrl(storeContext)}?signedOut=1`);
}

function normalizeRedirectPath(value: string): string {
  const path = value.trim();

  if (!path.startsWith("/") || path.startsWith("//")) {
    return "";
  }

  if (path.startsWith("/login")) {
    return "";
  }

  return path;
}

function hasFoodPortalAccess(
  access: Awaited<ReturnType<typeof getCurrentAdminAccess>>["data"]
): boolean {
  return Boolean(
    access?.companies.some((companyAccess) =>
      companyAccess.modules.some((moduleAccess) => moduleAccess.applicationKey === "food")
    )
  );
}
