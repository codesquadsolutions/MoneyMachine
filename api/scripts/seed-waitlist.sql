-- Flipur waitlist seed (copied from Firestore; safe to re-run)
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

INSERT INTO waitlist (id, email, display_name, photo_url, platform, status, source, firebase_uid, created_at, updated_at)
VALUES
  ('ABypaP28wUPDSqFOFKs45cCJGON2', 'markdouglas3101@gmail.com', 'Mark Douglas', 'https://lh3.googleusercontent.com/a/ACg8ocLgJ5L93QWWUF3nDWtm8HJ1E0WwFrUFTJ0ifyrD42aEIqjWXA=s96-c', 'both', 'waiting', 'website', 'ABypaP28wUPDSqFOFKs45cCJGON2', '2026-10-31 17:37:15.546+00', '2026-10-31 17:37:15.546+00'),
  ('MP2cAnRhXPOtjkE0cPiLPaGu0oF3', 'pavankumardot37@gmail.com', 'Pavan Kumar', 'https://lh3.googleusercontent.com/a/ACg8ocLCkRKUC1JWTKp6CJCgZxoKm7w5BI4XEnTmA4CIlrlROcR5S3u2=s96-c', 'topstepx', 'waiting', 'website', 'MP2cAnRhXPOtjkE0cPiLPaGu0oF3', '2026-10-30 19:43:55.024+00', '2026-10-30 19:43:55.024+00'),
  ('O9vCzDpyGaQiZYcvQdgpkP0zgQX2', 'cngsharath@gmail.com', 'Sharath H G', 'https://lh3.googleusercontent.com/a/ACg8ocL1ncRlHahZgCcNYIA6PIpgPeQpI-vm1G9LIbnQbElXcaqRxn3ZrQ=s96-c', 'tradingview', 'waiting', 'website', 'O9vCzDpyGaQiZYcvQdgpkP0zgQX2', '2026-10-30 20:28:56.352+00', '2026-10-30 20:28:56.352+00'),
  ('sqmlrzGEC5bbsTlXqNwSHqQVw5H3', 'jimmyfabis24@gmail.com', 'Jim Fabis', '', 'topstepx', 'waiting', 'website', 'sqmlrzGEC5bbsTlXqNwSHqQVw5H3', '2026-11-08 01:33:00.377+00', '2026-11-08 01:33:00.377+00')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  display_name = EXCLUDED.display_name,
  platform = EXCLUDED.platform,
  status = EXCLUDED.status,
  updated_at = NOW();

INSERT INTO crm_leads (id, name, email, source, type, stage, waitlist_id, platform, first_touch_at, last_touch_at, stage_updated_at, created_at, updated_at)
SELECT id, display_name, email, 'website', 'customer', 'new', id, platform, created_at, created_at, created_at, created_at, created_at
FROM waitlist
WHERE id IN (
  'ABypaP28wUPDSqFOFKs45cCJGON2',
  'MP2cAnRhXPOtjkE0cPiLPaGu0oF3',
  'O9vCzDpyGaQiZYcvQdgpkP0zgQX2',
  'sqmlrzGEC5bbsTlXqNwSHqQVw5H3'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  waitlist_id = EXCLUDED.waitlist_id,
  platform = EXCLUDED.platform,
  updated_at = NOW();

SELECT email, display_name, platform FROM waitlist ORDER BY created_at;
