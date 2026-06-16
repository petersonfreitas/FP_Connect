"use server";

import { redirect } from "next/navigation";
import { signInWithPassword, signOut } from "./auth";

export async function signInAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = normalizeRedirectPath(String(formData.get("next") ?? ""));
  const result = await signInWithPassword(email, password);

  if (!result.ok) {
    const nextParam = next ? `&next=${encodeURIComponent(next)}` : "";
    redirect(`/login?error=${encodeURIComponent(result.error)}${nextParam}`);
  }

  redirect(next || "/");
}

export async function signOutAction(): Promise<void> {
  await signOut();
  redirect("/login");
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
