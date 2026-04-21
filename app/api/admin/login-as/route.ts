import { NextRequest, NextResponse } from "next/server";
import { ensureAdmin } from "@/lib/admin-auth";
import { query } from "@/lib/db";
import { createSession, getCookieName, getSessionCookieOptions } from "@/lib/auth";

/**
 * Admin: create a session for the given user (login as that user).
 * Requires x-admin-secret. Returns Set-Cookie and redirect URL.
 */
export async function POST(request: NextRequest) {
  const auth = ensureAdmin(request);
  if (auth) return auth;

  try {
    const body = await request.json();
    const userId = (body?.userId ?? "").toString().trim();
    if (!userId) {
      return NextResponse.json(
        { error: "userId is required." },
        { status: 400 }
      );
    }

    const rows = await query<{ id: string }>(
      "SELECT id FROM users WHERE id = $1",
      [userId]
    );
    if (rows.length === 0) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    const token = await createSession(userId);
    const isProduction = process.env.NODE_ENV === "production";
    const options = getSessionCookieOptions(isProduction);

    const res = NextResponse.json({ ok: true, redirect: "/" });
    res.cookies.set(getCookieName(), token, options);
    return res;
  } catch (err) {
    console.error("POST /api/admin/login-as", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Login-as failed." },
      { status: 500 }
    );
  }
}
