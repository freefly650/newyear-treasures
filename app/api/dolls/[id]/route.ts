import { NextRequest, NextResponse } from "next/server";
import { query, ensureSchema } from "@/lib/db";
import { rowToDoll } from "@/lib/db-mappers";
import { uploadImage, deleteImage, isCloudinaryConfigured } from "@/lib/cloudinary";
import { getCurrentUserId } from "@/lib/session";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
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
      "SELECT id, name, line, factory, year, paint, rarity, notes, image_url, created_at, updated_at FROM dolls WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(rowToDoll(rows[0]));
  } catch (err) {
    console.error("GET /api/dolls/[id]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Database error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
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
    const removeImage = formData.get("removeImage") === "true";

    if (removeImage) {
      const current = await query<{ image_url: string | null }>(
        "SELECT image_url FROM dolls WHERE id = $1 AND user_id = $2",
        [id, userId]
      );
      if (current.length > 0 && current[0].image_url) {
        await deleteImage(current[0].image_url);
      }
    }

    let image_url: string | null | undefined = undefined;
    if (removeImage) {
      image_url = null;
    } else if (file && file.size > 0) {
      if (file.size > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          { error: "Image must be 5MB or smaller" },
          { status: 400 }
        );
      }
      const current = await query<{ image_url: string | null }>(
        "SELECT image_url FROM dolls WHERE id = $1 AND user_id = $2",
        [id, userId]
      );
      const buf = Buffer.from(await file.arrayBuffer());
      const mime = file.type || "image/jpeg";
      image_url = await uploadImage(buf, mime, userId);
      if (current.length > 0 && current[0].image_url) {
        await deleteImage(current[0].image_url);
      }
    }

    if (image_url !== undefined) {
      await query(
        "UPDATE dolls SET name = $1, line = $2, factory = $3, year = $4, paint = $5, rarity = $6, notes = $7, image_url = $8, updated_at = NOW() WHERE id = $9 AND user_id = $10",
        [name, line, factory, year, paint, rarity, notes, image_url, id, userId]
      );
    } else {
      await query(
        "UPDATE dolls SET name = $1, line = $2, factory = $3, year = $4, paint = $5, rarity = $6, notes = $7, updated_at = NOW() WHERE id = $8 AND user_id = $9",
        [name, line, factory, year, paint, rarity, notes, id, userId]
      );
    }

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
      "SELECT id, name, line, factory, year, paint, rarity, notes, image_url, created_at, updated_at FROM dolls WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(rowToDoll(rows[0]));
  } catch (err) {
    console.error("PATCH /api/dolls/[id]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Database error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    await ensureSchema();
    const existing = await query<{ image_url: string | null }>(
      "SELECT image_url FROM dolls WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    if (existing.length > 0 && existing[0].image_url) {
      await deleteImage(existing[0].image_url);
    }
    const result = await query(
      "DELETE FROM dolls WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, userId]
    );
    if (result.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("DELETE /api/dolls/[id]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Database error" },
      { status: 500 }
    );
  }
}
