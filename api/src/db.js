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

    CREATE TABLE IF NOT EXISTS waitlist (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      display_name TEXT NOT NULL DEFAULT '',
      photo_url TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      platform TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'waiting',
      source TEXT NOT NULL DEFAULT 'website',
      utm_source TEXT NOT NULL DEFAULT '',
      utm_medium TEXT NOT NULL DEFAULT '',
      utm_campaign TEXT NOT NULL DEFAULT '',
      fbclid TEXT NOT NULL DEFAULT '',
      firebase_uid TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS waitlist_email_uidx ON waitlist (LOWER(email));
    CREATE INDEX IF NOT EXISTS waitlist_status_idx ON waitlist (status);
    CREATE INDEX IF NOT EXISTS waitlist_created_idx ON waitlist (created_at DESC);

    CREATE TABLE IF NOT EXISTS crm_leads (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      source TEXT NOT NULL DEFAULT 'website',
      type TEXT NOT NULL DEFAULT 'customer',
      stage TEXT NOT NULL DEFAULT 'new',
      utm_source TEXT NOT NULL DEFAULT '',
      utm_medium TEXT NOT NULL DEFAULT '',
      utm_campaign TEXT NOT NULL DEFAULT '',
      fbclid TEXT NOT NULL DEFAULT '',
      call_status TEXT NOT NULL DEFAULT 'none',
      last_call_at TIMESTAMPTZ,
      preferred_language TEXT NOT NULL DEFAULT '',
      waitlist_id TEXT NOT NULL DEFAULT '',
      affiliate_lead_id TEXT NOT NULL DEFAULT '',
      affiliate_id TEXT NOT NULL DEFAULT '',
      chat_session_id TEXT NOT NULL DEFAULT '',
      platform TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT '',
      first_touch_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_touch_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      stage_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      next_action_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS crm_leads_email_idx ON crm_leads (LOWER(email));
    CREATE INDEX IF NOT EXISTS crm_leads_phone_idx ON crm_leads (phone);
    CREATE INDEX IF NOT EXISTS crm_leads_stage_idx ON crm_leads (stage);
    CREATE INDEX IF NOT EXISTS crm_leads_source_idx ON crm_leads (source);
    CREATE INDEX IF NOT EXISTS crm_leads_last_touch_idx ON crm_leads (last_touch_at DESC);

    CREATE TABLE IF NOT EXISTS crm_activities (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
      type TEXT NOT NULL DEFAULT 'note',
      text TEXT NOT NULL DEFAULT '',
      meta_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS crm_activities_lead_idx ON crm_activities (lead_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS crm_campaigns (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      channel TEXT NOT NULL DEFAULT 'meta',
      utm_source TEXT NOT NULL DEFAULT '',
      utm_medium TEXT NOT NULL DEFAULT '',
      utm_campaign TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}
