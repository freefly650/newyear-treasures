import { describe, expect, it } from "vitest";
import { getClientErrorMessage } from "./client-error-message";

describe("getClientErrorMessage", () => {
  it("reads Error.message", () => {
    expect(getClientErrorMessage(new Error("pg fail"), "fallback")).toBe("pg fail");
  });

  it("reads Cloudinary-style plain object rejections", () => {
    expect(
      getClientErrorMessage({ message: "Invalid api_key", http_code: 401 }, "fallback")
    ).toBe("Invalid api_key");
  });

  it("uses fallback for unknown shapes", () => {
    expect(getClientErrorMessage(null, "fallback")).toBe("fallback");
    expect(getClientErrorMessage(42, "fallback")).toBe("fallback");
  });
});
