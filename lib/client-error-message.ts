/**
 * Build a safe error string for JSON API responses.
 * Cloudinary (and some other SDKs) reject with plain objects `{ message, http_code }`
 * instead of `Error`, which made `instanceof Error` checks show a misleading "Database error".
 */
export function getClientErrorMessage(err: unknown, fallback = "Something went wrong"): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string" && err.length > 0) return err;
  if (err && typeof err === "object") {
    const o = err as Record<string, unknown>;
    if (typeof o.message === "string" && o.message.length > 0) return o.message;
    if (typeof o.error === "string" && o.error.length > 0) return o.error;
    const nested = o.error;
    if (nested && typeof nested === "object") {
      const m = (nested as Record<string, unknown>).message;
      if (typeof m === "string" && m.length > 0) return m;
    }
  }
  return fallback;
}
