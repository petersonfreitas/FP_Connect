"use server";

import { redirect } from "next/navigation";
import {
  requestPasswordRecovery,
  signInWithPassword,
  signOut,
  updatePasswordWithRecoveryToken
} from "./auth";

export async function signInAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const result = await signInWithPassword(email, password);

  if (!result.ok) {
    redirect(`/login?error=${encodeURIComponent(result.error)}`);
  }

  redirect("/");
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

  redirect("/");
}
