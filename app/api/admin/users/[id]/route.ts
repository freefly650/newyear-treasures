import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { ensureAdmin } from "@/lib/admin-auth";
import { query } from "@/lib/db";
import { deleteUserFolder } from "@/lib/cloudinary";

const SALT_ROUNDS = 10;

/**
 * PATCH /api/admin/users/[id]
 * Admin only. Updates the user's password. Body: { password: string } (min 6 chars).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = ensureAdmin(request);
  if (auth) return auth;

  const { id: userId } = await params;
  if (!userId) {
    return NextResponse.json(
      { error: "User ID is required." },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const password = (body?.password ?? "").toString();
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const userRows = await query<{ id: string }>(
      "SELECT id FROM users WHERE id = $1",
      [userId]
    );
    if (userRows.length === 0) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    await query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [
      passwordHash,
      userId,
    ]);

    return NextResponse.json({
      message: "Password updated. The user can sign in with the new password.",
    });
  } catch (err) {
    console.error("PATCH /api/admin/users/[id]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Password update failed." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Admin only. Deletes the user, their toys, and their Cloudinary folder (all images).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = ensureAdmin(request);
  if (auth) return auth;

  const { id: userId } = await params;
  if (!userId) {
    return NextResponse.json(
      { error: "User ID is required." },
      { status: 400 }
    );
  }

  try {
    const userRows = await query<{ id: string }>(
      "SELECT id FROM users WHERE id = $1",
      [userId]
    );
    if (userRows.length === 0) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    await deleteUserFolder(userId);

    await query("DELETE FROM users WHERE id = $1", [userId]);

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("DELETE /api/admin/users/[id]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Delete user failed." },
      { status: 500 }
    );
  }
}
