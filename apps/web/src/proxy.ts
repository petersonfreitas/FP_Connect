import { NextResponse, type NextRequest } from "next/server";

const ACCESS_TOKEN_COOKIE = "fp_connect_access_token";
const REFRESH_TOKEN_COOKIE = "fp_connect_refresh_token";
const DEFAULT_ACCESS_TOKEN_MAX_AGE = 60 * 60;
const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30;

type SupabaseTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
};

export async function proxy(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (accessToken) {
    return NextResponse.next();
  }

  if (!refreshToken) {
    return redirectToLogin(request);
  }

  const session = await refreshSupabaseSession(refreshToken);

  if (!session?.access_token) {
    const response = redirectToLogin(request);
    response.cookies.delete(ACCESS_TOKEN_COOKIE);
    response.cookies.delete(REFRESH_TOKEN_COOKIE);
    return response;
  }

  const response = NextResponse.next();
  const secure = process.env.NODE_ENV === "production";

  response.cookies.set(ACCESS_TOKEN_COOKIE, session.access_token, {
    httpOnly: true,
    maxAge: session.expires_in ?? DEFAULT_ACCESS_TOKEN_MAX_AGE,
    path: "/",
    sameSite: "lax",
    secure
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, session.refresh_token ?? refreshToken, {
    httpOnly: true,
    maxAge: REFRESH_TOKEN_MAX_AGE,
    path: "/",
    sameSite: "lax",
    secure
  });

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand|api|login).*)"]
};

async function refreshSupabaseSession(
  refreshToken: string
): Promise<SupabaseTokenResponse | null> {
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return null;
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    body: JSON.stringify({
      refresh_token: refreshToken
    }),
    cache: "no-store",
    headers: {
      apikey: anonKey,
      "Content-Type": "application/json"
    },
    method: "POST"
  }).catch(() => undefined);

  if (!response?.ok) {
    return null;
  }

  return (await response.json().catch(() => null)) as SupabaseTokenResponse | null;
}

function redirectToLogin(request: NextRequest): NextResponse {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}
