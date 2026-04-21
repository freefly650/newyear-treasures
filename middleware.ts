import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession, getCookieName } from "@/lib/auth";

const LOGIN_PATH = "/login";
const REGISTER_PATH = "/register";
const PUBLIC_AUTH_PATHS = [
  LOGIN_PATH,
  REGISTER_PATH,
  "/verify-email",
  "/forgot-password",
  "/reset-password",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_AUTH_PATHS.includes(pathname) || pathname.startsWith("/verify-email") || pathname.startsWith("/reset-password")) {
    const token = request.cookies.get(getCookieName())?.value;
    if (token && (await verifySession(token))) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icon") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(getCookieName())?.value;
  if (!token || !(await verifySession(token))) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|tree-logo.svg).*)",
  ],
};
