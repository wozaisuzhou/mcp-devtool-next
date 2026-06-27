-- Migration 013: site visit tracking
CREATE TABLE IF NOT EXISTS site_visits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path        VARCHAR(2048) NOT NULL,
  visitor_id  VARCHAR(64)   NOT NULL,           -- anonymous UUID from localStorage
  user_email  VARCHAR(255)  DEFAULT NULL,        -- set if the visitor is signed in
  referrer    TEXT          DEFAULT NULL,
  user_agent  TEXT          DEFAULT NULL,
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS site_visits_created_at_idx ON site_visits (created_at DESC);
CREATE INDEX IF NOT EXISTS site_visits_path_idx       ON site_visits (path);
CREATE INDEX IF NOT EXISTS site_visits_visitor_id_idx ON site_visits (visitor_id);
