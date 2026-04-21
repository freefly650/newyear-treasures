import { NextRequest, NextResponse } from "next/server";
import { query, ensureSchema } from "@/lib/db";
import { ensureAdmin } from "@/lib/admin-auth";
import {
  uploadImage,
  uploadImageFromUrl,
  isCloudinaryConfigured,
} from "@/lib/cloudinary";

interface ImportDoll {
  id: string;
  name: string;
  line?: string | null;
  year?: number | null;
  condition?: string | null;
  notes?: string | null;
  imageUrl?: string | null;
  imageContentType?: string | null;
  imageBase64?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ImportPayload {
  version?: number;
  userId: string;
  replaceAll?: boolean;
  copyImages?: boolean;
  dolls?: ImportDoll[];
}

export async function POST(request: NextRequest) {
  const auth = ensureAdmin(request);
  if (auth) return auth;

  try {
    const body = (await request.json()) as ImportPayload;
    const userId = (body.userId ?? "").toString().trim();
    if (!userId) {
      return NextResponse.json(
        { error: "userId is required (user to restore into)." },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.dolls)) {
      return NextResponse.json(
        { error: "Invalid backup file: dolls array missing" },
        { status: 400 }
      );
    }

    const replaceAll = body.replaceAll !== false;
    const copyImages = body.copyImages !== false;
    const hasBase64 = body.dolls.some(
      (d) => d.imageBase64 && d.imageBase64.length > 0
    );
    if (hasBase64 && !isCloudinaryConfigured()) {
      return NextResponse.json(
        {
          error:
            "Backup contains embedded images. Set CLOUDINARY_* env vars to restore.",
        },
        { status: 503 }
      );
    }

    await ensureSchema();

    const userExists = await query<{ id: string }>(
      "SELECT id FROM users WHERE id = $1",
      [userId]
    );
    if (userExists.length === 0) {
      return NextResponse.json(
        { error: "Target user not found." },
        { status: 404 }
      );
    }

    if (replaceAll) {
      await query("DELETE FROM dolls WHERE user_id = $1", [userId]);
    }

    let imported = 0;

    for (const d of body.dolls) {
      if (!d || !d.name) continue;

      let image_url: string | null = null;
      if (d.imageUrl && d.imageUrl.trim()) {
        const trimmed = d.imageUrl.trim();
        if (copyImages && isCloudinaryConfigured()) {
          const reuploaded = await uploadImageFromUrl(trimmed, userId);
          image_url = reuploaded ?? trimmed;
        } else {
          image_url = trimmed;
        }
      } else if (
        d.imageBase64 &&
        d.imageBase64.length > 0 &&
        isCloudinaryConfigured()
      ) {
        const buf = Buffer.from(d.imageBase64, "base64");
        const mime = d.imageContentType || "image/jpeg";
        image_url = await uploadImage(buf, mime, userId);
      }

      const dollId = crypto.randomUUID();
      await query(
        `INSERT INTO dolls
          (user_id, id, name, line, year, condition, notes, image_url, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          userId,
          dollId,
          d.name,
          d.line ?? null,
          d.year ?? null,
          d.condition ?? null,
          d.notes ?? null,
          image_url,
          new Date(d.createdAt),
          new Date(d.updatedAt),
        ]
      );
      imported += 1;
    }

    return NextResponse.json({
      imported,
      replaceAll,
      userId,
    });
  } catch (err) {
    console.error("POST /api/admin/restore", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Restore failed" },
      { status: 500 }
    );
  }
}
