import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "session";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET must be set and at least 32 characters (for login to work)."
    );
  }
  return new TextEncoder().encode(secret);
}

export function getCookieName(): string {
  return COOKIE_NAME;
}

export interface SessionPayload {
  userId: string;
}

export async function createSession(userId: string): Promise<string> {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET must be set and at least 32 characters (for login to work)."
    );
  }
  // Use Buffer in Node so jose's instanceof Uint8Array check passes (Vitest/Node use Buffer)
  const key =
    typeof Buffer !== "undefined"
      ? Buffer.from(secret, "utf8")
      : new TextEncoder().encode(secret);
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(key as Uint8Array);
}

export async function verifySession(token: string): Promise<boolean> {
  try {
    const secret = process.env.AUTH_SECRET;
    if (!secret || secret.length < 32) return false;
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

export async function getSessionPayload(
  token: string
): Promise<SessionPayload | null> {
  try {
    const secret = process.env.AUTH_SECRET;
    if (!secret || secret.length < 32) return null;
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    const userId = payload.userId as string | undefined;
    if (!userId || typeof userId !== "string") return null;
    return { userId };
  } catch {
    return null;
  }
}

export function getSessionCookieOptions(isProduction: boolean) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}
