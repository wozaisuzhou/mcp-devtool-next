-- Migration 002: saved_sessions for regression testing
--
-- Each row is a complete snapshot of one MCP connection:
-- server info, all discovered capabilities, and every tool call made.
-- Two rows with the same server_url can be diffed for regression.
--
-- Supabase-compatible: swap DATABASE_URL to the Supabase connection string.

CREATE TABLE IF NOT EXISTS saved_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Owner — email only for now; swap for auth.users.id once auth is wired up
  user_email    VARCHAR(255),

  -- Human-readable labels
  name          VARCHAR(255) NOT NULL,
  label         VARCHAR(100),          -- e.g. "baseline", "v2.1", "post-migration"

  -- MCP server snapshot
  server_url       VARCHAR(2048),
  server_name      VARCHAR(255),
  server_version   VARCHAR(100),
  protocol_version VARCHAR(50),
  transport        VARCHAR(50),

  -- Capability snapshots (full JSON from listTools / listResources / listPrompts)
  tools         JSONB       NOT NULL DEFAULT '[]',
  resources     JSONB       NOT NULL DEFAULT '[]',
  prompts       JSONB       NOT NULL DEFAULT '[]',

  -- Tool-call traces recorded during the session
  traces        JSONB       NOT NULL DEFAULT '[]',

  -- Denormalized counts for cheap list queries
  tool_count    INTEGER     NOT NULL DEFAULT 0,
  resource_count INTEGER    NOT NULL DEFAULT 0,
  prompt_count  INTEGER     NOT NULL DEFAULT 0,
  trace_count   INTEGER     NOT NULL DEFAULT 0,

  saved_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_saved_sessions_user_email ON saved_sessions(user_email);
CREATE INDEX IF NOT EXISTS idx_saved_sessions_server_url ON saved_sessions(server_url);
CREATE INDEX IF NOT EXISTS idx_saved_sessions_saved_at   ON saved_sessions(saved_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_sessions_label      ON saved_sessions(label);
