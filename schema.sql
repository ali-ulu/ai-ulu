-- D1 schema for ai-ulu.com contact leads.
-- Apply once:
--   npx wrangler d1 execute ai-ulu-leads --remote --file=schema.sql

CREATE TABLE IF NOT EXISTS leads (
  id                  TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  reach               TEXT NOT NULL,
  project_type        TEXT NOT NULL DEFAULT 'unsure',
  budget              TEXT NOT NULL DEFAULT '',
  msg                 TEXT NOT NULL DEFAULT '',
  utm_source          TEXT NOT NULL DEFAULT '',
  utm_campaign        TEXT NOT NULL DEFAULT '',
  ip                  TEXT NOT NULL,
  user_agent          TEXT NOT NULL DEFAULT '',
  page                TEXT NOT NULL DEFAULT '',
  notification_status TEXT NOT NULL DEFAULT 'pending',
  created_at          TEXT NOT NULL
);

-- Existing databases predate budget/utm_*. CREATE TABLE IF NOT EXISTS will not
-- add them, so run these once against an already-created database:
--   ALTER TABLE leads ADD COLUMN budget TEXT NOT NULL DEFAULT '';
--   ALTER TABLE leads ADD COLUMN utm_source TEXT NOT NULL DEFAULT '';
--   ALTER TABLE leads ADD COLUMN utm_campaign TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_leads_created_at
  ON leads(created_at DESC);

-- One row per IP; the Worker uses an atomic UPSERT so concurrent
-- submissions cannot bypass the per-IP window counter.
CREATE TABLE IF NOT EXISTS rate_limits (
  ip                TEXT PRIMARY KEY,
  window_started_at INTEGER NOT NULL,
  submissions       INTEGER NOT NULL,
  updated_at        INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_updated_at
  ON rate_limits(updated_at);

-- Page views. No cookie and no identifier: a row is (day, path, referrer host,
-- country). That is enough to answer "how many people come and where from"
-- without tracking anyone across requests.
CREATE TABLE IF NOT EXISTS hits (
  day           TEXT NOT NULL,
  path          TEXT NOT NULL,
  referrer_host TEXT NOT NULL DEFAULT '',
  country       TEXT NOT NULL DEFAULT '',
  views         INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, path, referrer_host, country)
);

CREATE INDEX IF NOT EXISTS idx_hits_day
  ON hits(day DESC);
