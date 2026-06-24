import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { loadServerEnv } from "./server-env";

const INTERNAL_ACCESS_TOKEN_COOKIE = "fp_food_internal_access_token";
const INTERNAL_REFRESH_TOKEN_COOKIE = "fp_food_internal_refresh_token";
const PUBLIC_ACCESS_TOKEN_COOKIE_PREFIX = "fp_food_public_access_token_";
const PUBLIC_REFRESH_TOKEN_COOKIE_PREFIX = "fp_food_public_refresh_token_";
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
  return signInWithPasswordForSession(email, password, getInternalSessionCookies());
}

export async function signInPublicStoreWithPassword(
  publicSlug: string,
  email: string,
  password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  return signInWithPasswordForSession(email, password, getPublicStoreSessionCookies(publicSlug));
}

export async function signOut(): Promise<void> {
  await clearSessionCookies(getInternalSessionCookies());
}

export async function signOutPublicStore(publicSlug: string): Promise<void> {
  await clearSessionCookies(getPublicStoreSessionCookies(publicSlug));
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  return getCurrentUserFromCookies(getInternalSessionCookies());
}

export async function getCurrentPublicStoreUser(publicSlug: string): Promise<AuthUser | null> {
  return getCurrentUserFromCookies(getPublicStoreSessionCookies(publicSlug));
}

export async function requireCurrentUser(): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

async function signInWithPasswordForSession(
  email: string,
  password: string,
  sessionCookies: SessionCookies
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

  await setSessionCookies(
    sessionCookies,
    body.access_token,
    body.refresh_token,
    body.expires_in ?? DEFAULT_ACCESS_TOKEN_MAX_AGE
  );

  return { ok: true };
}

async function getCurrentUserFromCookies(sessionCookies: SessionCookies): Promise<AuthUser | null> {
  const token = await getAccessToken(sessionCookies);

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

async function getAccessToken(sessionCookies: SessionCookies): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(sessionCookies.accessToken)?.value;
}

async function setSessionCookies(
  sessionCookies: SessionCookies,
  accessToken: string,
  refreshToken: string | null,
  expiresIn: number = DEFAULT_ACCESS_TOKEN_MAX_AGE
): Promise<void> {
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === "production";

  cookieStore.set(sessionCookies.accessToken, accessToken, {
    httpOnly: true,
    maxAge: expiresIn,
    path: "/",
    sameSite: "lax",
    secure
  });

  if (refreshToken) {
    cookieStore.set(sessionCookies.refreshToken, refreshToken, {
      httpOnly: true,
      maxAge: REFRESH_TOKEN_MAX_AGE,
      path: "/",
      sameSite: "lax",
      secure
    });
  }
}

async function clearSessionCookies(sessionCookies: SessionCookies): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookies.accessToken);
  cookieStore.delete(sessionCookies.refreshToken);
}

type SessionCookies = {
  accessToken: string;
  refreshToken: string;
};

function getInternalSessionCookies(): SessionCookies {
  return {
    accessToken: INTERNAL_ACCESS_TOKEN_COOKIE,
    refreshToken: INTERNAL_REFRESH_TOKEN_COOKIE
  };
}

function getPublicStoreSessionCookies(publicSlug: string): SessionCookies {
  const normalizedSlug = normalizePublicSlugForCookie(publicSlug);

  return {
    accessToken: `${PUBLIC_ACCESS_TOKEN_COOKIE_PREFIX}${normalizedSlug}`,
    refreshToken: `${PUBLIC_REFRESH_TOKEN_COOKIE_PREFIX}${normalizedSlug}`
  };
}

function normalizePublicSlugForCookie(value: string): string {
  const slug = value.trim().toLowerCase();

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("Slug publico da loja invalido.");
  }

  return slug;
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
    throw new Error(`${key} nao foi configurado no servidor Food.`);
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
