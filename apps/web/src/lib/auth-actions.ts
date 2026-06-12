"use server";

import { redirect } from "next/navigation";
import { signInWithPassword, signOut } from "./auth";

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
