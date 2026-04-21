import { NextRequest } from "next/server";
import { getCookieName, getSessionPayload } from "@/lib/auth";

/**
 * Returns the current user id from the session cookie, or null if not logged in / invalid.
 */
export async function getCurrentUserId(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get(getCookieName())?.value;
  if (!token) return null;
  const payload = await getSessionPayload(token);
  return payload?.userId ?? null;
}
