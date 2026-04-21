-- Multi-user migration: run once on existing DB.
-- Creates users table, adds user_id to dolls, creates one legacy user and assigns all existing dolls to it.
-- Usage: psql $DATABASE_URL -f scripts/migrate-multi-user.sql

-- 1. Users table (no role; admin via ADMIN_SECRET)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Add user_id to dolls (nullable first)
ALTER TABLE dolls ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- 3. Create legacy user if none exist and backfill dolls
DO $$
DECLARE
  legacy_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users LIMIT 1) THEN
    INSERT INTO users (id, email, password_hash, name)
    VALUES (gen_random_uuid(), 'legacy@local', '', 'Legacy User')
    RETURNING id INTO legacy_id;
    UPDATE dolls SET user_id = legacy_id WHERE user_id IS NULL;
  END IF;
END $$;

-- 4. Set NOT NULL (safe after backfill)
ALTER TABLE dolls ALTER COLUMN user_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dolls_user_id ON dolls(user_id);
CREATE INDEX IF NOT EXISTS idx_dolls_user_created ON dolls(user_id, created_at DESC);
