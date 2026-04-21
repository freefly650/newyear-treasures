import { describe, it, expect } from "vitest";
import { generateToken } from "./auth-tokens";

describe("generateToken", () => {
  it("returns a 64-character hex string (32 bytes)", () => {
    const token = generateToken();
    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[0-9a-f]+$/);
  });

  it("returns different values on each call", () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).not.toBe(b);
  });
});
