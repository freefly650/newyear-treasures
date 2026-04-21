import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/login/route";

vi.mock("@/lib/db", () => ({
  query: vi.fn(),
  ensureSchema: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("bcrypt", () => ({
  default: {
    compare: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  createSession: vi.fn(),
  getCookieName: () => "session",
  getSessionCookieOptions: (isProduction: boolean) => ({
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 604800,
  }),
}));

function loginRequest(body: { email?: string; password?: string }) {
  const req = new NextRequest("http://localhost/api/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
  return POST(req);
}

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when email is missing", async () => {
    const res = await loginRequest({ password: "pass" });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("email і пароль");
  });

  it("returns 400 when password is missing", async () => {
    const res = await loginRequest({ email: "a@b.com" });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("email і пароль");
  });

  it("returns 401 when user not found", async () => {
    const { query } = await import("@/lib/db");
    vi.mocked(query).mockResolvedValueOnce([]);

    const res = await loginRequest({ email: "nobody@example.com", password: "x" });
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain("Невірний email або пароль");
  });

  it("returns 401 when password is wrong", async () => {
    const { query } = await import("@/lib/db");
    const bcrypt = await import("bcrypt");
    vi.mocked(query).mockResolvedValueOnce([
      { id: "user-1", password_hash: "hash", email_verified: true },
    ]);
    vi.mocked(bcrypt.default.compare).mockResolvedValueOnce(false as never);

    const res = await loginRequest({ email: "u@b.com", password: "wrong" });
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain("Невірний email або пароль");
  });

  it("returns 403 when email not verified", async () => {
    const { query } = await import("@/lib/db");
    const bcrypt = await import("bcrypt");
    vi.mocked(query).mockResolvedValueOnce([
      { id: "user-1", password_hash: "hash", email_verified: false },
    ]);
    vi.mocked(bcrypt.default.compare).mockResolvedValueOnce(true as never);

    const res = await loginRequest({ email: "u@b.com", password: "right" });
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain("підтвердьте пошту");
  });

  it("returns 200 and sets session cookie when valid", async () => {
    const { query } = await import("@/lib/db");
    const bcrypt = await import("bcrypt");
    const { createSession } = await import("@/lib/auth");
    vi.mocked(query).mockResolvedValueOnce([
      { id: "user-123", password_hash: "hash", email_verified: true },
    ]);
    vi.mocked(bcrypt.default.compare).mockResolvedValueOnce(true as never);
    vi.mocked(createSession).mockResolvedValueOnce("jwt-token-here");

    const res = await loginRequest({ email: "u@b.com", password: "right" });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.userId).toBe("user-123");
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toBeTruthy();
    expect(setCookie).toContain("session=");
  });
});
