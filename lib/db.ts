import { Pool } from "pg";
import bcrypt from "bcrypt";

let pool: Pool | null = null;

function getPool(): Pool {
  // Loaded from .env.local when running locally, or from Render Environment when deployed
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    const isDev = process.env.NODE_ENV === "development";
    throw new Error(
      isDev
        ? "DATABASE_URL is not set. Add it to .env.local (see .env.example)."
        : "DATABASE_URL is not set. Add it in your host's environment (e.g. Render, Neon, or your server)."
    );
  }
  if (!pool) {
    const useSsl =
      !connectionString.includes("localhost") &&
      !connectionString.includes("127.0.0.1");
    pool = new Pool({
      connectionString,
      ssl: useSsl ? { rejectUnauthorized: false } : false,
    });
  }
  return pool;
}

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ToyRow {
  id: string;
  user_id: string;
  name: string;
  line: string | null;
  factory: string | null;
  year: string | null;
  paint: string | null;
  rarity: string | null;
  notes: string | null;
  image_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function query<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const p = getPool();
  const client = await p.connect();
  try {
    const result = await client.query(text, params);
    return (result.rows as T[]) ?? [];
  } finally {
    client.release();
  }
}

export async function ensureSchema(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      email_verified BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false`).catch(() => {});
  await query(`UPDATE users SET email_verified = true WHERE email_verified IS NULL`).catch(() => {});
  await query(`ALTER TABLE users ALTER COLUMN email_verified SET DEFAULT false`).catch(() => {});
  await query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`).catch(() => {});

  await query(`
    CREATE TABLE IF NOT EXISTS auth_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      kind TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL
    )
  `);
  await query(`CREATE INDEX IF NOT EXISTS idx_auth_tokens_token_hash ON auth_tokens(token_hash)`).catch(() => {});
  await query(`CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires ON auth_tokens(expires_at)`).catch(() => {});

  await query(`
    CREATE TABLE IF NOT EXISTS toys (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      line TEXT,
      factory TEXT,
      year TEXT,
      paint TEXT,
      rarity TEXT,
      notes TEXT,
      image_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await query(`ALTER TABLE toys ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE`).catch(() => {});
  await query(`ALTER TABLE toys ADD COLUMN IF NOT EXISTS image_url TEXT`).catch(() => {});
  await query(`ALTER TABLE toys ADD COLUMN IF NOT EXISTS factory TEXT`).catch(() => {});
  await query(`ALTER TABLE toys ADD COLUMN IF NOT EXISTS paint TEXT`).catch(() => {});
  await query(`ALTER TABLE toys ADD COLUMN IF NOT EXISTS rarity TEXT`).catch(() => {});
  await query(`ALTER TABLE toys ALTER COLUMN year TYPE TEXT USING year::TEXT`).catch(() => {});

  const users = await query<{ id: string }>("SELECT id FROM users LIMIT 1");
  if (users.length === 0) {
    const legacyHash = await bcrypt.hash("legacy-cannot-login", 10);
    const inserted = await query<{ id: string }>(
      `INSERT INTO users (email, password_hash, name, email_verified) VALUES ($1, $2, $3, true) RETURNING id`,
      ["legacy@local", legacyHash, "Legacy User"]
    );
    const legacyId = inserted[0]?.id;
    if (legacyId) {
      await query("UPDATE toys SET user_id = $1 WHERE user_id IS NULL", [legacyId]);
    }
  } else {
    const legacyId = users[0].id;
    await query("UPDATE toys SET user_id = $1 WHERE user_id IS NULL", [legacyId]).catch(() => {});
  }
  await query(`ALTER TABLE toys ALTER COLUMN user_id SET NOT NULL`).catch(() => {});

  await query(`CREATE INDEX IF NOT EXISTS idx_toys_user_id ON toys(user_id)`).catch(() => {});
  await query(`CREATE INDEX IF NOT EXISTS idx_toys_user_created ON toys(user_id, created_at DESC)`).catch(() => {});
  await query(`CREATE INDEX IF NOT EXISTS idx_toys_line ON toys(line)`).catch(() => {});
  await query(`CREATE INDEX IF NOT EXISTS idx_toys_created_at ON toys(created_at DESC)`).catch(() => {});
}

export { getPool };
