import { NextResponse } from "next/server";
import { isEmailConfigured } from "@/lib/email";

/**
 * GET /api/auth/config
 * Public. Returns whether email (Resend) is configured for verification and password reset.
 */
export async function GET() {
  return NextResponse.json({
    emailConfigured: isEmailConfigured(),
  });
}
