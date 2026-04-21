import { NextRequest, NextResponse } from "next/server";

export function ensureAdmin(request: NextRequest): NextResponse | null {
  const required = process.env.ADMIN_SECRET;
  if (!required) {
    // No secret configured: allow access (personal project default)
    return null;
  }

  const headerSecret = request.headers.get("x-admin-secret");
  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");

  if (headerSecret === required || querySecret === required) {
    return null;
  }

  return new NextResponse("Unauthorized", { status: 401 });
}

