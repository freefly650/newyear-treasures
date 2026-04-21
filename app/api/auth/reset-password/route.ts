import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { query, ensureSchema } from "@/lib/db";
import { consumePasswordResetToken } from "@/lib/auth-tokens";

const SALT_ROUNDS = 10;

export async function POST(request: NextRequest) {
  try {
    await ensureSchema();

    const body = await request.json();
    const token = (body?.token ?? "").toString().trim();
    const newPassword = (body?.newPassword ?? "").toString();

    if (!token) {
      return NextResponse.json(
        { error: "Потрібен токен скидання." },
        { status: 400 }
      );
    }
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Пароль має містити щонайменше 6 символів." },
        { status: 400 }
      );
    }

    const userId = await consumePasswordResetToken(token);
    if (!userId) {
      return NextResponse.json(
        { error: "Недійсне або прострочене посилання скидання." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await query(
      "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
      [passwordHash, userId]
    );

    return NextResponse.json({
      ok: true,
      message: "Пароль оновлено. Тепер можна увійти.",
    });
  } catch (err) {
    console.error("POST /api/auth/reset-password", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Не вдалося скинути пароль." },
      { status: 500 }
    );
  }
}
