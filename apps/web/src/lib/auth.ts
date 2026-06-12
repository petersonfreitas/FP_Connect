import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { loadServerEnv } from "./server-env";

const ACCESS_TOKEN_COOKIE = "fp_connect_access_token";
const REFRESH_TOKEN_COOKIE = "fp_connect_refresh_token";
const DEFAULT_ACCESS_TOKEN_MAX_AGE = 60 * 60;
const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30;

export type AuthUser = {
  id: string;
  email: string | null;
};

type SupabaseTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: {
    id?: string;
    email?: string | null;
  };
  error?: string;
  error_description?: string;
  msg?: string;
};

type SupabaseUserResponse = {
  id?: string;
  email?: string | null;
};

export async function signInWithPassword(
  email: string,
  password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !password) {
    return { ok: false, error: "Informe e-mail e senha." };
  }

  const response = await fetch(`${getSupabaseUrl()}/auth/v1/token?grant_type=password`, {
    body: JSON.stringify({
      email: normalizedEmail,
      password
    }),
    headers: getSupabaseAuthHeaders(),
    method: "POST"
  }).catch(() => undefined);

  if (!response) {
    return { ok: false, error: "Nao foi possivel conectar ao Supabase Auth." };
  }

  const body = (await response.json().catch(() => ({}))) as SupabaseTokenResponse;

  if (!response.ok || !body.access_token || !body.refresh_token) {
    return {
      ok: false,
      error: body.error_description ?? body.msg ?? body.error ?? "Credenciais invalidas."
    };
  }

  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === "production";

  cookieStore.set(ACCESS_TOKEN_COOKIE, body.access_token, {
    httpOnly: true,
    maxAge: body.expires_in ?? DEFAULT_ACCESS_TOKEN_MAX_AGE,
    path: "/",
    sameSite: "lax",
    secure
  });
  cookieStore.set(REFRESH_TOKEN_COOKIE, body.refresh_token, {
    httpOnly: true,
    maxAge: REFRESH_TOKEN_MAX_AGE,
    path: "/",
    sameSite: "lax",
    secure
  });

  return { ok: true };
}

export async function signOut(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getAccessToken();

  if (!token) {
    return null;
  }

  const response = await fetch(`${getSupabaseUrl()}/auth/v1/user`, {
    cache: "no-store",
    headers: {
      ...getSupabaseAuthHeaders(),
      Authorization: `Bearer ${token}`
    }
  }).catch(() => undefined);

  if (!response?.ok) {
    return null;
  }

  const user = (await response.json().catch(() => ({}))) as SupabaseUserResponse;

  if (!user.id) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? null
  };
}

export async function requireCurrentUser(): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function hasAuthCookie(): Promise<boolean> {
  return Boolean(await getAccessToken());
}

async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
}

function getSupabaseAuthHeaders(): HeadersInit {
  const anonKey = getRequiredEnv("SUPABASE_ANON_KEY");

  return {
    apikey: anonKey,
    "Content-Type": "application/json"
  };
}

function getSupabaseUrl(): string {
  return getRequiredUrl("SUPABASE_URL");
}

function getRequiredEnv(key: string): string {
  loadServerEnv();

  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`${key} nao foi configurado no servidor web.`);
  }

  return value;
}

function getRequiredUrl(key: string): string {
  const value = getRequiredEnv(key);

  try {
    new URL(value);
  } catch {
    throw new Error(`${key} precisa ser uma URL valida.`);
  }

  return value.replace(/\/$/, "");
}
