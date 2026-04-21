import { NextRequest, NextResponse } from "next/server";
import { query, ensureSchema } from "@/lib/db";
import { rowToDoll } from "@/lib/db-mappers";
import { uploadImage, isCloudinaryConfigured } from "@/lib/cloudinary";
import { getCurrentUserId } from "@/lib/session";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await ensureSchema();
    const rows = await query<{
      id: string;
      name: string;
      line: string | null;
      factory: string | null;
      year: string | null;
      paint: string | null;
      rarity: string | null;
      notes: string | null;
      image_url: string | null;
      created_at: Date;
      updated_at: Date;
    }>(
      "SELECT id, name, line, factory, year, paint, rarity, notes, image_url, created_at, updated_at FROM toys WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    const toys = rows.map((r) => rowToDoll(r));
    return NextResponse.json(toys);
  } catch (err) {
    console.error("GET /api/toys", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Database error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        { error: "Image upload is not configured (Cloudinary). Add CLOUDINARY_* env vars." },
        { status: 503 }
      );
    }
    await ensureSchema();
    const formData = await request.formData();
    const name = (formData.get("name") as string)?.trim();
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const line = (formData.get("line") as string)?.trim() || null;
    const factory = (formData.get("factory") as string)?.trim() || null;
    const year = (formData.get("year") as string)?.trim() || null;
    const paint = (formData.get("paint") as string) || null;
    const rarity = (formData.get("rarity") as string) || null;
    const notes = (formData.get("notes") as string)?.trim() || null;
    const file = formData.get("image") as File | null;
    let image_url: string | null = null;
    if (file && file.size > 0) {
      if (file.size > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          { error: "Image must be 5MB or smaller" },
          { status: 400 }
        );
      }
      const buf = Buffer.from(await file.arrayBuffer());
      const mime = file.type || "image/jpeg";
      image_url = await uploadImage(buf, mime, userId);
    }
    const rows = await query<{ id: string; created_at: Date; updated_at: Date }>(
      `INSERT INTO toys (user_id, name, line, factory, year, paint, rarity, notes, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, created_at, updated_at`,
      [userId, name, line, factory, year, paint, rarity, notes, image_url]
    );
    const row = rows[0];
    if (!row) throw new Error("Insert failed");
    const full = await query<{
      id: string;
      name: string;
      line: string | null;
      factory: string | null;
      year: string | null;
      paint: string | null;
      rarity: string | null;
      notes: string | null;
      image_url: string | null;
      created_at: Date;
      updated_at: Date;
    }>(
      "SELECT id, name, line, factory, year, paint, rarity, notes, image_url, created_at, updated_at FROM toys WHERE id = $1 AND user_id = $2",
      [row.id, userId]
    );
    return NextResponse.json(rowToDoll(full[0]));
  } catch (err) {
    console.error("POST /api/toys", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Database error" },
      { status: 500 }
    );
  }
}
