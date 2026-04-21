import { NextRequest, NextResponse } from "next/server";
import { query, ensureSchema } from "@/lib/db";
import { consumeVerificationToken } from "@/lib/auth-tokens";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token")?.trim();
  if (!token) {
    return NextResponse.json(
      { error: "Потрібен токен підтвердження." },
      { status: 400 }
    );
  }
  try {
    await ensureSchema();
    const userId = await consumeVerificationToken(token);
    if (!userId) {
      return NextResponse.json(
        { error: "Недійсне або прострочене посилання підтвердження." },
        { status: 400 }
      );
    }
    await query("UPDATE users SET email_verified = true, updated_at = NOW() WHERE id = $1", [userId]);
    return NextResponse.json({ ok: true, message: "Пошту підтверджено. Тепер можна увійти." });
  } catch (err) {
    console.error("GET /api/auth/verify-email", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Не вдалося підтвердити пошту." },
      { status: 500 }
    );
  }
}
