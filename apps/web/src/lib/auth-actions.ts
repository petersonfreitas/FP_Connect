"use server";

import { redirect } from "next/navigation";
import {
  requestPasswordRecovery,
  signInWithPassword,
  signOut,
  updatePasswordWithRecoveryToken
} from "./auth";
import { activateCurrentUserInvite } from "./internal-api";

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

export async function requestPasswordRecoveryAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "");
  const result = await requestPasswordRecovery(email);

  if (!result.ok) {
    redirect(`/login/recuperar-senha?error=${encodeURIComponent(result.error)}`);
  }

  redirect("/login/recuperar-senha?sent=1");
}

export async function updatePasswordWithRecoveryAction(formData: FormData): Promise<void> {
  const accessToken = String(formData.get("accessToken") ?? "");
  const refreshToken = String(formData.get("refreshToken") || "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password !== confirmPassword) {
    redirect("/login/atualizar-senha?error=As%20senhas%20nao%20conferem.");
  }

  const result = await updatePasswordWithRecoveryToken(accessToken, refreshToken || null, password);

  if (!result.ok) {
    redirect(`/login/atualizar-senha?error=${encodeURIComponent(result.error)}`);
  }

  const activationResult = await activateCurrentUserInvite();

  if (activationResult.error) {
    redirect(`/login/atualizar-senha?error=${encodeURIComponent(activationResult.error)}`);
  }

  redirect("/");
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
