import { createHash, randomBytes } from "crypto";
import { query } from "@/lib/db";

const TOKEN_BYTES = 32;
const VERIFICATION_EXPIRY_HOURS = 24;
const PASSWORD_RESET_EXPIRY_HOURS = 1;

function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function generateToken(): string {
  return randomBytes(TOKEN_BYTES).toString("hex");
}

export async function createVerificationToken(userId: string): Promise<string> {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000);
  await query(
    `INSERT INTO auth_tokens (user_id, token_hash, kind, expires_at)
     VALUES ($1, $2, 'email_verification', $3)`,
    [userId, tokenHash, expiresAt]
  );
  return token;
}

export async function createPasswordResetToken(userId: string): Promise<string> {
  await query(
    `DELETE FROM auth_tokens WHERE user_id = $1 AND kind = 'password_reset'`,
    [userId]
  );
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY_HOURS * 60 * 60 * 1000);
  await query(
    `INSERT INTO auth_tokens (user_id, token_hash, kind, expires_at)
     VALUES ($1, $2, 'password_reset', $3)`,
    [userId, tokenHash, expiresAt]
  );
  return token;
}

export async function consumeVerificationToken(
  token: string
): Promise<string | null> {
  const tokenHash = hashToken(token);
  const rows = await query<{ user_id: string }>(
    `SELECT user_id FROM auth_tokens
     WHERE token_hash = $1 AND kind = 'email_verification' AND expires_at > NOW()`,
    [tokenHash]
  );
  if (rows.length === 0) return null;
  const userId = rows[0].user_id;
  await query(`DELETE FROM auth_tokens WHERE token_hash = $1`, [tokenHash]);
  return userId;
}

export async function consumePasswordResetToken(
  token: string
): Promise<string | null> {
  const tokenHash = hashToken(token);
  const rows = await query<{ user_id: string }>(
    `SELECT user_id FROM auth_tokens
     WHERE token_hash = $1 AND kind = 'password_reset' AND expires_at > NOW()`,
    [tokenHash]
  );
  if (rows.length === 0) return null;
  const userId = rows[0].user_id;
  await query(`DELETE FROM auth_tokens WHERE token_hash = $1`, [tokenHash]);
  return userId;
}
