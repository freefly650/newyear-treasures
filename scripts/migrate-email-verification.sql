-- Email verification and password reset. Run after multi-user migration if needed.
-- Usage: psql $DATABASE_URL -f scripts/migrate-email-verification.sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT true;
UPDATE users SET email_verified = true WHERE email_verified IS NULL;

CREATE TABLE IF NOT EXISTS auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  kind TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_token_hash ON auth_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires ON auth_tokens(expires_at);
