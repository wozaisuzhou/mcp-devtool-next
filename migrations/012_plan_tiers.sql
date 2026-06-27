-- Migration 012: expand plan tiers and add enterprise_limits
-- Replaces the old 'free'/'paid' two-tier system with free/silver/gold/enterprise.

-- Rename any existing 'paid' rows to 'silver' to preserve access
UPDATE registered_users SET plan = 'silver' WHERE plan = 'paid';

-- Widen the column to accommodate new tier names (if a CHECK constraint exists, drop and re-add)
ALTER TABLE registered_users
  ALTER COLUMN plan SET DEFAULT 'free',
  ALTER COLUMN plan TYPE VARCHAR(20);

-- Optional: store custom per-user limits for enterprise accounts
ALTER TABLE registered_users
  ADD COLUMN IF NOT EXISTS enterprise_limits JSONB DEFAULT NULL;
