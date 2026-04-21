import { NextRequest, NextResponse } from "next/server";
import { query, ensureSchema } from "@/lib/db";
import type { DollRow } from "@/lib/db";
import { ensureAdmin } from "@/lib/admin-auth";

interface ExportDoll {
  id: string;
  name: string;
  line: string | null;
  year: number | null;
  condition: string | null;
  notes: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BackupPayload {
  version: 3;
  exportedAt: string;
  userId: string;
  dolls: ExportDoll[];
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

    const rows = await query<DollRow>(
      "SELECT id, user_id, name, line, year, condition, notes, image_url, created_at, updated_at FROM dolls WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );

    const dolls: ExportDoll[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      line: row.line,
      year: row.year,
      condition: row.condition,
      notes: row.notes,
      imageUrl: row.image_url,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    }));

    const payload: BackupPayload = {
      version: 3,
      exportedAt: new Date().toISOString(),
      userId,
      dolls,
    };

    return NextResponse.json(payload);
  } catch (err) {
    console.error("GET /api/admin/dump", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Database error" },
      { status: 500 }
    );
  }
}
