import { NextRequest, NextResponse } from "next/server";
import { query, ensureSchema } from "@/lib/db";
import { createPasswordResetToken } from "@/lib/auth-tokens";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    await ensureSchema();

    const body = await request.json();
    const email = (body?.email ?? "").toString().trim().toLowerCase();
    if (!email) {
      return NextResponse.json(
        { error: "Пошта обов'язкова." },
        { status: 400 }
      );
    }

    const rows = await query<{ id: string }>(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (rows.length > 0) {
      const userId = rows[0].id;
      const token = await createPasswordResetToken(userId);
      await sendPasswordResetEmail(email, token);
    }

    return NextResponse.json({
      ok: true,
      message:
        "Якщо акаунт існує, ви отримаєте посилання для скидання пароля.",
    });
  } catch (err) {
    console.error("POST /api/auth/forgot-password", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Запит не виконано." },
      { status: 500 }
    );
  }
}
