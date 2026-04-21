import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { query, ensureSchema } from "@/lib/db";
import { createVerificationToken } from "@/lib/auth-tokens";
import { sendVerificationEmail, isEmailConfigured } from "@/lib/email";

const SALT_ROUNDS = 10;

export async function POST(request: NextRequest) {
  try {
    await ensureSchema();

    const body = await request.json();
    const email = (body?.email ?? "").toString().trim().toLowerCase();
    const password = body?.password ?? "";
    const name = (body?.name ?? "").toString().trim() || null;

    if (!email) {
      return NextResponse.json(
        { error: "Пошта обов'язкова." },
        { status: 400 }
      );
    }
    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Пароль має містити щонайменше 6 символів." },
        { status: 400 }
      );
    }

    const existing = await query<{ id: string }>(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Акаунт з такою поштою вже існує." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const requireVerification = isEmailConfigured();
    const rows = await query<{ id: string }>(
      `INSERT INTO users (email, password_hash, name, email_verified)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [email, passwordHash, name, !requireVerification]
    );
    const user = rows[0];
    if (!user) throw new Error("Insert failed");

    if (requireVerification) {
      const token = await createVerificationToken(user.id);
      await sendVerificationEmail(email, token);
    }

    return NextResponse.json(
      {
        ok: true,
        message: requireVerification
          ? "Акаунт створено. Підтвердьте пошту перед входом."
          : "Акаунт створено. Тепер можна увійти.",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/auth/register", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Не вдалося зареєструватися." },
      { status: 500 }
    );
  }
}
