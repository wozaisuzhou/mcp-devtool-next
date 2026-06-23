CREATE TABLE IF NOT EXISTS feedback (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type         TEXT        NOT NULL DEFAULT 'bug',
  title        TEXT        NOT NULL,
  description  TEXT        NOT NULL,
  category     TEXT        NOT NULL DEFAULT 'other',
  severity     TEXT        NOT NULL DEFAULT 'medium',
  steps        TEXT,
  email        TEXT        NOT NULL,
  ip           TEXT,
  user_agent   TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS feedback_ip_submitted    ON feedback (ip, submitted_at);
CREATE INDEX IF NOT EXISTS feedback_email_submitted ON feedback (email, submitted_at);
