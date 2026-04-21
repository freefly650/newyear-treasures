import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { query, ensureSchema } from "@/lib/db";
import { createSession, getCookieName, getSessionCookieOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await ensureSchema();

    const body = await request.json();
    const email = (body?.email ?? "").toString().trim().toLowerCase();
    const password = body?.password ?? "";

    if (!email || typeof password !== "string" || !String(password).trim()) {
      return NextResponse.json(
        { error: "Потрібні email і пароль." },
        { status: 400 }
      );
    }

    const rows = await query<{ id: string; password_hash: string; email_verified: boolean }>(
      "SELECT id, password_hash, COALESCE(email_verified, true) AS email_verified FROM users WHERE email = $1",
      [email]
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return NextResponse.json(
        { error: "Невірний email або пароль." },
        { status: 401 }
      );
    }
    if (!user.email_verified) {
      return NextResponse.json(
        { error: "Перед входом підтвердьте пошту. Перевірте вхідні повідомлення." },
        { status: 403 }
      );
    }

    const token = await createSession(user.id);
    const isProduction = process.env.NODE_ENV === "production";
    const options = getSessionCookieOptions(isProduction);

    const res = NextResponse.json({ ok: true, userId: user.id }, { status: 200 });
    res.cookies.set(getCookieName(), token, options);
    return res;
  } catch (err) {
    console.error("POST /api/auth/login", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Не вдалося увійти." },
      { status: 500 }
    );
  }
}
