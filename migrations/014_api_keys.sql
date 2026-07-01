-- Migration 014: API keys for CI/CD integration
CREATE TABLE IF NOT EXISTS api_keys (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email    VARCHAR(255)  NOT NULL,
  key_hash      VARCHAR(64)   NOT NULL UNIQUE,   -- SHA-256 of the raw key
  name          VARCHAR(255)  NOT NULL DEFAULT 'Default',
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_used_at  TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS api_keys_user_email_idx ON api_keys (user_email);
CREATE INDEX IF NOT EXISTS api_keys_key_hash_idx   ON api_keys (key_hash);
