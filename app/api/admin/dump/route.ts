import { NextRequest, NextResponse } from "next/server";
import { query, ensureSchema } from "@/lib/db";
import type { ToyRow } from "@/lib/db";
import { ensureAdmin } from "@/lib/admin-auth";
import { getClientErrorMessage } from "@/lib/client-error-message";

interface ExportToy {
  id: string;
  name: string;
  line: string | null;
  factory: string | null;
  year: string | null;
  paint: string | null;
  rarity: string | null;
  notes: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BackupPayload {
  version: 3;
  exportedAt: string;
  userId: string;
  toys: ExportToy[];
}

export async function GET(request: NextRequest) {
  const auth = ensureAdmin(request);
  if (auth) return auth;

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId")?.trim();
  if (!userId) {
    return NextResponse.json(
      { error: "userId query parameter is required (user to export)." },
      { status: 400 }
    );
  }

  try {
    await ensureSchema();

    const userExists = await query<{ id: string }>(
      "SELECT id FROM users WHERE id = $1",
      [userId]
    );
    if (userExists.length === 0) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    const rows = await query<ToyRow>(
      "SELECT id, user_id, name, line, factory, year, paint, rarity, notes, image_url, created_at, updated_at FROM toys WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );

    const toys: ExportToy[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      line: row.line,
      factory: row.factory,
      year: row.year,
      paint: row.paint,
      rarity: row.rarity,
      notes: row.notes,
      imageUrl: row.image_url,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    }));

    const payload: BackupPayload = {
      version: 3,
      exportedAt: new Date().toISOString(),
      userId,
      toys,
    };

    return NextResponse.json(payload);
  } catch (err) {
    console.error("GET /api/admin/dump", err);
    return NextResponse.json(
      { error: getClientErrorMessage(err, "Database error") },
      { status: 500 }
    );
  }
}
