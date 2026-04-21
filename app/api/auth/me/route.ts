import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = await query<{ id: string; email: string; name: string | null }>(
    "SELECT id, email, name FROM users WHERE id = $1",
    [userId]
  );
  const user = rows[0];
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
  });
}
