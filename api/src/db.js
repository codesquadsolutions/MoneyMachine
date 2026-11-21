import pg from "pg";
import crypto from "node:crypto";

const { Pool } = pg;

let pool;

export function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set. Add your Postgres connection string to api/.env");
    }
    pool = new Pool({
      connectionString,
      ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}

export async function query(text, params = []) {
  return getPool().query(text, params);
}

export function newId() {
  return crypto.randomUUID();
}

export async function migrate() {
  await query(`
    CREATE TABLE IF NOT EXISTS affiliate_leads (
      id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      email TEXT NOT NULL,
      instagram TEXT NOT NULL DEFAULT '',
      youtube TEXT NOT NULL DEFAULT '',
      snapchat TEXT NOT NULL DEFAULT '',
      linkedin TEXT NOT NULL DEFAULT '',
      discord TEXT NOT NULL DEFAULT '',
      telegram TEXT NOT NULL DEFAULT '',
      website TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'new',
      admin_note TEXT NOT NULL DEFAULT '',
      affiliate_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS affiliate_leads_email_idx ON affiliate_leads (email);
    CREATE INDEX IF NOT EXISTS affiliate_leads_status_idx ON affiliate_leads (status);

    CREATE TABLE IF NOT EXISTS affiliates (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      instagram TEXT NOT NULL DEFAULT '',
      youtube TEXT NOT NULL DEFAULT '',
      snapchat TEXT NOT NULL DEFAULT '',
      linkedin TEXT NOT NULL DEFAULT '',
      discord TEXT NOT NULL DEFAULT '',
      telegram TEXT NOT NULL DEFAULT '',
      website TEXT NOT NULL DEFAULT '',
      social_handles TEXT NOT NULL DEFAULT '',
      payout_info TEXT NOT NULL DEFAULT '',
      coupon_code TEXT NOT NULL UNIQUE,
      commission_rate_bps INTEGER NOT NULL DEFAULT 1500,
      status TEXT NOT NULL DEFAULT 'pending',
      lead_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      approved_at TIMESTAMPTZ
    );

    CREATE INDEX IF NOT EXISTS affiliates_status_idx ON affiliates (status);

    CREATE TABLE IF NOT EXISTS affiliate_codes (
      code TEXT PRIMARY KEY,
      affiliate_id TEXT NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
      active BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS affiliate_conversions (
      id TEXT PRIMARY KEY,
      affiliate_id TEXT NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
      order_id TEXT NOT NULL,
      sale_amount_cents INTEGER NOT NULL DEFAULT 0,
      commission_amount_cents INTEGER NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'USD',
      coupon_code TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      event_type TEXT NOT NULL DEFAULT '',
      order_at TIMESTAMPTZ,
      paid_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS affiliate_conversions_affiliate_idx ON affiliate_conversions (affiliate_id);
    CREATE INDEX IF NOT EXISTS affiliate_conversions_status_idx ON affiliate_conversions (status);

    CREATE TABLE IF NOT EXISTS affiliate_tickets (
      id TEXT PRIMARY KEY,
      affiliate_id TEXT NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
      affiliate_name TEXT NOT NULL DEFAULT '',
      affiliate_email TEXT NOT NULL DEFAULT '',
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      admin_reply TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS webhook_dedup (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL DEFAULT '',
      result_json JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}
