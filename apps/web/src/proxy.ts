import { NextResponse, type NextRequest } from "next/server";

const ACCESS_TOKEN_COOKIE = "fp_connect_access_token";

export function proxy(request: NextRequest) {
  const isAuthenticated = Boolean(request.cookies.get(ACCESS_TOKEN_COOKIE)?.value);

  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand|api|login).*)"]
};
