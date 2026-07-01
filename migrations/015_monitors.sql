-- Migration 015: MCP server monitors
CREATE TABLE IF NOT EXISTS monitors (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email      VARCHAR(255)  NOT NULL,
  session_id      UUID          NOT NULL,
  interval_hours  INTEGER       NOT NULL DEFAULT 24,
  notify_email    BOOLEAN       NOT NULL DEFAULT true,
  webhook_url     TEXT,
  last_checked_at TIMESTAMP WITH TIME ZONE,
  last_status     VARCHAR(20),   -- 'ok' | 'changed' | 'error'
  last_diff       JSONB,         -- stored diff for the last check
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS monitors_user_email_idx  ON monitors (user_email);
CREATE INDEX IF NOT EXISTS monitors_session_id_idx  ON monitors (session_id);
