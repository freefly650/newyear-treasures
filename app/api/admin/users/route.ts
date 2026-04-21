import { NextRequest, NextResponse } from "next/server";
import { ensureAdmin } from "@/lib/admin-auth";
import { query, ensureSchema } from "@/lib/db";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export async function GET(request: NextRequest) {
  const auth = ensureAdmin(request);
  if (auth) return auth;

  try {
    await ensureSchema();
    const rows = await query<{
      id: string;
      email: string;
      name: string | null;
      created_at: Date;
      doll_count: string | number;
    }>(
      `SELECT u.id, u.email, u.name, u.created_at,
        (SELECT COUNT(*)::int FROM dolls d WHERE d.user_id = u.id) AS doll_count
       FROM users u
       ORDER BY u.created_at ASC`
    );
    return NextResponse.json(
      rows.map((r) => ({
        id: r.id,
        email: r.email,
        name: r.name,
        createdAt: r.created_at.toISOString(),
        dollCount: Number(r.doll_count) || 0,
      }))
    );
  } catch (err) {
    console.error("GET /api/admin/users", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Database error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = ensureAdmin(request);
  if (auth) return auth;

  try {
    await ensureSchema();
    const body = await request.json();
    const email = (body?.email ?? "").toString().trim().toLowerCase();
    const password = (body?.password ?? "").toString();
    const name = (body?.name ?? "").toString().trim() || null;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const existing = await query<{ id: string }>(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "A user with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const inserted = await query<{ id: string }>(
      `INSERT INTO users (email, password_hash, name, email_verified)
       VALUES ($1, $2, $3, true)
       RETURNING id`,
      [email, passwordHash, name]
    );
    const user = inserted[0];
    if (!user) throw new Error("Insert failed");

    return NextResponse.json({
      id: user.id,
      email,
      name,
      message: "User created. They can log in with this email and password.",
    });
  } catch (err) {
    console.error("POST /api/admin/users", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Create user failed." },
      { status: 500 }
    );
  }
}
