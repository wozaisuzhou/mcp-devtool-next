-- Migration 016: public MCP directory
ALTER TABLE saved_sessions
  ADD COLUMN IF NOT EXISTS is_public          BOOLEAN  NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS public_description TEXT;

CREATE INDEX IF NOT EXISTS saved_sessions_is_public_idx ON saved_sessions (is_public) WHERE is_public = true;
