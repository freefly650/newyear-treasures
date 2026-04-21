-- Fresh install: run once. For existing DB use scripts/migrate-multi-user.sql instead.
-- Example: psql $DATABASE_URL -f scripts/init-db.sql

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS dolls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  line TEXT,
  year INTEGER,
  condition TEXT,
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dolls_user_id ON dolls(user_id);
CREATE INDEX IF NOT EXISTS idx_dolls_user_created ON dolls(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dolls_line ON dolls(line);
CREATE INDEX IF NOT EXISTS idx_dolls_created_at ON dolls(created_at DESC);
