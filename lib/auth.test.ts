import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from "vitest";

// Mock jose so we don't depend on Uint8Array/key handling in Vitest (avoids "payload must be an instance of Uint8Array")
let lastSignedPayload: { userId: string } | null = null;
vi.mock("jose", () => ({
  SignJWT: class MockSignJWT {
    constructor(payload: { userId: string }) {
      lastSignedPayload = payload;
    }
    setProtectedHeader() {
      return this;
    }
    setIssuedAt() {
      return this;
    }
    setExpirationTime() {
      return this;
    }
    sign() {
      return Promise.resolve("mock-jwt-token");
    }
  },
  jwtVerify: vi.fn((_token: string) => {
    if (_token === "mock-jwt-token" && lastSignedPayload) {
      return Promise.resolve({ payload: lastSignedPayload });
    }
    return Promise.reject(new Error("invalid"));
  }),
}));

import {
  getCookieName,
  getSessionCookieOptions,
  createSession,
  getSessionPayload,
  verifySession,
} from "./auth";

const VALID_SECRET = "a".repeat(32);

describe("lib/auth", () => {
  const origEnv = process.env;

  beforeAll(() => {
    process.env.AUTH_SECRET = VALID_SECRET;
  });

  beforeEach(() => {
    process.env.AUTH_SECRET = VALID_SECRET;
  });

  afterEach(() => {
    process.env = origEnv;
  });

  describe("getCookieName", () => {
    it("returns 'session'", () => {
      expect(getCookieName()).toBe("session");
    });
  });

  describe("getSessionCookieOptions", () => {
    it("returns secure: true in production", () => {
      const opts = getSessionCookieOptions(true);
      expect(opts.secure).toBe(true);
      expect(opts.httpOnly).toBe(true);
      expect(opts.sameSite).toBe("lax");
      expect(opts.path).toBe("/");
      expect(opts.maxAge).toBe(7 * 24 * 60 * 60);
    });

    it("returns secure: false when not production", () => {
      const opts = getSessionCookieOptions(false);
      expect(opts.secure).toBe(false);
    });
  });

  describe("createSession and getSessionPayload", () => {
    it("round-trips userId", async () => {
      const userId = "user-uuid-123";
      const token = await createSession(userId);
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);

      const payload = await getSessionPayload(token);
      expect(payload).toEqual({ userId });
    });

    it("returns null for invalid token", async () => {
      const payload = await getSessionPayload("invalid.jwt.token");
      expect(payload).toBeNull();
    });

    it("returns null when AUTH_SECRET is too short", async () => {
      process.env.AUTH_SECRET = "short";
      const payload = await getSessionPayload("any-token");
      expect(payload).toBeNull();
    });
  });

  describe("verifySession", () => {
    it("returns true for valid token", async () => {
      const token = await createSession("user-1");
      expect(await verifySession(token)).toBe(true);
    });

    it("returns false for invalid token", async () => {
      expect(await verifySession("invalid")).toBe(false);
    });
  });
});
